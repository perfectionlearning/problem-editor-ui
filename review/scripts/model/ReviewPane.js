//=======================================================
// ReviewPane Model
//
// For Review content - pass, failure, explanation.
//
//=======================================================
(function() {

	//=======================================================
	// Model
	//=======================================================
	app.ReviewStatusModel = Backbone.Model.extend({
		url: app.commRoot + '/reviews/statuses'
	});

	//=======================================================
	// Model
	//=======================================================
	app.ReviewPaneModel = Backbone.Model.extend({
		urlRoot: app.commRoot + '/reviews',

		defaults: {
			key  		: 0,
			type		: 'problem',
			subtype     : '',
			subtype_key : 0,
			status      : '',
			notes		: ''
		},

		/*
		 * lookup:
		 *   problem: /problem/[probId]/[subtype]/[subtype_key]
		 *     so lookup = "[probId]/[subtype]/[subtype_key]"
		 *   whiteboard: /whiteboard/[book_id+whiteboard_name] (e.g., 07_wb_diffusion)
		 *   cardview: /cardview/[chapter_id+section_name] (e.g., 2003_Fluids)
		 *   activity: /activity/[object_name] (e.g., jsact_race)
		 */
		setStatusUrl: function(objtype, lookup) {
			this.url = app.commRoot + '/reviews/' + objtype + '/' + lookup;
		},
		
		setSaveUrl: function(probId) {
			app.commRoot = app.commRoot || '';
			this.url = app.commRoot + '/reviews';
		},
		
		url: function() {
			return app.commRoot + '/reviews/' + app.reviewObjectType + '/' + this.key + '/' + this.subtype + '/0';
		}

	});

	app.ReviewPaneModel.prototype.getHistory = function(objtype, lookup) {
		this.url = app.commRoot + '/reviews/' + objtype + '/' + lookup + '/history';
		var deferred = this.fetch();
		return deferred;
	};

	app.ReviewPaneModel.prototype.getHistoryOld = function(probId, subtype, subtype_key) {
		this.url = app.commRoot + '/reviews/' + app.reviewObjectType + '/' + lookup + '/history';
		this.url = app.commRoot + '/reviews/' + app.reviewObjectType + '/' + probId + '/' + subtype + '/' + subtype_key + '/history';
		var deferred = this.fetch();
		return deferred;
	};

	//=======================================================
	// Instance of Collection
	//=======================================================
	app.reviews = new app.ReviewPaneModel;

})();
