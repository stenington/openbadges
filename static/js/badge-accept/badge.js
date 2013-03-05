define(['backbone', 'underscore'], function(Backbone, _) {

  /* Badge - represents a badge in the acceptance workflow
   *   Takes an assertion url
   *   Optionally takes build and issue methods in a spec object
   *     These should return Deferreds (or plain objects, which count
   *        as a resolved Deferred)
   *     `build` attempts to build a full badge out of the assertion url
   *     `issue` attempts to issue the badge
   *
   *   The Deferred is resolved if build and issue succeed, and rejected
   *   if either has an error or the badge is rejected by the user.
   */
  var Badge = function Badge(assertionUrl, spec) {
    var spec = spec || {};
    var _build = spec.build || function() { return {}; };
    var _issue = spec.issue || function() { return {}; };

    var buildState;
    var issueState;

    var Badge = jQuery.Deferred(function() {
      this.state = 'pendingBuild';

      function changeState(to) {
        Badge.state = to;
        Badge.trigger('state-change', to);
      }

      this.assertionUrl = assertionUrl;

      /* If the badge is rejected, error contains the url, reason,
         and any additional data for the failure. */
      this.fail(function(reason, data) {
        this.error = _.extend({url: assertionUrl, reason: reason}, data);
        changeState('failed');
      });

      /* If the badge is resolved, it moves to state complete. */
      this.done(function() {
        changeState('complete');
      });

      /* Kicks off building of the badge. */
      this.build = function build() {
        buildState = _build(assertionUrl);

        jQuery.when(buildState).then(
          function buildSuccess(data) {
            Badge.data = data;
            changeState('built');
            Badge.trigger('built');
          },
          function buildFailure(reason, errorData, badgeData) {
            Badge.data = badgeData;
            Badge.reject(reason, errorData);
          }
        );
      };

      /* Kicks off issuing the badge. */
      this.issue = function issue() {
        if (this.state != 'built')
          throw new Error('Cannot issue unbuilt badge');

        changeState('pendingIssue');
        issueState = _issue.call(this, assertionUrl);

        jQuery.when(issueState).then(
          function issueSuccess() {
            changeState('issued');
            Badge.trigger('issued');
            Badge.resolve();
          },
          function issueFailure(reason, data) {
            Badge.reject(reason, data);
          }
        );
      };

      /* .result is the final "view" of the badge that gets returned
         to the OpenBadges.issue() callback. */
      this.result = function result() {
        if (this.inState('issued', 'complete'))
          return this.assertionUrl;
        else if (this.inState('failed'))
          return { url: this.error.url, reason: this.error.reason };
        else
          throw new Error("Can't return result for state " + this.state);
      };

      /* Query if badge is in any of the given states */
      this.inState = function inState() {
        return _.include(arguments, this.state);
      }

      _.extend(this, Backbone.Events);

    });

    return Badge;
  };

  return Badge;

});
