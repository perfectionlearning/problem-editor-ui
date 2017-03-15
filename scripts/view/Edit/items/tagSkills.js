//=======================================================
// Chapter ID
//=======================================================
;(function() {

	//=======================================================
	//=======================================================
	app.TagSkillsView = app.PEView.extend({
		header: 'Add tags by skill',
		compare: app.simpleCompare,
		field: 'tagTypeID',

		//---------------------------------------
		//---------------------------------------
		events: {
			'click button': 'showTree',
			'change #tagType': 'tagTypeChange'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			this.tagTopics = {};

			this.original = this.last = this.options.original.get(this.field);
			this.isDirty = !this.compare(this.model.get(this.field), this.original);

			_.bindAll(this, 'gotData', 'loadFailure', 'canceled');

			this.viewDataState = 0;

			// app.tagTreePromise is fulfilled when topics, objectives are loaded.
			app.tagTreePromise.done(this.gotData).fail(this.loadFailure);
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			this.$el.empty();

			if (this.viewDataState === 1)
				this.$el.append(app.templates.skillsButton({header: this.header }));
			else if (this.viewDataState === 0)
				app.loadFailure(this.$el, this.header, "Loading...");
			else
				app.loadFailure(this.$el, this.header, "Failed to load skill data.");

			return this.el;
		},

		//---------------------------------------
		//---------------------------------------
		gotData: function()
		{
			this.viewDataState = 1;

			// @FIXME/dg: This is messed up!
			this.tagSkills = app.tagSkills;
			this.tagTopics = app.tagTopics;

			this.render();
		},

		//---------------------------------------
		//---------------------------------------
		showTree: function() {
			var that = this;

			this.treeList = new app.TreeListView({
				id: 'treeList',
				model: this.model,
				title: 'Topics',
				listClass: 'wbSelect',
				filterClass: 'wbFilter',
				data: this.tagTopics,
				selection: this.tagTopics,
				callback: function(val, objno) { that.selected.call(that, val, objno) },
				canceled: this.canceled
			});

			this.treeList.render();
		},

		//---------------------------------------
		//---------------------------------------
		renderSkills: function() {
			var that = this;

			// if a list of skills is already displayed, remove it before displaying another.

			if (this.skillsList) {
				this.skillsList.remove();
			}

			var modelTags = this.model.get("tags");
			var skillTags = this.tagSkills[this.objNo].list.map(function(s) {
				s.checked = (_.where(modelTags, {id: s.tag_id}).length > 0);
				return s;
			});

			this.skillsList = new app.SkillsListView({
				id: 'skillsList',
				model: this.model,
				title: "Objective: " + this.objective,
				listClass: 'wbSelect',
				filterClass: 'wbFilter',
				parentList: this.treeList,
				data: skillTags,
				selection: skillTags,
				callback: function(checkboxes) { that.selectedSkill.call(that, checkboxes) },
				canceled: that.canceled
			});

			this.skillsList.render();
		},

		//---------------------------------------
		//---------------------------------------
		selected: function(value, objno) {
			this.objective = value;
			this.objNo = objno;

			this.renderSkills();
		},

		//---------------------------------------
		//---------------------------------------
		selectedSkill: function(checkboxes) {

			// Create a cloned copy so we're not working directly on the model.
			var modelTags = $.extend([], this.model.get("tags"));
			$.each(checkboxes, function(n1, obj) {
				var value = obj.val,
					tagId = obj.objNo,
					state = obj.state;

				var matchingTags = _.where(modelTags, {tag: value});
				var tagNdx = _.indexOf(modelTags, matchingTags[0]);

				if (state && matchingTags.length == 0)
					modelTags.push({ type: "Skill", tag: value, id: tagId });

				else if (state === false)
					delete modelTags[tagNdx];
			});

			this.model.set("tags", modelTags);
			this.canceled();
		},

		//---------------------------------------
		//---------------------------------------
		canceled: function() {
			$('.modal').remove();
			this.treeList.remove();
		},

		//---------------------------------------
		// Update the chapter list
		//---------------------------------------
		tagTypeChange: function() {
			//app.changed.call(this);
			this.render();
		},

		//---------------------------------------
		// Handle REST call failure
		//---------------------------------------
		loadFailure: function() {
			this.viewDataState = 2;
			this.render();
		},

		//---------------------------------------
		// Close routine.  Unbind model events.
		//---------------------------------------
		close: function() {
		}
	});

})();
