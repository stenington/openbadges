"use strict";

defineTests(["browserid-ajax"], function(BrowserIDAjax) {
  module("browserid-ajax");

  function FakeNavigatorID(assertion) {
    return {
      _options: null,
      watch: function(opts) {
        this._options = opts;
      },
      request: function(opts) {
        this._options.onlogin(assertion);
      },
      logout: function() {
        this._options.onlogout();
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

  test("email sentinel values preserved", function() {
    var id = FakeNavigatorID();

    var browserid = BrowserIDAjax({
      email: null, /* not logged in */
      id: id
    });
    strictEqual(id._options.loggedInUser, null);

    browserid = BrowserIDAjax({
      email: undefined, /* login status unknown */
      id: id
    });
    strictEqual(id._options.loggedInUser, undefined);

    browserid = BrowserIDAjax({
      email: 'foo@bar.org', /* foo@bar.org logged in */
      id: id
    });
    equal(id._options.loggedInUser, 'foo@bar.org');
  });

  test("login error on failed verify works", function() {
    var loginErrorEvents = 0;
    var browserid = BrowserIDAjax({
      email: null,
      id: FakeNavigatorID('fake assertion for foo@bar.org'),
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
    equal(loginErrorEvents, 1);
  });

  test("verification works", function() {
    var loginEvents = 0;
    var loginErrorEvents = 0;
    var browserid = BrowserIDAjax({
      email: null,
      id: FakeNavigatorID('fake assertion for foo@bar.org'),
      verifyURL: '/verify',
      logoutURL: '/logout',
      csrfToken: 'fake csrf token',
      network: FakeNetwork({
        'POST /verify': function(options) {
          equal(options.data.assertion, 'fake assertion for foo@bar.org');
          equal(options.headers['x-csrf-token'], 'fake csrf token');
          equal(options.dataType, 'json');
          options.success({
            status: 'ok',
            email: 'foo@bar.org',
          });
        }
      })
    }).on('login', function() { loginEvents++; })
      .on('login:error', function() { loginErrorEvents++; });

    equal(browserid.email, null);

    browserid.login();

    equal(loginEvents, 1);
    equal(browserid.email, 'foo@bar.org');
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
          equal(options.headers['x-csrf-token'], 'fake csrf token');
          equal(options.dataType, 'json');
          options.success({
            status: 'ok',
            email: null,
          });
        }
      })
    }).on('logout', function() { logoutEvents++; });

    equal(browserid.email, 'foo@barf.org');

    browserid.logout();

    equal(logoutEvents, 1);
    equal(browserid.email, null);
  });
});
