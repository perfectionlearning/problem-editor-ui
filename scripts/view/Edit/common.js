//===========================================================================================
// Common routines used in edit items
//===========================================================================================
(function() {

	//=======================================================
	// Generic routine to toggle edit mode, used by all items
	//=======================================================
	app.editMode = function()
	{
		if (!this.options.edit)
		{
			this.options.edit = true;
			this.render();
		}
	}

	//=======================================================
	// Slightly less generic routine to toggle edit mode
	// Pulldowns should trigger a 'change'.  Going into edit
	// mode will change 'undefined' to whatever the default is.
	// Without changing the control, it won't properly update.
	//
	// Pulldown should be made a class/viewTemplate instead of
	// polluting this module!
	//=======================================================
	app.pulldownEditMode = function()
	{
		app.editMode.call(this);
		this.$el.trigger('change');
	}

	//=======================================================
	//=======================================================
	app.stopEditMode = function()
	{
		if (this.options.edit)
		{
			this.options.edit = false;
			this.render();
		}
	}

	//=======================================================
	// Generic routine to handle item changes
	//
	// Requests the value from a view, and updates the model accordingly.
	// That causes a re-render due to model change, which is inefficient but often necessary.
	//=======================================================
	app.changed = function()
	{
		var newVal = this.value();

		// Early out if nothing has changed
		// This wasn't working because this.last was being set incorrectly.
		// Fix this.last in all items if we want an early-out mechanism, which probably isn't worth the effort.
//		if (this.compare(newVal, this.last))
//			return;
//		this.last = newVal;

		// Update model
		var setObj = {};
		setObj[this.field] = newVal;
		this.model.set(setObj);		// Setting silent:true prevents excess renders, but all synchronized updates break
//		fw.debug('Update: ' + this.field + '=' + newVal);

		// Trigger change event
		this.isDirty = !this.compare(newVal, this.original);
		this.$el.trigger('updated');
	}

	//=======================================================
	//=======================================================
	app.isDirty = function(children)
	{
		for (var i = 0; i < children.length; i++)
		{
			// This can be a boolean value or a function
			var isD = children[i].isDirty;

			// If it's a function, use the result
			if (typeof(isD) === "function")
				isD = isD.call(children[i]);

			// Early out.  Any dirty status means we're dirty.
			if (isD) return true;
		}

		return false;
	}

	//=======================================================
	//=======================================================
	app.simpleCompare = function(a, b)
	{
		return a === b;
	}

	//=======================================================
	//=======================================================
	app.arrayCompare = function(a, b)
	{
		if (!isArray(a) || !isArray(b))
			return false;

		return Array.compare(a, b);
	}

	//=======================================================
	//=======================================================
	app.objectCompare = function(a, b)
	{
		return Object.equals(a, b);
	}

	//=======================================================
	// Compare two arrays of objects.
	// Each object is assumed to have its own id property.
	//=======================================================
	app.objectArrayCompare = function(a, b)
	{
		if (!a || !b)
			return false;

		var aObj = {};
		var bObj = {};
		$.each(a, function(n1, o) { if (o) aObj[o.id] = o; });
		$.each(b, function(n1, o) { if (o) bObj[o.id] = o; });
		return Object.equals(aObj, bObj);
	}

	//=======================================================
	// Common render routine for pulldowns
	//=======================================================
	app.pulldownRender = function()
	{
		var data = this.model.get(this.field);
		this.transform && (data = this.transform(data));

		this.$el.empty();

		if (this.options.edit)
		{
			var selection = Array.indexOfCI(this.list, data);

			if (data && selection === -1)
			{
				this.list.push(data);
				selection = this.list.length-1;
			}

			this.$el.append(app.templates.pulldown({header: this.header, selection: selection, entries: this.list}));
		}
		else
			this.$el.append(app.templates.textItem({header: this.header, value: data || '<i>undefined</i>'}));

		return this.el;
	}

	//=======================================================
	// Convert an element to MathJax if it's on the active tab (or just is visible?)
	//=======================================================
	app.jaxify = function($el, postProcess, context)
	{
		// Check if the current tab is active
		if ($el.is(":visible"))
		{
			// If so, queue up a typeset action
			MathJax.Hub.Queue(["Typeset", MathJax.Hub, $el[0]]);

			if (postProcess && context)
				MathJax.Hub.Queue([postProcess, context]);
		}
		else if (postProcess && context)
		{
			// The current tab is inactive. Save the custom postProcess routine for later.
			var tab = $el.parents('.ui-tabs-panel').attr('id');
			if (!app.savedPostProcess[tab])
				app.savedPostProcess[tab] = [];

			app.savedPostProcess[tab].push([postProcess, context]);
		}
	}


	//=======================================================
	// Catch REST Failure
	//=======================================================
	app.loadFailure = function(el, header, msg)
	{
		el.html(app.templates.msgWithHeader({ header: header, msg: msg }));
	}

})();
