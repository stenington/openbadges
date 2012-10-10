var DisownView = Backbone.View.extend(
  {
    events: {
      'click .disown': 'showConfirmation',
      'click .nope': 'hideConfirmation',
      'click .close': 'hideConfirmation',
    },

    initialize: function(){
      this.render();
    },

    render: function(){
      var content = templates.render(DisownView.template, { attributes: this.model.toJSON() });
      this.$el.html(content);
    },

    showConfirmation: function(){
      this.$el.find('.confirm').fadeIn('fast');
    },

    hideConfirmation: function(){
      this.$el.find('.confirm').fadeOut('fast');
    }
  },
  {
    template: 'disownview.html'
  }
);
