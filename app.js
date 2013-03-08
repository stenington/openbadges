// Configure & start express.
var express = require('express');
var http = require('http');
var fs = require('fs');
var path = require('path');
var middleware = require('./middleware');
var logger = require('./lib/logging').logger;
var configuration = require('./lib/configuration');
var flash = require('connect-flash');
var nunjucks = require('nunjucks');
var less = require('less-middleware');
var habitat = require('habitat');

var app = express();
app.logger = logger;
app.config = configuration;

// View helpers. `user` and `badges` are set so we can use them in `if`
// statements without getting undefined errors and without having to use typeof
// checks.
app.locals({
  login: true,
  title: 'Backpack',
  error: [],
  success: [],
  badges: {},
});

// default view engine
var env = new nunjucks.Environment(new nunjucks.FileSystemLoader(__dirname + '/views'));
env.express(app);

env.addFilter('formatdate', function (rawDate) {
  if (parseInt(rawDate, 10) == rawDate) {
    var date = new Date(rawDate * 1000);
    return date.toString();
  }
  return rawDate;
});

env.addFilter('stringify', function (obj) {
  return JSON.stringify(obj);
});

// Middleware. Also see `middleware.js`
// ------------------------------------
var flags = (new habitat('enable_feature')).all();
app.use(middleware.featureFlags(flags));
app.use(less({
  src: path.join(__dirname, "static/less"),
  paths: [path.join(__dirname, "static/vendor/bootstrap/less")],
  dest: path.join(__dirname, "static/css"),
  prefix: '/css'
}));
app.use(express.static(path.join(__dirname, "static")));
app.use(express.static(path.join(configuration.get('var_dir'), "badges")));
app.use("/views", express.static(path.join(__dirname, "views")));
app.use(middleware.noFrame({ whitelist: [ '/issuer/frame.*', '/', '/share/.*' ] }));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.methodOverride());
app.use(middleware.logRequests());
app.use(middleware.cookieSessions());
app.use(middleware.userFromSession());
app.configure('development', function () {
  var testUser = process.env['OPENBADGES_TEST_USER'];
  if (testUser)
    app.use(middleware.testUser(testUser));
});
app.use(flash());
app.use(middleware.csrf({
  whitelist: [
    '/backpack/authenticate',
    '/issuer/validator/?',
    '/displayer/convert/.+',
    '/issuer/frameless.*',
    '/api/.+'
  ]
}));
app.use(middleware.cors({ whitelist: ['/_badges.*', '/issuer.*', '/baker', '/displayer/.+/group.*'] }));
app.use(app.router);
app.use(middleware.notFound());
app.configure('development', function () {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  var gitUtil = require('./lib/git-util');
  try {
    var sha = gitUtil.findSHA();
    app.set('sha', sha);
  }
  catch (ex) { 
    logger.warn(ex.message);
  }
});
app.configure('production', function () {
  app.use(express.errorHandler());
});


// Routes
// ------
const baker = require('./controllers/baker');
const badge = require('./controllers/badge');
const issuer = require('./controllers/issuer');
const displayer = require('./controllers/displayer');
const demo = require('./controllers/demo');
const backpack = require('./controllers/backpack');
const group = require('./controllers/group');
const share = require('./controllers/share');
const BackpackConnect = require('./controllers/backpack-connect');
const backpackConnect = new BackpackConnect({
  apiRoot: '/api',
  realm: 'openbadges'
});

// Parameter handlers
app.param('badgeId', badge.findById);
app.param('apiUserId', displayer.findUserById);
app.param('apiGroupId', displayer.findGroupById);
app.param('groupId', group.findById);
app.param('groupUrl', share.findGroupByUrl);
app.param('badgeUrl', badge.findByUrl);

app.get('/baker', baker.baker);
app.get('/issuer.js', issuer.generateScript);
app.get('/issuer/frame', issuer.frame);
app.post('/issuer/frameless', issuer.frameless);
app.get('/issuer/assertion', issuer.issuerBadgeAddFromAssertion);
app.post('/issuer/assertion', issuer.issuerBadgeAddFromAssertion);
app.get('/issuer/validator', issuer.validator);
app.post('/issuer/validator', issuer.validator);
app.get('/issuer/welcome', issuer.welcome);

app.get('/displayer/convert/email', displayer.emailToUserIdView);
app.post('/displayer/convert/email', displayer.emailToUserId);
app.get('/displayer/:apiUserId/groups.:format?', displayer.userGroups);
app.get('/displayer/:apiUserId/group/:apiGroupId.:format?', displayer.userGroupBadges);

app.get('/demo', demo.issuer);
app.get('/demo/ballertime', demo.massAward);
app.get('/demo/badge.json', demo.demoBadge);
app.get('/demo/invalid.json', demo.badBadge);
app.post('/demo/award', demo.award);

app.get('/', backpack.recentBadges);
app.get('/backpack', backpack.manage)
app.get('/backpack/badges', backpack.allBadges)
app.get('/backpack/login', backpack.login);
app.get('/backpack/signout', backpack.signout);
app.post('/backpack/badge', backpack.userBadgeUpload);
app.post('/backpack/authenticate', backpack.authenticate);
app.get('/backpack/settings', backpack.settings());
app.post('/backpack/settings/revoke-origin', backpackConnect.revokeOrigin());
app.get('/stats', backpack.stats);
app.get('/backpack/badge/:badgeId', backpack.details);
app.delete('/backpack/badge/:badgeId', backpack.deleteBadge);

app.delete('/badge/:badgeId', badge.destroy);

app.post('/group', group.create);
app.put('/group/:groupId', group.update);
app.delete('/group/:groupId', group.destroy);

app.post('/share/badge/:badgeId', badge.share);
app.get('/share/badge/:badgeUrl', badge.show);

app.get('/share/:groupUrl/edit', share.editor);
app.post('/share/:groupUrl', share.createOrUpdate);
app.put('/share/:groupUrl', share.createOrUpdate);
app.get('/share/:groupUrl', share.show);

app.get('/access', backpackConnect.requestAccess());
app.post('/accept', backpackConnect.allowAccess());

app.all('/api/*', backpackConnect.allowCors());
app.post('/api/token', backpackConnect.refresh());
app.post('/api/issue', backpackConnect.authorize("issue"),
                       issuer.issuerBadgeAddFromAssertion);

if (!module.parent) {
  var start_server = function start_server(app) {
    var port = app.config.get('port');
    var pid = process.pid.toString();
    var pidfile = path.join(app.config.get('var_path'), 'server.pid');

    app.listen(port);
    app.logger.info('environment: ' + process.env['NODE_ENV']);
    app.logger.info('opening server on port: ' + port);
    app.logger.info('READY PLAYER ONE');

    fs.unlink(pidfile, function () {
      fs.writeFile(pidfile, pid, function (err) {
        if (err) throw Error('could not make pidfile: ' + err);
      });
    });

    process.on('SIGTERM', function () {
      app.logger.info('recieved SIGTERM, exiting');
      process.exit();
    });
  };
  start_server(app);
} else {
  module.exports = http.createServer(app);
}
