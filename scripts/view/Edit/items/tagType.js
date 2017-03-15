//=======================================================
// Chapter ID
//=======================================================
;(function() {

	//=======================================================
	//=======================================================
	app.TagTypeView = app.PEView.extend({
		header: 'Add tags by type',

		//---------------------------------------
		//---------------------------------------
		events: {
			'change #tagType': 'tagTypeChange',
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			this.tags = {};
			this.tagType;

			_.bindAll(this, 'loadFailure');
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var tagTypeList = app.tagTypeList.pluck('type');	// List of tag types
			var tagTypeData = { id: 0, type: ''};

			tagTypeList.unshift('Choose a tag type');

			this.$el.empty();

			var tagTypeEl = $(app.templates.pulldown({header: this.header, selection: tagTypeData.id, entries: tagTypeList}));
			this.$el.append(tagTypeEl.attr('id','tagType'));

			return this.el;
		},

		//---------------------------------------
		//---------------------------------------
		selected: function(value, key) {
			var data = {
				id: ""+key,
				tag: value,
				type: this.tagType
			};

			// We can't operate on the model directly. Clone the data.
			var modelTags = $.extend([], this.model.get("tags"));

			if (_.where(modelTags, {id: ""+key}).length == 0)
				modelTags.push(data);

			this.model.set("tags", modelTags);
		},

		//---------------------------------------
		//---------------------------------------
		canceled: function() {
		},

		//---------------------------------------
		// Update the chapter list
		//---------------------------------------
		tagTypeChange: function() {
			var that = this;

			this.tagType = $('#tagType select').val();

			var tagTypeREST = this.tagType == "Skill" ? "skill" : this.tagType;
			if (!this.tags[this.tagType]) {
				app.tagList.setUrl(tagTypeREST);
				app.tagList.fetch()
					.done(function(data) {
						that.tags[that.tagType] = [];
						_.each(data, (function(val, key) {
							that.tags[that.tagType].push({ key: key, item: val.tag });
						}));
						that.listTags();
					})
					.fail(that.loadFailure);
			}
			else {
				this.listTags();
			}
		},

		//---------------------------------------
		//---------------------------------------
		listTags: function() {
			var that = this;

			var list = new app.FilterListView({
				id: 'wbList',
				title: 'Tags',
				listClass: 'wbSelect',
				filterClass: 'wbFilter',
				data: this.tags[this.tagType],
				selection: this.tags[this.tagType],
				callback: function(val, key) { that.selected.call(that, val, key) },
				canceled: that.canceled,
			});

			list.render();

			//app.changed.call(this);
			this.render();
		},

		//---------------------------------------
		//---------------------------------------
		loadFailure: function() {
			app.loadFailure(this.$el, "Tag Type", "Failure loading data");
		},

		//---------------------------------------
		// Close routine.  Unbind model events.
		//---------------------------------------
		close: function() {
		}
	});

})();
