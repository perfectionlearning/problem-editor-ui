//=======================================================
// Review Model
//
// We may want to fold this into the problem model, which
// would allow for a single AJAX request.  It does
// pollute the problem model though, since one of these
// gets attached to every item in the problem model.
//
//=======================================================
(function() {

	//=======================================================
	// Model
	//=======================================================
	app.ReviewStatus = Backbone.Model.extend({
		defaults: {
			key: '',
			type: 'problem',
			subtype: '',
			status: '',		// 'pass', 'fail', ''
			notes: '',
//			date: '',
//			author: ''
		},

		url: function() {
			return app.commRoot + '/reviews';
		}

	});

	//=======================================================
	// Collection
	//=======================================================
//	app.ReviewSet = Backbone.Collection.extend({
//		model: app.ReviewStatus,
//	});

	//=======================================================
	// Instance of Collection
	//=======================================================
	app.problemStatus = new app.ReviewStatus;


})();
