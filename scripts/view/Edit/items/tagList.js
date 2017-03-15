//=======================================================
// Chapter ID
//=======================================================
;(function() {

	//=======================================================
	//=======================================================
	app.TagListView = app.PEView.extend({
		header: 'Tag List',
		compare: app.objectArrayCompare,
		field: 'tags',

		//---------------------------------------
		//---------------------------------------
		events: {
			"click #clearTags": "verifyClearAll",
			"click .delete-tag": "clearTag"
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			var that = this;

			this.original = this.last = this.options.original && this.options.original.get(this.field);
			this.isDirty = !this.compare(this.model.get(this.field), this.original);

			_.bindAll(this, 'clearAll', 'modelChanged', 'loadFailure');
			this.model.on('change:' + this.field, this.modelChanged);

			this.viewDataState = 0;

			// make sure tag tree data are loaded before rendering the tag list.
			$.when(app.tagTreePromise)
				.then(function() { that.viewDataState = 1; that.render(); })
				.fail(that.loadFailure);
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			switch (this.viewDataState)
			{
				case 0:
					app.loadFailure(this.$el, this.header, "Loading...");
					break;

				case 1:
					this.addTopicsObjectives();
					this.renderTagList();
					break;

				case 2:
					app.loadFailure(this.$el, this.header, "The tags could not be loaded.");
					break;
			}

			return this.el;
		},

		//---------------------------------------
		//---------------------------------------
		loadFailure: function() {
			this.viewDataState = 2;
			this.render();

			// This happens 3 times per step, plus once on the tags tab
			app.loadedProblemTags.reject();
		},

		//---------------------------------------
		//---------------------------------------
		renderTagList: function() {
			var data = this.formatTagList(this.enhancedTags);

			if (data)
			{
				this.$el.html(app.templates.list({header: this.header, tagList: data }));

				if (!this.options.compact)
					this.$el.append(app.templates.button({id: 'clearTags', text: 'Clear all'}));
				else
					this.$('.ctrl').css('display', 'none');	// Cheesy but easy way to remove the delete buttons for compact mode
			}
			else
				this.$el.html(app.templates.msgWithHeader({header: this.header, msg: "No tags." }));
		},

		//---------------------------------------
		//
		//---------------------------------------
		formatTagList: function(data) {
		    var lastTopic = null,
		        lastObjective = null,
		        lastType = null;
		    var cellClass = [
		        [
		            ["topic-bg", "objective-bg"],
		            ["topic-bg", "objective-bg2"],
		        ],
		        [
		            ["topic-bg-alt", "objective-bg-alt"],
		            ["topic-bg-alt", "objective-bg-alt2"],
		        ],
		    ];
		    var rows = [], groups = [];
		    var bgTopicNdx = 0,
		        bgObjectiveNdx = 0,
		        topicClass, objectiveClass,
				typeTemplate,
				tagTemplate;

		    $.each(data, function(n1, obj) {
		        var displayTopic = "";
		        var displayObjective = "";
		        if (obj.type != lastType) {
					if (rows.length > 0) {
						groups.push(app.templates.tagGroup({rows: rows.join("")}));
						rows = [];
					}
					// Tag list templates are in a hash keyed by object type, with "generic" as default.
					var key = obj.type.toLowerCase();
					typeTemplate = app.templates.tagListType[key] || app.templates.tagListType["generic"];
					tagTemplate = app.templates.tagListTag[key] || app.templates.tagListTag["generic"];
		            rows.push(typeTemplate({ type: obj.type }));
		            lastType = obj.type;
		        }
		        if (obj.topic != lastTopic) {
		            bgTopicNdx = (bgTopicNdx + 1) % 2;
		            bgObjectiveNdx = 0;
		            lastTopic = obj.topic;
		            lastObjective = obj.objective;
		            displayTopic = obj.topic;
		            displayObjective = obj.objective;
		        }
		        else if (obj.objective != lastObjective) {
		            bgObjectiveNdx = (bgObjectiveNdx + 1) % 2;
		            lastObjective = obj.objective;
		            displayObjective = obj.objective;
		        }

		        topicClass = cellClass[bgTopicNdx][bgObjectiveNdx][0];
		        objectiveClass = cellClass[bgTopicNdx][bgObjectiveNdx][1];
		        tagClass = "";
		        rows.push(tagTemplate({
					idx: n1,
					id: obj.id,
					tag: obj.tag,
					topicClass: topicClass,
					objectiveClass: objectiveClass,
					topic: displayTopic,
					objective: displayObjective
				}));
		    });
			if (rows.length > 0) {
				groups.push(app.templates.tagGroup({rows: rows.join("")}));
				rows = [];
			}

			var code = groups.length > 0 ? app.templates.tagList({ rows: groups.join("") }) : "";

		    return code;
		},


		//---------------------------------------
		//---------------------------------------
		addTopicsObjectives: function()	{
			var enhancedTags = [];

			var tagModels = this.model.get(this.field);

			_.each(tagModels, function(m) {
				var data = {
					id: m.id,
					type: m.type,
					tag: m.tag
				};
				if (app.tagTopicObjective[m.id]) {
					data.topic = app.tagTopicObjective[m.id].topic;
					data.objective = app.tagTopicObjective[m.id].objective;
				}
				enhancedTags.push(data);
			});
			
			// Tags loaded; resolve the deferred so the standards can proceed.
			if (app.loadedProblemTags.state() !== "resolved")
				app.loadedProblemTags.resolve();

			enhancedTags.sort(this.sortTags);
			this.enhancedTags = enhancedTags;
		},

		//---------------------------------------
		// Fetch the value from the control
		//---------------------------------------
		value: function() {
			var tags = [];

			_.each(this.model.get(this.field), function(m) {
				tags.push({
					id: ""+m.id,
					tag: m.tag,
					type: m.type
				});
			});

			return tags;
		},

		//---------------------------------------
		// Tags is an array of objects; need special routine
		// to sort by type, topic, objective, tag name
		//---------------------------------------
		sortTags: function(a, b) {
			var type1 = a.type,
				type2 = b.type,
				tagName1 = a.tag,
				tagName2 = b.tag,
				topic1 = a.topic,
				topic2 = b.topic,
				objective1 = a.objective,
				objective2 = b.objective;

			if (type1 < type2)
				return -1;
			else if (type1 > type2)
				return 1;
			else {
				if (topic1 < topic2)
					return -1;
				else if (topic1 > topic2)
					return 1;
				else
					if (objective1 < objective2)
						return -1;
					else if (objective1 > objective2)
						return 1;
					else
						if (tagName1 < tagName2)
							return -1;
						else if (tagName1 > tagName2)
							return 1;
						else
							return 0;
			}
		},

		//---------------------------------------
		//---------------------------------------
		verifyClearAll: function() {
			new app.Modal.View({
				title: 'Are you sure?',
				text: 'Do you really want to clear all tags from this problem?',
				ok: this.clearAll,
				cancel: function(){}
			});
		},

		//--------------------------
		// Clear all tags from this problem.
		//--------------------------
		clearAll: function() {
			this.model.set(this.field, []);	// Triggers modelChanged, which renders and updates
		},

		//--------------------------
		// Clear selected tag from this problem.
		//--------------------------
		clearTag: function(evt) {
			var target = evt.currentTarget;

			// This was working without a clone for some reason, but it shouldn't.
			// Clone for consistency and safety.
			var tags = $.extend([], this.model.get(this.field));
			var id = $(target).data("tag-id");
			var tag = _.findWhere(tags, {id: ""+id});
			var idx = tags.indexOf(tag);
			tags.splice(idx, 1);

			this.model.set(this.field, tags);	// Triggers modelChanged, which renders and updates
		},

		//--------------------------
		// Close routine.  Unbind model events.
		//--------------------------
		close: function() {
			this.model.off(null, this.modelChanged);
		}
	});

})();
