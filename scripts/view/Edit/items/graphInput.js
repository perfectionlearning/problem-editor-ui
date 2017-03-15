//=======================================================
// Support for graph type selection
//=======================================================
;(function() {

	//=======================================================
	// Graph Configuration View
	//=======================================================
	app.GraphConfigView = app.PEView.extend({

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			this.axisView = new app.GraphAxisView({model:this.model, original: this.options.original, parent: this.el});
			this.$el.append('<hr/>');
			this.eqView = new app.GraphEqView({model:this.model, original: this.options.original, parent: this.el});
			this.$el.append('<hr/>');
			this.graphView = new app.GraphView({model:this.model, original: this.options.original, parent: this.el});
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			this.axisView.render();
			this.eqView.render();
			this.graphView.render();

//			return this.el;
		},

		//---------------------------------------
		//---------------------------------------
		isDirty: function() {
			return app.isDirty([this.axisView, this.eqView]);
		},

		//---------------------------------------
		// Extract composite data from all fields
		// in the model that this view controls.
		//---------------------------------------
		getOriginal: function() {
			if (!this.childView)
				return [];

			return [this.axisView.getOriginal(), this.eqView.getOriginal()];
		},

		//---------------------------------------
		// Extract composite data from all fields
		// in the model that this view controls.
		//---------------------------------------
		getData: function() {
			if (!this.childView)
				return [];

			return [this.axisView.getData(), this.eqView.getData()];
		},

		//---------------------------------------
		// Store data to the fields of the model
		// that this view controls.
		//---------------------------------------
		setData: function(data) {
			this.axisView.setData(data[0]);
			this.eqView.setData(data[1]);
		},

		//---------------------------------------
		// Close routine.  Unbind model events.
		//---------------------------------------
		close: function() {
			var that = this;

			$.each(['axisView', 'eqView', 'graphView'], function(idx, view) {
				that[view].close();
				that[view].unbind();
				that[view].remove();
				delete that[view];
			});
		}

	});

})();
