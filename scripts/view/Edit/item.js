//===========================================================================================
// An item consists of a field-specific widget and a review pane
//===========================================================================================
(function() {

	//=======================================================
	// Item View
	//=======================================================
	app.ItemView = app.PEView.extend({

		//---------------------------------------
		//---------------------------------------
		events: {
			'updated': 'notifyChange',
			'click .revertIcon' : 'revert'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			// Set our ID and class. Our element was created externally.
			this.$el.attr({id:this.id, "class":this.className});

			//-------------------------
			// Pre-render
			//-------------------------
			this.$el.append(app.templates.revertIcon());

			var type = this.options.type + 'View';
			this.instanceView = new app[type]({		// Type-specific
				parent: this.el,
				className: 'left',
				model:this.model,
				original: this.options.original,
				changed: this.changed,
				tabName: this.options.tab.name,
			});	
			//-------------------------

			this.notifyChange();		// Init to the proper changed status
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			this.instanceView.render(this.$el);

			return this.el;
		},

		//---------------------------------------
		//---------------------------------------
		notifyChange: function(ev) {
			this.changed(this.instanceView, app.isDirty([this.instanceView]));
		},

		//---------------------------------------
		//---------------------------------------
		setSubItemTop: function(ev, data) {
			if (app.ReviewTool) {
				this.reviews[data.idx+1].$el.css({top: data.yPos, position:'absolute'});
			}
		},

		//---------------------------------------
		// Construct a change list
		//---------------------------------------
		changeList: function() {

			// Only query top-level items, instead of recursing.
			// This doesn't work very well with steps.
			// Pros: Moving, deleting, and adding steps is too difficult to track at a low level
			// Cons: Changing step fields works better with greated detail.
			// Create a system that supports the strengths of both -- partially accomplished, but could be better
			if (app.isDirty([this.instanceView]))
				return this.instanceView.header || this.options.type;	// Not everything has a header
			else
				return null;
		},

		//---------------------------------------
		//---------------------------------------
		changed: function(view, hasChanged) {
			if (hasChanged)
			{
				if (!this.instanceView.ignoreChanges)	// Some views manage their own change monitoring
					view.$el.addClass('changed');

				this.$el.addClass('revert');
			}
			else
			{
				if (!this.instanceView.ignoreChanges)	// Some views manage their own change monitoring
					view.$el.removeClass('changed');

				this.$el.removeClass('revert');
			}
		},

		//---------------------------------------
		// Revert the field
		//---------------------------------------
		revert: function() {
			// Tell all rich edit controls to close
			$('.richEdit').trigger('globalSave');

			var orig = this.instanceView.getOriginal();
			this.instanceView.setData(orig);
			this.instanceView.render();
		},

		//---------------------------------------
		// Close routine.  Unbind model events.
		//---------------------------------------
		close: function() {
			this.instanceView.close && this.instanceView.close();

			this.instanceView.remove();
			this.instanceView = null;
		}

	});
})();
