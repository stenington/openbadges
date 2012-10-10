var DisownView = Backbone.View.extend(
  {
    events: {
      'click .disown': 'showConfirmation',
      'click .nope': 'hideConfirmation',
      'click .close': 'hideConfirmation',
      'click .yep': 'disown'
    },

    initialize: function(opts){
      this.success = opts.success || function(){};
      this.error = opts.error || function(){};
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
    },

    disown: function(){
      this.model.destroy({
        success: this.success,
        error: this.error
      });
    }
  },
  {
    template: 'disownview.html'
  }
);
