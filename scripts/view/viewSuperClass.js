//=======================================================
// Override class for Backbone.View
//
// Inserts view elements into the DOM if they have the
// parent field set.
//
// Adds generic getData and setData functions.
//
// Includes a generic modelModified event handler.
//=======================================================
;(function() {

	//---------------------------------------
	// From Backbone.View
    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
	//---------------------------------------
    function ensureElement()
	{
		if (!this.el) {
			var attrs = _.extend({}, _.result(this, 'attributes'));
			if (this.id) attrs.id = _.result(this, 'id');
			if (this.className) attrs['class'] = _.result(this, 'className');
			var $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
			this.setElement($el, false);
		} else {
			this.setElement(_.result(this, 'el'), false);
		}
    }

	//---------------------------------------
	//---------------------------------------
	app.PEView = Backbone.View.extend({
		_ensureElement: function() {
			var hasEl = this.el;		// Save the state. The next call will change it.

			ensureElement.call(this);

			if (!hasEl && this.options.parent)
				$(this.options.parent).append(this.el);
		},

		//---------------------------------------
		// Extract composite data from all fields
		// in the model that this view controls.
		//---------------------------------------
		getOriginal: function() {
			return this.original;
		},

		//---------------------------------------
		// Extract composite data from all fields
		// in the model that this view controls.
		//---------------------------------------
		getData: function() {
			return this.model.get(this.field);
		},

		//---------------------------------------
		// Store data to the fields of the model
		// that this view controls.
		//---------------------------------------
		setData: function(data) {
			var setObj = {};
			setObj[this.field] = data;
			this.model.set(setObj);
		},

		//---------------------------------------
		// The model has changed (externally)
		// Notify the container that an update has occurred.
		// This starts a cascade with some redundancies, but it gets the job done.
		//---------------------------------------
		modelChanged: function() {
			// Display the new value
			this.render();

			// Update the isDirty flag (using the simplest comparison -- this is the part that needs
			// to be overridden in some cases.)
			this.isDirty = !this.compare(this.model.get(this.field), this.original);

			// This trigger/isDirty update cause all review panes to update
			this.$el.trigger('updated');
		},
	});

})();

/*
*/