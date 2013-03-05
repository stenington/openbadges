define(['jquery', 'backbone', 'underscore'], function($, Backbone, _) {
  $.extend({
    meta: function(name, value) {
      return $("meta[http-equiv='" + name + "']").attr("content", value);
    }
  });

  /* Session - an evented login & session helper
   *  Optionally takes startLogin method in a spec object
   *    to override default login implementation
   */
  var Session = function Session(spec) {
    var spec = spec || {};

    var startLogin = spec.startLogin || function(login) {
      /* default login implementation uses Persona */
      navigator.id.get(
        function(assertion) {
          if (assertion) {
            jQuery.ajax({
              url: '/backpack/authenticate',
              type: 'POST',
              dataType: 'json',
              data: {assertion: assertion},
              success: function(data) {
                login.resolve(data);
              },
              error: function() {
                login.reject({userAbort: false});
              }
            });
          }
          else {
            login.reject({userAbort: true});
          }
        },
        {
          siteName: 'Open Badge Backpack',
          termsOfService: '/tou.html',
          privacyPolicy: '/privacy.html',
          returnTo: '/issuer/welcome'
        }
      );
    };

    var loginStarted = false;
    var Session = {
      CSRF: jQuery.meta("X-CSRF-Token"),
      currentUser: jQuery.meta("X-Current-User"),
      login: function() {
        if (!loginStarted) {
          var login = jQuery.Deferred();
          login.done(function(data) {
            Session.currentUser = data.email;
            Session.trigger("login-complete");
          });
          login.fail(function(data) {
            if (data.userAbort)
              Session.trigger("login-abort");
            else
              Session.trigger("login-error");
          });
          login.always(function() {
            loginStarted = false;
          });
          loginStarted = true;
          Session.trigger('login-started');
          startLogin(login);
        }
      }
    };

    jQuery.ajaxSetup({
      beforeSend: function (xhr, settings) {
        if (!settings.crossDomain && settings.type != "GET")
          xhr.setRequestHeader('X-CSRF-Token', Session.CSRF)
      }
    });

    _.extend(Session, Backbone.Events);

    return Session;
  };

  return Session;
});
