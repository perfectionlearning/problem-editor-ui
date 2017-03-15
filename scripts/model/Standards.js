//=======================================================
// Simple list of tags
//
//=======================================================
(function() {

	//=======================================================
	// Model
	//=======================================================
	app.StandardsList = Backbone.Model.extend({
		url: app.commRoot + app.paths.standardsByTag,
		
		setTypes: function() {
			this.url = app.commRoot + app.paths.standardTypes;
		},
		
		setByType: function(type) {
			this.url = app.commRoot + app.paths.standardsType + type;
		},
		
		setUrl: function() {
			this.url = app.commRoot + app.paths.standardsByTag;
		}

	});

})();
