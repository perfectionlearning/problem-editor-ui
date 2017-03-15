//=======================================================
// Control to split answers in steps
//=======================================================
;(function() {

	//=======================================================
	//=======================================================
	app.SplitStepView = app.PEView.extend({
		field: 'a',

		//---------------------------------------
		//---------------------------------------
		events: {
			'click #doSplit': 'splitIt'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			this.render = _.bind(this.render, this);
			this.model.on('change:' + this.field, this.render);	// This needs to be unbound to prevent zombies
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var that = this;
			this.$el.empty();

			var data = this.splitRows();

			// Only display if there is something to split, and the user has the necessary permissions.
			if (data[0] && app.checkPermission(app.userGroups, 'splitSteps'))
				this.$el.append(app.templates.splitStep({
					q: app.multiOut(data[0]),
					a: app.multiOut(data[1]),
					btnID: "doSplit",
					instruct: "The answer contains several equations.  It is better to place equations that aren't part of the answer in the Step Text field.",
				}));

			return this.el;
		},

		//---------------------------------------
		//---------------------------------------
		splitRows: function() {
			var data = this.model.get(this.field);

			// Search for tables
			var tableRegEx = /<mtable[^>]*>(.+?)<\/mtable>/g;
			var q = "";

			// Note that this will not work if there are tables within tables!
			// Detect embedded tables, and if any are found just get out of here.
			var deepTables = /<mtable[^>]*>.*?(<mtable[^>]*>|<\/mtable>)/.exec(data);
			if (deepTables && deepTables.length > 0 && deepTables[1].substring(0,2) === '<m')
				return [q, data];

			// For each table
			var a = data.replace(tableRegEx, function(all, inner) {

				// Count the number of rows in this table
				var rowRegEx = /<mtr[^>]*>(.+?)<\/mtr>/g;
				var rows = inner.match(rowRegEx);
				if (!rows) return all;		// Safety code

				var tbl = all;	// Default to everything

				// If there is more than one row, use the last row as the answer and the rest as the question
				// If the problem has already been split, don't do it again
				var cnt = rows.length;
				if (!q && cnt > 1)
				{
					// Pull off the last row.
					// It's still wrapped in a <mtr> so we need to remove that unless we keep the <mtable> as well.
//					tbl = '<math>' + rows.pop().replace(rowRegEx, '$1') + '</math>';
					tbl = rows.pop().replace(/<mtr[^>]*><mtd>(.+?)<\/mtd><\/mtr>/g, '$1');
//					tbl = '<math><mtable>' + rows.pop() + '</mtable></math>';	// We have columns (<mtd>) we just make it a table

					var idx = 0;
					q = all.replace(rowRegEx, function(rowAll) {
						if (++idx === cnt)
							return '';

						return rowAll;
					});

					q = '<math>' + q + '</math>';	// Wrap the question
				}

				return tbl;
			});

			return [q, a];
		},

		//---------------------------------------
		//---------------------------------------
		splitIt: function() {
			var data = this.splitRows();

			this.model.set({
				q: data[0],
				a: data[1]
			});

			this.render();
		},

		//--------------------------
		// Close routine.  Unbind model events.
		//--------------------------
		close: function() {
			this.model.off(null, this.render);
		}

	});

})();
