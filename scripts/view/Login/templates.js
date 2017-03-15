//===========================================================================================
// HTML templates used to render views
//===========================================================================================
(function() {
	app.templates || (app.templates = {});

	//=======================================================
	// Entire login widget.  Everything is hard-coded.
	//=======================================================
	app.templates.loginField = _.template(
		'<table class="loginForm ui-corner-all">' +
			'<tr>' +
				'<td class="header">Username:</td>' +
				'<td><input class="loginInp" type="text" id="name" /></td>' +
			'</tr>' +

			'<tr>' +
				'<td class="header">Password:</td>' +
				'<td><input class="loginInp" type="password" id="pw" /></td>' +
			'</tr>' +

			'<tr>' +
				'<td colspan="2"><div id="failMessage"></div></td>' +
			'</tr>' +

			'<tr>' +
				'<td colspan="2"><div align="right"><button id="loginBtn">Login</button></div></td>' +
			'</tr>' +
		'</table>'
	);

	//=======================================================
	// Bottom menu/info bar
	//=======================================================
	app.templates.loginBottom = _.template(
		'<div id="bottomBar" class="ui-corner-all" style="visibility:hidden">' +
		'</div>'
	);

})();
