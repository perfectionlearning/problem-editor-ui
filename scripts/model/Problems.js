//=======================================================
// Problem model / Problem Set collection
//=======================================================
(function() {

	//=======================================================
	// Clean this routine.  It's currently full of hacks.
	//=======================================================
	function cleanModel(mod)
	{
		if (mod == null)
			return mod;

		// Ignore response messages
		if (mod.msg)
			return mod;

		// We need a valid answer type.
		if (!mod.ansType)
			mod.ansType = 'MultKinetic';

		// Normalize incoming HTML strings
		cleanObj(mod);

		if (mod.solve)
		{
			for (var i = 0; i < mod.solve.length; i++)
			{
				mod.solve[i].order = i;
				cleanObj(mod.solve[i]);
			}
		}
		else
			mod.solve = [];		// Protection. Assumed to exist later on.

		return mod;
	}

	//=======================================================
	// Cleans up HTML strings in an object
	//=======================================================
	function cleanObj(obj)
	{
		// There should always be a question and answer
		if (obj.q) obj.q = cleanHtml(obj.q);
		if (obj.a) obj.a = cleanHtml(obj.a);

		// There is often a question prefix
		if (obj.q_prefix) obj.q_prefix = cleanHtml(obj.q_prefix);

		// Multiple choice questions have choice entries
		if (obj.choices)
		{
			for (var i = 0; i < obj.choices.length; i++)
				obj.choices[i] = cleanHtml(obj.choices[i]);
		}

		// If this is a step, there may be a hint
		if (obj.hint)
			obj.hint = cleanHtml(obj.hint);
	}

	//=======================================================
	// Cleans up HTML strings
	//
	// An alternate (less safe, but guaranteed to always work)
	// method would be to write the HTML into a hidden DOM
	// element and read it back.
	//=======================================================
	function cleanHtml(str)
	{
		var regex, replace;

		// This removes all empty class declarations from span tags
		regex = /(<span[^>]*?)\s*class=(?:''|"")([^>]*>)/g;
		replace = '$1$2';
		str = str.replace(regex, replace);

		// Convert all single quotes in tags to double quotes
		regex = /<[^>]*>/g;
		str = str.replace(regex, function(full) {
			return full.replace(/'/g, '"');
		});

		// Perform character translation
		// Note that we can only replace < > characters that aren't part of tags!
		// Note that we can't replace & characters if they're part of web-safe tags (e.g. &gt; can't be changed)
		var findReplace = [
//			[/&/g, "&amp;"],
//			[/</g, "&lt;"],
//			[/>/g, "&gt;"],
			[/&#8722;/g, "\u2212"],	// Negatives: convert &#8722 to the unicode character
			[/<mo>\s*<\/mo>/g, ""]	// Remove the "angry box" -- empty <mo> blocks (we might also need to check for <mo> blocks containing zero width spaces
		];

		$.each(findReplace, function(idx, val) {
			str = str.replace(val[0], val[1]);
		});

		// Clean up variable definitions.  This should only occur on freshly imported data coming in from Word.
		str = app.cleanBrackets(str);

		return $.trim(str);
	}

	//=======================================================
	// Test hook
	//=======================================================
	app.testCleanHtml = function(data)
	{
		return cleanHtml(data);
	}

	//=======================================================
	// Cleans up variable definitions inside MathML
	//=======================================================
	/*
	function cleanVars(str)
	{
		var regex = /<mtext>(\[.+?\])<\/mtext>/g;
		return str.replace(regex, '$1');
	}
	*/

	//=======================================================
	// Step Model
	//=======================================================
	app.Step = Backbone.Model.extend({
		initialize: function(options) {
			var that = this;
			this.on('change', function() {
				that.collection.parent.trigger('change');	// Pass on a generic change message
			});
		},

		defaults: {
			q:'',
			a:'',
			ansType: 'MultKinetic',
//			choices: [],
			hint: '',
			wb: '',
			equiv: '',
			graphequations: [],	// This needs to be sent, or the server kersplodes
			tags: []
		}
	});

	//=======================================================
	// Step Collection
	//=======================================================
	app.StepCollection = Backbone.Collection.extend({
		model: app.Step,

		// Bind to reset
		initialize: function(options) {
			var that = this;
			this.on('reset', function() {
				that.parent.trigger('change');	// Pass on a generic change message
			});
		},

		comparator: function(step) { return step.get('order') }
	});

	//=======================================================
	// Problem Model
	//=======================================================
	app.Question = Backbone.Model.extend({

		// This needs to be in the constructor rather than initialize. The run order is:
		// constructor, parse, initialize if creating a new model with {parse:true}
		constructor: function() {
			this.solve = new app.StepCollection();
			this.solve.parent = this;

			Backbone.Model.apply(this, arguments);
		},

		urlRoot: app.commRoot + '/problems',

		defaults: {
			q:'',
//			q_prefix:'',
			a:'',
			ansType: 'MultKinetic',
//			equiv: '',
			chID: '',
//			qImg: '',
			graphequations: [],	// Graph associated with the question (read only VTP graph)
//			graphparms: {},
//			choices: [],
			diff:'Medium',
			maxScore:5,
			repetitions: 1,
//			wb:'',
//			vars:[],		// An empty array breaks things.  Better to be completely empty.
			constraints: [],
			qImgText: [],
			tags: []
		},

		//--------------------------------
		// Individual models are being returned in the same format as a collection.  Just grab the
		// first entry and use it.
		//
		// Note that fetching collections calls the collection parse routine, then calls the model parse routine for each model!
		// Having both is slow, and extra care needs to be taken to avoid redundant work.
		//--------------------------------
		parse: function(response) {
			if (response === undefined || (isArray(response) && response.length === 0))
				return;

			var out = cleanModel(response);

			// Deal with embedded collection
			this.solve.reset(out.solve);
			out.solve = this.solve;

			return out;
		},

		//--------------------------------
		//--------------------------------
		toJSON: function() {
			return _.extend(
				_.clone(this.attributes),
				{solve: this.solve.toJSON()}
			);
		},

		//--------------------------------
		// reset is a bad name. We don't normally reset models!
		//--------------------------------
		reset: function(data, options) {
			var steps = data.solve;
			delete data.solve;

			this.clear(options);
			this.set(data);

			this.solve.reset(steps);
			this.attributes.solve = this.solve;

			// @FIXME/dg: Hack! This should be handled in the view, not the model!
			this.trigger('stepChange');
		},

		//--------------------------------
		// Insert a step at an arbitrary position
		//--------------------------------
		insertStep: function(step, idx) {
			// Ensure we're in range
			if (idx > this.solve.length)
				idx = this.solve.length;

			// They should already be sorted, but don't assume.
			this.solve.sort();

			// Move everything down
			for (var i = idx; i < this.solve.length; i++)
				this.solve.at(i).set({order: i+1}, {silent: true});

			// Add the new step
			var newModel = _.extend({order:idx}, step);
			delete newModel.id;		// Prevent overwrite of existing items
			this.solve.push(newModel);

			// Re-sort
			this.solve.sort();

			// This shouldn't necessarily be here, but let the outside world know we've updated.
			this.trigger('stepChange');
		},

		//--------------------------------
		// Delete a step at an arbitrary position
		//--------------------------------
		deleteStep: function(idx) {
			// Ensure we're in range
			if (idx > this.solve.length)
				return;

			// They should already be sorted, but don't assume.
			this.solve.sort();

			// Move everything up
			for (var i = idx+1; i < this.solve.length; i++)
				this.solve.at(i).set({order: i-1}, {silent: true});

			// Delete the target
			var toDel = this.solve.at(idx).get('id') || this.solve.at(idx).cid;
			this.solve.remove(toDel);

			// Re-sort
//			this.solve.sort();

			// This shouldn't necessarily be here, but let the outside world know we've updated.
			this.trigger('stepChange');
		},

		//--------------------------------
		// Not only wipes out all steps, but breaks the
		// reference to the original collection.
		//--------------------------------
		resetSteps: function() {
			this.solve = new app.StepCollection();
			this.solve.parent = this;

			this.attributes.solve = this.solve;
		}
	});

	//=======================================================
	// Figure out the correct URL for a problem revision.
	// It could be built into the model, but this feels cleaner.
	//=======================================================
	app.probRevisionUrl = function(id, revID)
	{
		return app.commRoot + '/problems/' + id + '/revision/' + revID;
	}

	//=======================================================
	// Backdoor command to set question art
	//=======================================================
	app.addArt = function(name)
	{
		app.curProblem.set({qImg:name});
	}

	//=======================================================
	// Backdoor command to set the whiteboard
	//=======================================================
	app.addWB = function(name)
	{
		app.curProblem.set({wb:name});
	}

})();
