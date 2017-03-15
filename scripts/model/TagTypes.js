//=======================================================
// Tag type list Model
//
//=======================================================
(function() {

	//=======================================================
	// Info Model
	//=======================================================
	app.TagTypeListModel = Backbone.Model.extend({
		defaults: {
			id: 0,			// Required for backbone.
			type: ''
		}
	});

	//=======================================================
	// Collection
	//=======================================================
	app.TagTypeListCollection = Backbone.Collection.extend({
		model: app.TagTypeListModel,
		//url: app.commRoot + app.paths.tagTypes,

	});

	//=======================================================
	// Instance of Collection
	//=======================================================
	app.tagTypeList = new app.TagTypeListCollection([
		{ id: 64, type: "TEKS" },
		{ id: 128, type: "Skill" },
		{ id: 256, type: "Mathematical Practice" }
	]);
})();
