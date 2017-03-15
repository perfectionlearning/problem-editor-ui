//=======================================================
// Query Model
//
// Results of a general query.
//=======================================================
(function() {

	//=======================================================
	// Query Model
	//=======================================================
	app.Query = Backbone.Model.extend({
//		urlRoot: app.commRoot + app.paths.problemList,

		defaults: {
			id: 0,			// Required for backbone.
			fields: {},
			data: []
		}
	});

	//=======================================================
	// Instances of Query Model
	//=======================================================
	// Used for problem set queries
	app.queryResult = new app.Query;
	app.queryResult.urlRoot = app.commRoot + app.paths.problemList;

	// Used for generic object queries
	app.objectList = new app.Query();
	app.objectList.url = app.commRoot + app.paths.query;

	// Used for problem lookup by chapter (temporary query -- soon to be integrated with generic object queries)
	app.chapterProbList = new app.Query();
	app.chapterProbList.urlRoot = app.commRoot + app.paths.problemQuery;

})();
