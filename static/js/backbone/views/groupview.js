var GroupSelector = Backbone.View.extend({
  template: "groupselector.html",
  events: {
    "click .save": "save"
  },
  initialize: function(opts){
    this.badgeId = opts.badgeId;

    this.render();
  },
  render: function(){
    var badgeId = this.badgeId;
    var available = this.collection.filter(function(group){
      return !group.includes(badgeId); 
    });
    var content = templates.render(this.template, { 
      availableGroups: new GroupCollection(available).toJSON() 
    });
    this.$el.html(content);
  },
  save: function(){
    this.trigger('saveToGroup');
  }
});

var GroupView = Backbone.View.extend({
  events: {
    'click .add': 'showSelector'
  },
  initialize: function(opts){
    this.badgeId = opts.badgeId; 

    this.promptPanel = this.$el.find('.prompt');  
    this.selectPanel = this.$el.find('.selector');

    $(this.selectPanel).hide();

    this.selector = new GroupSelector({
      el: this.selectPanel, 
      collection: this.collection,
      badgeId: this.badgeId
    });
    this.selector.on('saveToGroup', this.hideSelector, this);
  },
  showSelector: function(){
    $(this.promptPanel).hide();
    $(this.selectPanel).show();
  },
  hideSelector: function(){
    $(this.promptPanel).show();
    $(this.selectPanel).hide();
  }
});
