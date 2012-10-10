var NotesView = Backbone.View.extend(
  {
    events: {
      'click .save': 'save'
    },

    initialize: function(){
      this.render();
    },

    render: function(){
      var content = templates.render(NotesView.template, { attributes: this.model.toJSON() });
      this.$el.html(content);
    },

    save: function(){
      this.model.save({notes: this.$el.find('.noteText').val()});
    }
  },
  {
    template: 'notesview.html'
  }
);
