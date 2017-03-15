//=======================================================
// Pulldown control
//=======================================================
;(function() {
	app.VideoView = app.PEView.extend({
		header: 'Video',
		compare: app.simpleCompare,
		field: 'vid',

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

			this.list = ['Video 1', 'Video 2', 'Video 3'];	// This gets fetched somehow

//			this.render = _.bind(this.render, this);
//			this.model.bind('change:' + this.field, this.render);
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
			return this.$('select').val();
		},

		//--------------------------
		//--------------------------
		close: function() {
		}

	});
})();
