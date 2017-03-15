//=======================================================
// Info Model
//
// These are for server-defined top-level queries
// They were removed because they were obsolete and slowed
// down the top page considerably.
//
// Request top-level information from the server
//=======================================================
(function() {

	//=======================================================
	// Info Model
	//=======================================================
	app.InfoModel = Backbone.Model.extend({
		urlRoot: app.commRoot + '/info',

		defaults: {
			id: 0,			// Required for backbone.
			count: 0,
			filter: '',
			type: ''
		}
	});

	//=======================================================
	// Instance of Info Model
	//=======================================================
//	app.info = new app.InfoModel;

	//=======================================================
	// Collection
	//=======================================================
	app.InfoList = Backbone.Collection.extend({
		model: app.InfoModel,
		url: app.commRoot + '/info/0',		// Fix this: Change the trailing 0 to something useful based on user permissions or group
	});

	//=======================================================
	// Instance of Collection
	//=======================================================
	app.info = new app.InfoList;

})();
