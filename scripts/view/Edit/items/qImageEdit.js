//=======================================================
// Question image and overlay edit
//=======================================================
;(function() {

	//=======================================================
	//=======================================================
	app.QImageEditView = app.PEView.extend({
		header: 'Image overlays',
		compare: app.objectCompare,
		field: 'qImgText',

		//---------------------------------------
		//---------------------------------------
		events: {
			'click button#overlay-add' : 'addField',
			'click button#overlay-refresh' : 'triggerReset'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			this.original = this.last = this.options.original && this.options.original.get(this.field);
			this.isDirty = !this.compare(this.model.get(this.field), this.original);

			// Listen for changes in variables and their values.
			_.bindAll(this, 'refreshCoordinates', 'updateModel', 'deleteEditRow', 'modelChanged');
			this.model.on('change:' + this.field, this.modelChanged);

			// This is a bit of a cop-out. But it will also speed things up, as well as fix a crash.
			if (!this.options.compact)
				this.model.on('evtRefreshCoordinates', this.refreshCoordinates);
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {

			this.$el.empty();

			if (!this.options.compact)	// Normal mode
				this.$el.append(app.templates.imageOverlayCtrls({header: this.header}));
			else if (this.model.get(this.field).length > 0)	// Compact mode, some overlays
				this.$el.append(app.templates.headerOnly({header: this.header}));
			else	// Compact mode, no overlays
				this.$el.append(app.templates.textItem({header: this.header, value: '<i>no overlays</i>'}));

			this.createRows();

			return this.el;
		},

		//---------------------------------------
		//---------------------------------------
		createRows: function() {
			var that = this;

			// First, destroy any existing views
			this.destroyViews();

			// Create a container
			var container = $(app.templates.imageOverlayContainer()).appendTo(this.$el);

			// Now create the appropriate views
			$.each(this.model.get(this.field), function(idx, item) {
				var vw = that.addView(idx, item, container);
				that.overlayInputRows.push(vw);
				vw.render();
			});
		},

		//---------------------------------------
		//---------------------------------------
		destroyViews: function() {
			this.overlayInputRows && $.each(this.overlayInputRows, function(idx, view) {
				view.close && view.close();
				view.unbind();
				view.remove();
			});

			this.overlayInputRows = [];
		},

		//---------------------------------------
		//---------------------------------------
		addView: function(idx, data, container) {

			return new app.QImageEditRowView({
				parent: container,
				model: this.model,
				idx: idx,
				data: data,
				deleteHandler: this.deleteEditRow,
				updateHandler: this.updateModel,
				compact: this.options.compact
			});
		},

		//---------------------------------------
		//---------------------------------------
		changed: function(data) {

			// Update model
			var setObj = {};
			setObj[this.field] = data;
			this.model.set(setObj);		// Setting silent:true prevents excess renders, but all synchronized updates break

			// Trigger change event
			this.isDirty = !this.compare(data, this.original);
			this.$el.trigger('updated');
		},

		//---------------------------------------
		//---------------------------------------
		updateModel: function(idx, data) {
			var that = this;

			// Extract a clone of the model data
			var model = $.extend(true, [], this.model.get(this.field));

			// Modify the data without changing the underlying model
			$.each(data, function(key, val) {
				model[idx][key] = data[key];
			});

			// Update the model
			this.changed(model);
		},

		//---------------------------------------
		// Reset button pressed:  choose new variable values,
		//   then broadcast resetVars event.
		//---------------------------------------
		triggerReset: function() {
			app.chooseVars();
			this.model.trigger('resetVars');	// External notification
		},

		//---------------------------------------
		//---------------------------------------
		refreshCoordinates: function(idx, x, y) {
			this.updateModel(idx, {x:x+'', y:y+''});
			this.overlayInputRows[idx].render();
		},

		//---------------------------------------
		//---------------------------------------
		addField: function(e) {
			var defaultItem = {y:"1", x:"1", text:'?', size:'12pt', color:'black'};

			var model = $.extend(true, [], this.model.get(this.field));
			model.push(defaultItem);
			this.changed(model);
		},

		//---------------------------------------
		//---------------------------------------
		deleteEditRow: function(idx) {

			// Delete the data
			var model = $.extend(true, [], this.model.get(this.field));
			model.splice(idx, 1);
			this.changed(model);
		},

		//---------------------------------------
		//---------------------------------------
		close: function() {
			this.model.off('evtRefreshCoordinates', this.refreshCoordinates);
			this.model.off(null, this.modelChanged);
			this.destroyViews();
		}
	})
})();
