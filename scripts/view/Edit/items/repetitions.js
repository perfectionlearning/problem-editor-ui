//=======================================================
// Repetitions/Streak (text input)
//=======================================================
;(function() {
	app.RepetitionsView = app.TextInputView.extend({
		header: 'Streak length',
		field: 'repetitions',

		//--------------------------
		// Fetch the value from the control (override TextInput -- we need an int, not a string)
		//--------------------------
		value: function() {
			return parseInt(this.$('textarea').val());
		}

	});
})();
