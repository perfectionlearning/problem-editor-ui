//=======================================================
// Chapter ID
//=======================================================
;(function() {

	//=======================================================
	//=======================================================
	app.ChapterIDView = app.PEView.extend({
		header: 'Chapter ID',
		compare: app.simpleCompare,
		field: 'chID',

		//---------------------------------------
		//---------------------------------------
		events: {
			'click .startEdit': app.editMode,
			'click .stopEdit': app.stopEditMode,
			'change #book': 'bookChange',
			'change #chapter': 'chapterChange'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			this.original = this.last = this.options.original.get(this.field);
			this.isDirty = !this.compare(this.model.get(this.field), this.original);

			this.modelChanged = _.bind(this.modelChanged, this);
			this.model.on('change:' + this.field, this.modelChanged);
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var that = this;
			var bookList = app.bookList.pluck('name');	// List of all books and chapters
			var data = this.model.get(this.field);
			var bookData = app.getBookAndChapter(data) || {bookIdx: 0, chapterIdx: 0, book: '', chapter: ''};

			if (!data)
				bookList.unshift('Choose a book');

			this.$el.empty();

			if (this.options.edit)
			{
				var bookEl = $(app.templates.pulldown({header: 'Book', selection: bookData.bookIdx, entries: bookList}));
				this.$el.append(bookEl.attr('id','book'));

				var chapterList = data ? app.chapterList(bookData.bookIdx) : ["Choose a book first"];
				var chapterEl = $(app.templates.pulldown({header: 'Chapter', selection: bookData.chapterIdx, entries: chapterList}));
				this.$el.append(chapterEl.attr('id','chapter'));
			}
			else
			{
				this.$el.append(app.templates.textItem({header: 'Book', value: bookData.book || '<i>undefined</i>'}));
				this.$el.append(app.templates.textItem({header: 'Chapter', value: bookData.chapter || '<i>undefined</i>'}));
			}

			return this.el;
		},

		//---------------------------------------
		// Fetch the value from the control
		//---------------------------------------
		value: function() {
			// Get the book
			var book = $('#book select').prop('selectedIndex');

			// If we had a dummy entry, account for it
			if (!this.model.get(this.field))
				book--;

			// Get the chapter
			var chapter = $('#chapter select').prop('selectedIndex');

			// Convert from indices to chapter ID
			return app.ChapterID(book, chapter);
		},

		//---------------------------------------
		// Update the chapter list
		//---------------------------------------
		bookChange: function() {
			// Reset the chapter (it might be out of range)
			$('#chapter select').prop('selectedIndex', 0);

			app.changed.call(this);
			this.render();

			app.setRules();	// @FIXME/dg: TEMP! Change the display rules based on the book
		},

		//---------------------------------------
		// Update the chapter list
		//---------------------------------------
		chapterChange: function() {
			app.changed.call(this);
		},

		//--------------------------
		// Close routine.  Unbind model events.
		//--------------------------
		close: function() {
			this.model.off(null, this.modelChanged);
		}
	});

})();
