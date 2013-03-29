const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const nunjucks = require('nunjucks');
const middleware = require('../../middleware');
const setup = require('./setup');

const app = express();

app.locals({
  error: [],
  success: [],
});

const appViews = path.join(__dirname, '../../views');
const testViews = path.join(__dirname, 'views');
const env = new nunjucks.Environment([
  new nunjucks.FileSystemLoader(appViews),
  new nunjucks.FileSystemLoader(testViews)
]);
env.express(app);

app.use(middleware.less());
app.use(express.static(path.join(__dirname, "../../static")));

app.param('setup', function(req, res, next, id) {
  if (!setup[id]) 
    next(new Error('setup method ' + id + '() not defined'));
  req.data = setup[id]();
  next();
});

app.get('/', function(req, res, next) {
  var realTestViews = fs.readdirSync(testViews);
  realTestViews.splice(realTestViews.indexOf('index.html'), 1);
  var setups = Object.keys(setup).map(function(key){
    return {
      name: key,
      description: setup[key]['description'] || ''
    };
  });
  res.render('index.html', {
    setups: setups,
    testViews: realTestViews,
    appViews: fs.readdirSync(appViews)
  });
});

function renderTemplate(req, res, next) {
  var data = req.data || {};
  var view = req.params.view;
  app.render(view, data, function(err, html) {
    if (err) next(err);
    res.send(html);
  });
}

app.get('/:setup/:view', renderTemplate);
app.get('/:view', renderTemplate);

var server = http.createServer(app);
if (!module.parent) {
  var port = process.env.PORT || 0;
  server.listen(port, function() {
    console.log('Listening on ', server.address().port);
  });
} else {
  module.exports = server;
}
