//=======================================================
// This view shows the owner of a lock and allows it to be broken
//=======================================================
;(function() {

	//=======================================================
	var vw = app.Views.ProblemLocked = {};

	//=======================================================
	// Pre-load the necessary data (SJAX)
	//=======================================================
	vw.preInit = function(callback)
	{
		// Fetch data in the background
		app.loading();

		// Fetch lock info
		app.getLocks('', app.problemIdentifier, app.curProbID).then(
			function(response){querySuccess(callback)},
			queryFailed
		);
	}

	//---------------------------------------
	//---------------------------------------
	function queryFailed(response)
	{
		app.clearLoading();

		var err = app.getError(response);
		alert('Failed to fetch lock state: ' + err);

		if (response && (response.status === 403))
			app.changeContext('login');
		else
			app.changeContext('problemList');
	}

	//---------------------------------------
	//---------------------------------------
	function querySuccess(callback)
	{
		app.clearLoading();
		callback();
	}

	//=======================================================
	// Initialize the page
	//=======================================================
	vw.init = function(container)
	{
		// Update the history
//		app.router.navigate('locked/' + app.curProbID);

		// Create view
		vw.view = new LockedView({el: container, model: app.lockedObjects.at(0)});	// Create the view
		vw.view.render();
	};

	//=======================================================
	// View (and controllers)
	//=======================================================
	var LockedView = app.PEView.extend({

		//---------------------------------------
		//---------------------------------------
		events: {
			'click #return': 'problemList',
			'click #break': 'breakLock'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			this.infoBar = new app.InfoBarView();

			// Translate date sent by the server (IN: Y-M-D H:M:S)
			var fromServer = this.model.get('date');
			var regex = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/;
			this.lockTime = fromServer.match(regex);
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var that = this;
			var dateTime = this.dateTimeString();

			this.$el.empty();

			// Title
			this.$el.append(app.templates.genericTitle({title:'Problem Locked'}));
			this.$el.append(app.templates.titlePadding());

			// Current owner, lock date
			this.$el.append(app.templates.problemLocked({
				user: this.model.get('userDisplay'),
				date: dateTime[0],
				time: dateTime[1]
			}));

			// Recommended action -- Based on time since the lock was created (elapsedTime is in hours)
			if (this.elapsedTime() > 12)
				this.$el.append(app.templates.oldLock());
			else
				this.$el.append(app.templates.newLock());

			// Return to list button
			this.$el.append(app.templates.button({id:'return', text:'Problem list'}));

			// Break lock button
			this.$el.append(app.templates.button({id:'break', text:'Break the lock'}));

			// Bottom bar
			this.$el.append(this.infoBar.render());
		},

		//---------------------------------------
		//---------------------------------------
		dateTimeString: function() {
			var dt = this.lockTime;
			return [dt[2] + '/' + dt[3] + '/' + dt[1], dt[4] + ':' + dt[5] + ':' + dt[6]];
		},

		//---------------------------------------
		// Figure out how much time has elapsed since a problem
		// was locked, in hours.
		//---------------------------------------
		elapsedTime: function() {
			var now = new Date();		// Current date/time

			var dt = this.lockTime;
			var then = new Date(dt[1], dt[2]-1, dt[3], dt[4], dt[5], dt[6]);	// Locked date/time

			return (now - then) / 3600000;	// Hours elapsed since the lock
		},

		//---------------------------------------
		//---------------------------------------
		problemList: function() {
			app.changeContext('problemList');
		},

		//---------------------------------------
		//---------------------------------------
		breakLock: function() {
			app.lock.unlock(app.problemIdentifier, app.curProbID, {
				success: function() {
					app.changeContext('edit');
				},
				error: app.commError
			});
		}

	});

	//=======================================================
	// CLOSE function
	//=======================================================
	vw.close = function()
	{
		vw.view && vw.view.unbind();
		vw.view && vw.view.remove();
	}

})();
