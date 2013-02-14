"use strict";

defineTests(["browserid-ajax"], function(BrowserIDAjax) {
  module("browserid-ajax");

  function FakeNavigatorID() {
    return {
      _options: null,
      get: function(cb) {
        this._options = {onlogin: cb};
      }
    };
  }

  function FakeNetwork(handlers) {
    return {
      ajax: function(options) {
        handlers[options.type + ' ' + options.url](options);
      }
    };
  }

  test("login error on failed verify works", function() {
    var loginErrorEvents = 0;
    var browserid = BrowserIDAjax({
      email: '',
      id: FakeNavigatorID(),
      verifyURL: '/verify',
      logoutURL: '/logout',
      csrfToken: 'fake csrf token',
      network: FakeNetwork({
        'POST /verify': function(options) {
          options.error();
        }
      })
    }).on('login:error', function() { loginErrorEvents++; });

    equal(loginErrorEvents, 0);
    browserid.login();
    browserid.id._options.onlogin('fake assertion for foo@bar.org');
    equal(loginErrorEvents, 1);
  });

  test("verification works", function() {
    var loginEvents = 0;
    var loginErrorEvents = 0;
    var browserid = BrowserIDAjax({
      email: '',
      id: FakeNavigatorID(),
      verifyURL: '/verify',
      logoutURL: '/logout',
      csrfToken: 'fake csrf token',
      network: FakeNetwork({
        'POST /verify': function(options) {
          equal(options.data.assertion, 'fake assertion for foo@bar.org');
          equal(options.headers['X-CSRFToken'], 'fake csrf token');
          equal(options.dataType, 'json');
          options.success({
            csrfToken: 'new fake csrf token',
            email: 'foo@bar.org',
          });
        }
      })
    }).on('login', function() { loginEvents++; })
      .on('login:error', function() { loginErrorEvents++; });

    equal(browserid.email, null);
    equal(browserid.csrfToken, 'fake csrf token');

    browserid.login();
    browserid.id._options.onlogin(null);
    equal(loginEvents, 0, "null assertions don't trigger login events");
    equal(loginErrorEvents, 1, "null assertions do trigger login:error evts");
    browserid.id._options.onlogin('fake assertion for foo@bar.org');

    equal(loginEvents, 1);
    equal(browserid.email, 'foo@bar.org');
    equal(browserid.csrfToken, 'new fake csrf token');
  });

  test("logout works", function() {
    var logoutEvents = 0;
    var browserid = BrowserIDAjax({
      email: 'foo@barf.org',
      id: FakeNavigatorID(),
      verifyURL: '/verify',
      logoutURL: '/logout',
      csrfToken: 'fake csrf token',
      network: FakeNetwork({
        'POST /logout': function(options) {
          equal(options.headers['X-CSRFToken'], 'fake csrf token');
          equal(options.dataType, 'json');
          options.success({
            csrfToken: 'another new fake csrf token',
            email: null,
          });
        }
      })
    }).on('logout', function() { logoutEvents++; });

    equal(browserid.email, 'foo@barf.org');
    equal(browserid.csrfToken, 'fake csrf token');

    browserid.logout();

    equal(logoutEvents, 1);
    equal(browserid.email, null);
    equal(browserid.csrfToken, 'another new fake csrf token');
  });
});
