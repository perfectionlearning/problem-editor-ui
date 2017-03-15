//=======================================================
// Whiteboard (text input)
//=======================================================
;(function() {
	app.WhiteboardView = app.PEView.extend({
		header: 'Whiteboard',
		field: 'wb',
		compare: app.simpleCompare,

		//---------------------------------------
		//---------------------------------------
		events: {
			'click .startEdit': app.editMode
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			this.original = this.last = this.options.original.get(this.field);
			this.isDirty = !this.compare(this.model.get(this.field), this.original);
			this.current = this.original;

			this.modelChanged = _.bind(this.modelChanged, this);		// Use these two lines instead
			this.model.on('change:' + this.field, this.modelChanged);

			this.model.on('change:chID', this.changeChapter);	// This needs to be unbound manually if the view is ever destroyed!
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var data = this.model.get(this.field);
			var that = this;

			this.$el.empty();

			// Always display the value
			this.$el.append(app.templates.textItem({header: this.header, value: data || '<i>undefined</i>'}));

			// If we're in edit mode, add a modal box
			if (this.options.edit)
			{
				var wbs = app.wbList.get("list") || {};
				var entries = $.map(wbs, function(item) { return { item: item }; });
				var list = new app.FilterListView({
					data: entries,
					id: 'wbList',
					title: 'Whiteboard',
					listClass: 'wbSelect',
					filterClass: 'wbFilter',
					selection: data,
					showClear: true,
					callback: function(val) { that.selected.call(that, val) },
					canceled: function() { that.canceled.call(that) },
				});

				list.render();
			}

			return this.el;
		},

		//---------------------------------------
		//---------------------------------------
		selected: function(value) {
			this.current = value;

			//  Do stopEdit before changed, otherwise another render with edit mode active will occur.
			app.stopEditMode.call(this);
			app.changed.call(this);
		},

		//---------------------------------------
		//---------------------------------------
		canceled: function() {
			app.stopEditMode.call(this);
		},

		//---------------------------------------
		//---------------------------------------
		changeChapter: function() {
			app.getWhiteboardList();	// Do a background fetch of whiteboards
		},

		//---------------------------------------
		// Fetch the value from the control
		//---------------------------------------
		value: function() {
			return this.current;
		},

		//--------------------------
		// Close routine.  Unbind model events.
		//--------------------------
		close: function() {
			this.model.off(null, this.changeChapter);
			this.model.off(null, this.modelChanged);
			this.listView && this.listView.close();
		}

	});
})();
