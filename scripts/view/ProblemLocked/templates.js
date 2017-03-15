//===========================================================================================
// HTML templates used to render views
//===========================================================================================
(function() {
	app.templates || (app.templates = {});

	//=======================================================
	// Display info about a locked problem
	// PARAMS: user, date, time
	//=======================================================
	app.templates.problemLocked = _.template(
		'<div id="problemLocked">' +
			'That problem was locked by <span class="highlight"><%= user %></span>' +
			' on <span class="highlight"><%= date %></span>' +
			' at <span class="highlight"><%= time %></span>' +
			'.<br><br>' +
		'</div>'
	);

	//=======================================================
	// Display info about a locked problem
	//=======================================================
	app.templates.newLock = _.template(
		'<div id="problemLocked">' +
			"The lock is recent.  You should return to the problem list and choose another unless you're certain you want to break the lock." +
		'</div>'
	);

	//=======================================================
	// Display info about a locked problem
	//=======================================================
	app.templates.oldLock = _.template(
		'<div id="problemLocked">' +
			"The lock is old.  It's probably safe to break the lock." +
		'</div>'
	);

})();
