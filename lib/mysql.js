var mysql = require('mysql');
var conf = require('../lib/configuration').get('database');
var client = mysql.createClient(conf);

exports.client = client;