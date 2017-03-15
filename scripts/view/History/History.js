;(function() {

  //=======================================================
  var vw = app.Views.History = {};

  //=======================================================
  // Initialize the page
  //=======================================================
  vw.init = function(container)
  {
    // Update history
    app.router.navigate('history/' + app.curProbID);

    app.problemHistory.fetch({success: function() {
      vw.view = new HistoryListView({el: container});  // Create the view
      vw.view.render();
	}});

	// If the user isn't set, request it (ignore failures)
	if (!app.user)
		app.userState.fetch({success:function(model, response){app.setUser(response)}});
  };

  //=======================================================
  // This view is a single table row
  //=======================================================
  var HistoryItemView = app.PEView.extend({
    tagName: 'tr',

    //---------------------------------------
    //---------------------------------------
    initialize: function() {
//      _.bindAll(this, 'render'); // every function that uses 'this' as the current object should be in here
    },

    //---------------------------------------
    //---------------------------------------
    render: function() {
      this.$el.html(app.templates.historyView(this.model.toJSON()));
      return this;
    }
  });

  //=======================================================
  // This view is for the entire table
  //=======================================================
  var HistoryListView = app.PEView.extend({

    //---------------------------------------
    //---------------------------------------
	events: {
		'click #return': function() {app.changeContext('problemList')}
	},

    //---------------------------------------
    //---------------------------------------
    initialize: function() {
      var that = this;

      app.title.text = 'Change History for Problem #' + app.curProbID;
      app.title.hasHome = true;
      app.title.hasLogout = true;
      app.title.update();
      //app.footer.update();
    },

    //---------------------------------------
    //---------------------------------------
    render: function() {
      var that = this;
      that.$el.empty();
      this.$el.append(app.templates.historyHeader);

      app.problemHistory.each(function(h) {
        that.addItem(h);
      });

      this.$el.append(app.templates.button({id:'return', text:'Return to list'}));
    },

    //---------------------------------------
    //---------------------------------------
    addItem: function(item) {
      var munge = item.get('timestamp_pst');
      munge = munge.replace(/\.\d+/, '').replace(/-/g, ' ');
      item.set('date', dateFormat(munge, "mmmm dS, yyyy    "));
      item.set('time', dateFormat(munge, "          h:MM TT"));

      var itemView = new HistoryItemView({
		parent: this.el,
        model: item,
        id: 'history_' + item.get('revision_id')
      });

      $('table .header').after(itemView.render().el);
    }
  });

  //=======================================================
  // CLOSE function
  //=======================================================
  vw.close = function()
  {
    vw.view.unbind();
    vw.view.remove();
  }

})();
