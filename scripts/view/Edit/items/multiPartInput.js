//=======================================================
// Text input
//=======================================================
;(function() {
	app.MultiPartView = app.PEView.extend({
		compare: app.simpleCompare,
		field: 'a',
		header: 'Multi-Part Question',

		//--------------------------
		//--------------------------
		events: {
		},

		//--------------------------
		//--------------------------
		initialize: function() {
			this.original = this.last = this.options.original && this.options.original.get(this.field);
			this.isDirty = !this.compare(this.model.get(this.field), this.original);
		},

		//--------------------------
		//--------------------------
		render: function() {
			this.$el.empty();

			this.$el.append(app.templates.textItem({header: this.header, value: '<i>Parts are stored in steps</i>'}));

			return this.el;
		},

		//--------------------------
		// Fetch the value from the control
		//--------------------------
		value: function() {
			return '';
		},

		//--------------------------
		// Close routine.  Unbind model events.
		//--------------------------
		close: function() {
		}

	});
})();
