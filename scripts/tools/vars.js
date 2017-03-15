//==========================================================================================
// VTP Interface
//
// Communicates with the node VTP module
//==========================================================================================
;(function() {

	var curVars;
	var curRules;

	//=======================================================
	//=======================================================
	app.chooseVars = function()
	{
	    var varDefs = app.curProblem.get('vars') || [];	// Save a copy of the variable definitions.  We need SF settings later.
		var constraints = app.curProblem.get('constraints');

		curVars = app.VTP.chooseVars(varDefs, constraints);
		return curVars;
	}

	//=======================================================
	//=======================================================
	app.getVars = function()
	{
		// Clone the internal variable list
		var varList = $.extend({}, curVars);

		// Delete internal keys
		delete varList.seedUsed;
		delete varList.sigDigs;

		return varList;
	}

	//=======================================================
	//=======================================================
	app.replaceVars = function(string)
	{
		return app.VTP.replaceVars(string, curVars, curRules);
	}

	//=======================================================
	// Returns an error message or NULL
	//=======================================================
	app.verifyVars = function(string)
	{
		return app.VTP.verifyVars(string, curVars, curRules);	// Error string, or null string
	}

	//=======================================================
	//=======================================================
	app.setDisplayRules = function(name)
	{
		curRules = name;
	}

})();
