"use strict";

define(["jquery", "backbone-events"], function($, BackboneEvents) {
  return function BrowserIDAjax(options) {
    var id = options.id || window.navigator.id;
    var network = options.network || $;

    var self = {
      email: options.email,
      csrfToken: options.csrfToken,
      id: id,
      login: function() {
        self.id.request();
      },
      logout: function() {
        self.id.logout();
      }
    };

    self.id.watch({
      loggedInUser: self.email,
      onlogin: function(assertion) {
        if (assertion)
          post(options.verifyURL, {assertion: assertion}, 'login');
        else
          self.trigger("login:error");
      },
      onlogout: function() {
        post(options.logoutURL, {}, 'logout');
      }
    });

    BackboneEvents.mixin(self);

    function post(url, data, eventName) {
      network.ajax({
        type: 'POST',
        url: url,
        headers: {"x-csrf-token": self.csrfToken},
        dataType: 'json',
        data: data,
        error: function() {
          console.log(arguments);
          self.trigger(eventName + ":error");
        },
        success: function(data) {
          self.email = data.email;
          self.trigger(eventName, self);
        }
      });
    }

    return self;
  };
});
