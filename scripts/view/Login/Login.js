;(function() {

	//=======================================================
	var vw = app.Views.Login = {};

	var callback;

	//=======================================================
	//=======================================================
	vw.preInit = function(cb)
	{
		callback = cb;
		app.userState.fetch({success:statusSuccess, error:statusError});
	}

	//=======================================================
	// Already logged in
	//=======================================================
	function statusSuccess(model, response)
	{
		app.setUser(response);
//		callback();
		app.changeContext('top');
	}

	//=======================================================
	// Status returned a failure.  Proceed to the login page.
	//=======================================================
	function statusError()
	{
		callback();
	}

	//=======================================================
	// Initialize the page
	//=======================================================
	vw.init = function(container)
	{
		// Update history
		app.router.navigate('login');

		vw.view = new LoginView({el: container});	// Create the view
		vw.view.render();
	};

	//=======================================================
	// View (and controllers)
	//=======================================================
	var LoginView = app.PEView.extend({

		//---------------------------------------
		//---------------------------------------
		events: {
			'click #loginBtn': 'doLogin',
			'keydown #pw': function(ev) {if (ev.which === 13) this.doLogin()},
			'keydown #name': function(ev) {if (ev.which === 13) $('#pw').focus()}
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			var that = this;

			app.title.text = app.AppTitle;
			app.title.hasHome = false;
			app.title.hasLogout = false;
			app.title.update();
			app.footer.update();
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var that = this;
			this.$el.empty();

			// User name, password, button
			this.$el.append(app.templates.loginField());

			// Password recovery?

			// The bottom bar is worthless on this page, but its position is used to place the loading overlay
			// Making it invisible is an option (done!)
			this.$el.append(app.templates.loginBottom());

			$('#name').focus();
		},

		//---------------------------------------
		//---------------------------------------
		doLogin: function() {
			var that = this;
			this.$('#failMessage').html("");

			app.user = this.$('#name').val();
			var pw = this.$('#pw').val();

			if (app.user === '' || pw === '')
			{
				this.$('#failMessage').html("Empty username or password");
				return;
			}

			app.loading();

			// Create a temporary model and submit it
			var login = new (Backbone.Model.extend({urlRoot: app.commRoot + app.paths.login}));

			login.save({
				id: app.user,		// Do a PUT instead of a POST (id required for PUT)
				pw: pw
			}, {
				error: function(model, response) {that.loginFailed.call(that, model, response)},
				success: function(model, response) {that.loginSuccess.call(that, model, response)},
			});
		},

		//---------------------------------------
		//---------------------------------------
		loginFailed: function(model, response) {
			app.clearLoading();

			if (response.status === 0)
				var err = "Unable to connect to server";
			else
				var err = "Incorrect username or password";

			this.$('#failMessage').html(err);
		},

		//---------------------------------------
		//---------------------------------------
		loginSuccess: function(model) {
			app.clearLoading();
			app.userGroups = model.get('groups').toLowerCase().split(',');
			app.changeContext('top');
		}

	});

	//=======================================================
	// CLOSE function
	//=======================================================
	vw.close = function()
	{
		vw && vw.view && vw.view.unbind();
		vw && vw.view && vw.view.remove();
	}

})();
