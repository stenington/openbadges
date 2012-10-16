var client = require('../lib/mysql').client;

var Base = function () { };

Base.apply = function apply(Model, table) {
  Model.fromDbResult = function fromDbResult(attributes) {
    if (attributes === undefined) return null;

    Object.keys(attributes).forEach(function (key) {
      var prep = (Model.prepare || {})['out'] || {};
      if (key in prep) {
        attributes[key] = Model.prepare.out[key](attributes[key]);
      }
    });

    return new Model(attributes);
  };

  Model.findAll = function findAll(callback) {
    client.query('SELECT * FROM ' + table, function (err, results) {
      if (err) callback(err);
      else callback(null, results.map(Model.fromDbResult));
    });
  };

  Model.find = function find(criteria, callback) {
    var finders = Model.finders || {};
    var keys = Object.keys(criteria);    
    var firstKey = keys[0];
    var values = keys.map(function (key) { return criteria[key] });
    var qstring = 'SELECT * FROM `' + table + '` WHERE ' + keys.map(function (key) { return (key + ' = ?')}).join(' AND ');

    function parseResults(err, results) {
      if (err) callback(err);
      else callback(null, results.map(Model.fromDbResult));
    }

    if (keys.length == 1 && firstKey in finders) {
      return Model.finders[firstKey](criteria[firstKey], parseResults);
    }    
    client.query(qstring, values, parseResults);
  };

  Model.findOne = function (criteria, callback) {    
    Model.find(criteria, function (err, results) {
      if (err) callback(err);
      callback(null, results.pop());
    });
  };

  Model.findById = function (id, callback) {
    Model.findOne({id: id}, callback);
  };

  Model.prototype = new Base();
  Model.prototype.model = Model;
  Model.prototype.client = client;
  Model.prototype.getTableName = function () { return table };
  Model.prototype.set = function (key, value) { this.attributes[key] = value; return this; };
  Model.prototype.get = function (key) { return this.attributes[key]; };
};

Base.prototype.validate = function validate(attributes) {
  var err = new Error('Invalid attribute data');
  var validators = this.model.validators || {};
  attributes = (attributes || this.attributes);
  err.fields = {};
  
  Object.keys(validators).forEach(function (field) {
    var msg = validators[field](attributes[field], attributes);
    if (msg) { err.fields[field] = msg; }
  });
  
  if (Object.keys(err.fields).length > 0) {
    return err;
  }
};

Base.prototype.save = function save(callback) {
  var attributes = this.attributes;
  var table = this.getTableName();
  var err = this.validate(attributes);
  var model = this.model;
  var prepMethods = (model.prepare || {})['in'] || {};

  function parseResult(err, result) {
    if (err) { return callback(err, null); }
    if (!attributes.id && result.insertId)
      attributes.id = result.insertId;
    return callback(null, this);
  }

  callback = callback || function () {};
  if (err) { return callback(err, null); }

  Object.keys(attributes).forEach(function (key) {
    var prep = prepMethods[key];
    if (prep) attributes[key] = prep(attributes[key], attributes);
  });

  if ('function' === typeof this.presave)
    this.presave();
  client._upsert(table, attributes, parseResult.bind(this));
};

Base.prototype.destroy = function (callback) {
  var self = this;
  var attributes = this.attributes;
  var table = this.getTableName();
  var querySQL = 'DELETE FROM `' + table + '` WHERE `id` = ? LIMIT 1';

  callback = callback || function () {};

  client.query(querySQL, [attributes.id], function (err, resp) {
    if (err) { return callback(err); }
    delete attributes.id;
    return callback(null, self);
  });
};

module.exports = Base;