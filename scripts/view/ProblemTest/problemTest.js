//=======================================================
// Problem Review
//
// This view allows a user to work through a problem,
// including steps.
//=======================================================
;(function() {
	app.ProblemTestView = app.PEView.extend({
		field: 'problemReview',

		idCtr: 0,		// Slightly ugly way to ensure unique IDs

		answerTypes: {
			input:		 {input: 'renderEq', 	 showAnswer: 'renderEqAnswer', check: 'checkEquiv'},
			essay:		 {input: 'renderEssay',  showAnswer: 'renderEqAnswer', check: 'checkEssay'},
			MultKinetic: {input: 'renderMulti',  showAnswer: 'renderMultiAnswer', check: 'checkFree'},
			radio:		 {input: 'renderRadio',  showAnswer: 'renderRadioAnswer', check: 'checkRadio'},
			check:		 {input: 'renderCheck',  showAnswer: 'renderCheckAnswer', check: 'checkCheck'},
			dragDrop:        {input: 'renderDragDrop', showAnswer: 'renderDragDropAnswer', check: 'checkDragDrop'},
			VTPGraph:	 {input: 'renderGraph',  showAnswer: 'renderEqAnswer', check: 'checkEquiv'},
			graphConst:	 {input: 'renderGraphConst',  showAnswer: 'renderEqAnswer', check: 'checkConst'},
			multiPart:   {input: 'renderMultiPart', showAnswer: 'renderNoAnswer', check: 'checkEquiv'},
			"no input":	 {input: 'renderPencil', showAnswer: 'renderEqAnswer', check: 'checkEquiv'}
		},

		//---------------------------------------
		//---------------------------------------
		events: {
//			'click .enableEq': 'eqEnable',
			'click #reset': 'triggerReset',
			'click #steps': 'enterStepMode',
			'click #next': 'nextStep',
			'click #check': 'checkAnswer',
			'click #hint': 'hint'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {

			// Keep track of any extra views we create
			this.extraViews = [];

			_.bindAll(this, 'redraw', 'addOverlays', 'reset');

			// These need to be unbound manually if the view is ever destroyed!
			this.model.on('change', this.redraw);
			this.model.on('stepChange', this.redraw);
			this.model.on('resetVars', this.reset, this);

			this.curStep = -1;

			this.stepReviewView = [];
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			this.$el.empty();

			$.each(this.stepReviewView, function(idx, view) {
				view.$el.css({display:'none'});
			});

			// Show the original question
			this.drawPrimary();

			// Draw all of the steps
			this.yPos = [];
			this.reviewYPos = [];
			this.drawSteps();
//			this.drawStepReviewPanes();

			// Results text
			this.$el.append(app.templates.styledText({id: 'reviewResult', text:''}));

			// Draw the appropriate set of buttons
			this.drawButtons();

			//----------------------
			app.jaxify(this.$el, "addOverlays", this);
//			MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.el]);
//			MathJax.Hub.Queue(["addOverlays", this, $(el)]);
			//----------------------

			return this.el;
		},

		//=======================================================
		// Render input boxes
		//=======================================================

		//---------------------------------------
		//---------------------------------------
		renderAnswerBox: function(model) {
			var type = model.get('ansType');
			if (type && this.answerTypes[type]) {
				var answerView = this[this.answerTypes[type].input](model);
				if (!this.answerReviewView) {
					var stepBlock = this.$el.parent();
//					var review = new app.ReviewView({field: 'answerReview', problemId: this.model.get('id')});
//					this.answerReviewView = review;
				}
				else {
//					this.answerReviewView.$el.css({display:'block'});
				}

				return answerView;
			}
			return '';
		},

		//---------------------------------------
		//---------------------------------------
		renderEq: function(model) {
			var split = app.splitEqAnswer(model.get('a'));

			this.$el.append(app.templates.reviewAnsEq({prefix: split.pre, suffix: split.post}));
			$('#reviewAnsEq').removeClass('enableEq').mathquill('editable').focus();

			var a = app.replaceVars(split.a);
//			a = a.replace(/<span\/>/g, '');

			// display answers for the benefit of the one who's checking the problem.
			this.$el.append(app.templates.teacherEditionEq({el: a}));
		},

		//---------------------------------------
		//---------------------------------------
		renderMulti: function(model) {
			var a = app.replaceVars(model.get('a'));
			a = app.scaleFractions(a);

			var el = $(app.templates.reviewAnsMulti()).mmlAnswer(a, { digitWidth: 8 });	// Convert the html to an element before using mmlAnswer()
			this.$el.append(el);

			// HTML field overlay for MathML.  To be placed outside MathML block, so as not to
			// interfere with MathJax.

			// display answers for the benefit of the one who's checking the problem.
			// @FIXME/dg: ILLEGAL! ASK THE PLUGIN FOR THE ANSWERS!
			var answers = $(el).data("mmlAnswer").settings && $(el).data("mmlAnswer").settings.answer;
			el.append(app.templates.teacherEditionMulti({answers: answers}));
		},

		//---------------------------------------
		//---------------------------------------
		renderMultChoice: function(model, type, isDull) {
			var choices = model.get('choices');

			if (choices)
			{
				var ctr = this.idCtr++;
				var contID = isDull ? 'mcAnswer' + ctr : 'reviewAnsRadio';

				var replaced = [];	// Clone the choices array so the model isn't corrupted
				for (var i=0; i < choices.length; i++)
					replaced[i] = app.replaceVars(choices[i]);

				var el = $(app.templates.reviewAnsRadio({id: ctr, contID: contID, type: type, options:replaced || []}));
				this.$el.append(el);
				return el;
			}
		},

		//---------------------------------------
		//---------------------------------------
		renderRadio: function(model, isDull) {
			var el = this.renderMultChoice(model, 'radio', isDull);

			// show "teacher edition" answer for reviewer
			if (el)
			{
				var ans = parseInt(model.get('a'), 10) + 1;
				el.append(app.templates.teacherEditionRadio({nth: ans}));
			}

			return el;
		},

		//---------------------------------------
		// Combine with renderRadio!
		//---------------------------------------
		renderCheck: function(model, isDull) {
			var el = this.renderMultChoice(model, 'check', isDull);

			// show "teacher edition" answer for reviewer
			// This doesn't work.  There can be 0 or more than one answer!
/*
			if (el)
			{
				var ans = parseInt(model.get('a')) + 1;
				el.append(app.templates.teacherEditionRadio({nth: ans}));
			}
*/
			return el;
		},

		//---------------------------------------
		//---------------------------------------
		renderGraph: function() {
			var view = new app.GraphView({model: this.model});
			this.extraViews.push(view);		// We have to save all views we create, to ensure they are properly destroyed

			var html = view.render();
			this.$el.append(html);

			return html;
		},

		//---------------------------------------
		//---------------------------------------
		renderGraphConst: function() {
			this.renderGraph();
			this.$el.append('<br/>');

			var eqs = this.model.get('graphequations');
			var data = app.graphEqObject(eqs);

			var typeData = app.graphTypeMap[app.getGraphType(data[0].name)];
            var params = typeData.params;	// Fetch the params array from the typeMap entry appropriate for the current graph type

			var ans = [];
			for (var i = 0; i < params.length; i++)
			{
				this.$el.append(app.templates.simpleInput({header: params[i], value: ''}));
				ans.push(app.replaceVars(data[0].params[i]));
			}

			this.$el.append(app.templates.teacherEditionGraph({answer: ans.join(', ')}));
		},

		//---------------------------------------
		//---------------------------------------
		renderPencil: function() {
		},

		//---------------------------------------
		//---------------------------------------
		renderMultiPart: function(model) {
			// display answers for the benefit of the one who's checking the problem.
			this.$el.append('Open the steps');
		},

		//---------------------------------------
		//---------------------------------------
		renderDragDrop: function() {
			var ans = this.model.get('a');
			var end_of_course = this.model.get('end_of_course');
			var parsed = app.EOC.parsePresentationData('dragDrop', this.model);
			var blanks = parsed.bottomFrameBlanks;
			var variable = parsed.variable;

			var fmtBlanks = blanks.map((blank) => {
				return '<div class="eoc-' + blank.shape + '">' + blank.answer + '</div>';
			}).join(' ');

			this.$el.append('<div>Top frame options: ' + parsed.topFrameOpts.join(', ') + '</div>');
			this.$el.append('<div>Bottom frame options: ' + parsed.bottomFrameOpts.join(', ') + '</div>');
			this.$el.append('<div>' + fmtBlanks + '</div><br clear="all">');
			this.$el.append('<div>Where: ' + variable + '</div>');

		},


		//=======================================================
		// Render answers
		//=======================================================

		//---------------------------------------
		//---------------------------------------
		stepAnswerBox: function(model) {
			var type = model.get('ansType');
			if (type && this.answerTypes[type])
				return this[this.answerTypes[type].showAnswer](model);

			return '';
		},

		//---------------------------------------
		//---------------------------------------
		renderEqAnswer: function(model) {
			var a = app.replaceVars(model.get('a'));
			this.$el.append(app.templates.reviewStepAnswer({answer: a}));
		},

		//---------------------------------------
		//---------------------------------------
		renderMultiAnswer: function(model) {
			var a = app.replaceVars(model.get('a'));
			a = app.scaleFractions(a);

			var id = 'free' + Math.floor(Math.random()*10000);
			this.$el.append(app.templates.reviewStepAnsMulti({id:id}));

			var fiEl = $('#' + id);
			if (fiEl && fiEl.length)
			{
				fiEl.mmlAnswer(a, { digitWidth: 8 });

				var instance = fiEl.data('mmlAnswer');
				instance && instance.showAnswer();		// This line failed once. It's not clear how, so it's been surrounded by lots of verification code
			}
		},

		//---------------------------------------
		//---------------------------------------
		renderRadioAnswer: function(model) {
			var a = model.get('a');
			var el = this.renderRadio(model, true);
			var all = el.children('input');
			$(all[a]).prop('checked', true);

			all.prop('disabled', true);
		},

		//---------------------------------------
		// Combine with renderRadioAnswer!
		//---------------------------------------
		renderCheckAnswer: function(model) {
			var a = model.get('a');
			var el = this.renderCheck(model, true);
			var all = el.children('input');

			// Mark everything in a as checked
			$.each(a, function(idx, val) {
				$(all[val]).prop('checked', true);
			});

			all.prop('disabled', true);
		},

		//---------------------------------------
		//---------------------------------------
		renderEssay: function(model) {
			var a = model.get('a'); // render the answer
			this.$el.append(app.templates.teacherEditionEssay({value: '', answer: a}));

		},

		//---------------------------------------
		//---------------------------------------
		renderNoAnswer: function(model) {
		},

		//---------------------------------------
		//---------------------------------------
		renderDragDropAnswer: function(model) {
			console.log('renderDragDropAnswer');
		},

		//=======================================================
		// Check answers
		//=======================================================
		checkEssay: function() {
			this.showResult(true);
		},

		//---------------------------------------
		//---------------------------------------
		checkAnswer: function() {
			if (this.curStep === -1)
				var model = this.model;
			else
				var model = this.model.get('solve').at(this.curStep);

			var type = model.get('ansType');
			if (type && this.answerTypes[type]) {
				var result = this[this.answerTypes[type].check](model);
			} else {
				this.showResult(false);
            }
		},

		//---------------------------------------
		// Display the result of a Check operation
		//---------------------------------------
		showResult: function(result, doLink) {
			if (result)
				var text = app.templates.reviewCorrect();
			else
				var text = app.templates.reviewWrong();

			$('#reviewResult').html(text);

			if (result && this.curStep !== -1)
			{
				// Disable the action buttons while waiting
				$('#reset').prop('disabled', true);
				$('#check').prop('disabled', true);
				$('#next').prop('disabled', true);
				$('#hint').prop('disabled', true);

				var that = this;
				setTimeout(function() {
					that.nextStep.call(that);
				}, 1500);
			}
		},

		//---------------------------------------
		//---------------------------------------
		checkEquiv: function(model) {
			var a = app.replaceVars(model.get('a'));
			var split = app.splitEqAnswer(a);

			var entered = $('#reviewAnsEq').mathquill('latex');
			var rules = this.model.get('equiv') || '';

			var result = app.Equiv.compare('equation', split.a, entered, rules);
			this.showResult(result.iscorrect);
		},

		//---------------------------------------
		// Add simple numerical equivalence to the array compare
		//---------------------------------------
		checkFree: function(model) {
/*
            var mml = model.get('a');
            var data = app.mathML.getActionTags(mml); // array of bracketed blocks
            var sigFigs = [];
            $.each(data, function(ndx, block) {
                var sf = app.getSFCount(block);
                sigFigs.push(sf);
            });
*/
			var ans = app.replaceVars(model.get('a'));

			// Get answers entered in input fields.
			var entered = [];
			$('#reviewAnsMulti').find('input').each(function(){
				entered.push($(this).val());
			});

			var bookData = app.getBookAndChapter(this.model.get('chID'));
			var book = (bookData && bookData.book) || '';
			if (book.toLowerCase().indexOf('physics') !== -1)
				var freeType = 'physics';
			else
				freeType = 'math';

			// Compare answers using the equivalence library
			var result = app.Equiv.compare('free', [ans], entered, null, freeType);
			this.showResult(result.iscorrect);
		},

		//---------------------------------------
		//---------------------------------------
		checkRadio: function(model) {
			var a = model.get('a');		// No variable replacement is desired here

			// This feels incredibly inefficient.
			var set = $('#reviewAnsRadio').children('input');
			var item = $('#reviewAnsRadio input[name=reviewAnsRadio]:checked');
			var idx = set.index(item);

			this.showResult(idx == a);	// Use == instead of ===.  idx is an integer, a is a string
		},

		//---------------------------------------
		//---------------------------------------
		checkCheck: function(model) {
			var a = model.get('a');		// No variable replacement is desired here
			var set = $('#reviewAnsRadio').children('input');

			// Create a list of checked items
			var checked = [];
			set.each(function(i) {
				if ($(this).prop('checked'))
					checked.push(i);		// Convert to string
			});

			this.showResult(a === checked.join());
		},

		//---------------------------------------
		//---------------------------------------
		checkConst: function(model) {
			var eqs = this.model.get('graphequations');
			var data = app.graphEqObject(eqs);
			var typeData = app.graphTypeMap[app.getGraphType(data[0].name)];
            var params = typeData.params;	// Fetch the params array from the typeMap entry appropriate for the current graph type

			var submitted = this.$('input.simpleInput');

			var allCorrect = true;
			for (var i = 0; i < params.length; i++)
			{
				// These should probably be rounded to a reasonable precision since we're not using equivalence
				var correct = parseFloat(app.replaceVars(data[0].params[i]));
				var submission = parseFloat(submitted[i].value);

				if (submission === correct)
					continue;

				allCorrect = false;
				break;
			}

			this.showResult(allCorrect);
		},

		//---------------------------------------
		//---------------------------------------
		checkDragDrop: function(model) {
			console.log('checkDragDrop');
		},

		//=======================================================
		// Click handlers
		//=======================================================

		//---------------------------------------
		// This is a hack. MathQuill can't operate on an element that hasn't been
		// inserted into the DOM. On initial render, no elements are in the DOM.
		// DG: No longer needed
		//---------------------------------------
//		eqEnable: function() {
//			$('#reviewAnsEq').removeClass('enableEq').mathquill('editable').focus();
//		},


		//---------------------------------------
		// Get new variables, trigger Reset event
		//---------------------------------------
		triggerReset: function() {
			app.chooseVars();
			this.model.trigger('resetVars');	// External notification
		},

		//---------------------------------------
		// Reset the variables and question
		//---------------------------------------
		reset: function() {
			this.curStep = -1;
			this.render();
		},

		//---------------------------------------
		// Enter step mode.
		//---------------------------------------
		enterStepMode: function() {
			var solve = this.model.get('solve') || [];
			if (solve.length > 0)
			{
				this.curStep = 0;
				this.render();
			}
		},

		//---------------------------------------
		// Move on to the next step without answering
		// the current step.
		//---------------------------------------
		nextStep: function() {
			var solve = this.model.get('solve') || [];
			if (this.curStep <= (solve.length - 1))
				this.curStep++;

			this.render();
		},

		//---------------------------------------
		// Display a hint
		//---------------------------------------
		hint: function() {
			var hint = this.model.get('solve').at(this.curStep).get('hint');
			var text = app.replaceVars(hint);
			$('#reviewResult').html(text);

			// Support MathML in hints (note that no processing occurs, particularly fraction sizing);
			app.jaxify(this.$el);
		},

		//=======================================================
		// Render helpers
		//=======================================================

		//---------------------------------------
		//---------------------------------------
		drawPrimary: function() {
			// Display the question prefix and question
			var pre = app.replaceVars(this.model.get('q_prefix'));
			var q = app.replaceVars(this.model.get('q'));
			this.$el.append(app.templates.reviewQuestion({prefix: pre, question: q}));

			// Create the proper answer input
			if (this.curStep === -1) {
				this.renderAnswerBox(this.model);
//				this.answerReviewView.$el.css('display','block');
			}
			else {
//				this.answerReviewView.$el.css('display','none');
			}
		},

		//---------------------------------------
		// Steps button -- (If there are steps)
		//---------------------------------------
		stepsButton: function() {
			var solve = this.model.get('solve') || [];

			if (solve.length > 0)
				this.$el.append(app.templates.button({id: 'steps', text:'Steps'}));
		},

		//---------------------------------------
		// Next step button (if there are more steps)
		//---------------------------------------
		nextStepButton: function() {
			var solve = this.model.get('solve') || [];

			if (this.curStep <= (solve.length - 1))
				this.$el.append(app.templates.button({id: 'next', text:'Skip Step'}));
		},

		//---------------------------------------
		//---------------------------------------
		drawButtons: function() {
			var solve = this.model.get('solve') || [];

			// Draw different buttons depending on whether this is the primary question or a step
			if (this.curStep === -1)
			{
				// Check button
				this.$el.append(app.templates.button({id: 'check', text:'Check'}));

				// Steps button -- IF there are steps, and if we're not on the last step
				this.stepsButton();

				// Show solution button -- This is a lot of work for little value
	//			this.$el.append(app.templates.button({id: 'solve', text:'Solution'}));

				// Reset button
				this.$el.append(app.templates.button({id: 'reset', text:'Reset'}));
			}
			else
			{
				// Check button: Only if there are steps to answer
				if (this.curStep < solve.length)
				{
					this.$el.append(app.templates.button({id: 'check', text:'Check'}));
					this.$el.append(app.templates.button({id: 'hint', text:'Hint'}));
				}

				// Next step button (if there are more steps)
				this.nextStepButton();

				// Reset button
				this.$el.append(app.templates.button({id: 'reset', text:'Reset'}));
			}

		},

		//---------------------------------------
		//---------------------------------------
		drawSteps: function() {
			var solve = this.model.get('solve') || [];
			// Ensure that curStep isn't out of range (this would happen if steps are deleted)
			if (this.curStep > solve.length)
				this.curStep = solve.length;

			for (var i = 0; i <= this.curStep; i++)
			{

				// Sort of a silly way to handle this.  We allow curStep to go one step past the end
				// so that we can see the answer to the last step.
				if (i == solve.length)
					continue;

				// Draw the question
				var pre_q = app.replaceVars(solve.at(i).get('q_prefix'));
				var q = app.replaceVars(solve.at(i).get('q'));
				var code = $(app.templates.reviewStepQuestion({index: i+1, prefix: pre_q, question: q}));
				this.$el.append(code);
				this.yPos.push(code.position().top);

				// Not the last step: Draw the answer
				// Last step: Draw the answer input

				if (i !== this.curStep)
					this.stepAnswerBox(solve.at(i));
				else
					this.renderAnswerBox(solve.at(i));
			}
		},

		//---------------------------------------
		//
		//---------------------------------------
		drawStepReviewPanes: function() {
			// Provide an object to directly reference the "steps" block
			var stepBlock = this.$el.parent();
			// Display review panel unless counter goes beyond last step.
			for (var i = 0; i < this.yPos.length; i++) {
				if (!this.stepReviewView[i]) {
					var review = app.ReviewTool && new app.ReviewView({field: 'solve', problemId: this.model.get('id'), stepnum: i });
					if (i > 0) {
						review.yPos = this.yPos[i];
						review.cssPosition = 'absolute';
					}
					this.stepReviewView.push(review);
					var code = $(review.render());
					stepBlock.append(code);
					this.reviewYPos.push(code.position().top);
					console.log('drawStepReviewPanes ' + code.position().top);
				}
				else {
					this.stepReviewView[i].$el.css({display:'block'});
				}
			}
		},

		//---------------------------------------
		//---------------------------------------
		addOverlays: function() {
			var el = this.$('#reviewAnsMulti');

			// Make sure there are overlays
			if (el.length === 0)
				return;

			// Check to see if they've already been drawn. This routine can be reached multiple times.
			if ($('.ansInput').length !== 0)
				return;

			// Go ahead and draw the overlays
			var positions = el.data("mmlAnswer").boxes();
			$.each(positions, function(idx, position) {

				// These adjustments feel uncomfortably arbitrary.
				var style = {
					position: "absolute",
					top: (position.y-6) + "px",
					left: (position.x-1) + "px",
					width: (position.w-2) + "px",
					height: (position.h+5) + "px",
					padding: 0,
					border: "1px solid black"
				};

				var input = $('<input>').css(style).attr({
					type: "text",
					"class": "ansInput"})

				$(el).append(input);

				// Focus the first input box
				if (!idx)
					input.focus();
			});
		},

		//---------------------------------------
		//---------------------------------------
		redraw: function() {
			this.closeViews();
			this.render();
		},

		//---------------------------------------
		// Close (hard!) any extra views we've created
		//---------------------------------------
		closeViews: function() {
			$.each(this.extraViews, function(idx, view) {
				view.close();
				view.unbind();
				view.remove();
			});
		},

		//---------------------------------------
		// Close routine.  Unbind model events.
		//---------------------------------------
		close: function() {
			this.model.off(null, this.render);	// bulk wipe of binds that cause rendering
			this.model.off(null, this.reset);

			// Close (hard!) any extra views we've created
			this.closeViews();
		}

	});

})();
