/* Setup methods should return an object with
   template data
 */

exports.withUser = function(){
  return {
    user: {
      attributes: {
        email: 'hi@wut.com'
      }
    }
  };
};