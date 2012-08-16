(function(navigator, jQuery){

  /* login.js
   *
   * Using the Persona observer API, the Persona docs recommend that
   * navigator.id.watch() get called on every page of a site.
   * (https://developer.mozilla.org/en-US/docs/Persona/Quick_Setup)
   * Include it after the Persona library and jQuery on the page.
   *
   * This script will attach click handlers to .js-persona-login and
   * .js-persona-logout elements as appropriate, and watch for login
   * and logout events.
   *
   * Persona also wants to know who the site thinks is currently logged
   * in on each page, which this script will look for in a data-user
   * attribute anywhere on the page (body is a good spot to put it).
   * And for login, the CSRF token will be pulled from a data-csrf
   * attribute anywhere on the page (the login button is a good spot).
   */

  if (!navigator) {
    console.log('You must include the Persona library before login.js');
    return;
  }
  else if (!jQuery) {
    console.log('You must include jQuery before login.js');
    return;
  }

  var $ = jQuery;

  $(document).ready(function(){
    $('.js-persona-login').click(function(){
      navigator.id.request({
	/* TODO: make use of fancy new options, like:
	siteName: 'Backpack',
	oncancel: function(){return;},
	*/
      });
    });
    $('.js-persona-logout').click(function(){
      navigator.id.logout();
      return false;
    });

    var loggedInEmail = $('[data-user]').attr('data-user') || null;
    var csrf = $('[data-csrf]').attr('data-csrf');

    /* TODO: pull out paths into config to come through templates, using reverse lookup */
    navigator.id.watch({
      loggedInEmail: loggedInEmail,
      onlogin: function(assertion){
	if (!assertion) return false;
	jQuery.post(
	  '/backpack/authenticate',
	  { _csrf: csrf,
	    assertion: assertion
	  },
	  function(){ window.location = '/'; },
	  'json'
	)
	.error(function(xhr){
	  console.log('ERROR', xhr.responseText);
	});

      },
      onlogout: function(){
	window.location = '/backpack/signout';
      }
    });
  });

})(window.navigator, window.jQuery);
