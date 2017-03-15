//===========================================================================================
// HTML templates used to render views
//===========================================================================================
(function() {
	app.templates || (app.templates = {});

	//=======================================================
	// Question
	// Params: prefix, question
	//=======================================================
	app.templates.reviewQuestion = _.template(
		'<div id="reviewPrefix"><% print(app.scaleFractions(prefix)) %></div>' +
		'<div class="reviewQ"><% print(app.scaleFractions(question)) %></div>'
	);

	//=======================================================
	// Step Question
	// Params: index, prefix, question
	//=======================================================
	app.templates.reviewStepQuestion = _.template(
		'<div id="reviewStep<%= index %>" class="reviewQ">' +
			'<span class="stepIndex">Step <%= index %>: </span>' +
			'<% print(app.scaleFractions(prefix)) %>' +
			'<div class="stepQ">' +
				'<% print(app.scaleFractions(question)) %>' +
			'</div>' +
		'</div>'
	);

	//=======================================================
	// Answer: Equation
	//=======================================================
	app.templates.reviewAnsEq = _.template(
		'<span><%= prefix %></span>' +
		'<div id="reviewAnsEq" class="enableEq"></div>' +
		'<span><%= suffix %></span>'
	);

	//=======================================================
	// Answer: Free input (multiple input boxes)
	//=======================================================
	app.templates.reviewAnsMulti = _.template(
		'<div id="reviewAnsMulti"></div>'
	);

	//=======================================================
	// Answer: Radio
	// Params: options, id, contID, type
	//=======================================================
	app.templates.reviewAnsRadio = _.template(
		'<div class="mcAnswer" id="<%= contID %>">' +
			'<% if (type === "check") type = "checkbox"; %>' +
			'<% $.each(options, function(idx, entry) {' +
				'print("<input type=\'" + type + "\' name=\'" + contID + "\' id=\'" + type + id + "-" +  idx + "\' />' +
				'<label for=\'" + type + id + "-" +  idx + "\'>" + app.prettyDisplay(entry) + "</label><br />");' +
			'}); %>' +
		'</div>'
	);

	//=======================================================
	// Answer: Graph
	//=======================================================
	app.templates.reviewAnsGraph = _.template(
		'<div id="reviewAnsGeneric"><%= prefix %></div>'
	);

	//=======================================================
	// Answer: Paper and pencil
	//=======================================================
	app.templates.reviewAnsPencil = _.template(
		'<div id="reviewAnsGeneric"><%= prefix %></div>'
	);

	//=======================================================
	// Display the answer for a step
	// Params: answer
	//=======================================================
	app.templates.reviewStepAnswer = _.template(
		'<div class="reviewStepAnsOuter">' +
			'<span class="reviewStepAnswer"><% print(app.scaleFractions(answer)) %></span>' +
		'</div>'
	);

	//=======================================================
	// Display the answer for a step
	// Params: id
	//=======================================================
	app.templates.reviewStepAnsMulti = _.template(
		'<div class="reviewStepAnsOuter">' +
			'<div id="<%= id %>" class="reviewStepAnswer"></div>' +	// Was a span to properly size the background, but the heights were messed up
		'</div>'
	);

	//=======================================================
	// Correct answer
	//=======================================================
	app.templates.reviewCorrect = _.template(
		'<div id="reviewCorrect">That is correct!</div>'
	);

	//=======================================================
	// Incorrect answer
	//=======================================================
	app.templates.reviewWrong = _.template(
		"<div id='reviewWrong'>That is incorrect.</div>"
	);

	//=======================================================
	// "Teacher Edition" - for those not smarter than a fifth-grader
	//=======================================================
	app.templates.teacherEditionMulti = _.template(
		'<div class="teacherEdition">Answers: <% _.map(answers, function(a) { %><span><%=a%></span><% }) %></div>'
	);

	//=======================================================
	// teacherEditionEq
	//=======================================================
	app.templates.teacherEditionEq = _.template(
		'<div class="teacherEditionEq"><%= el %></div>'
	);

	//=======================================================
	// teacherEditionRadio
	//=======================================================
	app.templates.teacherEditionRadio = _.template(
		'<div class="teacherEdition">Correct answer: item <%= nth %></div>'
	);

	//=======================================================
	// teacherEditionGraph
	//=======================================================
	app.templates.teacherEditionGraph = _.template(
		'<div class="teacherEdition">Answers: <%= answer %></div>'
	);

	//=======================================================
	// teacherEditionEssay
	//=======================================================
	app.templates.teacherEditionEssay = _.template(
		'<textarea><%= value %></textarea><br><%= answer %>'
	);
})();
