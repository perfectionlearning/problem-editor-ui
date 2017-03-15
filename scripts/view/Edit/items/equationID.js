//=======================================================
// Question image
//=======================================================
;(function() {
	app.EquationIDView = app.PEView.extend({
		header: 'Equation ID',
		field: 'eq_names',
		compare: app.simpleCompare,

		//--------------------------
		//--------------------------
		events: {
			'click .startEdit': app.editMode,
			'click .stopEdit': app.stopEditMode,
			'change': app.changed
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
			var data = this.model.get(this.field) || [];
			if (data.length > 0)
				var firstVal = data[0];
			else
				firstVal = undefined;

			this.$el.empty();

			if (this.options.edit)
			{
				this.$el.append(app.templates.textInput({header: this.header, value: firstVal || ''}));

				// Slightly ugly code to move the cursor to the end
				var el = this.$('textarea');
				var temp = el.val();
				el.val('');
				el.focus();
				el.val(temp);
			}
			else
				this.$el.append(app.templates.textItem({header: this.header, value: firstVal || '<i>undefined</i>'}));

			return this.el;
		},

		//--------------------------
		// Fetch the value from the control
		//--------------------------
		value: function() {
			var val = this.$('textarea').val().trim();
			return [val];
		},

		//--------------------------
		// Close routine.  Unbind model events.
		//--------------------------
		close: function() {
		}

	});
})();
