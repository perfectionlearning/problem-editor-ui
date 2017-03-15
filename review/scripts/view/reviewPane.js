//=======================================================
// Review pane functionality
//=======================================================
;(function() {

	//=======================================================
	// Move this to somewhere else!
	//=======================================================
	// The "type" can be queried from the server at /reviews/statuses
	app.StatusList = {
		"New": {text: "New", style: 'statusNew'},
		"Needs Content": {text: "Needs Content", style: 'needsContent'},
		"Needs VTP": {text: "Needs VTP", style: 'needsVTP'},
		"Author Complete": {text: "Author complete", style: 'authorComplete'},
		"Unreviewed": {text: "Ready for review", style: 'unreviewed'},
		"Passed x1": {text: "Passed Once", style: 'passed1x'},
		"Passed x2": {text: "Passed Twice", style: 'passed2x'},
		"Passed x3": {text: "Passed Three Times", style: 'passed3x'},
		"Failed Review": {text: "Failed", style: 'failedReview'},
		"Modified": {text: "Modified", style: 'unmodified'}
	};

	app.reviewMenu = [
		{ label: 'Fail', opt: 'fail' },
		{ label: 'Pass', opt: 'pass' },
		{ label: 'Add Note', opt: 'note' },
		{ label: 'Assign to', opt: 'assign' },
		{ label: 'View History', opt: 'history' }
	];

	// These are placeholders.
	var commonFailures = [
		'Ambiguous phrasing; reword, and clarify.',
		'Phrasing contains compositional errors.',
		'Assumes knowledge that would not yet have been covered.',
		'Process shown to get solution is incorrect.',
		'The information in this item is incorrect.'
	];

	var recentHistory = [];

	var reviewNoteHasContent = function(note)
	{
		if (note) {
			return true;
		}
		return false;
	};

	app.cleanHistory = function(hist) {
		var fmtHist = [];
		$.each(hist, function(idx, val) {
			val.date = cleanDate(val.datetime);
			switch (val.status.substr(0, 4).toLowerCase()) {
				case 'pass':
					val.statClass = 'hist-pass';
					break;
				case 'fail':
					val.statClass = 'hist-fail';
					break;
				default:
					val.statClass = '';
			}
			val.status = translateStatus(val.status);
			val.notesClass = val.notes ? 'hist-notes' : 'hist-no-notes';
			fmtHist.unshift(val);
		});
		return fmtHist;
	};

	app.processHistory = function(data) {
		var fmtHist = [];
		var recentHistory = [];
		var lastIdx = data.length - 1;
		var lastStatus = lastIdx >= 0 ? data[data.length - 1].status : '';
		$.each(data, function(idx, val) {
			// Store notes since last status.  Currently (13/1/29), these are returned from the server with a blank status.
			if (val.status == '') { recentHistory.unshift(val); }
			else { recentHistory = [val]; }

			val.date = cleanDate(val.datetime);
			switch (val.status.substr(0, 4).toLowerCase()) {
				case 'pass':
					val.statClass = 'hist-pass';
					break;
				case 'fail':
					val.statClass = 'hist-fail';
					break;
				default:
					val.statClass = '';
			}
			val.status = translateStatus(val.status);
			val.assigned_to = val.assigned_to || '&nbsp;';
			val.notesClass = val.notes ? 'hist-notes' : 'hist-no-notes';
			fmtHist.unshift(val);
		});
		return { formattedHistory: fmtHist, recentHistory: recentHistory };
	};

	var translateStatus = function(statIn) {
		var statOut = app.StatusList[statIn] && app.StatusList[statIn].text || statIn || 'Note Added';
		return statOut;
	};

	var cleanDate = function(datetime) {
		if (typeof datetime == 'string')
			return datetime;
		else
			return '';
	};

	var getReviewDate = function()
	{
		var d = new Date();
		var fmt = d.getFullYear() + '-' + (1+d.getMonth()) + '-' + d.getDate();
		return fmt;
	};

	var getStatusClass = function(status)
	{
		var className = '';
		if (status.substr(0, 4).toLowerCase() == 'fail') {
			className = 'fail';
		}
		else if (status.substr(0, 4).toLowerCase() == 'pass') {
			className = 'pass';
		}
		else {
			className = 'default-status';
		}
		return className;
	};

	//=======================================================
	// ReviewView should be usable for a variety of objects:
	// problems, whiteboards, cardviews, activities, &c.
	// Parameters to instantiate it with:
	//   elId:  element ID for reviewBlock DIV element
	//   key:  model.key (assigned to reviewObjectKey)
	//   lookup:  item lookup for REST interface
	//   type:  object type (problem, whiteboard, &c.)
	//   subtype:  optional.  subtype of problem type
	//   subtype_key:  optional.  solution step number for problem type
	//=======================================================
	app.ReviewView = app.PEView.extend({
		tagName: 'div',
		className: 'right reviewBlockContainer noChanges',

		//---------------------------------------
		//---------------------------------------
		events: {
			'click .reviewMenu ul > li': 'getReviewOption',
			'click .reviewPopup .review-save': 'saveStatusButton',
			'click .reviewPopup .review-cancel': 'cancelStatus',
			'click .closeStatus': 'cancelStatus',
			'click .recent-note .review-save': 'saveAppendedNoteButton',
			'click .recent-note .review-cancel': 'cancelAppendedNoteButton',
			'click ul.commonFailures li': 'copyFailureText',
			'mouseover .commonFailuresHeader': 'showFailuresMenu',
			'mouseout .commonFailuresHeader': 'hideFailuresMenu',
			'mouseover .assignHeader': 'showAssignMenu',
			'mouseout .assignHeader': 'hideAssignMenu',
			'keydown textarea': 'hideReviewMsg',
			'click .append-note': 'appendNote'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			this.reviewObjectType = this.options.type;

			this.elId = this.options.elId;
			this.reviewObjectKey = this.options.key;
			this.reviewObjectLookup = this.options.lookup;
			this.subtype = this.options.subtype || '';
			this.subtype_key = this.options.subtype_key || '';
			this.user = app.user;
			this.objectName = this.options.elId;

			this.model = new app.ReviewPaneModel();
			this.model.setStatusUrl(this.reviewObjectType, this.reviewObjectLookup);

			this.deferredHist = app.reviews.getHistory(this.reviewObjectType, this.reviewObjectLookup);

			this.deferred = this.model.fetch();
			// Field name from left side
			this.when = getReviewDate();
			// This is creating a fake model.  Use a real one!
			this.failed = false;
			this.passed = false;
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var that = this;
			that.deferredHist.done(function(hist) {
				var history = app.processHistory(hist);
				recentHistory = history.recentHistory;
				that.deferred.done(function(data) {
					if (data[0]) data = data[0];
					data.recentHistory = recentHistory;
					that.renderData(data);
				});
			});

			return that.el;
		},


		//---------------------------------------
		//---------------------------------------
		renderMenuOption: function(menuOption) {
			var opt = menuOption.opt;
			var label = menuOption.label;

			// userList
			if (!defined(app.userList.get('list')))
				app.userList.fetch({silent: false, error: app.notLoggedIn});
			var userList = app.userList && app.userList.get('list') || [];

			// The 'user' value is questionable.  It should probably be 'user_name'
			var user = this.model.get('user') || this.user;
			var when = this.model.get('when') || this.when;
			var notes = this.model.get('notes') || '';

			var data = {
				userList: userList,
				status: label,
				user: user,
				date: when,
				notes: notes
			};

			if (opt == 'fail') {
				data.commonFailures = commonFailures
			}

			if (opt == 'history') {
				var deferredHist = app.reviews.getHistory(this.reviewObjectType, this.reviewObjectLookup);
				var that = this;
				deferredHist.done(function(hist) {
					var history = app.processHistory(hist);
					data.hist = history.formattedHistory;
					var code = app.templates.reviewOptionPopup.history(data);
					$('.positioner', that.el).html(code);

				});
			}
			else {
if (opt == 'assign') {
	console.log('data for assign template: ', data);
}
				var code = app.templates.reviewOptionPopup[opt](data);

				// This shouldn't be addressing an HTML element directly.
				$('.positioner', this.el).html(code);
			}
			return this.el;
		},


		//---------------------------------------
		// renderAfterSave
		// data: response from server after save
		//---------------------------------------
		renderAfterSave: function(data) {
			var status = translateStatus(data.status || this.status);
			var statusClass = getStatusClass(this.status);
			this.when = getReviewDate();
			var user = data.user_name || this.model.get('user_name') || app.user;
			var recentHistory = data.recentHistory || [];
			var notes = data.notes || this.model.get('notes');
			var notesClass = notes ? 'notes' : 'no-notes';
			var statusDetailsClass = '';

			if (!status) {
				this.$el.html(app.templates.adminReviewEmpty({
					id:'rev' + this.model.get('id'),
					menu: app.reviewMenu
				}));
			} else {
				this.$el.html(app.templates.adminReview({
					id:'rev' + this.model.get('id'),
					status:status,
					statusClass:statusClass,
					statusDetailsClass:statusDetailsClass,
					when: this.when,
					user: user,
					objectName: this.objectName,
					recentHistory: recentHistory,
					notes: notes,
					notesClass: notesClass,
					menu: app.reviewMenu
				}));
			}
		},

		//---------------------------------------
		//---------------------------------------
		renderData: function(data) {
			var status = translateStatus(data.status);
			var statusClass = getStatusClass(status);
			this.when = cleanDate(data.datetime);
			var user = data.user_name;
			var notes = data.notes;
			notes = data.recentHistory;
			var recentHistory = data.recentHistory;
			var statusDetailsClass = !this.when ? 'no-status-details' : '';
			var notesClass = notes ? 'notes' : 'no-notes';

			if (!status) {
				that.$el.html(app.templates.adminReviewEmpty({
					id:this.elId,
					menu: app.reviewMenu
				}));
			} else {
				var code = app.templates.adminReview({
					id:this.elId,
					status:status,
					statusClass: statusClass,
					statusDetailsClass: statusDetailsClass,
					when: this.when,
					user: user,
					objectName: this.objectName,
					recentHistory: recentHistory,
					notes: notes,
					notesClass: notesClass,
					menu: app.reviewMenu
				});
				this.$el.append(code);
			}
			return this.el;
		},

		//---------------------------------------
		//---------------------------------------
		changed: function(hasChanged) {
			if (hasChanged)
				this.$el.removeClass('noChanges').addClass('changed');
			else
				this.$el.removeClass('changed').addClass('noChanges');
		},

		//---------------------------------------
		// Review Menu option clicked
		//---------------------------------------
		getReviewOption: function(e) {
			var ndx = $(e.currentTarget).index();
			var menuOpt = app.reviewMenu[ndx].opt;
			var menuLabel = app.reviewMenu[ndx].label;

			this.when = getReviewDate();
			this.status = menuLabel;
			this.statusREST = menuOpt; // menu option serves as the command for the REST call

			if (app.reviewMenu[ndx] && app.templates.reviewOptionPopup[app.reviewMenu[ndx].opt]) {
				this.renderMenuOption({ opt: menuOpt, label: menuLabel });
			}
			else {
				// Allow saving directly from dropdown menu; formerly used with the Pass option.
				this.saveStatus();
			}

		},

		saveStatusButton: function(e) {
			e.preventDefault();
			//var ndx = $(e.currentTarget).index();
			var notes = $('.reviewPopup textarea', this.$el).val();
			if (reviewNoteHasContent(notes) == false && this.status == 'Fail') {
				$('.errorMsg', this.$el).show();
			}
			else {
				this.saveStatus({ notes: notes });
			}
		},

		saveAppendedNoteButton: function(e) {
			e.preventDefault();
			var noteBlock = $(e.currentTarget).closest('.recent-note');
			var noteField = $('.note-to-append', noteBlock);
			var notes = $(noteField).val();
			var event_id = $('.event-id', noteBlock).val();
			this.status = app.reviewMenu[2].label; // Add Note
			this.statusREST = app.reviewMenu[2].opt; // menu option serves as the command for the REST call
			console.log('saveAppendedNoteButton ', notes);
			if (reviewNoteHasContent(notes) == false) {
				console.log('No note; nothing to save.');
			}
			else {
				this.saveStatus({ notes: notes, event_id: event_id });
			}
		},

		saveStatus: function() {
			var that = this;
			var data = arguments.length > 0 ? arguments[0] : {};
			var notes = data.notes || '';
			var event_id = data.event_id || null;

			this.model.set({
				key: this.reviewObjectKey,
				type: this.reviewObjectType,
				subtype: this.subtype,
				subtype_key: this.subtype_key,
				status: this.statusREST,
				notes: notes,
				event_id: event_id
			});

			this.model.setSaveUrl();
			this.model.save(null, {
				success: function(model, response, options) {
					that.changed(false);
					$('.reviewPopupWrapper', that.$el).hide();
					that.renderAfterSave(response);
				}
			});
		},

		cancelStatus: function(e) {
			e.preventDefault();
			$('.reviewPopupWrapper', this.$el).hide();
		},

		cancelAppendedNoteButton: function(e) {
			e.preventDefault();
			// clear field, hide block.
		},

		copyFailureText: function(e) {
			var ndx = $(e.currentTarget).index();
			var failureText = $(e.currentTarget).html();

			$('textarea', this.$el).val(failureText);
			$('ul.commonFailures').css('display','none');
		},

		showFailuresMenu: function(e) {
			$('ul.commonFailures').show();
		},

		hideFailuresMenu: function(e) {
			$('ul.commonFailures').hide();
		},

		showAssignMenu: function(e) {
			$('ul.user-list').show();
		},

		hideAssignMenu: function(e) {
			$('ul.user-list').hide();
		},

		hideReviewMsg: function(e) {
			$('.errorMsg', this.$el).hide();
		},

		appendNote: function(e) {
			console.log('append note');
			var menuOpt = app.reviewMenu[2].opt;
			var menuLabel = app.reviewMenu[2].label;
			this.when = getReviewDate();
			this.status = menuLabel;
			this.statusREST = menuOpt; // menu option serves as the command for the REST call
			this.renderMenuOption({ opt: menuOpt, label: menuLabel });
		}
	});

})();
