//=======================================================
// Book and chapter list Model
//
//=======================================================
(function() {

	//=======================================================
	// Info Model
	//=======================================================
	app.BookListModel = Backbone.Model.extend({
		defaults: {
			id: 0,			// Required for backbone.
			name: '',
			chapters: []
		}
	});

	//=======================================================
	// Collection
	//=======================================================
	app.BookListCollection = Backbone.Collection.extend({
		model: app.BookListModel,
		url: app.commRoot + app.paths.bookList,

		// WARNING: This is a crazy hack.  We just want Physics first.  This sorts by ID, but as a string.
		// Physics has "34" for the ID, and the next ID is "5".
		comparator: function(model) {
			return model.get('id');
		}
	});

	//=======================================================
	// Instance of Collection
	//=======================================================
	app.bookList = new app.BookListCollection;

})();
