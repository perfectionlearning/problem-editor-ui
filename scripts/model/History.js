//=======================================================
// Edit History Model
//
//=======================================================
(function() {

	//=======================================================
	// History Model
	//=======================================================
	app.historyModel = Backbone.Model.extend({
		parse: function(model) {

			if (model.action === "insert")
				model.action = "created";
			else if (model.action === "update")
				model.action = "modified";

			model.timestamp_pst = cleanTime(model.timestamp_pst);

			return model;
		}
	});

	//=======================================================
	//
	//=======================================================
	function cleanTime(timeString)
	{
		// timeString can be parsed directly by Chrome, but not Firefox.
		// Replace the space between the date and time with a 'T'
		var regex = /([^ ]+) ([^ ]+)/;
		timeString = timeString.replace(regex, '$1T$2');

		return dateFormat(timeString, 'm/d/yy, h:MM TT');
	}

	//=======================================================
	// Collection
	//=======================================================
	app.historyCollection = Backbone.Collection.extend({
		model: app.historyModel,

		url: function() {
			return app.commRoot + app.paths.history + '/' + app.curProbID;
		}
	});

	//=======================================================
	// Instance of Collection
	//=======================================================
	app.problemHistory = new app.historyCollection;

})();
