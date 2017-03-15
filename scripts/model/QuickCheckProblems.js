//=======================================================
// @FIXME/dg: This shouldn't exist. Move the functionality into Query.js,
// the generic model for handling queries.
// One should avoid the temptation to create new models for
// every individual query.
//
// Quick Check Problem Sets Model
//
// Request top-level information from the server
//=======================================================
(function() {

	//=======================================================
	// Quick Check Problem Sets Model
	//=======================================================
	app.QuickCheckProblemsModel = Backbone.Model.extend({
		urlRoot: app.commRoot + app.paths.problemQuery,

		defaults: {
			id: 0,			// Required for backbone.
			name: '',
			problem_display_number: '',
			problem_id: '',
			q: '',
			status: ''
		}
	});

	//=======================================================
	// Instance of Model
	//=======================================================
	app.quickCheckProblems = new app.QuickCheckProblemsModel;

})();
