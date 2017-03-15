//=======================================================
// User List Model
//
//=======================================================
(function() {

	//=======================================================
	// User Model
	//=======================================================
	var UserList = Backbone.Model.extend({

		url: function() {
			return app.commRoot + app.paths.userList;
		},

		parse: function(data) {
			return {list: data}
		}

	});

	//=======================================================
	// Instance of model
	//=======================================================
	app.userList = new UserList;

})();
