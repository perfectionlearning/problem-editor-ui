//==========================================================================
// Generic list handler -- Displays the results of a query
//
// The server owns the list of queries and what information they each display.
//
// Currently, clicking any row extracts the ID from the model and attempts to
// edit that problem.  That might not be the desired behavior in all cases.
//==========================================================================
;(function() {

	//=======================================================
	var vw = app.Views.QuickCheck = {};

	//=======================================================
	// Pre-load the necessary data (SJAX)
	//=======================================================
	vw.preInit = function(callback)
	{

		var chainOfEvents = [
		  // Make sure we have a valid username.  We need it for later steps.
			{
				preReq: ['skipIf', app.user],    // This step is required if app.user isn't set
				action: function(){return app.userState.fetch()},
				done: app.setUser,
				fail: app.commError
			},

		  // Unlock all objects locked by the current user
			{
				action: function() {return app.lock.unlockByUser(app.user)},
				fail: app.commError    // NOTE: On error, this will link back to this page, in an endless loop!
			},

		  // Perform the query
			{
				action: function(){return app.quickCheckProblems.fetch()},
				done: querySuccess,
				fail: queryFailed
			}
		];

		vw.preInitDone = callback;

		app.quickCheckProblems.set({problem_id:app.curProbID});

		app.loading();
		vw.chain = fw.startChain(chainOfEvents);
	}

	//---------------------------------------
	//---------------------------------------
	function queryFailed(response)
	{
		app.clearLoading();
		app.status = 'Unable to retrieve data from the server.  Try again later.  (' + response.status + ')';
		app.changeContext('top');
	}

	//---------------------------------------
	//---------------------------------------
	function querySuccess()
	{
		// Update the history
		app.router.navigate('quickCheck/' + app.curProbID);

		// Update the page title with the fetched data
		app.queryType = app.quickCheckProblems.get('title') || 'Quick Check Chapters';

		app.clearLoading();
		vw.preInitDone();
	}

	//=======================================================
	// Initialize the page
	//=======================================================
	vw.init = function(container)
	{
		vw.view = new app.ProblemListView({el: container, model:app.quickCheckProblems});  // Create the view
		vw.view.render();
	};

	//=======================================================
	// CLOSE function
	//=======================================================
	vw.close = function()
	{
		app.quickCheckProblems.unbind();	// This is probably safe, but it destroys all callbacks.  If this mode needs to be re-entrant it could cause problems.
		vw.view && vw.view.unbind();
		vw.view && vw.view.remove();
	}

})();
