var crypto = require('crypto');
var async = require('async');
var _ = require('underscore');
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

User.deleteAccount = function (email, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }

  var destroy = opts.dryRun ?
    function(callback){ return callback(null) } :
    Base.prototype.destroy;

  User.findOne({ email: email }, function (err, user) {
    if (err)
      return callback(err);
    if (!user)
      return callback();
    var userAttrs = _.clone(user.attributes);
    var userId = user.attributes.id;
    async.auto({
      getGroups: function (callback, results) {
        Group.find({ user_id: userId }, function(err, groups) {
          callback(err, groups);
        });
      },
      deletePortfolios: ['getGroups', function (callback, results) {
        var groups = results.getGroups;
        async.reduce(groups, {}, function(memo, group, callback) {
          var groupId = group.attributes.id;
          Portfolio.find({ group_id: groupId }, function(err, portfolios){
            if (err)
              return callback(err);
            memo[groupId] = portfolios.map(function(p){ return _.clone(p.attributes); });
            async.each(portfolios, function(portfolio, callback) {
              destroy.call(portfolio, callback);
            }, function(err) {
              return callback(err, memo);
            });
          });
        }, function (err, results) {
          return callback(err, results);
        });
      }],
      deleteGroups: ['deletePortfolios', function (callback, results) {
        var groups = results.getGroups;
        var attrs = groups.map(function(o){ return _.clone(o.attributes); });
        async.each(groups, function(group, callback) {
          destroy.call(group, callback);
        }, function(err) {
          callback(err, attrs);
        });
      }],
      deleteBadges: function (callback, results) {
        Badge.find({ user_id: userId }, function(err, badges) {
          var attrs = badges.map(function(o){ return _.clone(o.attributes); });
          async.each(badges, function(badge, callback) {
            destroy.call(badge, callback);
          }, function(err) {
            callback(err, attrs);
          });
        });
      },
      deleteUser: ['deleteGroups', 'deleteBadges', function (callback, results) {
        destroy.call(user, callback);
      }]
    }, function(err, results) {
      if (err)
        return callback(err);
      return callback(null, {
        user: userAttrs,
        badges: results.deleteBadges,
        groups: results.deleteGroups,
        portfolios: results.deletePortfolios
      });
    });
  });
};

module.exports = User;
