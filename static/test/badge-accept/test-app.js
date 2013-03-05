defineTests(['jquery', 'underscore', 'badge-accept/app'], function($, _,  App) {

  module("App");

  /* A method to trivially fake success for build or issue */
  function succeed(){
    return {};
  }

  /* Returns a method that will simulate build or issue failure on
     a single assertion url.
   */
  function failOne(url, reason){
    return function(assertionUrl) {
      if (assertionUrl === url) {
        console.log('failing', assertionUrl);
        return $.Deferred().reject(reason);
      }
      console.log('passing', assertionUrl);
      return $.Deferred().resolve();
    };
  }

  /* A test helper to get result objects from a list of badges */
  function results(list){
    return _.map(list, function(badge){ return badge.result(); });
  }

  asyncTest('Run app with no assertions', function(){
    var app = App([]);
    app.on('badges-complete', function(failures, successes, total){
      ok(true, 'badges-complete event');
      deepEqual(failures, [], 'empty failures');
      deepEqual(successes, [], 'empty successes');
      equal(total, 0, '0 total badges');
      start();
    });
    app.start();
  });

  asyncTest('Accept a single badge', function(){
    var app = App(['foo'], {
      build: succeed,
      issue: succeed
    });
    var ready = false;
    app.on('badges-ready', function(failures, badges){
      ready = true;
      equal(failures.length, 0);
      equal(badges.length, 1);
      equal(badges[0].assertionUrl, 'foo');
      badges[0].issue();
    });
    var completeSeen = false;
    app.on('badges-complete', function(failures, successes, total){
      if (completeSeen)
        ok(false, 'badges-complete should only fire once');
      completeSeen = true;
      ok(ready, 'Saw badges-ready event');
      ok(true, 'badges-complete event');
      deepEqual(failures, [], 'empty failures');
      deepEqual(results(successes), ['foo'], 'foo a success');
      equal(total, 1, '1 total badges');
      start();
    });
    app.start();
  });

  asyncTest('Reject a single badge', function(){
    var app = App(['foo'], {
      build: succeed,
      issue: succeed
    });
    var ready = false;
    app.on('badges-ready', function(failures, badges){
      ready = true;
      equal(failures.length, 0);
      equal(badges.length, 1);
      equal(badges[0].assertionUrl, 'foo');
      badges[0].reject('DENIED');
    });
    app.on('badges-complete', function(failures, successes, total){
      ok(ready, 'Saw badges-ready event');
      ok(true, 'badges-complete event');
      deepEqual(results(failures), [{url: 'foo', reason: 'DENIED'}], 'foo a failure');
      deepEqual(successes, [], 'empty successes');
      equal(total, 1, '1 total badges');
      start();
    });
    app.start();
  });

  asyncTest('Single badge fails build', function(){
    var app = App(['FAILME'], {
      build: failOne('FAILME', 'you suck')
    });
    var ready = false;
    app.on('badges-ready', function(failures, badges){
      ready = true;
      equal(failures.length, 1, 'one failure');
      deepEqual(results(failures), [{url: 'FAILME', reason: 'you suck'}], 'FAILME a failure');
    });
    app.on('badges-complete', function(failures, successes, total){
      ok(ready, 'saw ready event');
      deepEqual(results(failures), [{url: 'FAILME', reason: 'you suck'}], 'FAILME a failure');
      start();
    });
    app.start();
  });

  asyncTest('Single badge fails issue', function(){
    var app = App(['HAZIT'], {
      build: succeed,
      issue: failOne('HAZIT', 'you have that one')
    });
    var ready = false;
    app.on('badges-ready', function(failures, badges){
      ready = true;
      equal(badges.length, 1);
      badges[0].issue();
    });
    app.on('badges-complete', function(failures, successes, total){
      ok(ready, 'Saw badges-ready');
      deepEqual(results(failures), [{url: 'HAZIT', reason: 'you have that one'}], 'HAZIT a failure');
      start();
    });
    app.start();
  });

  asyncTest('Two badges - issue both', function(){
    var app = App(['foo', 'bar'], {
      build: succeed,
      issue: succeed
    });
    app.on('badges-ready', function(failures, badges){
      equal(badges.length, 2, 'two badges ready');
      badges.forEach(function(badge, i, arr){
        badge.issue();
      });
    });
    app.on('badges-complete', function(f, s, t){
      deepEqual(f, [], 'no failures');
      deepEqual(results(s), ['foo', 'bar'], 'both succeed');
      equal(t, 2);
      start();
    });
    app.start();
  });

  asyncTest('Two badges - one good, one bad', function(){
    var app = App(['foo', 'bar'], {
      build: failOne('bar', 'NO BARS!'),
      issue: succeed
    });
    var ready = false;
    app.on('badges-ready', function(failures, badges){
      ready = true;
      equal(badges.length, 1);
      equal(badges[0].assertionUrl, 'foo');
      badges[0].issue();
    });
    app.on('badges-complete', function(f, s, t){
      ok(ready, 'saw ready event');
      deepEqual(results(f), [{url: 'bar', reason: 'NO BARS!'}], 'bar fails');
      deepEqual(results(s), ['foo'], 'foo succeeds');
      equal(t, 2);
      start();
    });
    app.start();
  });

  asyncTest('Two badges - both fail', function(){
    var app = App(['foo', 'bar'], {
      build: failOne('bar', "bar won't build"),
      issue: failOne('foo', "foo won't issue")
    });
    app.on('badges-ready', function(failures, badges){
      badges.forEach(function(badge){
        badge.issue();
      });
    });
    app.on('badges-complete', function(f, s, t){
      deepEqual(results(f), [{url: 'foo', reason: "foo won't issue"}, {url: 'bar', reason: "bar won't build"}]);
      deepEqual(results(s), []);
      equal(t, 2);
      start();
    });
    app.start();
  });

  asyncTest('Abort after app.start()', function(){
    var app = App(['foo', 'bar', 'baz'], {
      build: function(assertionUrl){
        var d = $.Deferred();
        if (assertionUrl === 'foo')
    setTimeout(function(){ d.resolve(); }, 500);
        else if (assertionUrl === 'bar')
    d.reject('failed build');
        else if (assertionUrl === 'baz')
    setTimeout(function(){ d.reject('fail later'); }, 500);
        return d;
      }
    });
    app.on('badges-complete', function(){
      ok(false, 'should not complete');
      start();
    });
    app.on('badges-aborted', function(f, s, t){
      deepEqual(results(f), [
        {url: 'foo', reason: 'DENIED'},
        {url: 'bar', reason: 'failed build'},
        {url: 'baz', reason: 'DENIED'}
      ]);
      start();
    });
    app.start();
    app.abort();
  });

  asyncTest('Abort before app.start()', function(){
    var app = App(['foo', 'bar', 'baz']);
    app.on('badges-complete', function(){
      ok(false, 'should not complete');
      start();
    });
    app.on('badges-aborted', function(f, s, t){
      deepEqual(results(f), [
        {url: 'foo', reason: 'DENIED'},
        {url: 'bar', reason: 'DENIED'},
        {url: 'baz', reason: 'DENIED'}
      ]);
      start();
    });
    app.abort();
  });

  asyncTest('Using badges-failed event', function(){
    var app = App(['foo', 'bar'], {
      build: failOne('foo', 'bad build'),
      issue: failOne('bar', 'bad issue')
    });
    var failed = 0;
    var expected = {
      'foo': { reason: 'bad build' },
      'bar': { reason: 'bad issue' }
    };
    app.on('badge-failed', function(badge){
      failed++;
      equal(badge.error.reason, expected[badge.assertionUrl].reason, 'reason good');
    });
    app.on('badges-ready', function(f, badges){
      badges.forEach(function(badge){
        badge.issue();
      });
    })
    app.on('badges-complete', function(f, s, t){
      equal(failed, 2, 'saw two failure events');
      equal(f.length, 2, 'receive both as failures');
      start();
    });
    app.start();
  });

});
