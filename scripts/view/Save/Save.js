;(function() {

	//=======================================================
	var vw = app.Views.Save = {};

	//=======================================================
	// Initialize the page
	//=======================================================
	vw.init = function(container)
	{
		vw.view = new SaveView({el: container, model:app.curProblem});	// Create the view
		vw.view.render();
	};

	//=======================================================
	// View (and controllers)
	//=======================================================
	var SaveView = app.PEView.extend({
		saveStatus: '',

		//---------------------------------------
		//---------------------------------------
		events: {
			'click #continue': 'editMode',
			'click #list': 'listMode',
			'click #saveBtn': 'saveContinue',
			'click #saveReviewBtn': 'saveReview'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			var that = this;
			this.views = [];

			// Create bars
			if (app.curProbID !== undefined)
				app.title.text = 'Problem #' + this.model.get('id');
			else
				app.title.text = 'New Problem';

			app.title.hasHome = true;
			app.title.hasLogout = true;
			app.title.update();
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var that = this;
			this.$el.empty();

			this.renderChanges();	// Changes
			this.validation();		// Validation text
			this.addButtons();		// Options

			// AJAX Status
			this.$el.append(app.templates.infoStatus({status:this.saveStatus}));
		},

		//---------------------------------------
		//---------------------------------------
		renderChanges: function() {
			if (app.changeList.length > 0)
			{
				// Changed fields -- use a model??  Tie into review system, which already has an object-based model
				this.$el.append(app.templates.table({
					id: 'changeList',
					tableClass: 'changeList',
					header: 'The following items have been changed',
					headClass: 'header',
					data: {
						headers: ['Changed items'],
						data: fw.singleColumn(app.changeList),
						columns: ['raw']
					}
				}));
			}
			else
			{
				this.$el.append(app.templates.message({text:'Nothing has been changed'}));
				this.$el.append(app.templates.padding({cls: 'noChangePad'}));
			}

			this.$el.append(app.templates.paddingBreak({cls: 'livePad'}));
		},

		//---------------------------------------
		//---------------------------------------
		validation: function() {
			// Validation
			var errors = app.validateProblem();

			this.errorCount = errors.length;

			if (errors.length > 0)
			{
				this.$el.append(app.templates.errorList({list: errors}));
				this.$el.append(app.templates.paddingBreak({cls: 'livePad'}));
			}
		},

		//---------------------------------------
		//---------------------------------------
		addButtons: function() {
			if (app.changeList.length > 0)
				var abandonText = 'Abandon changes';
			else
				var abandonText = 'Quit';

			// Save and continue button
			this.$el.append(app.templates.buttonClass({id: 'saveBtn', btnClass: 'validateButtons', text: 'Save'}));

			// Continue editing button
			// If there are errors, highlight this button
			btnClass = this.errorCount ? 'validateBold' : 'validateButtons';
			this.$el.append(app.templates.buttonClass({id: 'continue', btnClass: btnClass, text: 'Continue editing'}));

			// Problem list button
			this.$el.append(app.templates.buttonClass({id: 'list', btnClass: 'validateButtons', text: abandonText}));
		},

		//---------------------------------------
		// Save and continue editing
		//---------------------------------------
		saveContinue: function() {
			this.doSave(false);
		},

		//---------------------------------------
		// Save and go to the review page
		//---------------------------------------
		saveReview: function() {
			this.doSave(true);
		},

		//---------------------------------------
		//---------------------------------------
		doSave: function(doReview) {
			var that = this;

			// Prevent multiple saves
			$('#saveReviewBtn').attr('disabled', true);
			$('#saveBtn').attr('disabled', true);

			// Save the model
			var postSave = doReview ? that.saved : that.saveComplete;

			this.model.save({},{
				success: function(){postSave.apply(that, arguments)},
				error: function(){that.failed.apply(that, arguments)}
			});
		},

		//---------------------------------------
		// On success, link to the review system
		//---------------------------------------
		saved: function(model) {
			// If we just created a new problem, skip most of the steps below
			if (!app.curProbID && this.model.id)
			{
				app.curProbID = this.model.id;
				this.doRedirect();

				app.API.notify('problemCreated', app.curProbID);
				return;
			}

			app.API.notify('problemSaved', app.curProbID);

			// Unlock the problem
			app.lock.unlock(app.problemIdentifier, app.curProbID);

			// Temporary (needs to be smarter):
			// Change the problem status to "unreviewed"
			app.problemStatus.save({
				type: 'problem',
				subtype: '',
				key: app.curProbID,
				notes: '',
				status: 'unreviewed'
			}, {
				success: this.doRedirect,
				error: function() {alert('The problem was saved, but the status failed to update.');}
			});
		},

		//---------------------------------------
		//---------------------------------------
		failed: function(model, response) {
			app.API.notify('problemSaveFailed', app.curProbID);

			var err = app.getError(response);

			this.saveStatus = 'WARNING: Problem failed to save!  ' + err;
			this.render();
		},

		//---------------------------------------
		//---------------------------------------
		doRedirect: function() {
			// Temporarily redirect to a review page
			var redirect = app.reviewURL + app.curProbID + '&editing';
			window.location = redirect;
		},

		//---------------------------------------
		// Save was successful. Continue editing.
		//---------------------------------------
		saveComplete: function(model) {
			if (!app.curProbID && model.id)
				app.API.notify('problemCreated', model.id);
			else
				app.API.notify('problemSaved', app.curProbID);

			// Clear dirty flags -- mark the problem as clean
			app.saveOriginalProblem();

			// Continue editing
			this.editMode();
		},

		//---------------------------------------
		// Continue Editing button was pressed
		//---------------------------------------
		editMode: function() {
			app.continueEditing = true;

			// Check for new problem ID, set app.curProbID to display instead of "New Problem."
			if (!app.curProbID && this.model.id) {
				app.curProbID = this.model.id;
			}
			app.changeContext('edit');
		},

		//---------------------------------------
		// Problem List/Abandon Changes button was pressed
		//---------------------------------------
		listMode: function() {
			// Unlock the problem -- The problem list unlocks all owned problems, so this is redundant
//			app.lock.unlock(app.problemIdentifier, app.curProbID);

			app.changeContext('problemList');
		}

	});

	//=======================================================
	// Determine whether it's safe to navigate away.
	// If there is anything in the changelist, the
	// answer is no.
	//=======================================================
	vw.canLeave = function()
	{
		// Continue button was pressed. No need for confirmation.
		if (app.continueEditing)
			return true;

		return (app.changeList.length === 0);
	}

	//=======================================================
	// CLOSE function
	//=======================================================
	vw.close = function()
	{
		vw.view.unbind();
		vw.view.remove();
	}
})();
