const test = require('tap').test;
const testUtils = require('./');
const middleware = require('../middleware');
const conmock = require('./conmock');

const ALLOW_CORS = 'Access-Control-Allow-Origin';

test('middleware#utils.createSecureToken', function(t) {
  function runTest(t) {
    var token = middleware.utils.createSecureToken(6);
    var parts = token.split('_');
    var base64data = parts[0];
    var timestamp = parseInt(parts[1], 32);
    var now = Date.now();
    var twoMinutesAgo = now - 60*2000;
    t.equal(base64data.length, 8,
            "first part of token is 8 characters (6 bytes of base64 data)");
    t.ok(now >= timestamp && timestamp > twoMinutesAgo,
         "second part is base32 ms timestamp from within past two minutes");
  }

  t.test("works in normal case", function(t) {
    runTest(t);
    t.end();
  });
  t.test("works when crypto.randomBytes() fails", function(t) {
    var crypto = require("crypto");
    var origRandomBytes = crypto.randomBytes;
    var thrown = false;
    crypto.randomBytes = function() {
      thrown = true;
      throw new Error("NO ENTROPY BRO");
    };
    try {
      runTest(t);
    } finally { crypto.randomBytes = origRandomBytes; }
    t.ok(thrown);
    t.end();
  });
  t.end();
});

test('middleware#cors', function (t) {
  const handler = middleware.cors;

  t.test('no cors by default', function (t) {
    conmock(handler(), function (err, mock) {
      t.notOk(mock.headers[ALLOW_CORS], 'should not allow cors');
      t.end();
    });
  });

  t.test('string whitelist', function (t) {
    const stringWhitelist = handler({ whitelist: '/foo' });

    conmock({
      handler: stringWhitelist,
      request: { url: '/foo' }
    }, function (err, mock) {
      t.same(mock.headers[ALLOW_CORS], '*', 'has cors');
    });

    conmock({
      handler: stringWhitelist,
      request: { url: '/food' }
    }, function (err, mock) {
      t.notOk(mock.headers[ALLOW_CORS], 'should not allow cors');
    });

    t.plan(2);
  });

  t.test('array whitelist', function (t) {
    const arrayWhitelist = handler({
      whitelist: ['/bar', '/baz']
    });
    conmock({
      handler: arrayWhitelist,
      request: { url: '/bar' }
    }, function (err, mock) {
      t.same(mock.headers[ALLOW_CORS], '*', 'has cors');
    });

    conmock({
      handler: arrayWhitelist,
      request: { url: '/baz' }
    }, function (err, mock) {
      t.same(mock.headers[ALLOW_CORS], '*', 'has cors');
    });

    conmock({
      handler: arrayWhitelist,
      request: { url: '/bard' }
    }, function (err, mock) {
      t.notOk(mock.headers[ALLOW_CORS], 'should not allow cors');
    });

    t.plan(3);
  });

  t.end();
});

test('middleware#featureFlags', function (t) {
  const handler = middleware.featureFlags;

  t.test('no flags', function (t) {
    conmock(handler({}), function (err, mock) {
      t.ok(mock.locals.featureFlags, 'featureFlags local exists');
      t.ok(mock.locals.featureFlags.enabled, 'enabled exists');
      t.ok(mock.locals.featureFlags.disabled, 'disabled exists');
      t.end();
    });
  });

  t.test('enabled features', function (t) {
    var flags = { feature: true };
    conmock(handler(flags), function (err, mock) {
      t.ok(mock.locals.featureFlags.enabled.feature, 'feature is enabled');
      t.notOk(mock.locals.featureFlags.disabled.feature, 'feature is not disabled');
      t.end();
    });
  });

  t.test('enabled with truthy', function (t) {
    var flags = { feature1: 1, feature2: 'hi' };
    conmock(handler(flags), function (err, mock) {
      t.ok(mock.locals.featureFlags.enabled.feature1, 'enabled with 1');
      t.ok(mock.locals.featureFlags.enabled.feature2, 'enabled with \'hi\'');
      t.end();
    });
  });

  t.test('disabled features', function (t) {
    var flags = { feature: false };
    conmock(handler(flags), function (err, mock) {
      t.ok(mock.locals.featureFlags.disabled.feature, 'disabled feature is not on');
      t.notOk(mock.locals.featureFlags.enabled.feature, 'disabled feature is off');
      t.end();
    });
  });

  t.test('disabled with falsy', function (t) {
    var flags = { feature1: 0, feature2: "" };
    conmock(handler(flags), function (err, mock) {
      t.ok(mock.locals.featureFlags.disabled.feature1, 'disabled with 0');
      t.ok(mock.locals.featureFlags.disabled.feature2, 'disabled with ""');
      t.end();
    });
  });

  t.end();
});

// necessary because middleware requires mysql, which opens a client
testUtils.finish(test);