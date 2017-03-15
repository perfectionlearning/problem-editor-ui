//=======================================================
// Chapters Model
//
// Request top-level information from the server
//=======================================================
(function() {

	//=======================================================
	// Problem Sets Model
	//=======================================================
	app.ProblemSetsModel = Backbone.Model.extend({
		url: function() {
			return app.commRoot + '/problem_sets/in_chapter/' + this.id;
		},

		idAttribute: 'problem_set_id',
		keepThisId: true,
		context: 'quickCheck',

		defaults: {
			problem_set_id: 0			// Required for backbone.
		}
	});

	//=======================================================
	// Instance of Collection
	//=======================================================
	app.problemSets = new app.ProblemSetsModel;

})();
