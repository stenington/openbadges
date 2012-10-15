var PrivacyView = Backbone.View.extend(
  {
    initialize: function(){
      this.render();
    },
    render: function(){
      var content = templates.render(this.constructor.template, { attributes: this.model.toJSON() });
      this.$el.html(content);
    }
  },
  {
    template: 'privacyview.html'
  }
);
