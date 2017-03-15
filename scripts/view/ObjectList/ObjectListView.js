//=======================================================
// View (and controllers)
//=======================================================
;(function() {

	app.ObjectListView = app.PEView.extend({

		outputColumns: {
			name: { head: 'Name', type: 'link', getter: 'object_name'},
			type: { head: 'Type', type: 'raw', getter: function(val){return app.ObjectTypes[val.type]}, filter: 'type'},
			status: { head: 'Status', type: 'styled', getter: function(val){
				if (app.StatusList[val.status])
					return app.StatusList[val.status].text
				else
					fw.debug("UNKNOWN: " + val.status);
					return '';
				}, filter: 'status'},
			chapter: { head: 'Ch', type: 'raw', getter: 'chapter_num', filter: 'chapter'},
			section: { head: 'Sec', type: 'raw', getter: 'section_num'},
			note: { head: 'Note', type: 'raw', getter: 'notes'},
			reviewer: { head: 'Reviewer', type: 'raw', getter: 'last_reviewer'},
			when: { head: 'When', type: 'raw', getter: 'datetime'},
			assignTo: {head: 'Owner', type: 'raw', getter: 'assigned_to', filter: 'assignTo'}
		},

		//---------------------------------------
		//---------------------------------------
		events: {
			'click #home': 'goHome',
			'mouseover th': 'showFilter',
			'mouseout th': 'hideFilter',
			'click li': 'filterData',
			'change #toggleAll': 'toggleAll',
			'click #bulkStatus': 'setStatus',
			'click #bulkAssign': 'setAssignment',
			'click #objectList td:nth-child(n+3)': 'histPopup',
			'click .closeStatus': 'cancelStatus',
			'click td .tableLink': 'launchBook',
			'click #skipToEnd': 'scrollToBottom'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			// Create bars
			app.title.text = this.getTitle();
			app.title.hasHome = true;
			app.title.hasLogout = true;
			app.title.update();

			// this causes initialize in app.ReviewView to be executed.
			this.reviewView = app.ReviewTool && new app.ReviewView();

			this.histData = this.buildHistData();

			this.tableData = this.buildData();

			this.statusList = _.pluck(app.StatusList, 'text');

			this.render = _.bind(this.render, this);
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var that = this;
			this.$el.empty();

			// "Skip to end" button
			this.$el.append(app.templates.fakeLink({id: 'skipToEnd', text: 'Skip to end'}));

			// Main contents
			this.$el.append(fw.makeTable('objectList', that.tableData));

			// Restore the previously selected filter
			if (defined(app.filterColumn) && app.filterValue !== 'Remove Filter')
				that.doFilter(1);

			// Bulk options
			var container = $(app.templates.container({id:'bulkOps'})).appendTo(this.$el);
			container.append(app.templates.textClass({cls: 'queryHeader', text: 'Modify all checked objects'}));
			container.append(app.templates.bulkChange({id: 'bulkStatus', header: 'Set Status', entries: this.statusList}));
			container.append(app.templates.bulkChange({id: 'bulkAssign', header: 'Set Owner', entries: app.userList.get('list')}));

		},

		buildHistData: function() {
			var data = this.model.get('data');

			// Build list of data to grab history for each row.
			var histData = [];
			$.each(data, function(idx, val) {
				histData.push({
					bookId: app.queryParams && app.queryParams.book && app.queryParams.book[0],
					type: val.type,
					name: val.object_name
				});
			});

			return histData;
		},

		//---------------------------------------
		// Create the data object that the table module needs
		// Use this.outputColumns for naming, styling, and data access.
		// Selectively filter out columns made redundant by the current query.
		//---------------------------------------
		buildData: function() {
			var data = this.model.get('data');

			var headers = ['<input type="checkbox" id="toggleAll">'];
			var columns = ['check'];
			var getters = [alwaysTrue];

			$.each(this.outputColumns, function(name, col) {
				// Skip columns that are redundant
				if (!col.filter || app.queryParams[col.filter].length < 1)
				{
					headers.push(col.head);
					columns.push(col.type);

					// Add a factory function to extract and optionally format the correct data
					if (typeof(col.getter) === "string")
						getters.push(function(obj){return obj[col.getter]});
					else
						getters.push(col.getter);
				}
			});

			// Hopefully this isn't too slow.  It uses factory functions for each cell in the entire grid!
			var grid = data.map(function(val) {
				var out = [];
				$.each(getters, function(idx, func) {
					out.push(func(val));
				});

				return out;
			});

			// And finally, construct a style map that allows a single column to be color-coded (status, in this case)
			var styleMap = {};
			$.each(app.StatusList, function(idx, val) {
				styleMap[val.text] = val.style + ' hist-popup';
			});

			return {
				headers: headers,
				columns: columns,
				data: grid,
				noSanitize: true,
				styleMap: styleMap
			};
		},

		//---------------------------------------
		// Build the top status bar title based on the query
		//---------------------------------------
		getTitle:function() {
			var out = [];
//			var out = "Query Results for ";

			var book = app.bookList.find(function(val){return val.get('id') === app.queryParams.book[0]});
			out.push(book.get('name'));

			// Add the chapter, if specified
			if (app.queryParams.chapter.length > 0)
			{
				var chapter = _.find(book.get('chapters'), function(val){return val.id === app.queryParams.chapter[0]});
				out.push('Ch' + chapter.num + ': ' + chapter.name);
			}

			// Add the object type, if specified
			if (app.queryParams.type.length > 0)
				out.push(app.ObjectTypes[app.queryParams.type[0]]);

			// Add the status, if specified
			if (app.queryParams.status.length > 0)
				out.push(app.StatusList[app.queryParams.status[0]].text);

			// Add the owner, if specified
			if (app.queryParams.assignTo.length > 0)
				out.push(app.queryParams.assignTo[0]);

			return out.join(' -- ');
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
		histPopup: function(ev) {
			ev.preventDefault();
			var that = this;

			var row = this.$('tr').index($(ev.currentTarget).parent()) - 1;
			var bookId = app.queryParams && app.queryParams.book && app.queryParams.book[0];
			var reviewObjectType = this.histData[row].type;
			var reviewObjectLookup = this.histData[row].bookId + '_' + this.histData[row].name;
			reviewObjectLookup = app.convertEntities(reviewObjectLookup); // take care of apostrophe

			// @FIXME/rt  This section shouldn't be in this view but in the Review view.
			//	Probably use an event to fire it.
//			fw.eventPublish('retrievedHistory', { el: ev.currentTarget, reviewObjectType: reviewObjectType, reviewObjectLookup: reviewObjectLookup });

/*
			var deferredHist = app.reviews.getHistory(reviewObjectType, reviewObjectLookup);

			deferredHist.done(function(hist) {
				var histData = app.processHistory(hist);
				var data = { status: 'History', hist: histData.formattedHistory };
				var code = app.templates.reviewOptionPopup.history(data);
				var historyWrapper = app.templates.queryReviewWrapper({ code: code });
				$(historyWrapper).draggable();
				// @FIXME/rt.  Shouldn't be referencing an element directly.
				$('.queryReviewWrapper', ev.currentTarget).remove();
				$(ev.currentTarget).append(historyWrapper);
				$('.positioner').draggable({handle:'.statusHeader'});

			});
*/
		},

		cancelStatus: function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			$(ev.currentTarget).parents('.reviewPopupWrapper').hide();
		},

		//---------------------------------------
		//---------------------------------------
		toggleAll: function(ev) {
			// Don't try this at home.  Toggle all of the checkboxes.
			// jQuery voodoo and direct DOM manipulation is generally frowned on.
			// The other alternative would be to re-render the table, but that is ridiculously slow.
			$('.multi>input').prop('checked', ev.currentTarget.checked);
		},

		//---------------------------------------
		//---------------------------------------
		getCheckedItems: function() {
			// Start by determining which objects are checked
			var objs = [];
			var data = this.model.get('data');
			var rows = this.$('tr');		// Cache jQuery collection

			$('.multi>input:checked').each(function() {
				var idx = rows.index(this.parentNode.parentNode) - 1;	// Awkward!  Assumes too much HTML knowledge (double parentNode)
				objs.push(data[idx].obj_id);
			});

			return objs;
		},

		//---------------------------------------
		//---------------------------------------
		doBulkAssign: function(status, owner, objs)
		{
			app.bulkChange.save({
				status: status,
				notes: '',
				assigned_to: owner,
				obj_ids: objs
			}, {
				error: function() {alert('Failed to change status!  Try again later.')},
				success: function() {app.changeContext('objectList')}		// Reset this context because the list might have changed
			});
		},

		//---------------------------------------
		//---------------------------------------
		setStatus: function() {
			var objs = this.getCheckedItems();

			// If nothing is checked, don't do anything
			if (objs.length < 1)
				return;

			// Now figure out what status we want
			var text = $('#bulkStatus_list').val();
			var status;

			// Turn this into a function.  I have needed it several times now.
			$.each(app.StatusList, function(key, val) {
				if (val.text === text)
				{
					status = key;
					return false;	// break
				}
			});

			// Finally, perform the operation
			this.doBulkAssign(status, '', objs);
		},

		//---------------------------------------
		//---------------------------------------
		setAssignment: function() {
			var objs = this.getCheckedItems();

			// If nothing is checked, don't do anything
			if (objs.length < 1)
				return;

			// Now figure out what status we want
			var owner = $('#bulkAssign_list').val();

			// Finally, perform the operation
			this.doBulkAssign('', owner, objs);
		},

		//---------------------------------------
		//---------------------------------------
		goHome: function() {
			app.changeContext('top');
		},

		//---------------------------------------
		//---------------------------------------
		launchBook: function(ev) {
			var objName = ev.currentTarget.text;
			var book = window.open(app.bookLaunchUrl + objName, "KBBOOK");
			book.focus();
		},

		//---------------------------------------
		//---------------------------------------
		scrollToBottom: function() {
			window.scrollTo(0,99999999);
		}
	});

	//=======================================================
	// Simple routine for factory function-based table construction
	//=======================================================
	function alwaysTrue()
	{
		return true;
	}

})();