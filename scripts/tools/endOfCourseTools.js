;(function() {

	var answers,
	    end_of_course,
		presentation_data,
	    answer_val_map,
	    interactive_frames
	;
	app.EOC = {};
	app.EOC.adjustDragDropModel = function(data, model) {
		unpack_model(model); // Updates global variables with current model.

		var labels = data.map((item) => { return item[0]; });;

		var bottomFrameOrder = [];
		var topFrameKeys = []; // interactive_frame[1].contents
		var bottomFrameKeys = []; // interactive_frame[0].contents
		var bottomFrameBlanks = []; // interactive_frame[2].contents
		var topFrameChecked = []; // top frame answers
		var id = 0;
		data.forEach((item, rowIdx) => {
			if (item[1] === null) {
				// Process row as belonging to top frame.
				topFrameKeys.push(rowIdx);
				if (item[2]) topFrameChecked.push(rowIdx); // Checked in top frame; add to list of answers.
			}
			else {
				// Process row as belonging to bottom frame.
				var isOperator = item[2];
				bottomFrameKeys.push(rowIdx);
				if (item[1] !== '') { // bottom frame row has a sequence number entered.
					bottomFrameOrder.push({
						seq: parseInt(item[1]), // The number entered into the Sequence field. This will determine the placement of the row index in the answers list.
						idx: rowIdx,
						blank: {
							id: id++,
							shape: isOperator ? 'circ' : 'rect',
							line: 'dotted'
						}
					}); 
				}
			}
		});
		bottomFrameOrder.sort((a, b) => { return a.seq < b.seq ? -1 : 1; });	
		bottomFrameBlanks = bottomFrameOrder.map((item) => { return item.blank; });
		answers = topFrameChecked.concat(bottomFrameOrder.map((item) => { return item.idx; }));
		interactive_frames[0].contents = bottomFrameKeys;
		interactive_frames[1].contents = topFrameKeys;
		interactive_frames[2].contents = bottomFrameBlanks;
		presentation_data = {
			answer_val_map: labels,
			interactive_frames: interactive_frames
		};
		
		end_of_course = {
			order_matters: true,
			part_correct_allowed: false,
			presentation_data: JSON.stringify(presentation_data)
		};

		// Set a, end_of_course model properties.
		return {
			a: answers.join(','),
			end_of_course: [end_of_course]
		};
	};

	app.EOC.parsePresentationData = function(type, model) {
		unpack_model(model);

		var parsed;
		if (type === 'dragDrop') {
			parsed = parseDragDropFrames();
		}

		return parsed;	
	};

	app.EOC.dragDropValues = function(value, model) {
		unpack_model(model);

		var choices = value.map((item) => { return item[0]; });
		var partAans = [];
		var partBans = [];
		$.each(value, function(idx, val) {
			if (val[1]) {
				var tmpNdx = val[1] - 1;
				if (!partBans[tmpNdx]) partBans[tmpNdx] = idx;
			} else if ((val[1] === null) && val[2]) {
				partAans.push(idx);
			}
		});

		var answers = partAans.concat(partBans).join(',');

		return {
			choices: choices,
			answers: answers
		};
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


	var parseDragDropFrames = function() {
		var topFrameOptions = interactive_frames[1] && interactive_frames[1].contents ? interactive_frames[1].contents : [];
		var bottomFrameOptions = interactive_frames[0] && interactive_frames[0].contents ? interactive_frames[0].contents : [];
		var bottomFrameBlanks = interactive_frames[2] && interactive_frames[2].contents ? interactive_frames[2].contents : [];
		var variable = getDragDropVariable(topFrameOptions);
		var blanks = formatBottomFrameAnswer(bottomFrameOptions, bottomFrameBlanks);
		var frameOpts = formatFrameOpts(topFrameOptions, bottomFrameOptions);
		var tableRows = getDragDropRows(topFrameOptions, bottomFrameOptions, bottomFrameBlanks);

		return {
			variable: variable,
			topFrameOpts: frameOpts.top,
			bottomFrameOpts: frameOpts.bottom,
			bottomFrameBlanks: blanks,
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

	var formatBottomFrameAnswer = function(bottomFrameOptions, bottomFrameBlanks) {
		var bottomFrameAnswer = [];
		answers.forEach((item) => {
			if (bottomFrameOptions.indexOf(item) !== -1) {
				bottomFrameAnswer.push(item);
			}	
		});

		var blanks = [];
		bottomFrameBlanks.forEach((blank, idx) => {
			var ansIdx = bottomFrameAnswer[idx];
			blanks.push({
				shape: blank.shape,
				answer: answer_val_map[ansIdx]
			});
		});

		return blanks;
	};

	var formatFrameOpts = function(topFrameIndexes, bottomFrameIndexes) {
		var topFrameLabels = [];
		var bottomFrameLabels = [];
		answer_val_map.forEach((item, idx) => {
			if (topFrameIndexes.indexOf(idx) !== -1) {
				topFrameLabels.push(item);
			}
			if (bottomFrameIndexes.indexOf(idx) !== -1) {
				bottomFrameLabels.push(item);
			}
		});

		var opts = {
			top: topFrameLabels,
			bottom: bottomFrameLabels
		};

		return opts;
	};


	var getDragDropRows = function(topFrameIndexes, bottomFrameIndexes, bottomFrameBlanks) {
		var checkBoxes = [];
		var rowsA = [];
		var rowsB = [];
		var aItems = 0;
		topFrameIndexes.forEach((ndx) => {
			var checked = (answers.indexOf(ndx) !== -1) ? 1 : 0;
			rowsA.push([answer_val_map[ndx], checked]);
			if (checked) {
				aItems++;
				checkBoxes.push(ndx);
			}
		});

		bottomFrameIndexes.forEach((ndx) => {
			var order = answers.indexOf(ndx);
			var isOp = false;
			if (order !== -1) { 
				var coNdx = order - aItems;
				isOp = (bottomFrameBlanks[coNdx].shape === 'circ'); 
			}
			rowsB.push([answer_val_map[ndx], order !== -1 ? order - aItems + 1 : null, isOp]);
			if (isOp) {
				checkBoxes.push(ndx);
			}
		});

		var rows = {
			partA: rowsA,
			partB: rowsB,
			checked: checkBoxes
		};

		return rows;		
	};
})();
