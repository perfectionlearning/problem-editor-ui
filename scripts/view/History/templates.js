//===========================================================================================
// HTML templates used to render views
//===========================================================================================
(function() {
	app.templates || (app.templates = {});

	//=======================================================
	// History row
	//=======================================================
	app.templates.historyView = _.template(
		'<td class="username"> <%= username %> </td> ' +
		'<td class="action"> <%= action %> </td> ' +
		'<td class="timeago"> <%= date %> </td>' +
		'<td class="timeago"> <%= time %> </td>'
	);

	//=======================================================
	// History table header
	//=======================================================
	app.templates.historyHeader = _.template(
		'<table>' +
			'<tr class="header">' +
				'<th>User</d>' +
				'<th>Action</th>' +
				'<th>Date</th>' +
				'<th>Time</th>' +
			'</tr>' +
		'</table>'
	);

})();
