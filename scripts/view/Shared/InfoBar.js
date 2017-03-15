//=======================================================
// Common bottom status/info bar
//
// Right now this is being created and rendered as a child
// view in each page.
// It would be better to install a single title and bottom
// bar in the page, and treat them completely separately
// from the main page/view.
//=======================================================
;(function() {
	app.InfoBarView = app.PEView.extend({

		//---------------------------------------
		//---------------------------------------
		events: {
			'click .logout': app.logout,
			'click .home': app.goHome
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			this.render = _.bind(this.render, this);
			app.footer.on('change', this.render);
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			this.$el.html(app.templates.bottomBar({user: app.user}));

			// Logout icon/option
			app.setIcon('.logout', app.title.hasLogout);

			// Home icon/option
			app.setIcon('.home', app.title.hasHome);
		}
	});

	//=======================================================
	// Footer object
	//=======================================================
	app.footer = {
//		hasHome: false,		// We're using the same icons as the title, so let it handle everything
//		hasLogout: false,

		//---------------------------------------
		//---------------------------------------
		update: function() {
			this.trigger('change');
		}
	};

	_.extend(app.footer, Backbone.Events);

})();
