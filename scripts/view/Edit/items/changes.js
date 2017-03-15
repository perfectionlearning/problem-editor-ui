//=======================================================
// Compares two different versions
//=======================================================
;(function() {

	//=======================================================
	//=======================================================
	app.ChangesView = app.PEView.extend({
		state: 'history',

		showAll: true,
		showDiffText: "Show differences only",
		showAllText: "Show everything",
		revertText: "Revert all changes",

		// List of views (data-handling only) to include in the table.
		// These are in display order.
		// As we add fields to the problem editor, we need to ensure they are added here as well.
		viewList: [
			'Prefix',
			'Question',
			'QImage',
			'QImageEdit',

			'AnswerType',
			'Answer',
			'Equivalence',

			'QVars',
			'Constraint',

			'ChapterID',
			'MultiHint',
			'WBAnywhere',
			'Diff',
			'Skill',
			'Comment',

			'TagList',

			'!Steps'
		],

		stepViewList: [
			'StepPrompt',
			'StepText',
			'AnswerType',
			'Answer',
			'Equivalence',
			'Hint',
			'WBAnywhere',
			'TagList'
		],

		//---------------------------------------
		//---------------------------------------
		events: {
			'click #toggleDiff': 'toggleDiff',
			'click #revertAll': 'revertAll',
			'click .diffArrow': 'copyField',
			'click #newer': 'newerProblem',
			'click #older': 'olderProblem',
			'change #revList': 'setRevision'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			_.bindAll(this, 'gotHistory', 'historyFail', 'gotTarget', 'targetFail', 'copyField', 'enableButtons', 'doRevertAll', 'setRevision');

			this.model.on('change', this.rebuild, this);
			this.model.on('stepChange', this.rebuild, this);
			this.views = [];
			this.targetProb = new app.Question();

			// Do a background fetch of this problem's history
			// Should this be here? It may also be used by a history tab.
			if (app.curProbID)
				app.problemHistory.fetch().done(this.gotHistory).fail(this.historyFail);
			else
				this.state = 'noProblem';
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			// Display our current async status and early exist if necessary.
			if (this.showStatus())
				return this.el;

			if (this.views.length)
				this.closeViews();

			this.$el.empty();

			// Display the global options
			this.$el.append(app.templates.button({id:'toggleDiff', text: this.showDiffText}));
			this.$el.append(app.templates.button({id:'revertAll', text: this.revertText}));
			this.$('button').prop('disabled', true);

			// Create the table container -- Keep out of the DOM until the last moment for speed
			var revisions = this.getRevisions();
			var curIdx = app.problemHistory.length - this.revIdx - 1;
			var pulldown = app.templates.simplePulldown({id: 'revList', entries: revisions, selection: curIdx});
			var tbl = $(app.templates.diffTable({title1: "Current", title2: pulldown}));

			// Add entries to the change list table
			this.renderTable(tbl);

			app.jaxify(this.$el, "enableButtons", this);

			this.handleMode();
			this.updateButtons();

			return this.el;
		},

		//---------------------------------------
		//---------------------------------------
		getRevisions: function()
		{
			var out = [];

			app.problemHistory.each(function(val){
				out.unshift(val.get('timestamp_pst') + ' (' + val.get('username') + ')');
			});

			return out;
		},

		//---------------------------------------
		//---------------------------------------
		enableButtons: function()
		{
			this.$('button').prop('disabled', false);
		},

		//---------------------------------------
		// Construct the entries for the change list table
		//---------------------------------------
		renderTable: function(tbl)
		{
			var that = this;

			// Step through views, creating each one twice (once per model)
			$.each(that.viewList, function(idx, name) {

				if (name === '!Steps')	// Make more generic
					that.renderSteps(tbl)
				else
					that.renderView(tbl, name, that.model, that.targetProb);
			});

			// Prevent edit mode!
			tbl.find('.startEdit').removeClass('startEdit');

			// Add the table to the view
			this.$el.append(tbl);
		},

		//---------------------------------------
		//---------------------------------------
		renderView: function(container, name, model1, model2, index)
		{
			// Create a new row
			var line = $(app.templates.diffField());

			// Fill in the left and right sides
			var curVal = model1 ? this.formatContent(name, model1, model1, line.children().first(), index) : this.noContent();
			var oldVal = model2 ? this.formatContent(name, model2, model2, line.children().last(), index) : this.deleteContent( line.children().last());

			// Handle differences
			if (!app.objectCompare(curVal, oldVal))
			{
				line.addClass('isDifferent');

				// I think the indices are inverted, but it really doesn't matter
				var lView = this.views[this.views.length-1];
				var rView = this.views[this.views.length-2];

				// Don't add an arrow if the view types don't match. They can't be copied over!
				// Always add an arrow if one view is empty, though.
				if (!lView || !rView || (lView.viewType === rView.viewType))
					line.find('img').css('display', '');
//					line.children(':eq(1)').append(app.templates.diffArrow());
			}

			container.append(line);
		},

		//---------------------------------------
		//---------------------------------------
		rescanDifferences: function() {
			var lines = this.$('.diffRow');

			for (var i = 0, len = this.views.length / 2; i < len; i++)
			{
				var lView = this.views[i*2];
				var rView = this.views[i*2+1];

				// If both views are null, NOT different (or leave it alone -- it can't change)
				if (!lView && !rView)
					continue;

				var line = lines.eq(i);

				// If one view is null, force different (red plus arrow)
				if (!lView || !rView)
				{
					line.addClass('isDifferent');
					line.find('img.diffArrow').css('display', '');
					continue;
				}

				// If neither are null, compare data. Diff: red, maybe arrow
				if (!app.objectCompare(lView.getData(), rView.getData()))
				{
					line.addClass('isDifferent');

					// Show the arrow if the views are the same type (undefined for all but answers)
					var arrowStyle = (lView.viewType === rView.viewType) ? '' : 'none';
						line.find('img.diffArrow').css('display', arrowStyle);
				}
				else
				{
					// Identical data
					line.removeClass('isDifferent');
					line.find('img.diffArrow').css('display', 'none');
				}
			}
		},

		//---------------------------------------
		//---------------------------------------
		renderSteps: function(container)
		{
			var that = this;
			var curSteps = this.model.get('solve');
			var oldSteps = this.targetProb.get('solve');

			// Construct a map to tie together left and right steps
			var stepMap = createStepMap(curSteps, oldSteps);
			var expanded = fillOutStepMap(stepMap, curSteps.length, oldSteps.length);

			for (var idx = 0; idx < expanded.length; idx++)
			{
				// Create a new row -- Don't show header on side if there's no step!
				container.append($(app.templates.diffStep({idx:idx+1})));
				this.views.push(null, null);	// We need these to keep the row index in sync

				var leftIdx =  expanded[idx][0];
				var rightIdx = expanded[idx][1];

				// If both steps exist, render each field as a separate row
				if (leftIdx !== -1 && rightIdx !== -1)
				{
					$.each(that.stepViewList, function(i, name) {
						that.renderView(container, name, curSteps.at(expanded[idx][0]), oldSteps.at(expanded[idx][1]));
					});
				}
				else	// Only one step exists. Render the whole step
				{
					var left =  (leftIdx !== -1) ? curSteps.at(leftIdx) : null;
					var right = (rightIdx !== -1) ? oldSteps.at(rightIdx) : null;
					that.renderView(container, 'SingleStep', left, right, idx);
				}
			}
		},

		//---------------------------------------
		//---------------------------------------
		formatContent: function(name, model1, model2, el, index)
		{
			var view = new app[name + 'View']({
				compact: true,
				stepNum: index,
				parent: el,
				model: model1,
				original: model2	// Allows comparison
			});

			view.render();
			this.views.push(view);

			return view.getData();
		},

		//---------------------------------------
		//---------------------------------------
		noContent: function()
		{
			this.views.push(null);
			return "No content to match";
		},

		//---------------------------------------
		//---------------------------------------
		deleteContent: function(el)
		{
			el.html("(No content. The arrow will <b>delete</b> content on the left side!)");

			this.views.push(null);
			return "No content to match";
		},

		//---------------------------------------
		// Redraw the screen. Needs to include cleanup
		// before rendering.
		//---------------------------------------
		rebuild: function()
		{
			this.closeViews();
			this.render();
		},

		//---------------------------------------
		// Close all views that have been created
		//---------------------------------------
		closeViews: function()
		{
			// Close (hard!) any extra views we've created
			$.each(this.views, function(idx, view) {
				if (view)
				{
					view.close();
					view.unbind();
					view.remove();
				}
			});

			this.views = [];
		},

		//---------------------------------------
		//---------------------------------------
		showStatus: function()
		{
			msg = {
				noProblem: "No history is available. This is a new problem.",
				history: "Loading history data...",
				historyFail: "Failed to load history!",
				target: "Loading revision...",
				noDiff: "There are no previous versions to compare against.",
				targetFail: "Failed to load target problem!"
			}

			if (msg[this.state])
			{
				this.$el.html("<b>" + msg[this.state] + "</b>");
				return true;
			}

			return false;		// No message
		},

		//---------------------------------------
		// Failed to load history for this problem
		//---------------------------------------
		historyFail: function()
		{
			this.state = "historyFail";
			this.showStatus();
		},

		//---------------------------------------
		// History successfully loaded
		//---------------------------------------
		gotHistory: function(history)
		{
			this.state = "target";
			this.showStatus();

			// Do a background fetch of a previous version
			// If there are changes, fetch the last saved version
			// If there are no changes, go one version back
			this.revIdx = this.getCompareVersion(history);

			if (this.revIdx === -1)
			{
				this.state = "noDiff";	// We want to compare against the previous saved version, but there isn't one
				this.showStatus();
			}
			else
				this.loadVersion();
		},

		//---------------------------------------
		//---------------------------------------
		getCompareVersion: function(history)
		{
			var lastIdx = history.length - 1;

			return lastIdx;

			/* -- This "smart" logic had weird results. The target problem changed when
			 * Validate, Continue occurred. Keep it simple and dumb.
			if (app.isChanged())
				return lastIdx;		// Compare against the last saved version
			else if (lastIdx < 1)
				return -1;
			else
				return lastIdx - 1;	// Compare against the previous saved version
			*/
		},

		//---------------------------------------
		//---------------------------------------
		loadVersion: function()
		{
			var revID = app.problemHistory.at(this.revIdx).get('revision_id');
			this.targetProb.clear({silent:true});
			this.targetProb.url = app.probRevisionUrl(app.curProbID, revID);
			this.targetProb.fetch().done(this.gotTarget).fail(this.targetFail);
		},

		//---------------------------------------
		// Failed to load the target problem
		//---------------------------------------
		targetFail: function()
		{
			this.state = "targetFail";
			this.showStatus();
		},

		//---------------------------------------
		// Target problem successfully loaded
		//---------------------------------------
		gotTarget: function()
		{
			this.state = "success";
			this.render();
		},

		//---------------------------------------
		//---------------------------------------
		toggleDiff: function()
		{
			this.showAll = !this.showAll;

			this.handleMode();
		},

		//---------------------------------------
		//---------------------------------------
		handleMode: function()
		{
			var text = this.showAll ? this.showDiffText : this.showAllText;
			$('#toggleDiff').text(text);

			if (this.showAll)
				this.showAllFields();
			else
				this.showDiffFields();
		},

		//---------------------------------------
		//---------------------------------------
		showAllFields: function()
		{
			this.$('tr.diffRow:not(.isDifferent)').show();
		},

		//---------------------------------------
		//---------------------------------------
		showDiffFields: function()
		{
			// Hide rows unless they have class .isDifferent, or are step headers
			// Refine this to only show step headers with steps that are different.
			this.$('tr.diffRow:not(.isDifferent, :has(.stepHeader))').hide();
		},

		//---------------------------------------
		//---------------------------------------
		revertAll: function()
		{
			new app.Modal.View({
				title: 'Are you sure?',
				text: "This will completely overwrite the current problem.<br/>The change isn't permanent until you save.",
				ok: this.doRevertAll,
				cancel: function(){},		// Don't do anything
			});
		},

		//---------------------------------------
		//---------------------------------------
		copyField: function(ev)
		{
			var thisRow = $(ev.currentTarget).closest('tr.diffRow');
			var idx = this.$('tr.diffRow').index(thisRow);

			// Get the views
			var leftView = this.views[idx*2];
			var rightView = this.views[idx*2+1];

			// Copy the value (if we can)
			var old = rightView && rightView.getData();

			// Disable change notification
			this.model.off('change', this.rebuild);

			if (leftView && rightView)
				leftView.setData(old);
			else if (rightView)
				this.model.insertStep(old, rightView.options.stepNum);
			else
				this.model.deleteStep(leftView.options.stepNum);

			this.model.on('change', this.rebuild, this);

			// Clear difference styling manually instead of rerendering.
			thisRow.removeClass('isDifferent');
			thisRow.find('.diffArrow').remove();

			// If there was no view before, re-render the whole table
			if (!leftView || !rightView)
				return this.render();

			leftView.$('.startEdit').removeClass('startEdit');	// Re-render restores edit mode -- remove it again.

			// Redraw. Ideally, remember scroll position!
			// Handled by change event.
			// However, isDifferent isn't being updated in all cases! It should be recalculated!
			this.rescanDifferences();
		},

		//---------------------------------------
		//---------------------------------------
		doRevertAll: function()
		{
			// Disable change notification
			this.model.off('change', this.rebuild);

			// This is all very crazy and hacky. We need a better solution for nested collections!
			var data = this.targetProb.toJSON();
			this.model.reset(data, {silent:true});

			// Restore change notification
			this.model.on('change', this.rebuild, this);

			// Change events should have rerendered all child views, but assymetric steps requires
			// a full re-render.
			this.render();

			// Clear difference styling manually instead of rerendering.
			this.$('.isDifferent').removeClass('isDifferent');
			this.$('.diffArrow').remove();
			this.$('.startEdit').removeClass('startEdit');	// Re-render restores edit mode -- remove it again.
		},

		//---------------------------------------
		//---------------------------------------
		newerProblem: function()
		{
			if (++this.revIdx < app.problemHistory.length)
			{
				this.state = "target";
				this.showStatus();
				this.loadVersion();
			}
			else
				--this.revIdx;

			this.updateButtons();
		},

		//---------------------------------------
		//---------------------------------------
		olderProblem: function()
		{
			if (--this.revIdx >= 0)
			{
				this.state = "target";
				this.showStatus();
				this.loadVersion();
			}
			else
				++this.revIdx;

			this.updateButtons();
		},

		//---------------------------------------
		// Jump to a specific revision
		//---------------------------------------
		setRevision: function()
		{
			var idx = $('#revList').prop('selectedIndex');
			this.revIdx = app.problemHistory.length - idx - 1;	// Invert

			this.state = "target";
			this.showStatus();
			this.loadVersion();

			this.updateButtons();
		},

		//---------------------------------------
		//---------------------------------------
		updateButtons: function()
		{
			if (this.revIdx === 0)
				$('#older').addClass('disabled');
			else
				$('#older').removeClass('disabled');

			if (this.revIdx === (app.problemHistory.length-1))
				$('#newer').addClass('disabled');
			else
				$('#newer').removeClass('disabled');
		},

		//---------------------------------------
		// Close routine.  Unbind model events.
		//---------------------------------------
		close: function() {
			this.model.off(null, this.rebuild);
			this.closeViews();

			// Very important! Remove the ID from Backbone.Relational's cache or we'll get a crash when we return.
			// Do this after closeViews or we get many modelChanged events.
			this.targetProb && this.targetProb.clear();
		}
	});

	//=======================================================
	//
	//=======================================================
	function isEmpty(val)
	{
		return typeof(val) === 'undefined' ||
			val === null ||
			val === '' ||
			(Array.isArray(val) && val.length === 0);
	}

	//---------------------------------------
	// Create an array of deltas to help match up the two sides.
	// The array doesn't have to be full length.
	// Missing entries (past the end of the array) are assumed to be 0
	//---------------------------------------
	function createStepMap(cur, old)
	{
		if (cur.length === old.length)
			return [];	// 1:1 array

		// It should be possible to combine the two, or reverse and use a separate function
		if (cur.length < old.length)
		{
			return createDeltaMap(cur, old);
		}
		else
		{
			// Exactly the same, but in reverse
			var out = createDeltaMap(old, cur);

			// Reverse the array
			return _.map(out, function(val) {
				return [val[1], val[0]];
			});
		}
	}
	app.testStepMap = createStepMap;

	//---------------------------------------
	// The core algorithm
	//---------------------------------------
	function createDeltaMap(shorter, longer)
	{
		var out = [];
		var delta = longer.length - shorter.length;
		var offset = 0;

		// Step through shorter (the shorter)
		for (var i = 0; i < shorter.length; i++)
		{
			if (compareSteps(shorter.at(i).toJSON(), longer.at(i+offset).toJSON()))
				out.push([0, 0]);		// Deltas
			else	// Scan forward, up to delta
			{
				var found = false;
				for (var j = 0; j <= delta; j++)
				{
					if (compareSteps(shorter.at(i).toJSON(), longer.at(i+j+offset).toJSON()))
					{
						out.push([j, 0]);
						found = true;
						delta -= j;
						offset += j;
						break;
					}
				}

				// Not found -- Use the shorterrent match
				if (!found)
					out.push([0, 0]);
			}
		}

		return out;
	}

	//=======================================================
	// Massage the step map data into another format.
	// This could be integrated into the routine that
	// creates the data, but this is easier for now.
	//=======================================================
	function fillOutStepMap(map, leftLen, rightLen)
	{
		var out = [];

		// Step through the map
		var left = 0, right = 0;
		for (var i = 0; i < map.length; i++)
		{
			if (map[i][0] === 0 && map[i][1] === 0)
				out.push([left++, right++]);
			else if (map[i][0])
			{
				for (var j = 0; j < map[i][0]; j++)
					out.push([-1, right++]);

				out.push([left++, right++]);
			}
			else
			{
				for (var j = 0; j < map[i][1]; j++)
					out.push([left++, -1]);

				out.push([left++, right++]);
			}
		}

		// Fill out the remaining portion
		var fillLen = Math.max (leftLen, rightLen);
		while (out.length < fillLen)
		{
			var l = (left < leftLen) ? left++ : -1;
			var r = (right < rightLen) ? right++ : -1;
			out.push([l, r]);
		}

		return out;
	}
	app.testMapMassage = fillOutStepMap;

	//=======================================================
	// Compare two steps, intelligently
	//=======================================================
	function compareSteps(a, b)
	{
		// Don't compare these fields. They aren't reliable!
		var clearFields = ['id', 'order'];

		var compA = _.clone(a);
		$.each(clearFields, function(idx, val) {
			delete compA[val];
		});

		var compB = _.clone(b);
		$.each(clearFields, function(idx, val) {
			delete compB[val];
		});

		return app.objectCompare(compA, compB);
	}

})();
