var mysql = require('mysql');
var conf = require('../lib/configuration').get('database');
var client = mysql.createClient(conf);
var testDb = "`test_" + conf.database + "`";

var encoding = 'utf8';
var schemas = require('../models/mysql-schemas');

var migrate = require('migrate');
migrate(__dirname + "/../migrations/.migrate");
migrate().load(function(err, json) {
  console.log(err, json);
});

exports.createTables = function () {
  schemas.forEach(function (schema) {
    client.query(schema);
  });
};

exports.useTestDatabase = function () {
  client.query("CREATE DATABASE IF NOT EXISTS " + testDb + " CHARACTER SET '" + encoding + "'", function(err) {
    client.query("USE " + testDb);
  });  
};

exports.dropTestDatabase = function () {
  client.query("DROP DATABASE IF EXISTS " + testDb);
};

exports.prepareTesting = function () {
  exports.dropTestDatabase();
  exports.useTestDatabase();
  exports.createTables();
};

exports.client = client;

exports.createTables();