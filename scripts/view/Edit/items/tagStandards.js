//=======================================================
// Chapter ID
//=======================================================
;(function() {

	//=======================================================
	//=======================================================
	app.TagStandardsView = app.PEView.extend({
		header: 'Add tags by standard',

		//---------------------------------------
		//---------------------------------------
		events: {
			'change .pulldown': 'getStandards',
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			var that = this;

			this.tags = {};
			this.standards = {}
			this.stdType = "";
			this.standardsModel = new app.StandardsList();

			_.bindAll(this, 'checkTags', 'showTags', 'loadStandards', 'loadFailure', 'canceled');

			that.viewDataState = 0;
			$.when(app.standardTypesPromise)
				.done(function() { that.viewDataState = 1; that.render(); })
				.fail(that.loadFailure);

		},

		//---------------------------------------
		//---------------------------------------
		render: function() {

			if (this.viewDataState === 1) {
				var tagTypeEl = $(app.templates.standardTypesPulldown({header: this.header, entries: app.standardTypes }));
				this.$el.html(tagTypeEl.attr('id','tagStandards'));
			}
			else if (this.viewDataState === 0) {
				app.loadFailure(this.$el, this.header, "Loading...");
			}
			else
				app.loadFailure(this.$el, this.header, "Failed to load data.");

			return this.el;
		},

		//---------------------------------------
		//---------------------------------------
		checkTags: function(data) {
			var that = this;

			// for tag standards, close first popup before opening second.
			var stdTagIds = data;
			if (!app.tags) {
				app.tagList.getTagList();
				app.tagList.fetch()
					.done(function(data) {
						app.tags = data;
						that.filterTags(stdTagIds);
					})
					.fail(that.loadFailure);
			}
			else
				this.filterTags(stdTagIds);
		},


		//---------------------------------------
		//---------------------------------------
		filterTags: function(tagIds) {
			var stdTags = {};

			$.each(tagIds, function(n1, id) {
				stdTags[id] = app.tags[id];
			});

			this.showTags(stdTags);
		},

		//---------------------------------------
		//---------------------------------------
		showTags: function(stdTags) {
			var that = this;

			this.tags = {};
			$.each(stdTags, function(key, obj) {
				var tmp = { tag_id: key, name: obj.tag, type: obj.type };

				if (_.where(that.model.get("tags"), {id: ""+key}).length > 0)
					tmp.checked = true;
				that.tags[key] = tmp;
			});

			var skillsList = new app.SkillsListView({

				id: 'skillsList',
				model: that.model,
				title: "Tags - " + this.tagName,
				listClass: 'wbSelect',
				filterClass: 'wbFilter',
				parentList: this.popup,
				data: this.tags,
				selection: this.tags,
				callback: function(data) { that.selectedSkill(data) },
				canceled: that.canceled
			});

			skillsList.render();
		},

		//---------------------------------------
		//---------------------------------------
		selectedSkill: function(data) {
			var that = this;

			// Clone to prevent modifying the model directly.
			var modelTags = $.extend([], that.model.get("tags"));
			$.each(data, function(n1, obj) {
				var value = obj.val,
					tagId = obj.objNo,
					state = obj.state;

				var matchingTags = _.where(modelTags, {tag: value});
				var tagNdx = _.indexOf(modelTags, matchingTags[0]);

				if (state && matchingTags.length == 0) {
					modelTags.push({ type: that.tags[tagId].type, tag: value, id: tagId });
				}
				else if (state === false) {
					delete modelTags[tagNdx];
				}
			});

			this.model.set("tags", modelTags);
			this.canceled();
		},


		//---------------------------------------
		//---------------------------------------
		selected: function(value, key) {
			var that = this;
			// tagName is used for the title of the popup list.
			this.tagName = value;
			app.tagList.searchByStandard();
			app.tagList.set({ standard_ids: [key] });
			app.tagList.save()
				.done(that.checkTags)
				.fail(that.loadFailure);
		},

		//---------------------------------------
		//---------------------------------------
		canceled: function() {
			$(".modal").remove();
			this.popup.remove();
		},

		//---------------------------------------
		// Update the chapter list
		//---------------------------------------
		getStandards: function(el) {
			var that = this;

			this.stdType = $(el.currentTarget).val().toLowerCase();
			if (!this.standards[this.stdType]) {
				this.standardsModel.setByType(this.stdType);
				this.standardsModel.fetch()
					.done(that.loadStandards)
					.fail(that.loadFailure);
			}
			else {
				this.standardsPopup();
			}
		},

		//-----------------------------------------
		//-----------------------------------------
		loadStandards: function(data) {
			var tmp = {};
			$.each(data, function(key, val) {
				tmp[key] = { key: key, item: val.code };
			});

			this.standards[this.stdType] = tmp;
			this.standardsPopup();
		},

		//-----------------------------------------
		// activated by Tag Standards dropdown.
		//-----------------------------------------
		standardsPopup: function() {
			var that = this;

			this.popup = new app.FilterListView({
				id: 'wbList',
				title: 'Standards',
				model: this.model,
				listClass: 'listContainer',
				filterClass: 'wbFilter',
				keepOpen: true,
				data: this.standards[this.stdType],
				selection: this.standards[this.stdType],
				callback: function(val, key) { that.selected.call(that, val, key) },
				canceled: that.canceled,
			});

			this.popup.render();

			this.render();
		},

		//-----------------------------------------
		//-----------------------------------------
		loadFailure: function() {
			this.viewDataState = 2;
			this.render();
		},

		//-----------------------------------------
		// Close routine.  Unbind model events.
		//-----------------------------------------
		close: function() {
		}
	});

})();
