//==========================================================================
// Generic list handler -- Displays the results of a query
//
//==========================================================================
;(function() {

	//=======================================================
	var vw = app.Views.ObjectList = {};

	//=======================================================
	// Pre-load the necessary data (SJAX)
	//=======================================================
	vw.preInit = function(callback)
	{
		if (!defined(app.queryParams))
		{
			app.status = 'No query specified';
			app.changeContext('top');
			return;
		}

		app.loading();
		vw.preInitDone = callback;  // It's too much work to propagate this

		// Wipe out all old data
		app.objectList.clear({silent:true});

		app.objectList.save({
			book_id: app.queryParams.book,
			chapter_id: app.queryParams.chapter,
			object_type: app.queryParams.type,
			status: app.queryParams.status,
			assigned_to: app.queryParams.assignTo
		}, {
			success: querySuccess,
			error: querySuccess
		});

		// If the user isn't set, request it (ignore failures)
		if (!app.user)
			app.userState.fetch({success:function(mode, response){app.setUser(response)}});
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
		app.clearLoading();

		// The query was successful, but that doesn't mean any records were returned.
		// If the query returned nothing, just return to the query creation page.
		var data = app.objectList.get('data');
		if (!data || data.length < 1)
		{
			app.status = "No records found that match your query.";
			app.changeContext('top');
		}
		else
		{
			// Update the history
			app.router.navigate('objectList');

			vw.preInitDone();
		}
	}

	//=======================================================
	// Initialize the page
	//=======================================================
	vw.init = function(container)
	{
		vw.view = new app.ObjectListView({el: container, model: app.objectList});  // Create the view
		vw.view.render();
	};

	//=======================================================
	// CLOSE function
	//=======================================================
	vw.close = function()
	{
		app.objectList.unbind();	// This is probably safe, but it destroys all callbacks.  If this mode needs to be re-entrant it could cause problems.
		vw.view && vw.view.unbind();
		vw.view && vw.view.remove();
	}

})();
