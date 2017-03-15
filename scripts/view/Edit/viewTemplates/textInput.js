//=======================================================
// Text input
//=======================================================
;(function() {
	app.TextInputView = app.PEView.extend({
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

			this.modelChanged = _.bind(this.modelChanged, this);
			this.model.on('change:' + this.field, this.modelChanged);
		},

		//--------------------------
		//--------------------------
		render: function() {
			var data = this.model.get(this.field);

			this.$el.empty();

			if (this.options.edit)
			{
				this.$el.append(app.templates.textInput({header: this.header, value: data || ''}));

				// Slightly ugly code to move the cursor to the end
				var el = this.$('textarea');
				var temp = el.val();
				el.val('');
				el.focus();
				el.val(temp);
			}
			else
				this.$el.append(app.templates.textItem({header: this.header, value: data || '<i>undefined</i>'}));

			return this.el;
		},

		//--------------------------
		// Fetch the value from the control
		//--------------------------
		value: function() {
			return this.$('textarea').val();
		},

		//---------------------------------------
		// @FIXME/dg: This probably won't work once we have multiple
		// views sharing the same model.  render() has been commented out,
		// so secondary views probably won't update.
		// render() was removed because it was removing the clickable DOM
		// element (stopEdit) before the event could be processed.
		//
		// It didn't work. render was restored, fixing data sync. However, the
		// annoying bug requiring a double click to exit edit mode persists.
		// This is now identical to the default version, so it uses the super class.
		//---------------------------------------
		/*
		modelChanged: function() {
			this.render();		// Display the new value
			this.isDirty = !this.compare(this.model.get(this.field), this.original);
			this.$el.trigger('updated');
		},
		*/

		//--------------------------
		// Close routine.  Unbind model events.
		//--------------------------
		close: function() {
			this.model.off(null, this.modelChanged);
		}

	});
})();
