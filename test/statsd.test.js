const tap = require('tap').test;
const sinon = require('sinon');
const statsd = require(__dirname + '/../lib/statsd.js');

tap('statsd', function (t) {
  // Interface
  t.type(statsd, 'object', 'module should be a function');

  // Methods
  statsd.increment('test.bucket');
  statsd.decrement('test.bucket');

  t.test('middleware', function (t) {
    const middleware = require('../middleware').statsdRequests();

    t.test('hijacks res.end', function (t) {
      var req = {
        path: '/some/path',
        method: 'GET'
      };
      var end = sinon.stub();
      var res = {
        end: end
      };
      var next = sinon.stub();

      middleware(req, res, next);

      t.ok(next.calledOnce, 'next called');
      t.notEqual(res.end, end, 'end hijacked');
      res.end();
      t.ok(res.end.calledOnce, 'original end called');
      t.equal(res.end, end, 'end restored');

      t.end();
    });

    t.test('increments path bucket', function (t) {
      var req = {
        path: '/just/a/normal/path',
        method: 'GET'
      };
      var res = { end: function(){} };
      sinon.spy(statsd, 'increment');

      middleware(req, res, function(){});
      res.end();

      t.ok(statsd.increment.calledOnce, 'increment called');
      t.deepEqual(statsd.increment.args[0], ['obi.just.a.normal.path.get']);

      statsd.increment.restore();
      t.end();
    });

    t.test('increments parameterized route bucket', function (t) {
      var req = {
        path: '/path/with/params/blah.ext',
        route: {
          path: '/path/:a/params/:b.ext'
        },
        method: 'GET'
      };
      var res = { end: function(){} };
      sinon.spy(statsd, 'increment');

      middleware(req, res, function(){});
      res.end();

      t.ok(statsd.increment.calledOnce, 'increment called');
      t.deepEqual(statsd.increment.args[0], ['obi.path._a.params._b_ext.get']);

      statsd.increment.restore();
      t.end();
    });

    t.test('increments path for regex route', function (t) {
      var req = {
        path: '/some/path',
        route: {
          path: /.*/
        },
        method: 'GET'
      };
      var res = { end: function(){} };
      sinon.spy(statsd, 'increment');

      middleware(req, res, function(){});
      res.end();

      t.ok(statsd.increment.calledOnce, 'increment called');
      t.deepEqual(statsd.increment.args[0], ['obi.some.path.get']);

      statsd.increment.restore();
      t.end();
    });

    t.end();
  });

  t.end();
}).on('end', function(){
  setTimeout(process.exit, 100);
});