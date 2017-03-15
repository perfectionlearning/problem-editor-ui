//=======================================================
// Chapter ID
//=======================================================
;(function() {

	//=======================================================
	//=======================================================
	app.StandardsView = app.PEView.extend({
		header: 'Standards',

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			var that = this;
			this.standardsModel = new app.StandardsList();

			_.bindAll(this, 'loadFailure', 'updateStandards');
			this.model.on('change:tags', this.updateStandards);

			// Hold off on rendering until app.loadedProblemTags deferred is resolved (tagList.js)
			// DG: WHY?! There is no correlation.
			this.viewDataState = 0;

			this.updateStandards();
			/*
			app.loadedProblemTags
				.done(function() {
//					that.viewDataState = 1;
//					that.render();
					that.updateStandards();
				})
				.fail(that.loadFailure);
			*/
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var that = this;
			this.$el.empty();

			// view data state flag must be set, indicating tag data loaded
			if (this.viewDataState === 1)
			{
				if (!this.data || this.data.length === 0)
					this.$el.append(app.templates.msgWithHeader({header: this.header, msg: "No matching standards."}))
				else
					that.$el.html(app.templates.standards({ header: that.header, data: this.data || [] }));
			}
			else if (this.viewDataState === 0)
				app.loadFailure(this.$el, this.header, "Loading...");
			else
				app.loadFailure(this.$el, this.header, "The standards data could not be loaded.");

			return that.el;
		},

		//---------------------------------------
		//---------------------------------------
		updateStandards: function() {
			var that = this;

			// Show loading message
			this.viewDataState = 0;
			this.render();

			var tagIds = _.pluck(this.model.get("tags"), "id");
			tagIds.sort();

			this.standardsModel.setUrl();

			// Clearing to remove noise from attributes.
			// For some reason, each time a TEKS tag is added, the { code, description, type }
			// object is added as an attribute, with ID as key.
			// The first call posts no noise.  The second includes an attribute for each
			// existing TEKS tag.
			this.standardsModel.clear();
			this.standardsModel.set({tag_ids: tagIds});
			this.standardsModel.save()
				.done(function(data) {
					that.data = _.sortBy(data, function(obj) {
						return obj.code;
					});

					// Show results
					that.viewDataState = 1;
					that.render();
				})
				.fail(that.loadFailure);
		},

		//---------------------------------------
		//---------------------------------------
		loadFailure: function() {
			this.viewDataState = 2;
			this.render();
		},

		//--------------------------
		// Close routine.  Unbind model events.
		//--------------------------
		close: function() {
			this.model.off(null, this.updateStandards);
		}
	});

})();
