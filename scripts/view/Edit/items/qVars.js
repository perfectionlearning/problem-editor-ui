//=======================================================
// Question Variables (table)
//=======================================================
;(function() {

	var defaultSigDigs = 2;

	//=======================================================
	//=======================================================
	app.QVarsView = app.PEView.extend({
		header: 'Variable definitions',
		compare: app.objectCompare,
		field: 'vars',

		varFields: {
			label:'Variable',
			min: 'Minimum',
			max: 'Maximum',
			step: 'Step',
			sigDig: 'Significant Digits',
			sciNote: 'Scientific Notation'
		},

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
			this.original = this.last = cleanTable(this.options.original.get(this.field));

			// If there is no data, set a default
			if (!this.original || this.original.length < 1)
			{
				this.original = [{label:'', min:'', max:'', step:'', sigDig:defaultSigDigs, sciNote:false}];
				var setobj = {};
				setobj[this.field] = this.original;
				this.model.set(setobj,{silent:true});	// Prevent change events
				this.options.original.set(setobj);
				this.last = this.original;
			}

			this.isDirty = !this.compare(this.model.get(this.field), this.original);

			this.changed = _.bind(this.changed, this);

			// Rerendering on changes is nice.  However, it made the control sluggish and act badly.
			// Tabbing or clicking a box wouldn't focus on the next input because the entire control was being rerendered.
			// Also, having multiple variable controls wasn't working anyway, so there's no need to handle external changes.
			// That problem was probably due to both variable controls having the same ID or class.
			this.modelChanged = _.bind(this.modelChanged, this);
			this.model.bind('change:' + this.field, this.modelChanged);
//			this.model.bind('change:constraints', this.render);		// Useful, but slow!

			this.examples = new app.VarExamplesView({parent: this.el, model: this.model, showLong:true});
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var that = this;
			var data = this.model.get(this.field);

			var tblData = fw.tablePrepData(this.varFields, data);

			if (this.options.edit)
			{
				this.$el.html(app.templates.table({
					header: this.header,
					id: 'vars',
					headClass: 'stopEdit',
					tableClass: '',
					data: {
						columns: ['textInput', 'numInput', 'numInput', 'numInput', 'numInput', 'tfInput', 'flex'],
						headers: tblData.headers,
						data: tblData.data,
						inpWidth: 8
					}
				}));

				// This should probably be done elsewhere.  The call makes it especially messy.
				$('#varsAdd').btnAddRow(that.changed);
				$('.varsDel').btnDelRow(that.changed);
			}
			else
			{
				this.$el.html(app.templates.table({
					header: this.header,
					id: 'vars',
					headClass: 'startEdit',
					tableClass: 'startEdit',
					data: {
						columns: ['raw', 'raw', 'raw', 'raw', 'raw', 'trueFalse'],
						headers: tblData.headers,
						data: tblData.data
					}
				}));
			}

			if (!this.options.compact)
				this.$el.append(this.examples.render());

			return this.el;
		},

		//---------------------------------------
		// Fetch the value from the control
		//---------------------------------------
		value: function() {
			return cleanTable(this.tableValue());
		},

		//---------------------------------------
		// We can't use the generic change handler
		// This version is slightly different
		//---------------------------------------
		changed: function() {
			var tv = this.tableValue();

			// Update model -- use 'unclean' version
			this.model.set({vars: tv});

			// This requires that the model be set.  However, setting the model alerts the
			// example variables to redraw.  That occurs before we've chosen any variables.
			app.chooseVars();

			this.model.trigger('resetVars');	// @FIXME/dg: This might cause a double update, which is slow

			// Trigger change event -- use 'clean' version
			this.isDirty = !this.compare(cleanTable(tv), this.original);
			this.$el.trigger('updated');
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
			this.model.trigger('resetVars');	// @FIXME/dg: This might cause a double update, which is slow

			// Display the new value
			this.render();

			// Update the isDirty flag (using the simplest comparison -- this is the part that needs
			// to be overridden in some cases.)
			this.isDirty = !this.compare(this.model.get(this.field), this.original);

			// This trigger/isDirty update cause all review panes to update
			this.$el.trigger('updated');
		},

		//---------------------------------------
		//---------------------------------------
		tableValue: function()
		{
			var out = [];
			$('#vars').find('tr').each(function(){
				var textFields = $(this).find('input[type="text"]');
				var pulldowns = $(this).find('select');

				// Skip the header row
				if (textFields.length === 0)
					return true;

				out.push({
					label: textFields[0].value,
					min: textFields[1].value,
					max: textFields[2].value,
					step: textFields[3].value,
					sigDig: textFields[4].value,
					sciNote: pulldowns[0].value === "True",
				});
			});

			return out;
		},

		//--------------------------
		// Close routine.  Unbind model events.
		//--------------------------
		close: function() {
			this.model.off(null, this.modelChanged);
			this.examples.close();
		}
	});

	//=======================================================
	// Cleans up the variable table for comparison
	//=======================================================
	function cleanTable(table)
	{
		if (!table)
			table = [];

		// Convert strings to floats -- don't convert empty strings or we'll get NaN
		for (var r = 0; r < table.length; r++)
		{
			if (table[r].min !== '') table[r].min = parseFloat(table[r].min);
			if (table[r].max !== '') table[r].max = parseFloat(table[r].max);
			if (table[r].step !== '') table[r].step = parseFloat(table[r].step);
			if (table[r].sigDig !== '') table[r].sigDig = parseInt(table[r].sigDig) || defaultSigDigs;
			table[r].sciNote = !!table[r].sciNote;
		}

		return table;
	}

})();
