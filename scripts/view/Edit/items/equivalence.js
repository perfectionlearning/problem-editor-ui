//=======================================================
// Categories (checklist)

// TODO:
// "Save" behavior
// Add helpers to get data into XML
// Fetch the rule list from the master list (based on input type)

//=======================================================
;(function() {

	//=======================================================
	//=======================================================
	app.EquivalenceView = app.PEView.extend({
		header: 'Equivalence Rules',
		compare: app.simpleCompare,
		field: 'equiv',

/* -- No longer used. Included for reference. Moved to Node module.
		rules: {
			noPerfectSquaresUnderRadical: {
				text: "No perfect squares under radical",
				help: "If set, radicals can't have perfect squares in them."
			},

			rationalizeDenominator: {
				text: "Rationalized denominators",
				help: "If set, answers that are fractions can't have radicals in the denominator."
			},
			equivalentPoly: {
				text: "Allow equivalent polynomial",
				help: "If set, equivalent polynomials are accepted as correct, e.g. 2+x for x+2."
			},

			allowAbs: {
				text: "Allow absolute value",
				help: "If set, an expression with multiple terms must be surrounded by an absolute value."
			},

			allowSlop: {
				text: "Allow slop",
				help: "If set, decimal answers can have a variation of 1 in the least significant digit.  Example: 1.01 through 1.03 are accepted if the answer is 1.02."
			},

			simplify: {
				text: "Answers must be fully simplified",
				help: "Fractions must be reduced and like terms must be combined."
			},

			exactAnswer: {
				text: "Exact match required",
				help: "The user's answer must be completely identical to the author's answer."
			},

			exactDecimal: {
				text: "Exact decimal",
				help: "If set, decimal answers must be entered as authored."
			},

			NO_PARENTHESES: {
				text: "No parentheses allowed",
				help: "No parentheses are allowed in the answer if this is set."
			}

			exactEquation: {
				text: "Equations must be exact",
				help: "If set, equations must be entered exactly as authored."
			},

			noNegExp: {
				text: "No negative exponents",
				help: "If set, negative exponents aren't allowed in answers."
			},

			numericPowersCalculated: {
				text: "Numeric powers calculated",
				help: "If set, numeric powers must be calculated."
			},

			allFactorsCancelled: {
				text: "All factors cancelled",
				help: "If set, all factors must be cancelled for rational expressions."
			},

			factored: {
				text: "Factored polynomial",
				help: "If set, the answer is expected as a factored polynomial."
			},

			descendingOrder: {
				text: "Descending order",
				help: "If set, polynomials must be in descending order."
			},

			likeTermsCombined: {
				text: "Like terms combined",
				help: "If set, all like terms must be combined."
			},

			expandedPolynomial: {
				text: "Expanded polynomial",
				help: "If set, polynomials must be in expanded form."
			}

		},
*/

		//---------------------------------------
		//---------------------------------------
		events: {
			'click .startEdit': app.editMode,
			'click #equivSave': 'save',
			'click #equivCancel': 'cancel'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			this.original = this.last = (this.options.original && this.options.original.get(this.field));
			this.isDirty = !this.compare(this.model.get(this.field), this.original);

			this.render = _.bind(this.render, this);
			this.modelChanged = _.bind(this.modelChanged, this);
			this.model.bind('change:' + this.field, this.modelChanged);	// This needs to be unbound manually if the view is ever destroyed!
			this.model.bind('change:ansType', this.render);	// This needs to be unbound manually if the view is ever destroyed!

			this.rules = app.Equiv.ruleList();
		},

		//---------------------------------------
		// Hiding when not applicable is preferred, but the
		// code only works at the top level, not on steps.
		// Messing with parent elements isn't good practice anyway.
		//---------------------------------------
		render: function() {
			var that = this;
			var data = this.model.get(this.field) || "";
			data = app.convertXmlToObj(data);
			var doShow = (this.model.get('ansType') === 'input');
			this.$el.empty();

			if (this.options.edit)
			{
//				this.$el.parent().show();
				this.$el.append(app.templates.popup);

				// Create a pop-up container
				var popup = this.$('#popup');

				// Create the list html using the template
				var list = $(app.templates.listWithTips({id: "equiv", title: this.header, entries: this.rules}));

				// Convert the list into a checklist using our jQuery plugin
				$(list).children('ul').checklist(
				{
					checked: this.getChecks(data)
				})

				// Add it to the view
				popup.append(list);

				// Add some buttons
				popup.append(app.templates.button({id:'equivCancel', text: 'Cancel'}));
				popup.append(app.templates.button({id:'equivSave', text: 'Save'}));

				// Boing!
				popup.bPopup({
					modalClose: false,
					appendTo: this.el
				});
			}

			// Do this in edit and read-only modes. We don't want to skip it if the pop-up is active.
			if (doShow)
			{
//				this.$el.parent().show();
				var compact = this.prepROData(data) || '<i>None</i>';
				this.$el.append(app.templates.textItem({header: this.header, value: compact}));
			}
			else
//				this.$el.parent().hide();
				this.$el.html(app.templates.textItemReadOnly({header: this.header, value: 'N/A'}));	// When inapplicable

			return this.el;
		},

		//---------------------------------------
		//---------------------------------------
		cancel: function() {
			this.$('#popup').bPopup().close();
			app.stopEditMode.call(this);
		},

		//---------------------------------------
		//---------------------------------------
		save: function() {
			var newData = this.$("#equiv").checklist('value');		// Array of true/false values
			this.lastSaved = this.convertToXml(newData);

			this.$('#popup').bPopup().close();
			app.stopEditMode.call(this);	// Calls render(). app.changed also calls render() on a change only

			app.changed.call(this);		// Let the framework know that the data has changed
		},

		//---------------------------------------
		// Fetch the value from the control
		//---------------------------------------
		value: function() {
			return this.lastSaved;
		},

		//---------------------------------------
		// Determine which items should be checked.
		// We're dealing with 2 objects, which are
		// inherently orderless. Use the same mechanism
		// used in the draw ($.each) so they are in sync.
		//---------------------------------------
		getChecks: function(data)
		{
			var out = [];

			var idx = 0;
			$.each(this.rules, function(rule) {
				if (data[rule] && data[rule].setting)
					out.push(idx);

				idx++;
			});

			return out;
		},

		//---------------------------------------
		// Convert from an array of true/false (one per checkbox)
		// to our XML rule list string
		// Apply ordering to our new list that matches the original list as close as possible
		//---------------------------------------
		convertToXml: function(data)
		{
			// First, create a list of all active rules
			var active = {};
			var idx = 0;
			$.each(this.rules, function(rule) {
				if (data[idx++])
					active[rule] = true;
			});

			// Create an ordered list based on the original data
			var orig = app.convertXmlToObj(this.original);

			// Convert original(true) items to a sorted array
			var ary = [];
			$.each(orig, function(key, val) {
				if (val.setting)
					ary.push({name: key, order: val.order});
			});
			ary.sort(function(a,b){return a.order-b.order});

			var out = '';

			// Add items that are in the original, in order
			$.each(ary, function(idx, val) {
				if (active[val.name])
				{
					out += '<rule value="True" id="' + val.name + '"/>';
					delete active[val.name];
				}
			});

			// Add items that aren't in the original, in any order
			$.each(active, function(key) {
				out += '<rule value="True" id="' + key + '"/>';
			});

			return out;
		},

		//---------------------------------------
		// Convert internal data structure to a
		// string with a compact list of active rules.
		//---------------------------------------
		prepROData: function(data)
		{
			var that = this;

			var all = [];
			$.each(data, function(rule, fields) {
				if (fields.setting)
				{
					if (that.rules[rule])
						all.push(that.rules[rule].text);
					else
						all.push('Unknown:' + rule);
				}
			});

			return all.join(', ');	// Format the list
		},

		//---------------------------------------
		// Close routine.  Unbind model events.
		//---------------------------------------
		close: function() {
			this.model.off(null, this.render);
			this.model.off(null, this.modelChanged);
		}

	});

	//=======================================================
	//=======================================================
	function singleIndex(ary)
	{
		for (i = 0; i < ary.length; i++)
			if (ary[i])
				return i;

		return -1;
	}

})();
