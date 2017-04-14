//===========================================================================================
// HTML templates used to render views
//===========================================================================================
(function() {
	app.templates || (app.templates = {});

	//=======================================================
	// A styled title
	//=======================================================
	app.templates.genericTitle = _.template(
		'<div class = "title ui-corner-all">' +
			'<%= title %>' +
		'</div>' +
		'<hr id="titleBottom" />'
	);

	//=======================================================
	// A styled title
	//=======================================================
	app.templates.titleWithIcons = _.template(
		'<div id="title" class="ui-corner-all">' +
			'<%= title %>' +
			'<div class="logout bottomRight"><u>Logout</u></div>' +
			'<div class="home bottomRight"><u>Home</u></div>' +
		'</div>' +
		'<hr id="titleBottom" />'
	);

	//=======================================================
	// Padding after the title
	//=======================================================
	app.templates.titlePadding = _.template(
		'<div class="titlePadding">&nbsp;</div>'
	);

	//=======================================================
	// Bottom menu/info bar
	//=======================================================
	app.templates.bottomBar = _.template(
		'<div id="bottomBar" class="ui-corner-all">' +
			'<div class="bottomLeft">User: <%= user %></div>' +
			'<div class="logout bottomRight"><u>Logout</u></div>' +
			'<div class="home bottomRight"><u>Home</u></div>' +
		'</div>'
	);

	//=======================================================
	// infoTable (headerless table): id, data, tableClass
	//=======================================================
	app.templates.infoTable = _.template(
		'<% print(fw.makeTable(id, data, tableClass)); %>'
	);

	//=======================================================
	// Table: headClass, header, id, data, tableClass
	//=======================================================
	app.templates.table = _.template(
		'<div><span class="header <%= headClass %>"><%= header %>:</span></div>' +
		'<% print(fw.makeTable(id, data, tableClass)); %>'
	);

	//=======================================================
	// Table for drag and drop: headClass, header, id, data, tableClass
	//=======================================================
	app.templates.tableDragDrop = _.template(
		'<div><span class="header <%= headClass %>"><%= header %>:</span></div>' +
		'<% print(fw.makeTable(id, dataVariables, tableClass)); %>' +
		'<% print(fw.makeTable(bottom_id, dataEquations, tableClass)); %>'
	);

	//=======================================================
	// Variable for drag and drop formula.
	//=======================================================
	app.templates.dragDropVariable = _.template(
		'<div>Where: <%= variable %></div>'
	);

	//=======================================================
	// Shape for drag and drop formula.
	//=======================================================
	app.templates.dragDropShape = _.template(
		'<div class="eoc-<%= shape %>"><%= answer %></div>'
	);

	//=======================================================
	// Drag and drop formula
	//=======================================================
	app.templates.dragDropPreview = _.template(
		'<% blanks.forEach((blank) => { %>' +
		'<%     print(app.templates.dragDropShape({ shape: blank.shape, answer: blank.answer })) %>' +
		'<% }) %>' +
		'<br clear="all">'
	);

	//=======================================================
	// Simple Input
	//=======================================================
	app.templates.simpleInput = _.template(
		'<span class="header"><%= header %>:</span>' +
		'<input class="simpleInput" type="text" value="<%= value %>" />'
	);

	//=======================================================
	// A button
	// id, text (text displayed on the button)
	//=======================================================
	app.templates.button = _.template(
		'<button id="<%= id %>"><%= text %></button>'
	);

	//=======================================================
	// A button with a class
	// Params: id, btnClass, text (text displayed on the button)
	//=======================================================
	app.templates.buttonClass = _.template(
		'<button id="<%= id %>" class="<%= btnClass %>"><%= text %></button>'
	);

	//=======================================================
	// Loading overlay
	//=======================================================
	app.templates.loading = _.template(
		'<div id="dimmed"></div>' +
		'<div id="loadAuto" class="ui-corner-all">Loading</div>'
	);

	//=======================================================
	// Generic info message
	//=======================================================
	app.templates.message = _.template(
		'<div class="message"><%= text %></div>'
	);

	//=======================================================
	// Styled text (text with an ID)
	// Params: id, text
	//=======================================================
	app.templates.styledText = _.template(
		'<div id="<%= id %>"><%= text %></div>'
	);

	//=======================================================
	// Generic styled text (text with a class)
	// Params: cls, text
	//=======================================================
	app.templates.textClass = _.template(
		'<div class="<%= cls %>"><%= text %></div>'
	);

	//=======================================================
	// Generic padding: class
	//=======================================================
	app.templates.padding = _.template(
		'<div class="<%= cls %>"></div>'
	);

	//=======================================================
	// Generic padding: class
	//=======================================================
	app.templates.paddingBreak = _.template(
		'<div class="<%= cls %>"><hr/></div>'
	);

	//=======================================================
	// Generic info message
	//=======================================================
	app.templates.sideText = _.template(
		'<span class="sideText"><%= text %></span>'
	);

	//=======================================================
	// List of errors: list
	//=======================================================
	app.templates.errorList = _.template(
		'<div id="errors">' +
			'<div class="header">Validation failed:</div>' +
			'<ul>' +
				'<% $.each(list, function(idx, entry) { %>' +
					'<li><%= entry %></li>' +
				'<% }); %>' +
			'</ul>' +
		'</div>'
	);

	//=======================================================
	// Fake link: Text that looks like a browser link
	// Params: id, text
	//=======================================================
	app.templates.fakeLink = _.template(
		'<div><span id="<%= id %>" class="fakeLink"><%= text %></span></div>'
	);
})();
