require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"NYCZgO":[function(require,module,exports){
//===========================================================================================
// General Math Utilities
//===========================================================================================

// The selection of 15 is sort of arbitrary.  10 is not enough to eliminate
// rounding errors (e.g., asin(sin(-315))), but 11 seems to be.  15 is a
// "round" number and seems safely distant from 11.
var trigRound = 15;
var ePattern = /e(.+)$/;

//=======================================================
//=======================================================
function sind(n)
{
	return round(Math.sin(deg2rad(n)), trigRound);
}
exports.sind = sind;

//=======================================================
//=======================================================
function cosd(n)
{
	return round(Math.cos(deg2rad(n)), trigRound);
}
exports.cosd = cosd;

//=======================================================
//=======================================================
function tand(n)
{
	return round(Math.tan(deg2rad(n)), trigRound);
}
exports.tand = tand;

//=======================================================
//=======================================================
function asind(n)
{
	return round(rad2deg(Math.asin(n)), trigRound);
}
exports.asind = asind;

//=======================================================
//=======================================================
function acosd(n)
{
	return round(rad2deg(Math.acos(n)), trigRound);
}
exports.acosd = acosd;

//=======================================================
//=======================================================
function atand(n)
{
	return round(rad2deg(Math.atan(n)), trigRound);
}
exports.atand = atand;

//=======================================================
//=======================================================
function fact(n)
{
	var f = 1;
	n = Math.round(n);

	while (n >= 1)
		f *= n--;

	return f;
}
exports.fact = fact;

//=======================================================
//=======================================================
function deg2rad(d)
{
	return d / 180 * Math.PI;
}

//=======================================================
//=======================================================
function rad2deg(r)
{
	return r / Math.PI * 180;
}

//=======================================================
// Floor function that operates on an arbitrary decimal position
// Arguments: number to round, number of decimal places
//=======================================================
function floor(rnum, rlength)
{
	return Math.floor(rnum * Math.pow(10, rlength)) / Math.pow(10, rlength);
}
exports.floor = floor;

//=======================================================
// Test for scientific notation
// Arguments: number to test
//=======================================================
function usesSciNote(n)
{
	return (n.toString().indexOf('e') !== -1)	// This is a bit slow.  Is there a quicker method?
}
exports.usesSciNote = usesSciNote;

//=======================================================
// Compensate for binary rounding issue.
// Arguments: number to check
//=======================================================
function fixJSMath(num)
{
	if (num === undefined) return num;

	// Get the magnitude of the number
	var mag = Math.floor(log10(Math.abs(num)));

	// If num is 0, magnitude returns -Infinity rather than 0
	if (Math.abs(mag) === Infinity)
		mag = 0;

	// Round off relative to the magnitude.  This will protect very small numbers.
	return round(num, 10-mag);
}
exports.fixJSMath = fixJSMath;

//=======================================================
// Round function that operates an an arbitrary decimal position
// Arguments: number to round, number of decimal places
//=======================================================
function round(rnum, rlength)
{
	return Math.round(rnum * Math.pow(10, rlength)) / Math.pow(10, rlength);
}
exports.round = round;

//=======================================================
// Round function that operates an an arbitrary decimal position
// Arguments: number to round, number of decimal places
//=======================================================
function roundFixed(rnum, rlength)
{
	// We could simply use toFixed both here and in round, but evidently it doesn't work consistently across browsers.
	return round(rnum, rlength).toFixed(rlength);
}
exports.roundFixed = roundFixed;

//=======================================================
// JS doesn't have a log10 function
//=======================================================
function log10(val)
{
	return Math.log(val) / Math.LN10;
}

//=======================================================
// Ensure a number isn't in scientific notation
//=======================================================
function decimalVal(num)
{
	num = +num;		// Convert to a number. This doesn't work on strings! (magnitude can be off by 1)

    var data = String(num).split(/[eE]/);
    if (data.length === 1)
		return data[0];

    var z = '';
	var sign = num < 0 ? '-' : '';
    var str = data[0].replace('.', '');
    var mag = Number(data[1])+ 1;

    if (mag < 0)
	{
        z = sign + '0.';
        while (mag++)
			z += '0';

        return z + str.replace(/^\-/,'');
    }

    mag -= str.length;
    while(mag--)
		z += '0';

    return str + z;
}
exports.decimalVal = decimalVal;

//=======================================================
// Round to an arbitrary number of significant figures
//=======================================================
function roundToSigFigs(num, sf)
{
	// Enforce a limit on significant figures. Node.js has a maximum of 21!
	if (sf < 1)
		sf = 1;
	if (sf > 21)
		sf = 21;

	var res = num.toPrecision(sf);	// This mostly works, but it may convert numbers to scientific notation

	if (res.indexOf('e') !== -1)
		return decimalVal(res);		// Convert out of scientific notation, return a string

	return res;
}
exports.roundToSigFigs = roundToSigFigs;

//=======================================================
// get significant digits for a number (base 10)
//=======================================================
function getSignificantDigits(inputNum)
{
    // conver num to a string:
    var num = Math.abs(inputNum) + "";

    if( isNaN( +num ) )
		throw new Error( "getSignificantDigits(): number (" + num + ") is not a number." );

	// We need to get rid of the leading zeros which make the numer become base 8.
	num = num.replace( /^0+/, '');

	// re is a RegExp to get the numbers from first non-zero to last non-zero:
	var re = /[^0](\d*[^0])?/;

    // if decimal, number of sig digits = num.length - 1
    // else = num.length
    var decimal =  /\./.test( num );
    var match = num.match( re ) || [''];

	var sigDigits = decimal? num.length - 1 : match[0].length;

    var sigPos = Math.floor(log10(num));
    if (num < 1 && decimal)
      sigDigits = sigDigits + sigPos + 1;

    return sigDigits;
}
exports.getSignificantDigits = getSignificantDigits;

//=======================================================
// Truncate to an arbitrary number of significant figures
//=======================================================
function truncateToSigFigs(num, sf)
{
	if (sf < 1)
		sf = 99;	// Try to make the error obvious

    var res = num.toPrecision(sf);
    if (Math.abs(res) > Math.abs(num) )
    {
        var expNote = num.toExponential();
        var matches = ePattern.exec(expNote);
        if (matches)
        {
            var power = parseInt(matches[1], 10);

            // find out the power of rounding number:
            var pow10 = Math.pow(10, power - sf + 1);
            var RoundOff = 0.5 * pow10;
            if (num < 0)
                RoundOff = -RoundOff;
/*
            if (sf <= power || getSignificantDigits(num) <= sf)
                RoundOff = 0;
*/
            var res = (num - RoundOff).toPrecision(sf);
        }
    }

    if (res.indexOf('e') !== -1)
        res = decimalVal(res);		// Convert out of scientific notation, return a string
	return res;
}
exports.truncateToSigFigs = truncateToSigFigs;

//=======================================================
// Truncate to an arbitrary decimal point digits
//=======================================================
function truncateToDecimals(num, dec)
{
	if (dec < 1)
		dec = 99;	// Try to make the error obvious

    var normalizedRoundOff = 0.5/Math.pow(10, dec);
    var res = parseFloat((num - normalizedRoundOff).toFixed(dec));

	return res;
}
exports.truncateToDecimals = truncateToDecimals;

},{}],"mathTools":[function(require,module,exports){
module.exports=require('NYCZgO');
},{}]},{},[])