const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const _ = require('underscore');
const nunjucks = require('nunjucks');
const middleware = require('../../middleware');
const setup = require('./setup');

const app = express();

/* These should match what's in the main app.js */
app.locals({
  error: [],
  success: [],
});

/* Load both the main app views, and our test views (if any) */
const appViews = path.join(__dirname, '../../views');
const testViews = path.join(__dirname, 'views');
const env = new nunjucks.Environment([
  new nunjucks.FileSystemLoader(appViews),
  new nunjucks.FileSystemLoader(testViews)
]);
env.express(app);

/* Provide access to the same static resources */
app.use(middleware.less());
app.use(express.static(path.join(__dirname, "../../static")));

/* listDir: 
   Recursively list directories, relative to a base dir */
function listDir(dir, base) {
  base = base || dir;
  return fs.readdirSync(dir).reduce(function(prev, current) {
    var full = path.join(dir, current);
    if(fs.statSync(full).isDirectory()) {
      Array.prototype.push.apply(prev, listDir(full, base));
      return prev;
    }
    else {
      prev.push(path.relative(base, full));
      return prev;
    }
  }, []);
}

/* Render index.html */
app.get('/', function(req, res, next) {
  var realTestViews = listDir(testViews).filter(function(view){
    return view !== 'index.html'; 
  });
  var setups = Object.keys(setup).map(function(key){
    return {
      name: key,
      description: setup[key]['description'] || ''
    };
  });
  res.render('index.html', {
    setups: setups,
    testViews: realTestViews,
    appViews: listDir(appViews)
  });
});

/* App or test template rendering */
app.get(/\/(.+)/, function renderTemplate(req, res, next) {
  var view = req.params[0];
  console.log(view);
  var setups = req.query.setup;
  var data = {};
  if (setups) {
    if (!(setups instanceof Array)) setups = [setups];
    for (var i = 0; i < setups.length; i++) {
      if (setup[setups[i]])
        data = _.extend(data, setup[setups[i]]());  
      else
        next(new Error("Undefined setup method '" + setups[i] + "'"));
    }
  }
  app.render(view, data, function(err, html) {
    if (err) next(err);
    res.send(html);
  });
});


var server = http.createServer(app);
if (!module.parent) {
  var port = process.env.PORT || 0;
  server.listen(port, function() {
    console.log('Listening on ', server.address().port);
  });
} else {
  module.exports = server;
}
