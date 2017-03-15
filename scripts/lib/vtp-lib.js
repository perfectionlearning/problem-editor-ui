require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
//==========================================================================================
// Variable Selection Module
//
// This needs to work both in node and inside browsers!
//
// Selects values for a set of variables.
//
// It has two basic modes:
//    1) A seed is sent in, which is used to populate all of the variables
//    2) An old seed is passed in.  New variables are generated which don't match the old ones.
//
// Exports:
//	chooseVars(vars, constraints, seed)
//==========================================================================================
if ((typeof window === 'undefined') || (typeof window._ === 'undefined'))
	var _ = require('underscore');
else
	_ = window._;

var rng = require('dg-mersenne-twister');
var mathTools = require('mathTools');

// The maximum number of attempts when trying to determine variables that meet the supplied constraints
var constMaxAttempts = 250;
var uniqueMaxAttempts = 20;

// Supported functions (in regex format)
// The first list is for built-in Javascript functions (Math.*).
// The second list is functions we've had to create ourselves.
var mathFuncs = /(pow|sqrt|abs|log|sin|cos|tan|asin|acos|atan|floor|round|ceil)\(/g;
var extraFuncs = /(sind|cosd|tand|asind|acosd|atand|fact)\(/g;

//===========================================================================================
// Variable selection
//===========================================================================================

//=======================================================
// Choose a random integer between two values
//=======================================================
function randomFromTo(from, to)
{
   return Math.floor(rng.random() * (to - from + 1) + from);
}

//=======================================================
// Pick the value for a single variable
//=======================================================
function pickVar(args)
{
	// If max is less than min, treat them as if they are just in the wrong order
	var min = args.min;
	var max = args.max;
	if (max < min)
	{
		var temp = min;
		min = max;
		max = temp;
	}

	// Make sure step is positive and non-zero
	var step = Math.abs(args.step) || 1;

	// Figure out the total number of possibilities
	var delta = max - min;
	var totalSteps = Math.floor(delta / step);	// Must be an integer number of steps.  If we can't get to the max value, don't worry about it

	// Choose a possibility
	var choice = randomFromTo(0, totalSteps);

	// Figure out the final result
	var res = min + (step * choice);

	// I didn't want to modify variables at this stage, but there is an issue with constraints.
	// If there is a constraint of "x = 3" and x is really 3.0000000000000001 then it will never be matched.
	return mathTools.fixJSMath(res);
}

//=======================================================
// Pick values for each variable
//=======================================================
function pickAllVars(vars)
{
	var allVars = {sigDigs:{}};

	for (var i = 0; i < vars.length; i++)
	{
		var args = {
			min: vars[i].min*1,
			max: vars[i].max*1,
			step: vars[i].step*1,
		};

		if (vars[i].label)
		{
			allVars[vars[i].label] = pickVar(args);

			// Store the significant digit count in with the variables.  This is messy, but it beats the alternatives.
			if (typeof (vars[i].sigDig) !== 'undefined')
				allVars.sigDigs[vars[i].label] = vars[i].sigDig;
		}
	}

	return allVars;
}

//=======================================================
// Convert variables to eval() code
//=======================================================
function varsToCode(obj)
{
	var out = "";

	obj && _.each(obj, function(val, key) {
		if (key && !isNaN(val))
			out += 'var ' + key + ' = ' + val + ';';
	});

	return out;
}
exports.varsToCode = varsToCode;	// I don't like exporting this!

//=======================================================
// Convert constraints to eval() code
//=======================================================
function constToCode(list)
{
	var out = "";

	// Replace '=' with '=='
	// Don't match !=, <=, >=
	var regex = /[^=<>!]=(?!=)/g;	// Since we don't have lookbacks we have to capture the previous character

	list && _.each(list, function(val, idx) {
		if (typeof(val) === 'string' && (val.length > 0))
		{
			var fixed = cleanMathString(val);
			var con = fixed.replace(regex, "$&=");	// matched character + equals + new equals
			out += 'if (!(' + con + ')) pass = false;';
		}
	});

	return out;
}

//=======================================================
// Perform the eval in a safe namespace
//=======================================================
function doEvalTests(code)
{
	var pass = true;	// Default to success

	try {
		eval(code);			// Perform the tests
	}
	catch(err) {
		pass = false;
	}

	return pass;
}

//=======================================================
// Choose all variables, ensuring that all constraints are met.
//=======================================================
function getVarSet(constCode, vars, seed)
{
	rng.init(seed);

	for (var loopIndex = 0; loopIndex < constMaxAttempts; loopIndex++)	// Use an obscure var since eval can clobber it
	{
		var varList = pickAllVars(vars);		// Determine possible values for all variables
		var js = varsToCode(varList);			// Convert to eval'able code
		if (doEvalTests(js + constCode))		// Check whether they satisfy the constraints
		{
			varList.seedUsed = seed;
			return varList;
		}
	}

	return {failed:true};
}

//=======================================================
// Determines whether two variable sets are identical
//
// There is the possibility that one or both sets are {failed:true}
//
// There are also issues with variables being functionally identical.
// Ultimately, without knowing how the variables are used, we can't
// determine whether two problems will be identical.
//=======================================================
function varMatch(x, y)
{
	for (var p in x)
	{
		if (p === "seedUsed" || p === "sigDigs")	// Exclude special keys
			continue;

		if (!x.hasOwnProperty(p))
			continue;

		// allows to compare x[p] and y[p] when set to undefined
		if (!y.hasOwnProperty(p))
			return false;

		// if they have the same strict value or identity then they are equal
		if (x[p] === y[p])
			continue;

		return false;
	}

	for ( p in y )
	{
		if ( y.hasOwnProperty(p) && !x.hasOwnProperty(p) )
			return false;
	}

	return true;
}

//=======================================================
// Choose a unique set of variables
//=======================================================
function generateUnique(vars, constCode, seeds)
{
	var oldVars = getVarSet(constCode, vars, seeds.avoid);
	var newVars;
	var seed = (seeds.use !== undefined) ? seeds.use : new Date().getTime();

	for (var i = 0; i < uniqueMaxAttempts; i++)
	{
		newVars = getVarSet(constCode, vars, seed);

		if (!varMatch(oldVars, newVars))
			return newVars;

		// Try a new seed if one wasn't explicitly defined
		if (seeds.use === undefined)
//			seed = new Date().getTime();
			seed++;		// Ensure a new value
		else
			break;		// There's no point trying again with the same seed!
	}

//	console.log("Can't generate unique values");
	return newVars;	// We can't choose unique values.  Just go with whatever
}

//=======================================================
// Choose all vars at once, to allow constraints to do their thing.
//
// If seeds.avoid is defined, ensure that the variables
// chosen are unique.
//=======================================================
function chooseVars(vars, constraints, seeds)
{
	if (seeds === undefined)
		seeds = {};

	// Generate the contraint code.  It will never change.
	var constCode = constToCode(constraints);

	// If an old seed was passed in, we need to generate unique variables
	if (seeds.avoid !== undefined)
		return generateUnique(vars, constCode, seeds);

	// No old seed -- don't worry about uniqueness
	var seed = (seeds.use !== undefined) ? seeds.use : new Date().getTime();
	return getVarSet(constCode, vars, seed);
}

exports.chooseVars = chooseVars;


//===========================================================================================
// Shared code -- make a separate module?
//===========================================================================================

//=======================================================
// Clean up a math string
//=======================================================
function cleanMathString(string)
{
	// Replace certain Unicode characters
	var out = string.replace('\u2212', '-');

	// Translate functions to JavaScript-usable versions
	out = translateFuncs(out);

	return out;
}
exports.cleanMathString = cleanMathString;

//=======================================================
// Replace PHP math functions with Javascript math functions
//=======================================================
function translateFuncs(str)
{
	// Function translation
	var replaced = str.replace(mathFuncs, "Math.$&");
	replaced = replaced.replace(extraFuncs, "mathTools.$&");

	// Special case for PHP function to JavaScript constant
	var pi = /pi\(\)/g;
	replaced = replaced.replace(pi, "Math.PI");

	return replaced;
}

},{"dg-mersenne-twister":"mersenne-twister","mathTools":"mathTools","underscore":1}],3:[function(require,module,exports){
//===========================================================================================
// MathML Processing Module
//
// This module contains the variable substitution subset of the mathMLProcessing module.
//===========================================================================================
if ((typeof window === 'undefined') || (typeof window._ === 'undefined'))
	var _ = require('underscore');
else
	_ = window._;

var xmlLib = require('xmlTools');

//===========================================================================================
// Variable handling
//===========================================================================================

//=======================================================
// A safe trim() function that only removes spaces, not
// special formatting items such as thin spaces or nbsp.
//
// This doesn't remove tabs or other whitespace that we
// may wish to remove.
//=======================================================
function safeTrim(text)
{
	trimLeft = /^ +/;
	trimRight = / +$/;

	return text.toString().replace(trimLeft, "").replace(trimRight, "");
}

//=======================================================
// Construct a list of indices of a supplied pair of characters
//=======================================================
function getPairs(open, close, string)
{
	var idx = 0;
	var len = string.length;
	var out = [];

	while (idx < len-1)
	{
		var i1 = string.indexOf(open, idx);		// Search for opening character
		var i2 = string.indexOf(close, idx+1);	// Search for closing character.  What will starting at -1 do?
		if (i1 === -1 || i2 === -1)		// We require a matched pair
			break;

		out.push([i1, i2+1]);
		idx = i2 + 1;
	}

	return out;
}

//=======================================================
// Locate variable blocks within a MathML string, and perform
// a callback operation on each
//=======================================================
function findVarsHtml(xml, func, params)
{
	// This makes the assumption that both brackets are inside a single bottom-level tag.  That means there can't
	// be any formatting between [ and ].
	// That might not always be the case, but properly cleaning up HTML where it's NOT the case would be a lot more difficult.
	var hasParens = xmlLib.findContaining(xml, '[');

	_.each(hasParens, function(val, idx) {
		if (!xmlLib.hasAncestor(val, 'math'))			// Raw HTML -- no <math> ancestors
		{
			// Construct a list of matched [] in the current text element.  There might not be any!
			var pairs = getPairs('[', ']', val.textContent);

			// Reverse order is required because splitting or string replacement is destructive and will modify the indices of everything following.
			// The alternative (if there's any downside to going backwards) would be to not pre-calculate all of the pairs.
			for (var i = pairs.length - 1; i >= 0; i--)
				func(val, pairs[i][0], pairs[i][1], params);
		}
	});
}

//=======================================================
// Locate variable blocks within a MathML string, and perform
// a processing operation on each.  func is the processing callback,
// but params is also a callback so naming is a bit tricky.
//=======================================================
function findVarsMML(xml, func, params)
{
	// Assume that cleanBrackets has already been called.
	// Brackets should be either in raw HTML, or inside <mtext>
	var hasParens = xmlLib.findContaining(xml, '[');
	_.each(hasParens, function(val, idx) {
		val = val.parentNode;	// We want the parent of the textnode, which should be an mtext or maction node

		// Check to see if we're inside an mtext
		// Also allow <maction> for variable replacement.  This seems risky!
		if (val.tagName === 'mtext' || val.tagName === 'maction')
		{
			// Find the closing bracket: cleanBrackets should have cleaned up MathML.  Raw HTML may be a problem.
			var text = safeTrim(xmlLib.text(val));
			var left = text.indexOf('[');
			var right = text.indexOf(']', left+1);	// Start from left.

			// There are 3 IF clauses following.  They could be combined into one!
			// Until we need otherwise, only deal with elements that contain both [ and ] -- cleanBrackets should ensure this in MathML
			if (left !== -1 && right !== -1)
			{
				// Add a class to the outer <mtext>.  This only works if there's a single variable block within the
				// <mtext> and the variable block is the entire <mtext>
				var err = null;
				if (left !== 0 || right !== (text.length-1))
				{
					err = "Brackets found in <mtext>, but they aren't taking up the entire <mtext> block";
					console.log(err);
				}

				func(val, params, err);
			}
		}
	});
}

//=======================================================
// Replace a variable block with the calculated value
//=======================================================
function replaceMML(el, callback)
{
	var calced = callback(safeTrim(el.textContent));

	xmlLib.setText(el, calced);			// $(el).text(calced);

	if (el.nodeName === "mtext")
		xmlLib.changeXmlNodeType(el, "mn");
}

//=======================================================
//
//=======================================================
function replaceHTML(el, start, end, callback)
{
	var txt = el.textContent;
	var calced = callback(txt.substring(start, end));

	// Without XMLDom we don't want the parentNode.  With it, we do need the parentNode.  Normalize!
	el.textContent = txt.slice(0, start) + calced + txt.slice(end);
//	el.parentNode.textContent = txt.slice(0, start) + calced + txt.slice(end);
}

//=======================================================
// Replace variable blocks with calculated values that
// are calculated via a callback
//=======================================================
function findAndReplaceVars(string, callback)
{
	var xml = xmlLib.stringToXML(string);
	if (xml === 'fail')
		return string;

	// Perform the actual replacement
	findVarsMML(xml, replaceMML, callback);
	findVarsHtml(xml, replaceHTML, callback);

	return xmlLib.XMLToString(xml);
}
exports.findAndReplaceVars = findAndReplaceVars;

//=======================================================
// Locates all variable blocks in a string
// Note that is searches for all MathML blocks, then all HTML blocks
// so they won't be in order!
//=======================================================
function findAllVarBlocks(string)
{
	var xml = xmlLib.stringToXML(string);
	if (xml === 'fail')
		return string;

	// Perform the actual replacement
	var blocks = [];

	findVarsMML(xml, function(el, params, err) {
		if (!err)
			blocks.push(el.textContent);
		else
			blocks.push({err: true, msg: err});
	});

	findVarsHtml(xml, function(el, start, end) {
		blocks.push(el.textContent.substring(start, end));
	});

	return blocks;
}
exports.findAllVarBlocks = findAllVarBlocks;
},{"underscore":1,"xmlTools":"xml"}],"ssREbq":[function(require,module,exports){
var varSelect = require('./varSelect');
var vtpEval = require('./vtpEval');

exports.chooseVars = varSelect.chooseVars;
exports.replaceVars = vtpEval.replaceVars;
exports.verifyVars = vtpEval.verifyVars;

//=======================================================
// Convert between the API format for rules and the module
// format for rules.
//
// The API defines rules as an object.
// We currently only use a single string.
//=======================================================
function parseRules(ruleObj)
{
	// Attempt to extract the VTP rules
	if (typeof ruleObj !== 'undefined')
	{
		if (ruleObj.math)
			return 'math';
		else if (ruleObj.physics)
			return 'physics';
	}

	// Nothing to return. Leave it undefined.
}

//=======================================================
// Parameters:
//   strings: string[] -- list of strings to evaluate
//   varList: object[] -- list of variables
//   constraints: string[] -- list of variable constraints (optional)
//   seed: int -- Existing random seed used to generate variable (optional)
//   rules: object -- VTP rules (optional)
//=======================================================
function evaluate(strings, varList, constraints, avoidSeed, useSeed, rules)
{
	// Perform some validation of the parameters
	if (typeof strings !== 'object' ||
		typeof strings.length === 'undefined' ||
		typeof varList !== 'object' ||
		typeof varList.length === 'undefined')
			return null;

	// Determine the rules
	var vtpRules = parseRules(rules);

	// Choose the variables
	var chosen = varSelect.chooseVars(varList, constraints, {use: useSeed, avoid: avoidSeed});

	// Evaluate each of the supplied strings
	var out = [];
	for (var i = 0; i < strings.length; i++)
	{
		var res = vtpEval.replaceVars(strings[i], chosen, vtpRules);
		out.push(res);
	}

	return {strings: out, seed: chosen.seedUsed};
}
exports.evaluate = evaluate;
},{"./varSelect":2,"./vtpEval":6}],"vtp":[function(require,module,exports){
module.exports=require('ssREbq');
},{}],6:[function(require,module,exports){
//===========================================================================================
// Variable Block Evaluation
//===========================================================================================
if ((typeof window === 'undefined') || (typeof window._ === 'undefined'))
	var _ = require('underscore');
else
	_ = window._;

var mathTools = require('mathTools');	// General math tools
var varSelect = require('./varSelect');		// Sibling module: A few shared routines are located in the variable selection module
var varSub = require('./varSub');			// MathML and HTML processing routines related to variable block location

// Display rules are controlled by problem-level settings.
// Initially the two rulesets are based on the source book
var ruleSets = {
	math: {
		sciNoteByMag: false,			// Determine whether to use scientific notation based on the magnitude of the number
		useVarsForNonSNSigFigs: false,	// For numbers not in scientific notation, use variables' significant figure setting to determine the number of sigfigs to display
		nonSNRoundMethod: 'DP',			// Method for rounding non-scientific notation numbers ('DP' = based on number of decimal places, 'SF' = based on the number of significant figures)
		nonSNRoundCount: 3				// Number of decimal places or significant figures to round at for numbers not in scientific notation (see nonSNRoundMethod setting)
	},

	physics: {
		sciNoteByMag: true,				// Determine whether to use scientific notation based on the magnitude of the number
		useVarsForNonSNSigFigs: true,	// For numbers not in scientific notation, use variables' significant figure setting to determine the number of sigfigs to display
		nonSNRoundMethod: 'SF',			// Method for rounding non-scientific notation numbers ('DP' = based on number of decimal places, 'SF' = based on the number of significant figures)
		nonSNRoundCount: 2				// Number of decimal places or significant figures to round at for numbers not in scientific notation (see nonSNRoundMethod setting)
	}
}

// Maximum significant figures for numbers in scientific notation (assuming no higher priority rules apply)
var snRules = {
	maxSigDigSN: 2,		// The number of significant digits to use when displaying a number in scientific notation, assuming no variables are present
	useSNAtOrAbove: 10000,	// Anything at or above this uses scientific notation, if sciNoteByMag is true
	useSNBelow: .001	// Anything below this uses scientific notation, if sciNoteByMag is true
}

// Convenience regular expressions.  Stored here as constants for speed.
var sciRegExp = /([0-9]\.)?[0-9]+[eE][+-][0-9]+/g;
var findFlags = /,[^)]*$/;		// Search for , that isn't followed by )

var curRules = 'physics';		// Use a default, but this really needs to be set for each problem
var curVars;

//=======================================================
// Returns the VTP block with any flags removed
//=======================================================
function stripFlags(block)
{
	var idx = block.search(findFlags);

	if (idx === -1)
		return block;

	return block.substring(0, idx);
}

//=======================================================
// Determines which variables are used in a variable block
//
// The block passed in is a single variable block.
//=======================================================
function getVarUsage(block)
{
	block = stripFlags(block);

	// Remove instances of 'e' or 'E' that are part of a scientific notation value before looking for variables.
	// Otherwise, it's possible to get a false setting:  if there is a variable e that uses scientific notation
	// and has a specified number of significant digits, the presence in a calculation of a literal scientific
	// notation value would trigger the settings for that variable 'e', whether or not the block actually used
	// e as a variable.
	block = block.replace(sciRegExp, '_');

	var used = [];
	_.each(curVars, function(val, key) {
		var isSci = false;
		var regExp = new RegExp("([^a-zA-Z]|^)" + key + "([^a-zA-Z]|$)");
		if (block.search(regExp) !== -1)
			used.push(key);
	});

	return used;
}

//=======================================================
// Parse a variable block: break it info the main formula
// and any extra flags.
//=======================================================
function getFlags(string)
{
	var idx = string.search(findFlags);
	if (idx === -1)
		idx = 10000;	// Use a stupidly large value as the split point, effectively making the left portion the entire string

	var opts = string.substring(idx+1).split(',');
	var flags = {};

	_.each(opts, function(val, idx) {
		val = val.trim();
		if (val)
		{
			var parts = val.split('=');
			if (parts.length === 2)
			{
				var flag = parts[0].trim().toUpperCase();
				var setting = parts[1].trim().toUpperCase();
				flags[flag] = setting;
			}
		}
	});

	return flags;
}

//=======================================================
// Determine whether a block should be displayed using
// scientific notation.
//=======================================================
function checkSciNote(value, flags)
{
	// Highest priority: SN flag.
	if (typeof flags.SN !== 'undefined')
		return (flags.SN === 'T' || flags.SN === 'TRUE' || flags.SN === 'Y')

	// Check the ruleset to determine how to proceed next
	if (ruleSets[curRules].sciNoteByMag)
		return (Math.abs(value) >= snRules.useSNAtOrAbove) ||
			   (Math.abs(value) < snRules.useSNBelow)

	// Finally, the default.  Don't use scientific notation.
	return false;
}

//=======================================================
// Check all variables used, and pick the lowest SF setting
//=======================================================
function getSigFigsFromVars(block)
{
	var SF = 99;		// A ludicrously high value that will be lowered by any variable

	var vars = getVarUsage(block);
	_.each(vars, function(val, idx) {	// Step through each used variable
//		var varDef = _.find(varDefs, function(test) { return test.label === val});
//		var cur = varDef && varDef.sigDig;	// Get its significant figure setting
		var cur = curVars.sigDigs[val];
		if (typeof cur !== 'undefined' && (cur !== '') && (cur !== null) && cur < SF)
			SF = cur;
	});

	if (SF !== 99)		// Make sure at least one variable had significant digits set
		return SF;

	// Return an error rather than a default value
	return -1;
}

//=======================================================
// Determine the number of significant figures to use when
// displaying in scientific notation.
//=======================================================
function getSNSigFigs(value, flags, block)
{
	// If a number was specified via a flag, it's highest priority.
	if (typeof flags.SF !== 'undefined')
		return flags.SF;

	// Next priority: Check all variables used, and pick the lowest SF setting
	var SF = getSigFigsFromVars(block);
	if (SF !== -1)
		return SF;

	// Lowest priority: Use a default value stored in the SN configuration object
	return snRules.maxSigDigSN;
}

//=======================================================
// Format numbers that aren't in scientific notation
//=======================================================
function formatStandard(value, flags, block)
{
	// If the DP flag (fixed number of decimal places) is specified, use it
	if (typeof flags.DP !== 'undefined')
		return mathTools.roundFixed(value, flags.DP);

	// If the SF flag (fixed number of significant figures) is specified, use it
	if (typeof flags.SF !== 'undefined')
		return mathTools.roundToSigFigs(value, flags.SF);

	// If the useVarsForNonSNSigFigs setting is active, use the used variable list to get the SF count
	if (ruleSets[curRules].useVarsForNonSNSigFigs)
	{
		var SF = getSigFigsFromVars(block);		// @FIXME/dg: value has been resolved.  There are no variables anymore!
		if (SF !== -1)
			return mathTools.roundToSigFigs(value, SF);
	}

	// Finally, use the nonSNRoundMethod and nonSNRoundCount settings as a default
	return useRoundingRules(value);
}

//=======================================================
//
//=======================================================
function useRoundingRules(value)
{
	if (ruleSets[curRules].nonSNRoundMethod === 'DP')
		return mathTools.round(value, ruleSets[curRules].nonSNRoundCount);	// @FIXME/dg
	else
		return mathTools.roundToSigFigs(value, ruleSets[curRules].nonSNRoundCount);
}

//=======================================================
// If scientific notation is to be used, format the number accordingly.
//=======================================================
function formatSciNote(value, flags, block)
{
	// Determine the number of significant figures to use
	var sigFigs = getSNSigFigs(value, flags, block);

	// Convert the value to a string in scientific notation, with the desired number
	// of significant figures
	var str = sciNoteString(value, sigFigs);

	// If the string ends in "e0", remove it.  It's redundant.
	// Note that any trailing zeroes created due to significant figures will be maintained
	str = removeE0(str);

	// Remove the plus from positive exponents (e.g., 3e+5 -> 3e5)
	return fixPositiveExponents(str);
}

//=======================================================
// Format num using scientific notation
//=======================================================
function sciNoteString(num, sigDig)
{
	if (sigDig < 1)
		sigDig = 1;

	// The argument to toExponential is not significant digits but digits after the decimal.
	return num.toExponential(sigDig - 1);
}

//=======================================================
// If a scientific notation string ends in "e0", remove it.
//=======================================================
function removeE0(str)
{
	str = str.replace('e+0', '');
	str = str.replace('e-0', '');

	return str;
}

//=======================================================
// Remove the plus from positive exponents (e.g., 3e+5 -> 3e5)
//=======================================================
function fixPositiveExponents(str)
{
	return str.replace('e+', 'e');
}

//=======================================================
// Determine the underlying value of a VTP block
//=======================================================
function performEval(eqString, varCode)
{
	// Evaluate the equation if possible
	try {
		eval(varCode + 'testResult = ' + eqString);
		return testResult;
	}
	catch(err) {
		return 0;
	}
}

//=======================================================
// Replace a single VTP block with actual values
//=======================================================
function varBlock(string, varCode)
{
	// Determine the underlying value
	var resolved = performEval(stripFlags(string), varCode);

	// Check for undefined variables.  Use something weird and easy to identify
	if (typeof resolved === 'undefined')
		resolved = 1337;	// We are so k-rad

	// Now figure out how to format it
	var flags = getFlags(string);

	// Step 1: Decide whether scientific notation will be used
	var useSciNote = checkSciNote(resolved, flags);

	if (useSciNote)
		return formatSciNote(resolved, flags, string);
	else
		return formatStandard(resolved, flags, string);
}

//=======================================================
// Replace a single VTP block with actual values
//=======================================================
function testVar(string, varCode)
{
	try {
		eval(varCode + 'testResult = ' + stripFlags(string));
		if (isNaN(testResult) || testResult === undefined)
			return false;
		return true;
	}
	catch(err) {
		return false;
	}
}

//=======================================================
// Replace all VTP blocks with actual values
//
// This would be an excellent task for a web worker
//=======================================================
function replaceVars(string, vars, rules)
{
	if (!string)
		return '';

	curVars = vars;
	if (ruleSets[rules])
		curRules = rules;

	i = x = y = undefined;	// Hack to cover up for bad coders.  WIRIS uses global namespace variables!
	var setVars = varSelect.varsToCode(curVars);

	// Extract variable blocks
	// We want to replace these in text.
	// Method 1: Extract blocks, evaluate blocks, find blocks again (!), replace content
	// Method 2: Find blocks, execute a callback (needs to know vars!), replace content
	// Neither is particularly elegant
	// Method 2 is more efficient, but requires overly tight coupling between this and the MathML module.
	// The MathML module uses an iterator/callback approach, so we'll use method 2.
	return varSub.findAndReplaceVars(string, function(string) {
		var cleaned = varSelect.cleanMathString(string);		// Translate functions from PHP to JavaScript
		var noBrackets = cleaned.substring(1, cleaned.length - 1);
		return varBlock(noBrackets, setVars);
	});
}
exports.replaceVars = replaceVars;

//=======================================================
// Similar to replaceVars, but only checks to see whether
// each variable can be resolved.
//=======================================================
function verifyVars(string, vars, rules)
{
	curVars = vars;
	if (ruleSets[rules])
		curRules = rules;

	i = x = y = undefined;	// Hack to cover up for bad coders.  WIRIS uses global namespace variables!
	var setVars = varSelect.varsToCode(curVars);
	var allVars = varSub.findAllVarBlocks(string);

	var errMsg = null;
	allVars && _.each(allVars, function(val, idx) {
		if (typeof val === 'object' && val.err)
		{
//			errMsg = val.msg;		// Overly descriptive error message
			errMsg = "Illegal MathML";
			return false;	// Break
		}

		var fixed = varSelect.cleanMathString(val);
		var noBrackets = fixed.substring(1, fixed.length - 1);
		if (testVar(noBrackets, setVars) === false)
		{
			errMsg = "Unable to resolve variables";
			return false;	// Break
		}
	});

	return errMsg;
}
exports.verifyVars = verifyVars;


//===========================================================================================
// TEST SUPPORT
//===========================================================================================
exports.testGetVarUsage = getVarUsage;

//=======================================================
//=======================================================
function testSetCurVars(vars)
{
	curVars = vars;

}
exports.testSetCurVars = testSetCurVars;

//=======================================================
// Test stub
//=======================================================
function testPerformEval(eq, vars)
{
	var varCode = varSelect.varsToCode(vars);
	return performEval(eq, varCode);
}
exports.testPerformEval = testPerformEval;
},{"./varSelect":2,"./varSub":3,"mathTools":"mathTools","underscore":1}]},{},[])