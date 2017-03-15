//=======================================================
// Common title bar
//
// Right now this is being created and rendered as a child
// view in each page.
// It would be better to install a single title and bottom
// bar in the page, and treat them completely separately
// from the main page/view.
//=======================================================
;(function() {
	app.TitleBarView = app.PEView.extend({
//		id: 'title',
//		className: 'title ui-corner-all',

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
			app.title.on('change', this.render);
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			// Main template
			this.$el.html(app.templates.titleWithIcons({title:app.title.text}));

			// Logout icon/option
			app.setIcon('.logout', app.title.hasLogout);

			// Home icon/option
			app.setIcon('.home', app.title.hasHome);
		}

	});

	//=======================================================
	// Title object
	//=======================================================
	app.title = {
		text:'&nbsp;',
		hasHome: false,
		hasLogout: false,

		//---------------------------------------
		//---------------------------------------
		update: function() {
			this.trigger('change');
		}
	};

	_.extend(app.title, Backbone.Events);


})();
