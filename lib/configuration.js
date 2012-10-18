var habitat = require('habitat');
var env = new habitat('openbadges');

exports.get = function (key) {
  return env.get(key);
};