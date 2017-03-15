//===========================================================================================
// Simple event system using Publish/Subscribe -- Currently a minimal wrapper for backbone events
//
//===========================================================================================
(function() {
	fw.registerModule("events", {});

	var dispatcher = _.clone(Backbone.Events);

	//=======================================================
	// Express interest in certain messages
	//=======================================================
	framework.prototype.eventSubscribe = function(event, callback)
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
	framework.prototype.eventUnsubscribe = function(event, callback)
	{
		dispatcher.off(event, callback);
	}

	//=======================================================
	// A more advanced version would parse the events and break
	// it into pieces.  Events could be treated like classes, as in jQuery.
	// If an event is "focus:eq" this could trigger "focus", "eq", and "focus:eq"
	// The full event name would be passed along too, allowing the subscriber
	// to get more info.
	//
	// Note that we're currently using focus:eq and focus:input, which are meant
	// to be different.  Using the system described above would require renaming
	// some of our events.  However, that's not related to this framework.
	//=======================================================
	framework.prototype.eventPublish = function(event, data)
	{
		dispatcher.trigger(event, data);
	}


})();
