//=======================================================
// Simple list of whiteboards
//
//=======================================================
(function() {

	//=======================================================
	// Model
	//=======================================================
	var wbList = Backbone.Model.extend({

		url: function() {
			return app.commRoot + app.paths.wbList + this.id;
		},

		parse:function(data) {
			return {list:data}
		}
	});

	//=======================================================
	// Instance
	//=======================================================
	app.wbList = new wbList;

})();
