define(['backbone', 'underscore', 'badge-accept/badge'], function(Backbone, _, Badge) {

  /* App - watches a collection of badges and emits checkpoint
   *    events as they move through acceptance workflow
   *
   *   Takes a list of assertion urls
   *   Optionally takes build and issue methods in a spec object
   *      see Badge
   */
  var App = function App(assertionUrls, spec) {
    var assertionUrls = assertionUrls || [];
    var spec = spec || {};

    /* Default build implementation is the "real" one. */
    var build = spec.build || function(assertionUrl) {
      var build = jQuery.Deferred();
      jQuery.ajax({
        url: '/issuer/assertion',
        data: {
          url: assertionUrl
        },
        success: function(obj) {
          if (obj.exists) {
            build.reject('EXISTS', {}, obj);
          }
          else if (!obj.owner) {
            build.reject('INVALID', {}, obj);
          }
          else {
            build.resolve(obj);
          }
        },
        error: function(xhr, textStatus, error) {
          var message;
          try {
            /* If the ajax call was good but the server returned an error
               from its call, responseText will be a json object. */
            var err = jQuery.parseJSON(xhr.responseText);
            message = err.message;
          }
          catch (ex) {
            /* Otherwise our ajax call itself failed. */
            message = "Internal error; please try again later.";
          }
          /* FIXME: INACCESSIBLE is really only appropriate for the case
             within the try block. */
          build.reject('INACCESSIBLE', { message: message });
        }
      });
      return build;
    };

    /* Default issue implementation is the "real" one used by
       the issuer frame. */
    var issue = spec.issue || function(assertionUrl) {
      var issue = jQuery.Deferred();
      var self = this;
      var post = jQuery.ajax({
        type: 'POST',
        url: '/issuer/assertion',
        data: {
          url: assertionUrl
        },
        success: function(data, textStatus, jqXHR) {
          if (jqXHR.status == 304) {
            issue.reject('EXISTS');
          } else
            issue.resolve();
        },
        error: function(req) {
          /* FIXME: INVALID may not be appropriate here, particularly if
             the ajax call itself failed. */
          issue.reject('INVALID');
        }
      });
      return issue;
    };

    var badges = [];
    var aborted = false;

    assertionUrls.forEach(function(assertionUrl) {
      var b = Badge(assertionUrl, {
        build: build,
        issue: issue
      });

      /* Pass along badge state changes, as well as
         calling out failures. */
      b.on('state-change', function(to) {
        if (to === 'failed') {
          App.trigger('badge-failed', b);
        }
        App.trigger('state-change', b, to);
      });

      badges.push(b);
    });

    var App = {

      /* Begins processing all the badges and emitting events. */
      start: function() {
        if (assertionUrls.length === 0) {
          App.trigger('badges-complete', [], [], 0);
        }
        else {
          badges.forEach(function(badge, i, arr) {
            badge.build();
          });
        }
      },

      /* Aborts all badges, DENYing those that haven't yet failed. */
      abort: function() {
        aborted = true;
        badges.forEach(function(badge) {
          badge.reject('DENIED');
        });
      }
    };

    _.extend(App, Backbone.Events);

    /* Helper to get all badges in given states. */
    function getAllIn() {
      var states = Array.prototype.slice.apply(arguments);
      var results = _.filter(badges, function(badge) {
        return badge.inState.apply(badge, states);
      });
      return results;
    }

    /* Checks for notification that all badges have built or failed. */
    function checkAllBuilt() {
      var building = _.find(badges, function(badge) {
        return badge.inState('pendingBuild');
      });
      if (!building) {
        var built = _.filter(badges, function(badge) {
          return badge.inState('built');
        });
        var failures = getAllIn('failed');
        App.off('state-change', checkAllBuilt);
        App.trigger('badges-ready', failures, built);
      }
    }

    /* Checks for notification that all badges have been issued,
       rejected or failed. */
    function checkAllIssued() {
      var nonFinal = _.find(badges, function(badge) {
        return !badge.inState('issued', 'failed', 'complete');
      });
      if (!nonFinal) {
        var issuedCount = _.reduce(badges, function(memo, badge) {
          return badge.inState('issued', 'complete') ? memo + 1 : memo;
        }, 0);
        App.trigger('badges-issued', issuedCount);
      }
    }

    /* Checks that all badges are in a final state, complete or failed. */
    var complete = false;
    function checkAllDone() {
      if (complete)
        return;

      var pending = _.find(badges, function(badge) {
        return !badge.inState('failed', 'complete');
      });
      if(!pending) {
        complete = true;
        var failures = getAllIn('failed');
        var successes = getAllIn('complete');
        App.off('state-change', checkAllDone);
        var evt = aborted ? 'badges-aborted' : 'badges-complete';
        App.trigger(evt, failures, successes, badges.length);
      }
    }

    App.on('state-change', checkAllBuilt);
    App.on('state-change', checkAllIssued);
    App.on('state-change', checkAllDone);

    return App;
  };

  return App;

});
