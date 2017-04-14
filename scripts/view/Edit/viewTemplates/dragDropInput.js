//=======================================================
// Choice List
//=======================================================
;(function() {

	var dragDropData;

	//=======================================================
	//=======================================================
	app.DragDropView = app.PEView.extend({
		header: 'Answer',
		compare: app.objectCompare,
		field: 'a',

		colHeadersA: ['Part  A Variables', 'Is Correct'],
		colHeadersB: ['Part  B Variables', 'Sequence', 'Is Operator'],

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
			dragDropData = app.EOC.parsePresentationData('dragDrop', this.model);

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
					bottom_id: 'bott_multi' + app.ctr,
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
				fw.tableSetChecked(this.$el, data.checked);
				// This should probably be done elsewhere.
				this.$('#multi' + app.ctr + 'Add').btnAddRow({preAddCallBack: that.closeEditor}, that.changed);
				this.$('#bott_multi' + app.ctr + 'Add').btnAddRow({preAddCallBack: that.closeEditor}, that.changed);
				this.$('.multi' + app.ctr + 'Del').btnDelRow({preDelCallBack: that.closeEditor}, that.changed);
				this.$('.bott_multi' + app.ctr + 'Del').btnDelRow({preDelCallBack: that.closeEditor}, that.changed);

				app.ctr++;
			}
			else
			{
				// Read-only table view
				this.$el.html(app.templates.tableDragDrop({
					header: this.header,
					id: 'multi' + app.ctr++,
					bottom_id: 'bott_multi' + app.ctr,
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

			this.$el.append(app.templates.dragDropPreview({ blanks: dragDropData.bottomFrameBlanks }));
			this.$el.append(app.templates.dragDropVariable({variable: dragDropData.variable}));

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
/*
			if (!model) model = this.model;
			if (model && model.get('end_of_course')) {
				var end_of_course = model.get('end_of_course')[0];
				var presentation_data = end_of_course.presentation_data || '{}';
				presentation_data = JSON.parse(presentation_data);
				var answers = (model && model.get(this.field)) || '';
			}
//			var out = parsePresentationData(answers, presentation_data);
*/
			dragDropData = app.EOC.parsePresentationData('dragDrop', model);
			var out = dragDropData.tableRows;
			return out;
		},

		//---------------------------------------
		// Convert from internal format to model format
		//---------------------------------------
		valueToModel: function(value) {
			var obj = app.EOC.dragDropValues(value, this.model);

			return [obj.choices, obj.answers];
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
//			var end_of_course = valueToEndOfCourse(data, this.model.get('end_of_course'));
			var adjusted = app.EOC.adjustDragDropModel(data, this.model);
			// Update model
			this.model.set({
				end_of_course: adjusted.end_of_course,
				choices: out[0],
				a: adjusted.a
			});
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

			// Store it to the model
			this.setData(val);
			dragDropData = app.EOC.parsePresentationData('dragDrop', this.model);
			// Trigger change event
			this.isDirty = !this.compare(val, this.original);
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

			// This is all to get the value.
			var data = this.valueFromModel(this.model);
			var partA = data.partA;
			var partB = data.partB;
			if (idx < data.partA.length) {
				var row = data.partA[idx];
			}
			else {
				var row = data.partB[idx - data.partA.length];
			}
			// Got row; now extract value from it. The rest, we don't need.
			var value = row[0];

			// Close any existing editors -- This may cause a change event, which causes render(), which causes ev.currentTarget to be invalid!
			this.closeEditor();

			// Find the target based on the index.  closeEditor destroyed the old one, if it did anything.
			target = this.$('.editme')[idx];	// Find the correct <td>
			target = $(target).children();		// Get the children, like we did intitially

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
		return out;
	}
/*
	//=======================================================
	//=======================================================
	function parsePresentationData(answersStr, presentation_data) {
		answers = answersStr.split(',').map((a) => { return parseInt(a, 10); });
		var answer_val_map = presentation_data.answer_val_map;
		var interactive_frames = presentation_data.interactive_frames;
		var contentsA = interactive_frames[1].contents;
		var contentsB = interactive_frames[0].contents;
		var contentsOpts = interactive_frames[2].contents;
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
				if (!contentsOpts[contentsOptsNdx]) {
					contentsOpts[contentsOptsNdx] = {
						id: contentsOptsNdx,
						line: 'dotted',
						shape: 'rect'
					};
				}
				else if (contentsOpts[contentsOptsNdx].shape === 'circ') {
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
			if (order !== -1) { 
				var coNdx = order - aItems;
				isOp = (contentsOpts[coNdx].shape === 'circ'); 
			}
			listB.push([answer_val_map[ndx], order !== -1 ? order - aItems + 1 : null, isOp]);
		});

		var out = {
			checked: checked,
			partA: listA,
			partB: listB
		};

		return out;
	}

	//=======================================================
	//=======================================================
	function valueToEndOfCourse(value, end_of_course) {
		var end_of_course = end_of_course[0];
		var presentation_data = JSON.parse(end_of_course.presentation_data);
		var a = [];
		var order = [];
		var partA = [];
		var partB = presentation_data.interactive_frames[2].contents;
		var options = [];
		var answer_val_map = [];

		$.each(value, function(idx, val) {
			answer_val_map.push(val[0]);
			if (val[1] === null) {
				partA.push(idx);
			}
			else {
				options.push(idx);
			}
			if (val[1]) { // indicates order for items in frame B.
				var bNdx = val[1] - 1;
				if (!partB[bNdx]) partB[bNdx] = {};
				partB[bNdx].shape = val[2] ? 'circ' : 'rect';
			}
			if (val[1] === null && val[2] || val[1]) {
				a.push(idx);
			}
		});

		presentation_data.answer_val_map = answer_val_map;
		presentation_data.interactive_frames[0].contents = options;
		presentation_data.interactive_frames[1].contents = partA;
		presentation_data.interactive_frames[2].contents = partB;

		return [end_of_course];
	}
*/
})();
