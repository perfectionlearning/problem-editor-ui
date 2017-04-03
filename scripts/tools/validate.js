//=======================================================
// Problem Validation
//
// Validation is performed before saving, and is used to
// display warnings for the user.  This is different from
// model validation.
//=======================================================
(function() {

	var results = [];

	//=======================================================
	/*
	 Validation Tests: Run before saving
		Question: Not empty, referenced vars are defined
		Radio Input: At least one choice.  Exactly one answer
		Check: At least one choice, at least one answer?
		Choices: Referenced vars are defined
		Equation: Answer isn't empty, referenced vars are defined
		Free input: At least one <maction>
		Graph: All graph and eq params are defined, referenced vars are defined
		Difficulty: Defined
		Whiteboard: Defined
		Vars: All necessary fields are defined, all can be resolved
		Constraints: Legal JS, no routines
		Steps: All fields defined.  Q, A, Hint, Choices: referenced vars are defined
		Image: If defined, image exists

		Points: Defined, > 0 -- Don't test yet
		Streak: If defined, > 0 -- Don't test yet
		Equivalency: Only known rules are referenced?  Only contains <rule> tags.
		chID: Defined, in the correct format (4 digits)
	*/
	//=======================================================
	app.validateProblem = function()
	{
		results = [];	// Clear result list

		test(chapterID);	// Do this first so it appears on top.  It's the only truly mandatory item.  It has no variables so it can go before test(vars).

		test(vars);	// Do this first because it resolves variables, which is required for many later tests
		test(prefix, app.curProblem);
		test(question, app.curProblem);
		test(answer, app.curProblem);
		test(difficulty);
//		test(whiteboard);
		test(steps);


//		test(image);
//		test(points);
//		test(streak);
//		test(equivalency);

		return results;
	}

	//=======================================================
	// General test function.  Wraps individual tests.
	//=======================================================
	function test(func, param)
	{
		var error = func(param);
		if (error)
		{
			if (typeof(error) === 'string')
				results.push(error);
			else if (isArray(error))
			{
				$.each(error, function(idx, val) {
					results.push(val);
				});
			}
		}
	}

	//=======================================================
	// Validate the question prefix
	//	Question: Referenced vars are defined
	//=======================================================
	function prefix(model)
	{
		var q = model.get('q_prefix');

		// Empty is okay.  Return without an error
		if (!defined(q) || q.length < 1)
			return;

		var verVars = app.verifyVars(q);
		if (verVars)
			return verVars + " in the question prefix.";
	}

	//=======================================================
	// Validate the question prefix
	//	Question: Referenced vars are defined
	//=======================================================
	function stepPrefix(model, isMultiPart)
	{
		var q = model.get('q_prefix');

		// In steps, prefixes are mandatory (unless this is a multi-part question)
		if (!isMultiPart && (!defined(q) || q.length < 1))
			return "There is no prompt.";

		var verVars = app.verifyVars(q);
		if (verVars)
			return verVars + " in the prompt.";
	}

	//=======================================================
	// Validate the question
	//	Question: Not empty, referenced vars are defined
	//=======================================================
	function question(model)
	{
		// "Graph Constant" questions don't require a 'q' field. They
		// use a constructed graph image. They can have a 'q' field for
		// additional information, but it's optional. Instructions should
		// be in q_prefix instead.
		var q = model.get('q');
		if ((!defined(q) || q.length < 1) && model.get('ansType') !== 'graphConst')
			return "There is no question.";

		var verVars = app.verifyVars(q);
		if (verVars)
			return verVars + " in the question.";
	}

	//=======================================================
	// Validate the question
	//	Question: Referenced vars are defined
	//=======================================================
	function stepQuestion(model)
	{
		var q = model.get('q');
		if (!defined(q) || q.length < 1)
			return;		// This is valid

		var verVars = app.verifyVars(q);
		if (verVars)
			return verVars + " in the step text.";
	}

	//=======================================================
	// Validate the question prefix
	//	Question: Referenced vars are defined
	//=======================================================
	function hint(model)
	{
		var h = model.get('hint');

		if (!defined(h) || h.length < 1)
			return "No hint is defined.";

		var verVars = app.verifyVars(h);
		if (verVars)
			return verVars + " in the hint.";
	}

	//=======================================================
	// Validate the answer
	//	Validation depends on the answer type
	//=======================================================
	function answer(model)
	{
		var ansType = model.get('ansType');

		var typeHandlers = {
			input: answerInput,
			essay: answerEssay,
			MultKinetic: answerMulti,
			radio: answerRadio,
			check: answerCheck,
			VTPGraph: answerGraph,
			graphConst: answerGraph,
			multiPart: answerMultiPart,
			dragDrop: answerDragDrop,
			"no input": answerPaper
		}

		if (!defined(typeHandlers[ansType]))
			return 'Unknown answer type: ' + ansType;

		return typeHandlers[ansType](model);
	}

	//=======================================================
	// Equation: Answer isn't empty, referenced vars are defined
	//=======================================================
	function answerInput(model)
	{
		var a = model.get('a');

		if (!defined(a) || a.length < 1)
			return 'There is no answer.';

		var verVars = app.verifyVars(a);
		if (verVars)
			return verVars + " in the answer.";

		// Validate <outside> tags
		var split = app.splitEqAnswer(a);
		if (split.a.toLowerCase().indexOf('error') !== -1)
			return 'The answer contains incorrectly formatted prefixes or suffixes.';
	}

	//=======================================================
	// Equation: Answer isn't empty, referenced vars are defined
	//=======================================================
	function answerEssay(model)
	{
		var err = null;
		var a = model.get('a');

		if (!defined(a) || a.length < 1)
			return 'There is no answer.';

		return err;
	}

	//=======================================================
	// Free input: At least one <maction>
	//=======================================================
	function answerMulti(model)
	{
		var a = model.get('a');

		if (!defined(a) || a.length < 1)
			return 'There is no answer.';

		if (a.indexOf('<maction') === -1)
			return 'Free input requires the actual answer(s) to be placed within boxes.';

		var verVars = app.verifyVars(a);
		if (verVars)
			return verVars + " in the answer.";

		if (a.indexOf('outside>') !== -1)
			return "Free inputs can't contain prefix or suffix markers.";

		// Ensure that there is exactly one <mtext> in each <maction>
		return (checkMultiMtext(a));
	}

	//=======================================================
	// Ensure that there is exactly one <mtext> in each <maction>
	//=======================================================
	function checkMultiMtext(a)
	{
		var err = null;

		// @FIXME/dg: It feels like this could be done more efficiently with regular expressions.
		// If we need advanced analysis, we have a powerful MathML processing system in place.
		// This is a weird half measure.
		var test = $('<wrapper>' + a + '</wrapper>');
		test.find('maction').each(function(i) {

			if ($(this).children('mtext').length !== 1)
			{
				err = "Illegal answer in a free input box.  If there's a variable block it must take up the entire box.";
				return false;	// Break
			}
		});

		return err;
	}

	//=======================================================
	// Validate multiple choice options
	//=======================================================
	function choicesCommon(choices)
	{
		if (!choices || (choices.length < 1))
			return 'Multiple choice inputs require at least one choice.';

		for (var i = 0; i < choices.length; i++)
		{
			if (!$.trim(choices[i]))		// The trim doesn't work.  The editor using &nbsp; and also has some extra <span>s and such
				return 'Multiple choice answer #' + (i+1) + ' is blank.';

			var verVars = app.verifyVars(choices[i]);
			if (verVars)
				return verVars + " in multiple choice answer " + (i+1) + ".";

			if (choices[i].indexOf('outside>') !== -1)
				return "Multiple choice options can't contain prefix or suffix markers.";
		}
	}

	//=======================================================
	// Radio Input: At least one choice.  Exactly one answer
	// Choices: Referenced vars are defined
	//=======================================================
	function answerRadio(model)
	{
		var choices = model.get('choices');
		var res = choicesCommon(choices);
		if (res) return res;

		var a = model.get('a');
		if (!defined(a) || a.length < 1)
			return 'There is no answer.';

		var all = a.split(',');
		if (all.length !== 1)
			return 'Multiple choice radio inputs require exactly one solution.';

		var sel = parseInt(all[0]);
		if (isNaN(sel) || sel < 0 || sel >= choices.length)
			return "The answer is invalid.  It doesn't match any of the choices.";
	}

	//=======================================================
	// Check: At least one choice
	// Choices: Referenced vars are defined
	//=======================================================
	function answerCheck(model)
	{
		var choices = model.get('choices');
		var res = choicesCommon(choices);
		if (res) return res;

		var a = model.get('a');
		var all = a.split(',');

		// Specifically allow no answer (none of the above)
		if ((all.length === 1) && all[0] === '')
			return;

		for (var i = 0; i < all.length; i++)
		{
			var sel = parseInt(all[i]);
			if (isNaN(sel) || sel < 0 || sel >= choices.length)
				return "One of the answers is invalid.  It doesn't match any of the choices.";
		}
	}

	//=======================================================
	// Drag and Drop
	// Choices: 
	//=======================================================
	function answerDragDrop(model)
	{
		var choices = model.get('choices');
		var res = choicesCommon(choices);
		if (res) return res;

		var a = model.get('a');
		var all = a.split(',');

		// Specifically allow no answer (none of the above)
		if ((all.length === 1) && all[0] === '')
			return;
console.log('validate answerDragDrop choices, all', choices, all);
		for (var i = 0; i < all.length; i++)
		{
			var sel = parseInt(all[i]);
			if (isNaN(sel) || sel < 0 || sel >= choices.length*2)
				return "One of the answers is invalid.  It doesn't match any of the choices.";
		}
	}

	//=======================================================
	// Graph: All graph and eq params are defined, referenced vars are defined
	//=======================================================
	function answerGraph(model)
	{
		var eqs = model.get('graphequations');

		// Verify that exactly one graph entry exists
		if (eqs.length !== 1 || eqs[0].length < 1)
			return "This graphing problem has no graph definition.";

		// Verify that the correct number of parameters exist, and none are empty
		var obj = app.graphEqObject(eqs)[0];
		if (!app.graphTypeMap[obj.type])
			return "Unknown graph type";

		if (app.graphTypeMap[obj.type].params.length !== obj.params.length)
			return "A graph parameter appears to be empty.";	// This is accurate internally, but the cause is what we really want to show: "The graph definition doesn't have the correct number of parameters.";

		for (var i = 0, len = app.graphTypeMap[obj.type].params.length; i < len; i++)
		{
			if (obj.params[i].length < 1)
				return "A graph parameter appears to be empty.";
		}

		// Verify that referenced variables exist
		var verVars = app.verifyVars(eqs[0]);
		if (verVars)
			return verVars + " in the graph parameters.";

		// @TODO/dg: Verify the axis parameters
	}

	//=======================================================
	// No checking. This type should be discouraged, but it's legal.
	//=======================================================
	function answerPaper()
	{
	}

	//=======================================================
	// No checking. It would be good to wipe out the 'a' field.
	//=======================================================
	function answerMultiPart()
	{
	}

	//=======================================================
	// Validate the difficulty
	//	Difficulty: Defined
	//=======================================================
	function difficulty()
	{
		var d = app.curProblem.get('diff');
		if (!defined(d) || !(d === 'Basic' || d === 'Medium' || d === 'Hard'))
			return "The difficulty setting for this problem is missing or is invalid.";
	}

	//=======================================================
	// Validate the difficulty
	//	Whiteboard: Defined
	//=======================================================
	function whiteboard()
	{
		var w = app.curProblem.get('wb');
		if (!w)
			return "No whiteboard is defined";
	}

	//=======================================================
	// Validate variable definitions
	//	Vars: All necessary fields are defined, all can be resolved
	//=======================================================
	function vars()
	{
		var v = app.curProblem.get('vars');
		v = _.reject(v, function(val){return !val.label});	// Ignore entries without a label

		// Make sure variable names are valid.  Allow only letters, numbers, and underscore.  Numbers can't be the first character.
		var validName = /([^\w])|(^\d)/;

		// Verify that all of the important fields are filled in (several fields are optional)
		// Make sure there aren't duplicate variable names
		var out = '';
		var test = {};
		$.each(v, function(idx, val) {
			if (!val.label)		// With the _.reject above, this is impossible
				out = "One of the variables doesn't have a name.";
			else if (val.label.search(validName) !== -1)
				out = "Variable name '" + val.label + "' is invalid.  Only letters, numbers, and _ are allowed.  Names can't start with a number.";
			else if (!defined(val.min) || isNaN(val.min))
				out = "Variable '" + val.label + "' is missing its minimum value.";
			else if (!defined(val.max) || isNaN(val.max))
				out = "Variable '" + val.label + "' is missing its maximum value.";
			else if (!defined(val.step) || isNaN(val.step))
				out = "Variable '" + val.label + "' is missing its step value.";
			else if (test[val.label] === true)
				out = "Variable '" + val.label + "' is defined more than once.";

			if (out) return false;	// break

			test[val.label] = true;
		});
		if (out) return out;

		var resolved = app.chooseVars();
		if (resolved.failed)
			return 'Unable to resolve variables.  There is probably an impossible constraint.';
	}

	//=======================================================
	// Steps: All fields defined.  Q, A, Hint, Choices: referenced vars are defined
	//=======================================================
	function steps()
	{
		var steps = app.curProblem.get('solve');
		var isMultiPart = app.curProblem.get('ansType') === 'multiPart';

		var errs = [];
		var out = '';
		for (var i = 0; i < steps.length; i++)
		{
			var val = steps.at(i);

			out = stepPrefix(val, isMultiPart);		// Question Prefix
			if (out) errs.push([i,out]);

			out = stepQuestion(val);		// Question
			if (out) errs.push([i,out]);

			out = answer(val);			// Answer
			if (out) errs.push([i,out]);

			out = hint(val);			// Hint
			if (out) errs.push([i,out]);
		}

		var errOut = [];
		for (var i = 0; i < errs.length; i++)
			errOut[i] = 'Step entry #' + (errs[i][0]+1) + ': ' + errs[i][1];

		if (errOut.length > 0)
			return errOut;
	}

	//=======================================================
	// Validate the chapter ID
	//  chID: Defined, in the correct format (4 digits)
	//=======================================================
	function chapterID()
	{
		var chID = app.curProblem.get('chID');

		var valid = /\d{4}/.test(chID);

		if (!defined(chID) || (chID.length < 4 || chID.length > 5) || !valid)
			return "Illegal chapter ID.  A problem can't be saved without a valid chapter ID.";
	}

})();
