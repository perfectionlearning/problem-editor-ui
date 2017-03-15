//=======================================================
// Review pane functionality
//=======================================================
;(function() {

	var id = 0;

	var reviewMenu = [
		{ opt: 'fail', label: 'Fail', fn: 'optFail' },
		{ opt: 'pass', label: 'Pass', fn: 'optPass' },
		{ opt: 'unreviewed', label: 'Unreviewed', fn: 'optUnreviewed' },
		{ opt: 'note', label: 'Note', fn: 'optNote' },
		{ opt: 'history', label: 'History', fn: 'optHistory' }
	];

	var commonFailures = [
		'Ambiguous phrasing; reword, and clarify.',
		'Phrasing contains compositional errors.',
		'Assumes knowledge that would not yet have been covered.',
		'Process shown to get solution is incorrect.',
		'The information in this item is incorrect.'
	];

	var historyData = [
							{
								date: dateFormat(new Date(), 'm/d h:MMt'),
								who: app.user,
								status: reviewMenu[0].label
							},
							{
								date: dateFormat(new Date(), 'm/d h:MMt'),
								who: app.user,
								status: reviewMenu[2].label
							},
							{
								date: dateFormat(new Date(), 'm/d h:MMt'),
								who: app.user,
								status: reviewMenu[1].label
							},
							{
								date: dateFormat(new Date(), 'm/d h:MMt'),
								who: app.user,
								status: reviewMenu[4].label
							}

						];

	var reviewNoteHasContent = function(note)
	{
		if (note) {
			return true;
		}
		return false;
	};

	//=======================================================
	//=======================================================
	app.ReviewView = app.PEView.extend({
		tagName: 'div',
		className: 'right noChanges',

		//---------------------------------------
		//---------------------------------------
		events: {
			'click .pass': 'setPass',
			'click .fail': 'setFail',
			'click .reviewMenu ul > li': 'getReviewOption',
			'click .review-save': 'saveStatus',
			'click .review-cancel': 'cancelStatus',
			'click ul.commonFailures li': 'copyFailureText',
			'keydown textarea': 'hideReviewMsg'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function(data) {

			// Init based on review status
			this.id = id++;

			// Field name from left side
			this.field = data.field;

			// This is creating a fake model.  Use a real one!
			this.failed = false;
			this.passed = false;

			this.render = _.bind(this.render, this);
//			this.model.bind('change:' + this.field, this.render);
		},

		//---------------------------------------
		//---------------------------------------
		render: function(ndx) {
			if (arguments.length == 0) {
				this.renderForType();

				this.$el.html(app.templates.adminReview({
					id:'rev' + this.id,
					status:'Pass',
					when: '11/10/2012 1:30pm',
					field: this.field,
					who: app.user,
					menu: reviewMenu,


					statusClass:'pass',		// @FIXME/dg: Just work!
				}));
				return this.el;
			}
			else {
				var opt = reviewMenu[ndx].opt;
				var label = reviewMenu[ndx].label;
				if (app.templates.reviewOptionPopup[opt]) {
					var data = {
						status: label,
						field: this.field,
						user: app.user,
						date: dateFormat(new Date(), 'm/d h:MMt')
					}
					if (opt == 'fail') {
						data.commonFailures = commonFailures
					}
					if (opt == 'history') {
						data.hist = historyData;
					}
					var code = app.templates.reviewOptionPopup[opt](data);
					$('.reviewPopupPlaceholder', this.el).html(code);
				}
				return this.el;
			}
		},

		//---------------------------------------
		//---------------------------------------
		renderForType: function() {
			console.log('Render for type '+this.options.type);
			var type = this.options.type;
			if (type == 'ProblemTestView') {
				this.$el.html(app.templates.adminReview({
					id:'rev' + this.id,
					status:'Pass',
					when: '11/10/2012 1:30pm',
					field: 'Question',
					who: app.user,
					menu: reviewMenu,


					statusClass:'pass',		// @FIXME/dg: Just work!
				}));

			}
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
		// Pass was clicked.  Make sure fail isn't selected.
		//---------------------------------------
		setPass: function() {
			this.$('input.fail')[0].checked = false;
//			this.render();
		},

		//---------------------------------------
		// Fail was clicked.  Make sure pass isn't selected.
		//---------------------------------------
		setFail: function() {
			this.$('input.pass')[0].checked = false;
//			this.render();
		},

		//---------------------------------------
		// Review Menu option clicked
		//---------------------------------------
		getReviewOption: function(e) {
			var ndx = $(e.currentTarget).index();

			var data = {
				opt: reviewMenu[ndx].opt,
				user: app.user,
				field: this.field,
				when: new Date()
			};

			if (reviewMenu[ndx])
				this.render(ndx);

//			this.render();
		},

		saveStatus: function(e) {
			e.preventDefault();
			var ndx = $(e.currentTarget).index();
			var notes = $('.reviewPopup textarea', this.$el).val();
			if (reviewNoteHasContent(notes) == false) {
				$('.errorMsg', this.$el).show();
			}
			else {
				var data = {
					opt: reviewMenu[ndx].opt,
					user: app.user,
					field: this.field,
					when: new Date(),
					notes: notes
				}
				console.log(data); // This is what will get sent to the server.

				$('.reviewPopupWrapper', this.$el).hide();
			}
		},

		cancelStatus: function(e) {
			e.preventDefault();
			$('.reviewPopupWrapper', this.$el).hide();
		},

		copyFailureText: function(e) {
			var ndx = $(e.currentTarget).index();
			var failureText = $(e.currentTarget).html();
			console.log(failureText);
			$('textarea', this.$el).val(failureText);
//			$('ul.commonFailures', this.$el).css('display','none');
		},

		hideReviewMsg: function(e) {
			$('.errorMsg', this.$el).hide();
		}
	});
})();
