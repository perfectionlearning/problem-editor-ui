//=======================================================
// Shows the current variable values
//=======================================================
;(function() {
	app.VarExamplesView = app.PEView.extend({

		//---------------------------------------
		//---------------------------------------
		initialize: function() {

			// These need to be unbound manually if the view is ever destroyed!
			this.render = _.bind(this.render, this);
//			this.model.on('change:vars', this.render);
//			this.model.on('change:constraints', this.render);
			this.model.on('resetVars', this.render);
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var that = this;
			this.$el.empty();

			var curVars = app.getVars();		// Choose an instance of the variables

			if (Object.keys(curVars).length > 0)
			{
				var varList = this.commaList(curVars);

				// Show sample values
				if (this.options.showLong)
					this.$el.append(app.templates.varExamples({vars: curVars}));
				else
					this.$el.append(app.templates.varExamplesShort({vars: varList}));
			}

			return this.el;
		},

		//---------------------------------------
		//---------------------------------------
		commaList: function(obj) {
			var out = [];
			$.each(obj, function(key, val) {
				out.push(key + ': ' + app.Math.round(val, 10));
			});

			return out.join(', ');
		},

		//---------------------------------------
		// Close routine.  Unbind model events.
		//---------------------------------------
		close: function() {
			this.model.off(null, this.render);
		}

	});

})();
