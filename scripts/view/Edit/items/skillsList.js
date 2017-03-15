//=======================================================
// Filtered List
//=======================================================
;(function() {
	app.SkillsListView = app.PEView.extend({
		className: 'secondaryListContainer positionAsPrimary ui-corner-all',

		//---------------------------------------
		//---------------------------------------
		events: {
			'click #listOK': 'choose',
			'click #listBack': 'back',
			'click #listCancel': 'cancel',
			'click .entry': 'toggleCheck'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			this.back = _.bind(this.back, this);
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			this.$el.html(app.templates.skillsList({
				listClass: this.options.listClass,
				filterClass: this.options.filterClass,
				id: "secondaryList",
				title: this.options.title,
				entries: this.options.data}));
			this.$el.appendTo('body');

			var outer = $('.listContainer');
			var inner = $('.listItems');

			if (inner.length > 0 && outer.length > 0) {
				var top = inner.offset().top;
				var bottom = outer.innerHeight() + outer.offset().top - $('#listCancel').outerHeight(true);
				inner.height(bottom - top);
			}

			$('#wbList').listFilter('#entry_filter', {transition: 'slide'});
		},

		//---------------------------------------
		// toggle a checkbox; use to control checkbox when
		// item row is clicked.
		//---------------------------------------
		toggleCheck: function(ev) {
			var el = $(ev.currentTarget).find("input[type=checkbox]");
			// ignore toggle if clicked on checkbox directly.
			if ($(ev.target).is("input") == false) {
				state = !el.prop("checked");
				el.prop("checked", state);
			}
		},
		
		//---------------------------------------
		//---------------------------------------
		choose: function(ev) {
			var checkboxes = $("#"+this.id).find("input[type=checkbox]");
			var data = [];
			$.each(checkboxes, function(key, obj) {
				var text = $(obj).parent().text();
				data.push({val: text, objNo: $(obj).val(), state: $(obj).prop("checked")});
			});
			this.options.callback && this.options.callback(data);
			this.remove();
		},

		//---------------------------------------
		//---------------------------------------
		back: function() {
			this.options.parentList.$el.show();
			this.remove();
		},

		//---------------------------------------
		//---------------------------------------
		cancel: function() {
			this.remove();
			this.options.canceled && this.options.canceled();
		},

		//---------------------------------------
		// Close routine.  Unbind model events.
		//---------------------------------------
		close: function() {
		}

	});
})();
