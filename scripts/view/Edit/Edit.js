;(function() {

	//=======================================================
	var vw = app.Views.Edit = {};

	//=======================================================
	// Pre-load the necessary data (SJAX)
	//=======================================================
	vw.preInit = function(callback)
	{
		// If we're continuing to edit (returning from the save screen) don't reload anything.
		if (app.continueEditing)
		{
			app.continueEditing = false;
			return callback();
		}

		var chainOfEvents = [
			// Make sure we have a valid username.  We need it for later steps.
			{
				preReq: ['skipIf', app.user],		// This step is required if app.user isn't set
				action: function(){return app.userState.fetch()},
				done: app.setUser,
				fail: app.fatalCommError
			},

			// Make sure we have a list of chapter IDs.
			{
				preReq: ['skipIf', app.bookList.length],	// This step is required if the book/chapter list hasn't been loaded
				action: function(){return app.bookList.fetch()},
				fail: app.fatalCommError
			},

			// Request a list of locked problems for the current user
			/*
			{
				action: function() {return app.getLocks(app.user, app.problemIdentifier)},
				fail: app.commError,
				done: gotList
			},
			*/

			// Attempt to lock this problem
			{
				action: function() {return app.lock.lock(app.problemIdentifier, app.curProbID)},
				fail: lockFailed,		// Does some special processing
			},

			// Request the problem data
			{
				action: getProblem,
				fail: fetchError,
				done: loadSuccess
			}
		];

		getTagStandardTypes();
		getTagTree();

		vw.preInitDone = callback;	// It's too much work to propagate this through multiple SJAX requests

		if (app.curProbID)
		{
			// Background: Request login info to get user name
			// Serial: Check for existing locked objects, obtain lock, then get problem info
			app.loading();
			vw.chain = fw.startChain(chainOfEvents);
		}
		else
		{
			app.userState.fetch().done(app.setUser);

			if (app.bookList.length < 1)
				app.bookList.fetch({success: createProblem, error: app.commError});
			else
				createProblem();
		}
	}

	//---------------------------------------
	// Lock list successfully fetched
	//---------------------------------------
	function gotList(response)
	{
		// If there are any items in response, switch contexts.
		// Be sure to ignore the currently selected problem!
		var excludeThis = _.reject(response, function(obj) {
			return obj.objectID === app.curProbID;
		});

		if (excludeThis.length > 0)
		{
			fw.abortChain(vw.chain);
			app.changeContext('myLocks');
		}
	}

	//---------------------------------------
	//---------------------------------------
	function lockFailed(response)
	{
		app.clearLoading();

		// Figure out why the error occurred.  If the object is locked, do something special.
		if (response && (response.status === 409))
			return app.changeContext('problemLocked');

		// Some other error occurred.  Deal with it.
		var err = app.getError(response);
		alert('Failed to get lock: ' + err);

		if (response && (response.status === 403))
			app.changeContext('login');
		else
			app.changeContext('problemList');
	}

	//---------------------------------------
	// We successfully obtained the lock
	// Now, request the model data
	//---------------------------------------
	function getProblem()
	{
		// We try to avoid allocation whenever possible.  However, when simply setting the
		// ID and doing a fetch, we end up with old data merged with new data.
		// At the very least we need to clear out the existing model.  In the end, allocating
		// a new object just seemed easier.
		// In light of the fact that I'm now doing a clear(), setting the id instead of
		// allocating is probably a good idea.  app.curProblem doesn't always exist, however, so it
		// would have to be allocated if it hasn't yet been defined.
//		app.curProblem.set({id:app.curProbID});
		app.curProblem && app.curProblem.clear({silent:true});	// DG: Attempt to wipe out the old problem, particularly the steps.  It seems to work!
		app.tagList && app.tagList.clear();

		app.curProblem = new app.Question({id:app.curProbID});
		return app.curProblem.fetch();
	}

	//---------------------------------------
	//---------------------------------------
	function loadSuccess()
	{
		// Update the history
		app.router.navigate('edit/' + app.curProbID);

		// Clone the problem that was just loaded
		app.saveOriginalProblem();

//		app.lastTab = 0;	// Enable this to reset the starting tab to 0 every time.  Disable it to always return to the last tab.  This helps someone working only on steps, for example.

		app.setRules();

		app.getWhiteboardList();	// Do a background fetch of whiteboards

		app.clearLoading();
		vw.preInitDone();
	}

	//=======================================================
	// Problem request error handler
	//=======================================================
	function fetchError(response)
	{
		// Intercept error 412  Otherwise, just pass on to the regular error handler
		if (response.status === 412)	// No content, i.e. invalid problem ID
		{
			app.clearLoading();
			alert('Invalid problem ID');
			app.changeContext('top');
		}
		else
			app.commError(response);
	}

	//=======================================================
	// Preload tag topic + objective tree, set promise to be
	// fulfilled before tag list is rendered.
	//=======================================================
	function getTagTree()
	{
		// @FIXME/dg: Holy app droppings, Batman!
		app.tagTopicObjective = {};
		app.tagList.setTreeUrl();
		app.loadedProblemTags = $.Deferred();

		app.tagTreePromise = app.tagList.fetch();
		app.tagTreePromise.done(function(data) {
			app.tagSkills = data.skills;
			app.tagTopics = data.topics;
			$.each(app.tagSkills, function(n1, obj) {
				var ids = _.pluck(obj.list, "tag_id");
				$.each(ids, function(n2, id) {
					app.tagTopicObjective[id] = { topic: obj.topic, objective: obj.objective };
				})
			});
		});
	}

	//=======================================================
	// Determine whether anything has been changed in the current
	// problem.
	//=======================================================
	app.isChanged = function()
	{
		if (vw.view)
			return vw.view.getChangeList().length > 0;

		// The view doesn't exist
		return false;
	}

	//=======================================================
	// Get Tag Standards
	//=======================================================
	function getTagStandardTypes()
	{
		app.standardTypes = [];
		var standardsModel = new app.StandardsList();
		standardsModel.setTypes();
		app.standardTypesPromise = standardsModel.fetch();

		app.standardTypesPromise.done(function(data) {
			// @FIXME/dg: This is redundant. The model has already been fetched. Why store it twice?
			app.standardTypes = data;
		});

		app.standardTypesPromise.fail();
	}

	//---------------------------------------
	// We're creating a new problem.  Bypass the SJAX requests
	// and just start editing.
	//---------------------------------------
	function createProblem()
	{
		// Update the history
		app.router.navigate('create');

		// Create a blank problem
		app.curProblem = new app.Question(null, {parse:true});	// We need parse:true so the steps collection gets created
		app.originalProblem = app.curProblem.clone();	// Save a copy of the model so we can compare against it to detect changes
		app.originalProblem.resetSteps();

		// Wipe out the whiteboard list
		app.wbList.clear();	// Wipe out the existing model

		vw.preInitDone();
	}

	//=======================================================
	//
	//=======================================================
	app.getWhiteboardList = function()
	{
		app.wbList.clear();	// Wipe out the existing model
		app.wbList.id = app.curProblem.get('chID');
		app.wbList.fetch();
	}

	//=======================================================
	// @FIXME/dg: Find a better solution!
	// This should come from the server, as part of the
	// equivalence rules
	//=======================================================
	app.setRules = function()
	{
		var chID = app.curProblem.get('chID');
		var data = app.getBookAndChapter(chID);

		if (data && data.book && data.book === "First Person Physics")
			app.setDisplayRules('physics');
		else
			app.setDisplayRules('math');
	}

	//=======================================================
	// Create a copy of the original problem
	//=======================================================
	app.saveOriginalProblem = function()
	{
		// Save a copy of the model so we can compare against it to detect changes
		// This works for everything except embedded models and collections, e.g. steps.
		app.originalProblem = app.curProblem.clone();

		// Clone the steps, safely
		var newSteps = [];
		app.curProblem.get('solve').each(function(val, idx) {	// This is a hack to additionally clone the embedded collection.  backbone-relational doesn't handle deep cloning.
			newSteps.push(val.clone());
		});

		// Store the new data, safely
		app.originalProblem.resetSteps();
		app.originalProblem.get('solve').reset(newSteps, {silent:true});
	}

	//=======================================================
	// Initialize the page
	//=======================================================
	vw.init = function(container)
	{
		this.closing = false;

		app.API.notify('problemEdit', app.curProbID || 'new');

		// This controls which tabs appear, and which items are on each tab
		var tabs = app.selectInterface(app.userGroups);
		var tabList = app.interfaces[tabs];

		// Do this once -- Choose a set of variables
		app.chooseVars();

		vw.view = new MainView({el: container, model:app.curProblem, original: app.originalProblem, tabs:tabList});	// Create the view
		vw.view.render();
	};

	//=======================================================
	// View (and controllers)
	//=======================================================
	var MainView = app.PEView.extend({

		//---------------------------------------
		//---------------------------------------
		events: {
			'click #validate': 'validate',
			'click #cancel': 'quit'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			// Create bars
			if (app.curProbID !== undefined)
				app.title.text = 'Problem #' + this.model.get('id');
			else
				app.title.text = 'New Problem';

			app.title.hasHome = true;
			app.title.hasLogout = true;
			app.title.update();

			this.tabSwitch = _.bind(this.tabSwitch, this);
			this.preRender();
		},

		//---------------------------------------
		// Create the tabbed interface and all of
		// the views within them.
		//---------------------------------------
		preRender: function() {
			var that = this;

			// Create the tab container
			var tabNames = _.pluck(that.options.tabs, 'name');
			that.$el.append(app.templates.tabs({names:tabNames}));

			// Create all views for all tabs.  Similar items (e.g., the question field appears on multiple tabs) still require different (but synchronized) views.
			this.views = [];
			for (var i = 0, len = this.options.tabs.length; i < len; i++)
			{
				// Create all the views for this tab
				var tabList = [];
				var target = $('#tab'+tabNames[i]);

				$.each(this.options.tabs[i].items, function(idx, val) {

					// Create the view
					var itemView = new app.ItemView({
						id: val,
						className: 'wrapper',
						parent: target,
						model: that.model,
						type: val,
						original: that.options.original,
						tab: that.options.tabs[i]
					});

					tabList.push(itemView);
				});

				target.append(app.templates.tabBottom());

				this.views.push(tabList);
			}

			this.tabEl = $("#tabs").tabs({
				active: app.lastTab,
				activate: this.tabSwitch,
				disabled: true
			});

			app.savedPostProcess = {};
		},

		//---------------------------------------
		// Elements have already been added to the DOM.
		// Just call each item's render routine to update.
		//---------------------------------------
		render: function() {
			var that = this;

			// Render all tabs.  Don't do this often!
			for (var i = 0, len = this.options.tabs.length; i < len; i++)
			{
				$.each(this.views[i], function(idx, val) {
					val.render();
				});
			}

			MathJax.Hub.Queue(["enableTabs", this]);
		},

		//---------------------------------------
		// Validate button pressed.  Switch to the
		// validate/save view
		//---------------------------------------
		validate: function() {
			// Tell all rich edit controls to close
			$('.richEdit').trigger('globalSave');

			// Construct a list of changes before handing off control to the save page
			app.changeList = this.getChangeList();

			app.lastTab = this.tabEl.tabs('option', 'active');
			app.changeContext('save');
		},

		//---------------------------------------
		// Quit button pressed
		//---------------------------------------
		quit: function() {
			app.lastTab = this.tabEl.tabs('option', 'active');	// Enable to save the last active tab when a Quit occurs

			// Return to the query page, if we know what it was.
			if (app.queryID) {
				app.changeContext('problemList');
			}
			else if (app.quickCheckChapterId) {
				app.curProbID = app.quickCheckChapterId;
				app.changeContext('quickCheck');
			}
			else {
				app.changeContext('top');	// If we don't know, go to the top page
			}
		},

		//---------------------------------------
		// Construct a change list
		//---------------------------------------
		getChangeList: function() {
			var changes = [];

			// Step through each tab, then each item
			$.each(this.views, function(idx, tab) {
				$.each(tab, function(idx, view) {
					var change = view.changeList();
					if (change)
						changes.push(change);
				});
			});

			return _.unique(changes);
		},

		//---------------------------------------
		// A new tab has been activated
		//---------------------------------------
		tabSwitch: function(event, ui) {
			var that = this;

			that.tabEl.tabs('disable');
			MathJax.Hub.Queue(["Typeset", MathJax.Hub, ui.newPanel[0], function() {
				that.enableTabs();
				that.postProcess(ui.newPanel.attr('id'));
			}]);
		},

		//=======================================================
		// This is called after Jax conversion for a given tab.
		// It enables all other tabs.
		//=======================================================
		enableTabs: function()
		{
			// If the view is already shutting down, forget it
			if (this.closing)
				return;

			this.tabEl.tabs('enable');
		},

		//=======================================================
		// This is called after Jax conversion for a given tab.
		//=======================================================
		postProcess: function(tabName)
		{
			// Perform any custom post-process functions. Jax conversion is complete for this tab.
			if (tabName && app.savedPostProcess[tabName])
			{
				$.each(app.savedPostProcess[tabName], function(idx, val) {
					var func = val[0];
					var ctx = val[1];
					ctx[func].call(ctx);
				});

				// Delete list of post-process functions.
				app.savedPostProcess[tabName] = [];
			}
		},

		//---------------------------------------
		// Close routine.  Unbind model events.
		//---------------------------------------
		close: function() {
			this.closing = true;

			for (var i = 0, len = this.options.tabs.length; i < len; i++)
			{
				this.views[i] && $.each(this.views[i], function(idx, val) {
					val.close();
					val.remove();
				});
			}

			this.views = [];	// Was an array of arrays. This should still delete all elements.
		}

	});

	//=======================================================
	// Determine whether it's safe to navigate away.
	// If there is anything in the changelist, the
	// answer is no.
	//=======================================================
	vw.canLeave = function()
	{
		if (!vw.view)
			return true;

		var cl = vw.view.getChangeList()
		return (cl.length === 0);
	}

	//=======================================================
	// CLOSE function
	//=======================================================
	vw.close = function()
	{
		// This is killing necessary events!  If we do this, make sure everything is properly re-bound on entry
//		app.curProblem.unbind();	// Unbind model events (otherwise we bind a new one every time we enter this view!)
		vw.view && vw.view.close();

		vw.view && vw.view.unbind();
		vw.view && vw.view.remove();
	}

})();
