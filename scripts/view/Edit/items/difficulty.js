//=======================================================
// Pulldown control
//=======================================================
;(function() {
	app.DiffView = app.PEView.extend({
		header: 'Difficulty',
		compare: app.simpleCompare,
		field: 'diff',

		//--------------------------
		//--------------------------
		events: {
			'click .startEdit': app.pulldownEditMode,
			'click .stopEdit': app.stopEditMode,
			'change': app.changed
		},

		//--------------------------
		//--------------------------
		initialize: function() {
			this.original = this.last = this.options.original.get(this.field);
			this.isDirty = !this.compare(this.model.get(this.field), this.original);

			this.list = ['Basic', 'Medium', 'Hard'];

			this.modelChanged = _.bind(this.modelChanged, this);
			this.model.on('change:' + this.field, this.modelChanged);	// This needs to be unbound manually if the view is ever destroyed!
		},

		//--------------------------
		//--------------------------
		render: function() {
			return app.pulldownRender.call(this);
		},

		//--------------------------
		// Fetch the value from the control
		//--------------------------
		value: function() {
			// No translation is allowed.
			return this.$('select').val();
		},

		//--------------------------
		// Close routine.  Unbind model events.
		//--------------------------
		close: function() {
			this.model.off(null, this.modelChanged);
		}

	});
})();
