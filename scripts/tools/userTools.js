//===========================================================================================
// Application-Wide Helper Functions
//
// Break this into smaller modules!
//===========================================================================================
;(function() {

	var uniqueCtr = 0;

	//=======================================================
	// Change to a new view/context
	//=======================================================
	app.changeContext = function(ctx)
	{
		app.clearLoading();	// In case it exists.  A precaution against zombie loading screens.
		fw.setContext(ctx);

		app.API.notify('changeContext', ctx);
	}

	//=======================================================
	//=======================================================
	app.goHome = function()
	{
		app.changeContext('top');
	}

	//=======================================================
	// setIcon: UI helped to hide or show an icon (or option)
	//=======================================================
	app.setIcon = function(id, visible)
	{
		if (visible)
			$(id).show();
		else
			$(id).hide();
	}

	//=======================================================
	// Find all instances of a substring within a string.
	// The return value is an array of indices.
	//=======================================================
	function findAll(needle, haystack)
	{
		var out = [];
		var idx = -1;

		while (true)
		{
			idx = haystack.indexOf(needle, idx+1);

			if (idx === -1)
				break;

			out.push(idx);
		}

		return out;
	}

	//=======================================================
	//=======================================================
	app.uniqueVal = function()
	{
		console.log(uniqueCtr);
		return uniqueCtr++;
	}

//==========================================================================
// Data Mapping
//==========================================================================

	//=======================================================
	// convertEntities
	// The idea is to be a generic conversion for
	// characters like &#8217;, &#8722;, etc.
	//=======================================================
	app.convertEntities = function(str)
	{
		var newStr = str.replace(/&#8217;/g, '\u2019');
		return newStr;
	}

	//=======================================================
	// Convert a base string to a full URL
	//=======================================================
	app.getImageName = function(name)
	{
//		return app.serverPath + '../pmedia/' + name;	// + '.gif';
		return name;
	}

	//=======================================================
	// Convert an XHR response to an appropriate error message
	// Send the response directly, not the status (response.status)
	//=======================================================
	app.getError = function(response)
	{
		// Make sure there IS a response
		if (!defined(response) || response === null)
			return 'Unknown error';

		var errorStrings = {
			0: 'Unable to connect to the server.',
			412: "The requested data doesn't exist.",
			403: 'Please login first.',
			404: 'The server page is missing (404)',
			405: 'Method not allowed (405)',
			503: 'The server is unavailable (503)'
		};

		var err;

		// Choose a helpful error message if possible
		if (typeof(response) === 'string')
			err = response;
		else if (defined(errorStrings[response.status]))
			err = errorStrings[response.status];
		else
			err = response.status;

		return err;
	}

	//=======================================================
	// Convert from chapter ID to book and chapter index and name
	//=======================================================
	app.getBookAndChapter = function(chID)
	{
		// Step through books
		for (var bookIdx = 0; bookIdx < app.bookList.length; bookIdx++)
		{
			var book = app.bookList.at(bookIdx);

			// Step through chapters
			for (var chapIdx = 0, len = book.get('chapters').length; chapIdx < len; chapIdx++)
			{
				var chapter = book.get('chapters')[chapIdx];
				if (chapter.id === chID)
					return {
						bookIdx: bookIdx,
						chapterIdx: chapIdx,
						book: book.get('name'),
						chapter: chapter.num + ': ' + chapter.name
					};
			}
		}

		return null;
	}

	//=======================================================
	// Convert from book and chapter index to chapter ID
	//=======================================================
	app.ChapterID = function(bookIdx, chapterIdx)
	{
		if (bookIdx >= app.bookList.length)
			return null;

		var chapters = app.bookList.at(bookIdx).get('chapters');
		if (chapterIdx >= chapters.length)
			return null;

		return chapters[chapterIdx].id;
	}

	//=======================================================
	// Returns an array of nicely formatted chapter names
	//=======================================================
	app.chapterList = function(book)
	{
		var out = [];

		$.each(app.bookList.at(book).get('chapters'), function(idx, val) {
			out.push(val.num + ': ' + val.name);
		});

		return out;
	}

	//=======================================================
	// Convert a base string to a full URL
	//=======================================================
	app.removeSpaces = function(string)
	{
		return string.replace(/\s*/g, "");
	}

	//=======================================================
	// Remove any MathJaxed data from a string, converting it
	// back to pure MathML.
	//=======================================================
	app.removeMathJax = function(string)
	{
		// This could probably be converted to a single regex, but this might be safer
		var cleaned = string.replace(/<span class="MathJax_Preview">.*?<script[^>]*>/g, "");
		cleaned = cleaned.replace(/<\/script>/g, "");

		return cleaned;
	}

	//=======================================================
	// Parses a graph equation array of strings into an object
	//=======================================================
	app.graphEqObject = function(list)
	{
		var out = [];
		var that = this;

		// Step through all equations in the model, even though there should only be one for graph inputs
		$.each(list, function(idx, val) {
			var eqIdx = val.indexOf('=');		// Find the equal sign

			// Skip this entry if it is invalid
			if (eqIdx === -1)
				return true;

			var type = val.slice(0, eqIdx).toLowerCase();
			var params = val.slice(eqIdx+1);

			if (app.graphTypeMap[type])
				out.push({
					type: type,
					name: app.graphTypeMap[type].name,
					params: params.split(',')
				})
			else
				out.push({
					type: 'line',
					name: 'Line',
					params: [1,1]
				})
		});

		return out;
	}

	//=======================================================
	// Convert from an XML string to an object
	//=======================================================
	app.convertXmlToObj = function(xmlStr)
	{
		if (typeof(xmlStr) !== 'string')
			xmlStr = "";

		// Sample data: <rule value="True" id="equivalentPoly"/><rule value="False" id="reduced"/>
		var getRules = /<rule[^>]+>/g;
		var rules = xmlStr.match(getRules);

		var out = {};
		var getId = /id="([^"]*)"/;
		var getVal = /value="([^"]*)"/;
		rules && $.each(rules, function(idx, str) {
			var id = str.match(getId)[1];
			var val = str.match(getVal)[1];
			out[id] = {
				setting: (val.toLowerCase() === 'true'),
				order: idx		// Keep track of the order so we can put the data back in the same order to ease comparison
			}
		});

		return out;
	}

	//=======================================================
	// Convert from an XML string to an object
	// Messy second version. Combine this with the version above!
	//=======================================================
	app.convertXmlToObjSimple = function(xmlStr)
	{
		if (typeof(xmlStr) !== 'string')
			xmlStr = "";

		// Sample data: <rule value="True" id="equivalentPoly"/><rule value="False" id="reduced"/>
		var getRules = /<rule[^>]+>/g;
		var rules = xmlStr.match(getRules);

		var out = {};
		var getId = /id="([^"]*)"/;
		var getVal = /value="([^"]*)"/;
		rules && $.each(rules, function(idx, str) {
			var id = str.match(getId)[1];
			var val = str.match(getVal)[1];
			out[id] = (val.toLowerCase() === 'true');
		});

		return out;
	}

	//=======================================================
	//=======================================================
	app.splitEqAnswer = function(str)
	{
		str = str.trim();

		if (typeof(str) !== 'string')
			return {a: str};

		var open = findAll('<outside>', str);
		var close = findAll('</outside>', str);

		var errString = 'Prefix/Suffix error!';

		// Tag mismatch or too many tags
		if ((open.length !== close.length) || open.length > 2)
			return {a: errString};

		// No outside tags -- most common occurrence
		if (!open.length)
			return {a: str};

		var outOpen = "<outside>";
		var outClose = "</outside>";

		if (open[0] === 0)
		{
			var pre = str.substring(open[0] + outOpen.length, close[0]);
			open.shift();
			close.shift();
		}

		if (close.length && (close[0] === str.length - outClose.length))
		{
			var post = str.substring(open[0] + outOpen.length, str.length - outClose.length);
			open.shift();
			close.shift();
		}

		// Check for tags not at the start or end of the string
		if (open.length)
			return {a: errString};

		// Strip all outside tags
		var regex = /<outside>.*?<\/outside>/g;
		str = str.replace(regex, '');

		return {
			a: str.trim(),
			pre: pre,
			post: post
		};
	}

	//=======================================================
	//=======================================================
	app.cleanAnswers = function(str)
	{
		// First pass: Clean up free input related issues
		var cleaned = app.multiIn(str);

		// Second pass: Clean up equation related issues
		cleaned = eqClean(cleaned);

		return cleaned;
	}

	//=======================================================
	// @FIXME/dg: Ideally, this will replace spaces with nbsp
	// in the outside section.
	//=======================================================
	function eqClean(str)
	{
		// Combine neighboring tags
		var regex = /<\/outside><outside>/g;
		str = str.replace(regex, '');

		// Expand style to include whitespace.
		regex = /(\s+)(<outside>)/g;
		str = str.replace(regex, '$2$1');

		regex = /(<\/outside>)(\s+)/g;
		str = str.replace(regex, '$2$1');

		return str;
	}

//==========================================================================
// AJAX Requests
//==========================================================================

	//=======================================================
	//=======================================================
	app.commError = function(response)
	{
		app.clearLoading();

		var err = app.getError(response);
		alert('Failed to load problem: ' + err);

		if (response && (response.status === 403))
			app.changeContext('login');
		else
			app.changeContext('problemList');
	}

	//=======================================================
	//=======================================================
	app.fatalCommError = function(response)
	{
		app.clearLoading();

		var err = app.getError(response);
		alert('Failed to load: ' + err);

		app.changeContext('login');
	}

	//=======================================================
	//=======================================================
	app.notLoggedIn = function()
	{
		app.changeContext('login');
	}

	//=======================================================
	//=======================================================
	app.logout = function()
	{
		// Create a temporary model and submit it
		var logout = new (Backbone.Model.extend({urlRoot: app.commRoot + app.paths.logout}));
		logout.save({id:0}, {success:app.notLoggedIn, error:app.notLoggedIn});		// POST doesn't work. {id:0} forces a PUT.
		app.user = '';
	}

	//---------------------------------------
	// User status received.  Set the global user name.
	//---------------------------------------
	app.setUser = function(response)
	{
		app.user = response.name;

		// Converting field from 'permissions' to 'groups'. It's not ready yet, so support both.
		app.userGroups = (response.groups || response.permissions).toLowerCase().split(',');
		app.footer.update();
	}

//==========================================================================
// DOM Manipulation
//==========================================================================

	//=======================================================
	// Create a container to hold a view
	// This is necessary so we have something to delete when
	// removing a view.  Otherwise, events stay bound to old
	// views even if they are no longer referenced elsewhere.
	//=======================================================
	app.createContainer = function(parent, name, classType)
	{
//		if (!defined(classType))
//			classType = '';

		return $('<div>').attr({id:name, 'class':classType}).appendTo(parent);
	}

	//=======================================================
	//=======================================================
	app.loading = function()
	{
		// If the loading screen is already active, forget it.
		if ($('#loadAuto').length > 0)
			return;

		$('body').append(app.templates.loading());

		// Overly complex calculations to center the loading box
		var load = $('#loadAuto');

		var w = load.outerWidth();
		var ww = $('body').outerWidth();

		load.css({
			left: (ww - w) / 2,
			top: 150	//mid + tbb - h / 2
		});
	}

	//=======================================================
	//=======================================================
	app.clearLoading = function()
	{
		$('#loadAuto').remove();
		$('#dimmed').remove();
	}


//==========================================================================
// Interfaces
//==========================================================================

	//=======================================================
	// Choose the correct interface based on user group(s)
	//=======================================================
	function getInterface(groupList)
	{
		var tabIF = '';

		// Pick a tabbed interface based on priority order
		groupList && isArray(groupList) && $.each(app.interfaces.priorities, function(idx, val) {
			if (groupList.indexOf(val) !== -1)
			{
				tabIF = val;
				return false;	// break
			}
		});

		// None of the user's groups (if any) appear in the priority list.  Use a default.
		if (!tabIF)
			tabIF = app.interfaces.defaultIF;

		return app.interfaces.groups[tabIF];
	}

	//=======================================================
	// Select interface
	//=======================================================
	app.selectInterface = function(groupList)
	{
		var iface = getInterface(groupList);

		return iface.tabs;
	}

	//=======================================================
	// Check for an individual permission
	//=======================================================
	app.checkPermission = function(groupList, permission)
	{
		var iface = getInterface(groupList);

		return (iface.permissions.indexOf(permission) !== -1);
	}

//==========================================================================
// Navigation
//==========================================================================

	//=======================================================
	//=======================================================
	app.verifyNav = function(newCtx, okayFunc)
	{
		if (newCtx === 'save')
			return okayFunc();

		new app.Modal.View({
			title: 'Are you sure?',
			text: 'You have unsaved changes. Do you really want to abandon them?',
			ok: okayFunc,
			cancel: function(){},		// Don't do anything
//			centerWidth: 300
		});
	}

})();
