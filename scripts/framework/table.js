//===========================================================================================
// Table Widgets
//
// Convert cell wrappers to use templates!
//===========================================================================================
(function() {

	//=======================================================
    //=======================================================
    // rt20121022:  change parameters:  type and data are received from makeTable as properties of one object.
    //                                  just pass the one object and get the desired properties in this function.
    function makeHeader(obj, i, id)
    {
        var type = obj.columns[i];  // formerly a parameter received from makeTable
        var data = obj.headers[i];  // formerly a parameter received from makeTable
        if (obj.filter_keys)
            var key = obj.filter_keys[i];
        else
            key = '';

        if (type.toLowerCase() === 'flex')
            var cellData = fw.templates.tableAddButton({id:id});
        else
            cellData = data || '';

        if (obj.filter_options && obj.filter_options[i] && obj.filter_options[i].length > 0)
            var filter = $.dropdown(obj.filter_options[i]);
        else
            filter = '';

        return fw.templates.tableColHeader({ key: key, data: cellData + filter, id:id+'-h'+i });
    }

	//=======================================================
	//=======================================================
	function makeCell(argObj)
	{
        var cellData;
		// Turn this into an object!
		var data = argObj.data;

		if (!argObj.obj.noSanitize)
			data = sanitize(data);

		switch (argObj.type.toLowerCase())
		{
			case 'flex':
                cellData = fw.templates.tableDelButton({ id: argObj.id });
                break;

			case 'textinput':

			case 'numinput':
                var fieldSize = argObj.obj.inpWidth ? 'size="' + argObj.obj.inpWidth + '"' : '';
                cellData = fw.templates.tableInput({ data: data, width: fieldSize });
                break;

			case 'richedit':
                cellData = fw.templates.tableRichEdit({ data: data === '' ? '&nbsp;' : data });
                break;

			case 'radio':
                cellData = fw.templates.tableRadioInput({ id: argObj.id });
                break;

			case 'check':
                cellData = fw.templates.tableCheckInput({ id: argObj.id });
                break;

			case 'truefalse':
                cellData = fw.templates.tablePlainDataCell({ data: data ? 'True' : 'False' });
                break;

			case 'tfinput':
                cellData = fw.templates.tableTrueFalseInput({ selected: data ? ' selected' : '' });
                break;

			case 'showcheck':
				if (data)
					cellData = fw.templates.tableShowChecked({ data: data });
				else
					cellData = fw.templates.tablePlainDataCell({ data: '&nbsp;' });
                break;

            case 'link':
                cellData = fw.templates.tableMakeLink({ data: data });
                break;

			case 'styled':
				if (argObj.obj.styleMap[data])
					cellData = fw.templates.tableStyled({ data: data, style: argObj.obj.styleMap[data] });
					break;
				// else fall through to default.  Don't add anything under this case.  THIS IS BAD PRACTICE!

			case 'ddseq':
				cellData = fw.templates.tableDDSeq({data: data});
				break;

			case 'ddtype':
				cellData = fw.templates.tableDDType({types: ['--', 'Answer', 'Equation item', 'Operator', 'Text'], data: data});
				break;

			default:
				if (!defined(data) || data === '')
					data = '&nbsp;';
                cellData = fw.templates.tablePlainDataCell({ data: data});
		}
        return cellData;
	}


	//=======================================================
	//=======================================================
	// Header wrappers, Headers, data wrap routines, data
	framework.prototype.makeTable = function(id, obj, tblClass)
	{
        var colHeaders = [];
        var row = [];
		var cols = obj.columns.length;
        var rows = [];
        var cells = [];

		if (obj.headers)
		{
			for (var i = 0; i < cols; i++)
			{
                // Send entire obj to makeHeader, not just type and data properties.
                colHeaders.push(makeHeader(obj, i, id));
            }

            rows.push(fw.templates.tableRow({ cells: colHeaders.join('') }));
		}

		for (var r = 0; r < obj.data.length; r++)
		{
			for (var c = 0; c < cols; c++)
				cells.push(makeCell({
					type: obj.columns[c],
					data: obj.data[r][c],
					id: id,
					row: r,
					col: c,
					obj: obj
				}));

			var row = fw.templates.tableRow({ cells: cells.join('') });
            rows.push(row);
            cells = [];
		}

        return fw.templates.tableBody({ id: id, tblClass: tblClass, rows: rows.join('') });
	}


	//=======================================================
	//
	//=======================================================
	framework.prototype.tableGetChecked = function(id)
	{
		var out = -1;
		$('#' + id).find('.multi input').each(function(idx, val) {
			if (this.checked)
				out = idx;
		});

		return out;
	}

	//=======================================================
	//
	//=======================================================
	framework.prototype.tableSetChecked = function(el, idx)
	{
		if (typeof(idx) === 'number')
			idx = [idx];

		el.find('input[type="radio"],input[type="checkbox"]').each(function(i, val) {
			if (idx.indexOf(i) !== -1)
				this.checked = true;
		});
	}

	//=======================================================
	//
	//=======================================================
	framework.prototype.tableToggleChecked = function(el, idx)
	{
		if (typeof(idx) === 'number')
			idx = [idx];

		el.find('input[type="radio"],input[type="checkbox"]').each(function(i, val) {
			if (idx.indexOf(i) !== -1)
				this.checked = !this.checked;
		});
	}

	//=======================================================
	//=======================================================
	framework.prototype.tableValues = function(id)
	{
		var out = [];
		$('#' + id).find('tr').each(function(){
			var row = [];
			$(this).find('input[type="text"]').each(function(){
				row.push($(this).val());
			});
			if (row.length > 0)	// Ignore the header row
				out.push(row);
		});

		return out;
	}

	//=======================================================
	//=======================================================
	function sanitize(string)
	{
		// All kinds of values come through here, not just strings.
		if (typeof(string) !== 'string')
			return string;

		var escaped = string;
		var findReplace = [[/&/g, "&amp;"], [/</g, "&lt;"], [/>/g, "&gt;"], [/"/g, "&quot;"]]

		$.each(findReplace, function(idx, val) {
			escaped = escaped.replace(val[0], val[1]);
		});

		return escaped;
	}

	//=======================================================
	//=======================================================
	framework.prototype.singleColumn = function(list)
	{
		return  $.map(list, function(val) {
			return [[val]];		// There should only be one pair of brackets, but .map is dumping one for some reason
		});
	}

	//=======================================================
	// Creates valid header and data lists from header and data objects
	// IN:
	//	header: {dataField:headerName}
	//	data: [{dataField1:data,...}]
	//=======================================================
	framework.prototype.tablePrepData = function(headIn, dataIn)
	{
		var out = {
			columns: [],            // 'link' or 'raw'
			headers: [],            // Column header text
            filter_keys: [],        // Column header keys / tags (e.g., 'subject', 'last_editor')
            filter_options: [],     // Unique values in column
			data: []                // Grid of table values
		};

		var keys = [];

		// Get columns, data keys
		$.each(headIn, function(idx, val) {
			out.headers.push(val);
			keys.push(idx);

			// SERIOUSLY?!
//            if (idx === 'last_editor')
//                out.columns.push('link');
//            else
                out.columns.push('raw');

            var unique = _.compact(_.uniq(_.pluck(dataIn, idx)));
            out.filter_options.push(unique);
        });
        out.filter_keys = keys;

		// Create data entries
		$.each(dataIn, function(dataIdx, dataVal) {
			var entry = [];
			$.each(keys, function(idx, val) {
				entry.push(dataVal[val]);
			});

			out.data.push(entry);
		});

		return out;
	}

})();
