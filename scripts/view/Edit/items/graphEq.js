//=======================================================
// Support for graph type selection
//=======================================================
;(function() {

	//=======================================================
	// Graph Configuration View
	//=======================================================
	app.GraphEqView = app.PEView.extend({
		header: 'Graph Type',
		compare: app.arrayCompare,
		field: 'graphequations',

		defaultData: ['point=0,0'],

		//---------------------------------------
		//---------------------------------------
		events: {
			'click .startEdit': app.editMode,
			'click .stopEdit': app.stopEditMode,
			'change': app.changed,
			'click button': 'copyToQ'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			this.original = this.last = this.options.original && this.options.original.get(this.field);

			// If there is no data, set a default
			if (!this.original || this.original.length < 1)
			{
				this.original = this.defaultData;
				var setobj = {};
				setobj[this.field] = this.original;
				this.model.set(setobj, {silent:true});
				this.options.original && this.options.original.set(setobj);	// Slightly risky.  It's possible the model has data, but not the original.  In practice, that isn't possible.
				this.last = this.original;
			}
			this.isDirty = !this.compare(this.model.get(this.field), this.original);

			this.modelChanged = _.bind(this.modelChanged, this);
			this.model.on('change:' + this.field, this.modelChanged);	// This needs to be unbound manually if the view is ever destroyed!
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var that = this;
			var data = this.modelToObject();
			var typeData = app.graphTypeMap[app.getGraphType(data[0].name)];
            var params = typeData.params;	// Fetch the params array from the typeMap entry appropriate for the current graph type

			this.$el.empty();

			if (this.options.edit)
			{
				this.$el.append(app.templates.pulldown({header: this.header, entries: app.graphTypeList(), selection:data[0].name}));

				for (var i = 0; i < params.length; i++)
					this.$el.append(app.templates.simpleInput({header: params[i], value: data[0].params[i] || ''}));
			}
			else
			{
				this.$el.append(app.templates.textItem({header: this.header, value: data[0].name || '<i>undefined</i>'}));

				for (var i = 0; i < params.length; i++)
					this.$el.append(app.templates.textItem({header: params[i], value: data[0].params[i] || '<i>undefined</i>'}));
			}

			var mml = createMML(typeData.mml, typeData.eqVars, data[0].params);

			var template = (this.model.get('ansType') === 'VTPGraph') ? 'formula' : 'formulaSimple';
			this.$el.append(app.templates[template]({header: "Formula", value: mml, text: "Copy formula to question"}));

			//----------------------
			app.jaxify(this.$el);
			//----------------------

			return this.el;
		},

		//---------------------------------------
		// Fetch the value from the control
		//---------------------------------------
		value: function() {
			var type = app.getGraphType(this.$('.pulldown').val());
            var paramList = app.graphTypeMap[type].params;	// Fetch the params array from the typeMap entry appropriate for the current graph type

			var out = [];
			this.$('.simpleInput').each( function() {
				out.push($(this).val());
			});

			// Strip off any extra parameters (on type change, value is called before render. Old input boxes are still there!)
			if (out.length > paramList.length)
				out.splice(paramList.length, out.length - paramList.length);

			// Special hack for points.  The last parameter is optional.
			if (type === 'point' && out[out.length-1] === '')
				out.splice(out.length - 1, 1);

			out = type + '=' + out.join(',');
			return [out];
		},

		//---------------------------------------
		// Store data to the fields of the model
		// that this view controls.
		//---------------------------------------
		setData: function(data) {

			// If there is no data, set a default.
			if (!data || data.length < 1)
				data = this.defaultData;

			var setObj = {};
			setObj[this.field] = data;
			this.model.set(setObj);
		},

		//---------------------------------------
		// Convert from model data to internal format
		//---------------------------------------
		modelToObject: function() {
			var data = this.model.get(this.field) || [];	// ['circle=3,5,9']
			var out = app.graphEqObject(data);
			return out;
		},

		//---------------------------------------
		//---------------------------------------
		copyToQ: function() {
			var data = this.modelToObject();
			var typeData = app.graphTypeMap[app.getGraphType(data[0].name)];
			var mml = createMML(typeData.mml, typeData.eqVars, data[0].params);
			this.model.set({q:mml});
		},

		//--------------------------
		// Close routine.  Unbind model events.
		//--------------------------
		close: function() {
			this.model.off(null, this.modelChanged);
		}

	});

	//=======================================================
	// Replace variables in an MML string with actual values
	//=======================================================
	function createMML(mml, vars, data)
	{
		for (var i = 0; i < vars.length; i++)
		{
			var regex = new RegExp('<param>' + vars[i] + '<\/param>', 'g');
			var test = mml.match(regex);

			var numVal = parseFloat(data[i]);
			if (!isNaN(numVal))
				var out = '<mn>' + data[i] + '</mn>';
			else
				out = '<mtext>' + data[i] + '</mtext>';

			mml = mml.replace(regex, out);
		}

		return mml;
	}

})();
