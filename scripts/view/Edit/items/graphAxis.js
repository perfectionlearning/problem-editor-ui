//=======================================================
// Support for graph type selection
//=======================================================
;(function() {

	//=======================================================
	// Graph Configuration View
	//=======================================================
	app.GraphAxisView = app.PEView.extend({
		header: 'Axis Parameters',
		compare: app.objectCompare,
		field: 'graphparms',

		defaultData: {x:[-10, 10, 1], y:[-10,10,1], skip:1, usePiLabels:false},

		headerCols: ['Axis', 'Minimum', 'Maximum', 'Step'],
		subHeaders: ['Label skip', 'Use &pi; in labels'],

		//---------------------------------------
		//---------------------------------------
		events: {
			'click .startEdit': app.editMode,
			'click .stopEdit': app.stopEditMode,
			'change': app.changed
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			this.original = this.last = this.options.original && this.options.original.get(this.field);

			// If there is no data, set a default. Store it to the model as well.
			if (!this.original || !this.original.x || this.original.x.length !== 3 || this.original.y.length !== 3)
			{
				this.original = this.defaultData;
				var setobj = {};
				setobj[this.field] = this.original;
				this.model.set(setobj, {silent:true});
				this.options.original && this.options.original.set(setobj);
				this.last = this.original;
			}

			this.isDirty = !this.compare(this.model.get(this.field), this.original);

			this.childID = 'graxis' + app.uniqueVal();

			this.modelChanged = _.bind(this.modelChanged, this);
			this.model.on('change:' + this.field, this.modelChanged);	// This needs to be unbound manually if the view is ever destroyed!
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var that = this;
			var data = this.model.get(this.field) || this.defaultData;
			var axis = separate(data);

			this.$el.empty();
			if (this.options.edit)
			{
				this.$el.append(app.templates.table({
					header: this.header,
					id: this.childID,
					headClass: 'stopEdit',
					tableClass: '',
					data: {
						columns: ['raw', 'numInput', 'numInput', 'numInput'],
						headers: this.headerCols,
						inpWidth: 8,
						data: axis
					}
				}));

				var skip = defined(data.skip) ? data.skip : '';
				this.$el.append(app.templates.simpleInput({header: this.subHeaders[0], value: skip}));

				this.$el.append(app.templates.trueFalse({header: this.subHeaders[1], state: data.usePiLabels}));
			}
			else
			{
				this.$el.append(app.templates.table({
					header: this.header,
					id: this.childID,
					headClass: 'startEdit',
					tableClass: 'startEdit',
					data: {
						columns: ['raw', 'raw', 'raw', 'raw'],
						headers: this.headerCols,
						data: axis
					}
				}));

				var skip = defined(data.skip) ? data.skip : '<i>undefined</i>';
				this.$el.append(app.templates.textItem({header: this.subHeaders[0], value: skip}));

				this.$el.append(app.templates.textItem({header: this.subHeaders[1], value: data.usePiLabels || 'False'}));
			}

			return this.el;
		},

		//---------------------------------------
		// Fetch the value from the control
		//---------------------------------------
		value: function() {
			var newAxis = merge(fw.tableValues(this.childID));
			var skip = this.$('.simpleInput').val();
			var pi = this.$('.pulldown').val();

			return $.extend({
				skip: parseInt(skip || 0),
				usePiLabels: pi === 'True'
			}, newAxis);
		},

		//---------------------------------------
		// Store data to the fields of the model
		// that this view controls.
		//---------------------------------------
		setData: function(data) {

			// If there is no data, set a default.
			if (!data || !data.x || data.x.length !== 3 || data.y.length !== 3)
				data = this.defaultData;

			var setObj = {};
			setObj[this.field] = data;
			this.model.set(setObj);
		},

		//--------------------------
		// Close routine.  Unbind model events.
		//--------------------------
		close: function() {
			this.model.off(null, this.modelChanged);
		}

	});

	//=======================================================
	// Convert from model data to internal format
	//=======================================================
	function separate(data)
	{
		// in: {x: [m,m,s], y: [m,m,s]}
		// out: ['x', m, m, s],['y', m, m, s]
		var out = [data.x.slice(0), data.y.slice(0)];	// Clone the original data (don't operate on it directly!)
		out[0].unshift('x');
		out[1].unshift('y');
		return out;
	}

	//=======================================================
	// Convert from internal format to model format
	//=======================================================
	function merge(data)
	{
		// in: ['m', 'm', 's'],['m', 'm', 's']
		// out: {x: [m,m,s], y: [m,m,s]}
		var out = {};

		out.x = $.map(data[0].slice(0), function(val) {
			return parseFloat(val);
		});

		out.y = $.map(data[1].slice(0), function(val) {
			return parseFloat(val);
		});

		return out;
	}

})();
