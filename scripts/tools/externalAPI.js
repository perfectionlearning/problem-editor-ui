//===========================================================================================
// External API to allow for communications with external applications.
//
// Events:
//   changeContext, Params: contextName --- Context changed
//   problemCreated, Params: new problem ID --- New problem saved
//   problemSaved, Params: problem ID --- Existing problem saved
//   problemSaveFailed, Params: problem ID --- Problem failed to save (new or existing)
//   problemEdit, Params: problem ID | "new" --- Editing a problem
//===========================================================================================
;(function() {
	app.API = {};

	// Create a private dispatcher. Don't share with the framework event system.
	var dispatcher = _.clone(Backbone.Events);

//===========================================================================================
// Internal Routines: Only used within the problem editor
//===========================================================================================

	//=======================================================
	// Notify any Observers that care that an event has occurred
	//=======================================================
	app.API.notify = function(event, data)
	{
		dispatcher.trigger(event, data);
	}

//===========================================================================================
// External Routines: Only used by external applications
//===========================================================================================

	//=======================================================
	// Express interest in certain messages
	//=======================================================
	app.API.subscribe = function(event, callback)
	{
		dispatcher.on(event, callback);
	}

	//=======================================================
	// 'callback' shouldn't be necessary, but we need a method to selectively remove subscriptions
	// Ideally, each module that subscribes should be able to easily unsubscribe from just its events.
	// Perhaps this could return a unique ID and maintain an internal list.  That ID should be unique
	// to a module, not to a subscription, which means a module would have to pass that in every time
	// unless we can figure out a way to be clever that isn't too obscure.
	//=======================================================
	app.API.unsubscribe = function(event, callback)
	{
		dispatcher.off(event, callback);
	}

})();
