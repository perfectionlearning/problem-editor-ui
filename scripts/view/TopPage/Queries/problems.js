//=======================================================
// View (and controllers)
//
// @FIXME/dg: This module has substantial similarities to objects.js
// It is effectively a subset.
// At the very least the code should be combined.
// It would also be possible to combine the UI, since much of it is redundant
// Ultimately, the user will be able to select problems in the object query, and this
// whole module will go away.  So it's probably not worth doing any of these changes.
//=======================================================
;(function() {
	app.ProblemQuery = app.PEView.extend({
		className: 'queryBox ui-corner-all',
		id: 'problemQuery',

		//---------------------------------------
		//---------------------------------------
		events: {
			'change #problemBook': 'setBook',
			'change #problemChapter': 'setChapter',
			'click #doProblemQuery': 'getProblemList'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			_.bindAll(this, 'render', 'setBook', 'setChapter', 'getProblemList', 'populateChapterList');
			app.bookList.on('reset', this.populateChapterList);

			// Later remember the current settings
			this.curBook = this.curChapter = 0;

			// Create the pulldown lists
			if (app.bookList.length > 0)
				this.populateChapterList('norender');
			else
				this.chapterList = ['(select a book)'];
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var that = this;
			this.$el.empty();

			var books = app.bookList.pluck('name');	// Sort this so that physics is first!

			that.$el.append(app.templates.textClass({cls:'queryHeader', text: 'Find Problems by Chapter'}));
			that.$el.append(app.templates.pulldown({id: 'problemBook', header: 'Book', entries: books, selection: this.curBook}));
			that.$el.append(app.templates.pulldown({id: 'problemChapter', header: 'Chapter', entries: this.chapterList, selection: this.curChapter}));
			that.$el.append(app.templates.button({id: 'doProblemQuery', text: 'Perform query'}));

			return this.el;
		},

		//---------------------------------------
		//---------------------------------------
		populateChapterList: function(action) {
			var chapters = app.bookList.at(this.curBook).get('chapters');
			var names = _.map(chapters, function(val) {
				return val.num + ': ' + val.name;
			});

			this.chapterList = names;

			if (!action || action !== "norender")
				this.render();
		},

		//---------------------------------------
		//---------------------------------------
		setBook: function(ev)
		{
			this.curBook = ev.currentTarget.selectedIndex;
			this.curChapter = 0;		// Always reset the chapter if the book changes
			this.populateChapterList();
		},

		//---------------------------------------
		//---------------------------------------
		setChapter: function(ev) {
			this.curChapter = ev.currentTarget.selectedIndex;
		},

		//---------------------------------------
		//---------------------------------------
		getProblemList: function(ev) {
			var chapter = [app.bookList.at(this.curBook).get('chapters')[this.curChapter].id];
//			app.quickCheckChapterID = chapter;
			app.queryType = 'Quick Check Problems';
			app.chapterProbList.set({id:chapter});
			app.changeContext('qcProblemSets');
		},

		//---------------------------------------
		//---------------------------------------
		close: function() {
			app.bookList.off('reset', this.populateChapterList);
		}
	});

})();