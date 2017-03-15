//=======================================================
// Pulldown control
//=======================================================
;(function() {
	app.SingleStepView = app.PEView.extend({
		header: 'Step #',
		compare: app.simpleCompare,

		viewList: [
			{ view: 'StepPrompt', showQOnly: true },
			{ view: 'StepText', showQOnly: true },
			{ view: 'AnswerType', showQOnly: false },
			{ view: 'Answer', showQOnly: false },
			{ view: 'Equivalence', showQOnly: false },
//			{ view: 'SplitStep', showQOnly: false, skipCompact: true },
			{ view: 'Hint', showQOnly: false },
			{ view: 'WBAnywhere', showQOnly: false },
			{ view: 'TagList', showQOnly: false }
		],

		//---------------------------------------
		//---------------------------------------
		events: {
			'click #upStep': 'moveStepUp',
			'click #dnStep': 'moveStepDown',
			'click #delStep': 'deleteStep',
			'click .stepRevert': 'stepRevert',
			'updated': 'notifyChange'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			this.views = [];

			this.preRender();
		},

		//---------------------------------------
		//---------------------------------------
		preRender: function() {
			var that = this;

			var dispNum = this.options.stepNum + 1;

			// Display a step header based on user level.  Some users can't perform meta-operations
			// such as step deletion or moving up or down.  They are only allowed to edit the content.
			if (!that.options.compact)
			{
				if (app.checkPermission(app.userGroups, 'stepmod'))
					this.$el.append(app.templates.stepHeader({header:this.header + dispNum}));
				else
					this.$el.append(app.templates.stepHeaderNoChanges({header:this.header + dispNum}));
			}

			// If this is a new step (no data to revert), don't show the revert icon
			if (!this.options.original)
				this.$('.stepRevert').removeClass('stepRevert');

			// STEP FIELDS
			$.each(this.viewList, function(idx, val) {

				if (val.skipCompact && that.options.compact)
					return true;	// continue

				var className = 'substep';
				if (!val.showQOnly)
					className += ' filterStep';

				that.views.push(new app[val.view + 'View']({
					parent: that.el,
					className: className,
					model: that.model,
					original: that.options.original,
					isStep: true,
					compact: that.options.compact
				}));
			});

			this.notifyChange();		// Init to the proper changed status
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var that = this;

			// Render fields
			$.each(this.views, function(idx, val) {
				val.render();
			});

//			return this.el;
		},

		//---------------------------------------
		// Fetch the value from the control
		//---------------------------------------
		value: function() {
			return '';
		},

		//---------------------------------------
		//---------------------------------------
		filter: function(questionsOnly) {
			if (questionsOnly)
				this.$('.filterStep').hide();
			else
				this.$('.filterStep').show();
		},

		//---------------------------------------
		//---------------------------------------
		isDirty: function() {
			return app.isDirty(this.views);
		},

		//---------------------------------------
		//---------------------------------------
		notifyChange: function(ev) {
			this.changed(this.instanceView, app.isDirty(this.views));
		},

		//---------------------------------------
		//---------------------------------------
		changed: function(view, hasChanged) {
			if (hasChanged)
				this.$el.addClass('changed');
			else
				this.$el.removeClass('changed');
		},

		//---------------------------------------
		// Extract composite data from all fields
		// in the model that this view controls.
		//---------------------------------------
		getData: function() {
			return this.model.toJSON();
		},

		//---------------------------------------
		// Store data to the fields of the model
		// that this view controls.
		//---------------------------------------
		setData: function(data) {
			this.model.clear();
			this.model.set(data);
		},

		//---------------------------------------
		//---------------------------------------
		moveStepUp: function() {
			this.$el.trigger('moveUp', this.options.stepNum);
		},

		//---------------------------------------
		//---------------------------------------
		moveStepDown: function() {
			this.$el.trigger('moveDown', this.options.stepNum);
		},

		//---------------------------------------
		//---------------------------------------
		deleteStep: function() {
			this.$el.trigger('delete', this.options.stepNum);
		},

		//---------------------------------------
		//---------------------------------------
		stepRevert: function() {
			if (this.options.original)
			{
				var data = this.options.original.toJSON();
				this.setData(data);
			}
		},

		//---------------------------------------
		// Close routine.  Unbind model events.
		//---------------------------------------
		close: function() {
			$.each(this.views, function(idx, val) {
				val.close();
				val.remove();	// This might not be strictly necessary, but BackboneEye shows them until this occurs.
			});

			this.views = [];	// Probably not needed, but destroy any reference to the child views
		}

	});
})();
