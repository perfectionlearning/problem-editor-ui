;(function() {

	//=======================================================
	var vw = app.Views.TopPage = {};

	//=======================================================
	// Pre-load the necessary data (SJAX)
	//=======================================================
	vw.preInit = function(callback)
	{
		// Fetch data in the background
		app.loading();

		var chainOfEvents = [
			// Make sure we have a valid username.  We need it for later steps.
			{
				preReq: ['skipIf', app.user],		// This step is required if app.user isn't set
				action: function(){return app.userState.fetch()},
				done: app.setUser,
				fail: app.notLoggedIn
			},

			// Make sure we have a list of chapter IDs.
			{
				preReq: ['skipIf', app.bookList.length],	// This step is required if the book/chapter list hasn't been loaded
				action: function(){return app.bookList.fetch({reset: true})},
				fail: app.fatalCommError
			},

			// Fetch the global user list
			{
				preReq: ['skipIf', app.userList.length],
				action: function(){return app.userList.fetch()},
				fail: app.fatalCommError,
				done: commComplete
			}

		];

		vw.preInitDone = callback;	// It's too much work to propagate this through multiple SJAX requests
		vw.chain = fw.startChain(chainOfEvents);


		// @FIXME/dg: Replace with a chain!  We need to return to the login page if not logged in

		// Fetch info list.
		/*
		app.info.fetch({
			success: function() {querySuccess(callback)},
			error: queryFailed
		});
		*/

	}

	//---------------------------------------
	//---------------------------------------
	function commComplete()
	{
		// Update history
		app.router.navigate('top');
		app.clearLoading();
		vw.preInitDone();
	}

	//=======================================================
	// Initialize the page
	//=======================================================
	vw.init = function(container)
	{
		// This is an odd place, but reset the active tab to the default whenever this page is reached.
		app.lastTab = 0;

		// Remove any locks owned by this user
		app.lock.unlockByUser(app.user);

		// Create view
		vw.view = new TopView({el: container /*, collection: app.info */});	// Create the view
		vw.view.render();
	}

	//=======================================================
	// View (and controllers)
	//=======================================================
	var TopView = app.PEView.extend({

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			app.title.text = 'Problem Editor';
			app.title.hasHome = false;
			app.title.hasLogout = true;
			app.title.update();
			app.footer.update();

			this.problemTab = new app.ProblemTab({collection:this.collection});
			this.queryTab = new app.QueryTab({collection:this.collection});

			if (!defined(app.topPageTab))
				app.topPageTab = 0;

			_.bindAll(this, 'render', 'tabChanged');
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var that = this;

			that.$el.empty();

			that.$el.append(app.templates.tabs({names: ["Problems", "Book Review"]}));	// The second tab was "Queries"

			// Problem tab
			that.$('#tabProblems').append(that.problemTab.render());

			// Query tab
			that.$('#tabBookReview').append(that.queryTab.render());

			// Status text
			this.$el.append(app.templates.infoStatus({status:app.status}));
			app.status = '';

			// Tabify
			this.tabEl = $("#tabs").tabs({active: app.topPageTab, activate: that.tabChanged});
		},

		//---------------------------------------
		// Whenever a tab change occurs, record the new tab
		//---------------------------------------
		tabChanged: function(event, ui) {
			app.topPageTab = this.tabEl.tabs("option", "active");
		}
	});

	//=======================================================
	// CLOSE function
	//=======================================================
	vw.close = function()
	{
		vw.view && vw.view.problemTab.close();
		vw.view && vw.view.queryTab.close();

		vw.view && vw.view.unbind();
		vw.view && vw.view.remove();
	}

})();
