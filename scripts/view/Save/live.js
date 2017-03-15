//=======================================================
// Pulldown control
//=======================================================
;(function() {
	app.LiveView = app.PEView.extend({
		header: 'Live (problem is active)',
		field: 'live',

		//---------------------------------------
		//---------------------------------------
		events: {
			'click .stopEdit': 'toggle'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			this.list = ['No', 'Yes'];	// This gets fetched somehow

			// Not necessary -- it's a good idea to have this in here, just in case we even need
			// live updating.  However, it can also create zombie events if they aren't unbound.
//			this.render = _.bind(this.render, this);
//			this.model.bind('change:' + this.field, this.render);
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var data = this.model.get(this.field);
			this.transform && (data = this.transform(data));

			var selection = Array.indexOfCI(this.list, data);

			if (data && selection === -1)
			{
				this.list.push(data);
				selection = this.list.length-1;
			}

			this.$el.html(app.templates.pulldown({header: this.header, selection: selection, entries: this.list}));
			return this.el;
		},

		//---------------------------------------
		// Fetch the value from the control
		//---------------------------------------
		value: function() {
			return this.$('select').val() === 'Yes';
		},

		//---------------------------------------
		//---------------------------------------
		transform: function(data) {
			if (data)
				return 'Yes';
			else
				return 'No';
		},

		//---------------------------------------
		//---------------------------------------
		toggle: function() {
			var old = this.value();
			var newVal = old ? 'No' : 'Yes';
			this.$('select').val(newVal);
		}

	});
})();
