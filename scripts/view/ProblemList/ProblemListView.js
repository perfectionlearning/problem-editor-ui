//=======================================================
// View (and controllers)
// This was originally in ProblemList.js; however, with the addition of the Quick Check queries,
// it seemed desirable to make this View available for the Problem Sets list and the Quick Check
// problems list, which use different models than the original problem list.
// Rather than have three nearly identical copies of this View, local to each of the app.Views objects,
// this ProblemListView object was added to the app namespace so as to be available to each of the
// views that's basically a tabular list.
//=======================================================
;(function() {
	app.ProblemListView = app.PEView.extend({

		headerCols: ['Problem ID'],

		//---------------------------------------
		//---------------------------------------
		events: {
			'mouseover th': 'showFilter',
			'mouseout th': 'hideFilter',
			'click li': 'filterData',
			'click tr': 'clickRow',
			'click #home': 'goHome',
			'click td .tableLink': 'goHistory'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			// Create bars
			app.title.text = app.queryType;
			app.title.hasHome = true;
			app.title.hasLogout = true;
			app.title.update();

			this.render = _.bind(this.render, this);
			this.model.bind('change', this.render);    // This needs to be unbound manually if the view is ever destroyed!
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var that = this;
			this.$el.empty();

			var data = this.extractData();

			// Main contents
			this.$el.append(fw.makeTable('probList', data));
			if (defined(app.filterColumn) && app.filterValue !== 'Remove Filter')
				that.doFilter(1);
		},

		//---------------------------------------
		//---------------------------------------
		extractData: function() {
			var fields = this.model.get('fields');
			var data = this.model.get('data');
			// receive href for retrieving quick check data when it becomes available.
//			var href = this.model.get('href');

			var tblData = fw.tablePrepData(fields, data);
			this.customizeTableData(tblData);

			if (fields)
				return tblData;
			else
				return {columns: [], headers: [], filter_keys: [], filter_options: [], data: []};
		},

		//---------------------------------------
		// Make some mods to the auto-generated table data
		//---------------------------------------
		customizeTableData: function(data) {
			data.noSanitize = true; // Set this so HTML is rendered rather than sanitized in the Question column.

			// Add the "link" style to the "last editor" column
			var lastEditIdx = data.filter_keys.indexOf('last_editor');
			data.columns[lastEditIdx] = "link";

			// Ignore clicks within the Problem ID column.  This allows the problem ID to be highlighted
			// and copied.  We needed a way to paste the data into a spreadsheet.
			if (this.options.selectProblemID)
			{
				var idIdx = data.filter_keys.indexOf('id');
				this.ignoreColumn = idIdx;
			}
		},


		//---------------------------------------
		//---------------------------------------
		// rt20121023
		showFilter: function(ev) {
			$('th ul').hide();
			$(ev.currentTarget).find('ul').show();
		},

		//---------------------------------------
		//---------------------------------------
		// rt20121023
		hideFilter: function(ev) {
			$('th ul').hide();
		},

		//---------------------------------------
		// @FIXME/dg: Optimize
		//---------------------------------------
		// rt20121022
		filterData: function(ev) {
			var $cur = $(ev.currentTarget);
			var ndx = $cur.index();
			app.filterValue = $cur.html();
			app.filterColumn = $cur.closest('th').index();

			this.doFilter(ndx);
			this.hideFilter();
		},

		//---------------------------------------
		//---------------------------------------
		doFilter: function(ndx) {
			$('#probList>tbody>tr').show();		// Show anything that was hidden (clear the old filter)
			$('#probList th').removeClass('filter');	// Remove coloring from all headers (clear the old filter)

			// ndx > 0 means the selected item is not the one to Remove Filter.
			if (ndx > 0) {
				// Change the column header to show that it is filtered
				$('#probList-h' + app.filterColumn).addClass('filter');

				// Select rows in which the column being filtered does not contain the filter value,
				// and hide those rows.
				$('#probList>tbody>tr').each(function() {
					var node = $(this).children()[app.filterColumn];
					var text = node.textContent;
					if (node.nodeName !== 'TH' && text !== app.filterValue)
						$(this).hide();
				});
			}
		},

		//---------------------------------------
		// clickRow designed to process row clicks for problem list and problem set list tables.
		// Row id and view context differ depending on the data, so those are set in the model.
		//---------------------------------------
		clickRow: function(ev) {
			var row = this.$('tr').index(ev.currentTarget) - 1;
			if (row < 0)
				return;

			// Ignore clicks within the Problem ID column.  This allows the problem ID to be highlighted
			// and copied.  We needed a way to paste the data into a spreadsheet.
			if (this.options.selectProblemID)
			{
				var column = $(ev.target).closest('td').index();	// Target only works if you click a <td>
				if (column === this.ignoreColumn)
					return;
			}

			// get model-specific idAttribute and context, so this view can accommodate multiple
			var idAttribute = this.model.idAttribute || 'id';
			var context = this.model.context || 'edit';
			var id = this.model.get('data')[row][idAttribute];
			if (this.model.keepThisId) {
				app.queryID = null; // set queryID to null so that the Quit button will not attempt to use it to return to previous page.
				app.quickCheckChapterId = id;
			}

			app.curProbID = id;
			app.changeContext(context);
		},

		//---------------------------------------
		//---------------------------------------
		goHome: function() {
			app.changeContext('top');
		},

		//---------------------------------------
		//---------------------------------------
		goHistory: function(ev) {
			ev.stopPropagation();
			var row = this.$('tr').index(ev.currentTarget.parentNode.parentNode) - 1;
			if (row < 0)
				return;

			var id = this.model.get('data')[row].id;
			app.curProbID = id
			app.changeContext('history');
		}

	});

})();