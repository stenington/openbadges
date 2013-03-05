defineTests(['badge-accept/session'], function(Session) {
  module("Session");

  test('Session.currentUser from meta', function() {
    ok(!Session().currentUser, "No current user");
    $('<meta http-equiv="X-Current-User" content="example@example.com">').appendTo($('body'));
    equal(Session().currentUser, 'example@example.com', "Current user grabbed from meta http-equiv=\"X-Current-User\"");
  });

  asyncTest('Session.login failure', function(){
    var s = Session({
      startLogin: function(deferred){
        // Always fail
        deferred.reject({userAbort: false});
      }
    });
    var started = false;
    s.on('login-started', function(){
      started = true;
    });
    s.on('login-error', function(){
      ok(started, 'Saw login-started');
      ok(true, 'Saw login-error');
      start();
    });
    s.on('login-complete', function(){
      ok(false, 'Saw login-complete');
      start();
    });
    s.login();
  });

  asyncTest('User abort', function(){
    var s = Session({
      startLogin: function(deferred){
        // Always abort
        deferred.reject({userAbort: true});
      }
    });
    var started = false;
    s.on('login-started', function(){
      started = true;
    });
    s.on('login-abort', function(){
      ok(started, 'Saw login-started');
      ok(true, 'Saw login-abort');
      start();
    });
    s.on('login-error', function(){
      ok(false, 'Saw login-error');
      start();
    });
    s.on('login-complete', function(){
      ok(false, 'Saw login-complete');
      start();
    });
    s.login();
  });

  asyncTest('Session.login success', function(){
    var s = Session({
      startLogin: function(deferred){
        // Always succeed
        deferred.resolve({email: 'foo@example.com'});
      }
    });
    var started = false;
    s.on('login-started', function(){
      started = true;
    });
    s.on('login-error', function(){
      ok(false, 'Saw login-error');
      start();
    });
    s.on('login-complete', function(){
      ok(started, 'Saw login-started');
      ok(true, 'Saw login-complete');
      equal(s.currentUser, 'foo@example.com', 'currentUser set');
      start();
    });
    s.login();
  });
});
