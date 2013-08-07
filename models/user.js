var crypto = require('crypto');
var async = require('async');
var regex = require('../lib/regex');
var mysql = require('../lib/mysql');
var Base = require('./mysql-base');
var Badge = require('./badge');
var Group = require('./group');
var Portfolio = require('./portfolio');

var User = function (attributes) {
  this.attributes = attributes;
  this.setLoginDate = function () {
    this.set('last_login', Math.floor(Date.now() / 1000));
  };
};

Base.apply(User, 'user');

User.prototype.getAllBadges = function(callback) {
  Badge.find({email: this.get('email')}, function(err, badges) {
    if (!err && badges) {
      // There doesn't appear to be a way to do this at the SQL level :(
      badges.sort(function(a, b) {
        var aid = a.get('id'),
            bid = b.get('id');
        if (aid == bid) return 0;
        return bid - aid;
      });
    }

    callback(err, badges);
  });
}

User.prototype.getLatestBadges = function(count, callback) {
  if (typeof count == 'function') {
    callback = count;
    count = 7; // Yay for magic numbers!
  }

  this.getAllBadges(function(err, badges) {
    if (!err && badges) {
      // There doesn't appear to be a way to do this at the SQL level :(
      badges = badges.slice(0,count);
    }

    callback(err, badges);
  });
}

User.findOrCreate = function (email, callback) {
  var newUser = new User({ email: email });
  User.findOne({ email: email }, function (err, user) {
    if (err) { return callback(err); }
    if (user) { return callback(null, user); }
    else { return newUser.save(callback); }
  });
};

User.validators = {
  email: function (value) {
    if (!regex.email.test(value)) { return "invalid value for required field `email`"; }
  }
};

// callback has the signature (err, numberOfUsers)
User.totalCount = function (callback) {
  User.findAll(function(err, users) {
    if (err) {
      return callback(err, null);
    }
    return callback(null, users.length);
  })
};

User.deleteAccount = function (email, callback) {
  User.findOne({ email: email }, function (err, user) {
    if (err)
      return callback(err);
    if (!user)
      return callback();
    var user_id = user.attributes.id;
    async.auto({
      getGroups: function (callback, results) {
        Group.find({ user_id: user_id }, callback);
      },
      deletePortfolios: ['getGroups', function (callback, results) {
        var groups = results.getGroups;
        async.each(groups, function(group, callback) {
          var group_id = group.attributes.id;
          Portfolio.findAndDestroy({ group_id: group_id }, callback);
        }, callback);
      }],
      deleteGroups: ['deletePortfolios', function (callback, results) {
        Group.findAndDestroy({ user_id: user_id }, callback);
      }],
      deleteBadges: function (callback, results) {
        Badge.findAndDestroy({ user_id: user_id }, callback);
      },
      deleteUser: ['deleteGroups', 'deleteBadges', function (callback, results) {
        user.destroy(callback);
      }]
    }, function(err, results) {
      if (err)
        return callback(err);
      return callback(null, results.deleteUser);
    });
  });
};

module.exports = User;
