//var dbm = require('db-migrate');
//var type = dbm.dataType;
var _ = require("lodash");
var schemas = require("../models/mysql-schemas");

exports.up = function(db, callback) {
  var pending = _.size(schemas);
  _.forEach(schemas, function(schema) {
    db.all(schema, function(err, results) {
      -- pending;
      if(!pending) {
        callback();
      }
    });
  });
};

exports.down = function(db, callback) {
  var tables = Object.keys(schemas);
  tables.reverse();
  var pending = tables.length;

  _.forEach(tables, function(name) {
    db.all("DROP TABLE `" + name + "`", function(err, results) {
      -- pending;
      if(!pending) {
        callback();
      }
    });
  });
};
