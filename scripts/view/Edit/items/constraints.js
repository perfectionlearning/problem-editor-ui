//=======================================================
// Variables constraints (table)
//=======================================================
;(function() {

	//=======================================================
	//=======================================================
	app.ConstraintView = app.PEView.extend({
		header: 'Variable constraints',
		compare: app.arrayCompare,
		field: 'constraints',

		headerCols: ['Constraint'],

		//---------------------------------------
		//---------------------------------------
		events: {
			'click .startEdit': app.editMode,
			'click .stopEdit': app.stopEditMode,
			'change': 'changed'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			this.original = this.last = this.options.original.get(this.field) || [];
			this.isDirty = !this.compare(this.model.get(this.field), this.original);

			this.modelChanged = _.bind(this.modelChanged, this);
			this.model.on('change:' + this.field, this.modelChanged);
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var that = this;
			var data = this.model.get(this.field);

			if (this.options.edit)
			{
				if (!data || data.length === 0)
					data = [''];

				this.$el.html(app.templates.table({
					header: this.header,
					id: 'constraint',
					headClass: 'stopEdit',
					tableClass: '',
					data: {
						columns: ['textInput', 'flex'],
						headers: this.headerCols,
						inpWidth: 30,
						data: fw.singleColumn(data)
					}
				}));

				// This should probably be done elsewhere.  The call makes it especially messy.
				$('#constraintAdd').btnAddRow(function(){app.changed.call(that)});
				$('.constraintDel').btnDelRow(function(){app.changed.call(that)});
			}
			else
			{
				if (!data || data.length === 0)
					this.$el.html(app.templates.textItem({header: this.header, value: '<i>No constraints</i>'}));
				else
					this.$el.html(app.templates.table({
						header: this.header,
						id: 'constraint',
						headClass: 'startEdit',
						tableClass: 'startEdit',
						data: {
							columns: ['raw'],
							headers: this.headerCols,
							data: fw.singleColumn(data)
						}
					}));
			}

			return this.el;
		},

		//---------------------------------------
		// Fetch the value from the control
		//---------------------------------------
		value: function() {
			var val = this.cleanTable(fw.tableValues('constraint'));

			// A single empty entry is the same as no entry at all
			if (val.length === 1 && val[0] === '')
				return [];

			return val;
		},

		//---------------------------------------
		//---------------------------------------
		changed: function() {
			// Call the generic version
			app.changed.call(this);

			// Select a new set of example variables
			// Done in modelChanged now.
//			app.chooseVars();

			// Notify all dependent views
			// Done in modelChanged now.
//			this.model.trigger('resetVars');	// @FIXME/dg: This might cause a double update, which is slow
		},

		//---------------------------------------
		// The model has changed (externally)
		// Notify the container that an update has occurred.
		// This starts a cascade with some redundancies, but it gets the job done.
		//---------------------------------------
		modelChanged: function() {
			// This is the only difference from the superclass modelChanged handler.
			// Choose some valid variables.
			app.chooseVars();
			this.model.trigger('resetVars');

			// Display the new value
			this.render();

			// Update the isDirty flag (using the simplest comparison -- this is the part that needs
			// to be overridden in some cases.)
			this.isDirty = !this.compare(this.model.get(this.field), this.original);

			// This trigger/isDirty update cause all review panes to update
			this.$el.trigger('updated');
		},

		//---------------------------------------
		// Convert from render value to model value
		//---------------------------------------
		cleanTable: function(data) {
			return $.map(data, function(val) {
				return val[0];
			});
		},

		//--------------------------
		// Close routine.  Unbind model events.
		//--------------------------
		close: function() {
			this.model.off(null, this.modelChanged);
		}

	});

})();
