//===========================================================================================
// Templates used to render framework-specific HTML code
//===========================================================================================
(function() {
	fw.templates || (fw.templates = {});

	//=======================================================
	// tableBody (from table.js): id, tblClass, rows
	//=======================================================
    fw.templates.tableBody = _.template(
        '<table id="<%= id %>" class="<%= tblClass %>"><%= rows %></table>'
    );

	//=======================================================
	// tableRow (from table.js): cells
	//=======================================================
    fw.templates.tableRow = _.template(
        '<tr><%= cells %></tr>'
    );

	//=======================================================
	// tableColHeader (from table.js): key, data, id
	//=======================================================
    fw.templates.tableColHeader = _.template(
        '<th id="<%= id %>" data-filter="<%= key %>"><%= data %></th>'
    );

	//=======================================================
	// tableAddButton (from table.js): id
	//=======================================================
    fw.templates.tableAddButton = _.template(
		'<input type="button" value="Add" id="<%= id %>Add"/>'
	);

	//=======================================================
	// tableDelButton (from table.js): id
	//=======================================================
    fw.templates.tableDelButton = _.template(
        '<td><input type="button" value="Delete" class="<%= id %>Del"/></td>'
	);

	//=======================================================
	// tableInput (from table.js): data, width
	//=======================================================
    fw.templates.tableInput = _.template(
        '<td class="text-input"><input type="text" <%= width %> value="<%= data %>"/></td>'
	);

	//=======================================================
	// tableRichEdit (from table.js): data
	//=======================================================
    fw.templates.tableRichEdit = _.template(
//        '<td class="editme"><div contenteditable="true"><%= data %></div></td>'
        '<td class="editme"><div class="clearme"><%= data %></div></td>'
	);

	//=======================================================
	// tableRadioInput (from table.js): id
	//=======================================================
    fw.templates.tableRadioInput = _.template(
        '<td class="multi"><input type="radio" name="<%= id %>"/></td>'
	);

	//=======================================================
	// tableCheckInput (from table.js): id
	//=======================================================
    fw.templates.tableCheckInput = _.template(
        '<td class="multi"><input type="checkbox" name="<%= id %>"/></td>'
	);

	//=======================================================
	// tablePlainDataCell (from table.js): data
	//=======================================================
    fw.templates.tablePlainDataCell = _.template(
        '<td><%= data %></td>'
    );

	//=======================================================
	// Styled data (from table.js): data, style
	//=======================================================
    fw.templates.tableStyled = _.template(
        '<td class="<%= style %>"><%= data %></td>'
    );

	//=======================================================
	// tableTrueFalseInput (from table.js): selected
	//=======================================================
    fw.templates.tableTrueFalseInput = _.template(
        '<td><select class="pulldown"><option>False</option><option<%= selected %>>True</option></select></td>'
    );

	//=======================================================
	// tableshowChecked (from table.js):
	//=======================================================
    fw.templates.tableShowChecked = _.template(
        '<td><input type="checkbox" checked="checked"/></td>'
    );

	//=======================================================
	// tableshowChecked (from table.js):
	//=======================================================
    fw.templates.tableMakeLink = _.template(
        '<td><a class="tableLink"><%= data %></a></td>'
    );

})();
