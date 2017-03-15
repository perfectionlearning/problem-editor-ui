//===========================================================================================
// Context-switching Module.
//
// A context is primarily a view, but may also contain other items such as a history state.
//===========================================================================================
(function() {
	var contextList, parentContainer;
	var curContainer, curContext = {};

	//=======================================================
	//=======================================================
	framework.prototype.contextInit = function(ctxList, parent, startCtx)
	{
		contextList = ctxList;
		parentContainer = parent;

		// Use createContext instead of setContext.  setContext does cleanup for the old context, which doesn't exist at this point.
		startCtx && createContext(startCtx);
	}

	//=======================================================
	// Set a new context (view)
	//
	// This does a lot of cleanup related to the old context
	// before calling through to createContext
	//=======================================================
	framework.prototype.setContext = function(ctxName)
	{
		if (!fw.canChangeContext())
			// This "app" call is legal because it's a user-space callback.
			// Better form would be to register it with an additional call, but this isn't an architectural violation.
			app.verifyNav && app.verifyNav(ctxName, function() {doSetContext(ctxName)});
		else
			doSetContext(ctxName);
	}

	//=======================================================
	//=======================================================
	function doSetContext(ctxName)
	{
		// Call the Close function for the old context, if there is one
		curContext.close && curContext.close();

		// Delete the old container
		curContainer && curContainer.remove();

		// Reset the framework (wait, this now resets us too!)
		fw.reset();

		// Create the new context
		createContext(ctxName);
	}

	//=======================================================
	//=======================================================
	framework.prototype.getContext = function()
	{
		return curContext;
	}

	//=======================================================
	// Creates a new context
	//=======================================================
	function createContext(ctxName)
	{
		if (!defined(contextList[ctxName]))
			fw.error('Attempting to set a non-existent context: ' + ctxName);

		// Create a container for the new context
		curContainer = app.createContainer(parentContainer, 'Stage');	// External dependency.  Move inside?

		// Set the new context
		curContext = contextList[ctxName];

		// If there's any pre-initialization that needs to occur, do it.
		// Sometimes blocking events need to occur before a view's init function.
		// This most commonly occurs when waiting for AJAX events.
		if (defined(curContext.preInit))
			curContext.preInit(createView);
		else
			createView();
	}

	//=======================================================
	//=======================================================
	function createView()
	{
		// Initialize the view (tell the view to create itself)
		curContext.init(curContainer);

		// Call the Ready function if there is one
		curContext.ready && curContext.ready();
	}

	//=======================================================
	// Set a new context (view)
	//
	// This does a lot of cleanup related to the old context
	// before calling through to createContext
	//=======================================================
	framework.prototype.canChangeContext = function()
	{
		if (curContext.canLeave)
			return curContext.canLeave();

		return true;
	}



})();
