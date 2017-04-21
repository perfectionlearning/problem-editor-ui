;(function() {

	var answers,
	    end_of_course,
		presentation_data,
	    answer_val_map,
	    interactive_frames
	;

	function sortByType(a, b) {
		if (a[2] === b[2]) return 0;
		else return a[2] < b[2] ? -1 : 1;
	}

	var operatorList = ['+', '-', '*', '/', '='];
	app.EOC = {};

	//---------------------------------------
	// Convert from internal format to model format
	//---------------------------------------
	app.EOC.adjustDragDropModel = function(dragDropRows, model, whichTable) {
		unpack_model(model);

		var answerRows = [];
		var equationRows = [];
		answers = [];
//		dragDropRows.sort(sortByType);
		dragDropRows.forEach((row, idx) => {
			if (row[1] > '') {
				var seq = parseInt(row[1], 10) - 1;
				answers[seq] = idx;
			}
			if (row[2] === '1') {
				answerRows.push(idx);
			}
			else if (row[2] === '2' || row[2] === '3') {
				equationRows.push(idx);
			}
		});
		presentation_data.answer_val_map = dragDropRows.map((row) => { return row[0]; });
		presentation_data.interactive_frames[1].contents = answerRows;
		presentation_data.interactive_frames[0].contents = equationRows;

		end_of_course.presentation_data = JSON.stringify(presentation_data);
		end_of_course.presentation_data_debug = presentation_data;
		
		return {
			a: answers.join(','),
			choices: presentation_data.answer_val_map,
			end_of_course: [end_of_course]
		};
		
	};

	app.EOC.parsePresentationData = function(type, model) {
		unpack_model(model);

		var parsed;
		if (type === 'dragDrop') {
			parsed = parseDragDrop();
		}

		return parsed;	
	};

	/*
		Set the global values:
			end_of_course
			presentation_data
			answer_val_map
			interactive_frames
			answers
	*/
	var end_of_course_template = {};
	end_of_course_template.presentation_data = JSON.stringify(
		{
			answer_val_map: [],
			interactive_frames: []
		}
	);

	var unpack_model = function(model) {
		var end_of_course_raw = model.get('end_of_course');
		var answers_raw = model.get('a');
		end_of_course = end_of_course_raw[0] || end_of_course_template;
		answers = answers_raw.split(',').map((item) => { return parseInt(item, 10); });
		presentation_data = JSON.parse(end_of_course.presentation_data);
		answer_val_map = presentation_data.answer_val_map;
		interactive_frames = presentation_data.interactive_frames;
		if (interactive_frames.length === 0) {
			interactive_frames[0] = {};
			interactive_frames[1] = {};
			interactive_frames[2] = {};
		}
	};


	var parseDragDrop = function() {
		var answerOptions = interactive_frames[1] && interactive_frames[1].contents ? interactive_frames[1].contents : [];
		var variable = getDragDropVariable(answerOptions);
		var blanks = formatEquation();
		var tableRows = getDragDropRows();

		return {
			variable: variable,
			equationBlanks: blanks,
			tableRows: tableRows
		};
	};

	var getDragDropVariable = function(topFrameOptions) {
		var selected = -1;
		answers.forEach((item) => {
			if (topFrameOptions.indexOf(item) !== -1) {
				selected = item;
			}
		});

		var variable = selected !== -1 ? answer_val_map[selected] : 'No variable chosen';

		return variable;
	};

	var formatEquation = function() {
		var equationOptions = interactive_frames[0] && interactive_frames[0].contents ? interactive_frames[0].contents : [];
		var equationBlanks = interactive_frames[2] && interactive_frames[2].contents ? interactive_frames[2].contents : [];
		var equation = [];
		answers.forEach((item) => {
			if (equationOptions.indexOf(item) !== -1) {
				equation.push(item);
			}	
		});

		var blanks = [];
		equationBlanks.forEach((blank, idx) => {
			var ansIdx = equation[idx];
			blanks.push({
				shape: blank.shape,
				answer: answer_val_map[ansIdx]
			});
		});

		return blanks;
	};


	var getDragDropRows = function() {
		var answerIdxs = interactive_frames[1] && interactive_frames[1].contents ? interactive_frames[1].contents : [];
		var equationIdxs = interactive_frames[0] && interactive_frames[0].contents ? interactive_frames[0].contents : [];
		var operatorIdxs = equationIdxs.filter((item) => { return operatorList.indexOf(answer_val_map[item]) !== -1; });
		equationIdxs = equationIdxs.filter((item) => { return operatorIdxs.indexOf(item) === -1; });
		var tableRows = [];
		answer_val_map.forEach((item, idx) => {
			var type = '--';
			if (answerIdxs.indexOf(idx) !== -1) type = 'Answer';
			else if (equationIdxs.indexOf(idx) !== -1) type = 'Equation item';
			else if (operatorIdxs.indexOf(idx) !== -1) type = 'Operator';
			tableRows.push([item, type, answers.indexOf(idx)+1]);
		});

		return tableRows;
	};
})();
