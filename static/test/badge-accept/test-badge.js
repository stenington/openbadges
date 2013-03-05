defineTests(['badge-accept/badge'], function(Badge) {

  module("Badge");

  asyncTest('Issuing a single badge', function(){
    var b = Badge('foo', {
      build: function(){ return $.Deferred().resolve(); },
      issue: function(){ return $.Deferred().resolve(); }
    });
    b.on('built', function(){
      this.issue();
    });
    b.done(function(){
      ok(true, 'done');
    });
    b.fail(function(){
      ok(false, 'fail');
    });
    b.always(function(){
      equal(this.state, 'complete');
      equal(this.assertionUrl, 'foo');
      start();
    });
    b.build();
  });

  asyncTest('Badge fails build', function(){
    var b = Badge('foo', {
      build: function(){ return $.Deferred().reject('asplode'); }
    });
    b.on('built', function(){
      ok(false, 'should not see built event');
      start();
    });
    b.done(function(){
      ok(false, 'done');
    });
    b.fail(function(){
      ok(true, 'fail');
    });
    b.always(function(){
      equal(this.state, 'failed');
      deepEqual(this.error, {url: 'foo', reason: 'asplode'});
      start();
    });
    b.build();
  });

  asyncTest('Badge fails issue', function(){
    b = Badge('foo', {
      build: function(){ return $.Deferred().resolve(); },
      issue: function(){ return $.Deferred().reject('asplode'); }
    });
    var built = false;
    b.on('built', function(){
      built = true;
      b.issue();
    });
    b.done(function(){
      ok(fail, 'fail');
    });
    b.fail(function(){
      ok(true, 'fail');
    });
    b.always(function(){
      ok(built, 'saw built event');
      equal(this.state, 'failed');
      deepEqual(this.error, {url: 'foo', reason: 'asplode'});
      start();
    });
    b.build();
  });

  asyncTest('Badge rejected by user', function(){
    b = Badge('foo');
    b.on('built', function(){
      b.reject('DENIED');
    });
    b.done(function(){
      ok(false, 'done');
    });
    b.fail(function(){
      ok(true, 'fail');
    });
    b.always(function(){
      equal(this.state, 'failed');
      deepEqual(this.error, {url: 'foo', reason: 'DENIED'});
      start();
    });
    b.build();
  });

  asyncTest('Rejection reason and data', function(){
    b = Badge('foo', {
      build: function(){ return $.Deferred().resolve(); },
      issue: function(){ return $.Deferred().reject('asplode', {other: 'data', goes: 'here'}); }
    });
    b.on('built', function(){
      b.issue();
    });
    b.always(function(){
      deepEqual(this.error, {url: 'foo', reason: 'asplode', other: 'data', goes: 'here'});
      start();
    });
    b.build();
  });

  asyncTest('Successful badge state transitions', function(){
    var build = $.Deferred();
    var issue = $.Deferred();

    var b = Badge('foo', {
      build: function(){ return build; },
      issue: function(){ return issue; }
    });
    var states = [];
    states.push(b.state);
    b.on('built', function(){
      states.push(b.state);
      b.issue();
      states.push(b.state);
      issue.resolve();
    });
    b.on('issued', function(){
      states.push(b.state);
    });
    var stateChanges = 0;
    b.on('state-change', function(){
      stateChanges++;
    });
    b.always(function(){
      equal(stateChanges, 4);
      deepEqual(states, ['pendingBuild', 'built', 'pendingIssue', 'issued']);
      start();
    });
    b.build();
    build.resolve();
  });

  asyncTest('Badge built and issued events', function(){
    var b = Badge('foo');
    var events = [];
    b.on('built', function(){
      events.push('built');
      b.issue();
    });
    b.on('issued', function(){
      events.push('issued');
    });
    b.always(function(){
      deepEqual(events, ['built', 'issued'], 'saw both');
      start();
    });
    b.build();
  });

  asyncTest('badge.result() for issued', function(){
    var b = Badge('foo');
    b.on('built', function(){
      b.issue();
    });
    b.build();
    b.always(function(){
      equal(this.result(), 'foo');
      start();
    });
  });

  asyncTest('badge.result() for failed', function(){
    var b = Badge('foo', {
      build: function(){ return $.Deferred().reject('asplode', {more: 'stuff'}); }
    });
    b.build();
    b.always(function(){
      deepEqual(this.result(), {url: 'foo', reason: 'asplode'});
      start();
    });
  });

  asyncTest('Building badge data', function(){
    var b = Badge('foo', {
      build: function(assertionUrl){ return {url: assertionUrl, extra: 'stuff'}; }
    });
    equal(b.data, undefined);
    b.on('built', function(){
      deepEqual(b.data, {url: 'foo', extra: 'stuff'});
      start();
    });
    b.build();
  });

  asyncTest('Building badge data with deferred', function(){
    var b = Badge('foo', {
      build: function(assertionUrl){
        var build = $.Deferred();
        setTimeout(function(){
    build.resolve({url: assertionUrl, extra: 'stuff'});
        }, 500);
        return build;
      }
    });
    equal(b.data, undefined, 'no data before build');
    b.on('built', function(){
      deepEqual(b.data, {url: 'foo', extra: 'stuff'}, 'badgeData holds build');
      start();
    });
    b.build();
  });

  asyncTest('Building badge data and failing', function(){
    var b = Badge('foo', {
      build: function(assertionUrl){
        return $.Deferred().reject('reason', {error: 'data'}, {badge: 'data'});
      }
    });
    b.always(function(){
      deepEqual(b.error, {url: 'foo', reason: 'reason', error: 'data'});
      deepEqual(b.data, {badge: 'data'});
      start();
    });
    b.build();
  });

  asyncTest('Rejecting without badge data does not clobber', function(){
    var b = Badge('foo', {
      build: function(assertionUrl){
        return $.Deferred().resolve({some: 'data'})
      },
      issue: function(assertionUrl){
        return $.Deferred().reject('reason');
      }
    });
    b.on('built', function(){
      b.issue();
    });
    b.always(function(){
      deepEqual(b.data, {some: 'data'});
      deepEqual(b.error, {url: 'foo', reason: 'reason'});
      start();
    });
    b.build();
  });

  test('Checking badge state', function(){
    var b = Badge('foo');
    ok(b.inState('pendingBuild'));
    ok(b.inState('pendingBuild', 'somethingElse', 'maybeThis'));
    ok(b.inState('somethingFirst', 'pendingBuild', 'somethingElse', 'maybeThis'));
    ok(!b.inState('wrong'));
    ok(!b.inState('wrong', 'somethingElse', 'maybeThis'));
  });

  asyncTest('Failing a failed badge does nothing', function(){
    var b = Badge('foo', {
      build: function(assertionUrl){ return $.Deferred().reject('first'); }
    });
    b.fail(function(){
      deepEqual(b.result(), {url: 'foo', reason: 'first'});
      b.reject('second');
      deepEqual(b.result(), {url: 'foo', reason: 'first'});
      start();
    });
    b.build();
  });

});
