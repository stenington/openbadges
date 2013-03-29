/* Setup methods:
   
   Setup methods should return an object with template data
   to be passed to the views. 
   Add a 'description' attribute to your setup methods with 
   a brief description to be displayed on the index page.

   Example
   -------

   exports.mySetup = function(){
     return { foo: bar };
   };
   exports.mySetup.description = "Sets foo to bar.";

 */

exports.withUser = function(){
  return {
    user: {
      attributes: {
        email: 'user@whatever.org'
      }
    }
  };
};
exports.withUser.description = "Adds user object for 'user@whatever.org'";