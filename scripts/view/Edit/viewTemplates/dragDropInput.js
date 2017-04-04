//=======================================================
// Choice List
//=======================================================
;(function() {

	//=======================================================
	//=======================================================
	app.DragDropView = app.PEView.extend({
		header: 'Answer',
		compare: app.objectCompare,
		field: 'a',

		colHeadersA: ['Part  A Variables', 'Is Correct'],
		colHeadersB: ['Part  B Variables', 'Sequence', 'Is Operator'],

		JSONTemplate: {
			a: "3,9,12,7,16,10",
			presentation_data: {
				answer_val_map: {
					"0": "x = day of the week",
					"1": "x = weekly expenses",
					"2": "x = weekly income",
					"3": "x = number of weeks",
					"4": "1,000",
					"5": "3,200",
					"6": "4,500",
					"7": "10,000",
					"8": "1,000x",
					"9": "3,200x",
					"10": "4,500x",
					"11": "10,000x",
					"12": "+",
					"13": "-",
					"14": "*",
					"15": "\/",
					"16": "="
				},
				interactive_frames: [
					{
						title: 'Options',
						title_display: null,
						orientation: 'left',
						style: 'vertical_content_box',
						contents: [4,5,6,7,8,9,10,11,12,13,14,15,16],
						interaction_method: 'drag-elements',
						content_display_columns: 1,
						content_display_rows: 13,
						maintain_contents_order: true,
						sends_answer: false
					},
					{
						title: 'Part A: Variable Choices',
						title_display: 'h3, bold, left-top',
						orientation: 'right-top',
						style: 'standard_content_box',
						contents: [0,1,2,3],
						interaction_method: 'select-elements-single',
						content_display_columns: 2,
						content_display_rows: 2,
						maintain_contents_order: true,
						sends_answer: false,
						answer_modes: [
							{
								answer_slot: 0,
								source: 'selection',
								order: 0
							}
						]
					},
					{
						title: 'Part B: Equation',
						title_display: 'h3, bold, left-top',
						orientation: 'right-top',
						style: 'standard_drop_box',
						contents: [
							{"id": 0, "shape": "rect", "line": "dotted"},
							{"id": 1, "shape": "circ", "line": "dotted"},
							{"id": 2, "shape": "rect", "line": "dotted"},
							{"id": 3, "shape": "circ", "line": "dotted"},
							{"id": 4, "shape": "rect", "line": "dotted"}
						],
						interaction_method: 'drag-drop-elements',
						external_drop_in: true,
						content_display_columns: 5,
						content_display_rows: 1,
						maintain_contents_order: true,
						sends_answer: false,
						answer_modes: [
							{
								"answer_slot": 1,
								"source": "contents.id.0",
								"order": 0
							},
							{
								"answer_slot": 2,
								"source": "contents.id.1",
								"order": 1
							},
							{
								"answer_slot": 3,
								"source": "contents.id.2",
								"order": 2
							},
							{
								"answer_slot": 4,
								"source": "contents.id.3",
								"order": 3
							},
							{
								"answer_slot": 5,
								"source": "contents.id.4",
								"order": 4
							}
						]
					},
				],
				type: 'fill_in_answers'
			}	
		},

		//---------------------------------------
		//---------------------------------------
		events: {
			'click .startEdit': app.editMode,
			'click .stopEdit': 'stopEdit',
			'change': 'changed',
			'click .multi': 'doSelect',
			'click .editme': 'editChoice',
			'globalSave': 'closeEditor',
			'click #done': 'closeEditor'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			this.original = this.last = this.valueFromModel(this.options.original);
			var data = this.valueFromModel(this.model);
			this.isDirty = !this.compare(data, this.original);

			this.modelChanged = _.bind(this.modelChanged, this);
			this.changed = _.bind(this.changed, this);
			this.closeEditor = _.bind(this.closeEditor, this);

			this.model.on('change:choices', this.modelChanged);
			this.model.on('change:a', this.modelChanged);
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var that = this;
			var data = this.valueFromModel(this.model);
			this.prettifyChoices(data);

			if (this.options.edit)
			{
				// Create a table, then convert it to a flex table
				this.$el.html(app.templates.tableDragDrop({
					header: this.header,
					id: 'multi' + app.ctr,
					headClass: 'stopEdit',
					tableClass: '',
					dataVariables: {
						columns: ['richEdit', this.type, 'flex'],
						headers: this.colHeadersA,
						inpWidth: 50,
						data: data.partA,
						noSanitize: true
					},
					dataEquations: {
						columns: ['richEdit', 'numinput', this.type, 'flex'],
						inpWidth: 10,
						headers: this.colHeadersB,
						data: data.partB,
						noSanitize: true
					}
				}));
				var field = this.model.get(that.field);
				answer = this.JSONTemplate.a;
				presentation_data = this.JSONTemplate.presentation_data;
//				fw.tableSetChecked(this.$el, makeIntList(answer, presentation_data));
				fw.tableSetChecked(this.$el, data.checked);

				// This should probably be done elsewhere.
				this.$('#multi' + app.ctr + 'Add').btnAddRow({preAddCallBack: that.closeEditor}, that.changed);
				this.$('.multi' + app.ctr + 'Del').btnDelRow({preDelCallBack: that.closeEditor}, that.changed);

				app.ctr++;
			}
			else
			{
				// Read-only table view
				this.$el.html(app.templates.tableDragDrop({
					header: this.header,
					id: 'multi' + app.ctr++,
					headClass: 'startEdit',
					tableClass: 'startEdit',
					dataVariables: {
						columns: ['raw', 'showCheck'],
						headers: this.colHeadersA,
						data: data.partA,
						noSanitize: true
					},
					dataEquations: {
						columns: ['raw', 'numinput', 'showCheck'],
						inpWidth: 10,
						headers: this.colHeadersB,
						data: data.partB,
						noSanitize: true
					},
					message: 'Hi, there!'
				}));
			}

			app.jaxify(this.$el);
			return this.el;
		},

		//---------------------------------------
		// Fetch the value from the model, converting to
		// our internal format.
		// We use an internal format instead of directly using model data
		// because this item combines two different model fields.
		//---------------------------------------
		valueFromModel: function(model) {
			var presentation_data = (model && model.get('presentation_data') || {});
			var answers = (model && model.get(this.field)) || '';
			presentation_data = this.JSONTemplate.presentation_data;
			var a = this.JSONTemplate.a;
			answers = a.split(',').map((elem) => { return parseInt(elem, 10); });
			var out = parsePresentationData(a, presentation_data);

			return out;
		},

		//---------------------------------------
		// Convert from internal format to model format
		//---------------------------------------
		valueToModel: function(value) {
			var choices = [];
			var a = [];
			var order = [];
			$.each(value, function(idx, val) {
				choices.push(val[0]);
				if (val[1]) {
					order.push(val[1]);
				}
				if (val[2]) {
					a.push(idx);
				}
			});
			var answers = a.join(',');
console.log('valueToModel choices, answers, order', choices, answers, order);
			return [choices, answers];
		},

		//---------------------------------------
		// Fetch the value from the control, converting to
		// our internal format
		//---------------------------------------
		value: function() {
			var choices = this.$('.editme>div');
			var answers = this.$('.multi>input');
			var orders = this.$('.text-input>input');
			var offset = choices.length - orders.length;

			var regex = /(<.+?)'(.*?)'(.*?>)/g;	// Convert all " to ' in the html for proper comparison

			var data = [];
			for (var i = 0, len = choices.length; i < len; i++)
			{
				var entry = app.removeMathJax(choices[i].innerHTML);
				entry = app.restoreMathML(entry);
				if (entry === '&nbsp;' || entry === ' ' || entry === '\u00A0')
					entry = '';

				var checked = answers[i].checked;
				var order = i >= offset ? orders[i-offset].value : null;

				data.push([entry, order, checked])
			}

			return data;
		},

		//---------------------------------------
		// Extract composite data from all fields
		// in the model that this view controls.
		//---------------------------------------
		getData: function() {
			return this.valueFromModel(this.model);
		},

		//---------------------------------------
		// Store data to the fields of the model
		// that this view controls.
		//---------------------------------------
		setData: function(data) {
			// Split data into choice and answer sections
			var out = this.valueToModel(data);
			var presentationData = this.buildPresentationData();
console.log('setData out', out);
			// Update model
			this.model.set({
				'order_matters': true,
				'partial_correct': true,
				'presentation_data': presentationData,
				choices: out[0],
				a: out[1]
			});
		},

		//---------------------------------------
		//---------------------------------------
		buildPresentationData: function() {
			var pd = this.JSONTemplate.presentation_data;
			var val = this.value();
			var answers = val.map((row) => { 
				return row[0];
			});
			var options = val.map((row) => { 
				return row[1];
			});
			var variable_choices = val.map((row) => { 
				return row[2];
			});
			pd.answer_val_map = answers;
			pd.interactive_frames[0].contents = options;
			pd.interactive_frames[1].contents = variable_choices;
			return pd;
		},

		//---------------------------------------
		// The model has changed (externally)
		// Notify the container that an update has occurred.
		// This starts a cascade with some redundancies, but it gets the job done.
		//---------------------------------------
		modelChanged: function() {
			// Display the new value
			this.render();

			// Update the isDirty flag (using the simplest comparison -- this is the part that needs
			// to be overridden in some cases.)
			this.isDirty = !this.compare(this.valueFromModel(this.model), this.original);

			// This trigger/isDirty update cause all review panes to update
			this.$el.trigger('updated');
		},

		//---------------------------------------
		// We can't use the generic change handler
		// This version is slightly different
		//---------------------------------------
		changed: function() {
			// A bit of a hack.  Webkit is allowing change events when clicking the checkbox (but not Firefox)
			if (!this.options.edit)
				return;

			// Webkit fix 2: Changed is reported before multi.click.
			// We can possibly improve the behavior here, by either closing the editor or calling doSelect now.
			if (this.activeEditor)
				return;

			// Get the current value of the control
			var val = this.value();
console.log('changed: ', val);
			// Store it to the model
			this.setData(val);

			// Trigger change event
			this.isDirty = !this.compare(this.value(), this.original);
			this.$el.trigger('updated');
		},

		//---------------------------------------
		// Allow selection of radio/check boxes
		// when the answer column is clicked
		//---------------------------------------
		doSelect: function(ev) {
			this.closeEditor();		// Should we close any open editors??

			// Only activate on the surrounding div, not the input itself.  Otherwise we get a double
			// activation, which breaks checks.
			if (ev.target != ev.currentTarget)
				return;

			var test = this.$('.multi').index(ev.currentTarget);
			if (this.type === 'radio')
				fw.tableSetChecked(this.$el, test);
			else
				fw.tableToggleChecked(this.$el, test);

			this.$el.trigger('change');	// Trigger a change (otherwise
		},

		//---------------------------------------
		// Edit the choice that was just clicked
		//---------------------------------------
		editChoice: function(ev) {
			var target = $(ev.currentTarget).children();
			if (target.hasClass('richEdit') || ev.target.nodeName.toLowerCase() === 'button')
				return;

			var idx = this.$('.editme').index(ev.currentTarget);	// This MUST go before closeEditor! ev.currentTarget will soon be obsolete.
console.log('editChoice idx', idx);
//			var data = this.valueFromModel(this.model)[idx][0];		// Use valueFromModel rather than directly doing model.get. valueFromModel has safety code for missing data.
			var data = this.valueFromModel(this.model);
			var partA = data.partA;
			var partB = data.partB;
			if (idx < data.partA.length) {
				var row = data.partA[idx];
			}
			else {
				var row = data.partB[idx - data.partA.length];
			}
			var value = row[0];

			// Close any existing editors -- This may cause a change event, which causes render(), which causes ev.currentTarget to be invalid!
			this.closeEditor();

			// Find the target based on the index.  closeEditor destroyed the old one, if it did anything.
			target = this.$('.editme')[idx];	// Find the correct <td>
			target = $(target).children();		// Get the children, like we did intitially

console.log('editChoice data', data);
			// Convert <div> to <textarea> for editing. This should be hidden away somewhere else!
			target.replaceWith(app.templates.choiceEditor({value: value}));

			// Update the target yet again. It's different now. We could cache it, but it's a child of the template, not the template itself.
			target = this.$('.richEdit');
			this.activeEditor = target;
			target.ckeditor();
		},

		//---------------------------------------
		// Close any active editors
		//---------------------------------------
		closeEditor: function()
		{
			if (!this.activeEditor)
				return;

			// Close WIRIS if it's open
			if (_wrs_int_window_opened)
				_wrs_int_window.close();

			// Remove the done button if it exists. This is a bit questionable, but there is no render() if content
			// hasn't changed. Opening CKEditor and pressing the Done button doesn't cause a change or render, so the
			// button was staying.
			var button = this.activeEditor.parent().find('#done');
			button && button.remove();

			var hasChanged = this.activeEditor.ckeditorGet().checkDirty();

			var editor = this.activeEditor;
			editor.ckeditorGet().destroy();

			var content = editor.val();
			content = this.filterMML(content);
			content = app.prettyDisplay(content);

			// Convert <textarea> back to <div> for display. This should be hidden away somewhere else!
			var that = this;
			editor.replaceWith(function () {
				return $("<div />").html(content);
			});

			this.activeEditor.removeClass('richEdit');
			this.activeEditor = null;

			// Trigger a change event -- there is currently no way for this to occur without a change event already triggering,
			// but if the UI is modified at all there could be.
			// The day has come.  We need a change event.  However, it's causing a crash some of the time.
			// The solution was to stop rendering on change events.
			if (hasChanged)
				this.changed();

			// Similar to the button, if there's no change there's no render. Any MathML won't be MathJaxed.
			// The only time we care about this is when MathML is present. Ironically (or sadly), if there's
			// MathML then CKEditor always reports a change has occurred. This occurs because WIRIS converts the
			// MathML to an image. We only want to re-jaxify is no change has occurred, but we can't reliably
			// detect that.
			app.jaxify(this.$el);
		},

		//---------------------------------------
		// Clean up WIRIS MML
		// @FIXME/dg: This is an exact copy from richEdit!
		//
		// Actually, it's been streamlined a bit. However, the basic
		// procedures are the same and need to stay in sync.
		// A third copy exists for overlays.
		//---------------------------------------
		filterMML: function(content) {
			var cleaned = this.stripSingleParagraphs(content);
			cleaned = app.cleanWirisMML(cleaned);

			return cleaned;
		},

		//---------------------------------------
		// If there is only a single paragraph, strip the <p> markers
		// @FIXME/dg: This is an exact copy from richEdit!  This module should use a richEdit view!
		//---------------------------------------
		stripSingleParagraphs: function(string) {
			if (!string)
				return string;	// Probably a null string, but pass it back anyway

			var match = string.match(/<p>/g);
			if (match && match.length === 1 && string.indexOf('<p>') === 0)
				string = string.replace(/<p>(.*)<\/p>/g, "$1");

			return string;
		},

		//=======================================================
		//=======================================================
		prettifyChoices: function(data)
		{
			for (var i = 0; i < data.length; i++)
			{
				data[i][0] = app.prettyDisplay(data[i][0]);
			}
		},

		//---------------------------------------
		//---------------------------------------
		stopEdit: function()
		{
			// Close any open editors
			this.closeEditor();

			// Prevent changes from being lost
			this.changed();

			// Exit edit mode
			app.stopEditMode.call(this);
		},

		//--------------------------
		// Close routine.  Unbind model events.
		//--------------------------
		close: function() {
			this.model.off(null, this.modelChanged);
		}

	});


	//=======================================================
	// Create data for the read-only version of the choice list
	//=======================================================
	function makePartAList(answer_val_map, part, answers)
	{
		var out = [];

		part.forEach((ndx) => {
			var checked = (answers.indexOf(ndx) !== -1) ? 1 : 0;
			out.push([answer_val_map[ndx], checked]);
		});

		return out;
	}

	//=======================================================
	// Create data for the read-only version of the choice list
	//=======================================================
	function makePartBList(answer_val_map, part, opts, answers)
	{
		var out = [];

		part.forEach((ndx) => {
			var order = answers.indexOf(ndx);
			var isOp = false;
			if (order === -1) { order = null; }
			else { isOp = (opts[order-1].shape === 'circ'); }
			out.push([answer_val_map[ndx], order, isOp]);
		});

		return out;
	}


	//=======================================================
	// Converts an answer string ("1,5,2") to a sorted array of ints ([1,2,5])
	//=======================================================
	function makeIntList(answer, presentation_data)
	{
		var partA = presentation_data.interactive_frames[0];
		var partB = presentation_data.interactive_frames[2];
		var contentsA = partA.contents;
		var contentsB = partB.contents;

		var a = answer.split(',').map((item) => { return parseInt(item, 10); });
		var answersB = [];
		a.forEach((item) => {
			if (contentsA.indexOf(item) !== -1) { answersB.push(item); }
		});
		if (!answer)
			return [];

		var out = [3];

		contentsB.forEach((obj, ndx) => {
			if (obj.shape === 'circ') {
				out.push(answersB[ndx]);
			}
		});
console.log('makeIntList out', out);
		return out;
	}

	//=======================================================
	//=======================================================
	function parsePresentationData(answersStr, presentation_data) {
		answers = answersStr.split(',').map((a) => { return parseInt(a, 10); });
		var answer_val_map = presentation_data.answer_val_map;
		var interactive_frames = presentation_data.interactive_frames;
		var opts = interactive_frames[2];
		var partA = interactive_frames[1];
		var partB = interactive_frames[0];
		var contentsA = partA.contents;
		var contentsB = partB.contents;
		var contentsOpts = opts.contents;
		var lengthA = contentsA.length;

		var answersA = [];
		var answersB = [];		
		var checked = [];
		var listA = [];
		var listB = [];

		var aItems = 0;
		answers.forEach((ndx, aNdx) => {
			if (ndx < lengthA) {
				aItems++;
				checked.push(ndx);
			}
			else {
				var contentsOptsNdx = aNdx - aItems;
				if (contentsOpts[contentsOptsNdx].shape === 'circ') {
					checked.push(ndx);
				}
			}
		});

		contentsA.forEach((ndx) => {
			var checked = (answers.indexOf(ndx) !== -1) ? 1 : 0;
			listA.push([answer_val_map[ndx], checked]);
		});
		
		contentsB.forEach((ndx) => {
			var order = answers.indexOf(ndx);
			var isOp = false;
			if (order === -1) { order = null; }
			else { isOp = (contentsOpts[order-1].shape === 'circ'); }
			listB.push([answer_val_map[ndx], order, isOp]);
		});

		var out = {
			checked: checked,
			partA: listA,
			partB: listB
		};
		return out;
	}

})();
