//=======================================================
// Filtered List
//=======================================================
;(function() {
	app.TreeListView = app.PEView.extend({
		className: 'listContainer ui-corner-all',

		//---------------------------------------
		//---------------------------------------
		events: {
			'click .entry': 'choose',
			'click #listCancel': 'cancel'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {

			// Add a black backdrop
			$('<div class="modal">').appendTo('body');

			this.$el.html(app.templates.treeList({
				listClass: this.options.listClass,
				filterClass: this.options.filterClass,
				id: this.options.id,
				title: this.options.title,
				entries: this.options.data}));
			this.$el.appendTo('body');
		    this.$el.find("#"+this.options.id).treeview({
				persist: "location",
		        collapsed: true,
		        unique: true
		    });

			var outer = $('.listContainer');
			var inner = $('.listItems');

			var top = inner.offset().top;
			var bottom = outer.innerHeight() + outer.offset().top - $('#listCancel').outerHeight(true);
			inner.height(bottom - top);

			$('#wbList').listFilter('#entry_filter', {transition: 'slide'});
		},

		//---------------------------------------
		//---------------------------------------
		choose: function(ev) {
			var val = $(ev.currentTarget).text();
			var objNo = $(ev.currentTarget).data("objno");
			//$('.modal').remove();
			//this.remove();

			this.options.callback && this.options.callback(val, objNo);
		},

		//---------------------------------------
		//---------------------------------------
		cancel: function() {
			this.options.canceled && this.options.canceled();
		},

		//---------------------------------------
		// Close routine.  Unbind model events.
		//---------------------------------------
		close: function() {
		}

	});
})();
