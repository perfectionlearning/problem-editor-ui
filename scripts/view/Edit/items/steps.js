//=======================================================
// Steps for step-by-step mode
//
// NOTE: Instead of deep comparison, meta changes (step add/del/move)
//       are treated as an unrecoverable change.
//=======================================================
;(function() {
	app.StepView = app.PEView.extend({
		header: 'Problem Steps',
		field: 'solve',
		ignoreChanges: true,

		questionsOnly: false,
		forceDirty: false,	// A bit of a shortcut.  Instead of deep comparison, flag any meta change (step add/del/move) as an unrecoverable change.

		//---------------------------------------
		//---------------------------------------
		events: {
			'click #qOnly': 'toggleQOnly',
			'click #addStep': 'addStep',
			'moveUp': 'moveStepUp',
			'moveDown': 'moveStepDown',
			'delete': 'deleteStep'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			this.original = this.last = this.options.original && this.options.original.get(this.field);
			this.views = [];

			this.modelChanged = _.bind(this.modelChanged, this);
			this.model.on('stepChange', this.modelChanged);
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var that = this;

			this.createViews();

			$.each(this.views, function(idx, val) {
				val.render(that.questionsOnly);
			});

			return this.el;
		},

		//---------------------------------------
		//---------------------------------------
		createViews: function() {
			var that = this;

			// Close any existing views -- no zombies allowed!
			this.closeViews();
			this.$el.empty();

			var steps = this.model.get(this.field);

			// Add meta section (add button) -- We can't just have add on the steps, since there might not be any yet!
			// Only users with 'stepmod' permission may add steps
			if (!that.options.compact)
			{
				if (app.checkPermission(app.userGroups, 'stepmod'))
				{
					this.$el.append(app.templates.stepTitle({
						toggleButton: this.filterText()
					}));
				}
				else
				{
					this.$el.append(app.templates.stepTitleNoChanges({
						toggleButton: this.filterText()
					}));
				}
			}

			// If a step only has an index and not data, convert this .each to a for loop
			for (var i = 0; i < steps.length; i++)
			{
				// Normal: Always show a divider. Compact: No divider before step 1.
				if (!that.options.compact || (i != 0))
					that.$el.append(app.templates.stepDivider);

				var orig = that.original.at(i);

				this.views.push(new app.SingleStepView({
					parent: that.el,
					model: steps.at(i),
					original: orig ? $.extend({}, orig) : null,
					compact: that.options.compact,
					stepNum: i
				}));
			}
		},

		//---------------------------------------
		// Fetch the value from the control
		//
		// @REMOVEME/dg: This isn't needed, is it?
		//---------------------------------------
		value: function() {
			return '';
		},

		//---------------------------------------
		// Extract composite data from all fields
		// in the model that this view controls.
		//---------------------------------------
		getData: function() {
			return this.model.get(this.field).toJSON();
		},

		//---------------------------------------
		// Store data to the fields of the model
		// that this view controls.
		//---------------------------------------
		setData: function(data) {
			this.model.get(this.field).reset(data.toJSON());
		},

		//---------------------------------------
		//---------------------------------------
		setQFilter: function() {
			var that = this;
			$.each(this.views, function(idx, val) {
				val.filter(that.questionsOnly);
			});
		},

		//---------------------------------------
		// Toggle between question-only and normal modes
		//---------------------------------------
		toggleQOnly: function() {
			this.questionsOnly = !this.questionsOnly;
			this.setQFilter();

			// This is obsolete because it doesn't always work, but it doesn't harm anything.
			// It helps hide extra whitespace.
			var text = this.questionsOnly ? '&nbsp;' : '';
			$('.breakFloat').html(text);

			$('#qOnly').text(this.filterText());
		},

		//---------------------------------------
		// Refresh all of the step views
		//---------------------------------------
		refresh: function() {
//			this.closeViews();
//			this.$el.empty();

			// We need to reconstruct the views (this ensures events still work, and fixes the step # value)
//			this.initialize();
//			this.render();		// Handled by stepChange event now

			this.forceDirty = true;
//			this.$el.trigger('updated');	// Handled by stepChange event

			// Forces modelChanged/render
			this.model.trigger('stepChange');

			this.setQFilter();
		},

		//---------------------------------------
		// Move a step up, if possible
		//---------------------------------------
		moveStepUp: function(ev, step) {
			if (step > 0 && step < this.views.length)
			{
				// Swap the order in the model
				var steps = this.model.get(this.field);
				var toMove = steps.at(step);
				var swap = steps.at(step-1);

				toMove.set({order: step-1}, {silent: true});
				swap.set({order: step}, {silent: true});
				steps.sort();

				this.refresh();
			}
		},

		//---------------------------------------
		// Move a step down, if possible
		//---------------------------------------
		moveStepDown: function(ev, step) {
			if (step >= 0 && step < (this.views.length-1))
			{
				// Swap the order in the model
				var steps = this.model.get(this.field);
				var toMove = steps.at(step);
				var swap = steps.at(step+1);

				toMove.set({order: step+1}, {silent: true});
				swap.set({order: step}, {silent: true});
				steps.sort();

				this.refresh();
			}
		},

		//---------------------------------------
		// Delete a step
		//---------------------------------------
		deleteStep: function(ev, step) {
			this.model.deleteStep(step);

			this.refresh();
		},

		//---------------------------------------
		// Add a step
		//---------------------------------------
		addStep: function() {
			var steps = this.model.get(this.field);
			steps.push({order:steps.length});

			this.refresh();
		},

		//---------------------------------------
		//---------------------------------------
		isDirty: function() {
			if (this.forceDirty)
				return true;

			return app.isDirty(this.views);
		},

		//---------------------------------------
		// The model has changed (externally)
		// Notify the container that an update has occurred.
		// This starts a cascade with some redundancies, but it gets the job done.
		//---------------------------------------
		modelChanged: function() {
			// Display the new value
			this.render();

			// Steps use an isDirty function. No need to update in this version.
//			this.isDirty = !this.compare(this.model.get(this.field), this.original);

			// This trigger/isDirty update cause all review panes to update
			this.$el.trigger('updated');
		},

		//---------------------------------------
		//---------------------------------------
		filterText: function() {
			return this.questionsOnly ? 'Show everything' : 'Show questions only';
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
		// Close routine.  Unbind model events.
		//---------------------------------------
		close: function() {
			this.model.off(null, this.modelChanged);

			this.closeViews();
		}

	});
})();
