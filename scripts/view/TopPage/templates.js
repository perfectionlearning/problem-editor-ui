//===========================================================================================
// HTML templates used to render views
//===========================================================================================
(function() {
	app.templates || (app.templates = {});

	//=======================================================
	// Status message
	//=======================================================
	app.templates.infoStatus = _.template(
		'<div id="queryFail"><%= status %></div>'
	);

	//=======================================================
	// Jump to problem control
	//=======================================================
	app.templates.jumpBox = _.template(
		'<div id="jumpBox" class="ui-corner-all">' +
			'<div class="queryHeader">Problem Access</div>' +
			'</div>' +
		'</div>'
	);

	//=======================================================
	// Jump to problem control
	//=======================================================
	app.templates.jumpToProblem = _.template(
		'<span id="jumpText">Jump to problem: </span>' +
		'<input id="jumpInput" />' +
		'<button id="jumpButton">Go!</button>' +
		'<hr id="jumpBreak" />'
	);

	//=======================================================
	// Book and Chapter selection
	//=======================================================
	/*
	app.templates.bookChapter = _.template(
		'<div class="queryHeader">Lookup Problems by Chapter</div>' +
		'<div id="bookText" class="header">Book:' +
			'<select id="bookSelect" class="pulldown"><option>select</option>' +
				'<% _.map(option, function(chapters, book) { %><option><%= book %></option><% }) %>' +
			'</select>' +
		'</div>' +

		'<div id="chapterText" class="header">Chapter:' +
			'<select id="chapterSelect" class="pulldown"><option>select</option></select>' +
		'</div>'
	);
	*/

	//=======================================================
	//=======================================================
	app.templates.chapters = _.template(
		'<option>select</option>'+
		'<% _.map(chapters, function(chapter, id) { %><option value="<%= id %>"><%= chapter %></option><% }) %>'
	);

	//=======================================================
	// Container box: ID
	//=======================================================
	app.templates.container = _.template(
		'<div id="<%= id %>" class="ui-corner-all" />'
	);

	//=======================================================
	// Header: text
	//=======================================================
	app.templates.header = _.template(
		'<div class="header"><%= text %></div>'
	);

	//=======================================================
	// Pulldowns: <div><select><option><option>...
	// Params: header, entries, selection
	//=======================================================
	app.templates.bulkChange = _.template(
		'<div class="header"><span><%= header %>:</span>' +
			'<select class="pulldown" id="<%= id %>_list" >' +
				'<% $.each(entries, function(idx, entry) { %>' +
					'<% if ((typeof(selection) === "number" && idx === selection) ' +
					' 		|| (typeof(selection) === "string" && entry === selection))' +
						'print("<option selected=\'selected\'>" + entry + "</option>");' +
					'else ' +
						'print("<option>" + entry + "</option>");' +
					'%>' +
				'<% }); %>' +
			'</select>' +
			'<button id="<%= id %>">Bulk change</button>'+
		'</div>'
	);


})();
