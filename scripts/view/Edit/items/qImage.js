//=======================================================
// Question image
//=======================================================
;(function() {

	//=======================================================
	//=======================================================
	app.QImageView = app.PEView.extend({
		header: 'Question image',
		compare: app.simpleCompare,
		field: 'qImg',

		//---------------------------------------
		//---------------------------------------
		events: {
			'click .startEdit': app.editMode,
			'click .stopEdit': app.stopEditMode,
			'click .image': 'clearHighlight',
			'change': app.changed
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			this.original = this.last = this.options.original.get(this.field);
			this.isDirty = !this.compare(this.model.get(this.field), this.original);

			this.draggable = this.options.tabName === 'Images';	// @FIXME/dg: This is terrible!
			this.imageOverlayViews = [];

			_.bindAll(this, 'render', 'modelChanged', 'highlightMyOverlay');

			// Monitor changes to this field. We're responsible for that data.
			this.model.on('change:' + this.field, this.modelChanged);

			// Monitor changes that require a visual update. We're not responsible for that,
			// we just have to update the display.
			this.model.on('change:qImgText', this.render);
			this.model.on('resetVars', this.render);
			this.model.on('highlightMyOverlay', this.highlightMyOverlay);
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var data = this.model.get(this.field);

			this.$el.empty();

			if (this.options.edit)
			{
				this.$el.append(app.templates.textInput({header: this.header, value: data || ''}));
				this.moveCursorToEnd();
			}
			else
			{
				if (data)
				{
					this.$el.append(app.templates.image({
						header: this.header,
						value: data
					}));

					this.createOverlays();
				}
				else
					this.$el.append(app.templates.textItem({header: this.header, value: '<i>no image</i>'}));
			}

			return this.el;
		},

		//---------------------------------------
		// Slightly ugly code to move the cursor to the end
		//---------------------------------------
		moveCursorToEnd: function() {
			var el = this.$('textarea');
			var temp = el.val();
			el.val('');
			el.focus();
			el.val(temp);
		},

		//---------------------------------------
		//---------------------------------------
		createOverlays: function() {
			var that = this;

			// First, destroy any existing views
			this.destroyViews();

			// Create a container
			var container = this.$('.imageToOverlay');

			// Now create the appropriate views
			$.each(this.model.get('qImgText'), function(idx, item) {
				var vw = that.addView(idx, item, container);
				that.imageOverlayViews.push(vw);
				vw.render();
			});
		},

		//---------------------------------------
		//---------------------------------------
		destroyViews: function() {
			this.imageOverlayViews && $.each(this.imageOverlayViews, function(idx, view) {
				view.close && view.close();
				view.unbind();
				view.remove();
			});

			this.imageOverlayViews = [];
		},

		//---------------------------------------
		//---------------------------------------
		addView: function(idx, data, container) {
			return new app.QImageOverlayView({
				parent: container,
				idx: idx,
				item: data,
				makeDraggable: this.draggable,
				canHighlight: this.draggable,
				model: this.model,
				tabName: this.options.tabName });
		},

		//---------------------------------------
		//---------------------------------------
		clearHighlight: function() {
			$.each(this.imageOverlayViews, function(n, view) {
				view.highlightOff();
			});
		},

		//---------------------------------------
		//---------------------------------------
		highlightMyOverlay: function(idx) {
			$.each(this.imageOverlayViews, function(n, view) {
				if (n == idx)
					view.highlightOn();
				else
					view.highlightOff();
			});
		},

		//---------------------------------------
		// Fetch the value from the control
		//---------------------------------------
		value: function() {
			var val = this.$('textarea').val();

			if (!defined(val))
				val = '';

			return val;
		},

		//--------------------------
		// Close routine.  Unbind model events.
		//--------------------------
		close: function() {
			// Multiple instances of this view exist. Be sure to include more info than
			// just the event name or all will be removed instead of just one!
			this.model.off(null, this.modelChanged);
			this.model.off(null,  this.render);

			this.model.off('highlightMyOverlay', this.highlightMyOverlay);
		}

	});
})();
