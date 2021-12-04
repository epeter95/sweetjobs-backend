const express = require('express');
const router = express.Router();
const { Event, User, Job, JobTranslation, Profile } = require('../db/models');
const JWTManager = require('../middlewares/jwt_manager');
const Mailer = require('../classes/mailer');

router.get('/public/getEventsByToken', async (req, res) => {
    try {
        const email = JWTManager.getEmailByToken(req.headers['authorization']);
        if (email == 'forbidden') {
            return res.sendStatus(403);
        }
        const user = await User.findOne({ where: { email: email } });
        const data = await Event.findAll({ include: [{ model: User, attributes: ['id', 'firstName', 'lastName'], include: Profile }, { model: Job, include: JobTranslation }], where: { ownerId: user.id } });
        return res.send(data);
    } catch (error) {
        console.log(error);
        return res.send({ error: error.name });
    }
});


router.get('/public/getUserIdByToken', async (req, res) => {
    try {
        const email = JWTManager.getEmailByToken(req.headers['authorization']);
        if (email == 'forbidden') {
            return res.sendStatus(403);
        }
        const user = await User.findOne({ where: { email: email } });
        return res.send({ userId: user.id });
    } catch (error) {
        console.log(error);
        return res.send({ error: error.name });
    }
});

router.get('/public/getEventByToken/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        const email = JWTManager.getEmailByToken(req.headers['authorization']);
        if (email == 'forbidden') {
            return res.sendStatus(403);
        }
        const user = await User.findOne({ where: { email: email } });
        const data = await Event.findOne({ include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email'] }], where: { link: eventId } });
        return res.send(data);
    } catch (error) {
        console.log(error);
        return res.send({ error: error.name });
    }
});

router.post('/public/sendLinkToUsers', async (req, res) => {
    try {
        const { eventId, pwdId, users } = req.body;
        const email = JWTManager.getEmailByToken(req.headers['authorization']);
        if (email == 'forbidden') {
            return res.sendStatus(403);
        }
        const event = await Event.findOne({ where: { id: eventId } });
        let date = new Date();
        const responseDate = event.startDate.getFullYear() + '.' + (event.startDate.getMonth() + 1) + '.' + event.startDate.getDay() + '. ' + event.startDate.getHours() + ':' + event.startDate.getMinutes();
        for (let i = 0; i < users.length; ++i) {
            const userRow = await User.findOne({ where: { id: users[i] } });
            const message = 'Tisztelt ' + userRow.lastName + ' ' + userRow.firstName + '. Ezúton értesítjük, hogy ' + responseDate + ' időpontra megszervezett esemény elkezdődött.<br> Az eseményre való csatlakozáshoz az előző levélben szereplő linken az alábbi kulcsot kell beilleszteni: ' + pwdId;
            await Mailer.sendMail(email, userRow.email, 'Esemény (' + event.link + ') indulás', message, [], '');
        }
        return res.send({ ok: 'siker' });
    } catch (error) {
        console.log(error);
        return res.send({ error: error.name });
    }
});

router.post('/public/createEvent', async (req, res) => {
    try {
        const { jobId, users, startDate } = req.body;
        const email = JWTManager.getEmailByToken(req.headers['authorization']);
        if (email == 'forbidden') {
            return res.sendStatus(403);
        }
        console.log({ jobId, users });
        const owner = await User.findOne({ where: { email: email } });
        const date = new Date();
        const link = 'esemeny' + date.getTime();
        const data = await Event.create({ jobId, ownerId: owner.id, link, startDate });
        await data.setUsers([]);
        for (let i = 0; i < users.length; ++i) {
            const userRow = await User.findOne({ where: { id: users[i] } });
            const message = 'Tisztelt ' + userRow.lastName + ' ' + userRow.firstName + '. Ezúton értesítjük, hogy ' + startDate + ' időpontban esemény meghívást kapott. Amint elindult a videóhívás, emailben értesítjük a szükséges további teendőkről. Az esemény a következő címen lesz elérhető: <br> https://sweetjobs.herokuapp.com/video-esemeny/' + link
            await Mailer.sendMail(email, userRow.email, 'Esemény (' + link + ')re való meghívás', message, [], '');
            await data.addUser(userRow);
        }
        return res.send({ ok: 'siker' });
    } catch (error) {
        console.log(error);
        return res.send({ error: error.name });
    }
});

router.delete('/public/delete/:id', async (req, res) => {
    const paramId = req.params.id;
    try {
        const email = JWTManager.getEmailByToken(req.headers['authorization']);
        if (email == 'forbidden') {
            return res.sendStatus(403);
        }
        const data = await Event.destroy({
            where: { id: paramId }
        });
    } catch (error) {
        console.log(error);
        return res.send({ error: error.name });
    }
    return res.send({ ok: 'siker' });
});

router.get('/', JWTManager.verifyAdminUser, async (req, res) => {
    try {
        const data = await Event.findAll({ include: [{model: User, attributes: ['id', 'email']}, Job], raw: true, nest: true});
        let result = [];
        for(let i=0;i<data.length;++i){
            let owner = await User.findOne({where: {id: data[i].ownerId}, attributes: ['id', 'email']});
            result.push(data[i]);
            result[i]['userId'] = data[i].Users.id;
            result[i]['Owner'] = owner;
        }
        return res.send(result);
    } catch (error) {
        console.log(error);
        return res.send({ error: error.name });
    }
});

router.get('/:id', JWTManager.verifyAdminUser, async (req, res) => {
    const paramId = req.params.id;
    try {
        let data;
        if (paramId) {
            data = await Event.findOne({where: {id: paramId}, include: [{model: User, attributes: ['id', 'email']}, Job], raw: true, nest: true});
            let owner = await User.findOne({where: {id: data.ownerId}, attributes: ['id', 'email']});
            data['Owner'] = owner;
            data['userId'] = data.Users.id;
        }
        return res.send(data);
    } catch (error) {
        console.log(error);
        return res.send({ error: error.name });
    }
});

router.post('/', JWTManager.verifyAdminUser, async (req, res) => {
    try {
        const { jobId, ownerId, userId, startDate } = req.body;
        const date = new Date();
        const link = 'esemeny' + date.getTime();
        const data = await Event.create({ jobId, ownerId, link, startDate });
        await data.setUsers([]);
        const userRow = await User.findOne({ where: { id: userId } });
        await data.addUser(userRow);
        return res.send({ ok: 'siker' });
    } catch (error) {
        console.log(error);
        return res.send({ error: error.name });
    }
});

router.put('/:id', JWTManager.verifyAdminUser, async (req, res) => {
    const paramId = req.params.id;
    try {
        const { jobId, ownerId, userId, startDate } = req.body;
        const data = await Event.update({ jobId, ownerId, startDate }, { where: { id: paramId } });
        const eventRow = await Event.findOne({where: {id: paramId}});
        await eventRow.setUsers([]);
        const userRow = await User.findOne({ where: { id: userId } });
        await eventRow.addUser(userRow);
        return res.send({ ok: 'siker' });
    } catch (error) {
        console.log(error);
        return res.send({ error: error.name });
    }
});

router.delete('/:id', JWTManager.verifyAdminUser, async (req, res) => {
    const paramId = req.params.id;
    try {
        const data = await Event.destroy({
            where: { id: paramId }
        });
    } catch (error) {
        console.log(error);
        return res.send({ error: error.name });
    }
    return res.send({ ok: 'siker' });
});

module.exports = router;