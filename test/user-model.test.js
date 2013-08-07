const test = require('tap').test;
const testUtils = require('./');
const async = require('async');
const User = require('../models/user');
const Badge = require('../models/badge');
const Group = require('../models/group');
const Portfolio = require('../models/portfolio');

const EMAILS = {
  good: ['brian@awesome.com', 'yo+wut@example.com', /*'elniño@español.es',*/ 'ümlaut@heavymetal.de'],
  bad: ['lkajd', 'skj@asdk', '@.com', '909090', '____!@']
};

testUtils.prepareDatabase({
  '1-user': new User({
    email: 'deleteme@example.org'
  }),
  '2-existing-badge': new Badge({
    user_id: 1,
    endpoint: 'endpoint',
    image_path: 'image_path',
    body: testUtils.makeAssertion({recipient: 'deleteme@example.org'})
  }),
  '3-existing-group': new Group({
    user_id: 1,
    name: 'Test Group',
    badges: [1]
  }),
  '4-existing-portfolio': new Portfolio({
    group_id: 1,
    title: 'Test Portfolio',
    stories: {}
  })
}, function () {
  test('User#save', function (t) {
    const email = 'brian@example.org';
    const user = new User({email: email});
    user.save(function (err) {
      t.notOk(err, 'should not have an error');
      t.same(user.get('id'), 2);
      t.same(user.get('email'), email);
      t.end();
    })
  });

  test('User#validate', function (t) {
    EMAILS.good.forEach(function (email) {
      const err = new User({ email: email }).validate();
      t.notOk(err, 'should not have an error');
    })
    EMAILS.bad.forEach(function (email) {
      const err = new User({ email: email }).validate();
      t.ok(err, 'should have an error');
    })
    t.end();
  });

  test('User#setLoginDate', function (t) {
    const user = new User({ email: 'brian@example.org' });
    t.notOk(user.get('last_login'), 'should not have a last login');
    user.setLoginDate();
    t.ok(user.get('last_login'), 'has a login date');
    t.end();
  });

  test('User.findOrCreate', function (t) {
    const email = 'bad-dudes@example.org';
    User.findOrCreate(email, function (err, user) {
      const id = user.get('id');
      t.notOk(err, 'should not have an error');
      t.ok(id, 'should have an id');
      User.findOrCreate(email, function (err, user) {
        t.notOk(err, 'should not have an error');
        t.same(user.get('id'), id, 'should have gotten the user');
        t.end();
      })
    });
  });

  test('User.totalCount', function(t) {
    User.totalCount(function(err, totalcount) {
      t.notOk(err, "there's users, let's not have errors");
      t.equal(totalcount, 3, 'we have one user, correct');
      t.end();
    })
  })

  test('User.deleteAccount for user with badge, group, and portfolio', function (t) {
    const email = 'deleteme@example.org';
    User.deleteAccount(email, function(err, user) {
      t.notOk(err, "should not have an error");
      t.equal(user.attributes.email, 'deleteme@example.org', "delete the right account");
      async.parallel([
        function(callback) {
          User.find({ id: 1 }, function(err, users) {
            t.equal(users.length, 0, 'no user');
            callback();
          });
        },
        function(callback) {
          Badge.find({ user_id: 1 }, function(err, badges) {
            t.equal(badges.length, 0, 'no badges');
            callback();
          });
        },
        function(callback) {
          Group.find({ user_id: 1 }, function(err, groups) {
            t.equal(groups.length, 0, 'no groups');
            callback();
          });
        }
      ], function() {
        t.end();
      })
    });
  });


  testUtils.finish(test);
});


