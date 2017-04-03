//=======================================================
// Pulldown control
//=======================================================
;(function() {
	app.AnswerTypeView = app.PEView.extend({
		header: 'Answer type',
		compare: app.simpleCompare,
		field: 'ansType',
		map: {							// Convert between model values and display values
			MultKinetic: {text:'Free Input', note: "Numbers only, no fractions. One or more inputs embedded inside math and other styled text using a free-form layout."},	// 'One or more simple input boxes with optional surrounding text'
			essay: {text:'Essay', note: "Simple text input"},
			input: {text: 'Equation', note: 'Kinetic Input'},
			radio: {text: 'Radio button', note: 'Multiple choice, single selection'},
			check: {text: 'Checkbox', note: 'Multiple choice, multiple selections'},
			VTPGraph: {text: 'Graph Plot', note: 'User plots points on a graph'},
			graphConst: {text: 'Graph Constant', note: 'User enters constants to match the displayed graph'},
			multiPart: {text: "Multi-part", note: "A question divided into multiple parts", disableInSteps: true},
			dragDrop: {text: 'Drag-and-Drop', note: 'Drag-and-drop hot text'},

			"no input": {text: 'No Input', note: 'Pencil and paper input'}
		},

		//---------------------------------------
		//---------------------------------------
		events: {
			'click .startEdit': app.pulldownEditMode,
			'click .stopEdit': app.stopEditMode,
			'change': app.changed,

			'click #convert': 'doConversion'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			var that = this;
			this.original = this.last = this.options.original && this.options.original.get(this.field);
			this.isDirty = !this.compare(this.model.get(this.field), this.original);

			this.list = [];
			$.each(this.map, function(idx, val) {

				// Certain input types aren't allowed in steps.
				if (that.options.isStep && val.disableInSteps)
					return true;

				that.list.push(val.text);
			});

			this.modelChanged = _.bind(this.modelChanged, this);
			this.model.on('change:' + this.field, this.modelChanged);	// This needs to be unbound manually if the view is ever destroyed!
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			app.pulldownRender.call(this);

			var data = this.model.get(this.field);
			if (!this.options.compact)
				var note = (this.map[data] && this.map[data].note) || '';

			this.$el.append(app.templates.sideText({text: note}));

			// Add a special button to allow converting from Equation to Free Input types
			// Hopefully this is temporary or will at least have a better conditional check.
			// It will only do anything if there is at least one variable block in the answer,
			// so it might be best to check for that first.
			// 5/12/14 DG: Removed
//			if (data === 'input')
//				this.$el.append(app.templates.button({id:'convert', text: 'Make Free Input'}));

			return this.el;
		},

		//---------------------------------------
		// Fetch the value from the control
		//---------------------------------------
		value: function() {
			// Impose a simple translation layer between the model and control
			var cur = this.$el.find('select').val();
			var res;
			$.each(this.map, function(key, val) {
				if (cur === val.text)
					res = key;
			});

			return res;
		},

		//---------------------------------------
		// Transforms the model data to
		// a friendlier text format
		//---------------------------------------
		transform: function() {
			// Impose a simple translation layer between the model and control
			var value = this.model.get(this.field);
			return this.map[value] && this.map[value].text;
		},

		//---------------------------------------
		//---------------------------------------
		doConversion: function() {
			// Change answer type
			var newObj = {};
			newObj[this.field] = "MultKinetic";
			this.model.set(newObj);

			// Change answer
			var ans = this.model.get('a') || "";
			var fixed = app.wrapVars(ans);
			this.model.set({a:fixed});
		},

		//--------------------------
		// Close routine.  Unbind model events.
		//--------------------------
		close: function() {
			this.model.off(null, this.modelChanged);
		}

	});
})();
