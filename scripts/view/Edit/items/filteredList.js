//=======================================================
// Filtered List
//=======================================================
;(function() {
	app.FilterListView = app.PEView.extend({
		className: 'listContainer ui-corner-all',

		//---------------------------------------
		//---------------------------------------
		events: {
			'click .entry': 'choose',
			'click #listCancel': 'cancel',
			'click #listClear': 'clear'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			if (this.model)
				this.model.on("cancelFilterList", this.cancelPrimary, this);
			this.outerClass = "listContainer";
			this.innerClass = "listItems";
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {

			// Add a black backdrop
			$('<div class="modal">').appendTo('body');

			this.$el.html(app.templates.filteredList({
				listClass: this.options.listClass,
				filterClass: this.options.filterClass,
				id: this.options.id,
				listItemsClass: this.innerClass,
				title: this.options.title,
				showClear: this.options.showClear,
				entries: this.options.data}));
			this.$el.appendTo('body');

			var outer = $("."+this.outerClass);
			var inner = $("." + this.innerClass);

			var top = inner.offset().top;
			var bottom = outer.innerHeight() + outer.offset().top - $('#listCancel').outerHeight(true);
			inner.height(bottom - top);

			$('#wbList').listFilter('#entry_filter', {transition: 'slide'});
		},

		//---------------------------------------
		//---------------------------------------
		choose: function(ev) {
			var entry = $(ev.currentTarget);
			var val = entry.text();
			var key = entry.data("key");

			if (!this.options.keepOpen) {
				$('.modal').remove();
				this.remove();
			}
			this.options.callback && this.options.callback(val, key);
		},

		//---------------------------------------
		//---------------------------------------
		cancel: function() {
			$('.modal').remove();
			this.remove();

			this.options.canceled && this.options.canceled();
		},

		//---------------------------------------
		//---------------------------------------
		cancelPrimary: function() {
			this.remove();

			this.options.canceled && this.options.canceled();
		},

		//---------------------------------------
		//---------------------------------------
		clear: function() {
			$('.modal').remove();
			this.remove();

			this.options.callback && this.options.callback(undefined);
		},

		//---------------------------------------
		// Close routine.  Unbind model events.
		//---------------------------------------
		close: function() {
			if (this.model)
				this.model.off("cancelFilterList", this.cancelPrimary);
		}

	});
})();
