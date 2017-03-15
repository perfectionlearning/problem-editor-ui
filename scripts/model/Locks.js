//=======================================================
// Object Lock Models
//
//=======================================================
(function() {

//==========================================================================
// Locking/Unlocking
//==========================================================================
	//=======================================================
	// Lock/Unlock Model
	//=======================================================
	var LockObject = Backbone.Model.extend({

		lock: function(type, id, options) {
			this.url = app.commRoot + app.paths.lock + '/' + type + '/' + id;
			return this.save({}, options);
		},

		// Unlock a single object
		unlock: function(type, id, options) {
			this.url = app.commRoot + app.paths.unlock + '/' + type + '/' + id;
			return this.save({}, options);
		},

		// Unlock all objects owned by a single user
		unlockByUser: function(user, options) {
			this.url = app.commRoot + app.paths.unlock + '/' + user;
			return this.save({}, options);
		}
	});

	//=======================================================
	// Instance of model
	//=======================================================
	app.lock = new LockObject({id:0});

//==========================================================================
// Lock State
//==========================================================================

	//=======================================================
	// We are using a PUT to fetch a collection, which is something
	// backbone doesn't handle.  Use a routine instead of the model.
	//=======================================================
	app.getLocks = function(user, type, id)
	{
		var model = new (Backbone.Model.extend({url: app.commRoot + app.paths.getLockState}));
		var xhr = model.save({
			id:0,
			user: user || undefined,
			type: type,
			objectID: id
		}, {
			success: parseLocks
		});

		return xhr;
	}

	//=======================================================
	// Parse the result of our PUT
	//=======================================================
	function parseLocks(model, result)
	{
		app.lockedObjects.reset(result);
	}

	//=======================================================
	// Lock State Model
	//=======================================================
	var LockState = Backbone.Model.extend({
	});

	//=======================================================
	// Collection
	//=======================================================
	app.LockList = Backbone.Collection.extend({
		model: LockState,

		comparator: function(model) {return model.get('objectID')}
	});

	//=======================================================
	// Instance of Collection
	//=======================================================
	app.lockedObjects = new app.LockList;

})();
