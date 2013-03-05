define(function(require) {
  var Channel = require('jschannel');

  /* Uses jschannel.
   *
   * When issuer frame is loaded in an iframe, this
   * builds the child-side channel to bind OpenBadges.issue()
   * to the issue() defined in main.js.
   */
  function buildChannel() {
    if (window.parent === window)
      return null;

    var channel = Channel.build({
      window: window.parent,
      origin: "*",
      scope: "OpenBadges.issue"
    });

    channel.bind("issue", function(trans, s) {
      var issue = window.issue || require('main');
      issue(s, function(errors, successes) {
        trans.complete([errors, successes]);
      });
      trans.delayReturn(true);
    });

    return channel;
  }

  return buildChannel;

});
