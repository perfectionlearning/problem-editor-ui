;(function() {

	var answers,
	    end_of_course,
            presentation_data,
	    answer_val_map,
	    interactive_frames
	;
	app.EOC = {};
	app.EOC.parsePresentationData = function(type, model) {
		var end_of_course_raw = model.get('end_of_course');
		var answers_raw = model.get('a');
		end_of_course = end_of_course_raw[0];
		answers = answers_raw.split(',').map((item) => { return parseInt(item, 10); });
		presentation_data = JSON.parse(end_of_course.presentation_data);
		answer_val_map = presentation_data.answer_val_map;
		interactive_frames = presentation_data.interactive_frames;

		var parsed;
		if (type === 'dragDrop') {
			parsed = parseDragDropFrames();
		}

		return parsed;	
	};

	var parseDragDropFrames = function() {
		var topFrameOptions = interactive_frames[1].contents;
		var bottomFrameOptions = interactive_frames[0].contents;
		var bottomFrameBlanks = interactive_frames[2].contents;
		var variable = getDragDropVariable(topFrameOptions);
		var blanks = formatBottomFrameAnswer(bottomFrameOptions, bottomFrameBlanks);
		var frameOpts = formatFrameOpts(topFrameOptions, bottomFrameOptions);

		return {
			variable: variable,
			topFrameOpts: frameOpts.top,
			bottomFrameOpts: frameOpts.bottom,
			bottomFrameBlanks: blanks
		};
	};

	var getDragDropVariable = function(topFrameOptions) {
		var selected;
		answers.forEach((item) => {
			if (topFrameOptions.indexOf(item) !== -1) {
				selected = item;
			}
		});

		var variable = answer_val_map[selected] || 'No variable chosen';

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

	var formatFrameOpts = function(topFrameOptions, bottomFrameOptions) {
		var topFrameOpts = [];
		var bottomFrameOpts = [];
		answer_val_map.forEach((item, idx) => {
			if (topFrameOptions.indexOf(idx) !== -1) {
				topFrameOpts.push(item);
			}
			if (bottomFrameOptions.indexOf(idx) !== -1) {
				bottomFrameOpts.push(item);
			}
		});

		var opts = {
			top: topFrameOpts,
			bottom: bottomFrameOpts
		};

		return opts;
	};
})();
