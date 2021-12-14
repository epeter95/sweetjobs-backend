var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var favicon = require('serve-favicon');
var dotenv = require("dotenv");
var fileUpload = require('express-fileupload');
dotenv.config();

//--------route declarations------//
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var pagePlacesRouter = require('./routes/page_places');
var publicContentsRouter = require('./routes/public_contents');
var publicContentTranslationsRouter = require('./routes/public_content_translations');
var languagesRouter = require('./routes/languages');
var rolesRouter = require('./routes/roles');
var languageTranslationsRouter = require('./routes/language_translations');
var authenticationRouter = require('./routes/authentication');
var roleTranslationsRouter = require('./routes/role_translations');
var generalMessagesRouter = require('./routes/general_messages');
var generalMessageTranslationsRouter = require('./routes/general_message_translations');
var errorMessagesRouter = require('./routes/error_messages');
var errorMessageTranslationsRouter = require('./routes/error_message_translations');
var categoryRouter = require('./routes/categories');
var categoryTranslationRouter = require('./routes/category_translations');
var profileRouter = require('./routes/profiles');
var jobRouter = require('./routes/jobs');
var jobTranslationRouter = require('./routes/job_translations');
var appliedUserStatusRouter = require('./routes/applied_user_statuses');
var appliedUserStatusTranslationRouter = require('./routes/applied_user_status_translations');
var contactRouter = require('./routes/contacts');
var usersAppliedToJobsRouter = require('./routes/applied_users');
var eventsRouter = require('./routes/events');
//--------------------------------//
//app init, szükséges külső alkalmazások használata
var app = express();

var cors = require('cors');
app.use(cors());
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//statikus fájlok hostolása
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// //--------routes------------//
app.use('/api/pagePlaces', pagePlacesRouter);
app.use('/api/users', usersRouter);
app.use('/api/publicContents', publicContentsRouter);
app.use('/api/publicContentTranslations', publicContentTranslationsRouter);
app.use('/api/languages', languagesRouter);
app.use('/api/languageTranslations', languageTranslationsRouter);
app.use('/api/auth', authenticationRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/roleTranslations', roleTranslationsRouter);
app.use('/api/errorMessages', errorMessagesRouter);
app.use('/api/errorMessageTranslations', errorMessageTranslationsRouter);
app.use('/api/generalMessages', generalMessagesRouter);
app.use('/api/generalMessageTranslations', generalMessageTranslationsRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/categoryTranslations', categoryTranslationRouter);
app.use('/api/profiles', profileRouter);
app.use('/api/jobs', jobRouter);
app.use('/api/jobTranslations', jobTranslationRouter);
app.use('/api/contacts', contactRouter);
app.use('/api/appliedUserStatuses', appliedUserStatusRouter);
app.use('/api/appliedUserStatusTranslations', appliedUserStatusTranslationRouter);
app.use('/api/usersAppliedToJobs', usersAppliedToJobsRouter);
app.use('/api/events', eventsRouter);
// //---------------------------//

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
