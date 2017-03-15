//=======================================================
// Answer: Multiple input boxes (RichEditView)
//=======================================================
;(function() {
	// Instance of RichEditView
	app.MultiInputView = app.RichEditView.extend({
		header: 'Answer text',
		field: 'a',
		dataOut: app.multiOut,
		dataIn: app.cleanAnswers
	});
})();
