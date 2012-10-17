// Nunjucks custom filters

// stringify - calls JSON.stringify on an object
// Useful for bootstrapping models in Backbone.
// e.g if 'badge' is a server-side Badge object,
// your template could include:
//    <script> 
//      var badge = new Badge({{ badge.attributes|stringify }}); 
//    </script>
// to have it on the client-side without an extra
// AJAX call to fetch. 
exports.stringify = function(obj) {
  return JSON.stringify(obj);
}