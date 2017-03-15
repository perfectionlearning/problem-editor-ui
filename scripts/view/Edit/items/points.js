//=======================================================
// Points (text input)
//=======================================================
;(function() {
	app.PointsView = app.TextInputView.extend({
		header: 'Points possible',
		field: 'maxScore',

		//--------------------------
		// Fetch the value from the control (override TextInput -- we need an int, not a string)
		//--------------------------
		value: function() {
			return parseInt(this.$('textarea').val());
		}

	});
})();
