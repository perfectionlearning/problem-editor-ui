//===========================================================================================
// Queries Tab on the Top Level Page
// Consists of a number of subviews, one per query type
//===========================================================================================
;(function() {
	//=======================================================
	// View (and controllers)
	//=======================================================
	app.QueryTab = app.PEView.extend({

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			this.objectQuery = new app.ObjectQuery();
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var that = this;

			that.$el.empty();
			that.$el.append(that.objectQuery.render());

			return that.el;
		},

		//---------------------------------------
		//---------------------------------------
		close: function() {
			this.objectQuery.close();
		}

	});

})();
