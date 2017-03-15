//=======================================================
// Groups of controls associated with different answer types
//=======================================================
;(function() {

	//=======================================================
	// Answer View
	//=======================================================
	app.AnswerView = app.PEView.extend({

		viewList: {
			input: 'AnswerEditView',
			essay: 'TextInputExView',
			MultKinetic: 'MultiInputView',
			radio: 'RadioInputView',		// Hide (combined 'a' + 'choices')
			check: 'CheckInputView',		// Hide (combined 'a' + 'choices')
			VTPGraph: 'GraphConfigView',	// Hide (combined graphparams, graphequations)
			graphConst: 'GraphConfigView',	// Hide (combined graphparams, graphequations)
			multiPart: 'MultiPartView',		// Hide (No answer at all)

			"no input": 'AnswerEditView'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			// Create a view based on the answer type
			this.childView = null;
			this.createChild();

			// Force re-render whenever the answer type changes
			_.bindAll(this, 'render', 'changeType');

			this.model.on('change:ansType', this.changeType);	// This needs to be unbound manually if the view is ever destroyed!
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			this.childView.render();

			return this.el;
		},

		//---------------------------------------
		//---------------------------------------
		createChild: function() {
			// Save the old value for this type

			// Destroy the old view if there was one
			// This process is prone to zombies.  Try hard to prevent them.
			if (this.childView)
			{
				this.childView.close && this.childView.close();
				this.childView.unbind();
				this.childView.remove();
			}

			// Create a view based on the answer type
			var ansType = this.model.get('ansType');
			this.viewType = this.viewList[ansType] || this.viewList.input;
			this.childView = new app[this.viewType]({
				parent: this.el,
				model: this.model,
				original: this.options.original
			});	// Can't start in edit mode due to a bug in ckeditor.
		},

		//---------------------------------------
		//---------------------------------------
		changeType: function() {
			this.createChild();
			this.render();	// This is bad the first time through.  Otherwise it is needed.

			// Notify the item that we need to update (works with Revert, not with History)
			this.$el.trigger('updated');
		},

		//---------------------------------------
		//---------------------------------------
		isDirty: function() {
			return this.childView && app.isDirty([this.childView]);
		},

		//---------------------------------------
		// Extract composite data from all fields
		// in the model that this view controls.
		//---------------------------------------
		getOriginal: function() {
			if (!this.childView)
				return [];

			return this.childView.getOriginal();
		},

		//---------------------------------------
		// Extract composite data from all fields
		// in the model that this view controls.
		//---------------------------------------
		getData: function() {
			if (!this.childView)
				return [];

			return this.childView.getData();
		},

		//---------------------------------------
		// Store data to the fields of the model
		// that this view controls.
		//---------------------------------------
		setData: function(data) {
			this.childView && this.childView.setData(data);

			// Since we're an aggregate view, we need to force another isDirty check
			this.$el.trigger('updated');
		},

		//---------------------------------------
		// Close routine.  Unbind model events.
		//---------------------------------------
		close: function() {
			this.model.off(null, this.changeType);
			this.childView.close();
			this.childView.unbind();
			this.childView.remove();
			this.childView = null;
		}

	});

})();
