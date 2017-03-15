//=======================================================
// Simple list of tags
//
//=======================================================
(function() {

	//=======================================================
	// Model
	//=======================================================
	var tagList = Backbone.Model.extend({
		tree: false,

		setUrl: function(type) {
			this.url = app.commRoot + app.paths.tagsByType + "/" + type;
		},

		searchByStandard: function(id) {
			this.url = app.commRoot + app.paths.tagsSearch;
		},
		
		getTagList: function() {
			this.url = app.commRoot + app.paths.tagList;
		},
		
		setTreeUrl: function() {
			this.tree = true;
			this.url = app.commRoot + app.paths.tagsBySkill;
		},
		
		
		/*
			In: { topic: [ {
				name: "topic name",
				objectives: [ {
					name: "objective name",
					skills: [ {
						name: "skill name",
						tag_id: "12345"
					} ]
				} ]
			} ] }
		 
		    Out: {
				list: {
					skills: { 1: {}, 2: [], ... },
					topics: [ {}, ... ]
				}
			}
			
			Parsed version is to make data easier to access and list.
		 */
		parse:function(data) {
			var skills = {};
			var topicName,
				objectiveName;
			if (this.tree) {
				var objNo = 1;
				if (data && data.topics) {
					$.each(data.topics, function(idx, topic) {
						topicName = topic.name;
						$.each(topic.objectives, function(objIdx, objective) {
							objectiveName = objective.name
							skills[objNo] = {
								topic: topicName,
								objective: objectiveName,
								list: objective.skills
							};
							objective.objNo = objNo++;
						});
					});
					data.skills = skills;
				}
			}
			this.tree = false;
			return {
				list:data
			};
		}
	});

	//=======================================================
	// Instance
	//=======================================================
	app.tagList = new tagList;

})();
