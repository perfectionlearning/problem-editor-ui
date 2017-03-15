//===========================================================================================
//===========================================================================================
;(function() {
	//=======================================================
	// View (and controllers)
	//=======================================================
	app.ObjectQuery = app.PEView.extend({
		className: 'queryBox ui-corner-all',
		id: 'objectQuery',

		allString: 'ALL',

		//---------------------------------------
		//---------------------------------------
		events: {
			'change #queryBook': 'setBook',
			'change #queryType': 'setType',
			'change #queryStatus': 'setStatus',
			'change #queryChapter': 'setChapter',
			'change #queryAssign': 'setAssign',
			'click #doObjQuery': 'getObjectList'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			_.bindAll(this, 'render', 'setBook', 'setType', 'setStatus', 'setChapter', 'setAssign', 'getObjectList', 'populateUserList', 'populateChapterList');
			app.bookList.bind('reset', this.populateChapterList);
			app.userList.bind('change', this.populateUserList);

			this.typeList = _.values(app.ObjectTypes);
			this.typeList.unshift(this.allString);

			this.statusList = _.pluck(app.StatusList, 'text');
			this.statusList.unshift(this.allString);

			// Determine the initial settings for the pulldowns
			if (defined(app.queryParams))
			{
				// Find the correct book
				var book = app.bookList.find(function(val){return val.get('id') === app.queryParams.book[0]});
				this.curBook = app.bookList.indexOf(book);

				// Find the correct chapter.  There must be a better way!
				var chapterList = app.bookList.at(this.curBook).get('chapters');
				var chapter = _.find(chapterList, function(val){return val.id === app.queryParams.chapter[0]});
				this.curChapter = chapterList.indexOf(chapter) + 1;	// +1 is magic!  Not only does it compensate for 'all' being option 0, it also handles indexOf returning -1 on failure.  That becomes 0, our "all" option.

				// Find the type.  This is fairly straightforward
				this.curType = this.typeList.indexOf(app.ObjectTypes[app.queryParams.type[0]]);
				if (this.curType === -1)
					this.curType = 0;

				// Search for the status
				var stat = app.queryParams.status[0];
				if (stat)
					this.curStatus = this.statusList.indexOf(app.StatusList[stat].text);
				else	// (this.curStatus === -1)
					this.curStatus = 0;

				this.curUser = app.userList.get('list').indexOf(app.queryParams.assignTo[0]) + 1;
			}
			else
				this.curBook = this.curType = this.curStatus = this.curChapter = this.curUser = 0;

			// Create the pulldown lists
			if (app.bookList.length > 0)
				this.populateChapterList('norender');
			else
				this.chapterList = [this.allString];

			// Do the same for the user list
			if (defined(app.userList.get('list')))
				this.populateUserList('norender');
			else
				this.userList = [this.allString];

		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var that = this;
			that.$el.empty();

			var books = app.bookList.pluck('name');	// Sort this so that physics is first!

			that.$el.append(app.templates.textClass({cls:'queryHeader', text: 'Find Objects'}));
			that.$el.append(app.templates.pulldown({id: 'queryBook', header: 'Book', entries: books, selection: this.curBook}));
			that.$el.append(app.templates.pulldown({id: 'queryChapter', header: 'Chapter', entries: this.chapterList, selection: this.curChapter}));
			that.$el.append(app.templates.pulldown({id: 'queryType', header: 'Object type', entries: this.typeList, selection: this.curType}));
			that.$el.append(app.templates.pulldown({id: 'queryStatus', header: 'Review Status', entries: this.statusList, selection: this.curStatus}));
			that.$el.append(app.templates.pulldown({id: 'queryAssign', header: 'Assigned To', entries: this.userList, selection: this.curUser}));
			that.$el.append(app.templates.button({id: 'doObjQuery', text: 'Perform query'}));

			return that.el;
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
		populateChapterList: function(action) {
			var chapters = app.bookList.at(this.curBook).get('chapters');
			var names = _.map(chapters, function(val) {
				return val.num + ': ' + val.name;
			});

			names.unshift(this.allString);
			this.chapterList = names;

			if (!action || action !== "norender")
				this.render();
		},

		//---------------------------------------
		//---------------------------------------
		populateUserList: function(action) {
			this.userList = _.filter(app.userList.get('list'), function(){return true});	// Cheesy method of cloning the array
			this.userList.unshift(this.allString);

			if (!action || action !== "norender")
				this.render();
		},

		//---------------------------------------
		//---------------------------------------
		setType: function(ev) {
			this.curType = ev.currentTarget.selectedIndex;
		},

		//---------------------------------------
		//---------------------------------------
		setStatus: function(ev) {
			this.curStatus = ev.currentTarget.selectedIndex;
		},

		//---------------------------------------
		//---------------------------------------
		setChapter: function(ev) {
			this.curChapter = ev.currentTarget.selectedIndex;
		},

		//---------------------------------------
		//---------------------------------------
		setAssign: function(ev) {
			this.curUser = ev.currentTarget.selectedIndex;
		},

		//---------------------------------------
		//---------------------------------------
		getObjectList: function(ev) {
			var that = this;

			// Set query parameters for objectList.  This is
			var chapter = (this.curChapter === 0 ? [] : [app.bookList.at(this.curBook).get('chapters')[this.curChapter-1].id]);
			var status = (this.curStatus === 0 ? [] : [_.keys(app.StatusList)[this.curStatus-1]]);
			var type = (this.curType === 0 ? [] : [_.keys(app.ObjectTypes)[that.curType-1]]);
			var assignTo = (this.curUser === 0 ? [] : [this.userList[this.curUser]]);

			app.queryParams = {
				book: [app.bookList.at(this.curBook).get('id')],
				chapter: chapter,
				type: type,
				status: status,
				assignTo: assignTo
			};

			app.changeContext('objectList');
		},

		//---------------------------------------
		//---------------------------------------
		close: function() {
			app.bookList.unbind('reset', this.populateChapterList);
			app.userList.unbind('change', this.populateUserList);
		}
	});

})();
