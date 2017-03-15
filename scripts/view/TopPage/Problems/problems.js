//===========================================================================================
//===========================================================================================
;(function() {

	//=======================================================
	// View (and controllers)
	//=======================================================
	app.ProblemTab = app.PEView.extend({

		//---------------------------------------
		//---------------------------------------
		events: {
//			'click tr': 'clickRow',
			'click #addProblem': 'addProblem',
			'keydown #jumpInput': function(ev) {if (ev.which === 13) this.jump()},
			'click #jumpButton': 'jump'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			app.filterColumn = undefined;	// Disable filtering.  Filters are tied to specific queries, and that query can be changed here.

			this.problemQuery = new app.ProblemQuery();
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var that = this;
//			var data = this.prepData();

			this.$el.empty();

//			this.$el.append(app.templates.titlePadding());

			// Queries
			/*
			this.$el.append(app.templates.table({
				id: 'info',
				headClass: 'header infoHeader',
				header: 'Queries (click one to display the list)',
				tableClass: 'info',
				data: {
					columns: ['raw', 'raw'],
					headers: ['Type', 'Count'],
					data: data
				}
			}));
			*/

			// Create the outer box
			var container = $(app.templates.jumpBox()).appendTo(this.$el);

			// Jump to problem
			container.append(app.templates.jumpToProblem);

			// Create a problem
			container.append(app.templates.button({id:'addProblem', text: 'Create a new problem'}));

			// Problem query
			that.$el.append(that.problemQuery.render());

			return this.el;
		},

/*
		//---------------------------------------
		// Turn collection into data formatted for table display
		//---------------------------------------
		prepData: function() {
			var infoTable = [];
			this.collection.each(function(val, key) {
				infoTable.push([val.get('type'), val.get('count')]);
			});

			return infoTable;
		},

		//---------------------------------------
		// A table row was clicked
		//---------------------------------------
		clickRow: function(ev) {
			var row = this.$('tr').index(ev.currentTarget) - 1;
			if (row >= 0)
			{
				app.quickCheckChapterId = null; // make sure chapter selection can't be used with this sort of row.
				app.queryType = this.collection.at(row).get('type');
				app.queryID = this.collection.at(row).get('filter');
				app.changeContext('problemList');
			}
		},
*/

		//---------------------------------------
		//---------------------------------------
		addProblem: function() {
			// Clear out query IDs so that the Quit button inside edit mode will return here
			app.queryID = null;
			app.quickCheckChapterId = null;

			// DG: Attempt to wipe out the old problem, particularly the steps.  It seems to work!
			// Without this, backbone-relational throws an error when loading the same problem (load, quit, create new, quit, load original)
			app.curProblem && app.curProblem.clear();
			app.tagList && app.tagList.clear();

			app.curProbID = undefined;
			app.changeContext('edit');
		},

		//---------------------------------------
		// Jump to a problem
		//---------------------------------------
		jump: function() {
			var probID = this.$('#jumpInput').val();
			probID = parseInt(probID, 10);

			if (!isNaN(probID) && probID > 0)
			{
				// Clear out query IDs so that the Quit button inside edit mode will return here
				app.queryID = null;
				app.quickCheckChapterId = null;

				app.curProbID = probID;
				app.changeContext('edit');
			}
		},

		//---------------------------------------
		//---------------------------------------
		close: function()
		{
			this.problemQuery.close();
		}
	});

})();
