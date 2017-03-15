//===========================================================================================
// Global helper functions
//===========================================================================================

//=======================================================
//=======================================================
function defined(v)
{
	return (typeof(v) !== 'undefined');
}

//=======================================================
// Object.keys shiv/shim/polyfill/whatever
//=======================================================
if(!Object.keys)
{
	Object.keys = function(o) {
		if (o !== Object(o))
			throw new TypeError('Object.keys called on non-object');
		var ret=[],p;
		for(p in o) if(Object.prototype.hasOwnProperty.call(o,p)) ret.push(p);
		return ret;
	}
}

//=======================================================
// Array identity check
//=======================================================
function isArray(array) { return !!(array && array.constructor == Array); }

//=======================================================
// Array comparison
//=======================================================
if (!Array.compare)
Array.compare = function(a, b)
{
	if (a.length != b.length) return false;

	for (var i = 0; i < b.length; i++)
	{
		if (a[i] && a[i].compare)
		{
			if (!a[i].compare(b[i])) return false;
		}
		else
		{
			if (a[i] !== b[i])
				return false;
		}
	}
    return true;
}

//=======================================================
// Object comparison
//=======================================================
Object.equals = function( x, y )
{
	if ( x === y ) return true;
    // if both x and y are null or undefined and exactly the same

	if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) return false;
    // if they are not strictly equal, they both need to be Objects

	if ( x.constructor !== y.constructor ) return false;
    // they must have the exact same prototype chain, the closest we can do is
    // test their constructor.

	for ( var p in x )
	{
		if ( ! x.hasOwnProperty( p ) ) continue;
	      // other properties were tested using x.constructor === y.constructor

		if ( ! y.hasOwnProperty( p ) ) return false;
	      // allows to compare x[ p ] and y[ p ] when set to undefined

		if ( x[ p ] === y[ p ] ) continue;
		  // if they have the same strict value or identity then they are equal

		if ( typeof( x[ p ] ) !== "object" ) return false;
		  // Numbers, Strings, Functions, Booleans must be strictly equal

		if ( ! Object.equals( x[ p ],  y[ p ] ) ) return false;
		  // Objects and Arrays must be tested recursively
	}

	for ( p in y )
	{
		if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) return false;
		  // allows x[ p ] to be set to undefined
	}

	return true;
}

//=======================================================
// Case-insensitive indexOf function
//=======================================================
Array.indexOfCI = function(ary, value)
{
	if (defined(value))
	{
		for (var i = 0; i < ary.length; i++)
			if (ary[i].toLowerCase() == value.toLowerCase())
				return i;
	}

	return -1;
}

//=======================================================
// Return the key for a given value in an object
//=======================================================
Object.findKey = function(obj, value)
{
	var out;

	$.each(obj, function(key, val) {
		if (value === val)
		{
			out = key;
			return false;
		}
	});

	return out;		// Can be undefined
}

//===========================================================================================
// Game Framework
//
// @TODO/dg: Add a module init system where each module can register an init routine.
//	The init routine will need access to passed in data via an init object.
//===========================================================================================
var framework = function() {
	this.modules = {};
};

//=======================================================
//=======================================================
framework.prototype.registerModule = function(id, modObj)
{
	this.modules[id] = modObj;
}

//=======================================================
// Resets all modules
//=======================================================
framework.prototype.reset = function()
{
	$.each(this.modules, function(key, val) {
		if (defined(val.reset))
			val.reset();
	});
}

//=======================================================
// Calls all framework handlers
// @FIXME/dg: Do we need this in an event-driven architecture?
//=======================================================
framework.prototype.update = function(inc)
{
	return;

	if (!defined(inc))
		inc = 1;

	$.each(this.modules, function(key, val) {
		if (defined(val.handler))
			val.handler(inc);
	});
}

//=======================================================
// Log a debug message
//=======================================================
framework.prototype.debug = function(msg)
{
	console.info(msg);
}

//=======================================================
// Log a general information message
//=======================================================
framework.prototype.log = function(msg)
{
	console.info(msg);
}

//=======================================================
// Log a fatal error
//=======================================================
framework.prototype.error = function(msg)
{
	console.error(msg);
	throw(msg);
}

//=======================================================
// Log a non-fatal warning
//=======================================================
framework.prototype.warning = function(msg)
{
	console.warn(msg);
}

framework.prototype.tools = {};

//=======================================================
// Count the digits in a number
//=======================================================
framework.prototype.tools.countDigits = function(num)
{
	var digits = 0;

	if (num == 0)
		return 1;

	while (num > 0)
	{
		digits++;
		num = Math.floor(num / 10);
	}

	return digits;
}

var fw = new framework();	// Construct the framework object
