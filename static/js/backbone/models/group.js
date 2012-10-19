var Group = Backbone.Model.extend({
  urlRoot: '/group',
  addBadge: function(badgeId){
    var badges = this.get('badges');
    badges.push(badgeId);
    this.set({badges: badges});
  },
  includes: function(badgeId){
    return this.get('badges').indexOf(badgeId) !== -1;
  }
});

var GroupCollection = Backbone.Collection.extend({
  model: Group,
  subset: function(filter){
    var set = new this.constructor();
    set.reset(this.filter(filter));
    this.on('change', function(){ 
      set.reset(this.filter(filter)); 
      set.trigger('change');
    });
    return set;
  }
});
    
