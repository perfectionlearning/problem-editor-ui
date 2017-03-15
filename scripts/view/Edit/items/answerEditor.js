//=======================================================
// Answer: Equation (RichEditView)
//=======================================================
;(function() {
	// Instance of RichEditView
	app.AnswerEditView = app.RichEditView.extend({
		header: 'Answer text',
		field: 'a',
		dataOut: app.multiOut,		// These are specifically for multiple inputs, but should be okay everywhere
		dataIn: app.cleanAnswers	// If used only for multiple inputs, one can use equation, bypass translation, then switch to multiple input mode
	});
})();
