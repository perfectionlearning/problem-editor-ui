//===========================================================================================
// HTML templates used to render views
//===========================================================================================
(function() {
	app.templates || (app.templates = {});

	//=======================================================
	// Text displays
	//
	// Params: header, value
	//=======================================================
	app.templates.textItem = _.template(
		'<span class="header startEdit"><%= header %>:</span>' +
//		'<span class="value startEdit"><%= value %></span>'
		'<span class="value startEdit"><% print(app.highlightVars(value)) %></span>'
	);

	//=======================================================
	// Text displays
	//
	// Params: header, value
	//=======================================================
	app.templates.textItemReadOnly = _.template(
		'<span class="header_ro"><%= header %>:</span>' +
		'<span class="value_ro"><%= value %></span>'
	);

	//=======================================================
	// Text displays
	//=======================================================
	app.templates.textItemComplex = _.template(
		'<div class="reWrapper">' +
			'<div class="reLeft header startEdit"><%= header %>:</div>' +
			'<div class="reRight value startEdit"><% print(app.prettyDisplay(value)) %></div>' +
		'</div>'
	);

	//=======================================================
	// Triple text display (used for tags)
	//=======================================================
	app.templates.tripleText = _.template(
		'<span class="header startEdit"><%= header1 %>:</span>' +
		'<span class="value startEdit"><%= value1 %></span>' +
		'<span class="header startEdit"><%= header2 %>:</span>' +
		'<span class="value startEdit"><%= value2 %></span>' +
		'<span class="header startEdit"><%= header3 %>:</span>' +
		'<span class="value startEdit"><%= value3 %></span>'
	);

	//=======================================================
	// Pulldowns: <div><select><option><option>...
	// Params: header, entries, selection
	//=======================================================
	app.templates.pulldown = _.template(
		'<div class="header"><span class="stopEdit"><%= header %>:</span>' +
		'<select class="pulldown" <% if (typeof(id) === "string") print("id=\'" + id + "\'") %>>' +
		'<% $.each(entries, function(idx, entry) { %>' +
			'<% if ((typeof(selection) === "number" && idx === selection) ' +
			' 		|| (typeof(selection) === "string" && entry === selection))' +
				'print("<option selected=\'selected\'>" + entry + "</option>");' +
			'else ' +
				'print("<option>" + entry + "</option>");' +
			'%>' +
		'<% }); %>' +
		'</select></div>'
	);

	//=======================================================
	// Pulldowns: <div><select><option><option>...
	// Params: header, entries, selection
	//=======================================================
	app.templates.standardTypesPulldown = _.template(
		'<div class="header"><span class="stopEdit"><%= header %>:</span>' +
		'<select class="pulldown" <% if (typeof(id) === "string") print("id=\'" + id + "\'") %>>' +
		'<option>Select</option>' +
		'<% $.each(entries, function(idx, entry) { %>' +
			'<% if ((typeof(selection) === "number" && idx === selection) ' +
			' 		|| (typeof(selection) === "string" && entry === selection))' +
				'print("<option selected=\'selected\' value=\'" + entry.name + "\'>" + entry.desc + "</option>");' +
			'else ' +
				'print("<option value=\'" + entry.name + "\'>" + entry.desc + "</option>");' +
			'%>' +
		'<% }); %>' +
		'</select></div>'
	);

	//=======================================================
	// Pulldowns: <div><select><option><option>...
	// Params: entries, selection
	//=======================================================
	app.templates.simplePulldown = _.template(
		'<select class="pulldown" <% if (typeof(id) === "string") print("id=\'" + id + "\'") %>>' +
		'<% $.each(entries, function(idx, entry) { %>' +
			'<% if ((typeof(selection) === "number" && idx === selection) ' +
			' 		|| (typeof(selection) === "string" && entry === selection))' +
				'print("<option selected=\'selected\'>" + entry + "</option>");' +
			'else ' +
				'print("<option>" + entry + "</option>");' +
			'%>' +
		'<% }); %>' +
		'</select>'
	);

	//=======================================================
	// Table row for tag type (e.g., TEKS, Skill, &c.) in tag list
	// Params: type
	//=======================================================
	app.templates.tagListType = {
		generic: _.template(
			'<tr>' +
			'  <td class="type-name"></td>' +
			'  <td class="type-name" colspan="3"><%= type %></td>' +
			'</tr>'
		),

		skill: _.template(
		   '<tr>' +
			'  <td class="type-name"></td>' +
			'  <td class="type-name"><%= type %></td>' +
			'  <td class="type-name">Objective</td>' +
			'  <td class="type-name">Topic</td>' +
		   '</tr>'
		)
	}

	//=======================================================
	// Table row for tag data
	// Params: idx, tag, topicClass, topic, objectiveClass, objective
	//=======================================================
	app.templates.tagListTag = {
		generic: _.template(
			'<tr>' +
			'  <td><div class="ctrl"><img data-tag-id="<%= id %>" class="delete-tag" src="images/Delete-icon.png"></div></td>' +
			'  <td class="<%= objectiveClass %> tag-name" colspan="3"><%= tag %></td>' +
			'</tr>'
		),

		skill: _.template(
			'<tr>' +
			'  <td><div class="ctrl"><img data-tag-id="<%= id %>" class="delete-tag" src="images/Delete-icon.png"></div></td>' +
			'  <td class="<%= objectiveClass %> tag-name"><%= tag %></td>' +
			'  <td class="objective-name <%= objectiveClass %>"><%= objective %></td>' +
			'  <td class="topic-name <%= topicClass %>"><%= topic %></td>' +
			'</tr>'
		)
	}

	//=======================================================
	// tbody wrapper for tag list within a tag type.
	// Params: rows
	//=======================================================
	app.templates.tagGroup = _.template('<tbody><%= rows %></tbody>');

	//=======================================================
	// Table wrapper for tag list.  Used a table for this
	// because it makes formatting so much easier, and it
	// could be argued that the tags list actually is a table.
	// Params: rows
	//=======================================================
	app.templates.tagList = _.template(
		'<table id="tag-list" cellspacing="0" cellpadding="0"><%= rows %></table>'
	);

	//=======================================================
	// List: <div>[constructed list]...
	// Params: header, tagList
	//=======================================================
	app.templates.list = _.template(
		'<div class="header"><span><%= header %>:</span></div>' +
		'<%= tagList %>'
	);

	//=======================================================
	// A text message with a header. It's meant to be purely
	// informational. There is no startEdit class.
	//
	// Params: header, msg
	//=======================================================
	app.templates.msgWithHeader = _.template(
		'<span class="header"><%= header %>:</span><span><%= msg %></span>'
	);

	//=======================================================
	// Standards
	// Params: header, data
	//=======================================================
	app.templates.standards = _.template(
		'<div class="header"><span><%= header %>:</span>' +
		'<ul class="standards">' +
		'<% $.each(data, function(key, obj) {' +
		'        print("<li title=\'" + obj.description + "\'>" + obj.code + " (" + obj.type + ")</li>");' +
		'}) %>' +
		'</ul>'
	);

	//=======================================================
	// Text Input (resizable <textarea>)
	//=======================================================
	app.templates.textInput = _.template(
		'<div><span class="header stopEdit"><%= header %>:</span></div>' +
		'<textarea><%= value %></textarea>'
	);

	//=======================================================
	// Button displays
	//
	// Params: header, value
	//=======================================================
	app.templates.skillsButton = _.template(
		'<div><span class="header"><%= header %>:</span>' +
		'<button class="startEdit">Add skills</button></div>'
	);

	//=======================================================
	// Simple Text Input (fixed size field)
	//
	// Params: header, inpClass, value
	//=======================================================
	app.templates.simpleTextInput = _.template(
		'<div><span class="header stopEdit"><%= header %>:</span>' +
			'<input type="text" class="<%= inpClass %>" value="<%= value %>" />' +
		'</div>'
	);

	//=======================================================
	// True/False pulldown
	//=======================================================
	app.templates.trueFalse = _.template(
		'<span class="header"><%= header %>:</span>' +
		'<% if (!state) ' +
			'print("<select class=pulldown><option>False</option><option>True</option></select>");' +
		'else ' +
			'print("<select class=pulldown><option>False</option><option selected=selected>True</option></select>");' +
		'%>'
	);

	//=======================================================
	// Text displays
	//=======================================================
	app.templates.stepTitle = _.template(
		'<div><span id="stepTitle">Steps</span>' +
		'<button id="addStep">Add a step</button>' +
		'<button id="qOnly"><%= toggleButton %></button>' +
		'</div>'
	);

	//=======================================================
	// Text displays
	//=======================================================
	app.templates.stepTitleNoChanges = _.template(
		'<div><span id="stepTitle">Steps</span>' +
		'<button id="qOnly"><%= toggleButton %></button>' +
		'</div>'
	);

	//=======================================================
	// Header displayed before each step
	//=======================================================
	app.templates.stepHeader = _.template(
		'<div class="stepHeader ui-corner-all"><%= header %>:' +
			'<button id="delStep">Delete</button>' +
			'<button id="upStep">Move up</button>' +
			'<button id="dnStep">Move down</button>' +
			'<img class="stepRevert" src="images/undo-icon.png" />' +
		'</div>'
	);

	//=======================================================
	// Header displayed before each step, without any extra buttons
	//=======================================================
	app.templates.stepHeaderNoChanges = _.template(
		'<div class="stepHeader ui-corner-all"><%= header %>:' +
		'</div>'
	);

	//=======================================================
	// Formula display and button
	//=======================================================
	app.templates.formula = _.template(
		'<div class="topgap">' +
		'<span class="header"><%= header %>:</span>' +
		'<span class="info"><%= value %></span>' +
		'<button><%= text %></button>' +
		'</div>'
	);

	//=======================================================
	// Formula display without the button
	//=======================================================
	app.templates.formulaSimple = _.template(
		'<div class="topgap">' +
		'<span class="header"><%= header %>:</span>' +
		'<span class="info"><%= value %></span>' +
		'</div>'
	);

	//=======================================================
	// Line between steps
	//=======================================================
	app.templates.stepDivider = _.template(
		'<div class="breakFloat">&nbsp;</div>' +	// This 'deactivates' floats so the space between steps works properly
		'<hr class="stepPad"/>'
	);

	//=======================================================
	// Text editor with save button
	//=======================================================
	app.templates.editor = _.template(
		'<div class="header"><%= header %>:</div>' +
//		'<div class="richEdit"><%= value %></div>' +
		'<textarea class="richEdit"><%= value %></textarea>' +
		'<button>Done</button>'
	);

	//=======================================================
	// Text editor with save button
	//=======================================================
	app.templates.choiceEditor = _.template(
		'<textarea class="richEdit"><%= value %></textarea>' +
		'<button id="done">Done</button>'
	);

	//=======================================================
	// Review Pane
	//=======================================================
	app.templates.review = _.template(
/*
		'<div class="rightEdge">' +
			'<div align="right">' +
				'<button id="history">View History</button>' +
			'</div>' +
			'<div align="right">' +
				'<button id="comment">Add Comment</button>' +
			'</div>' +
		'</div>' +
*/
		'<div class="rightEdge">' +
				'<button id="menu">Menu</button>' +
		'</div>' +

		'<input class="pass" id="<%= id %>p" type="checkbox"/>' +
		'<label class="pass" for="<%= id %>p">Pass</label>' +
		'<input class="fail" id="<%= id %>f" type="checkbox"/>' +
		'<label class="fail" for="<%= id %>f">Fail</label>'
	);

	//=======================================================
	// Revert icon
	//=======================================================
	app.templates.revertIcon = _.template(
		'<div class="right">' +
			'<img class="revertIcon" src="images/undo-icon.png" />' +
		'</div>'
	);

	//=======================================================
	// Checklist: <ul> <tr><td><input><label>...
	//
	// Params: title, id, entries
	//=======================================================
	app.templates.checklist = _.template(
		'<div class="taglist">' +
		'<div class="listHeader stopEdit"><%= title %></div>' +
		'<ul class="category" id="<%= id %>">' +
		'<% $.each(entries, function(idx, entry) {' +
			'print("<li>" + entry + "</li>");' +
		'}); %>' +
		'</ul></div>'
	);

	//=======================================================
	// Checklist: <ul> <tr><td><input><label>...
	//
	// Params: id, entries
	//=======================================================
	app.templates.listWithTips = _.template(
		'<div class="taglist">' +
			'<div class="listHeader"><%= title %></div>' +
			'<ul class="category" id="<%= id %>">' +
			'<% $.each(entries, function(idx, entry) {' +
				"print('<li title=\"' + entry.help + '\">' + entry.text + '</li>');" +
			'}); %>' +
		'</ul></div>'
	);

	//=======================================================
	// Filtered list
	//
	// Params: title, listClass, id, entries
	//=======================================================
	app.templates.filteredList = _.template(
		'<span class="filterListTitle"><%= title %>:</span>' +
		'<input type="text" id="entry_filter" class="filterClass" />' +

		'<div class="<%= listItemsClass %>">' +
			'<ul id="inner-<%= id %>">' +
			'<% $.each(entries, function(idx, entry) {' +
				"print('<li class=\"entry\" data-key=\"'+entry.key+'\">' + entry.item + '</li>');" +
			'}); %>' +
			'</ul>' +
		'</div>' +

		'<button id="listCancel">Cancel</button>' +
		'<% if (typeof showClear !== "undefined" && showClear) %>' +
			'<button id="listClear">Clear</button>'
	);

	//=======================================================
	// Filtered list
	//
	// Params: title, listClass, id, entries
	//=======================================================
	app.templates.treeList = _.template(
		'<span class="filterListTitle"><%= title %>:</span>' +

		'<div class="listItems">' +
			'<ul id="<%= id %>" class="navigation">' +
			'<% $.each(entries, function(idx, obj) {' +
				"print('<li>' + obj.name);" +
				"if (obj.objectives.length > 0) {" +
					"print('<ul>'); " +
					"$.each(obj.objectives, function(objIdx, objective) {" +
						"print('<li class=\"entry\" data-objno=\"'+objective.objNo+'\">' + objective.name + '</li>'); " +
					"}); "+
					"print('</ul></li>'); " +
				"}" +
			'}); %>' +
			'</ul>' +
		'</div>' +

		'<button id="listCancel">Cancel</button>'
	);

	//=======================================================
	// Skill list
	//
	// Params: title, listClass, id, entries
	//=======================================================
	app.templates.skillsList = _.template(
		'<span class="filterListTitle"><%= title %>:</span>' +

		'<div class="secondaryListItems">' +
			'<ul id="<%= id %>">' +
			'<% $.each(entries, function(idx, entry) {' +
				"print('<li class=\"entry\">');" +
				"if (entry.checked) { " +
					"print('<input type=\"checkbox\" checked=\"checked\" value=\"'+entry.tag_id+'\">' + entry.name);" +
				"} else {" +
					"print('<input type=\"checkbox\" value=\"'+entry.tag_id+'\">' + entry.name);" +
				"}" +
				"print('</li>');" +
			'}); %>' +
			'</ul>' +
		'</div>' +

		'<button id="listOK">OK</button>' +
		'<button id="listBack">Back</button>' +
		'<button id="listCancel">Cancel</button>'
	);

	//=======================================================
	// Image: header, value, fail
	//=======================================================
	app.templates.image = _.template(
		'<div class="header"><span class="startEdit"><%= header %>:</span></div>' +
		'<div class="imageToOverlay" style="position:relative">' +
			'<img class="image" src="' +
				'<% print(app.getImageName(value)); %>" ' +
			'" />' +
//			'<% _.each(overlays, function() { %>'+
//			'<div class="overlay"></div>'+
//			'<% }) %>'+
		'</div>'
	);

	//=======================================================
	//
	//=======================================================
	app.templates.imageOverlayBlock = _.template('<div class="overlay"></div>');

	//=======================================================
	//=======================================================
	app.templates.headerOnly = _.template(
		'<span class="header"><%= header %>:</span>'
	);

	//=======================================================
	//=======================================================
	app.templates.imageOverlayCtrls = _.template(
		'<span class="header"><%= header %>:</span>' +
		'<div>' +
			'<button id="overlay-add">Add overlay</button>' +
			'<button id="overlay-refresh">Randomize</button>' +
		'</div>'
	);


	//=======================================================
	//=======================================================
	app.templates.imageOverlayFontSize = _.template(
		'<div id="font-edit">'+
			'<select name="font-size" id="font-size" size="5">'+
				'<option>Font Size</option>'+
				'<% _.each(sizes, function(s) { %>'+
					'<option style="font-size:<% print(s) %>"><% print(s) %></option>'+
				'<% }) %>'+
			'</select>'+
		'</div>'
	);

	//=======================================================
	//=======================================================
	app.templates.imageOverlayFontColor = _.template(
		'<div id="font-edit">' +
			'<select name="font-color" id="font-color" size="5">'+
				'<option>Font Color</option>'+
				'<% _.each(colors, function(c) { %>'+
					'<option style="color:<% print(c) %>"><% print(c) %></option>'+
				'<% }) %>'+
			'</select>'+
		'</div>'
	);

	//=======================================================
	//
	//=======================================================
	app.templates.imageOverlayContainer = _.template(
		'<div class="overlay-rows"></div>'
	);

	//=======================================================
	// Image overlay editor with save button
	//=======================================================
	app.templates.overlayEditor = _.template(
//		'<div class="richEdit"><%= value %></div>' +
		'<textarea class="richEdit"><%= value %></textarea>' +
		'<button class="overlay-edit-done">Done</button>'
	);

	//=======================================================
	//
	//=======================================================
	app.templates.overlayRow = _.template(
		'<div class="overlay-row">' +
			'<div class="overlay-field value startEdit"><%=app.prettyDisplay(value)%></div>' +
			'<span class="coords">(<input type="text" class="x-coord value" value="<%= x %>"/>, <input type="text" class="y-coord value" value="<%= y %>"/>)</span>' +
			'<button class="img-menu">Menu</button>' +
		'</div>'
	);

	//=======================================================
	//
	//=======================================================
	app.templates.overlayRowCompact = _.template(
		'<div class="overlay-row">' +
			'<span class="value"><%=app.prettyDisplay(value)%></span>' +
			'<span class="coords">(<%= x %>, <%= y %>), <%= size %>, <%= color %></span>' +
		'</div>'
	);

	//=======================================================
	// Text overlays that appear over images
	//
	// Params: text, left, top, size, color
	//=======================================================
	app.templates.imageOverlay = _.template(
		'<div class="image-overlay image-overlay-stopped" style="' +
				'left:<%= left %>px;' +
				'top:<%= top %>px;' +
				'font-size:<%= size %>;' +
				'color:<%= color %>;' +
				'">' +
			'<%= text %>' +
		'</div>'
	);

	//=======================================================
	// Bottom buttons
	//=======================================================
	app.templates.tabBottom = _.template(
		'<div>&nbsp;</div>' +
		'<div align="right">' +
			'<button id="validate">Validate</button>' +
			'<button id="cancel">Quit</button>' +
		'</div>'
	);

	//=======================================================
	// Tabs
	// Params: names
	//=======================================================
	app.templates.tabs = _.template(
		'<div id="tabs">' +
			'<ul>' +
				'<% $.each(names, function(idx, entry) { %>' +
					'<li><a href="#tab<% print(app.removeSpaces(entry)) %>"><%= entry %></a></li>' +
				'<% }); %>' +
			'</ul>' +

			'<% $.each(names, function(idx, entry) { %>' +
				'<div id="tab<% print(app.removeSpaces(entry)) %>"></div>' +
			'<% }); %>' +

		'</div>'
	);

	//=======================================================
	// Example variables
	// Params: vars
	//=======================================================
	app.templates.varExamples = _.template(
		'<div id="examples">' +
		'<b>Examples:</b>' +
			'<% $.each(vars, function(key, entry) { ' +
				'if (key)' +
					"print(\"<div class='varExample'>\" + key + \": \" + app.Math.round(entry, 10) + \"</div>\");" +
			' }); %>' +
		'</div>'
	);

	//=======================================================
	// Example variables (Short form)
	// Params: vars
	//=======================================================
	app.templates.varExamplesShort = _.template(
		'<div id="examples">' +
			'<b>Variables: </b> <%= vars %>' +
		'</div>'
	);

	//=======================================================
	// Step Split HTML
	// Params: q, a, btnID, instruct (instructions)
	//=======================================================
	app.templates.splitStep = _.template(
		'<div class="breakFloatSplit">&nbsp;</div>' +
		'<div id="split">' +
			'<div><%= instruct %></div><hr />' +
			'<div class="reWrapper">' +
			'<button class="reLeft" id="<%= btnID %>">Split the answer</button>' +
				'<div class="reLeft header">Step text:</div>' +
				'<div class="reRight value"><% print(app.highlightVars(q)) %></div>' +
//			'</div>' +

//			'<div class="reWrapper">' +
				'<div class="reLeft header">Answer:</div>' +
				'<div class="reRight value"><% print(app.highlightVars(a)) %></div>' +
			'</div>' +

			'<div class="breakFloatSplit">&nbsp;</div>' +
		'</div>'
	);

	//=======================================================
	// Modal popup window
	//=======================================================
	app.templates.popup = _.template(
		'<div id="popup" class="ui-corner-all"></div>'
	);

	//=======================================================
	// Change list table
	//=======================================================
	app.templates.diffTable = _.template(
		'<table id="diffTable">' +
			// Titles
			'<tr>' +
				'<th class="diffTable"><%= title1 %></th>' +
				'<th></th>' +
				'<th class="diffTable">' +
					'<%= title2 %>' +
					'<span id="older" class="diffChange">Older ></span>' +	// These show in reverse order (float:right)
					'<span id="newer" class="diffChange">< Newer</span>' +
				'</th>' +
			'</tr>' +
		'</table>'
	);

	//=======================================================
	// Change list entry
	//=======================================================
	app.templates.diffField = _.template(
		'<tr class="diffRow">' +
			'<td></td>' +		// Left
			'<td><img class="diffArrow" src="images/left-arrow.png" style="display:none" /></td>' +		// Column for arrow
			'<td></td>' +		// Right
		'</tr>'
	);

	//=======================================================
	// Change list entry
	//=======================================================
	app.templates.diffStep = _.template(
		'<tr class="diffRow">' +
			'<td><div class="stepHeader ui-corner-all">Step <%= idx %>:</div></td>' +
			'<td></td>' +
			'<td><div class="stepHeader ui-corner-all">Step <%= idx %>:</div></td>' +
		'</tr>'
	);

	//=======================================================
	// Change list entry
	//=======================================================
	app.templates.diffArrow = _.template(
		'<img class="diffArrow" src="images/left-arrow.png" />'
	);


})();
