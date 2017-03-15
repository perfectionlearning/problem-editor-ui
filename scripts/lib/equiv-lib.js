require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//==========================================================================
// Analyze a tree to determine its type
//
// Add inequality?
// Check for other missing types
//
// This module knows about token values.  It often operates on the
// original answer string rather than the tokenized tree.  All of this is
// bad form!
//==========================================================================
var typeList    = require('./answerTypeList');	// General math tools
var eqTools     = require('./eqTools');	// General math tools
var tree        = require('./nodeTree/tree');	// node tree helper file
/*
	// Enumeration
	var i = 1;
	types = {
		BAD_TYPE: -1,
		NUMBER_ONLY: i++,
		NUMBER_LIST: i++,
		EXPRESSION: i++,			// Radical seems to encompass rationals, polynomials, AND radicals
		ONE_OPERATOR: i++,
		AND_OPERATOR: i++,
		OR_OPERATOR: i++,
		TWO_OPERATORS: i++,		// Not detected in this module! (see 1101 for detection)
		MULTIPLE_TERMS: i++,
		OPERATOR_ONLY: i++,		// Not detected in this module! (see 1101 for detection)
		NOSOLUTIONS: i++,
		INFINITE_SOLUTIONS: i++,
		COORDINATE: i++
	};
exports.types = types;
*/
// EQUATION		// 2081      --- subset of ONE_OPERATOR

	var noSolutionsString = "no solutions";
	var infiniteSolutionsString = "infinite solutions";

	//=======================================================
	//
	//=======================================================
	//Equiv.getAnswerType = function(answer, answerRoot)
	function getType(answer, answerRoot)
	{
		// Create our return object.  Assume it's an illegal type until we determine otherwise.
		var answerType = {type: typeList.types.BAD_TYPE};

		// Don't use !answer.  It could be 0!
		if (answer === undefined || answer === null)
			return answerType;

		// Check for No Solutions type
		if (noSolutions(answer, answerType))
			return answerType;

		// Check for Infinite Solutions type
		if (infiniteSolutions(answer, answerType))
			return answerType;

        answerType.compare = eqTools.areExpressionsEqual; // default handler, the following types can overide it
            
		// Check for coordinate pair/triple (x,y) or (x,y,z)
		if (coordinate(answer, answerType, answerRoot))
			return answerType;

		// Check for pure numbers
		if (pureNumber(answer, answerType, answerRoot))
			return answerType;

		// Check for a list of numbers, separated by & (must be 3+ entries)
		// Do this BEFORE check for '&', which is exactly the same but with only 2 entries evidently
		// Also note that number lists separated by commas occur below.  This is a mess!
		if (numberListAnd(answer, answerType))
			return answerType;

		//Check for an AND or OR answer
		if (andOr(answer, answerType))
			return answerType;

		// Check for a single operator equality
		if (equality(answer, answerType, answerRoot))
			return answerType;

		// Check for a list of numbers.  Part 2.
		// Differentiating between boolean AND, AND separated number lists, and comma separated number lists need to be fixed!
		if (numberListComma(answer, answerType, answerRoot))
			return answerType;

		// Expressions can be rationals, radicals, or polynomials.
		if (rational(answer, answerType, answerRoot))
			return answerType;

		if (radical(answer, answerType, answerRoot))
			return answerType;

		if (polynomial(answer, answerType, answerRoot))
			return answerType;

		// Anything that didn't get caught above and isn't a square root will be termed "multiple terms"
		// That includes nth roots, among others.
		// The "not a square root" check is probably to catch errors from the radical() test above, which is of course bad form.
		if (multipleTerms(answer, answerType, answerRoot))
			return answerType;

		// No matches.  Bummer.
		return answerType;
	}
exports.getType = getType;

	//=======================================================
	// Check for either No Solutions or Infinite Solutions
	//=======================================================
	function infNoSolutions(answer, answerType, string, type)
	{
		index = answer.indexOf(string);

		if (index >= 0)
		{
			// Extract the rest of the answer
			var tempString = answer.substring(0, index) + answer.substring(index + string.length);

			// If there is any non-whitespace data other than "no solutions", flag as illegal
			for (var i = 0; i < tempString.length; i++)
				if (tempString.charAt(i) !== " ")
					return true;

			answerType.type = type;
			return true;
		}

		// No match.  Continue processing.
		return false;
	}

	//=======================================================
	// Check for No Solutions type
	//=======================================================
	function noSolutions(answer, answerType)
	{
		return infNoSolutions(answer, answerType, noSolutionsString, typeList.types.NOSOLUTIONS);
	}

	//=======================================================
	// Check for Infinite Solutions type
	//=======================================================
	function infiniteSolutions(answer, answerType)
	{
		return infNoSolutions(answer, answerType, infiniteSolutionsString, typeList.types.INFINITE_SOLUTIONS);
	}

	//=======================================================
	// Check for coordinates (x,y) or (x,y,z)
	//
	// Backslash is a stand-in for comma.  Go figure.
	//=======================================================
	function coordinate(answer, answerType, answerRoot)
	{
		if (eqTools.isCoordinate(answerRoot))
		{
			// There must be only 2 or 3 values
			// This is bad for several reasons.  First, it requires knowledge of the tokenizer.
			// The tokenizer uses backslash as a comma substitute.  This module shouldn't know that.
			// Second, isCoordinate should contain this functionality.  Is it a coordinate, or isn't it?
			var split = answer.split("\\");
			if (split.length < 2 || split.length > 3)
			{
//r				answerType.type = typeList.types.BAD_TYPE;
				return true;
			}

			answerType.type = typeList.types.COORDINATE;

			// Determine whether there are 2 or 3 coordinates.  This is done properly, using the tokenized tree!
			if (answerRoot.rootNode.middleNode.leftNode instanceof tree.Comma
                && split.length == 3)
			{
				answerType.xCoord = tree.Root.createDuplicateTree(answerRoot.rootNode.middleNode.leftNode.leftNode);
				answerType.yCoord = tree.Root.createDuplicateTree(answerRoot.rootNode.middleNode.leftNode.rightNode);
				answerType.zCoord = tree.Root.createDuplicateTree(answerRoot.rootNode.middleNode.rightNode);

				// Bad method again.  This should use a tree call to detect decimals.
				answerType.zCoordDecimal = split[2].indexOf(".") >= 0;
			}
			else
			{
				answerType.xCoord = tree.Root.createDuplicateTree(answerRoot.rootNode.middleNode.leftNode);
				answerType.yCoord = tree.Root.createDuplicateTree(answerRoot.rootNode.middleNode.rightNode);
			}

			answerType.xCoordDecimal = split[0].indexOf(".") >= 0;
			answerType.yCoordDecimal = split[1].indexOf(".") >= 0;

            answerType.compare = eqTools.checkCoordinates;
			return true;
		}

		// No match.  Continue processing.
		return false;
	}

	//=======================================================
	// Check for a numerical value
	//=======================================================
	function pureNumber(answer, answerType, answerRoot)
	{
		if (answerRoot.rootNode instanceof tree.Numerical || answerRoot.rootNode instanceof tree.MixedNumber)
		{
			answerType.type = typeList.types.NUMBER_ONLY;
			return true;
		}

		// No match.  Continue processing.
		return false;
	}

	//=======================================================
	// Check for a list of numbers
	//=======================================================
	function numberListAnd(answer, answerType)
	{
		if (answer.indexOf("&") !== -1)
		{
			if (answer.split("&").length > 2)	// There must be 3 items?
			{
				//Then maybe this is a list of numbers
				answerType.answerNums = answer.split("&");
				answerType.answerNumsRoots = [];

				for (var i = 0; i < answerType.answerNums.length; i++)
					answerType.answerNumsRoots.push(tree.Root.createTree(answerType.answerNums[i]));

				answerType.type = typeList.types.NUMBER_LIST;
				return true;
			}
		}

		// No match.  Continue processing.
		return false;
	}

	//=======================================================
	// DG: This routine has some serious problems!
	// It doesn't even check to see if a comma exists!
	//=======================================================
	function numberListComma(answer, answerType, answerRoot)
	{
		// Evidently this a fall-through case.If the root node is null, it MUST be a number list or illegal garbage.
		if (answerRoot.rootNode !== null)
			return false;

		answerType.answerNums = answer.split(",");	// This is weird!  What if it's not a number list.  We're polluting answerType!
		answerType.answerNumsRoots = [];			// Ditto

		for (var i = 0; i < answerType.answerNums.length; i++)
		{
			answerType.answerNumsRoots.push(tree.Root.createTree(answerType.answerNums[i]));

			if (!(answerType.answerNumsRoots[i].rootNode instanceof tree.Numerical))
				return true;	// FAIL
		}

		answerType.type = typeList.types.NUMBER_LIST;
		return true;
	}

	//=======================================================
	// Check for an AND answer or an OR answer
	//=======================================================
	function andOrHelper(answer, answerType, op, type)
	{
		if (answer.indexOf(op) >= 0)
		{
			var index = answer.indexOf(op);
			var leftOp = answer.slice(0, index);
			var tempRoot = tree.Root.createTree(leftOp);

			var tempAnswerType = getType(leftOp, tempRoot).type;
			//trace("after left and/or");
			//trace(tempAnswerType);

			if (tempAnswerType === typeList.types.ONE_OPERATOR ||
				tempAnswerType === typeList.types.MULTIPLE_TERMS ||
				tempAnswerType === typeList.types.EXPRESSION ||
				tempRoot.rootNode instanceof tree.Numerical)
			{
				var rightOp = answer.slice(index + 1, answer.length);
				tempRoot = tree.Root.createTree(rightOp);

				tempAnswerType = getType(rightOp, tempRoot).type;
				//trace("after right and/or");
				//trace(tempAnswerType);

				if (tempAnswerType === typeList.types.ONE_OPERATOR ||
					tempAnswerType === typeList.types.MULTIPLE_TERMS ||
					tempAnswerType === typeList.types.EXPRESSION ||
					tempRoot.rootNode instanceof tree.Numerical)
				{
					answerType.type = type;
					return true;
				}
			}

//r			answerType.type = typeList.types.BAD_TYPE;
			return true;
		}

		// No match.  Continue processing.
		return false;
	}

	//=======================================================
	// Check for an AND answer or an OR answer
	// Do this after checking for a number list since they both
	// use the same separator (&)
	//=======================================================
	function andOr(answer, answerType)
	{
		if (andOrHelper(answer, answerType, '&', typeList.types.AND_OPERATOR))
        {
            answerType.compare = eqTools.checkAndOperators;
			answerType.type = typeList.types.AND_OPERATOR;
            answerType.stdType = true;
			return true;
        }

		if (andOrHelper(answer, answerType, '|', typeList.types.OR_OPERATOR))
        {
            answerType.compare = eqTools.checkOrOperators;
			answerType.type = typeList.types.OR_OPERATOR;
            answerType.stdType = true;
			return true;
        }
        
		return false;
	}

	//=======================================================
	// @FIXME/dg: This is too long. Break it into 2 pieces.
    // nf: this routine contains both equality and inequality check
	//=======================================================
	function equality(answer, answerType, answerRoot)
	{
		//trace("in getanswer type ineq, about to get all class equal");
		var nodes = answerRoot.findAllInstancesOfClass("Equality");
		//trace("after getting all equals");
		//trace(nodes.length);

		//----------------------------------
		// Check for a single operator
		if (nodes.length === 1)
		{
			if (answerRoot.rootNode instanceof tree.Equality)
			{
				//trace("root is equality/inequality");
				answerType.type = typeList.types.ONE_OPERATOR;
                answerType.compare = eqTools.checkOneOperator;
				return true;
			}

//r			answerType.type = typeList.types.BAD_TYPE;
			return true;
		}
		//----------------------------------
		// Check for multiple operators
		else if (nodes.length > 1)
		{
			var op1 = nodes.pop();

			// First check and see if all the operators are the same direction
			while (nodes.length > 0)
			{
				var op2 = nodes.pop();
				if (!op1.isSameDirection(op2))
					return true;	// BAD_TYPE
			}

			// Make sure all values being compared are Numerical
			if (!(answerRoot.rootNode.getLeftLeaf() instanceof tree.Numerical)
    			|| !(answerRoot.rootNode.getRightLeaf() instanceof tree.Numerical))
				return true;		// BAD_TYPE

			if ((answerRoot.rootNode.leftNode.isLeaf() && // NF combined the logic to avoid duplicate code:
                answerRoot.rootNode.rightNode.getLeftLeaf() instanceof tree.Variable)
                ||
                ((!answerRoot.rootNode.leftNode.isLeaf() &&
                  answerRoot.rootNode.leftNode.getRightLeaf() instanceof tree.Variable))
               )
			{
                answerType.type = typeList.types.TWO_OPERATORS;
                answerType.compare = eqTools.checkTwoOperators;
                return true;
			}

			return true;			// BAD_TYPE
		}

		// No match.  Continue processing.
		return false;
	}

	//=======================================================
	// Rational numbers get the EXPRESSION type
	//=======================================================
	function rational(answer, answerType, answerRoot)
	{
		if (answerRoot.isRational())
		{
			answerType.type = typeList.types.EXPRESSION;
			answerType.answerRational = answerRoot;
			answerType.answerPolynomial = null;
			return true;
		}

		return false;
	}

	//=======================================================
	//
	//=======================================================
	function radical(answer, answerType, answerRoot)
	{
		// It's not a radical unless it's a radical.  Go figure.
		if (!answerRoot.isRadical())
			return false;

		//trace("is radical in getanswertype "+answer);

		var radicals = answerRoot.findAllInstancesOfClass("SquareRoot");
		if (radicals.length === 1)
		{
			var polyRoot = new tree.Root();	// Create a tree from the middle node of the square root
			polyRoot.rootNode = radicals[0].middleNode.duplicateTree(polyRoot);

			var rationalRoot = answerRoot.duplicateTree();
			var newRadicals = rationalRoot.findAllInstancesOfClass("SquareRoot");	// This === radicals
			if (newRadicals[0].parentNode)
				newRadicals[0].parentNode.assignNodeNewChild(newRadicals[0] , null);	// Delete the square root node from the cloned answer (rationalRoot)

			rationalRoot.removeNulls();
			if (polyRoot.isPolynomial())
			{
				answerType.type = typeList.types.EXPRESSION;
				answerType.answerPolynomial = polyRoot;

				answerType.answerRational = rationalRoot.isRational() ? rationalRoot : null;
				return true;
			}
		}

		return false;
	}

	//=======================================================
	// Anything with a variable, even a root that got by the radical()
	// check.
	//=======================================================
	function polynomial(answer, answerType, answerRoot)
	{
		var varList = answerRoot.getAllVariables();
		if (varList.count() > 0)
		{
			answerType.type = typeList.types.EXPRESSION;
			return true;
		}

		return false;
	}

	//=======================================================
	// Default: Anything but roots that failed the radical() test
	// are MULTIPLE_TERMS
	//=======================================================
	function multipleTerms(answer, answerType, answerRoot)
	{
		if (!(answerRoot.rootNode instanceof tree.SquareRoot))
		{
			answerType.type = typeList.types.MULTIPLE_TERMS;
			return true;
		}

		return false;
	}

},{"./answerTypeList":2,"./eqTools":3,"./nodeTree/tree":47}],2:[function(require,module,exports){
//==========================================================================
// Analyze a tree to determine its type
//
// Add inequality?
// Check for other missing types
//
// This module knows about token values.  It often operates on the
// original answer string rather than the tokenized tree.  All of this is
// bad form!
//==========================================================================
	// Enumeration
	var i = 1;
	types = {
		BAD_TYPE: -1,
		NUMBER_ONLY: i++,
		NUMBER_LIST: i++,
		EXPRESSION: i++,			// Radical seems to encompass rationals, polynomials, AND radicals
		ONE_OPERATOR: i++,
		AND_OPERATOR: i++,
		OR_OPERATOR: i++,
		TWO_OPERATORS: i++,		// Not detected in this module! (see 1101 for detection)
		MULTIPLE_TERMS: i++,
		OPERATOR_ONLY: i++,		// Not detected in this module! (see 1101 for detection)
		NOSOLUTIONS: i++,
		INFINITE_SOLUTIONS: i++,
		COORDINATE: i++
	};
exports.types = types;

},{}],3:[function(require,module,exports){
//=======================================================
// tools for equation equiv
//=======================================================
var randomGenerator = require('./randomGenerator');
var tree            = require('./nodeTree/tree');	// node tree helper file
var _ = require('underscore'); 

eqTools = function() {};

	// This is set but never checked.
	// Individual chapters use this.  Add external access.  Or better yet, move it to the module where actual checks occur.
	var studentAnswerIsDecimal;

	var resultTypes = {
		BADANSWER: 1,
		GOODANSWER: 2,
		PARTIALLYCORRECTANSWER: 3,
		WRONGFORMAT: 3
	}

    //=======================================================
    // JS doesn't have a log10 function
    //=======================================================
    function log10(val)
    {
        return Math.log(val) / Math.LN10;
    }

	//=======================================================
	// Formats number to have specified digits of numbers after decimal point
	//=======================================================
	eqTools.formatDecimals = function(num, digits)
	{
        // If no decimal places needed, we're done
		if (digits <= 0)
            return Math.round(num).toString();

		// DG: If there was no decimal point in the original number, add the equivalent of a ".0" for further processing.
		var parts = num.toString().split(".");
		if (parts.length !== 2)
			parts[1] = "0";

		// Check if decimal is already fine
		var decString = parts[1];
		if (decString.length === digits)
			return num.toString();

		// Round the number to specified decimal places
        // e.g. 12.3456 to 3 digits (12.346) -> mult. by 1000, round, div. by 1000
        var tenToPower = Math.pow(10, digits);
        var cropped = String(Math.floor(num * tenToPower) / tenToPower); //round down

        // Add decimal point if missing
        if (cropped.indexOf(".") === -1)
			cropped += ".0";  //e.g. 5 -> 5.0 (at least one zero is needed)

		// Finally, force correct number of zeroes; add some if necessary
        // Compare digits in right half of string to digits wanted
        var halves = cropped.split("."); // Grab numbers to the right of the decimal
        var zerosNeeded = digits - halves[1].length; // Number of zeros to add

        for (var i = 0; i < zerosNeeded; i++)
			cropped += "0";

        return cropped;
	}

	//=======================================================
	// Object comparison
	//=======================================================
	eqTools.compareObjects = function( x, y )
	{
		// if both x and y are null or undefined and exactly the same
		if ( x === y ) return true;

		// if they are not strictly equal, they both need to be Objects
		if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) return false;

		// they must have the exact same prototype chain, the closest we can do is
		// test there constructor.
		if ( x.constructor !== y.constructor ) return false;

		for ( var p in x )
		{
			// other properties were tested using x.constructor === y.constructor
			if ( ! x.hasOwnProperty( p ) ) continue;

			// allows to compare x[ p ] and y[ p ] when set to undefined
			if ( ! y.hasOwnProperty( p ) ) return false;

			// if they have the same strict value or identity then they are equal
			if ( x[ p ] === y[ p ] ) continue;

			// Numbers, Strings, Functions, Booleans must be strictly equal
			if ( typeof( x[ p ] ) !== "object" ) return false;

			// Objects and Arrays must be tested recursively
			if ( !eqTools.compareObjects( x[ p ],  y[ p ] ) ) return false;
		}

		for ( p in y )
		{
			// allows x[ p ] to be set to undefined
			if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) return false;
		}

		return true;
	}

	//=======================================================
	// Determines whether a member of an object is valid
	// for processing. Invalid items are built-in handlers.
	//=======================================================
	function checkMember(key, elem)
	{
		if (key === "order")
			return false;

		if (typeof elem === "function")
			return false;

		if (elem instanceof Array)
			return false;

		return true;
	}

	//=======================================================
	//
	//=======================================================
	function combineFactors(obj)
	{
		var objRoots = [];

		// Step through object
		for (var i in obj)
		{
			if (!checkMember(i, obj[i]))
				continue;

			var s = eqTools.replaceAll(i, "#", "*");

			var tempRoot = tree.Root.createTree(s);

			var foundMatch = false;
			for (var k = 0; k < objRoots.length; k++)
			{
				if (eqTools.areExpressionsEqual(tempRoot, Root(objRoots[k][0])))
				{
					foundMatch = true;
					var matchIndex = objRoots[k][1];
					obj[matchIndex] = tree.Fraction.plus(   //Fraction(obj[matchIndex]), obj[i]);
                                new tree.Fraction(obj[matchIndex].numerator, obj[matchIndex].denominator), obj[i]);
					delete obj[i];
					break;
				}
			}

			if (!foundMatch)
			  objRoots.push(new Array(tempRoot, i));
		}
	}

	//=======================================================
	//=======================================================
	eqTools.combineRepeatingFactors = function(obj1, obj2)
	{
		combineFactors(obj1);
		combineFactors(obj2);
	}

	//=======================================================
	//=======================================================
	function getObjSize(obj, ignoreNegOne, countOnlyDifferent)
	{
		var objRoots = [];
		var size = 0;

		// Step through object
		for (var i in obj)
		{
			// DG: The original routine was checking ignoreNegOne and countOnlyDifferent against
			// the key (i) rather than the object itself (obj[i]). I'm fairly certain that's wrong,
			// but the 'countOnlyDifferent' option wasn't used anywhere, and 'ignoreNegOne' was
			// used only in chapter 1009. It's unlikely that a major failure would occur if this
			// wasn't working.
			var elem = obj[i];

			// Ignore built-in items
			if (!checkMember(i, obj[i]))
				continue;

			// Ignore negative one entries if specified
			if ((eqTools.cleanAnswerString(elem) === "-1" || eqTools.cleanAnswerString(elem) === "-") && ignoreNegOne)
				continue;

			if (countOnlyDifferent)
			{
				var s = eqTools.replaceAll(elem, "#", "*");
				var tempRoot = tree.Root.createTree(s);
				////trace("count only different in 1");
				////trace(tempRoot.getTreeAsString());
				var foundMatch = false;

				// Check against expressions we've already processed
				for (var k = 0; k < objRoots.length; k++)
				{
					if (eqTools.areExpressionsEqual(tempRoot, objRoots[k]))
					{
						foundMatch = true;
						break; // since only counting different members of the obj, no size increase for this
					}
				}

				if (!foundMatch)
				{
				  size++;
				  objRoots.push(tempRoot); // save the different member for future comparison
				}
			}
			else
				size++;
		}

//		console.log(obj, size);
		return size;
	}

	//=======================================================
	// This contained two large, identical loops. They were
	// encapsulated and moved outside.
	//=======================================================
	eqTools.compareObjectSize = function(obj1, obj2, ignoreNegOne, countOnlyDifferent)
	{
		if ((typeof obj1 !== "object") || (typeof obj2 !== "object") ||
			obj1 instanceof Array || obj2 instanceof Array)
			return false;

		ignoreNegOne == !!ignoreNegOne;
		countOnlyDifferent = !!countOnlyDifferent;

		var obj1Size = getObjSize(obj1, ignoreNegOne, countOnlyDifferent);
		var obj2Size = getObjSize(obj2, ignoreNegOne, countOnlyDifferent);

		////trace("finished comparing object size");
		////trace(obj1Size);
		////trace(obj2Size);

		return (obj1Size === obj2Size)
	}

	//=======================================================
	// Dump an object
	//=======================================================
		/*
	traceObject = function(obj)
	{
		////trace("start //trace object");
		for (var i in obj)
		{
			if (typeof obj[i] === "object")
			{
				////trace("////trace for object property named "+i);
				////traceObject(obj[i]);
			}
			else
				////trace(i + "is "+ obj[i]);
		}
	}
		*/

	//=======================================================
	// Replace all instances of a substring
	//
	// This is duplicated in mathML.js!
	//=======================================================
	eqTools.replaceAll = function(theString, pattern, replacement)
	{
		if (typeof theString !== 'string')
			theString = (theString.toString && theString.toString()) || "";

		return theString.split(pattern).join(replacement);
	}

	//=======================================================
	//=======================================================
	eqTools.cleanAnswerString = function(s)
	{
		if (typeof s !== 'string')
			s = (s.toString && s.toString()) || "";

		s = eqTools.replaceAll(s, " ", "");
		s = eqTools.replaceAll(s, String.fromCharCode(8722), "-"); // Unicode minus to normal minus
		s = eqTools.replaceAll(s, "-*", "-");
		s = eqTools.replaceAll(s, "+-", "-");
		s = eqTools.replaceAll(s, "--", "+");

		return s;
	}

	//=======================================================
	// Determines whether an equation tree is a coordinate pair/triple
	//=======================================================
	eqTools.isCoordinate = function(r)
	{
		if (r.rootNode instanceof tree.Parenthesis && r.rootNode.middleNode instanceof tree.Comma)
			return true;

		return false;
	}

	//=======================================================
	//=======================================================
	eqTools.compareFactorObjects = function(obj1, obj2)
	{
		var goodPolyFound = false;
		var s;

		if (obj1 === obj2) return true;

		for (var i in obj1)
		{
			//ignore certain members:
			if (!checkMember(i, obj1[i]))
				continue;

			if (typeof obj1[i] === "object")
			{
				//need to try to find an expression "i" that is equivalent in second object
				s = eqTools.replaceAll(i, "#", "*");
				var tempRoot1 = tree.Root.createTree(s);
				if (tempRoot1 !== null)
				{
					var nodes1 = tempRoot1.findAllInstancesOfClass("Variable");
					for (var j in obj2)
					{
						if (j === "order")
							continue; // ignor
						if (typeof obj2[j] === "object")
						{
							goodPolyFound = false;
							//found an expression
							s = eqTools.replaceAll(j, "#", "*");
							var tempRoot2 = tree.Root.createTree(s);
							////trace("found expression on second obj");
							if (tempRoot2 === null)
								break;

							var nodes2 = tempRoot2.findAllInstancesOfClass("Variable");
							if (nodes1.length > 0 && nodes2.length > 0)
							{
								////trace("both expression with vars");
								if (eqTools.comparePolynomials(tempRoot1, tempRoot2, true))
								{
									////trace("expressions the same");
									//we got same polys, do they have the same exponent?
									if (eqTools.compareFactorObjects(obj1[i], obj2[j]))
									{
										////trace("expressions have same exponent!");
										goodPolyFound = true;
										break;
									}
								}
								else
									continue;		////trace("expressions different");
							}
						}
					}
				}

				if (!goodPolyFound)
					if (!eqTools.compareFactorObjects(obj1[i], obj2[i]))
						return false;
			}
			else if (!obj2 || obj1[i] !== obj2[i])
				return false;
		}

		return true;
	}

	//=======================================================
	// Check to see if two polynomials are equivalent
	// by repeatedly evaluating them with different random numbers
	//
	// Note that this is substantially similar to eqTools.areExpressionsEqual
	// and probably several other routines.
	//=======================================================
	function polyStressTest(authorRoot, studentRoot, absCompare)
	{
		var authorVars = authorRoot.getAllVariables(true);
		var studentAnswerVars = studentRoot.getAllVariables(true);
//		var randomGenerator = new RandomGenerator(-100, 100, 1);

		// Check for equality by testing with 75 random numbers
		for (var i = 0; i < 75; i++)
		{
			// Clear all non-function members
			for (var prop in authorVars)
			{
				if (typeof authorVars[prop] !== "function")
					authorVars[prop] = null;
			}

			// Set all of a student's variables.
			// Set the author variables to match, if they are present.
			for (var prop in studentAnswerVars)
			{
				if (typeof studentAnswerVars[prop] === "function")
					continue;

				studentAnswerVars[prop] = randomGenerator.getRand();
				if (authorVars.hasOwnProperty(prop))
					authorVars[prop] = studentAnswerVars[prop];
			}

			// Set all of the author variables that didn't occur in the student variables
			// This should indicate non-equivalence, but it's possible that the variables cancels out, e.g. '+2x-2x' or '0(3x)'
			for (var prop in authorVars)
			{
				if (typeof authorVars[prop] === "function")
					continue;

				if (authorVars[prop] === null)
					authorVars[prop] = randomGenerator.getRand();
			}

			var answer1 = authorRoot.evaluateTreeWithVariables(authorVars);
			var answer2 = studentRoot.evaluateTreeWithVariables(studentAnswerVars);

			if (absCompare === true)
			{
				// Make both answers into abs values
				answer1 = answer1.getAbs();
				answer2 = answer2.getAbs();
			}

			if (!answer1.stringsEquivalent(answer2))
				return false;
		}

		return true;
	}

	//=======================================================
	// Check to see if two polynomials are identical
	//
	// This isn't used anywhere. Every chapter has its own
	// implementation of this.
	//=======================================================
	eqTools.comparePolynomials = function(authorRoot, studentRoot, absCompare)
	{
		// Both equations need to contain a variable for them to be polynomials
		if (authorRoot.findAllInstancesOfClass("Variable").length === 0 || studentRoot.findAllInstancesOfClass("Variable").length === 0)
			return false;

		// Polynomials can't contain equalities
		if (authorRoot.rootNode instanceof tree.Equality || studentRoot.rootNode instanceof tree.Equality)
			return false;

		if (!eqTools.canPlugVariables(authorRoot) || !eqTools.canPlugVariables(studentRoot))
			return false;

		// Check to see if two polynomials are equivalent
		// by repeatedly evaluating them with different random numbers
		if (polyStressTest(authorRoot, studentRoot, absCompare) === false)
			return false;
/*
		// Perform a few final tests to ensure that it's a correct answer

		// Check that all variables are combined
		if (!studentRoot.isFullyCombined())
			return false;

		// Check that it's simplified
		if (studentRoot.simplify())
			return false;
*/
		// Poly answer correct
		return true;
	}

	//=======================================================
	// Return a hash of variables that have to be positive.
	// The rule is that log() vars need to be positive, but
	// ln() vars don't. Why?!
	//=======================================================
	function getMustBePositiveVars(r)
	{
		var foundChild = r.findAllInstancesOfClass("SquareRoot");
		if (foundChild.length > 0)
			return true;

		foundChild = r.findAllInstancesOfClass("Logarithm");
		if (foundChild.length > 0)
			return true;
		
		foundChild = r.findAllInstancesOfClass("Power"); // for power < 1
		if (foundChild.length > 0)
			return true;

		return false;		
		
/* the following code only works for one immediate level parents, not good for multi level parents:		
		var allVars = r.findAllInstancesOfClass("Variable");
		var positiveVars = {};
		var tempVar;

		for (var i = 0; i < allVars.length; i++)
		{
			tempVar = allVars[i];		// Included a cast to type Variable
			if (((tempVar.parentNode instanceof tree.Logarithm) && !(tempVar.parentNode instanceof tree.NaturalLog))
                || tempVar.parentNode instanceof tree.SquareRoot)
				positiveVars[tempVar.n] = true;
			else
				positiveVars[tempVar.n] = false;
		}

		return positiveVars;
*/		
	}

	//=======================================================
	//=======================================================
    function getForcePositive(r)
    {
        if (((r.rootNode instanceof tree.Logarithm) && !(r.rootNode instanceof tree.NaturalLog))
            || r.rootNode instanceof tree.SquareRoot)
            return true;

        return false;
    }
    
	//=======================================================
	// Solve an expression using xValue for all variables
	//
	// Why would anyone ever use this? It doesn't appear to be used.
	// It may have been used in step-by-step mode when checking
	// equalities. It could certainly have been done using better, existing
	// tools like, say, areEquationsEqual.
	// DELETEME!
	//=======================================================
	eqTools.solveExpression = function(root1, xValue)
	{
		// Make sure there's something to solve
		if (root1 === null || root1 === undefined || root1.rootNode instanceof tree.BooleanOperator)
			return null;

		// You can't solve coordinates.  Don't even try.  It can't be done.  Trust me.
		else if ((root1.rootNode.middleNode instanceof tree.Comma))
			return null;

		root1.checkForPowersToTheOne();
		var vars1 = root1.getAllVariables();

		for (var prop in vars1)
		{
			if (typeof vars1[prop] === "function")
				continue;

			vars1[prop] = xValue;
		}

		return root1.getApproximateValueOfTree(vars1);
	}

	//=======================================================
	// round to siginicant figures
	//
	// num - original number.
    // n - significant digits to round off to
	//=======================================================
    eqTools.roundToSigFigures = function(num, n) {
        if(num == 0)
            return 0;
    
        var d = Math.ceil(log10(num < 0 ? -num: num));
        var power = n - d.toFixed(0);
    
        var magnitude = Math.pow(10, power);
        var shifted = Math.round(num*magnitude);
        return shifted/magnitude;
    }    
    
	//=======================================================
	// Determine whether two expressions are equal
	//
	// This is a base routine that is called by many other
	// routines. It is a very loose check that is considered
	// the bare minimum for equivalence.
	//=======================================================
	eqTools.areExpressionsEqual = function(std, tch, abs)
	{
		// If the expressions aren't properly set, they can't possibly be equal.
		if (std === null || tch === null || std === undefined || tch === undefined)
			return false;

		// Boolean operators can't be equal.  I'm not sure why not.
		if (std.rootNode instanceof tree.BooleanOperator || tch.rootNode instanceof tree.BooleanOperator)
			return false;

		// If either expression is a coordinate, they can't be equal.  Again, I'm not sure why not.
		if ((std.rootNode.middleNode instanceof tree.Comma) || (tch.rootNode.middleNode instanceof tree.Comma))
			return false;

		// Check if both expressions are equations
		if (std.rootNode instanceof tree.Equality && tch.rootNode instanceof tree.Equality)
			return eqTools.areEquationsEqual(std, tch);

		if (!eqTools.canPlugVariables(std) || !eqTools.canPlugVariables(tch))
			return false;

		var vars1 = std.getAllVariables(true);
		var vars2 = tch.getAllVariables(true);
        if (vars1.count() == 0) // all constants:
        {
            var pwr1 = std.findAllInstancesOfClass("Power");
            var pwr2 = tch.findAllInstancesOfClass("Power");
            // should not accept an equivalent exponential if author answer doesn't have exponential:
            if (pwr1[0] && !pwr2[0])
                    return false;
            
            if (vars2.count() == 0)
            {
                var answer1 = std.getApproximateValueOfTree(std);
                var answer2 = tch.getApproximateValueOfTree(tch);
                return eqTools.compareFloats(answer1, answer2, abs); //std.rootNode.evaluateNode(), tch.rootNode.evaluateNode(), abs);
            }
        }
		else
		{ // check if they have the same variables,
		  // i.e. sqrt(x) is not considered equivelent to sqrt(y):
			var varMatched = true;
			_.each(vars1, function(value, key) // find the objects to change key name:
			{
				if (key != "numerical" && !vars2.hasOwnProperty(key))
				{
					varMatched = false; // did not find the same variable
					return; // no sense to continue
				}
				
			});
			if (!varMatched)
				return false;
		}
        
		var wrongCount = 0;
		
        // these don't work for such things like sqrt(3x), it only woks for simple ones like sqrt(x):
        var vars1MustBePositive = getMustBePositiveVars(std);
		var vars2MustBePositive = getMustBePositiveVars(tch);
        
        // Make it work for complicated operation such things like sqrt(3x):
//        var bForcePositive1 = getForcePositive(std);
//        var bForcePositive2 = getForcePositive(tch);
        
        var res = false;
        var numTries = 50;
        var nanTolerance = numTries / 4; // a quarter of tries can go result to Nan
        var slopDecPoints = 10; // after all, we need approximate number
        
		// Perform 50 comparisons to be REALLY sure.  Allow some slop (NaN and up to 2 failures)
		for (var i = 0; i < numTries; i++)
		{
			// Clear out entries
			for (var prop in vars1)
			{
				if (typeof vars1[prop] !== "function")
					vars1[prop] = null;
			}

			// Fill in all variables in vars2
			for (var prop in vars2)
			{
				if (typeof vars2[prop] === "function")
					continue;

				vars2[prop] = randomGenerator.getRand();

				if (vars2MustBePositive) //[prop])
					vars2[prop] = vars2[prop].getAbs();		// DG: Had a Fraction typecast

				if (vars1.hasOwnProperty(prop))
					vars1[prop] = vars2[prop];		// DG: Note that this doesn't check vars1MustBePositive!
			}

			// Check for additional vars in vars1
			for (var prop in vars1)
			{
				if (typeof vars1[prop] === "function")
					continue;

				if (vars1[prop] === null)
				{
					vars1[prop] = randomGenerator.getRand(); // this returns a fraction with 1 as denominator
					if (vars1MustBePositive) //[prop])
						vars1[prop] = vars1[prop].getAbs();
				}
			}

			var answer1 = std.getApproximateValueOfTree(vars1); //, bForcePositive1);
			var answer2 = tch.getApproximateValueOfTree(vars2); //, bForcePositive2);

//            console.log("ans1 = " + answer1 + "; ans2 = " + answer2);
            
			// NaN values are possible and not a disqualifier, evidently.
            // reason 1: Division by 0 when 3/x and x is assigned to 0;
            // reason 2: n-root and n is a even number, but inside n-root(f(x)) resulting a negative number;
			if (isNaN(answer1) || isNaN(answer2))
            {
                if (++wrongCount > nanTolerance)
				   return false; // i.e. studen has sqrt(-1) resulting Nan, whilte teach has sqrt(1) resulting 1.
                
                continue; // could be randomly hitting nan with the two reasons.
            }

			// There appears to be a 3 strikes rule.  2 wrong out of 50 is allowed?
			if (!eqTools.compareFloats(eqTools.roundToSigFigures(answer1, slopDecPoints),
                                       eqTools.roundToSigFigures(answer2, slopDecPoints), abs))
			{
//				if (++wrongCount > 2)
					return false;
            }
            else
                res = true;
		}

		return res; //true;
	}

	//=======================================================
	// Compare two floating point values
	//
	// This is the main routine to compare two evaluated expressions
	// to determine if they are matches. This routine should probably
	// be where slop is handled.
	//
	// @FIXME/dg: This is inefficient and redundant! Many rules
	// make others impossible/invalid.
	//=======================================================
	eqTools.compareFloats = function(num1, num2, abs)
	{
		if (abs === true)
		{
			num1 = Math.abs(num1);
			num2 = Math.abs(num2);
		}

		// Early out.  Are they identical?
		if (num1 === num2)
			return true;

        var sNum1 = num1.toString();
        var sNum2 = num2.toString();
        if (num1 instanceof tree.Fraction)
            sNum1 = num1.numerator.toString();
        if (num2 instanceof tree.Fraction)
            sNum2 = num2.numerator.toString();
            
        if (sNum1 === "Infinity" && sNum1 != sNum2)
            return false;

		// If they have identical strings, they are identical.
		// I'm not sure when this would succeed when a direct compare wouldn't.
		// If anything, this places too much reliance on the Javascript interpreter.
		if (sNum1 === sNum2)
			return true;

		// Floor to the nearest ten-thousandth
		var mult = Math.pow(10, 4);
		var modNum1 = Math.floor(num1 * mult) / mult;
		var modNum2 = Math.floor(num2 * mult) / mult;
		////trace(modNum1);
		////trace(modNum2);

		// Secondary test: Divide the numbers and then
		// round to either the 12th or 3rd decimal place, depending on the magnitude of the number
		var mult2 = Math.pow(10, 12);
		if (Math.abs(num1) > Math.pow(10, 4) || Math.abs(num2) > Math.pow(10, 4))
		{
			////trace("we got a big num");
			mult2 = Math.pow(10, 3);
		}
		var oneNumber = (modNum1 > modNum2) ? (modNum1/modNum2) : (modNum2/modNum1);
		oneNumber = Math.round(oneNumber * mult2) / mult2;
		////trace("after");
		////trace(oneNumber);

		// In case division by 0 occurred.  If only the divisor is 0 this will fall through.
		if (modNum1 === 0 && modNum2 === 0)
			return true;

		// DG: This is a little suspect.  0.1 seems a tad arbitrary.
		if (Math.abs(modNum1 - modNum2) > 0.1) //difference between numbers cant be too great
			return false;						//for example 4475809.7919 4475810.7919 would be marked correct if this wasnt in

		// It's possible that oneNumber is NaN if division by 0 occurred, but that would only occur if the numbers aren't equal (or close enough)
		return (oneNumber === 1)
	}

	//=======================================================
	// Determines whether variable replacement within an expression is useful.
	// Equivalency is often determined by random variable substitution.
	// If variable substitution isn't going to be definitive, there's no point.
	//=======================================================
	eqTools.canPlugVariables = function(r, ignoreEquality)
	{
		if (r.rootNode instanceof tree.Equality && !ignoreEquality)
			return false;

		if (r.rootNode instanceof tree.BooleanOperator)
			return false;

		if (r.rootNode instanceof tree.InfiniteSolutions || r.rootNode instanceof tree.NoSolutions)
			return false;

		if (r.rootNode instanceof tree.Sigma)
			return false;

		// Look for squareroots with negative numbers
		var sqrt = r.findAllInstancesOfClass("NRoot");
        if (!sqrt)
            return true;

		for (var i = 0; i < sqrt.length; i++)
		{
			if (sqrt[i] instanceof tree.SquareRoot)
			{
				var tempNode = sqrt[i];
				if ((tempNode.middleNode instanceof tree.Numerical) && (tempNode.middleNode.isNegative()))
					return false;
			}
			else
			{
				var tempNRoot = sqrt[i];
				if (tempNRoot.rightNode instanceof tree.Numerical && tempNRoot.leftNode instanceof tree.Numerical)
				{
					var degree = tempNRoot.rightNode;
					var base = tempNRoot.leftNode;
					if ((parseInt(degree.getTreeAsString(), 10) % 2 === 0) && base.isNegative())
						return false;
				}
			}
		}

		return true;
	}

	//=======================================================
	// Checks for a decimal point
	//=======================================================
	eqTools.isDecimalAnswer = function(stringAnswer)
	{
		// Checks for decimal points (ignoring ellipsis, which should have been replaced by @ so this might be unneccesary)
		var noEllip = eqTools.replaceAll(stringAnswer, "...", "");
		return noEllip.indexOf(".") !== -1;
	}

	//=======================================================
	// Special check to determine whether equations are equal.
	// Equations here are expressions that contain an equal sign.
	//
	// This doesn't recognize terms being moved to the other side
	// of an equation, e.g. "x+y=0" won't match "x=-y".
	//=======================================================
	eqTools.areEquationsEqual = function(stdRoot, authorAnswer)
	{
		if (stdRoot.rootNode instanceof tree.Equality && authorAnswer.rootNode instanceof tree.Equality)
		{
			var leftSideStudent = tree.Root.createDuplicateTree(stdRoot.rootNode.leftNode);
			var rightSideStudent = tree.Root.createDuplicateTree(stdRoot.rootNode.rightNode);
			var leftSideAuthor = tree.Root.createDuplicateTree(authorAnswer.rootNode.leftNode);
			var rightSideAuthor = tree.Root.createDuplicateTree(authorAnswer.rootNode.rightNode);

			if (eqTools.areExpressionsEqual(leftSideStudent, leftSideAuthor))
			{
				if (eqTools.areExpressionsEqual(rightSideStudent, rightSideAuthor))
					return true;
			}
			else if (eqTools.areExpressionsEqual(leftSideStudent, rightSideAuthor))
			{
				if (eqTools.areExpressionsEqual(rightSideStudent, leftSideAuthor))
					return true;
			}

			////trace("expressions equations but not equal");
		}

		return false;
	}

	//=======================================================
	//=======================================================
	function transformToCommutativeTree(t)
	{
		t.undoSimpleVerticalDivision();
		var nodes = t.findAllInstancesOfClass("Node");
		var tempNode;

		for (var i = 0; i < nodes.length; i++)
		{
			tempNode = nodes[i];		// cast to Node
			if (tempNode instanceof tree.Parenthesis && tempNode.parentNode instanceof tree.Logarithm)
			{
				//remove parens
				tempNode.parentNode.assignNodeNewChild(tempNode, tempNode.middleNode);
				tempNode.middleNode.parentNode = tempNode.parentNode;
			}
			else if (tempNode instanceof tree.Subtraction)
			{
//				//trace("found subtract");
//				//trace(tempNode.leftNode.getTreeAsString());
//				//trace(tempNode.rightNode.getTreeAsString());
				var mult = new Multiplication();
				var add = new Addition();
				var negOne = new Numerical(-1, 1);

				add.leftNode = tempNode.leftNode;
				add.rightNode = mult;
				add.parentNode = tempNode.parentNode;
				add.parentNode.assignNodeNewChild(tempNode, add);	// @FIXME/dg: This crashes if tempNode.parentNode is null, which appears to be legal!
				mult.leftNode = negOne;
				mult.rightNode = tempNode.rightNode;
				mult.parentNode = add;
				negOne.parentNode = mult;
				mult.rightNode.parentNode = mult;

				add.setRoot(t);

				if (add.parentNode === null)
					add.rootNode.rootNode = add;
			}
			else if (tempNode instanceof tree.Numerical && tempNode.isNegative() && !tempNode.isNegativeOne())
			{
				var mult = new Multiplication();
				var negOne = new Numerical(-1, 1);
				mult.leftNode = negOne;
				mult.rightNode = tempNode;
				mult.parentNode = tempNode.parentNode;
				tempNode.parentNode.assignNodeNewChild(tempNode, mult);
				negOne.parentNode = mult;
				tempNode.parentNode = mult;
				tempNode.updateValue(Fraction.multiply(tempNode.number, new Fraction(-1)));
				mult.setRoot(t);
			}
		}
	}

	//=======================================================
	// This routine is used in 3 chapters. It is only ever
	// called when the 'exactAnswerCommutative' rule is set.
	// That rule is set by default in those chapters (1108, 1110, 2002)
	// so this will be used for most problems in those chapters.
	//
	// - used for operations such as multiplication and addition,
    //   but not for division and subtraction.
	//   NF - 2/17/2014: this routine only checks for multiplication. why doesn't check for addition?
    //
	// This appears to be a superset of eqTools.areExpressionsEqual.
	// eqTools.areExpressionsEqual must be true, then additional tests
	// are performed.
	//=======================================================
	eqTools.compareUpToCommutative = function(authorPoly, studentPoly, equivalenceObject)
	{
		// Check for nRoots student and author. If the exact count doesn't match, it's wrong. (sqrt(9) can never be used for 3)
		var nodeStudent = studentPoly.findAllInstancesOfClass("NRoot");
		var nodeAuthor = authorPoly.findAllInstancesOfClass("NRoot");
		if (nodeStudent.length !== nodeAuthor.length)
			return false;

		// Check powers. If the exact count doesn't match, it's wrong. (3^2 can never be used for 9)
		var nodeStudent = studentPoly.findAllInstancesOfClass("Power");
		var nodeAuthor = authorPoly.findAllInstancesOfClass("Power");
		if (nodeStudent.length !== nodeAuthor.length)
			return false;

		if (eqTools.areExpressionsEqual(authorPoly, studentPoly))
		{
			transformToCommutativeTree(authorPoly);
			transformToCommutativeTree(studentPoly);
			var nodesStudent = studentPoly.findAllInstancesOfClass("Node");
			var nodesAuthor = authorPoly.findAllInstancesOfClass("Node");

			// Check if number of nodes in tree is the same
			if (nodesStudent.length === nodesAuthor.length)
			{
				// Check if same nodes exist in both trees
				var tempNodeAuthor;
				var tempNodeStudent;
                
                // go through each author item with the ever reducing student items:
				for (var i = 0; i < nodesAuthor.length; i++) 
				{
					tempNodeAuthor = nodesAuthor[i];		// typecast to Node

					for (var j = 0; j < nodesStudent.length; j++)
					{
						tempNodeStudent = nodesStudent[j];	// typecast to Node
						if (tempNodeStudent instanceof tree.Numerical && tempNodeAuthor instanceof tree.Numerical)
						{
							//compare both numbers
							if (tempNodeStudent.isIdentical(tempNodeAuthor.number))
							{
								nodesStudent.splice(j, 1); // remove the checked item from student
								break;
							}
						}
						else if (tempNodeStudent instanceof tree.Variable && tempNodeAuthor instanceof tree.Variable)
						{
							if (tempNodeStudent.n === tempNodeAuthor.n)		// Double cast to Variable
							{
								nodesStudent.splice(j, 1);
								break;
							}
						}
						else if (tempNodeStudent instanceof tree.Multiplication && tempNodeAuthor instanceof tree.Multiplication)
						{
							nodesStudent.splice(j, 1);
							break;
						}
						else if (tempNodeStudent.className === tempNodeAuthor.className)
						{
							////trace("found matching class");
							////trace(tempNodeStudent.className);
							nodesStudent.splice(j,1);
							break;
						}
					}
				}

				if (nodesStudent.length === 0)
				{
					equivalenceObject.answerEquivalence = resultTypes.GOODANSWER;
					equivalenceObject.answerMessage = "That is correct!";
					return true;
				}
			}	// if trees have identical length
		}

		equivalenceObject.answerEquivalence = resultTypes.BADANSWER;
		equivalenceObject.answerMessage = "That is not right";
		return false;
	}

	//=======================================================
	// Checks if the exact number and type of variables match
	// between expressions.
	//=======================================================
	eqTools.compareVariables = function(root1, root2)
	{
		var vars1 = root1.getAllVariables();
		var vars2 = root2.getAllVariables();

		// Presumably eqTools.compareObjects would always fail if the sizes are different.
		// Performing both checks seems redundant, especially given that eqTools.compareObjects was first.
		// I flipped the order, since compareObjectSize is probably faster and can act as an early out.
//		return (compareObjectSize(vars1, vars2) && eqTools.compareObjects(vars1, vars2));
		return eqTools.compareObjects(vars1, vars2);
	}

	//=======================================================
	// This function compares the numerical nodes in each tree.
	//
	// This routine is duplicated in individual chapters. It
	// appears to be functionally identical.
	//
	// This routine only appears to be used in inequality checks,
	// and is used in conjunction with eqTools.compareVariables. Together
	// is seems to basically be an exact match, though a few
	// extra simplifications exist such as undoVerticalDivision and
	// numerical equivalence (e.g., "7.0" matches "7").
	//
	// Only the number and values of numericals are checked,
	// not the relative positions and associates.
	// Examples: "3x+0" fails against "3x".
	//           "3x+2" matches "2x+3".
	//
	// Therefore, this is only useful as a supplemental check,
	// after determining that the expressions match.
	//=======================================================
	eqTools.compareNumericals = function(root1, root2)
	{
		var nodes1 = [];
		var nodes2 = [];

		root1.undoVerticalDivision();
		root2.undoVerticalDivision();

		root1.rootNode.findAllInstancesOfClass("Numerical", nodes1);
		root2.rootNode.findAllInstancesOfClass("Numerical", nodes2);

		if (nodes1.length !== nodes2.length)
			return false;

		var tempNum;
		while (tempNum = nodes1.pop())
		{
			var found = false;
			for (var i = 0; i < nodes2.length; i++)
			{
				if (tempNum.checkEquality(nodes2[i].number))
				{
					found = true;
					nodes2.splice(i, 1);
					break;
				}
			}
			if (!found)
				return false;
		}

		return true;
	}

	//=======================================================
	// Numerical comparison that allows the least significant
	// digit to vary by 1.
	//
	// @FIXME/dg: This doesn't actually use least significant digits!
	// As an example, in 123000 the LSD should be the 3. However,
	// this code treats it as the 0. This would only really work
	// with scientific notation.
	//
	// DG: The 1 can't easily be changed.  This doesn't compare
	// against a range.  Instead, it does an exact compare against
	// +1 and -1.
	// Consider using the existing routines from free input equivalence.
	//=======================================================
	eqTools.compareNumbersWithSlop = function(rAuthor, rStudent)
	{
		if (!rAuthor.rootNode.isNumber() || !rStudent.rootNode.isNumber())
			return false;

		var numAuthor = rAuthor.rootNode.number.numerator;
		var denAuthor = rAuthor.rootNode.number.denominator;
		var decimalAuthor = numAuthor/denAuthor;

		var numStudent = rStudent.rootNode.number.numerator;
		var denStudent = rStudent.rootNode.number.denominator;
		var decimalStudent = numStudent/denStudent;

		var authorString = eqTools.cleanAnswerString(rAuthor.getTreeAsString(true))
		var authorAnswerDecimalPlaces = authorString.indexOf(".") >= 0 ? authorString.substring(authorString.indexOf(".")+1).length : 0;

		// Format student decimal to match decimal places of expected answer
		var studentAnswerTemp = tree.Root.createTree(eqTools.formatDecimals(decimalStudent, authorAnswerDecimalPlaces));

		// Possible answers
		var decimalPlus;
		var decimalMinus;
		if (authorAnswerDecimalPlaces === 0)
		{
			//no decimal point
			decimalPlus = decimalAuthor + 1;
			decimalMinus = decimalAuthor - 1;
		}
		else
		{
			var slop = Math.pow(10, -authorAnswerDecimalPlaces);
			decimalPlus = decimalAuthor + slop;
			decimalMinus = decimalAuthor - slop;
		}

		// Check if rounded student answer matches answer
		if (studentAnswerTemp.rootNode.checkEquality(rAuthor.rootNode.number))
			return true;

		// Rounded answer not good.  Check if it matches decimalplus or decimalminus
		var authorAnswerTemp = tree.Root.createTree(decimalPlus.toString());
		if (studentAnswerTemp.rootNode.checkEquality(authorAnswerTemp.rootNode.number))
			return true;

		authorAnswerTemp = tree.Root.createTree(decimalMinus.toString());
		if (studentAnswerTemp.rootNode.checkEquality(authorAnswerTemp.rootNode.number))
			return true;

		return false;
	}

	//=======================================================
	// compare Coordinates - adapted from chapter1103.as
	// return: true - correct, false - wrong
	//=======================================================
	eqTools.checkCoordinates = function (student,teacher, slop)
	{
		var xCoordsCorrect = false;
		var yCoordsCorrect = false;
		var zCoordsCorrect = false;
		
		if(eqTools.areExpressionsEqual(student.xCoord, teacher.xCoord))
			xCoordsCorrect = true;
		else 
		{
			if(student.xCoord.rootNode.isNumber() && teacher.xCoord.rootNode.isNumber() 
			&& slop) //chapterPropertyValues["allowSlop"])
			{
				//we got two decimals that are different but slope is on, check to see if answer is right
				//we got numbers in both and we allow slop, check if we have a good answer
				xCoordsCorrect = eqTools.compareNumbersWithSlop(teacher.xCoord, student.xCoord);
			}			
		}
		
		if(eqTools.areExpressionsEqual(student.yCoord, teacher.yCoord))
			yCoordsCorrect = true;
		else 
		{
			if(student.yCoord.rootNode.isNumber() && teacher.yCoord.rootNode.isNumber() 
			&& slop) //chapterPropertyValues["allowSlop"])
			{
				//we got two decimals that are different but slope is on, check to see if answer is right
				//we got numbers in both and we allow slop, check if we have a good answer
				yCoordsCorrect = eqTools.compareNumbersWithSlop(teacher.yCoord, student.yCoord );
			}			
		}
		
		if((teacher.zCoord == undefined && student.zCoord == undefined )
           || eqTools.areExpressionsEqual(student.zCoord, teacher.zCoord))
			zCoordsCorrect = true;
		else 
		{
			if(student.zCoord.rootNode.isNumber() && teacher.zCoord.rootNode.isNumber() 
			&& slop) //chapterPropertyValues["allowSlop"])
			{
				//we got two decimals that are different but slope is on, check to see if answer is right
				//we got numbers in both and we allow slop, check if we have a good answer
				zCoordsCorrect = eqTools.compareNumbersWithSlop(teacher.zCoord, student.zCoord );
			}			
		}
		
		if(xCoordsCorrect && yCoordsCorrect && zCoordsCorrect)
            return true;    //equivalenceObject.answerEquivalence = KineticInputAnswerCheck.GOODANSWER;
		else
            return false; //equivalenceObject.answerEquivalence = KineticInputAnswerCheck.BADANSWER;
	}
    
	//=======================================================
	// Convert from scientific notation to a Numerical tree
	//
	// Expects data in the form: "1.0*pow(10,3)".
	// Note the use of "*" (Multiplication) instead of "~" (Times)
	// which the parser uses for scientific notation.
	//
	// This routine returns on error, without any kind of error
	// indication.
	//
	// This is used in: 1008, 1209, 2081
	// Strangely enough, the entry requirement to use this is
	// the existence of "~" in the string answer. I don't see
	// a conversion of "~" to "*" occurring, but it must happen
	// somewhere if this ever worked.
	//
	// This routine would be more efficient if it just passed
	// in the string answer instead of a tree!
	//=======================================================
	eqTools.transformSNToNumerical = function(sAnswer)
	{
		var stringAnswer = eqTools.cleanAnswerString(sAnswer.getTreeAsString(true));

		// Make sure the number is in a valid format -- * is the multiplication sign (x)
		var parts = stringAnswer.split("*");
		if (parts.length !== 2)
			return;

		var theNumber = parseFloat(parts[0]);
		var exponentPart = parts[1];

		if (Math.abs(theNumber) >= 10 || Math.abs(theNumber) < 1)
			return;

		var power = tree.Root.createTree(exponentPart);

		if (!(power.rootNode instanceof tree.Power))
			return;

		var base = power.rootNode.getBase();		// Had a cast to Power
		if (base.getTreeAsString(true) === "10")
			var exponent = power.rootNode.getDegree();	// Had a cast to Power
		else
			return;

		var answer = theNumber * Math.pow(10, exponent);
		////trace("the answer SN conversion " + stringAnswer);
		////trace(answer);

		sAnswer = tree.Root.createTree(answer.toString());

		if (answer.toString().indexOf(".") >= 0)
			studentAnswerIsDecimal = true;
		else
			studentAnswerIsDecimal = false;

		return sAnswer;
	}

	//=======================================================
	// This function combines all like terms in the tree.
	// It works on both equations and expressions.
	// return: true if there were terms to be combined,
	//         false otherwise.
	//=======================================================
	eqTools.simplify = function (r, reduceFracs) {
		reduceFracs = reduceFracs == undefined? true : reduceFracs;
		var simplifyObject = r.rootNode.simplify(-1, reduceFracs);
		
        if(simplifyObject.changed)
			r.rootNode.removeNulls();
            
		return simplifyObject.changed;
	}
    
	//=======================================================
    // adapted from Chapter1101.as
    // return: true = equality;
	//=======================================================
	eqTools.checkOneOperator = function (std, tch, rules)
    {
		//no ops, are numbers the same?
		if(std.rootNode instanceof tree.Numerical && tch.rootNode instanceof tree.Numerical)
			return std.rootNode.checkEquality(tch.rootNode.number); //isIdentical(tch.rootNode.number);
		
        // this works for Inequilty as well since it is a derived class from Equality:
		if(!(std.rootNode instanceof tree.Equality)) // equality / inequality
			//This didn't have an operator at the top.
			return eqTools.areExpressionsEqual(std, tch);   //false;
        
        		// Look for squareroots with negative numbers
		var stdAbs = std.findAllInstancesOfClass("AbsoluteValue");
		var tchAbs = tch.findAllInstancesOfClass("AbsoluteValue");

        var initialCheckPassed = false;
        if (stdAbs || tchAbs)
            initialCheckPassed = eqTools.areExpressionsEqual(std, tch, true);
        else
            initialCheckPassed = eqTools.compareNumericals(std, tch) && eqTools.compareVariables(std, tch);
            
		if(initialCheckPassed)
        {   // we already know they are numberically equivelent and have same variables,
            // now we just need to check and see if the sign is the right way.
            var strStdLeft = std.rootNode.leftNode.getTreeAsString();
            var strTchLeft = tch.rootNode.leftNode.getTreeAsString();
            var stdLeft = tree.Root.createTree(strStdLeft);
            var tchLeft = tree.Root.createTree(strTchLeft);
        
            if(eqTools.areExpressionsEqual(stdLeft, tchLeft)) // std.rootNode.leftNode.className == tch.rootNode.leftNode.className)
            { 
                if (rules && rules.cantFlip) // make sure same math operations for both student and teacher:
                {
                    if (std.rootNode.leftNode.n == tch.rootNode.leftNode.n)
                        return true;
                    else
                        return false;
                }
                else // we already proved that numberical and variables are equivelent:
                    if(std.rootNode.n == tch.rootNode.n) // equality or mostly make sure inequality signs are same
                    {
                        if (std instanceof tree.Inequality)
                        {
                            var studentLeftEquivToTeachEitherSide =
                                    (std.rootNode.leftNode.n == tch.rootNode.leftNode.n // stays the same sides so we are done
                                    || std.rootNode.leftNode.n == tch.rootNode.rightNode.n); // flipped sides but not partially
                            if(!studentLeftEquivToTeachEitherSide)
                                return false;
                        }
                        
                        return true;
                    }
            }
            else // student and teacher left side are not equivlent, might be side switched?
            {
                if(rules && !rules.cantFlip // free to switch sides?
                    && tch.rootNode.n == std.rootNode.getOppositeOperator() // inequality signs also flipped?
                    && std.rootNode.leftNode.n == tch.rootNode.rightNode.n)
                    return true;
            }
        }
        return false;
	}
	
	//=======================================================
    // adapted from Chapter1101.as
    // return: true = equality;
	//=======================================================
	eqTools.checkTwoOperators = function (std, tch)
	{
		if(eqTools.compareNumericals(std, tch) && eqTools.compareVariables(std, tch))
        {
            if(std.getTreeAsString() == tch.getTreeAsString())
                return true; // good answer
            
            //This means it might be backwards:
            var stdArray = std.getTreeAsArray();
            var tchArray = tch.getTreeAsArray();

            if(stdArray.length != tchArray.length)
                return false; //There aren't the same number of nodes, so something must be wrong.
                
            // prove it is backwards:
            while(stdArray.length > 0 && tchArray.length > 0)
            {
                var stdNode = Node(stdArray.shift());
                var tchNode = Node(tchArray.pop());

                if(stdNode instanceof tree.Equality && tchNode instanceof tree.Equality
                    && Equality(stdNode).n != Equality(tchNode).getOppositeOperator())
                        return false; // not backwards either
            }
            return true;	
        }
        return false;
	}

	//=======================================================
    // adapted from Chapter1102.as
    // assume teacher answerType is AND_OPERATOR that triggered this function call.
    // return: true = equality;
	//=======================================================
    var answerTypes = require('./answerTypeList');	// General math tools
	
    eqTools.checkAndOperators = function (std, tch, rules, stdAnswerType, strStudent)
    {
        if(stdAnswerType != answerTypes.types.AND_OPERATOR){
            if(stdAnswerType == answerTypes.types.TWO_OPERATORS){ // we were looking for an and, but they combined the answer:
                var variables = std.findAllInstancesOfClass("Variable");
                var variable = variables.pop().n;
                var index = strStudent.indexOf(variable);
                strStudent = strStudent.slice(0, index + 1) + " & " + strStudent.slice(index, strStudent.length);
                std = tree.Root.createTree(strStudent);
                return eqTools.checkBooleanOperator(std, tch, "and", rules);
            }
            else
                return false;
        }

        return eqTools.checkBooleanOperator(std, tch, "and", rules);	
    }
    
	//=======================================================
    // adapted from Chapter1102.as
    // assume teacher answerType is AND_OPERATOR that triggered this function call.
    // return: true = equality;
	//=======================================================
	eqTools.checkOrOperators = function (std, tch, rules, stdAnswerType)
    {
        if(stdAnswerType != answerTypes.types.OR_OPERATOR)
            return false;
        
        return eqTools.checkBooleanOperator(std, tch, "or", rules);	
    }
    
	//=======================================================
    // adapted from Chapter1011.as
    // return: true = equality;
	//=======================================================
	eqTools.checkBooleanOperator = function (std, tch, op, rules)
    {
		if(std.rootNode instanceof tree.BooleanOperator
			&& std.rootNode.getOpAsString() == op)
        {   //	//trace("inside found right boolean");
            var stdOps = new Array();
            stdOps.push(tree.Root.createDuplicateTree(std.rootNode.leftNode));
            stdOps.push(tree.Root.createDuplicateTree(std.rootNode.rightNode));
            
            var tchOps = new Array();
            tchOps.push(tree.Root.createDuplicateTree(tch.rootNode.leftNode));
            tchOps.push(tree.Root.createDuplicateTree(tch.rootNode.rightNode));
            
            while(stdOps.length > 0){
                var stdTreeNotChecked = stdOps.pop(); // nf
                var matchFound = false; // reset for next operator check:
                
                for(var i = 0; i < tchOps.length; i++){
                    if(eqTools.checkOneOperator(stdTreeNotChecked, tchOps[i], rules)){
                        matchFound = true;
                        tchOps.splice(i, 1);
                        break;
                    }
                }
                if(!matchFound) // One of the expressions on either side of the AND was not right.
                    return false;
            }
            return true;
        }

		return false;
	}
    
module.exports = eqTools;
},{"./answerTypeList":2,"./nodeTree/tree":47,"./randomGenerator":50,"underscore":61}],4:[function(require,module,exports){
/************************************************************************
  This file is based on Steve Cheng's code. The original code is to
  generate MLL format from Latex format. It has been changed significantly
  for some bug fix such as single digit log and power functions, and
  to serve the purpose of generating Kinetic Input format strings.

  latexToEquiv.LatexToKI - this is the main function of this file.
    It converts the input Latex string to the string in Kinetic Input format.

  Nick Feng     1/9/2012
/***********************************************************************/
latexToEquiv = {};

// This script was automatically generated from a literate source.
// Do not edit this file; look at the literate source instead!
//
// Greasemonkey user script to
// Display LaTeX in Web pages by transforming to MathML
//
// Home page: http://gold-saucer.afraid.org/mathml/greasemonkey/
//
// --------------------------------------------------------------------

// Copyright (C) 2006 Steve Cheng <stevecheng@users.sourceforge.net>

// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:

// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHOR(S) BE LIABLE FOR ANY CLAIM, DAMAGES OR
// OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALNGS IN THE SOFTWARE.

// --------------------------------------------------------------------
// ==UserScript==
// @name          Display LaTeX
// @namespace     http://gold-saucer.afraid.org/mathml/greasemonkey/
// @description   Display LaTeX in Web pages by transforming into MathML
// @include       http://gold-saucer.afraid.org/mathml/greasemonkey/
// @include       http://gold-saucer.afraid.org/writings/Display_LaTeX_sandbox
// @include       http://planetmath.org/*
// ==/UserScript==

function PlainXMLNode(tag)
{
  this.tag = tag;
  this.content = [];    // array
  this.attrs = {};      // object

  // for Equivalence internal format string:
  this.strKiContentPreLtDelim=[],
  this.strLeftDelim = [], // array of strings, elements correspond to the array elements of 'content'
  this.strKiContent=[], // sometimes we need to insert KI content
  this.strRightDelim = [],
  this.strKiContentPostRtDelim=[];
}

/****************************************************************
 Inputs (explicit):
    tag - tag for the new node.
    num_attrs - number of display attribute pairs for this node.

 Inputs (implicit - passed in through the arguments):
    attribute pairs - should be exact number of pairs specified
                    by num_attrs.
 content:
    zero or more content elements.

 Return: a new node with tag and content elements.
****************************************************************/
function result_element(tag, num_attrs)
{
  var node = new PlainXMLNode(tag);

  var k = 2;
  while(--num_attrs >= 0)
  {
    // skip attributes such as Mathvariant - nickf 12/13/2011
    //
    //   if(arguments[k+1] != null) {
    //     node.attrs[arguments[k]] = arguments[k+1];
    //  }

    k += 2;
  }

   for(; k < arguments.length; k++) {
       if(arguments[k] != null)
            node.content.push(arguments[k]); // expand array of content
  }

  return node;
}

// attach child node at the end of nodes:
//
function result_element_append(parent, child)
{
    if(parent != null && child != null) {
        parent.content.push(child);
    }
}

// insert child node before the next node
//
function result_element_prepend(parent, child, next)
{
    if(next == null)
        result_element_append(parent, child);
    else
        if(parent != null && child != null)
    {
        // insert child node before the next node:
        for(var i = 0; i < parent.content.length; i++)
        {
            if(parent.content[i] == next)
            {
                parent.content.splice(i, 0, child);
                return;
            }
       }
   }
}

function result_set_attr(elem, attr, value)
{
  if(elem != null && attr != null) {
    if(value != null)
      elem.attrs[attr] = value;
    else
      delete elem.attrs[attr];
  }
}

function result_append_attr(elem, attr, value)
{
  if(elem != null && attr != null) {
    if(elem.attrs[attr] == null)
      elem.attrs[attr] = value;
    else
      elem.attrs[attr] += value;
  }
}

/*
if(!this.GM_getValue) {
  this.GM_getValue = function(key, value) { return value; }
  this.GM_log = function() {}
}
if(this.GM_registerMenuCommand) {
  GM_registerMenuCommand("Enable native display of math images",
    function() {
      GM_setValue("patch-images", true);
      do_patch_images = true;
      patch_element(document.documentElement);
    });
  GM_registerMenuCommand("Disable native display of math images",
    function() {
      GM_setValue("patch-images", false);
    });
}
*/

//const
var char_map = {
  'script': [
    '\uEF35', '\u212C', '\uEF36', '\uEF37', '\u2130', '\u2131',
    '\uEF38', '\u210B', '\u2110', '\uEF39', '\uEF3A', '\u2112',
    '\u2133', '\uEF3B', '\uEF3C', '\uEF3D', '\uEF3E', '\u211B',
    '\uEF3F', '\uEF40', '\uEF41', '\uEF42', '\uEF43', '\uEF44',
    '\uEF45', '\uEF46' ],

  'fraktur': [
    '\uEF5D', '\uEF5E', '\u212D', '\uEF5F', '\uEF60', '\uEF61',
    '\uEF62', '\u210C', '\u2111', '\uEF63', '\uEF64', '\uEF65',
    '\uEF66', '\uEF67', '\uEF68', '\uEF69', '\uEF6A', '\u211C',
    '\uEF6B', '\uEF6C', '\uEF6D', '\uEF6E', '\uEF6F', '\uEF70',
    '\uEF71', '\u2128' ],

  'double-struck': [
    '\uEF8C', '\uEF8D', '\u2102', '\uEF8E', '\uEF8F', '\uEF90',
    '\uEF91', '\u210D', '\uEF92', '\uEF93', '\uEF94', '\uEF95',
    '\uEF96', '\u2115', '\uEF97', '\u2119', '\u211A', '\u211D',
    '\uEF98', '\uEF99', '\uEF9A', '\uEF9B', '\uEF9C', '\uEF9D',
    '\uEF9E', '\u2124' ]
};

//const
var uppercase_re = /[A-Z]/;

function fix_mathvariant(node, style)
{
  if(node.nodeType == node.TEXT_NODE) {
    if(style != null && style != '' && style in char_map) {
      node.data = node.data.replace(uppercase_re,
        function(s) { return char_map[style][s.charCodeAt(0)-65] });
    }
  } else if(node.nodeType == node.ELEMENT_NODE) {
    var new_style = node.getAttribute('mathvariant');
    if(new_style != null && new_style != '')
      style = new_style;

    for(var i=0; i < node.childNodes.length; i++)
      fix_mathvariant(node.childNodes.item(i), style);
  }
}

var g_punct_and_space
= { "\\quad" : "\u2003" ,
"\\qquad" : "\u2003\u2003" ,
"\\thickspace" : "\u2002" ,
"\\;" : "\u2002" ,
"\\medspace" : "\u2005" ,
"\\:" : "\u2005" ,
"\\thinspace" : "\u2004" ,
"\\," : "\u2004" ,
"\\!" : "\u200b" ,
"." : "." ,
";" : ";" ,
"?" : "?" ,
"\\qedsymbol" : "\u25a0"
};

var g_left_delimiters
= { "(" : "(" ,
"[" : "[" ,
"\\{" : "{" ,
"\\lgroup" : "(" ,
"\\lbrace" : "{" ,
"\\lvert" : "|" ,
"\\lVert" : "\u2016" ,
"\\lceil" : "\u2308" ,
"\\lfloor" : "\u230a" ,
"\\lmoustache" : "\u23b0" ,
"\\langle" : "\u2329"
};

var g_right_delimiters
= { ")" : ")" ,
"]" : "]" ,
"\\}" : "}" ,
"\\rbrace" : "}" ,
"\\rgroup" : ")" ,
"\\rvert" : "|" ,
"\\rVert" : "\u2016" ,
"\\rceil" : "\u2309" ,
"\\rfloor" : "\u230b" ,
"\\rmoustache" : "\u23b1" ,
"\\rangle" : "\u232a"
};

var g_operatorSymbols
= { "\\amalg" : "\u2a3f" ,
"\\ast" : "*" ,
"\\ast" : "\u2217" ,
"\\barwedge" : "\u22bc" ,
"\\barwedge" : "\u2305" ,
"\\bigcirc" : "\u25cb" ,
"\\bigtriangledown" : "\u25bd" ,
"\\bigtriangleup" : "\u25b3" ,
"\\boxdot" : "\u22a1" ,
"\\boxminus" : "\u229f" ,
"\\boxplus" : "\u229e" ,
"\\boxtimes" : "\u22a0" ,
"\\bullet" : "\u2022" ,
"\\bullet" : "\u2219",
"\\cap" : "\u2229" ,
"\\Cap" : "\u22d2" ,
"\\cdot" : "*",      //"\u22c5" ,
"\\centerdot" : "\u00b7" ,
"\\circ" : "\u2218" ,
"\\circledast" : "\u229b" ,
"\\circledcirc" : "\u229a" ,
"\\circleddash" : "\u229d" ,
"\\cup" : "\u222a" ,
"\\Cup" : "\u22d3" ,
"\\curlyvee" : "\u22ce" ,
"\\curlywedge" : "\u22cf" ,
"\\dagger" : "\u2020" ,
"\\ddagger" : "\u2021" ,
"\\diamond" : "\u22c4" ,
"\\div" : "/",                  //"\u00f7" ,
"\\divideontimes" : "\u22c7" ,
"\\dotplus" : "\u2214" ,
"\\doublebarwedge" : "\u2306" ,
"\\doublecap" : "\u22d2" ,
"\\doublecup" : "\u22d3" ,
"\\gtrdot" : "\u22d7" ,
"\\intercal" : "\u22ba" ,
"\\land" : "&",           //  "\u2227" ,
"\\leftthreetimes" : "\u22cb" ,
"\\lessdot" : "\u22d6" ,
"\\lor" :  "|",           //  "\u2228" ,
"\\ltimes" : "\u22c9" ,
"\\mp" : "\u2213" ,
"\\odot" : "\u2299" ,
"\\ominus" : "\u2296" ,
"\\oplus" : "\u2295" ,
"\\oslash" : "\u2298" ,
"\\otimes" : "\u2297" ,
"\\pm" : "+/-",    //"\u00b1",
"\\rightthreetimes" : "\u22cc" ,
"\\rtimes" : "\u22ca" ,
"\\setminus" : "\u2216" ,
"\\smallsetminus" : "\u2216" ,
"\\sqcap" : "\u2293" ,
"\\sqcup" : "\u2294" ,
"\\star" : "\u22c6" ,
"\\times" : "*", //"\u00d7" ,
"\\triangleleft" : "\u25c1" ,
"\\triangleright" : "\u25b7" ,
"\\uplus" : "\u228e" ,
"\\vee" : "|",           //"\u2228" ,
"\\veebar" : "\u22bb" ,
"\\veebar" : "\u2a61" ,
"\\wedge" :  "&",           // "\u2227" ,
"\\wr" : "\u2240" ,
"+" : "+" ,
"-" : "\u2212" ,
"*" : "*" ,
"," : "," ,
"/" : "\u2215" ,
":" : ":" ,
"\\colon" : ":" ,
"|" : "|" ,
"\\vert" : "|" ,
"\\Vert" : "\u2016" ,
"\\|" : "\u2016" ,
"\\backslash" : "\\" ,
"'" : "\u2032" ,
"\\#" : "#" ,
"\\bmod" : "mod" ,
"\\mod" : "mod" ,
"\\downarrow" : "\u2193" ,
"\\Downarrow" : "\u21d3" ,
"\\uparrow" : "\u2191" ,
"\\Uparrow" : "\u21d1" ,
"\\updownarrow" : "\u2195" ,
"\\Updownarrow" : "\u21d5" ,
"\\bigcap" : "\u22c2" ,
"\\bigcup" : "\u22c3" ,
"\\bigodot" : "\u2a00" ,
"\\bigoplus" : "\u2a01" ,
"\\bigotimes" : "\u2a02" ,
"\\bigsqcup" : "\u2a06" ,
"\\biguplus" : "\u2a04" ,
"\\bigvee" : "\u22c1" ,
"\\bigwedge" : "\u22c0" ,
"\\coprod" : "\u2210" ,
"\\prod" : "\u220f" ,
"\\sum" : "\u2211" ,
"\\int" : "\u222b" ,
"\\smallint" : "\u222b" ,
"\\oint" : "\u222e" ,
"\\angle" : "\u2220" ,
"\\backprime" : "\u2035" ,
"\\bigstar" : "\u2605" ,
"\\blacklozenge" : "\u29eb" ,
"\\blacksquare" : "\u25a0" ,
"\\blacksquare" : "\u25aa" ,
"\\blacktriangle" : "\u25b4" ,
"\\blacktriangledown" : "\u25be" ,
"\\bot" : "\u22a5" ,
"\\clubsuit" : "\u2663" ,
"\\diagdown" : "\u2572" ,
"\\diagup" : "\u2571" ,
"\\diamondsuit" : "\u2662" ,
"\\emptyset" : "\u2205" ,
"\\exists" : "\u2203" ,
"\\flat" : "\u266d" ,
"\\forall" : "\u2200" ,
"\\heartsuit" : "\u2661" ,
"\\infty" : "\u221e" ,
"\\lnot" : "\u00ac" ,
"\\lozenge" : "\u25ca" ,
"\\measuredangle" : "\u2221" ,
"\\nabla" : "\u2207" ,
"\\natural" : "\u266e" ,
"\\neg" : "\u00ac" ,
"\\nexists" : "\u2204" ,
"\\prime" : "\u2032" ,
"\\sharp" : "\u266f" ,
"\\spadesuit" : "\u2660" ,
"\\sphericalangle" : "\u2222" ,
"\\square" : "\u25a1" ,
"\\surd" : "\u221a" ,
"\\top" : "\u22a4" ,
"\\triangle" : "\u25b5" ,
"\\triangledown" : "\u25bf" ,
"\\varnothing" : "\u2205" ,
"\\aleph" : "\u2135" ,
"\\Bbbk" : "\u1d55C" ,
"\\beth" : "\u2136" ,
"\\circledS" : "\u24c8" ,
"\\complement" : "\u2201" ,
"\\daleth" : "\u2138" ,
"\\ell" : "\u2113" ,
"\\eth" : "\u00f0" ,
"\\Finv" : "\u2132" ,
"\\Game" : "\u2141" ,
"\\gimel" : "\u2137" ,
"\\hbar" : "\u210f" ,
"\\hslash" : "\u210f" ,
"\\Im" : "\u2111" ,
"\\mho" : "\u2127" ,
"\\partial" : "\u2202" ,
"\\Re" : "\u211c" ,
"\\wp" : "\u2118"
};

var g_relation_symbols
= { "=" : "=" ,
"<" : "<" ,
">" : ">" ,
"\\approx" : "\u2248" ,
"\\approxeq" : "\u224a" ,
"\\asymp" : "\u224d" ,
"\\backsim" : "\u223d" ,
"\\backsimeq" : "\u22cd" ,
"\\bumpeq" : "\u224f" ,
"\\Bumpeq" : "\u224e" ,
"\\circeq" : "\u2257" ,
"\\cong" : "\u2245" ,
"\\curlyeqprec" : "\u22de" ,
"\\curlyeqsucc" : "\u22df" ,
"\\doteq" : "\u2250" ,
"\\doteqdot" : "\u2251" ,
"\\eqcirc" : "\u2256" ,
"\\eqsim" : "\u2242" ,
"\\eqslantgtr" : "\u2a96" ,
"\\eqslantless" : "\u2a95" ,
"\\equiv" : "\u2261" ,
"\\fallingdotseq" : "\u2252" ,
"\\ge" : ">=",    //"\u2265" ,
"\\geq" : ">=",    //"\u2265" ,
"\\geqq" : "\u2267" ,
"\\geqslant" : "\u2a7e" ,
"\\gg" : "\u226b" ,
"\\gg" : "\u2aa2" ,
"\\ggg" : "\u22d9" ,
"\\gggtr" : "\u22d9" ,
"\\gnapprox" : "\u2a8a" ,
"\\gneq" : "\u2a88" ,
"\\gneqq" : "\u2269" ,
"\\gnsim" : "\u22e7" ,
"\\gtrapprox" : "\u2a86" ,
"\\gtreqless" : "\u22db" ,
"\\gtreqqless" : "\u2a8c" ,
"\\gtrless" : "\u2277" ,
"\\gtrsim" : "\u2273" ,
"\\gvertneqq" : "\u2269" ,
"\\le" : "<=",    //"\u2264" ,
"\\leq" : "<=",    //"\u2264" ,
"\\leqq" : "\u2266" ,
"\\leqslant" : "\u2a7d" ,
"\\lessapprox" : "\u2a85" ,
"\\lesseqgtr" : "\u22da" ,
"\\lesseqqgtr" : "\u2a8b" ,
"\\lessgtr" : "\u2276" ,
"\\lesssim" : "\u2272" ,
"\\ll" : "\u226a" ,
"\\llless" : "\u22d8" ,
"\\lnapprox" : "\u2a89" ,
"\\lneq" : "\u2a87" ,
"\\lneqq" : "\u2268" ,
"\\lnsim" : "\u22e6" ,
"\\lvertneqq" : "\u2268" ,
"\\ncong" : "\u2247" ,
"\\ne" : "!=",    //"\u2260" ,
"\\neq" : "!=",    //"\u2260" ,
"\\ngeq" : "\u2271" ,
"\\ngeqq" : "\u2267" ,
"\\ngeqslant" : "\u2a7e" ,
"\\ngtr" : "\u226f" ,
"\\nleq" : "\u2270" ,
"\\nleqq" : "\u2266" ,
"\\nleqslant" : "\u2a7d" ,
"\\nless" : "\u226e" ,
"\\nprec" : "\u2280" ,
"\\npreceq" : "\u2aaf" ,
"\\nsim" : "\u2241" ,
"\\nsucc" : "\u2281" ,
"\\nsucceq" : "\u2ab0" ,
"\\prec" : "\u227a" ,
"\\precapprox" : "\u2ab7" ,
"\\preccurlyeq" : "\u227c" ,
"\\preceq" : "\u2aaf" ,
"\\precnapprox" : "\u2ab9" ,
"\\precneqq" : "\u2ab5" ,
"\\precnsim" : "\u22e8" ,
"\\precsim" : "\u227e" ,
"\\risingdotseq" : "\u2253" ,
"\\sim" : "\u223c" ,
"\\simeq" : "\u2243" ,
"\\succ" : "\u227b" ,
"\\succapprox" : "\u2ab8" ,
"\\succcurlyeq" : "\u227d" ,
"\\succeq" : "\u2ab0" ,
"\\succnapprox" : "\u2aba" ,
"\\succneqq" : "\u2ab6" ,
"\\succnsim" : "\u22e9" ,
"\\succsim" : "\u227f" ,
"\\thickapprox" : "\u2248" ,
"\\thicksim" : "\u223c" ,
"\\triangleq" : "\u225c" ,
"\\curvearrowleft" : "\u21b6" ,
"\\curvearrowright" : "\u21b7" ,
"\\downdownarrows" : "\u21ca" ,
"\\downharpoonleft" : "\u21c3" ,
"\\downharpoonright" : "\u21c2" ,
"\\gets" : "\u2190" ,
"\\hookleftarrow" : "\u21a9" ,
"\\hookrightarrow" : "\u21aa" ,
"\\leftarrow" : "\u2190" ,
"\\Leftarrow" : "\u21d0" ,
"\\leftarrowtail" : "\u21a2" ,
"\\leftharpoondown" : "\u21bd" ,
"\\leftharpoonup" : "\u21bc" ,
"\\leftleftarrows" : "\u21c7" ,
"\\leftrightarrow" : "\u2194" ,
"\\leftrightarrows" : "\u21c6" ,
"\\leftrightharpoons" : "\u21cb" ,
"\\leftrightsquigarrow" : "\u21ad" ,
"\\Lleftarrow" : "\u21da" ,
"\\longleftarrow" : "\u27f5" ,
"\\Longleftarrow" : "\u27f8" ,
"\\longleftrightarrow" : "\u27f7" ,
"\\Longleftrightarrow" : "\u27fa" ,
"\\looparrowleft" : "\u21ab" ,
"\\looparrowright" : "\u21ac" ,
"\\Lsh" : "\u21b0" ,
"\\mapsto" : "\u21a6" ,
"\\multimap" : "\u22b8" ,
"\\nearrow" : "\u2197" ,
"\\nleftarrow" : "\u219a" ,
"\\nLeftarrow" : "\u21cd" ,
"\\nleftrightarrow" : "\u21ae" ,
"\\nLeftrightarrow" : "\u21ce" ,
"\\nrightarrow" : "\u219b" ,
"\\nRightarrow" : "\u21cf" ,
"\\nwarrow" : "\u2196" ,
"\\restriction" : "\u21be" ,
"\\rightarrow" : "\u2192" ,
"\\Rightarrow" : "\u21d2" ,
"\\rightarrowtail" : "\u21a3" ,
"\\rightharpoondown" : "\u21c1" ,
"\\rightharpoonup" : "\u21c0" ,
"\\rightleftarrows" : "\u21c4" ,
"\\rightleftharpoons" : "\u21cc" ,
"\\rightrightarrows" : "\u21c9" ,
"\\rightsquigarrow" : "\u219d" ,
"\\Rrightarrow" : "\u21db" ,
"\\Rsh" : "\u21b1" ,
"\\searrow" : "\u2198" ,
"\\swarrow" : "\u2199" ,
"\\to" : "\u2192" ,
"\\twoheadleftarrow" : "\u219e" ,
"\\twoheadrightarrow" : "\u21a0" ,
"\\upharpoonleft" : "\u21bf" ,
"\\upharpoonright" : "\u21be" ,
"\\upuparrows" : "\u21c8" ,
"\\backepsilon" : "\u03f6" ,
"\\because" : "\u2235" ,
"\\between" : "\u226c" ,
"\\blacktriangleleft" : "\u25c0" ,
"\\blacktriangleright" : "\u25b6" ,
"\\bowtie" : "\u22c8" ,
"\\dashv" : "\u22a3" ,
"\\frown" : "\u2323" ,
"\\in" : "\u220a" ,
"\\mid" : "\u2223" ,
"\\models" : "\u22a7" ,
"\\ni" : "\u220b" ,
"\\ni" : "\u220d" ,
"\\nmid" : "\u2224" ,
"\\notin" : "\u2209" ,
"\\nparallel" : "\u2226" ,
"\\nshortmid" : "\u2224" ,
"\\nshortparallel" : "\u2226" ,
"\\nsubseteq" : "\u2286" ,
"\\nsubseteq" : "\u2288" ,
"\\nsubseteqq" : "\u2ac5" ,
"\\nsupseteq" : "\u2287" ,
"\\nsupseteq" : "\u2289" ,
"\\nsupseteqq" : "\u2ac6" ,
"\\ntriangleleft" : "\u22ea" ,
"\\ntrianglelefteq" : "\u22ec" ,
"\\ntriangleright" : "\u22eb" ,
"\\ntrianglerighteq" : "\u22ed" ,
"\\nvdash" : "\u22ac" ,
"\\nvDash" : "\u22ad" ,
"\\nVdash" : "\u22ae" ,
"\\nVDash" : "\u22af" ,
"\\owns" : "\u220d" ,
"\\parallel" : "\u2225" ,
"\\perp" : "\u22a5" ,
"\\pitchfork" : "\u22d4" ,
"\\propto" : "\u221d" ,
"\\shortmid" : "\u2223" ,
"\\shortparallel" : "\u2225" ,
"\\smallfrown" : "\u2322" ,
"\\smallsmile" : "\u2323" ,
"\\smile" : "\u2323" ,
"\\sqsubset" : "\u228f" ,
"\\sqsubseteq" : "\u2291" ,
"\\sqsupset" : "\u2290" ,
"\\sqsupseteq" : "\u2292" ,
"\\subset" : "\u2282" ,
"\\Subset" : "\u22d0" ,
"\\subseteq" : "\u2286" ,
"\\subseteqq" : "\u2ac5" ,
"\\subsetneq" : "\u228a" ,
"\\subsetneqq" : "\u2acb" ,
"\\supset" : "\u2283" ,
"\\Supset" : "\u22d1" ,
"\\supseteq" : "\u2287" ,
"\\supseteqq" : "\u2ac6" ,
"\\supsetneq" : "\u228b" ,
"\\supsetneqq" : "\u2acc" ,
"\\therefore" : "\u2234" ,
"\\trianglelefteq" : "\u22b4" ,
"\\trianglerighteq" : "\u22b5" ,
"\\varpropto" : "\u221d" ,
"\\varsubsetneq" : "\u228a" ,
"\\varsubsetneqq" : "\u2acb" ,
"\\varsupsetneq" : "\u228b" ,
"\\varsupsetneqq" : "\u2acc" ,
"\\vartriangle" : "\u25b5" ,
"\\vartriangleleft" : "\u22b2" ,
"\\vartriangleright" : "\u22b3" ,
"\\vdash" : "\u22a2" ,
"\\vDash" : "\u22a8" ,
"\\Vdash" : "\u22a9" ,
"\\Vvdash" : "\u22aa"
}
;
var g_named_identifiers
= { "\\arccos" : "arccos" ,
"\\arcsin" : "arcsin" ,
"\\arctan" : "arctan" ,
"\\arg" : "arg" ,
"\\cos" : "cos" ,
"\\cosh" : "cosh" ,
"\\cot" : "cot" ,
"\\coth" : "coth" ,
"\\csc" : "csc" ,
"\\deg" : "deg" ,
"\\det" : "det" ,
"\\dim" : "dim" ,
"\\exp" : "exp" ,
"\\gcd" : "gcd" ,
"\\hom" : "hom" ,
"\\ker" : "ker" ,
"\\lg" : "lg" ,
"\\ln" : "ln" ,
"\\log" : "log" ,
"\\Pr" : "Pr" ,
"\\sec" : "sec" ,
"\\sin" : "sin" ,
"\\sinh" : "sinh" ,
"\\tan" : "tan" ,
"\\tanh" : "tanh" ,
"\\inf" : "inf" ,
"\\injlim" : "inj lim" ,
"\\lim" : "lim" ,
"\\liminf" : "lim inf" ,
"\\limsup" : "lum sup" ,
"\\max" : "max" ,
"\\min" : "min" ,
"\\projlim" : "proj lim" ,
"\\sup" : "sup" ,
"\\alpha" : "\u03b1" ,
"\\beta" : "\u03b2" ,
"\\chi" : "\u03c7" ,
"\\delta" : "\u03b4" ,
"\\Delta" : "\u0394" ,
"\\digamma" : "\u03dd" ,
"\\epsilon" : "\u03f5" ,
"\\eta" : "\u03b7" ,
"\\gamma" : "\u03b3" ,
"\\Gamma" : "\u0393" ,
"\\iota" : "\u03b9" ,
"\\kappa" : "\u03ba" ,
"\\lambda" : "\u03bb" ,
"\\Lambda" : "\u039b" ,
"\\mu" : "\u03bc" ,
"\\nu" : "\u03bd" ,
"\\omega" : "\u03c9" ,
"\\Omega" : "\u03a9" ,
"\\phi" : "\u03c6" ,
"\\Phi" : "\u03a6" ,
"\\pi" : "\u03c0" ,
"\\Pi" : "\u03a0" ,
"\\psi" : "\u03c8" ,
"\\Psi" : "\u03a8" ,
"\\rho" : "\u03c1" ,
"\\sigma" : "\\sigma", //"\u03c3" ,
"\\Sigma" : "\\sigma", //"\u03a3" ,
"\\tau" : "\u03c4" ,
"\\theta" : "\u03b8" ,
"\\Theta" : "\u0398" ,
"\\upsilon" : "\u03c5" ,
"\\Upsilon" : "\u03d2" ,
"\\varepsilon" : "\u03b5" ,
"\\varkappa" : "\u03f0" ,
"\\varphi" : "\u03d5" ,
"\\varpi" : "\u03d6" ,
"\\varrho" : "\u03f1" ,
"\\varsigma" : "\u03c2" ,
"\\vartheta" : "\u03d1" ,
"\\xi" : "\u03be" ,
"\\Xi" : "\u039e" ,
"\\zeta" : "\u03b6" ,
"a" : "a" ,
"b" : "b" ,
"c" : "c" ,
"d" : "d" ,
"e" : "e" ,
"f" : "f" ,
"g" : "g" ,
"h" : "h" ,
"i" : "i" ,
"j" : "j" ,
"k" : "k" ,
"l" : "l" ,
"m" : "m" ,
"n" : "n" ,
"o" : "o" ,
"p" : "p" ,
"q" : "q" ,
"r" : "r" ,
"s" : "s" ,
"t" : "t" ,
"u" : "u" ,
"v" : "v" ,
"w" : "w" ,
"x" : "x" ,
"y" : "y" ,
"z" : "z" ,
"A" : "A" ,
"B" : "B" ,
"C" : "C" ,
"D" : "D" ,
"E" : "E" ,
"F" : "F" ,
"G" : "G" ,
"H" : "H" ,
"I" : "I" ,
"J" : "J" ,
"K" : "K" ,
"L" : "L" ,
"M" : "M" ,
"N" : "N" ,
"O" : "O" ,
"P" : "P" ,
"Q" : "Q" ,
"R" : "R" ,
"S" : "S" ,
"T" : "T" ,
"U" : "U" ,
"V" : "V" ,
"W" : "W" ,
"X" : "X" ,
"Y" : "Y" ,
"Z" : "Z" ,
"\\vdots" : "\u22ee" ,
"\\hdots" : "\\@", //"\u2026" ,
"\\ldots" : "\\@", //"\u2026" ,
"\\dots" : "\\@", //"\u2026" ,
"\\cdots" : "\\@", //"\u00b7\u00b7\u00b7" ,
"\\dotsb" : "\u00b7\u00b7\u00b7" ,
"\\dotsc" : "\u2026" ,
"\\dotsi" : "\u22c5\u22c5\u22c5" ,
"\\dotsm" : "\u22c5\u22c5\u22c5" ,
"\\dotso" : "\u2026" ,
"\\ddots" : "\u22f1"
}
;
var g_word_operators
= { "\\arccos" : "arccos" ,
"\\arcsin" : "arcsin" ,
"\\arctan" : "arctan" ,
"\\arg" : "arg" ,
"\\cos" : "cos" ,
"\\cosh" : "cosh" ,
"\\cot" : "cot" ,
"\\coth" : "coth" ,
"\\csc" : "csc" ,
"\\deg" : "deg" ,
"\\det" : "det" ,
"\\dim" : "dim" ,
"\\exp" : "exp" ,
"\\gcd" : "gcd" ,
"\\hom" : "hom" ,
"\\ker" : "ker" ,
"\\lg" : "lg" ,
"\\ln" : "ln" ,
"\\log" : "log" ,
"\\Pr" : "Pr" ,
"\\sec" : "sec" ,
"\\sin" : "sin" ,
"\\sinh" : "sinh" ,
"\\tan" : "tan" ,
"\\tanh" : "tanh"
}
;
var g_big_word_operators
= { "\\inf" : "inf" ,
"\\injlim" : "inj lim" ,
"\\lim" : "lim" ,
"\\liminf" : "lim inf" ,
"\\limsup" : "lum sup" ,
"\\max" : "max" ,
"\\min" : "min" ,
"\\projlim" : "proj lim" ,
"\\sup" : "sup"
}
;
var g_greek_letters
= { "\\alpha" : "\u03b1" ,
"\\beta" : "\u03b2" ,
"\\chi" : "\u03c7" ,
"\\delta" : "\u03b4" ,
"\\Delta" : "\u0394" ,
"\\digamma" : "\u03dd" ,
"\\epsilon" : "\u03f5" ,
"\\eta" : "\u03b7" ,
"\\gamma" : "\u03b3" ,
"\\Gamma" : "\u0393" ,
"\\iota" : "\u03b9" ,
"\\kappa" : "\u03ba" ,
"\\lambda" : "\u03bb" ,
"\\Lambda" : "\u039b" ,
"\\mu" : "\u03bc" ,
"\\nu" : "\u03bd" ,
"\\omega" : "\u03c9" ,
"\\Omega" : "\u03a9" ,
"\\phi" : "\u03c6" ,
"\\Phi" : "\u03a6" ,
"\\pi" : "\u03c0" ,
"\\Pi" : "\u03a0" ,
"\\psi" : "\u03c8" ,
"\\Psi" : "\u03a8" ,
"\\rho" : "\u03c1" ,
"\\sigma" : "\\sigma", //"\u03c3" ,
"\\Sigma" : "\\sigma", //"\u03a3" ,
"\\tau" : "\u03c4" ,
"\\theta" : "\u03b8" ,
"\\Theta" : "\u0398" ,
"\\upsilon" : "\u03c5" ,
"\\Upsilon" : "\u03d2" ,
"\\varepsilon" : "\u03b5" ,
"\\varkappa" : "\u03f0" ,
"\\varphi" : "\u03d5" ,
"\\varpi" : "\u03d6" ,
"\\varrho" : "\u03f1" ,
"\\varsigma" : "\u03c2" ,
"\\vartheta" : "\u03d1" ,
"\\xi" : "\u03be" ,
"\\Xi" : "\u039e" ,
"\\zeta" : "\u03b6"
};

function v_fraction_to_mathml (tokens )
{
    var v_numerator = v_piece_to_mathml (tokens );
    var v_denominator = v_piece_to_mathml (tokens );

    if (!v_numerator || !v_denominator)
        return result_element( "error" ,0 , -999999 , 1 ) ;

//*  latex user should taking care of using "(" and ")" already, this code just doubles the effort:

    var v_openBracket = result_element('mtext',0,'(');
    var v_closeBracket = result_element('mtext',0,')');

    if (v_numerator.tag == 'mrow')
    {
        var v_upper = v_numerator;
        v_numerator = result_element( "mtext" ,0 , v_openBracket,
                                    v_upper, v_closeBracket);
    }
//*/
    var forwardSlash = (v_denominator.content
                        && (v_denominator.content == '/' || v_denominator.content == "\u2215"));
    if (!forwardSlash) // denominator doesn't have it, so we append it to the numerator:
    {
        var v_divider = result_element('mtext',0,'/');
        result_element_append(v_numerator, v_divider);
    }
//*
    if (v_denominator.tag == 'mrow')
    {
        var v_lower = v_denominator;
        v_denominator = result_element( "mtext" ,0 , v_openBracket,
                                    v_lower, v_closeBracket);
    }
//*/
    return result_element( "mfrac" ,0 , v_numerator , v_denominator ) ;
}

function v_binom_to_mathml (tokens )
{
    var v_top = v_piece_to_mathml (tokens ) ;
    v_top.content.strRightDelim = '/';

    var v_bottom = v_piece_to_mathml (tokens ) ;

    return result_element( "mrow" ,0 ,
                          result_element( "mo" ,0 , "(" ) ,
                          result_element( "mfrac" , 1, "linethickness",
                                         "0" ,
                                         v_top ,
                                         v_bottom ),
                          result_element( "mo" ,0 , ")" )
                        );
}

function v_sqrt_to_mathml (tokens )
{
    var v_index = v_optional_arg_to_mathml (tokens ) ;
    var v_object = v_piece_to_mathml (tokens ) ;

    var v_sqrt = result_element( "mtext" ,0 , 'sqrt') ;
    var v_nroot = result_element( "mtext" ,0 , 'nroot') ;
    var v_beginBracket = result_element( "mtext" ,0 , '(' ) ;
    var v_comma = result_element( "mtext" ,0 , ',' ) ;
    var v_endBracket = result_element( "mtext" ,0 , ')' ) ;

    //result_element_append(v_result, v_endBracket);

    var v_result;
    if( ( v_index != null ) ) { // nroot:
        v_result = result_element( "mroot" ,0, v_nroot, v_beginBracket, v_object, v_comma, v_index, v_endBracket ) ;
    }
    else { // sqrt:
        v_result = result_element( "msqrt" ,0, v_sqrt, v_beginBracket, v_object, v_endBracket) ;
    }

    return v_result;
}

function v_parenthesized_operator (tokens, v_word )
{
    var v_object = v_piece_to_mathml (tokens ) ;

    if( ( v_word != null ) ) {
        return result_element( "mrow" ,0 ,
                              result_element( "mo" ,0 , "(" ),
                              result_element( "mo" ,0 , v_word ),
                              v_object,
                              result_element( "mo" ,0 , ")" )
                            );
    }
    else {
        return result_element( "mrow" ,0 ,
                              result_element( "mo" ,0 , "(" ),
                              v_object,
                              result_element( "mo" ,0 , ")" )
                            );
    }
}

function v_operatorname_to_mathml (tokens ) {
 var v_result = result_element( "mo" ,0 , tokens.list[tokens.index] ) ;
 tokens.index++;
 return v_result ;
}

function v_displaystyle_to_mathml (tokens ) {
 var v_result = v_subexpr_chain_to_mathml (tokens , g_hard_stop_tokens
) ;
 return result_element( "mstyle" , 2
, "displaystyle" , "true" , "scriptlevel" , "0" , v_result ) ;
}

function v_displaymath_to_mathml (tokens ) {
 var v_result = v_subexpr_chain_to_mathml (tokens , g_hard_stop_tokens
) ;
  v_finish_latex_block (tokens );
 return result_element( "mstyle" , 2
, "displaystyle" , "true" , "scriptlevel" , "0" , v_result ) ;
}

function v_font_to_mathml (tokens , v_font_name ) {
 if( ( tokens.list[tokens.index] != "{" ) ) {
  var v_result = result_element( "mi" , 1
, "mathvariant" , v_font_name , tokens.list[tokens.index] ) ;
  if( ( v_font_name == "normal" ) ) {
   result_set_attr(
v_result , "fontstyle" , "normal" );
  }
  tokens.index++;
  return v_result ;
 }
 else {
  var v_result = v_piece_to_mathml (tokens ) ;
  result_set_attr(
v_result , "mathvariant" , v_font_name );
  if( ( v_font_name == "normal" ) ) {
   result_set_attr(
v_result , "fontstyle" , "normal" );
  }
  return v_result ;
 }
}

function v_old_font_to_mathml (tokens , v_font_name )
{
    return result_element( "mstyle" , 2, "mathvariant" , v_font_name , "fontstyle" ,
                          ( ( v_font_name == "normal" ) ? "normal" : null ) ,
                          v_subexpr_chain_to_mathml (tokens , g_hard_stop_tokens
) ) ;
}

function v_size_to_mathml (tokens , v_min_size , v_max_size ) {
 var v_result = v_piece_to_mathml (tokens ) ;
 result_set_attr(
v_result , "minsize" , v_min_size );
 result_set_attr(
v_result , "maxsize" , v_max_size );
 return v_result ;
}

function v_accent_to_mathml (tokens , v_char ) {
 return result_element( "mover" , 1, "accent" , "true" ,
                        v_piece_to_mathml (tokens ) , result_element( "mo" ,0 , v_char ) ) ;
}

function v_matrix_to_mathml (tokens , v_open_delim , v_close_delim ) {
 var v_mtable = v_matrix_to_mtable (tokens , result_element( "mtable" ,0) ) ;
 if( ( ( v_open_delim != null )  ||  ( v_close_delim != null ) ) ) {
  var v_mrow = result_element( "mrow" ,0) ;
  if( ( v_open_delim != null ) ) {
   result_element_append( v_mrow , result_element( "mo" ,0 , v_open_delim ) );
  }
  result_element_append( v_mrow , v_mtable );
  if( ( v_close_delim != null ) ) {
   result_element_append( v_mrow , result_element( "mo" ,0 , v_close_delim ) );
  }
  return v_mrow ;
 }
 else {
  return v_mtable ;
 }
}

function v_array_to_mathml (tokens ) {
 var v_mtable = result_element( "mtable" ,0) ;
 if( ( tokens.list[tokens.index] == "{" ) ) {
  tokens.index++;
  while( ( ( tokens.list[tokens.index] != null )  &&  ( tokens.list[tokens.index] != "}" ) ) ) {
   if( ( tokens.list[tokens.index] == "c" ) ) {
    result_append_attr(
v_mtable , "columnalign" , "center " );
   }
   else if( ( tokens.list[tokens.index] == "l" ) ) {
    result_append_attr(
v_mtable , "columnalign" , "left " );
   }
   else if( ( tokens.list[tokens.index] == "r" ) ) {
    result_append_attr(
v_mtable , "columnalign" , "right " );
   }
   tokens.index++;
  }
  if( ( tokens.list[tokens.index] != null ) ) {
   tokens.index++;
  }
 }
 return v_matrix_to_mtable (tokens , v_mtable ) ;
}

function v_matrix_to_mtable (tokens , v_mtable ) {
 var v_mtr = result_element( "mtr" ,0) ;
 var v_mtd = result_element( "mtd" ,0) ;
 var v_token = tokens.list[tokens.index] ;
 result_element_append( v_mtable , v_mtr );
 result_element_append( v_mtr , v_mtd );
 while( ( ( v_token != null )  &&  ( v_token != "\\end" ) ) ) {
  if( ( v_token == "\\\\" ) ) {
    v_mtr = result_element( "mtr" ,0) ;
    v_mtd = result_element( "mtd" ,0) ;
   result_element_append( v_mtable , v_mtr );
   result_element_append( v_mtr , v_mtd );
   tokens.index++;
  }
  else if( ( v_token == "&" ) ) {
    v_mtd = result_element( "mtd" ,0) ;
   result_element_append( v_mtr , v_mtd );
   tokens.index++;
  }
  else {
   result_element_append( v_mtd , v_subexpr_chain_to_mathml (tokens , g_hard_stop_tokens
) );
  }
   v_token = tokens.list[tokens.index] ;
 }
  v_finish_latex_block (tokens );
 return v_mtable ;
}

function v_over_to_mathml (tokens , v_char ) {
    return result_element( "mover" ,0 ,
                          v_piece_to_mathml(tokens ),
                          result_element( "mo" ,0 , v_char ) ) ;
}

function v_under_to_mathml (tokens , v_char ) {
    return result_element( "munder" ,0 ,
                          v_piece_to_mathml(tokens ),
                          result_element( "mo" ,0 , v_char ) ) ;
}

function v_delimiter_to_mathml (tokens , v_end_command , v_min_size , v_max_size )
{
    var v_mrow = result_element( "mrow" ,0) ;

    result_element_append( v_mrow , result_element( "mo" , 2, "minsize" , v_min_size , "maxsize" , v_max_size,
                                                   v_read_delimiter(tokens ) )
                          );

    result_element_append( v_mrow , v_subexpr_chain_to_mathml(tokens, g_hard_stop_tokens) );

    if( ( tokens.list[tokens.index] != v_end_command ) )
    {
        return v_mrow ;
    }

    tokens.index++;
    result_element_append( v_mrow , result_element( "mo" , 2, "minsize" , v_min_size , "maxsize" , v_max_size,
                                                   v_read_delimiter (tokens ) )
                          );
    return v_mrow ;
}

function v_read_delimiter (tokens ) {
 var v_token = tokens.list[tokens.index] ;
 if( ( v_token == null ) ) {
  throw "unexpected eof" ;
 }
 else if( ( v_token == "." ) ) {
  tokens.index++;
  return "" ;
 }
 else if( ( v_token == "<" ) ) {
  tokens.index++;
  return "\u2329" ;
 }
 else if( ( v_token == ">" ) ) {
  tokens.index++;
  return "\u232a" ;
 }
 else if( v_token in g_punct_and_space )
 {
  tokens.index++;
  return g_punct_and_space[ v_token ] ;
 }
 else if( v_token in g_left_delimiters) {
  tokens.index++;
  return g_left_delimiters[ v_token ] ;
 }
 else if( v_token in g_right_delimiters) {
  tokens.index++;
  return g_right_delimiters[ v_token ] ;
 }
 else if( ( v_token in g_operatorSymbols
) ) {
  tokens.index++;
  return g_operatorSymbols[ v_token ] ;
 }
 else {
  throw "invalid delimiter" ;
 }
}

function v_latex_block_to_mathml (tokens ) {
  v_cmd = tokens.list[tokens.index] ;
 if( ( v_cmd in g_tex_environments
) ) {
  tokens.index++;
  return g_tex_environments
[ v_cmd ] (tokens ) ;
 }
 else {
  throw "unknown command" ;
 }
}
function v_finish_latex_block (tokens ) {
 if( ( tokens.list[tokens.index] == null ) ) {
  throw "unexpected eof" ;
 }
 tokens.index++;
 tokens.index++;
}
function v_combining_to_mathml (tokens , v_char ) {
    var v_base = tokens.list[tokens.index] ;
    tokens.index++;
    return result_element( "mo" ,0 , v_base , v_char ) ;
}

var g_char_escape_codes
= { "93" : "#"
};

function v_char_escape_to_mathml (tokens ) {
 var v_result = null ;
 if( ( tokens.list[tokens.index] in g_char_escape_codes
) ) {
   v_result = result_element( "mtext" ,0 , g_char_escape_codes
[ tokens.list[tokens.index] ] ) ;
 }
 else {
   v_result = result_element( "merror" ,0 , "\\char" , tokens.list[tokens.index] ) ;
 }
 tokens.index++;
 return v_result ;
}

function v_text_to_mathml (tokens ) {
 if( ( tokens.list[tokens.index] != "{" ) ) {
  var v_result = result_element( "mtext" ,0 , tokens.list[tokens.index] ) ;
  tokens.index++;
  return v_result ;
 }
 tokens.index++;
 var v_result = null ;
 var v_mrow = null ;
 var v_node = null ;
 while( ( tokens.list[tokens.index] != null ) ) {
  if( ( tokens.list[tokens.index] == "}" ) ) {
   tokens.index++;
   return v_result ;
  }
  else if( ( tokens.list[tokens.index] == "$" ) ) {
   tokens.index++;
    v_node = v_subexpr_chain_to_mathml (tokens , g_hard_stop_tokens
) ;
   tokens.index++;
  }
  else {
    v_node = result_element( "mtext" ,0 , tokens.list[tokens.index] ) ;
   tokens.index++;
  }
  if( ( v_mrow != null ) ) {
   result_element_append( v_mrow , v_node );
  }
  else if( ( v_result != null ) ) {
    v_mrow = result_element( "mrow" ,0 , v_result , v_node ) ;
    v_result = v_mrow ;
  }
  else {
    v_result = v_node ;
  }
 }
 return v_result ;
}

var g_tex_commands
= { "\\frac" : v_fraction_to_mathml ,
"\\dfrac" : v_fraction_to_mathml ,
"\\tfrac" : v_fraction_to_mathml ,
"\\binom" : v_binom_to_mathml ,
"\\sqrt" : v_sqrt_to_mathml ,
"\\operatorname" : v_operatorname_to_mathml ,
"\\displaystyle" : v_displaystyle_to_mathml ,
"\\pod" : function(tokens ) { return v_parenthesized_operator (tokens , null ) ; } ,
"\\pmod" : function(tokens ) { return v_parenthesized_operator (tokens , "mod" ) ; } ,
"\\boldsymbol" : function(tokens ) { return v_font_to_mathml (tokens , "bold" ) ; } ,
"\\bold" : function(tokens ) { return v_font_to_mathml (tokens , "bold" ) ; } ,
"\\Bbb" : function(tokens ) { return v_font_to_mathml (tokens , "double-struck" ) ; } ,
"\\mathbb" : function(tokens ) { return v_font_to_mathml (tokens , "double-struck" ) ; } ,
"\\mathbbmss" : function(tokens ) { return v_font_to_mathml (tokens , "double-struck" ) ; } ,
"\\mathbf" : function(tokens ) { return v_font_to_mathml (tokens , "bold" ) ; } ,
"\\mathop" : function(tokens ) { return v_font_to_mathml (tokens , "normal" ) ; } ,
"\\mathrm" : function(tokens ) { return v_font_to_mathml (tokens , "normal" ) ; } ,
"\\mathfrak" : function(tokens ) { return v_font_to_mathml (tokens , "fraktur" ) ; } ,
"\\mathit" : function(tokens ) { return v_font_to_mathml (tokens , "italic" ) ; } ,
"\\mathscr" : function(tokens ) { return v_font_to_mathml (tokens , "script" ) ; } ,
"\\mathcal" : function(tokens ) { return v_font_to_mathml (tokens , "script" ) ; } ,
"\\mathsf" : function(tokens ) { return v_font_to_mathml (tokens , "sans-serif" ) ; } ,
"\\mathtt" : function(tokens ) { return v_font_to_mathml (tokens , "monospace" ) ; } ,
"\\EuScript" : function(tokens ) { return v_font_to_mathml (tokens , "script" ) ; } ,
"\\bf" : function(tokens ) { return v_old_font_to_mathml (tokens , "bold" ) ; } ,
"\\rm" : function(tokens ) { return v_old_font_to_mathml (tokens , "normal" ) ; } ,
"\\big" : function(tokens ) { return v_size_to_mathml (tokens , "2" , "2" ) ; } ,
"\\Big" : function(tokens ) { return v_size_to_mathml (tokens , "3" , "3" ) ; } ,
"\\bigg" : function(tokens ) { return v_size_to_mathml (tokens , "4" , "4" ) ; } ,
"\\Bigg" : function(tokens ) { return v_size_to_mathml (tokens , "5" , "5" ) ; } ,
"\\acute" : function(tokens ) { return v_accent_to_mathml (tokens , "\u0301" ) ; } ,
"\\grave" : function(tokens ) { return v_accent_to_mathml (tokens , "\u0300" ) ; } ,
"\\tilde" : function(tokens ) { return v_accent_to_mathml (tokens , "\u0303" ) ; } ,
"\\bar" : function(tokens ) { return v_accent_to_mathml (tokens , "\u0304" ) ; } ,
"\\breve" : function(tokens ) { return v_accent_to_mathml (tokens , "\u0306" ) ; } ,
"\\check" : function(tokens ) { return v_accent_to_mathml (tokens , "\u030c" ) ; } ,
"\\hat" : function(tokens ) { return v_accent_to_mathml (tokens , "\u0302" ) ; } ,
"\\vec" : function(tokens ) { return v_accent_to_mathml (tokens , "\u20d7" ) ; } ,
"\\dot" : function(tokens ) { return v_accent_to_mathml (tokens , "\u0307" ) ; } ,
"\\ddot" : function(tokens ) { return v_accent_to_mathml (tokens , "\u0308" ) ; } ,
"\\dddot" : function(tokens ) { return v_accent_to_mathml (tokens , "\u20db" ) ; } ,
"\\underbrace" : function(tokens ) { return v_under_to_mathml (tokens , "\ufe38" ) ; } ,
"\\overbrace" : function(tokens ) { return v_over_to_mathml (tokens , "\ufe37" ) ; } ,
"\\underline" : function(tokens ) { return v_under_to_mathml (tokens , "\u0332" ) ; } ,
"\\overline" : function(tokens ) { return v_over_to_mathml (tokens , "\u00af" ) ; } ,
"\\widetilde" : function(tokens ) { return v_over_to_mathml (tokens , "\u0303" ) ; } ,
"\\widehat" : function(tokens ) { return v_over_to_mathml (tokens , "\u0302" ) ; } ,
"\\not" : function(tokens ) { return v_combining_to_mathml (tokens , "\u0338" ) ; } ,
"\\left" : function(tokens ) { return v_delimiter_to_mathml (tokens , "\\right" , "1" , null ) ; } ,
"\\bigl" : function(tokens ) { return v_delimiter_to_mathml (tokens , "\\bigr" , "2" , "2" ) ; } ,
"\\Bigl" : function(tokens ) { return v_delimiter_to_mathml (tokens , "\\Bigr" , "3" , "3" ) ; } ,
"\\biggl" : function(tokens ) { return v_delimiter_to_mathml (tokens , "\\biggr" , "4" , "4" ) ; } ,
"\\Biggl" : function(tokens ) { return v_delimiter_to_mathml (tokens , "\\Biggr" , "5" , "5" ) ; } ,
"\\char" : v_char_escape_to_mathml ,
"\\!" : function(tokens ) { return null ; } ,
"\\text" : v_text_to_mathml ,
"\\textnormal" : v_text_to_mathml ,
"\\textrm" : v_text_to_mathml ,
"\\textsl" : v_text_to_mathml ,
"\\textit" : v_text_to_mathml ,
"\\texttt" : v_text_to_mathml ,
"\\textbf" : v_text_to_mathml ,
"\\hbox" : v_text_to_mathml ,
"\\mbox" : v_text_to_mathml ,
"\\begin" : v_latex_block_to_mathml
};

var g_tex_environments
= { "smallmatrix" : function(tokens ) { return v_matrix_to_mathml (tokens , "(" , ")" ) ; } ,
"pmatrix" : function(tokens ) { return v_matrix_to_mathml (tokens , "(" , ")" ) ; } ,
"bmatrix" : function(tokens ) { return v_matrix_to_mathml (tokens , "[" , "]" ) ; } ,
"Bmatrix" : function(tokens ) { return v_matrix_to_mathml (tokens , "{" , "}" ) ; } ,
"vmatrix" : function(tokens ) { return v_matrix_to_mathml (tokens , "|" , "|" ) ; } ,
"Vmatrix" : function(tokens ) { return v_matrix_to_mathml (tokens , "\u2016" , "\u2016" ) ; } ,
"cases" : function(tokens ) { return v_matrix_to_mathml (tokens , "{" , null ) ; } ,
"array" : v_array_to_mathml ,
"displaymath" : v_displaymath_to_mathml
};

var g_limit_commands
= { "\\bigcap" : "\u22c2" ,
"\\bigcup" : "\u22c3" ,
"\\bigodot" : "\u2a00" ,
"\\bigoplus" : "\u2a01" ,
"\\bigotimes" : "\u2a02" ,
"\\bigsqcup" : "\u2a06" ,
"\\biguplus" : "\u2a04" ,
"\\bigvee" : "\u22c1" ,
"\\bigwedge" : "\u22c0" ,
"\\coprod" : "\u2210" ,
"\\prod" : "\u220f" ,
"\\sum" : "\u2211" ,
"\\inf" : "inf" ,
"\\injlim" : "inj lim" ,
"\\lim" : "lim" ,
"\\liminf" : "lim inf" ,
"\\limsup" : "lum sup" ,
"\\max" : "max" ,
"\\min" : "min" ,
"\\projlim" : "proj lim" ,
"\\sup" : "sup" ,
"\\underbrace" : null ,
"\\overbrace" : null ,
"\\underline" : null ,
"\\overline" : null
};

/***********************************************************************
  Modified by: Nick Feng    12/20/2011
***********************************************************************/
function v_piece_to_mathml (tokens )
{
    var v_token = tokens.list[tokens.index];
    var v_tokenIndex = tokens.index;
    var v_result = null ;

    if( v_token == "{" ) // process a subgroup nodes:
    {
//        tokens.bracketEntranceLevel++;
        tokens.index++;
        v_result = v_subexpr_chain_to_mathml(tokens , g_hard_stop_tokens) ;

        if( tokens.list[tokens.index] == "}" )
            tokens.index++;
    }
    else // the following process all inserts a 'mo' tag node with the symbol content
        if( v_token in g_relation_symbols )
    {
        v_result = result_element( "mo" ,0 , g_relation_symbols[ v_token ] ) ;
        tokens.index++;
    }
    else if( v_token in g_operatorSymbols)
    {
        v_result = result_element( "mo" ,0 , g_operatorSymbols[ v_token ] ) ;
        tokens.index++;
    }
    else if( v_token in g_left_delimiters )
    {
        v_result = result_element( "mo" ,0 , g_left_delimiters[ v_token ] ) ;
        tokens.index++;
    }
    else if( v_token in g_right_delimiters )
    {
        v_result = result_element( "mo" ,0 , g_right_delimiters[ v_token ] ) ;
        tokens.index++;
    }
    else // insert a 'mi' tag node with the symbol content:
        if( v_token in g_word_operators ) // such as log
    {
        v_result = result_element( "mi" , 1, "mathvariant" , "normal" ,
                                  g_word_operators[ v_token ] ) ;
        tokens.index++;

        // add open paren if not already has one:
        var endTeststr = tokens.index+1;
        if (tokens.list.length > endTeststr)
        {
            //var str = tokens.list.slice(tokens.index, endTeststr);
            if ( tokens.list[tokens.index] != '\\left' && tokens.list[endTeststr] != '(')
            {
                var openBracket = result_element('mtext',0, '(');
                v_result = result_element( "mrow",0, v_result, openBracket);
            }
        }
    }
    else if( v_token in g_greek_letters )
    {
        v_result = result_element( "mi" , 1, "fontstyle" , "normal" , g_greek_letters[ v_token ] ) ;
        tokens.index++;
    }
    else if( v_token in g_named_identifiers )
    {
        v_result = result_element( "mi" ,0 , g_named_identifiers[ v_token ] ) ;
        tokens.index++;
    }
    else // insert a 'mtext' tag node with the symbol content:
        if( v_token in g_punct_and_space )
    {
        v_result = result_element( "mtext" ,0 , g_punct_and_space[ v_token ] ) ;
        tokens.index++;
    }
    else
        if( v_token in g_tex_commands )
    {
        tokens.index++;
        v_result = g_tex_commands[v_token]( tokens );
    }
    else // insert a 'mn' tag node with the symbol content:
    {
        v_result = result_element( "mn" ,0 , v_token ) ;
        tokens.index++;
    }

    return v_result ;
}

/********************************************************************************
 Check superscript and subscript condition
 Nick Feng  12/14/2011
********************************************************************************/
function isSuperSubScript(tokens)
{
    return (
         ( tokens.list[tokens.length <=tokens.index + 0 ? tokens.length-1 : tokens.index+ 0 ] == "{" )
      && ( tokens.list[tokens.length <=tokens.index + 1 ? tokens.length-1 : tokens.index+ 1 ]== "}" )
      && ( ( tokens.list[tokens.length<=tokens.index+ 2 ? tokens.length-1 : tokens.index+ 2 ]== "_" )
           ||
           ( tokens.list[tokens.length<=tokens.index+ 2 ? tokens.length-1 : tokens.index+ 2 ]== "^" )
         )
      );
}

function isNumberStr(str)
{
    return (str >= '0' && str <= '9');
}

/**********************************************************************
 This function handles the case that the parser doesn't interpret the
 single digit log base or exponent number correctly.
 At the entry point the single digit base and the number behind it already
 wrongly processed as one piece of content.
 The new content consists of the separated single digit and a pair of
 brackets around it, along with the corrected number behind.
 The new content is inserted back to the token list and the token index
 is set back so that the new content will be processed to generate
 correct result.
**********************************************************************/
function singleDigitScriptLogPow(tokens, v_subscript)
{
    if (tokens.index-1 >= 0
        && tokens.list[tokens.index-1] != '}' // multi-digit base is already handled correctly witha {} grouping
        && v_subscript.content.length === 1
        && isNumberStr(v_subscript.content[0])) // token separate letters correctly
    {
        var singleBase = v_subscript.content[0];
        var correctContent = singleBase.slice(1);  // only wants the rest of the content
        singleBase = singleBase.slice(0,1); // extract the 1st digit as log base

//        v_subscript = result_element('mrow', 0, singleBase, ',', correctContent, ')' );

        var startIndex = tokens.index-1;
        var index = startIndex;
//        tokens.list.splice(index, 0, '('); // open paren for strKI
//        index++;
        tokens.list.splice(index, 0, '{'); // insert the single digit base
        index++;
        tokens.list.splice(index, 0, singleBase); // insert the single digit base
        index++;
        tokens.list.splice(index, 0, '}'); // insert the single digit base
        index++;
        tokens.list[index] = correctContent;

        tokens.index = startIndex; // set index to left delimitor of the single digit base
        v_subscript = v_piece_to_mathml(tokens ); // reprocess the content
    }

    return v_subscript;
}

/**********************************************************************
 Input:
    tokens - tokens list with index pointing to the subscript token to
             be processed.

 return:
    if (logrithm) -
        processed log combination.
    else -
        the v_subscript.
**********************************************************************/
function processSubsript(tokens, v_result)
{
    var v_comma = result_element( "mtext" ,0 , ',' ) ;
    var v_endBracket = result_element( "mtext" ,0 , ')' ) ;
    var v_2ndPart, v_subscript;

    tokens.index++;

    if (tokens.list[tokens.index-2] == '\\log')
    {
        v_subscript = v_piece_to_mathml(tokens );
        v_subscript = singleDigitScriptLogPow(tokens, v_subscript);

        v_2ndPart = v_subexpr_to_mathml(tokens); //v_piece_to_mathml(tokens ); //

        v_subscript = result_element( "mlog" ,0 ,
//                                           v_beginBracket,
                                           v_subscript, v_comma, v_2ndPart, v_endBracket ) ;
    }
    else
        if( tokens.list[tokens.index-1] == "_" )
    {
        v_subscript = v_piece_to_mathml(tokens );

        v_result.strKiContentPreLtDelim = "sub";
        v_result.strLeftDelim = "(";
        v_subscript = result_element( "msub" ,0 ,
                                         v_comma, v_subscript, v_endBracket ) ;
    }

    return v_subscript;
}

/**********************************************************************
 Input:
    tokens - tokens list with index pointing to the superscript token to
             be processed.

 return:
    if (logrithm) -
        processed pow combination.
    else -
        the v_superscript.
**********************************************************************/
function processPow(tokens, v_result)
{
    var v_comma = result_element( "mtext" ,0 , ',' ) ;
    var v_endBracket = result_element( "mtext" ,0 , ')' ) ;
    var v_superscript;

    tokens.index++;

    if (tokens.list[tokens.index-1] == '^')
    {
        v_superscript = v_piece_to_mathml(tokens);
        v_superscript = singleDigitScriptLogPow(tokens, v_superscript);
        v_result.strKiContentPreLtDelim = "pow";
        v_result.strLeftDelim = "(";
        //v_result.strRightDelim = ",";

        //result_element_append(v_superscript, v_endbracket);
        v_superscript = result_element('mtext', 0, v_comma, v_superscript, v_endBracket);
    }
    else
        v_superscript = v_piece_to_mathml(tokens);

    return v_superscript;
}

//--------------------------------------------
function v_subexpr_to_mathml (tokens )
{
    var v_result = null ;
    var v_mmultiscripts = null ;
    var v_mprescripts = null ;

    //------------------ subscript / superscript processing: ----------------------
    if (isSuperSubScript(tokens))
    {
        // generate parent node with no content:
        //
        v_mmultiscripts = result_element( "mmultiscripts" ,0) ;
        v_mprescripts = result_element( "mprescripts" ,0) ;
        result_element_append( v_mmultiscripts, v_mprescripts );

        while (isSuperSubScript(tokens)) // attach all sub/super nodes to parent node v_mmultiscripts:
        {
            tokens.index++;
            tokens.index++;

            var v_subscript = null ;
            var v_superscript = null ;

            if( tokens.list[tokens.index] == "_" )
            {
                tokens.index++;
                v_subscript = v_piece_to_mathml(tokens );
            }
            else if( tokens.list[tokens.index] == "^" ) {
                tokens.index++;
                v_superscript = v_piece_to_mathml(tokens);
            }

            if( tokens.list[tokens.index] == "_" ) {
                tokens.index++;
                v_subscript = v_piece_to_mathml(tokens);
            }
            else
                if( tokens.list[tokens.index] == "^")
            {
                tokens.index++;
                v_superscript = v_piece_to_mathml(tokens);
            }

            // Add sub/superscript node to parent node v_mmultiscripts:
            result_element_append( v_mmultiscripts , ( ( v_subscript != null ) ? v_subscript : result_element( "none" ,0) ) );
            result_element_append( v_mmultiscripts , ( ( v_superscript != null ) ? v_superscript : result_element( "none" ,0) ) );

        }  // end while
    } // end if
    //------------------ end subscript / superscript processing: ----------------------

    var v_limit_style = (tokens.list[tokens.index] in g_limit_commands);

    if( tokens.list[tokens.index] == null ) // end of token list:
    {
        if( v_mmultiscripts != null ) // found subscript / superscript nodes, insert tag before prescripts:
        {
           result_element_prepend( v_mmultiscripts , result_element( "mrow" ,0) , v_mprescripts );
           return v_mmultiscripts ;
        }
        else
            return result_element( "mrow" ,0) ;
    }
    else
        if( tokens.list[tokens.index] in g_left_delimiters)  // before next group of operations:
        {
            v_result = v_heuristic_subexpression (tokens );
        }
        else { // whatever is left:
            v_result = v_piece_to_mathml (tokens) ;
        }

    //------------------ subscript / superscript processing: ----------------------
    var v_base = v_result ;

    // Check if any subscript or superscript after the previous sub/superscript base:
    var v_subscript = null ;
    var v_superscript = null ;
    var v_beginBracket = result_element( "mtext" ,0 , '(' ) ;
//    var v_comma = result_element( "mtext" ,0 , ',' ) ;
    var v_endbracket = result_element( "mtext" ,0 , ')' ) ;

    if( tokens.list[tokens.index] == "_" )
    {
        v_subscript = processSubsript(tokens, v_result);
    }
    else if( tokens.list[tokens.index] == "^" ) {
        v_superscript = processPow(tokens, v_result);
    }

    if( tokens.list[tokens.index] == "_" ) {
        tokens.index++;
        v_subscript = v_piece_to_mathml(tokens);
    }
    else
        if( tokens.list[tokens.index] == "^")
    {
        v_superscript = processPow(tokens, v_result);
    }

    // if any sub/superscript base before this, which determins if need to add tags before the base:
    if( v_mmultiscripts != null )
    {
        result_element_prepend( v_mmultiscripts , v_base , v_mprescripts );

        result_element_prepend( v_mmultiscripts,
                               ( v_subscript != null ) ? v_subscript : result_element( "none" ,0),
                                v_mprescripts);

        result_element_prepend( v_mmultiscripts ,
                               ( v_superscript != null ) ? v_superscript : result_element( "none" ,0),
                               v_mprescripts);
    }
    //------------------ end subscript / superscript processing: ----------------------

    //------------------ subscript / superscript processing: ----------------------
    while (isSuperSubScript(tokens))
    {
        if( v_mmultiscripts == null )
        {
            v_mmultiscripts = result_element( "mmultiscripts" ,0 , v_base ) ;
            v_mprescripts = null ;

            if( ( v_superscript != null )  ||  ( v_subscript != null ) )
            {
                result_element_append( v_mmultiscripts ,
                                      ( v_subscript != null ) ? v_subscript : result_element( "none" ,0) );

                result_element_append( v_mmultiscripts ,
                                     ( v_superscript != null ) ? v_superscript : result_element( "none" ,0) );
            }
        }

        var v_subscript = null ;
        var v_superscript = null ;
        tokens.index++;
        tokens.index++;

        if( tokens.list[tokens.index] == "_" ) {
            tokens.index++;
            v_subscript = v_piece_to_mathml (tokens ) ;
        }
        else if( tokens.list[tokens.index] == "^" ) {
             tokens.index++;
             v_superscript = v_piece_to_mathml (tokens ) ;
        }
        if( tokens.list[tokens.index] == "_") {
            tokens.index++;
            v_subscript = v_piece_to_mathml (tokens ) ;
        }
        else if( tokens.list[tokens.index] == "^" ) {
            tokens.index++;
            v_superscript = v_piece_to_mathml (tokens ) ;
        }

        result_element_prepend( v_mmultiscripts ,
                                ( v_subscript != null ) ? v_subscript : result_element( "none" ,0),
                                v_mprescripts);

        result_element_prepend( v_mmultiscripts ,
                                ( v_superscript != null ) ? v_superscript : result_element( "none" ,0),
                                v_mprescripts);
    }
    //------------------ end subscript / superscript processing: ----------------------

     if( v_mmultiscripts != null ) {
        v_result = v_mmultiscripts ;
     }
     else if( ( v_subscript != null )  &&  ( v_superscript != null ) )
    {
        v_result = result_element( ( v_limit_style ? "munderover" : "msubsup" ),
                                  0 , v_base , v_subscript , v_superscript ) ;
     }
     else if( ( v_subscript != null ) ) {
        v_result = result_element( ( v_limit_style ? "munder" : "msub" ),
                                  0 , v_base , v_subscript ) ;
     }
     else if( ( v_superscript != null ) ) {
        v_result = result_element( ( v_limit_style ? "mover" : "msup" ),
                                  0 , v_base , v_superscript ) ;
    }

//    if (v_result.content[0].strRightDelim == ')')
//        v_result = result_element(v_result.tag, 0, v_result, v_endbracket);
    return v_result ;
}

/****************************************************************************
  Process tokens and generate MathMl tags with precedence relationships

****************************************************************************/
function v_subexpr_chain_to_mathml (tokens, v_stop_tokens )
{
    var v_result = null ;
    var v_mrow = null ;
    var v_mfrac = null ;
    var v_wrapped_result = null ;

    while( ( tokens.list[tokens.index] != null )    // not the end of the token list:
         &&  !( ( tokens.list[tokens.index] in v_stop_tokens ) )
         )
    {
        if (tokens.list[tokens.index] == "\\over") // top part of a fraction:
        {
            tokens.index++;
            v_mfrac = result_element( "mfrac" ,0 , v_result ) ;
            v_wrapped_result = v_mfrac ;
            v_mrow = null ;
            v_result = null ;
        }
        else if( tokens.list[tokens.index] == "\\choose" ) // a fraction:
        {
            tokens.index++;
            v_mfrac = result_element( "mfrac" , 1, "linethickness" , "0" , v_result ) ;

            v_wrapped_result = result_element( "mrow" ,0 , // no display attributes, just following contents:
                                               result_element( "mo" ,0 , "(" ),
                                               v_mfrac ,
                                               result_element( "mo" ,0 , ")" ) ) ;
            v_mrow = null; // finished current row
            v_result = null; // Since we used wrapped_result, indicate result is not used.
        }
        else // not fraction:
        {
            // precedence: multiplication, addition, relations:
            var v_node = v_collect_precedence_group (tokens ,
                                    g_relations_precedence_group,
                                    v_stop_tokens,

                                    function(tokens , v_stop_tokens )
                                    {
                                        return v_collect_precedence_group (tokens ,
                                                        g_addition_precedence_group,
                                                        v_stop_tokens ,

                                                    function(tokens , v_stop_tokens )
                                                    {
                                                        return v_collect_precedence_group (tokens ,
                                                                  g_multiplication_precedence_group,
                                                                  v_stop_tokens ,
                                                                  v_collect_invisible_group ) ;
                                                     }
                                                );
                                    }
                                );

            if(v_mrow != null) {
                result_element_append( v_mrow , v_node ); // append new node to existing row
            }
            else
                if( v_result != null ) // append to result nodes with a new row:
                {
                    v_mrow = result_element( "mrow" ,0 , v_result , v_node );
                    v_result = v_mrow ;
                }
                else {
                    v_result = v_node; // Starting list of result nodes
                }

        } // end else
    } // end while node.list

    if( v_mfrac != null ) {
       result_element_append( v_mfrac , v_result );
       return v_wrapped_result ;
    }
    else
       return v_result ;
}

//-----------------------------------------------------------
var g_optional_arg_stop_tokens
= { "&" : null ,
"\\\\" : null ,
"}" : null ,
"$" : null ,
"\\end" : null ,
"\\right" : null ,
"\\bigr" : null ,
"\\Bigr" : null ,
"\\biggr" : null ,
"\\Biggr" : null ,
"\\choose" : null ,
"\\over" : null ,
"]" : null
};

function v_optional_arg_to_mathml (tokens )
{
    if( ( tokens.list[tokens.index] != "[" ) ) {
        return null ;
    }
    tokens.index++;

    var v_result = v_subexpr_chain_to_mathml (tokens , g_optional_arg_stop_tokens) ;

    if( ( tokens.list[tokens.index] == "]" ) ) {
        tokens.index++;
    }
    return v_result ;
}

var g_hard_stop_tokens
= { "&" : null ,
"\\\\" : null ,
"}" : null ,
"$" : null ,
"\\end" : null ,
"\\right" : null ,
"\\bigr" : null ,
"\\Bigr" : null ,
"\\biggr" : null ,
"\\Biggr" : null ,
"\\choose" : null ,
"\\over" : null
}
;
var g_right_delimiter_stop_tokens
= { "&" : null ,
"\\\\" : null ,
"}" : null ,
"$" : null ,
"\\end" : null ,
"\\right" : null ,
"\\bigr" : null ,
"\\Bigr" : null ,
"\\biggr" : null ,
"\\Biggr" : null ,
"\\choose" : null ,
"\\over" : null ,
")" : ")" ,
"]" : "]" ,
"\\}" : "}" ,
"\\rbrace" : "}" ,
"\\rgroup" : ")" ,
"\\rvert" : "|" ,
"\\rVert" : "\u2016" ,
"\\rceil" : "\u2309" ,
"\\rfloor" : "\u230b" ,
"\\rmoustache" : "\u23b1" ,
"\\rangle" : "\u232a"
}
;
function v_heuristic_subexpression (tokens )
{
    var v_result = result_element( "mrow" ,0) ;
    result_element_append( v_result , v_piece_to_mathml (tokens ) );
    result_element_append( v_result , v_subexpr_chain_to_mathml (tokens , g_right_delimiter_stop_tokens) );
    if(( tokens.list[tokens.index] != null )
       &&
       !(tokens.list[tokens.index] in g_hard_stop_tokens)
       )
    {
        result_element_append( v_result , v_piece_to_mathml (tokens ) );
    }
    return v_result ;
}

var g_relations_precedence_group = g_relation_symbols;
var g_addition_precedence_group = { "+" : null, "-" : null, "\\oplus" : null};
var g_multiplication_precedence_group = { "*" : null, "\\times" : null, "\\cdot" : null, "/" : null};

/**********************************************************************************************
  process tokens with precedence rules
**********************************************************************************************/
function v_collect_precedence_group (tokens, v_operators, v_stop_tokens, v_reader )
{
    var v_result = v_reader (tokens , v_stop_tokens ); // precess higher precedence token first
    var v_mrow = null ;

    while( ( ( tokens.list[tokens.index] != null )  &&  // not the end of token list
         !( ( tokens.list[tokens.index] in v_stop_tokens ) )  &&
         ( tokens.list[tokens.index] in v_operators ) ) ) // current token is in the operator list:
    {
        // Starting the beginging of a row node with the higher precedence nodes as content:
        if( ( v_mrow == null ) )
        {
            v_mrow = result_element( "mrow" ,0 , v_result ) ;
            v_result = v_mrow ;
        }

        // Apend the new operator:
        result_element_append( v_mrow, v_piece_to_mathml(tokens) );

        if( ( tokens.list[tokens.index] != null )  &&  ( tokens.list[tokens.index] in v_stop_tokens ) ) {
            return v_result ; // finished with hard stop
        }
        else
        {   // Check and append new higher precedence nodes:
            result_element_append( v_mrow , v_reader(tokens, v_stop_tokens ) );
        }
    }
    return v_result ;
}

function v_collect_invisible_group (tokens , v_stop_tokens )
{
    var v_result = v_subexpr_to_mathml (tokens);
    var v_mrow = null ;

    // Precess named_id and left_delimiters:
    //
    while( ( tokens.list[tokens.index] != null )
            &&
          !( tokens.list[tokens.index] in v_stop_tokens )
            &&
           ( ( tokens.list[tokens.index] in g_named_identifiers)
              ||
             ( tokens.list[tokens.index] in g_left_delimiters)
           )
         )
    {
        if( ( v_mrow == null ) ) {
            v_mrow = result_element( "mrow" ,0 , v_result ) ;
            v_result = v_mrow ;
        }

        result_element_append( v_mrow , result_element( "mo" ,0 , "\u2062" ) );

        if( ( tokens.list[tokens.index] != null )
             &&
            ( tokens.list[tokens.index] in v_stop_tokens )
           )
        {
            return v_result ;
        }
        else {
            result_element_append( v_mrow , v_subexpr_to_mathml (tokens ) );
        }
    }
    return v_result ;
}

//-------------------------------------------------------------------------------------------------
//const
var tokenize_re = /(\\begin|\\operatorname|\\mathrm|\\mathop|\\end)\s*\{\s*([A-Z a-z]+)\s*\}|(\\[a-zA-Z]+|\\[\\#\{\},:;!])|(\s+)|([0-9\.]+)|([\$!"#%&'()*+,-.\/:;<=>?\[\]^_`\{\|\}~])|([a-zA-Z])/g;

//const
var tokenize_text_re = /[\${}\\]|\\[a-zA-Z]+|[^{}\$]+/g;

//const
var tokenize_text_commands = {
  '\\textrm': 1,
  '\\textsl': 1,
  '\\textit': 1,
  '\\texttt': 1,
  '\\textbf': 1,
  '\\textnormal': 1,
  '\\text': 1,
  '\\hbox': 1,
  '\\mbox': 1
};

//---------------------------------------------
// parameter: input - string
// return: array of tokens
//
function tokenize_latex_math(input)
{
  var result = new Array();
  var in_text_mode = 0;
  var brace_level = [];
  var pos = 0;

  if(input.charAt(0) == '$' &&
     input.charAt(input.length-1) == '$')
        input = input.slice(1, input.length-1);

  while(1) {
    if(!in_text_mode) {
        tokenize_re.lastIndex = pos;
        var m = tokenize_re.exec(input);
        pos = tokenize_re.lastIndex;

        if(m == null)
        {
          return result;
        }
        else if( m[1] != null) {
            result.push(m[1], m[2]);
        } else if(m[3] == '\\sp') {
            result.push('^');
        } else if(m[3] == '\\sb') {
            result.push('_');
        } else
        {
            if(m[0] == '$') {
                in_text_mode = 1;
            } else if(m[4] != null) {
              continue;
            } else if(m[3] != null && m[3] in tokenize_text_commands) {
              in_text_mode = 2;
              brace_level.push(0);
            }

            result.push(m[0]);
        }
    }
    else // in_text_mode:
    {
        tokenize_text_re.lastIndex = pos;
        var m = tokenize_text_re.exec(input);
        pos = tokenize_text_re.lastIndex;

        if(m == null) {
            return result;
        } else if(m[0] == '$') {
            in_text_mode = 0;
        } else if(m[0] == '{') {
            brace_level[brace_level.length-1]++;
        } else if(m[0] == '}') {
            if(--brace_level[brace_level.length-1] <= 0) {
                in_text_mode = 0;
                brace_level.pop();
            }
        }
        result.push(m[0]);
    }
  }
}

//-----------------------------------------------------------------
String.prototype.repeat = function(n) {
  return new Array(n+1).join(this);
}

function xml_escape(s)
{
  s = s.replace('&', '&amp;').
        replace('<', '&lt;').
        replace('>', '&gt;');

  return s.replace(/[\u0080-\uffff]/, function(x) { return '&#' + x.charCodeAt(0) + ';' });
}

function xml_attr_escape(s)
{
  s = s.replace('&', '&amp;').
        replace('"', '&quot;').
        replace('<', '&lt;').
        replace('>', '&gt;');

  return s.replace(/[\u0080-\uffff]/,
                   function(x) {
                    return '&#' + x.charCodeAt(0) + ';' }
                );
}

    /*****************************************************************************
      Convert processed node tree to string,
      which include inserting string of tags according to the tags of a node.
    ******************************************************************************/
    // working vars:
    var   strMl = "",
          strKI = "",
          iOpenParen = 0,
          iCloseParen = 0;


    function resetPrint()
    {
        strMl = "";
        strKI = "";
        iOpenParen = 0,
        iCloseParen = 0;
    }

    function strKiAppend(str)
    {
        // debug stop:
        if (str == ':')
            return; // skip

        var charCode = str.charCodeAt(0);

        if (//_bAutoTest &&
            charCode == 8722) // minus sign:
            strKiAppend('-');
        else
            if (//!_bAutoTest ||
                charCode != 8290) // don't want include the invisible times char
        {

            if (str == '(')
                iOpenParen++;

            if (str == ')')
                iCloseParen++;

            strKI+=str;
        }
    }

    function isNotEmtyStr(str)
    {
        return (str && str != "");
    }

    function serialize_mathml(tree)
    {
        if(tree instanceof PlainXMLNode)
        {
            var start_tag = '<' +tree.tag+ '>';
            var end_tag = '</' +tree.tag+ '>';

            //----------------------------------------------------------------------

            if(tree.content.length == 1 &&  // only one content node:
                typeof(tree.content[0]) == 'string')
            {
                var content = xml_escape(tree.content[0]);
                strMl += (start_tag + content + end_tag);
                processStrEquiv(tree, end_tag);
            }
            else // more than one content node or content is not a string:
            {
                strMl += (start_tag);

                preKiProcess(tree, end_tag);

                for(var i=0; i < tree.content.length;
                                                       i++) // ++i)
                    serialize_mathml(tree.content[i]); // one level deeper

                strMl += (end_tag);

            //    postKiProcess(tree, end_tag);

//                if (typeof(tree.content[0]) == 'string')
//                    processStrEquiv(tree, end_tag);
            }
        }
    }

    /*****************************************************************************
      Process the Equiv string
      input: tree - since this routine is called with the reentrance routine
                    serialize_mathml(tree.content[i]), each level down tree is
                    a lower lever content, i.e. looking from the root is like
                    tree.content[i].content[i].content[i]....
                    Therefore inside this routine if you use tree.content[0], you
                    are looking one more lever deeper content than your current
                    lever content.

      Created by: Nick Feng     12/20/2011
    *****************************************************************************/
    function processStrEquiv(tree, end_tag)
    {
        if (isNotEmtyStr(tree.strKiContent))
            strKiAppend(tree.strKiContent);

        strKiAppend(tree.content[0]); // we want the original content, not the one after escape lookup

        if (isNotEmtyStr(tree.strRightDelim))
        {
            strKiAppend(tree.strRightDelim);
        }

        if (isNotEmtyStr(tree.content.strRightDelim))
            strKiAppend(tree.content.strRightDelim);

//        if (isNotEmtyStr(tree.strRightDelim))
//            strKiAppend(tree.strRightDelim);

        if (isNotEmtyStr(tree.strKiContentPostRtDelim))
        {
            strKiAppend(tree.strKiContentPostRtDelim);
        }
/*
        if (end_tag == '</mrow>' && strKI[strKI.length-1] != ','
            && iOpenParen > iCloseParen)
        {
            strKiAppend(')');
            iCloseParen++;
        }
*/
    }

    /*********************************************************************************
      Process the Equiv string when there is no content string but bracket need to be
      opened.

      Created by: Nick Feng     12/22/2011
    *********************************************************************************/
    function preKiProcess(tree, end_tag)
    {
        if (tree.content[0])
        {
            if (isNotEmtyStr(tree.content[0].strKiContentPreLtDelim))
                strKiAppend(tree.content[0].strKiContentPreLtDelim);

            if (isNotEmtyStr(tree.content[0].strLeftDelim))
                strKiAppend(tree.content[0].strLeftDelim);

            if (typeof(tree.content[0]) == 'string')
                strKiAppend(tree.content[0]); // we want the original content, not the one after escape lookup
        }
    }

    /*********************************************************************************
      Process the Equiv string when there is no content string but bracket need to be
      closed.

      Created by: Nick Feng     12/20/2011
    *********************************************************************************/
/*
    function postKiProcess(tree, end_tag)
    {
        if (isNotEmtyStr(tree.strKiContentPostRtDelim))
        {
            strKiAppend(tree.strKiContentPostRtDelim);
        }
    }
*/
    //-----------------------------------------------------------------------------
    //var _bAutoTest = false;

    // Getters:
    latexToEquiv.strResultMl = function () { return strMl; }

    //latexToEquiv.setAutoTest = function (bAutoTest) { _bAutoTest = bAutoTest}

    /*************************************************
      The entrance function:
      input: strLatex - a string in Latex format.
      return: a translated string in KI format.
    *************************************************/
    latexToEquiv.LatexToKI = function(strLatex)
    {
        resetPrint();

        // replace absolute symbol from |x| to abs(x):
        strLatex = strLatex.replace("\\left|", "abs\\left(");
        strLatex = strLatex.replace("\\right|", "\\right)");
        
        for(var j=0; j < arguments.length; ++j)
        {
            var input = arguments[j];

            var tokens = new Object();

            tokens.list = tokenize_latex_math(input); // list is an array of takens
            tokens.list.push(null);
            tokens.index = 0;
/*
            tokens.bracketEntranceLevel = 0; // provide tracking mechanism for group processing
            tokens.bracketExitLevel = 0;

            tokens.manageBracketLevel = function()
            {
                if (this.bracketExitLevel == this.bracketEntranceLevel)
                {
                    this.bracketEntranceLevel = 0;
                    this.bracketExitLevel = 0;
                }
            };
*/
            var mathml = v_subexpr_chain_to_mathml(tokens, {});

            strMl += ('<math>');
            serialize_mathml(mathml, 1);
            strMl += ('</math>');

            if (iOpenParen > iCloseParen)
            {
                strKiAppend(')');
                iCloseParen++;
            }
        }

        strKI = strKI.replace("\u2215", "/"); // dividing symbo

        var head = strKI.indexOf("((");
        var powFun = "pow";
        var nrootFun = "nroot";
        //var func = strKI.substr(head-powFun.length, powFun.length);
        var div = strKI.substr(head - 1, 1);
        
        if ( head!= -1 && strKI.indexOf("))") != -1)
        {
            // to avoid miscorrection of the type like   pow((x-2)y, 3) or 1/(pow((xy),7)):
            if (head < powFun.length || // avoid pow function:
                strKI.substr(head-powFun.length, powFun.length) != powFun)
                if ( head < nrootFun.length || // avoid nroot function:
                     strKI.substr(head - nrootFun.length, nrootFun.length) != nrootFun
                     )
                    if (strKI.substr(head - 1, 1) != "/") // the following will fail for denominator situation: '(20x)/((x+12)(x+4))'
                    {
                        strKI = strKI.replace("((", "(");
                        strKI = strKI.replace("))", ")");
                    }
        }
        
        return strKI;
    }
    
module.exports = latexToEquiv;    
},{}],5:[function(require,module,exports){
//    var Equiv = require('../../equation/equation.js');
var xml = require('xmlTools');
//var xml = require('../../../node_modules/xmlTools/xml.js');

//==========================================================================
// Adapted from the HomeworkEditor/OrgHE classes
//==========================================================================
	var useMixedNumbers = false;

	//=======================================================
    // Convert a input mathML to a string (return)
    //
	// @FIXME/dg: This appears to be extremely slow
	// It's also a ton of manual replacements.  That could
	// easily be replaced by a compact, cleaner table!
	//=======================================================
	mathMLtoString = function(theMathML, markImplied)
	{
		var tempIndex = 0;
		var tempArray = [];
		var tempString="";
		var newtempString="";

		var childArray = [];
		var tempExponent;
		var tempBase;
		var mrowIndex;

		var regex = /<maction.*?>|<\/maction>|<outside>.*?<\/outside>/g;
		theMathML = theMathML.replace(regex, '');

//		console.log(theMathML.toString());
		if (typeof(theMathML) !== 'string')
			return "";
//		console.log("after typeof not eq string!!!");

		var tempString = theMathML;

		if (tempString.indexOf("<math") === -1)
			return replaceChars(tempString);

		// @FIXME/dg: Replace all <mspace> elements with a single regex
		tempString = replaceAll(tempString, "<mspace width=\"1em\" />", "");
		tempString = replaceAll(tempString, "<mspace width=\"1em\">", "");
		tempString = replaceAll(tempString, "</mspace>", "");
		//fix possible /) situations and ,)
		//tempString=replaceAll(tempString, "/)", ")/");
		//tempString=replaceAll(tempString, ",)", "),");

        //console.log("tempString = " + tempString);

		// Convert back to XML, run checkAllNodesMFracMsupMrootMsub, then convert back to a string.  Ouch!
		var workinprogressMathML = xml.stringToXML(tempString);

        if (workinprogressMathML)
        {
          //  console.log("1stChild = ", workinprogressMathML.childNodes);
            
            checkAllNodesMFracMsupMrootMsub(workinprogressMathML);
            var mathML = xml.XMLToString(workinprogressMathML);
          //  console.log("mathML = " + mathML);
        }

		//////trace("after checkallnodesmfrac");
		//////trace(workinprogressMathML.toString());
		//////trace(mathML);

		//other stuff

		//mathML=replaceAll(mathML, "<mphantom><mo>−−</mo></mphantom>", ""); //spacing for vertical ops
		//got phantoms with different sizes
		var tempIndex = 0;
		while (mathML.indexOf("<mphantom", tempIndex) !== -1)
		{
			//got a math with attributes
			tempIndex = mathML.indexOf("<mphantom", tempIndex);
			var tempString = mathML.substring(tempIndex, mathML.indexOf("</mphantom>", tempIndex)+11);
			mathML = replaceAll(mathML, tempString, "");
			tempIndex++;
		}

		//////trace(mathML);
		mathML = replaceAll(mathML, "<msup>", "");
		mathML = replaceAll(mathML, "</msup>", "");
		mathML = replaceAll(mathML, "<mroot>", "");
		mathML = replaceAll(mathML, "</mroot>", "");
		mathML = replaceAll(mathML, "<munder>", "");
		mathML = replaceAll(mathML, "<munder sub=\"true\">", "");
		mathML = replaceAll(mathML, "</munder>", "");
		mathML = replaceAll(mathML, "<msub>", "");
		mathML = replaceAll(mathML, "</msub>", "");
		mathML = replaceAll(mathML, "<mover>", "");
		mathML = replaceAll(mathML, "</mover>", "");
		mathML = replaceAll(mathML, "<munderover>", "");
		mathML = replaceAll(mathML, "</munderover>", "");

		//get rid of underline character
		mathML=replaceAll(mathML, "&#x0332;", "");
		mathML=replaceAll(mathML, chr(818), "");
		mathML=replaceAll(mathML, "&#x2017;", "");
		mathML=replaceAll(mathML, chr(8215), "");

		tempIndex=0;

		//fractions
		mathML=replaceAll(mathML, "<mfrac>", "");
		mathML=replaceAll(mathML, "</mfrac>", "");
		mathML=replaceAll(mathML, "<mfrac linethickness=\"thin\">", "");

		//for ABS
		mathML = replaceAll(mathML, "<mo closing=\"false\">|", "abs(");
		mathML = replaceAll(mathML, "<mo closing=\"true\">|", ")");

		// when the closing is not specified, i,e: <mo>|</mo>....<mo>|</mo>:
		str = mathML.split("|");
		var i = str.length;
		while (i > 1)
		{
			mathML = mathML.replace("|", "abs(");
			mathML = mathML.replace("|", ")");
			i -= 2;
		}

		//for Sqrt
		mathML = replaceAll(mathML, "<msqrt>", "sqrt(");
		mathML = replaceAll(mathML, "</msqrt>", ")");

		//for all
		mathML=replaceAll(mathML,"<mtable columnalign=\"left\">","");
		mathML=replaceAll(mathML,"<mtable columnalign=\"right\">","");
		mathML=replaceAll(mathML, "<mtable>", "");
		mathML=replaceAll(mathML,"</mtable>","");
		mathML=replaceAll(mathML,"<mtr>","");
		mathML=replaceAll(mathML,"</mtr>","");
		mathML=replaceAll(mathML,"<mtd>","");
		mathML=replaceAll(mathML,"</mtd>","");
		mathML=replaceAll(mathML,"<mtd />","");
		mathML=replaceAll(mathML,"<mi>","");
		mathML=replaceAll(mathML,"</mi>","");
		mathML=replaceAll(mathML,"<mo stretchy=\"true\">","");
		mathML=replaceAll(mathML,"<mo stretchy=\"false\">","");
		mathML=replaceAll(mathML,"<mo>","");
		mathML=replaceAll(mathML,"</mo>","");
		mathML=replaceAll(mathML,"<mstyle displaystyle=\"true\">","");
		mathML=replaceAll(mathML,"<mstyle displaystyle=\"false\">","");
		mathML=replaceAll(mathML,"</mstyle>","");
		mathML=replaceAll(mathML,"<mrow>", "");
		mathML=replaceAll(mathML,"</mrow>", "");
		mathML=replaceAll(mathML,"<mrow parensRemoved=\"true\">", "");
		mathML=replaceAll(mathML,"<mrow invisibleMult=\"false\">", "");
		mathML=replaceAll(mathML, "<mspace width=\"1em\" />", "");
		mathML=replaceAll(mathML, "<mspace width=\"1em\">", "");
		mathML=replaceAll(mathML, "</mspace>", "");
		mathML=replaceAll(mathML,"<math>", "");
		mathML=replaceAll(mathML, "</math>", "");

		var tempIndex = 0;

		//take care of math and mrow with attributes
		if (mathML.indexOf("<math") !== -1)
		{
			//got a math with attributes
			var index = mathML.indexOf("<math");
			var tempString = mathML.substring(index, mathML.indexOf(">", index)+1);
			mathML = replaceAll(mathML, tempString, "");
		}

		//take care of math and mrow with attributes
		while (mathML.indexOf("<mrow", tempIndex) !== -1)
		{
			//got a math with attributes
			tempIndex = mathML.indexOf("<mrow", tempIndex);
			var tempString = mathML.substring(tempIndex, mathML.indexOf(">", tempIndex)+1);
			mathML=replaceAll(mathML, tempString, "");
			tempIndex++;
		}

		if (markImplied === true)
		{
			mathML = replaceAll(mathML, "&amp;InvisibleTimes;", "#");
			mathML = replaceAll(mathML, "&InvisibleTimes;", "#");
		}
		else
		{
			mathML = replaceAll(mathML, "&amp;InvisibleTimes;", "");
			mathML = replaceAll(mathML, "&InvisibleTimes;", "");
		}

		mathML = numbers(mathML);

		var tempIndex = 0;
		while (mathML.indexOf("<mo", tempIndex) !== -1)
		{
			//got a math with attributes
			tempIndex = mathML.indexOf("<mo", tempIndex);
			var tempString = mathML.substring(tempIndex, mathML.indexOf(">", tempIndex)+1);
			if (tempString.indexOf("<mo sys=") === -1)
				mathML=replaceAll(mathML, tempString, "");
			tempIndex++;
		}

		//change invalid characters from mprojector
		mathML=replaceAll(mathML, " &quot;", "*");
		mathML=replaceAll(mathML, "&quot;"+chr(18), "-");

		//Multiplication Symbol
		mathML=replaceAll(mathML, "&#x2022;", "*");
		mathML=replaceAll(mathML, "&#x2219;", "*");
		mathML=replaceAll(mathML, "&#x22C5;", "*");
		mathML=replaceAll(mathML, "&#183;", "*");
		mathML=replaceAll(mathML, "•", "*");
		mathML=replaceAll(mathML, "∙", "*");
		mathML=replaceAll(mathML, "·", "*");

		//Substraction Symbol
		mathML=replaceAll(mathML, "&#x2212;", "-");
		mathML=replaceAll(mathML, chr(8722), chr(45));

		//greater less than
		mathML=replaceAll(mathML, "&gt;", ">");
		mathML=replaceAll(mathML, "&lt;", "<");
		mathML=replaceAll(mathML, "&amp;ge;", ">=");
		mathML=replaceAll(mathML, "&#x2265;", ">=");
		mathML=replaceAll(mathML, "&amp;le;", "<=");
		mathML=replaceAll(mathML, "&#x2264;", "<=");
		mathML=replaceAll(mathML, "&#x8800;", "!=");
		mathML=replaceAll(mathML, "&#x003c;", "<");
		mathML=replaceAll(mathML, "&#x003e;", ">");
		mathML=replaceAll(mathML, "&#x2264;", "<=");
		mathML=replaceAll(mathML, "&#x2265;", ">=");
		mathML=replaceAll(mathML, "≤", "<=");
		mathML=replaceAll(mathML, "≥", ">=");
		mathML=replaceAll(mathML, "±", "+/-");

		//and/or ops
		mathML=replaceAll(mathML, "&amp;and;", "&");
		mathML=replaceAll(mathML, "&amp;or;", "|");
		mathML=replaceAll(mathML, "&#x2227;", "&");
		mathML=replaceAll(mathML, "&#x2228;", "|");
		mathML=replaceAll(mathML, chr(8745), "&");
		mathML=replaceAll(mathML, chr(8743), "&");
		mathML=replaceAll(mathML, chr(8746), "|");
		mathML=replaceAll(mathML, chr(8744), "|");
		mathML=replaceAll(mathML, "<mtext> and </mtext>", "&");
		mathML=replaceAll(mathML, "<mtext>and</mtext>", "&");
		mathML=replaceAll(mathML, "<mtext> or </mtext>", "|");
		mathML=replaceAll(mathML, "<mtext>or</mtext>", "|");
		mathML=replaceAll(mathML, "<mtext>", "");
		mathML=replaceAll(mathML, "</mtext>", "");
		//nbsp
		mathML=replaceAll(mathML, "&nbsp;", "");
		mathML=replaceAll(mathML, " ", ""); //thats not a space, its a nbsp

		//function application
		mathML=replaceAll(mathML, "&#x2061;", "");
		mathML=replaceAll(mathML, chr(8289), "");

		//the ~ symbol for scientific notation
		mathML=replaceAll(mathML, "&#x00D7;", "~");
		mathML=replaceAll(mathML, "×", "~");
		//the $ symbol for non slash divide
		mathML=replaceAll(mathML, "&#x00F7;", "$");

		mathML=replaceAll(mathML, "<i>", "");
		mathML=replaceAll(mathML, "</i>", "");

		//fix possible /) situations and ,)
		//////trace("before replace for mistakes");
		//////trace(mathML);
		//////trace(mathML.indexOf(",)"));

		/* DG: Removed mistake cleanup. We need to have SOME standards.
		while (mathML.indexOf("/)") >= 0)
			mathML=replaceAll(mathML, "/)", ")/");
		*/
		while (mathML.indexOf(",)") >= 0)
			mathML=replaceAll(mathML, ",)", "),");

		//change infinite and no solutions
		if (mathML.toLowerCase() === "&#x221e;" || mathML.toLowerCase() === "∞")
			mathML = "infinitesolutions";
		else if (mathML.toLowerCase() === "&#x2205;" || mathML.toLowerCase() === chr(8709) || mathML.toLowerCase() === "Ø")
			mathML = "nosolutions";
/*
		var regex = /<maction.*?>|<\/maction>|(<outside>.*?<\/outside>)/g;
		mathML = mathML.replace(regex, '');
*/
		return mathML;
	}
exports.mathMLtoString = mathMLtoString;

	//=======================================================
	// Create a MathML element
	//
	// Creating elements requires an initial document.  This
	// routine wasn't setup with that in mind.
	// It would be more efficient to maintain a single document
	// and just create elements as needed.
	//=======================================================
	function createMathMLOperator(operator)
	{
		// If operator is valid mathml (contains mn, mo, or mi) convert to XML and we're done
		if (operator.indexOf("<mn>") === -1 && operator.indexOf("<mo>") === -1 && operator.indexOf("<mi>") === -1)
			operator = "<mo>" + operator + "</mo>";

		var theMathML = xml.stringToXML(operator);	// Create an entire XML document
		return theMathML.firstChild;	// Return the root node of that document
	}

	//=======================================================
	//=======================================================
	var nodeHandlers = {
		mfrac: check_mfrac,
		mi: check_mi,
		msub: check_msub,
		msup: check_msup_mroot,
		mroot: check_msup_mroot,
		mn: check_mn,
		munderover: check_munderover
	};

	//=======================================================
	function checkAllNodesMFracMsupMrootMsub(mathML)
	{
        var debug = false;
		var tempNode;
		for (var i = 0; i < mathML.childNodes.length; i++)
		{
			var currentNode = mathML.childNodes[i];
            if (currentNode)
            {
                if (nodeHandlers[currentNode.nodeName])
                    nodeHandlers[currentNode.nodeName](currentNode); // call handler for current node
    /*
                console.log("currentnode");
                console.log(currentNode.toString());
                console.log(currentNode.nodeName);
    */
                if (currentNode.parentNode.nodeName == "mi")
                    debug = true;
        
                if (currentNode.childNodes &&
                    currentNode.childNodes.length > 0)
                    checkAllNodesMFracMsupMrootMsub(currentNode);
            }
		}
	}

	//=======================================================
	//=======================================================
	function check_mfrac(currentNode)
	{
		if (currentNode.firstChild.firstChild.hasChildNodes())
		{
			////trace("going to check parens mfrac");
			if ((currentNode.firstChild.nodeName === "mrow" &&
                 currentNode.firstChild.attributes.parensRemoved==="true") ||
                (currentNode.firstChild.nodeName === "mrow" && currentNode.firstChild.childNodes.length>=2))
			{
				////trace("found mrow with parensremoved in num");
				var content = currentNode.firstChild.firstChild.firstChild.nodeValue;
				if (content && content.indexOf("nroot(") === 0 )
				{
					content = "nroot((" + content.substring(6);
					currentNode.firstChild.firstChild.firstChild.nodeValue = content;
				}
				else if (content && content.indexOf("sqrt(") === 0 )
				{
					content = "sqrt((" + content.substring(5);
					currentNode.firstChild.firstChild.firstChild.nodeValue = content;
				}
				else currentNode.firstChild.insertBefore(createMathMLOperator("("),
                                                         currentNode.firstChild.firstChild);
				currentNode.firstChild.appendChild(createMathMLOperator(")"));
			}
			else if ((currentNode.firstChild.firstChild.nodeName === "mrow" &&
                      currentNode.firstChild.firstChild.attributes.parensRemoved==="true") ||
                     (currentNode.firstChild.firstChild.nodeName === "mrow" &&
                      currentNode.firstChild.firstChild.childNodes.length>=2))
			{
				////trace("found mrow with parensremoved in num for second mrow");
				var content = currentNode.firstChild.firstChild.firstChild.firstChild.nodeValue;
				if (content.indexOf("nroot(") === 0 )
				{
					content = "nroot((" + content.substring(6);
					currentNode.firstChild.firstChild.firstChild.firstChild.nodeValue = content;
				}
				else if (content.indexOf("sqrt(") === 0 )
				{
					content = "sqrt((" + content.substring(5);
					currentNode.firstChild.firstChild.firstChild.firstChild.nodeValue = content;
				}
				else currentNode.firstChild.firstChild.insertBefore(createMathMLOperator("("), currentNode.firstChild.firstChild.firstChild);
				currentNode.firstChild.firstChild.appendChild(createMathMLOperator(")"));
			}
/* nf
			////trace("before frac change mrow in numerator");
			tempNode=currentNode.firstChild.firstChild.firstChild;

			//find textNode to put open Paren in
			while (tempNode.nodeType !== 3)
				tempNode=tempNode.firstChild;

			//if (currentNode.firstChild.childNodes.length > 1)
				//tempNode.nodeValue="("+tempNode.nodeValue;

			tempNode=currentNode.firstChild.lastChild.lastChild;

			//find textNode to put close paren and / in
			while (tempNode.nodeType !== 3)
				tempNode=tempNode.lastChild;

			//if (currentNode.firstChild.childNodes.length > 1)
				//tempNode.nodeValue=tempNode.nodeValue+")/";
			//else
			tempNode.nodeValue=tempNode.nodeValue+"/";
*/
			//currentNode.firstChild.lastChild.firstChild.nodeValue=currentNode.firstChild.lastChild.firstChild.nodeValue+")/";

			////trace("after frac change mrow in numerator");
		}
/* nf        
		else {////trace("before frac change no mrow in numerator");

			currentNode.firstChild.firstChild.nodeValue=currentNode.firstChild.firstChild.nodeValue+"/";
			//currentNode.insertBefore(createMathMLOperator("/"), currentNode.firstChild.nextSibling);
			//////trace("after frac change no mrow in numerator");
		}
*/
		if (currentNode.lastChild.firstChild.hasChildNodes()){
			//////trace("mrow in denominator, add parens");

			if ((currentNode.lastChild.nodeName === "mrow" &&
                 currentNode.lastChild.attributes.parensRemoved==="true")
                ||
// NF - without the condition it makes <msup> node with double "()" around it and moved the base behind ",":
				(currentNode.lastChild.nodeName != "msup" &&
					currentNode.lastChild.childNodes.length>=2))
			{
				//////trace("found mrow with parensremoved in den");
				currentNode.lastChild.insertBefore(createMathMLOperator("("),
                                                   currentNode.lastChild.firstChild);
				currentNode.lastChild.appendChild(createMathMLOperator(")"));
			}
			else if ((currentNode.lastChild.firstChild.nodeName === "mrow" &&
                      currentNode.lastChild.firstChild.attributes.parensRemoved==="true") ||
                      currentNode.lastChild.firstChild.childNodes.length>=2)
			{
				//////trace("found mrow with parensremoved in den for second mrow");
				currentNode.lastChild.firstChild.insertBefore(createMathMLOperator("("), currentNode.lastChild.firstChild.firstChild);
				currentNode.lastChild.firstChild.appendChild(createMathMLOperator(")"));
			}

			tempNode=currentNode.lastChild.firstChild.firstChild;

			//while (tempNode.nodeType !== 3)
				//tempNode=tempNode.firstChild;

			//if (currentNode.lastChild.childNodes.length > 1)
				//tempNode.nodeValue="("+tempNode.nodeValue;

			tempNode=currentNode.lastChild.lastChild.lastChild;

			//while (tempNode.nodeType !== 3)
				//tempNode=tempNode.lastChild;

			//if (currentNode.lastChild.childNodes.length > 1)
				//tempNode.nodeValue=tempNode+")";

			//currentNode.lastChild.firstChild.firstChild.nodeValue="("+currentNode.lastChild.firstChild.firstChild.nodeValue;
			//currentNode.lastChild.lastChild.firstChild.nodeValue=currentNode.lastChild.lastChild.firstChild.nodeValue+")";
		}
        currentNode.insertBefore(createMathMLOperator("/"), currentNode.firstChild.nextSibling);
	}

	//=======================================================
	//=======================================================
	var mi_types = ['log', 'ln', 'sin', 'cos', 'tan', 'cot', 'sec', 'csc'];

	//=======================================================
	function check_mi(currentNode)
	{
		var val = currentNode.firstChild.nodeValue.toLowerCase();

		if (mi_types.indexOf(val) === -1)
			return;

		//////trace("found log or trig outside an msub");
		switch(val)
		{
			case "log" :
				val = "log(10,";
				break;
			case "ln":
			case "sin":
			case "cos":
			case "tan":
			case "cot":
			case "sec":
			case "csc":
				val = val+"(";
				break;
		}

		currentNode.firstChild.nodeValue = val;
		tempNode = currentNode.nextSibling;
		while (tempNode !== null)
		{
			if (tempNode.nodeName === "mrow" || tempNode.nodeName === "mfrac")
			{
				tempNode.appendChild(createMathMLOperator(")"));
				break;
			}
			else if (tempNode.nodeName === "mo")
			{
				// @DG: Previously only broke on +/-.  It needs to break on ANY operator (or anything else, really)
//				if (tempNode.firstChild.nodeValue === "+" || tempNode.firstChild.nodeValue === "-"
//					|| tempNode.firstChild.nodeValue === chr(8722) || tempNode.firstChild.nodeValue === "&#x2212;")
					{
						currentNode.parentNode.insertBefore(createMathMLOperator(")"), tempNode);
						break;
					}

				//tempNode.firstChild.nodeValue = tempNode.firstChild.nodeValue + ")";
			}

			if (tempNode.nextSibling === null)
			{
				var cur = xml.XMLToString(tempNode);
				var par = xml.XMLToString(tempNode.parentNode);
				var add = createMathMLOperator(")");
				tempNode.parentNode.appendChild(add);
//						tempNode.parentNode.appendChild(createMathMLOperator(")"));
				break;
			}

			tempNode = tempNode.nextSibling;
		}

		//////trace("log base 10 or natural log  or trig function change after");
		//////trace(currentNode.toString());
		//////trace(workinprogressMathML.toString());
	}

	//=======================================================
	//=======================================================
	function check_msub(currentNode)
	{
		//////trace("msub change");
		//////trace(currentNode.toString());
		//////trace(workinprogressMathML.toString());

		if (currentNode.firstChild.nodeName === "mrow"
			&& currentNode.firstChild.firstChild.firstChild.nodeValue.toLowerCase() === "log")
		{
			//////trace("we got a log in msub");
			tempNode = currentNode.firstChild;
			tempNode.firstChild.firstChild.nodeValue = "log(";

			while (tempNode.nextSibling !== null)
			{
				tempNode = tempNode.nextSibling;
				if (tempNode.nodeName === "mrow")
					tempNode.lastChild.firstChild.nodeValue = tempNode.lastChild.firstChild.nodeValue + ",";
				else
					tempNode.firstChild.nodeValue = tempNode.firstChild.nodeValue + ",";
			}

			//now look for the arguments of the log
			tempNode = currentNode.nextSibling;
			while (tempNode !== null)
			{
				if (tempNode.nodeName === "mrow" || tempNode.nodeName === "mfrac")
				{	//tempNode.lastChild.firstChild.nodeValue = tempNode.lastChild.firstChild.nodeValue + ")";
					tempNode.appendChild(createMathMLOperator(")"));
					break;

				}else if (tempNode.nodeName === "mo")
				{
					if (tempNode.firstChild.nodeValue === "+" || tempNode.firstChild.nodeValue === "-"
						|| tempNode.firstChild.nodeValue === chr(8722) || tempNode.firstChild.nodeValue === "&#x2212;")
						{
							currentNode.parentNode.insertBefore(createMathMLOperator(")"), tempNode);
							break;
						}

					//tempNode.firstChild.nodeValue = tempNode.firstChild.nodeValue + ")";
				}
				if (tempNode.nextSibling === null)
				{
					tempNode.parentNode.appendChild(createMathMLOperator(")"));
					break;
				}

				tempNode = tempNode.nextSibling;

			}
		}
		else
		{
			tempNode=currentNode.firstChild.firstChild;
			tempNode.nodeValue="sub("+tempNode.nodeValue+",";

			tempNode=currentNode.firstChild.nextSibling.firstChild;
			tempNode.nodeValue=tempNode.nodeValue+")";
		}

		//////trace("msub change after");
		//////trace(currentNode.toString());
		//////trace(workinprogressMathML.toString());
	}

	//=======================================================
	//=======================================================
	function check_msup_mroot(currentNode)
	{
		var opString = currentNode.nodeName==="msup" ? "pow" : "nroot";
		if (currentNode.firstChild.firstChild.hasChildNodes()){
			////////trace("currentNodefirstChild");
			////////trace(currentNode.firstChild.toString());
			//////trace("before msup change mrow in base");
			//////trace(workinprogressMathML.toString());
			//////trace(mathML.toString());
			//////trace(currentNode.toString());

			//block taken out for pow((-1),2) problem
			//was removing the parens from -1
			/*if (currentNode.firstChild.firstChild.firstChild.nodeValue==="("){
				//////trace("inside ( if");
				currentNode.firstChild.firstChild.firstChild.nodeValue="";
				currentNode.firstChild.lastChild.firstChild.nodeValue="";
				//currentNode.firstChild.firstChild.firstChild.removeNode();
				//currentNode.firstChild.lastChild.firstChild.removeNode();
			}*/

			tempNode=currentNode.firstChild.firstChild.firstChild;
			//////trace("starting first while");
			while (tempNode.nodeType !== 3)
				tempNode=tempNode.firstChild;
			//taken also for same reason as above
			if (tempNode.nodeValue.indexOf("nroot(") === 0)
			{
				var rem = tempNode.nodeValue.substring(6);
				tempNode.nodeValue="nroot("+opString+"("+rem;
			}
			else
			tempNode.nodeValue=opString+"("+tempNode.nodeValue;


			tempNode=currentNode.firstChild.lastChild.lastChild;
			//////trace("starting second while");
			while (tempNode.nodeType !== 3)
				tempNode=tempNode.lastChild;

			tempNode.nodeValue=tempNode.nodeValue+",";
			//currentNode.firstChild.lastChild.firstChild.nodeValue=currentNode.firstChild.lastChild.firstChild.nodeValue+",";


			//////trace("after msup change mrow in base");
			//////trace(workinprogressMathML.toString());
			//////trace(mathML.toString());
			//////trace(currentNode.toString());
		}
		else
		{
			//////trace("before msup change no mrow in base");
			//////trace(workinprogressMathML.toString());
			//////trace(mathML.toString());
			//////trace(currentNode.toString());

			tempNode=currentNode.firstChild.firstChild;
			if (tempNode.nodeValue.indexOf("(") !== -1)
			{
				if (tempNode.nodeValue.indexOf("nroot(") === 0)
				{
					var rem = tempNode.nodeValue.substring(6);
					tempNode.nodeValue="nroot("+opString+"("+rem+",";
				}
				else tempNode.nodeValue="("+opString+tempNode.nodeValue+",";
			}
			else tempNode.nodeValue=opString+"("+tempNode.nodeValue+",";


			//////trace("after msup change no mrow in base");
			//////trace(workinprogressMathML.toString());
			//////trace(mathML.toString());
			//////trace(currentNode.toString());
		}

		if (currentNode.lastChild.firstChild.hasChildNodes())
		{
			//////trace("mrow in exponent");
			//////trace("before");
			//////trace(workinprogressMathML.toString());


			tempNode=currentNode.lastChild.lastChild.lastChild;
			while (tempNode.nodeType !== 3)
				tempNode=tempNode.lastChild;

			if (tempNode.nodeValue.indexOf("/") !== -1){
				tempNode.nodeValue=tempNode.nodeValue.substring(0, tempNode.nodeValue.indexOf("/"))+")"+tempNode.nodeValue.substring(tempNode.nodeValue.indexOf("/"));
			}
			else tempNode.nodeValue=tempNode.nodeValue+")";
			//currentNode.lastChild.lastChild.firstChild.nodeValue=currentNode.lastChild.lastChild.firstChild.nodeValue+")";


			//////trace("after");
			//////trace(workinprogressMathML.toString());
		}
		else
		{
			//////trace("no mrow in exponent");
			//////trace("before");
			//////trace(workinprogressMathML.toString());

			tempNode=currentNode.lastChild.firstChild;
			if (tempNode.nodeValue.indexOf("/") !== -1)
				tempNode.nodeValue=tempNode.nodeValue.substring(0, tempNode.nodeValue.indexOf("/"))+")"+tempNode.nodeValue.substring(tempNode.nodeValue.indexOf("/"));
			else tempNode.nodeValue=tempNode.nodeValue+")";
			//currentNode.lastChild.firstChild.nodeValue=currentNode.lastChild.firstChild.nodeValue+")";

			//////trace("after");
			//////trace(workinprogressMathML.toString());
		}
	}

	//=======================================================
	// Look for mixed numbers
	//=======================================================
	function check_mn(currentNode)
	{
		if (!useMixedNumbers)
			return;

		var mfrac = null;
		if (currentNode.nextSibling && currentNode.nextSibling.nodeName === "mfrac")
			mfrac = currentNode.nextSibling;
		else
		{
			var tempNode = currentNode.nextSibling;
			if (tempNode === null)
			{
				tempNode = currentNode.parentNode;
				while (tempNode.nextSibling === null && tempNode.parentNode !== null)
					tempNode = tempNode.parentNode;

				tempNode = tempNode.nextSibling;
				if (tempNode && tempNode.nodeName === "mfrac")
					mfrac = tempNode;

			}
			while (tempNode && tempNode.nodeName === "mrow")
			{
				if (tempNode.firstChild.nodeName === "mfrac")
				{
					mfrac = tempNode.firstChild;
					break;
				}
				tempNode = tempNode.firstChild;
			}
		}
		if (mfrac !== null)
		{
			var numNode;
			var denNode;

			//for num
			tempNode = mfrac.firstChild;
			while (tempNode.firstChild.nodeName === "mrow" && tempNode.childNodes.length === 1)
				tempNode = tempNode.firstChild;
			numNode = tempNode;

			//for den
			tempNode = mfrac.firstChild.nextSibling;
			while (tempNode.firstChild.nodeName === "mrow" && tempNode.childNodes.length === 1)
				tempNode = tempNode.firstChild;
			denNode = tempNode;



			//if (((mfrac.firstChild.childNodes.length === 1 && !mfrac.firstChild.firstChild.hasChildNodes()) || (mfrac.firstChild.nodeName === "mrow" && mfrac.firstChild.childNodes.length === 1  && !mfrac.firstChild.firstChild.firstChild.hasChildNodes()))
				//&& ((mfrac.firstChild.nextSibling.childNodes.length === 1 && !mfrac.firstChild.nextSibling.firstChild.hasChildNodes()) || (mfrac.firstChild.nextSibling.nodeName === "mrow" && mfrac.firstChild.nextSibling.childNodes.length === 1  && !mfrac.firstChild.nextSibling.firstChild.firstChild.hasChildNodes())))

			if (((numNode.childNodes.length === 1 && !numNode.firstChild.hasChildNodes()) || (numNode.nodeName === "mrow" && numNode.childNodes.length === 1  && !numNode.firstChild.firstChild.hasChildNodes()))
				&& ((denNode.childNodes.length === 1 && !denNode.firstChild.hasChildNodes()) || (denNode.nodeName === "mrow" && denNode.childNodes.length === 1  && !denNode.firstChild.firstChild.hasChildNodes())))
				currentNode.attributes.mixed = "true";
		}
	}

	//=======================================================
	//=======================================================
	function check_munderover(currentNode)
	{
		//possible sigma
		tempNode = currentNode.firstChild;
		//check if its sigma
		if (tempNode.nodeName === "mo" && (tempNode.firstChild.nodeValue === "&#x2211;" || tempNode.firstChild.nodeValue ==="∑"))
		{
			//////trace("we got a sigma");
			tempNode.firstChild.nodeValue = "sigma(";
			//find upper and lower values of sigma
			while (tempNode.nextSibling !== null)
			{
				tempNode = tempNode.nextSibling;
				if (tempNode.nodeName === "mrow")
					tempNode.lastChild.firstChild.nodeValue = tempNode.lastChild.firstChild.nodeValue + ",";
				else
					tempNode.firstChild.nodeValue = tempNode.firstChild.nodeValue + ",";
			}

			//now add the middle content of the sigma
			tempNode = currentNode.nextSibling;
			if (tempNode.nodeName === "mrow")
			{	//tempNode.lastChild.firstChild.nodeValue = tempNode.lastChild.firstChild.nodeValue + ")";
				tempNode.appendChild(createMathMLOperator(")"));

			}
			else
				tempNode.firstChild.nodeValue = tempNode.firstChild.nodeValue + ")";
		}
	}


	//=======================================================
	// Deal with <mn> tags
	//=======================================================
	function numbers(mathML)
	{
		mathML = replaceAll(mathML, "<mn>", "");

		//work with mix numbers
		var tempIndex = 0;

		var mathMLArray = mathML.split("<mn mixed=\"true\">");
		var number;
		var fraction;

		for (var i = 1; i < mathMLArray.length; i++)
		{
			number = mathMLArray[i].substring(0, mathMLArray[i].indexOf("</mn>"));
			for (var j=0; j<3; j++)
				tempIndex = mathMLArray[i].indexOf("</mn>", tempIndex) +1;

			fraction = mathMLArray[i].substring(mathMLArray[i].indexOf("</mn>"), tempIndex-1);

			mathMLArray[i]="mix("+number+","+fraction+")"+mathMLArray[i].substring(tempIndex-1);
		}
		mathML = mathMLArray.join("");
		mathML = replaceAll(mathML,"</mn>","");

		//take care of mn with attributes
		var tempIndex = 0;
		while (mathML.indexOf("<mn", tempIndex) !== -1)
		{
			//got a math with attributes
			tempIndex = mathML.indexOf("<mn", tempIndex);
			var tempString = mathML.substring(tempIndex, mathML.indexOf(">", tempIndex) + 1);
			mathML = replaceAll(mathML, tempString, "");
			tempIndex++;
		}

		return mathML;
	}

	//=======================================================
	//=======================================================
	function replaceAll(theString, pattern, replacement)
	{
		return theString.split(pattern).join(replacement);
	}

	//=======================================================
	// Do various character replacements
	//=======================================================
	function replaceChars(str)
	{
		str=replaceAll(str, " &quot;", "*");		// @FIXME/dg: Is that space correct?
		str=replaceAll(str, "&quot;"+chr(18), "-");

		//Multiplication Symbol
		str=replaceAll(str, "•", "*");
		str=replaceAll(str, "∙", "*");
		str=replaceAll(str, "&#x2022;", "*");
		str=replaceAll(str, "&#x2219;", "*");
		
		//Substraction Symbol
		str=replaceAll(str, "&#x2212;", "-");

		//greater less than
		str=replaceAll(str, "&gt;", ">");
		str=replaceAll(str, "&lt;", "<");
		str=replaceAll(str, "&amp;ge;", ">=");
		str=replaceAll(str, "&#x2265;", ">=");
		str=replaceAll(str, "&amp;le;", "<=");
		str=replaceAll(str, "&#x2264;", "<=");
		str=replaceAll(str, "&#x8800;", "!=");
		str=replaceAll(str, "&#x003c;", "<");
		str=replaceAll(str, "&#x003e;", ">");
		str=replaceAll(str, "&#x2264;", "<=");
		str=replaceAll(str, "&#x2265;", ">=");
		str=replaceAll(str, "≤", "<=");
		str=replaceAll(str, "≥", ">=");
		str=replaceAll(str, "±", "+/-");

		//and/or ops
		str=replaceAll(str, "&amp;and;", "&");
		str=replaceAll(str, "&amp;or;", "|");
		str=replaceAll(str, "&#x2227;", "&");
		str=replaceAll(str, "&#x2228;", "|");

		//the ~ symbol for scientific notation
		str=replaceAll(str, "&#x00D7;", "~");
		str=replaceAll(str, "×", "~");

		//the $ symbol for non slash divide
		str=replaceAll(str, "&#x00F7;", "$");

		return str;
	}
/*
	//=======================================================
	// Convert an XML object to a string
	//=======================================================
	function XMLToString(xml)
	{
		// Special case for IE
		if (window.ActiveXObject)
			return xml.xml;

		// Code for Mozilla, Firefox, Opera, etc.
		var tst = (new XMLSerializer()).serializeToString(xml);
		return (new XMLSerializer()).serializeToString(xml);
	}

	//=======================================================
	// Convert a string to a new XML object
	//=======================================================
	function stringToXML(string)
	{
		return $.parseXML(string);
	}
*/
	//=======================================================
	// This module uses chr() instead of String.fromCharCode()
	// Provide a simple redirect.
	//=======================================================
	function chr(val)
	{
		return String.fromCharCode(val);
	}

},{"xmlTools":"xml"}],6:[function(require,module,exports){
//==========================================================================
// Tree node type (absolute value)
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Calculator.MathTree.AbsoluteValue extends FunctionWithParen
var tree = require('./tree');	// node tree helper file

	//=======================================================
	// Constructor
	//=======================================================
	AbsoluteValue = function()
	{
		tree.FunctionWithParen.call(this);	// Call the parent constructor (was super())
		this.className = "AbsoluteValue";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	AbsoluteValue.prototype = new tree.FunctionWithParen();
	AbsoluteValue.prototype.constructor = AbsoluteValue;

	//=======================================================
	//=======================================================
	AbsoluteValue.prototype.evaluateNode = function(variableValue)
	{
		var eval = this.middleNode.evaluateNode(variableValue);
		eval.numerator = Math.abs(eval.numerator);
		eval.denominator = Math.abs(eval.denominator);
		return eval;
	}

	//=======================================================
	//=======================================================
	AbsoluteValue.prototype.getApproximateValueOfTree = function(variables)
	{
		return Math.abs(this.middleNode.getApproximateValueOfTree(variables));
	}

	//=======================================================
	//=======================================================
	AbsoluteValue.prototype.evaluateNodeWithVariables = function(variables)
	{
		var eval = this.middleNode.evaluateNodeWithVariables(variables);
		eval.numerator = Math.abs(eval.numerator);
		eval.denominator = Math.abs(eval.denominator);
		return eval;
	}

	//=======================================================
	//=======================================================
	AbsoluteValue.prototype.getTreeAsString = function(isDecimal)
	{
		var tempString = "abs(";
		if (this.middleNode !== null)
			tempString += this.middleNode.getTreeAsString(isDecimal);

		tempString += ")";
		return tempString;
	}

	//=======================================================
	//=======================================================
	AbsoluteValue.prototype.getNodeAsString = function(isDecimal)
	{
		return "abs()";
	}

module.exports = AbsoluteValue;

},{"./tree":47}],7:[function(require,module,exports){
//==========================================================================
// Tree node type: AddSubtractBase
// base class for Addition and Subtraction classes
//==========================================================================
var tree = require('./tree');	// General math tools
var _ = require('underscore'); 

	//=======================================================
	// Constructor
	//=======================================================
	AddSubtractBase = function()
	{
		tree.HorizontalOperator.call(this);	// Call the parent constructor (was super())

		this.n = "+";
		this.className = "AddSubtractBase";
		this.precedence = 5;
	}

	//=======================================================
	// Inheritance
	//=======================================================
	AddSubtractBase.prototype = new tree.HorizontalOperator();
	AddSubtractBase.prototype.constructor = AddSubtractBase;

/*************************************************************/
/*   	FUNCTIONS THAT RETURN INFO ABOUT THE GIVEN TREE		 */
/*************************************************************/

	//=======================================================
	//=======================================================
	AddSubtractBase.prototype.checkForZeros = function()
	{
		var foundZero = false;

		if (this.leftNode !== null && (this.leftNode instanceof tree.AddSubtractBase))
			foundZero = this.leftNode.checkForZeros() || foundZero;

		if (this.rightNode !== null && (this.rightNode instanceof tree.AddSubtractBase))
			foundZero = this.rightNode.checkForZeros() || foundZero;

		if (this.leftNode instanceof tree.Numerical && this.leftNode.equalsZero()
            ||
            this.rightNode instanceof tree.Numerical && this.rightNode.equalsZero())
			return true;

		return foundZero;
	}

	//=======================================================
	//=======================================================
	AddSubtractBase.prototype.canRemoveZero = function()
	{
		return true;
	}

	//=======================================================
	//=======================================================
	AddSubtractBase.prototype.isOrderedPolynomial = function()
	{
		if (this.leftNode instanceof tree.AddSubtractBase)
		{
			if (this.leftNode.rightNode.getDegree() <= this.rightNode.getDegree())
				return false;
			else
				return this.leftNode.isOrderedPolynomial();
		}
		else
		{
			if (this.leftNode.getDegree() <= this.rightNode.getDegree())
				return false;
			else
				return true;
		}
	}

	//=======================================================
	//=======================================================
	AddSubtractBase.prototype.countTerms = function()
	{
		var terms = 0;
		var childTerms = 0;
		var child;
		var myChildren = this.getChildren();
		while (myChildren.length > 0)
		{
			child = myChildren.pop();
			if (child !== null)
			{
				childTerms = child.countTerms();
				if (childTerms === 0)
					terms++;
				else
					terms += childTerms;
			}
		}

		return terms;
	}

	//=======================================================
	//=======================================================
	AddSubtractBase.prototype.orderPolynomial = function()
	{
		var swapped = false;
		var rightDegree =  this.rightNode.getDegree();
		var leftDegree;

		if (this.leftNode instanceof tree.AddSubtractBase)
		{
			swapped = this.leftNode.orderPolynomial();

			leftDegree = this.leftNode.rightNode.getDegree();
			if (this.parentNode && leftDegree < rightDegree)
			{
				//now we need to swap the subtrees, including the operator.
				var tempNode = this.leftNode;
				this.leftNode = tempNode.leftNode;
				this.leftNode.parentNode = this;
				tempNode.leftNode = this;
				tempNode.parentNode = this.parentNode;
				this.parentNode.assignNodeNewChild(this, tempNode);
				this.parentNode = tempNode;
				if (this.rootNode.rootNode === this)
					this.rootNode.rootNode = tempNode;
				swapped = true;
			}
		}
		else
		{
			//This means that we are at the end of the line
			leftDegree = this.leftNode.getDegree();

			if (leftDegree < rightDegree)
			{
				//now we need to swap the subtrees
				var tempNode = this.leftNode;
				this.leftNode = this.rightNode;
				this.rightNode = tempNode;

				swapped = true;
			}
		}

		return swapped;
	}

	//=======================================================
	//=======================================================
	AddSubtractBase.prototype.getOppositeOperator = function(n)
	{
		switch (n){
			case "+":
				return "-";
			case "-":
            case String.fromCharCode(0x2212):
				return "+";
			default:
				return n;
		}
	}

	//=======================================================
	//=======================================================
	AddSubtractBase.prototype.areSignsInClass = function (n1, n2) {
        if (n1 == n2
            || n1 == this.getOppositeOperator(n2))
            return true;

            return false;
    }
    
	//=======================================================
	//=======================================================
	AddSubtractBase.prototype.checkSigns = function (theNode, rules) {
        if (this.areSignsInClass(this.n, theNode.n))
            return true;
        return false;
    }

	//=======================================================
	//=======================================================
	AddSubtractBase.prototype.findAllVariableGroups = function(list)
	{
        processVars (this.leftNode, list);
        processVars (this.rightNode, list);
    }
        
	//=======================================================
	//=======================================================
    processVars = function(ptr, list)
    {
        var terms = {};
        ptr.findAllVariables(terms);
        //var noNumCombine = (ptr instanceof tree.Parenthesis && ptr.middleNode instanceof tree.AddSubtractBase);
        
        if (ptr instanceof tree.Multiplication) // combine vars
        {
            var combineVar = "";
            
            // combine Term names to reflect the multiplication group:
            _.each(terms, function(value, key) // find the objects to change key name:
            {
                combineVar = combineVar + "*" + key;
            });

            if (list.hasOwnProperty(combineVar))
                list[combineVar]++;
            else //if (term.indexOf("numerical") == -1) // don't add numerical
                list[combineVar] = 1; // add the new term
        }
        else
            _.each(terms, function(term, key) // find the objects to change key name:
            {
                if (list.hasOwnProperty(key))
                    list[key]++;
                else //if (term.indexOf("numerical") == -1) // don't add numerical
                    list[key] = 1; // add the new term
            });
	}

module.exports = AddSubtractBase;
},{"./tree":47,"underscore":61}],8:[function(require,module,exports){
//==========================================================================
// Tree node type: Addition
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Calculator.MathTree.Addition extends HorizontalOperator
var tree = require('./tree');	// General math tools

	//=======================================================
	// Constructor
	//=======================================================
	Addition = function()
	{
		tree.AddSubtractBase.call(this);	// Call the parent constructor (was super())

		this.n = "+";
		this.className = "Addition";
		this.precedence = 5;
	}

	//=======================================================
	// Inheritance
	//=======================================================
	Addition.prototype = new tree.AddSubtractBase();
	Addition.prototype.constructor = Addition;

/*************************************************************/
/*   	FUNCTIONS THAT RETURN INFO ABOUT THE GIVEN TREE		 */
/*************************************************************/
/*
	//=======================================================
	//=======================================================
	Addition.prototype.checkForZeros = function()
	{
		var foundZero = false;

		if (this.leftNode !== null && (this.leftNode instanceof Addition
                                       || this.leftNode instanceof Subtraction))
			foundZero = this.leftNode.checkForZeros() || foundZero;

		if (this.rightNode !== null && (this.rightNode instanceof Addition
                                       || this.rightNode instanceof Subtraction))
			foundZero = this.rightNode.checkForZeros() || foundZero;

		if (this.leftNode instanceof tree.Numerical && this.leftNode.equalsZero()
            ||
            this.rightNode instanceof tree.Numerical && this.rightNode.equalsZero())
			return true;

		return foundZero;
	}

	//=======================================================
	//=======================================================
	Addition.prototype.canRemoveZero = function()
	{
		return true;
	}
*/
	//=======================================================
	//=======================================================
	Addition.prototype.countTerms = function()
	{
		var terms = 0;
		var childTerms = 0;
		var child;
		var myChildren = this.getChildren();
		while (myChildren.length > 0)
		{
			child = myChildren.pop();
			if (child !== null)
			{
				childTerms = child.countTerms();
				if (childTerms === 0)
					terms++;
				else
					terms += childTerms;
			}
		}

		return terms;
	}

	//=======================================================
	//=======================================================
	Addition.prototype.findLikeTerms = function(terms, isNegative)
	{
		if (this.leftNode !== null)
			this.leftNode.findLikeTerms(terms, isNegative);

        if (terms.changed)
            return;

		if (this.rightNode !== null)
        {
			if (this.parentNode instanceof tree.AddSubtractBase)
            {
                this.rightNode.findLikeTerms(terms, false);

                var variables = {}; // catch same variable terms:
                this.parentNode.findAllVariableGroups(variables);
    
                for (var prop in variables)
                {
                    if (variables[prop] > 1)
                    {
                        terms.changed = true;
                        return;
                    }
                }
            }
			else
				this.rightNode.findLikeTerms(terms, false);
        }
	}

	//=======================================================
	//=======================================================
	Addition.prototype.getNumerical = function()
	{
		if (this.leftNode instanceof tree.Numerical)
			return this.leftNode.number;
		else if (this.rightNode instanceof tree.Numerical)
			return this.rightNode.number;
		else
			return undefined;
	}

	//=======================================================
	//=======================================================
	Addition.prototype.getPolyTerms = function(polyList)
	{
		//trace("in get poly terms add");
		//trace(this.getTreeAsString());
		//trace(this.leftNode.getTreeAsString());
		//trace(this.rightNode.getTreeAsString());

		if (this.leftNode instanceof Addition || this.leftNode instanceof tree.Subtraction)
		{
			polyList.push(this.rightNode.duplicateTree(this.rootNode));
			this.leftNode.getPolyTerms(polyList);
		}
		else
		{
			//This means that we are at the end of the line
			polyList.push(this.leftNode.duplicateTree(this.rootNode));
			polyList.push(this.rightNode.duplicateTree(this.rootNode));
		}
	}

	//=======================================================
	//=======================================================
	Addition.prototype.getPolyCoefficient = function()
	{
		var leftDegree = this.leftNode.getDegree();
		var rightDegree = this.rightNode.getDegree();

		if (leftDegree > rightDegree)
			return this.leftNode.getPolyCoefficient();
		else if (leftDegree < rightDegree)
			return this.rightNode.getPolyCoefficient();
		else
			//this means they are the same, so add them.
			return Fraction.plus(this.leftNode.getPolyCoefficient(), this.rightNode.getPolyCoefficient());
	}
/*
	//=======================================================
	//=======================================================
	Addition.prototype.isOrderedPolynomial = function()
	{
		if (this.leftNode instanceof Addition || this.leftNode instanceof tree.Subtraction)
		{
			if (this.leftNode.rightNode.getDegree() <= this.rightNode.getDegree())
				return false;
			else
				return this.leftNode.isOrderedPolynomial();
		}
		else
		{
			if (this.leftNode.getDegree() <= this.rightNode.getDegree())
				return false;
			else
				return true;
		}
	}
*/
	//=======================================================
	//=======================================================
	Addition.prototype.performApproximateOp = function(op1, op2)
	{
		return op1 + op2;
	}

	//=======================================================
	//=======================================================
	Addition.prototype.performOp = function(op1, op2)
	{
		return tree.Fraction.plus(op1, op2);
	}

/*************************************************************/
/*  	 	FUNCTIONS THAT MODIFY THE GIVEN TREE			 */
/*************************************************************/

	//=======================================================
	//=======================================================
	Addition.prototype.addNegative = function()
	{
		var addedNegative = tree.HorizontalOperator.prototype.addNegative.call(this);

		if (this.rightNode !== null)
		{
			if (this.rightNode instanceof tree.Numerical && this.rightNode.isNegative())
			{
				var tempNode = new tree.Subtraction();
				this.rightNode.updateValue(Fraction.multiply(this.rightNode.number, new tree.Fraction(-1)));

				tempNode.parentNode = this.parentNode;
				this.parentNode.assignNodeNewChild(this, tempNode);
				this.leftNode.parentNode = tempNode;
				tempNode.leftNode = this.leftNode;
				this.rightNode.parentNode = tempNode;
				tempNode.rightNode = this.rightNode;

				return true;
			}
		}

		return addedNegative;
	}
/*
	//=======================================================
	//=======================================================
	Addition.prototype.orderPolynomial = function()
	{
		var swapped = false;
		var rightDegree =  this.rightNode.getDegree();
		var leftDegree;

		if (this.leftNode instanceof Addition || this.leftNode instanceof tree.Subtraction)
		{
			swapped = this.leftNode.orderPolynomial();

			leftDegree = this.leftNode.rightNode.getDegree();
			if (leftDegree < rightDegree)
			{
				//now we need to swap the subtrees, including the operator.
				var tempNode = this.leftNode;
				this.leftNode = tempNode.leftNode;
				this.leftNode.parentNode = this;
				tempNode.leftNode = this;
				tempNode.parentNode = this.parentNode;
				this.parentNode.assignNodeNewChild(this, tempNode);
				this.parentNode = tempNode;
				if (this.rootNode.rootNode === this)
					this.rootNode.rootNode = tempNode;
				swapped = true;
			}
		}
		else
		{
			//This means that we are at the end of the line
			leftDegree = this.leftNode.getDegree();

			if (leftDegree < rightDegree)
			{
				//now we need to swap the subtrees
				var tempNode = this.leftNode;
				this.leftNode = this.rightNode;
				this.rightNode = tempNode;

				swapped = true;
			}
		}

		return swapped;
	}
*/
	//=======================================================
	//=======================================================
	Addition.prototype.doublePlusMinus = function()
	{
		//trace("in double plus minus");
		var doubleOp = false;

		if (this.leftNode !== null)
			doubleOp = this.leftNode.doublePlusMinus() || doubleOp;

		if (this.rightNode !== null)
			doubleOp = this.rightNode.doublePlusMinus() || doubleOp;

		if (this.rightNode !== null)
		{
			//trace("right node not null");
			//trace(this.rightNode.getTreeAsString());
			//trace(this.leftNode.getTreeAsString());
			if (this.rightNode instanceof tree.Numerical && this.rightNode.isNegative())
			{
				var tempNode = new tree.Subtraction();
				this.rightNode.updateValue(Fraction.multiply(this.rightNode.number, new tree.Fraction(-1)));

				//trace("changing in plus minus");
				tempNode.leftNode = this.leftNode;
				tempNode.leftNode.parentNode = this;
				tempNode.rightNode = this.rightNode;
				tempNode.rightNode.parentNode = this;
				tempNode.parentNode = this.parentNode;
				this.parentNode.assignNodeNewChild(this, tempNode);

				tempNode.rootNode = this.rootNode;
				if (tempNode.parentNode === null)
					tempNode.rootNode.rootNode = tempNode;

				return true;
			}
			else
			{
				//trace("addition with right node not numerical");
				//trace(this.rightNode.getTreeAsString());
				//trace(this.leftNode.getTreeAsString());

				if (this.rightNode instanceof tree.Numerical)
				{
					//trace("got positive numerical");
					return false;
				}

				var tempNode2 = this.rightNode;
				while (!(tempNode2 instanceof tree.Multiplication))
				{
					tempNode2 = tempNode2.leftNode;
					if (tempNode2 === null)
						break;
				}

				if (tempNode2 instanceof tree.Multiplication)
				{
					//trace("right node plus minus is multiplication");
					//trace(this.rightNode.getTreeAsString());
					//trace(this.leftNode.getTreeAsString());
					//check if leftnode is negative number
					var lastMultNode = tempNode2.leftNode;
					while (lastMultNode instanceof tree.Multiplication)
					{
						lastMultNode = lastMultNode.leftNode;
					}
					if (lastMultNode instanceof tree.Numerical && lastMultNode.isNegative())
					{
						//trace("got negative numerical multiplication in addition plusminus");
						//trace(this.getTreeAsString());
						//trace(lastMultNode.getTreeAsString());
						var tempNode = new tree.Subtraction();
						lastMultNode.updateValue(Fraction.multiply(lastMultNode.number, new tree.Fraction(-1)));
						//trace("after numerical update");
						//trace(lastMultNode.getTreeAsString());
						//trace(this.parentNode.getTreeAsString());
						if (lastMultNode.equalsOne())
						{
							//get rid of it
							//lastMultNode.parentNode.leftNode = null;
							//lastMultNode.parentNode.removeNulls();
							//lastMultNode.parentNode = null;
							//new test
							//lastMultNode.parentNode.parentNode.leftNode = lastMultNode.parentNode.rightNode;
							//lastMultNode.parentNode.rightNode.parentNode = lastMultNode.parentNode.parentNode;

						}

						//changed
						tempNode.leftNode = this.leftNode;
						tempNode.leftNode.parentNode = this;
						tempNode.rightNode = this.rightNode;
						tempNode.rightNode.parentNode = this;
						tempNode.parentNode = this.parentNode;

						if (this.parentNode !== null)
						{
							this.parentNode.assignNodeNewChild(this, tempNode);

						}
						else
						{
							tempNode.leftNode.parentNode = tempNode;
							tempNode.rightNode.parentNode = tempNode;

						}

						tempNode.rootNode = this.rootNode;

						if (tempNode.parentNode === null)
							tempNode.rootNode.rootNode = tempNode;

						if (this.parentNode.parentNode === null)
							this.parentNode.rootNode.rootNode = this.parentNode;
						//trace("after changes negative numerical multi");
						//trace(this.parentNode.getTreeAsString());
						//trace(this.parentNode.rootNode.getTreeAsString());
						//trace(tempNode.rootNode.getTreeAsString());
						return true;

					}
				}
				else
					return false;

			}
		}

		return doubleOp;
	}

	//=======================================================
	// Identical to the one in Equality
	//=======================================================
	Addition.prototype.removeParen = function()
	{
		var removedParen = false;

		if (this.leftNode !== null)
			removedParen = this.leftNode.removeParen() || removedParen;
		if (this.rightNode !== null)
			removedParen = this.rightNode.removeParen() || removedParen;

		if (this.leftNode !== null && this.leftNode instanceof tree.Parenthesis)
		{
			this.leftNode.middleNode.parentNode = this;
			this.leftNode = this.leftNode.middleNode;
			removedParen = true;
		}
		if (this.rightNode !== null && this.rightNode instanceof tree.Parenthesis)
		{
			this.rightNode.middleNode.parentNode = this;
			this.rightNode = this.rightNode.middleNode;
			removedParen = true;
		}
		return removedParen;
	}

	//=======================================================
	//=======================================================
	Addition.prototype.removeNulls = function()
	{
		var removedNulls = false;
		if (this.leftNode !== null)
			removedNulls = this.leftNode.removeNulls() || removedNulls;
		if (this.rightNode !== null)
			removedNulls = this.rightNode.removeNulls() || removedNulls;

        if (this.parentNode) // NF: add this condition because it is null if Addition is the top rootNode
        {
            if (this.leftNode === null)
            {
                this.parentNode.assignNodeNewChild(this, this.rightNode);
                this.rightNode.parentNode = this.parentNode;
                if (this.rootNode.rootNode === this)
                    this.rootNode.rootNode = this.rightNode;
                return true;
            }
            else if (this.rightNode === null)
            {
                this.parentNode.assignNodeNewChild(this, this.leftNode);
                this.leftNode.parentNode = this.parentNode;
                if (this.rootNode.rootNode === this)
                    this.rootNode.rootNode = this.leftNode;
                return true;
            }
        }

		return removedNulls;
	}

/*************************************************************/
/*						PRIVATE FUNCTIONS					 */
/*************************************************************/

	//=======================================================
	//=======================================================
	Addition.prototype.canDistribute = function()
	{
		return false;
	}

	//=======================================================
	// NF: This was marked as private but it is called by the
    //     base HorizontalOperator, therefore is converted to member function.
	//=======================================================
	Addition.prototype.canSimplifyNode = function ()
	{
		return true;
	}

	//=======================================================
	// DG: This was marked as private but doesn't occur within this module.
	// It calls removeNulls, which requires changing this to a member function
	// so it can operate on this();
	//=======================================================
	Addition.prototype.combineNumericals = function (leftObject, rightObject, reduceFracs)
	{
		var finalObject = {changed:true};
		var leftNum = leftObject.Numerical.number;
		var rightNum = rightObject.Numerical.number;

		if (leftObject.isOpposite)
			leftNum = this.getOpposite(leftNum);
		if (rightObject.isOpposite)
			rightNum = this.getOpposite(rightNum);

		var newNum = this.performOp(leftNum, rightNum);
		if (reduceFracs)
			var reduced = newNum.reduce();

		if (!leftObject.isOpposite)
		{
			leftObject.Numerical.updateValue(newNum);
			rightObject.Numerical.deleteNode();
			finalObject.Numerical = leftObject.Numerical;
			finalObject.isOpposite = leftObject.isOpposite;
		}
		else if (!rightObject.isOpposite)
		{
			rightObject.Numerical.updateValue(newNum);
			leftObject.Numerical.deleteNode();
			finalObject.Numerical = rightObject.Numerical;
			finalObject.isOpposite = rightObject.isOpposite;
		}
		else
		{
			newNum = this.getOpposite(newNum);
			leftObject.Numerical.updateValue(newNum);
			rightObject.Numerical.deleteNode();
			finalObject.Numerical = leftObject.Numerical;
			finalObject.isOpposite = leftObject.isOpposite;
		}

		this.removeNulls();
		return finalObject;
	}

	//=======================================================
	//=======================================================
	Addition.prototype.getNodeAsString = function()
	{
		return this.n;
	}

	//=======================================================
	//=======================================================
	Addition.prototype.replaceNumerical = function(num)
	{
		if (this.leftNode instanceof tree.Numerical)
			this.leftNode.updateValue(num);
		else if (this.rightNode instanceof tree.Numerical)
			this.rightNode.updateValue(num);
	}

module.exports = Addition;

},{"./tree":47}],9:[function(require,module,exports){
//==========================================================================
// Tree node type: Boolean
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
// BooleanOperator extends HorizontalOperator{

var tree = require('./tree');	// General math tools

	//=======================================================
	// Constructor
	//=======================================================
	BooleanOperator = function(op)
	{
		tree.HorizontalOperator.call(this);	// Call the parent constructor (was super())

		this.n = op;
		this.className = "BooleanOperator";
		this.isBinary = true;
	}

	//=======================================================
	// Inheritance
	//=======================================================
	BooleanOperator.prototype = new tree.HorizontalOperator();
	BooleanOperator.prototype.constructor = BooleanOperator;

	//=======================================================
	//=======================================================
	BooleanOperator.prototype.canDistribute = function()
	{
		return false;
	}

	//=======================================================
	//=======================================================
	BooleanOperator.prototype.getOpAsString = function()
	{
		switch(this.n)
		{
			case "&":
				return "and";
			case "|":
				return "or";
		}
	}

	//=======================================================
	//=======================================================
	BooleanOperator.prototype.isPolynomial = function()
	{
		return false;
	}

	//=======================================================
	//=======================================================
	BooleanOperator.prototype.isRational = function()
	{
		return false;
	}


	//=======================================================
	//=======================================================
	BooleanOperator.prototype.checkForZeros = function()
	{
		var foundZero = false;

		if (this.leftNode !== null)
			foundZero = this.leftNode.checkForZeros();

		if (this.rightNode !== null)
			foundZero = this.rightNode.checkForZeros() || foundZero;

		return foundZero;
	}

	//=======================================================
	//=======================================================
	BooleanOperator.prototype.checkForOnes = function()
	{
		var foundOne = false;

		if (this.leftNode !== null)
			foundOne = this.leftNode.checkForOnes();

		if (this.rightNode !== null)
			foundOne = this.rightNode.checkForOnes() || foundOne;

		return foundOne;
	}

module.exports = BooleanOperator;

},{"./tree":47}],10:[function(require,module,exports){
//==========================================================================
// Tree node type: Comma
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Calculator.MathTree.Comma extends HorizontalOperator{
var tree = require('./tree');	// node tree helper file

	//=======================================================
	// Constructor
	//=======================================================
	Comma = function()
	{
		tree.HorizontalOperator.call(this);	// Call the parent constructor (was super())

		this.n = ",";
		this.className = "Comma";
		this.isBinary = true;
	}

	//=======================================================
	// Inheritance
	//=======================================================
	Comma.prototype = new tree.HorizontalOperator();
	Comma.prototype.constructor = Comma;

	//=======================================================
	//=======================================================
	Comma.prototype.canDistribute = function()
	{
		return false;
	}

	//=======================================================
	//=======================================================
	Comma.prototype.getOpAsString = function()
	{
		return ",";
	}

	//=======================================================
	//=======================================================
	Comma.prototype.isPolynomial = function()
	{
		return false;
	}

	//=======================================================
	//=======================================================
	Comma.prototype.isRational = function()
	{
		return false;
	}

module.exports = Comma;

},{"./tree":47}],11:[function(require,module,exports){
//==========================================================================
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Calculator.MathTree.Cosecant extends TrigFunction
var tree = require('./tree');	// node tree helper file

	//=======================================================
	// Constructor
	//=======================================================
	Cosecant = function()
	{
		tree.TrigFunction.call(this);	// Call the parent constructor (was super())

		this.className = "Cosecant";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	Cosecant.prototype = new tree.TrigFunction();
	Cosecant.prototype.constructor = Cosecant;


	//=======================================================
	//=======================================================
	Cosecant.prototype.evaluateNode = function(variableValue)
	{
		var eval = this.middleNode.evaluateNode(variableValue);
		var val = eval.numerator / eval.denominator;

		var a = 1/Math.sin(val);
		var frac = new tree.Fraction(a);
		return frac;
	}

	//=======================================================
	//=======================================================
	Cosecant.prototype.getApproximateValueOfTree = function(variables)
	{
		var temp = 1/Math.sin(this.middleNode.getApproximateValueOfTree(variables));

		temp = temp*Math.pow(10, 6);
		temp = Math.floor(temp);
		temp = temp/Math.pow(10,6);

		return temp;
	}

	//=======================================================
	//=======================================================
	Cosecant.prototype.evaluateNodeWithVariables = function(variables)
	{
		var eval = this.middleNode.evaluateNodeWithVariables(variables);

		var val = eval.numerator / eval.denominator;

		var a = 1/Math.sin(val);
		var frac = new tree.Fraction(a);

		return frac;
	}

	//=======================================================
	//=======================================================
	Cosecant.prototype.getTreeAsString = function(isDecimal)
	{
		var tempString = "csc(";
		if (this.middleNode !== null)
			tempString += this.middleNode.getTreeAsString(isDecimal);
		tempString += ")";

		return tempString;
	}

	//=======================================================
	//=======================================================
	Cosecant.prototype.getNodeAsString = function(isDecimal)
	{
		return "csc()";
	}

module.exports = Cosecant;

},{"./tree":47}],12:[function(require,module,exports){
//==========================================================================
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Calculator.MathTree.Cosine extends TrigFunction
var tree = require('./tree');	// node tree helper file

	//=======================================================
	// Constructor
	//=======================================================
	Cosine = function()
	{
		tree.TrigFunction.call(this);	// Call the parent constructor (was super())

		this.className = "Cosine";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	Cosine.prototype = new tree.TrigFunction();
	Cosine.prototype.constructor = Cosine;


	//=======================================================
	//=======================================================
	Cosine.prototype.evaluateNode = function(variableValue)
	{
		var eval = this.middleNode.evaluateNode(variableValue);
		var val = eval.numerator / eval.denominator;

		var a = Math.cos(val);
		var frac = new tree.Fraction(a);
		return frac;
	}

	//=======================================================
	//=======================================================
	Cosine.prototype.getApproximateValueOfTree = function(variables)
	{
		var temp = Math.cos(this.middleNode.getApproximateValueOfTree(variables));
		temp = temp*Math.pow(10, 6);
		temp = Math.floor(temp);
		temp = temp/Math.pow(10,6);
		return temp;
	}

	//=======================================================
	//=======================================================
	Cosine.prototype.evaluateNodeWithVariables = function(variables)
	{
		var eval = this.middleNode.evaluateNodeWithVariables(variables);

		var val = eval.numerator / eval.denominator;

		var a = Math.cos(val);
		var frac = new tree.Fraction(a);

		return frac;
	}

	//=======================================================
	//=======================================================
	Cosine.prototype.getTreeAsString = function(isDecimal)
	{
		var tempString = "cos(";
		if (this.middleNode !== null)
			tempString += this.middleNode.getTreeAsString(isDecimal);
		tempString += ")";

		return tempString;
	}

	//=======================================================
	//=======================================================
	Cosine.prototype.getNodeAsString = function(isDecimal)
	{
		return "cos()";
	}

module.exports = Cosine;

},{"./tree":47}],13:[function(require,module,exports){
//==========================================================================
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Calculator.MathTree.Cotangent extends TrigFunction
var tree = require('./tree');	// node tree helper file

	//=======================================================
	// Constructor
	//=======================================================
	Cotangent = function()
	{
		tree.TrigFunction.call(this);	// Call the parent constructor (was super())

		this.className = "Cotangent";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	Cotangent.prototype = new tree.TrigFunction();
	Cotangent.prototype.constructor = Cotangent;


	//=======================================================
	//=======================================================
	Cotangent.prototype.evaluateNode = function(variableValue)
	{
		var eval = this.middleNode.evaluateNode(variableValue);
		var val = eval.numerator / eval.denominator;

		var a = 1/Math.tan(val);
		var frac = new tree.Fraction(a);
		return frac;
	}

	//=======================================================
	//=======================================================
	Cotangent.prototype.getApproximateValueOfTree = function(variables)
	{
		var temp = 1/Math.tan(this.middleNode.getApproximateValueOfTree(variables));

		temp = temp*Math.pow(10, 6);
		temp = Math.floor(temp);
		temp = temp/Math.pow(10,6);

		return temp;
	}

	//=======================================================
	//=======================================================
	Cotangent.prototype.evaluateNodeWithVariables = function(variables)
	{
		var eval = this.middleNode.evaluateNodeWithVariables(variables);
		var val = eval.numerator / eval.denominator;

		var a = 1/Math.tan(val);
		var frac = new tree.Fraction(a);

		return frac;
	}

	//=======================================================
	//=======================================================
	Cotangent.prototype.getTreeAsString = function(isDecimal)
	{
		var tempString = "cot(";
		if (this.middleNode !== null)
			tempString += this.middleNode.getTreeAsString(isDecimal);
		tempString += ")";

		return tempString;
	}

	//=======================================================
	//=======================================================
	Cotangent.prototype.getNodeAsString = function(isDecimal)
	{
		return "cot()";
	}

module.exports = Cotangent;

},{"./tree":47}],14:[function(require,module,exports){
//==========================================================================
// Tree node type: Division
//
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Division extends MultDivide
var tree = require('./tree');	// General math tools

	//=======================================================
	// Constructor
	//=======================================================
	Division = function(type)
	{
		tree.MultDivide.call(this);	// Call the parent constructor (was super())

		if (type !== undefined)
			this.n = type;
		else
			this.n = "/";

		this.precedence = 8;
		this.className = "Division";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	Division.prototype = new tree.MultDivide();
	Division.prototype.constructor = Division;


/*************************************************************/
/*   	FUNCTIONS THAT RETURN INFO ABOUT THE GIVEN TREE		 */
/*************************************************************/
	//=======================================================
	//=======================================================
	Division.prototype.checkForDenomZeros = function()
	{ 
        return ( this.rightNode instanceof tree.Numerical && this.rightNode.equalsZero())
	}

	//=======================================================
	//=======================================================
	Division.prototype.canInsertToRightOf = function(node)
	{
		if (node instanceof Division)
			return false;
		else
			return true;
	}

	//=======================================================
	// return: true - any fractions need to bereduced
	//=======================================================
	Division.prototype.reduceFractions = function(toInt)
	{
        // If numerator and denominator both have numericals
        // && they are either numerial alone or in multiplication operations
        // then mod numbers in numerator by numbers in denominator
        // if result is zero: fraction need to be reduced.
        var numerator = getNumerical(this.leftNode);
        var denominator = getNumerical(this.rightNode);
        if (numerator && denominator
            && (numerator % denominator == 0
                || denominator % numerator == 0))
            return true; // need to be reduced
        
		return false;
	}

	//=======================================================
	//=======================================================
    getNumerical = function (node)
    {
        var ptr = node;
		if (ptr instanceof tree.Parenthesis)
			ptr = ptr.middleNode;
            
        if (ptr instanceof tree.Numerical) // numerical only
        {   // return a interger if it allows:
            if (ptr.isInteger())
                return ptr.number.numerator;
            else
                if ((ptr.number.numerator % ptr.number.denominator == 0))
                    return ptr.number.numerator / ptr.number.denominator;
                else
                    return null;
        }
        
        // not just a number:
        var numbers = [];
        if (ptr instanceof tree.Multiplication && ptr.parenChildsAreSingleTerm())
        {
            ptr.findAllInstancesOfClass("Numerical", numbers);
            if (numbers.length == 1 && numbers[0].isInteger())
                return numbers[0].number.numerator;
        }
        
        return null;
    }
/*    
	//=======================================================
	//=======================================================
	Division.prototype.areAllVariablesCombined = function()
	{
		var variables = {};
		var checkNodeLeft = this.leftNode;
		var checkNodeRight = this.rightNode;

		if (checkNodeLeft instanceof tree.Parenthesis)
			checkNodeLeft = checkNodeLeft.middleNode;

		if (checkNodeRight instanceof tree.Parenthesis)
			checkNodeRight = checkNodeRight.middleNode;

		if ((checkNodeLeft instanceof tree.Variable || checkNodeLeft instanceof tree.Power
             || (checkNodeLeft instanceof tree.Multiplication
                 && checkNodeLeft.parenChildsAreSingleTerm())) &&
			(checkNodeRight instanceof tree.Variable || checkNodeRight instanceof tree.Power
             || (checkNodeRight instanceof tree.Multiplication
                 && checkNodeRight.parenChildsAreSingleTerm())))
		{
			this.findAllVariables(variables);

			for (var prop in variables)
			{
				//trace("going through variables in combined div");
				//trace(prop);
				if (variables[prop] > 1)
					return false;
			}
			return true;
		}

		//trace("not checking vars in divide combine");
		////trace(this.leftNode.className);
		////trace(this.rightNode.className);

		return true;
	}

	//=======================================================
	//=======================================================
	Division.prototype.findLikeTerms = function(terms, isNegative)
	{
		var term = this.getTerm(this.precedence);
		var coefficient = this.getCoefficient(this.precedence);

		if (isNegative)
			coefficient = tree.Fraction.multiply(coefficient, new tree.Fraction(-1));

		if (terms.hasOwnProperty(term))
		{
			var oldCoefficient = terms[term];
			terms[term] = tree.Fraction.plus(oldCoefficient, coefficient);
			terms.changed = true;
		}
		else
		{
            if (!this.areAllVariablesCombined()) // NF: for case such as z*a/a
                terms.changed = true;
            
//r			terms.addProperty(term);
			terms[term] = coefficient;
		}
	}
*/
	//=======================================================
	//=======================================================
	Division.prototype.getCoefficient = function(newPrecedence)
	{
		if (this.precedence <= newPrecedence)
		{
			if (this.leftNode !== null)
				var coeffLeft = this.leftNode.getCoefficient(newPrecedence);
			else
				var coeffLeft = new tree.Fraction(1);

			if (this.rightNode !== null)
				var coeffRight = this.rightNode.getCoefficient(newPrecedence);
			else
				var coeffRight = new tree.Fraction(1);

			return tree.Fraction.divide(coeffLeft, coeffRight);
		}
		else
			return null;
	}

	//=======================================================
	//=======================================================
	Division.prototype.areAllFactorsCancelled = function()
	{
		var facs = {};
		getFactors(facs, true);

		for (var i in facs)
		{
			if (i === "order")
				continue;

			if (tree.Fraction(facs[i]).equalsTo(0, 1))
				return false;
		}

		return true;
	}

	//=======================================================
	//=======================================================
	Division.prototype.getFactors = function(terms, isNumerator)
	{
		if (terms.order === undefined)
			terms.order = [];

		this.leftNode.getFactors(terms, isNumerator);
		this.rightNode.getFactors(terms, !isNumerator);
	}

	//=======================================================
	//=======================================================
	Division.prototype.getNumerical = function()
	{
		if (this.leftNode instanceof tree.Numerical)
			return this.leftNode.number;
		else if (this.rightNode instanceof tree.Numerical)
			return tree.Fraction.divide(new tree.Fraction(1), this.rightNode.number);
		else
			return undefined;
	}

	//=======================================================
	//=======================================================
	Division.prototype.getPolyCoefficient = function()
	{
		return tree.Fraction.divide(this.leftNode.getPolyCoefficient(), this.rightNode.getPolyCoefficient());
	}

	//=======================================================
	//=======================================================
	Division.prototype.isPolynomial = function()
	{
		return false;
	}

	//=======================================================
	//=======================================================
	Division.prototype.isRadical = function()
	{
		if (this.leftNode.countFractions() > 1)
			return false;
		if (this.rightNode.countFractions() > 1)
			return false;

		return tree.HorizontalOperator.prototype.isRadical.call(this);
	}

	//=======================================================
	//=======================================================
	Division.prototype.isRational = function()
	{
		if ( (this.leftNode !== null) && (!this.leftNode.isPolynomial()) )
				return false;

		if ( (this.rightNode !== null) && (!this.rightNode.isPolynomial()) )
				return false;

		return true;
	}

/*************************************************************/
/*  	 	FUNCTIONS THAT MODIFY THE GIVEN TREE			 */
/*************************************************************/

	//=======================================================
	// Remove nodes with division by 1
	//=======================================================
	Division.prototype.checkForOnes = function()
	{
		var foundOne = false;

		if (this.leftNode !== null)
			foundOne = this.leftNode.checkForOnes() || foundOne;

		if (this.rightNode !== null)
			foundOne = this.rightNode.checkForOnes() || foundOne;

		if (this.rightNode instanceof tree.Numerical && this.rightNode.equalsOne())
		{
			this.rightNode.deleteNode(false);

			if (this.parentNode !== null)
				this.parentNode.assignNodeNewChild(this, this.leftNode);
			else
				this.rootNode.rootNode = this.leftNode;

			this.leftNode.parentNode = this.parentNode;

			//trace("Removing 1 from " + this.getNodeAsString());
			return true;
		}

		return foundOne;
	}

	//=======================================================
	//=======================================================
	Division.prototype.combineSquareRoots = function(isNumerator)
	{
		var canCombineObject = {changed:false};

		canCombineObject.changed = this.leftNode.combineSquareRoots(isNumerator) || canCombineObject.changed;
		canCombineObject.changed = this.rightNode.combineSquareRoots(!isNumerator) || canCombineObject.changed;

		return canCombineObject;
	}

	//=======================================================
	//=======================================================
	Division.prototype.distributeNode = function(node, distributeRight)
	{
		if (node.precedence < this.precedence)
		{
			if (distributeRight)
				return false; //can't distribute a division over a parenthesis with a +/-

			var distributed = false;

			if (node.leftNode instanceof tree.Numerical || node.leftNode instanceof tree.Variable)
			{
				var tempNode = this.duplicateNode(this.rootNode);
				var amount = this.rightNode.duplicateTree(this.rootNode);
				Node.insertRight(amount, tempNode);
				tempNode.leftNode = node.leftNode;
				tempNode.leftNode.parentNode = tempNode;
				node.leftNode = tempNode;
				tempNode.parentNode = node;
				distributed = true;
			}
			else
				distributed = this.distributeNode(node.leftNode, distributeRight) || distributed;

			if (node.rightNode instanceof tree.Numerical || node.rightNode instanceof tree.Variable)
			{
				var tempNode = this.duplicateNode(this.rootNode);
				var amount = this.rightNode.duplicateTree(this.rootNode);
				Node.insertRight(amount, tempNode);
				tempNode.leftNode = node.rightNode;
				tempNode.leftNode.parentNode = tempNode;
				node.rightNode = tempNode;
				tempNode.parentNode = node;
				distributed = true;
			}
			else
				distributed = this.distributeNode(node.rightNode, distributeRight) || distributed;

			return distributed;
		}
		else
		{ //need to choose just one node to distribute to
			if (distributeRight) //need more here.
				return false;

			var tempNode = this.duplicateNode(this.rootNode);
			var amount = this.rightNode.duplicateTree(this.rootNode);
			Node.insertRight(amount, tempNode);
			tempNode.leftNode = node;
			tempNode.parentNode = node.parentNode;
			tempNode.parentNode.assignNodeNewChild(node, tempNode);
			node.parentNode = tempNode;
			return true;
		}
	}

	//=======================================================
	//=======================================================
	Division.prototype.performApproximateOp = function(op1, op2)
	{
        if (op2 != 0)
            return op1 / op2;
        else
            return Number.NaN;
	}

	//=======================================================
	//=======================================================
	Division.prototype.performOp = function(op1, op2)
	{
		return tree.Fraction.divide(op1, op2);
	}

	//=======================================================
	//=======================================================
	Division.prototype.reciprocal = function()
	{
		var tempNode = this.leftNode;
		this.leftNode = this.rightNode;
		this.rightNode = tempNode;
	}

	//=======================================================
	//=======================================================
	Division.prototype.removeNulls = function()
	{
		var removedNulls = false;

		if (this.leftNode !== null)
			removedNulls = this.leftNode.removeNulls() || removedNulls;

		if (this.rightNode !== null)
			removedNulls = this.rightNode.removeNulls() || removedNulls;

		if (this.parentNode)
        {
            if (this.leftNode === null)
            {
                if (this.rightNode instanceof tree.Numerical)
                {
                    this.parentNode.assignNodeNewChild(this, this.rightNode);
                    this.rightNode.parentNode = this.parentNode;
                    this.rightNode.updateValue(this.rightNode.number.getReciprocal());
                }
                else
                {
                    //don't know what to do here;
                }
            }
            else if (this.rightNode === null)
            {
                this.parentNode.assignNodeNewChild(this, this.leftNode);
                this.leftNode.parentNode = this.parentNode;
                if (this.rootNode.rootNode === this)
                    this.rootNode.rootNode = this.leftNode;
    
                return true;
            }
        }

		return removedNulls;
	}

/*************************************************************/
/*						PRIVATE FUNCTIONS					 */
/*************************************************************/

	//=======================================================
	//=======================================================
	Division.prototype.canDistribute = function()
	{
		if (this.leftNode instanceof tree.Parenthesis)
			return true;
		else
			return false;
	}

	//=======================================================
	//=======================================================
	Division.prototype.canSimplifyNode = function()
	{
		return true;
	}

	//=======================================================
	//=======================================================
	Division.prototype.combineNumericals = function(leftObject, rightObject, reduceFracs)
	{
		var finalObject = {changed:true};
		var leftNum = leftObject.Numerical.number;
		var rightNum = rightObject.Numerical.number;

		if (leftObject.isOpposite)
			leftNum = this.getOpposite(leftNum);
		if (rightObject.isOpposite)
			rightNum = this.getOpposite(rightNum);

		//trace("going to perform op in div");
		var newNum = this.performOp(leftNum, rightNum);
		//trace("after perform op");

		if (newNum.isNaNNumber())
		{
			//trace("is nan");
			finalObject.changed = false;
			return finalObject;
		}

		if (reduceFracs)
			var reduced = newNum.reduce();

		//trace("combining numericals division");
		//trace(newNum.asStringNew());
		//trace(leftObject.isOpposite);
		//trace(rightObject.isOpposite);
		//dont combine numericals if they end up being less than zero
		if (newNum.denominator === 0)
		{
			finalObject.changed = false;
			return finalObject;
		}

		var tempNumber = newNum.numerator/newNum.denominator;

		if (Math.floor(tempNumber) !== tempNumber)
		{
			//commented lines below breaking the simplify when theres an integer multiplying fraction
			//like 3*(1/2)
			//finalObject.changed = false;
			//return finalObject;
		}

		if (!leftObject.isOpposite && newNum.isInteger())
		{
			leftObject.Numerical.updateValue(newNum);
			rightObject.Numerical.deleteNode();
			finalObject.Numerical = leftObject.Numerical;
			finalObject.isOpposite = leftObject.isOpposite;
		}
		else if (rightObject.isOpposite && newNum.isInteger())
		{
			rightObject.Numerical.updateValue(newNum);
			leftObject.Numerical.deleteNode();
			finalObject.Numerical = rightObject.Numerical;
			finalObject.isOpposite = rightObject.isOpposite;
		}
		else if (leftObject.isOpposite && newNum.reciprocal().isInteger())
		{
			newNum = this.getOpposite(newNum);
			leftObject.Numerical.updateValue(newNum);
			rightObject.Numerical.deleteNode();
			finalObject.Numerical = leftObject.Numerical;
			finalObject.isOpposite = leftObject.isOpposite;
		}
		else if (rightObject.isOpposite && newNum.reciprocal().isInteger())
		{
			newNum = this.getOpposite(newNum);
			rightObject.Numerical.updateValue(newNum);

			//problem when a division of 0.05/200 was performed, leaving numerator null
			if (this.leftNode === leftObject.Numerical)
				leftObject.Numerical.updateValue(new tree.Fraction(1));
			else
				leftObject.Numerical.deleteNode();

			finalObject.Numerical = rightObject.Numerical;
			finalObject.isOpposite = rightObject.isOpposite;
		}
		else{ //just put it on the left
			if (leftObject.isOpposite)
				newNum = this.getOpposite(newNum);

			leftObject.Numerical.updateValue(newNum);
			rightObject.Numerical.deleteNode();
			finalObject.Numerical = leftObject.Numerical;
			finalObject.isOpposite = leftObject.isOpposite;
		}

		//trace("end of combine numericals division");
		//trace(finalObject.Numerical.getTreeAsString());
		//trace(rightObject.Numerical.getTreeAsString());
		//trace(leftObject.Numerical.getTreeAsString());

		this.removeNulls();
        finalObject.reduced = reduced; // NF: shouldn't complain about non-reducable fraction
		return finalObject;
	}

	//=======================================================
	//=======================================================
	Division.prototype.getNodeAsString = function()
	{
		return "/";
	}

	//=======================================================
	//=======================================================
	Division.prototype.replaceNumerical = function(num)
	{
		if (this.leftNode instanceof tree.Numerical)
			this.leftNode.updateValue(num);
		else if (this.rightNode instanceof tree.Numerical)
			this.rightNode.updateValue(tree.Fraction.divide(new tree.Fraction(1), num));
	}

	//=======================================================
	//=======================================================
	Division.prototype.simplify = function(parentPrecedence, reduceFracs, rules)
	{
		var simplifyObject = tree.MultDivide.prototype.simplify.call(this, parentPrecedence, reduceFracs, rules);
        simplifyObject.changed = simplifyObject.changed || this.factorInDenominator();
        return simplifyObject;
    }

	//=======================================================
	// return: true - any fractions need to be reduced
	//=======================================================
	Division.prototype.factorInDenominator = function()
	{
        // If numerator and denominator both have numericals
        // && they are either numerial alone or in multiplication operations
        // then mod numbers in numerator by numbers in denominator
        // if result is zero: fraction need to be reduced.
        var integers = [];
        var haveInt = this.getNumericalGroup(this.leftNode, integers);
        var denominator = getNumerical(this.rightNode);
        if (!haveInt || !denominator)
            return false;
        
        for (var i=0; i<integers.length; i++)
        {
            if (integers[i] % denominator != 0)
                break; // go for next test
            return true; // find common denominator
        }
        
        for (var i=0; i<integers.length; i++)
        {
            if (denominator % integers[i] != 0)
                return false; //
        }
            
        return true; // find common denominator
	}
	//=======================================================
    // return: true = integer numbers in object integers
    //         false otherwise
	//=======================================================
    Division.prototype.getNumericalGroup = function (node, integers)
    {
        var ptr = node;
		if (ptr instanceof tree.Parenthesis)
			ptr = ptr.middleNode;
            
        if (ptr instanceof tree.Numerical) // numerical only
        {   // return a interger if it allows:
            if (ptr.isInteger())
            {
                integers[integers.length] = ptr.number.numerator;
                return true;
            }
            else
                if ((ptr.number.numerator % ptr.number.denominator == 0))
                    integers[integers.length] = ptr.number.numerator / ptr.number.denominator;
                //else
                
                    return true; //null;
        }
        
        // not just a number:
        var numbers = [];
        if (ptr instanceof tree.Multiplication && ptr.parenChildsAreSingleTerm())
        {
            ptr.findAllInstancesOfClass("Numerical", numbers);
            if (numbers.length == 1 && numbers[0].isInteger())
            {
                integers[integers.length] = numbers[0].number.numerator;
                return true;
            }
        }
        else
            if (ptr instanceof tree.AddSubtractBase)
        {
            var mult = (ptr.leftNode instanceof tree.Multiplication &&
                        ptr.rightNode instanceof tree.Multiplication);
            var ltMult = (ptr.leftNode instanceof tree.Multiplication &&
                        ptr.rightNode instanceof tree.Numerical);
            var rtMult = (ptr.leftNode instanceof tree.Numerical &&
                        ptr.rightNode instanceof tree.Multiplication);
            if (mult || ltMult || rtMult)
            {
                ptr.findAllInstancesOfClass("Numerical", numbers);
                for (var i=0; i<numbers.length; i++)
                    if (numbers[i].isInteger())
                        integers[integers.length] = numbers[i].number.numerator;
                    else
                        return false; // not all integers
                    
                return true; // success
            }
        }
    
        return false;
    }
    
	//=======================================================
	//=======================================================
	Division.prototype.doubleNegative = function()
	{
		//trace("in double negative division");
		var doubleNegatives = false;
		if (this.leftNode !== null)
			doubleNegatives = this.leftNode.doubleNegative() || doubleNegatives;
		if (this.rightNode !== null)
			doubleNegatives = this.rightNode.doubleNegative() || doubleNegatives;

		var numFrac;
		var denFrac;
		var numNumerical;
		var denNumerical;
		var foundNumberNum = false;
		var foundNumberDen = false;

		if (this.leftNode instanceof tree.Multiplication && this.leftNode.leftNode.isNegative())
		{

			numNumerical = this.leftNode.leftNode;
			numFrac = numNumerical.number;
			foundNumberNum = true;
		}
		else if (this.leftNode instanceof tree.Numerical && this.leftNode.isNegative())
		{
			numNumerical = this.leftNode;
			numFrac = numNumerical.number;
			foundNumberNum = true;
		}

		if (this.rightNode instanceof tree.Multiplication && this.rightNode.leftNode.isNegative())
		{
			denNumerical = this.rightNode.leftNode;
			denFrac = denNumerical.number;
			foundNumberDen = true;
		}
		else if (this.rightNode instanceof tree.Numerical && this.rightNode.isNegative())
		{
			denNumerical = this.rightNode;
			denFrac = denNumerical.number;
			foundNumberDen = true;
		}

		if (foundNumberNum && foundNumberDen)
		{
			//trace("found two negative numbers in division that can be turned into positive");
			//trace(numFrac.asStringNew());
			//trace(denFrac.asStringNew());
			numFrac = numFrac.getAbs();
			denFrac = denFrac.getAbs();
			numNumerical.updateValue(numFrac);
			denNumerical.updateValue(denFrac);
			doubleNegatives = true;
		}

		return doubleNegatives;
	}

	//=======================================================
	//=======================================================
	Division.prototype.removeParen = function()
	{
		var removed = false;
		removed = tree.HorizontalOperator.prototype.removeParen.call(this);

		if (this.leftNode instanceof tree.Parenthesis &&
			!(this.leftNode.middleNode instanceof tree.Addition) &&
			!(this.leftNode.middleNode instanceof tree.Subtraction))
		{
			this.leftNode = this.leftNode.middleNode;
			this.leftNode.parentNode = this;
			removed = true;
		}

		if (this.rightNode instanceof tree.Parenthesis &&
			!(this.rightNode.middleNode instanceof tree.Addition) &&
			!(this.rightNode.middleNode instanceof tree.Subtraction))
		{
			this.rightNode = this.rightNode.middleNode;
			this.rightNode.parentNode = this;
			removed = true;
		}

		return removed;
	}

	//=======================================================
	//=======================================================
	Division.prototype.undoVerticalDivision = function()
	{
		var undidVerticalDivision = tree.HorizontalOperator.prototype.undoVerticalDivision.call(this);

		var tempNodeLeft = this.leftNode;
		var tempNodeRight = this.rightNode;
		var remainingNodeLeft;
		var remainingNodeRight;

		if (tempNodeLeft instanceof tree.Parenthesis)
			tempNodeLeft = tempNodeLeft.middleNode;
		if (tempNodeRight instanceof tree.Parenthesis)
			tempNodeRight = tempNodeRight.middleNode;

		while (tempNodeLeft instanceof tree.Multiplication)
			tempNodeLeft = tempNodeLeft.leftNode;

		remainingNodeLeft = tempNodeLeft.parentNode.rightNode;

		if (!(tempNodeLeft instanceof tree.Numerical))
		{
			tempNodeLeft = this.leftNode;

			if (tempNodeLeft instanceof tree.Parenthesis)
				tempNodeLeft = tempNodeLeft.middleNode;

			while (tempNodeLeft instanceof tree.Multiplication)
				tempNodeLeft = tempNodeLeft.rightNode;

			remainingNodeLeft = tempNodeLeft.parentNode.leftNode;
		}

		while (tempNodeRight instanceof tree.Multiplication)
			tempNodeRight = tempNodeRight.leftNode;

        if (tempNodeRight && tempNodeRight.parentNode)
        {
            remainingNodeRight = tempNodeRight.parentNode.rightNode;
            if (!(tempNodeRight instanceof tree.Numerical))
            {
                tempNodeRight = this.rightNode;
    
                if (tempNodeRight instanceof tree.Parenthesis)
                    tempNodeRight = tempNodeRight.middleNode;
    
                while (tempNodeRight instanceof tree.Multiplication)
                    tempNodeRight = tempNodeRight.rightNode;
    
                remainingNodeRight = tempNodeRight.parentNode.leftNode;
            }
    
            if (tempNodeLeft instanceof tree.Numerical && tempNodeLeft.isInteger())
            {
                if (tempNodeRight instanceof tree.Numerical && tempNodeRight.isInteger())
                {
                    //Now we need to combine them into a number and replace this node.
                    var newNum = new tree.Numerical(tempNodeLeft.number.numerator, tempNodeRight.number.numerator);
                    newNum.rootNode = this.rootNode;
    
                    if (tempNodeLeft !== this.leftNode || tempNodeRight !== this.rightNode)
                    {
                        //we got some multiplications
                        var remainingNode;
                        var multInNum = false;
                        var multInDen = false;
                        if (tempNodeLeft.parentNode instanceof tree.Multiplication)
                        {
    
                            remainingNode = remainingNodeLeft;
                            remainingNode.parentNode = tempNodeLeft.parentNode.parentNode;
                            remainingNode.parentNode.assignNodeNewChild(tempNodeLeft.parentNode, remainingNode);
                            tempNodeLeft.deleteNode(true);
                            multInNum = true;
                        }
    
                        if (tempNodeRight.parentNode instanceof tree.Multiplication)
                        {
                            remainingNode = remainingNodeRight;
                            remainingNode.parentNode = tempNodeRight.parentNode.parentNode;
                            remainingNode.parentNode.assignNodeNewChild(tempNodeRight.parentNode, remainingNode);
                            tempNodeRight.deleteNode(true);
                            multInDen = true;
                        }
    
                        var multi = new tree.Multiplication();
                        multi.leftNode = newNum;
                        multi.rightNode = this;
                        multi.rootNode = this.rootNode;
                        newNum.parentNode = multi;
    
                        if (this.parentNode !== null)
                            this.parentNode.assignNodeNewChild(this, multi);
                        else
                            this.rootNode.rootNode = multi;
    
                        this.parentNode = multi;
    
                        //check if we need to remove the numbers remaning in division
                        if (!multInNum)
                        {
                            var oneNum = new tree.Numerical(1);
                            this.leftNode = oneNum;
                            oneNum.parentNode = this;
                        }
    
                        if (!multInDen)
                        {
                            var oneNum = new tree.Numerical(1);
                            this.rightNode = oneNum;
                            oneNum.parentNode = this;
                        }
                    }
                    else
                    {
                        if (this.parentNode !== null)
                        {
                            newNum.parentNode = this.parentNode;
                            this.parentNode.assignNodeNewChild(this, newNum);
                        }
                        else
                            this.rootNode.rootNode = newNum;
                    }
    
                    return true;
                }
            }
		}

		return undidVerticalDivision;
	}

	//=======================================================
	//=======================================================
	Division.prototype.undoSimpleVerticalDivision = function()
	{
		var undidVerticalDivision = tree.HorizontalOperator.prototype.undoSimpleVerticalDivision.call(this);

		if (this.leftNode instanceof tree.Numerical && this.leftNode.isInteger())
		{
			if (this.rightNode instanceof tree.Numerical && this.rightNode.isInteger())
			{
				//Now we need to combine them into a number and replace this node.
				var newNum = new tree.Numerical(this.leftNode.number.numerator, this.rightNode.number.numerator);
				newNum.rootNode = this.rootNode;
				if (this.parentNode !== null)
				{
					newNum.parentNode = this.parentNode;
					this.parentNode.assignNodeNewChild(this, newNum);
				}
				else
					this.rootNode.rootNode = newNum;

				return true;
			}
		}

		return undidVerticalDivision;
	}

	//=======================================================
	//=======================================================
	Division.prototype.isOneHalf = function()
	{
		if (this.leftNode instanceof tree.Numerical && this.rightNode instanceof tree.Numerical)
		{
			if (this.leftNode.isIdentical(new tree.Fraction(1)) && this.rightNode.isIdentical(new tree.Fraction(2)))
				return true;
		}

		return false;
	}
module.exports = Division;
},{"./tree":47}],15:[function(require,module,exports){
//==========================================================================
// Tree node type: Ellipsis
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Calculator.MathTree.Ellipsis extends Variable{
var tree = require('./tree');	// node tree helper file

	//=======================================================
	// Constructor
	//=======================================================
	Ellipsis = function()
	{
		tree.Variable.call(this);	// Call the parent constructor (was super())

		this.n = "...";
		this.className = "Ellipsis";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	Ellipsis.prototype = new tree.Variable();
	Ellipsis.prototype.constructor = Ellipsis;

module.exports = Ellipsis;
},{"./tree":47}],16:[function(require,module,exports){
//==========================================================================
// Tree node type: Equality
//
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
var tree = require('./tree');	// General math tools

//class Equality extends HorizontalOperator

	//=======================================================
	// Constructor
	//=======================================================
	Equality = function()
	{
		tree.HorizontalOperator.call(this);	// Call the parent constructor (was super())

		this.precedence = 500;
		this.className = "Equality";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	Equality.prototype = new tree.HorizontalOperator();
	Equality.prototype.constructor = Equality;


	//=======================================================
	//=======================================================
	Equality.prototype.checkForOnes = function()
    {
        return this.checkAnyChildren("checkForOnes");
    }

	//=======================================================
	//=======================================================
	Equality.prototype.canSimplifyNode = function()
	{
		return false;
	}

	//=======================================================
	//=======================================================
	Equality.prototype.getNumerical = function()
	{
		if (this.leftNode instanceof tree.Numerical)
			return this.leftNode.number;
		else if (this.rightNode instanceof tree.Numerical)
			return this.rightNode.number;
		else
			return undefined;
	}

	//=======================================================
	// Identical to the one in Addition
	//=======================================================
	Equality.prototype.removeParen = function()
	{
		var removedParen = false;

		if (this.leftNode !== null)
			removedParen = this.leftNode.removeParen() || removedParen;
		if (this.rightNode !== null)
			removedParen = this.rightNode.removeParen() || removedParen;

		if (this.leftNode !== null && this.leftNode instanceof tree.Parenthesis)
		{
			this.leftNode.middleNode.parentNode = this;
			this.leftNode = this.leftNode.middleNode;
			removedParen = true;
		}

		if (this.rightNode !== null && this.rightNode instanceof tree.Parenthesis)
		{
			this.rightNode.middleNode.parentNode = this;
			this.rightNode = this.rightNode.middleNode;
			removedParen = true;
		}

		return removedParen;
	}

	//=======================================================
	//=======================================================
	Equality.prototype.doAction = function(func, val)
	{
		return;
	}

	//=======================================================
	//=======================================================
	Equality.prototype.switchOperator = function()
	{
		this.n = this.getOppositeOperator();
	}

	//=======================================================
	//=======================================================
	Equality.prototype.getOppositeOperator = function()
	{
		return this.n;
	}

	//=======================================================
	//=======================================================
	Equality.prototype.isSameDirection = function(otherOp)
	{
		return (this.n === otherOp.n);
	}

	//=======================================================
	//=======================================================
	Equality.prototype.validateTree = function(variableValue)
	{
		return this.leftNode.evaluateNode(new tree.Fraction(variableValue)).equals(this.rightNode.evaluateNode(new tree.Fraction(variableValue)));
	}


/*************************************************************/
/*						PRIVATE FUNCTIONS					 */
/*************************************************************/

	//=======================================================
	//=======================================================
	Equality.prototype.canDistribute = function()
	{
		return false;
	}

	//=======================================================
	//=======================================================
	Equality.prototype.getNodeAsString = function()
	{
		return "=";
	}

	//=======================================================
	//=======================================================
	Equality.prototype.removeNumerical = function()
	{
		if (this.leftNode instanceof tree.Numerical)
		{
			this.leftNode.deleteNode(false);
			//changed
			//this.deleteNode(false);
			//this.parentNode.assignNodeNewChild(this, this.leftNode);
			//this.leftNode.parentNode = this.parentNode;
		}
		else if (this.rightNode instanceof tree.Numerical)
		{
			this.rightNode.deleteNode(false);
			//changed
			//this.deleteNode(false);
			//this.parentNode.assignNodeNewChild(this, this.rightNode);
			//this.rightNode.parentNode = this.parentNode;
		}
	}

	//=======================================================
	//=======================================================
	Equality.prototype.replaceNumerical = function(num)
	{
		if (this.leftNode instanceof tree.Numerical)
			this.leftNode.updateValue(num);
		else if (this.rightNode instanceof tree.Numerical)
			this.rightNode.updateValue(num);
	}

	/************************************************
	* This function returns true if the non-variable side
	* is polynomial and is ordered, false otherwise.
	*************************************************/
	Equality.prototype.isOrderedPolynomial = function()
	{
        var polySide;
		if (this.leftNode instanceof tree.AddSubtractBase)
            polySide = this.leftNode;
        else
            polySide = this.rightNode;
            
        if (polySide && polySide.isOrderedPolynomial())
			return true;
        
		return false;
	}

module.exports = Equality;

},{"./tree":47}],17:[function(require,module,exports){
//==========================================================================
// Tree node type: Fraction
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Fraction
var tree = require('./tree');	// node tree helper file

	//=======================================================
	// Constructor
	//=======================================================
	Fraction = function(num, denom)
	{
		if (denom === 0)
		{
			this.numerator = Number.NaN;
			this.denominator = Number.NaN;
		}
		else
		{
			this.numerator = num;

			if (denom !== undefined && denom !== null)
				this.denominator = denom;
			else
				this.denominator = 1;
		}
	}

	//=======================================================
	//=======================================================
	Fraction.prototype.equalsZero = function()
	{
		return (this.numerator === 0 && this.denominator !== 0)
	}

	//=======================================================
	//=======================================================
	Fraction.prototype.equalsTwo = function()
	{
		return this.equalsTo(2, 1);
	}

	//=======================================================
	//=======================================================
	Fraction.prototype.isNegative = function()
	{
		if (this.numerator < 0 && this.denominator > 0)
			return true;
		else if (this.numerator > 0 && this.denominator < 0)
			return true;
		else
			return false;
	}

	//=======================================================
	//=======================================================
	Fraction.prototype.isInteger = function()
	{
		return (this.denominator === 1)
	}

	//=======================================================
	//=======================================================
	Fraction.prototype.reciprocal = function()
	{
		return new Fraction(this.denominator, this.numerator);
	}

	//=======================================================
	//=======================================================
	Fraction.prototype.duplicate = function()
	{
		return new Fraction(this.numerator, this.denominator);
	}

	//=======================================================
	//=======================================================
	Fraction.prototype.reduce = function()
	{
		if (this.denominator < 0)
		{
			this.denominator *= -1;
			this.numerator *= -1;
		}

		var gcd = Fraction.GCD(this.numerator, this.denominator);

		if (gcd === 1)
			return false;
		else
		{
			this.numerator /= gcd;
			this.denominator /= gcd;
			return true;
		}
	}

	//=======================================================
	// Returns true if a fraction can be reduced to an integer
	// However, it returns false if the fraction is ALREADY an integer, e.g. 7/1
	//=======================================================
	Fraction.prototype.reduceToInteger = function()
	{
		if (this.denominator < 0)
		{
			this.denominator *= -1;
			this.numerator *= -1;
		}

		var gcd = Fraction.GCD(this.numerator, this.denominator);

		if (gcd === 1)
			return false;
		else
		{
			var tempNum = this.numerator / gcd;
			var tempDen = this.denominator / gcd;

			if (tempDen === 1)
			{
				this.numerator /= gcd;
				this.denominator /= gcd;
				return true;
			}
			else
				return false;
		}
	}

	//=======================================================
	//=======================================================
	Fraction.prototype.canReduce = function()
	{
		if (this.numerator === undefined || this.denominator === undefined)
			return false;

		if (isNaN(this.numerator))
			return false;

		var gcd = Fraction.GCD(this.numerator, this.denominator);

		if (gcd === 1)
			return false;
		else
			return true;
	}

	//=======================================================
	//=======================================================
	Fraction.prototype.equalsTo = function(top, bottom)
	{
		if (bottom === null || bottom === undefined)
			bottom = 1;

		return (top === this.numerator && bottom === this.denominator)
	}

	//=======================================================
	//=======================================================
	Fraction.prototype.equals = function(otherFrac)
	{
		return (otherFrac.numerator === this.numerator && otherFrac.denominator === this.denominator)
	}

	//=======================================================
	//=======================================================
	Fraction.prototype.equivalent = function(otherFrac)
	{
		return (otherFrac.numerator * this.denominator === otherFrac.denominator * this.numerator)
	}

	//=======================================================
	//=======================================================
	Fraction.prototype.isNaNNumber = function()
	{
		return (isNaN(this.numerator) || isNaN(this.denominator))
	}

	//=======================================================
	//=======================================================
	Fraction.prototype.stringsEquivalent = function(otherFrac)
	{
		var firstNumber = otherFrac.numerator * this.denominator;
		var secondNumber = otherFrac.denominator * this.numerator;

		firstNumber = Math.floor(firstNumber * Math.pow(10, 2));
		firstNumber = firstNumber / Math.pow(10, 2);
		secondNumber = Math.floor(secondNumber * Math.pow(10, 2));
		secondNumber = secondNumber / Math.pow(10, 2);

		var oneNumber = firstNumber / secondNumber;
		oneNumber = Math.round(oneNumber * Math.pow(10, 12));
		oneNumber = oneNumber / Math.pow(10,12);

		if (firstNumber === 0 && secondNumber === 0)
			return true;

		return (oneNumber === 1)
	}

	//=======================================================
	//=======================================================
	Fraction.prototype.lessThan = function(otherFrac)
	{
		return (this.numerator*otherFrac.denominator < otherFrac.numerator*this.denominator)
	}

	//=======================================================
	//=======================================================
	Fraction.prototype.greaterThan = function(otherFrac)
	{
		return (this.numerator*otherFrac.denominator > otherFrac.numerator*this.denominator)
	}

	Fraction.prototype.greaterEqualThan = function(otherFrac)
	{
		return (this.numerator*otherFrac.denominator >= otherFrac.numerator*this.denominator)
	}

	//=======================================================
	//=======================================================
	Fraction.prototype.getReciprocal = function()
	{
		return new Fraction(this.denominator, this.numerator);
	}

	//=======================================================
	// @FIXME/dg: This is obviously broken. It's using a radix of 32!
	// It is used exactly once: in a trace statement.
	// Everywhere else uses asStringNew().
	//=======================================================
	Fraction.prototype.asString = function()
	{
		return this.numerator.toString(32) + "/" + this.denominator.toString(32);
	}

	//=======================================================
	//=======================================================
	Fraction.prototype.asStringNew = function()
	{
		return this.numerator.toString() + "/" + this.denominator.toString();
	}

	//=======================================================
	//=======================================================
	Fraction.prototype.isPerfectSquare = function()
	{
		return this.isPartialPerfectSquare();
            //(Math.sqrt(this.numerator) % 1 === 0 && Math.sqrt(this.denominator) % 1 === 0)
	}

	//=======================================================
	//=======================================================
	Fraction.prototype.isPartialPerfectPower = function(exponent)
	{
        if (!exponent)
            exponent = 2; // default to perfect square
            
		return (detectPartialPerfectPower(this.numerator, exponent)
                || detectPartialPerfectPower(this.denominator, exponent));
	}

	//=======================================================
	//=======================================================
    detectPartialPerfectPower = function(iNum, exponent)
    {
        var pow = Math.pow(2, exponent);
        if (iNum < pow) // least perfect square
            return false;
        for (var i = 2; pow <= iNum;)// i++)
        {
            if (iNum % pow == 0)
                return true; // found a partial perfect square
            pow = Math.pow(i++, exponent);
        }
        
        return false;
    }
    
	//=======================================================
	//=======================================================
	Fraction.prototype.isPartialPerfectSquare = function()
	{
		return (detectPartialPerfectSquare(this.numerator)
                || detectPartialPerfectSquare(this.denominator));
	}

	//=======================================================
	//=======================================================
    detectPartialPerfectSquare = function(iNum)
    {
        var pow = 4;
        if (iNum < pow) // least perfect square
            return false;
        for (var i = 2; pow <= iNum;)// i++)
        {
            if (iNum % pow == 0)
                return true; // found a partial perfect square
            pow = Math.pow(i++, 2);
        }
        
        return false;
    }
    
	//=======================================================
	//=======================================================
	Fraction.prototype.getAbs = function()
	{
		// DG: This was an early out in case the fraction was already positive.
		// However, it had a different behavior.  Instead of returning a new object,
		// it returned the old one.  That made it destructive rather than non-destructive.
		// The abs function isn't very slow, so it's better to have consistent behavior.
//		if (this.numerator > 0 && this.denominator > 0)
//			return this;

		var newNum = Math.abs(this.numerator);
		var newDen = Math.abs(this.denominator);

		return new Fraction(newNum, newDen);
	}


//==========================================================================
// Static functions
//==========================================================================

	//=======================================================
	//=======================================================
	Fraction.plus = function(one, two)
	{
		var top1 = one.numerator;
		var bottom1 = one.denominator;

		var top2 = two.numerator;
		var bottom2 = two.denominator;

		if (bottom1 === bottom2)
			var answer = new Fraction(top1 + top2, bottom1);
		else
			var answer = new Fraction(top1*bottom2 + bottom1*top2, bottom1*bottom2);

		fixNegative(answer);
		return answer;
	}

	//=======================================================
	//=======================================================
	Fraction.minus = function(one, two)
	{
		var top1 = one.numerator;
		var bottom1 = one.denominator;

		var top2 = two.numerator;
		var bottom2 = two.denominator;

		if (bottom1 === bottom2)
			var answer = new Fraction(top1 - top2, bottom1);
		else
			var answer = new Fraction(top1*bottom2 - bottom1*top2, bottom1*bottom2);

		fixNegative(answer);
		return answer;
	}

	//=======================================================
	//=======================================================
	Fraction.multiply = function(one, two)
	{
		var top1 = one.numerator;
		var bottom1 = one.denominator;

		var top2 = two.numerator;
		var bottom2 = two.denominator;

		var answer = new Fraction(top1*top2, bottom1*bottom2);

		fixNegative(answer);
		return answer;
	}

	//=======================================================
    // NF: does not really do any divide, i.e simplify the fraction to interger if it can
	//=======================================================
	Fraction.divide = function(one, two)
	{
		var top1 = one.numerator;
		var bottom1 = one.denominator;

		var top2 = two.numerator;
		var bottom2 = two.denominator;

		var answer = new Fraction(top1*bottom2, bottom1*top2);

		if (answer.denominator === 0)
		{
			answer.numerator = Number.NaN;
			answer.denominator = Number.NaN;
		}

		fixNegative(answer);
		return answer;
	}

	//=======================================================
	//=======================================================
	Fraction.GCD = function(a, b)
	{
		var c;

		while (b !== 0)
		{
			c = b;
			b = a % b;
			a = c;
		}

		if (a < 0)
			a *= -1;

		return a;
	}

	//=======================================================
	//=======================================================
	Fraction.getFraction = function(frac)
	{
		var slash = frac.indexOf("/");

		if (slash > 0)
			return new Fraction(parseFloat(frac.slice(0, slash)), parseFloat(frac.slice(slash+1)));
		else
			return new Fraction(parseFloat(frac));
	}

	//=======================================================
	//=======================================================
	function fixNegative(num)
	{
		if (num.denominator < 0)
		{
			num.denominator *= -1;
			num.numerator *= -1;
			return true;
		}

		return false;
	}

module.exports = Fraction;
},{"./tree":47}],18:[function(require,module,exports){
//==========================================================================
// Tree node type: Functions with parenthesis
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
/*
This class is the base class for all nodes that are functions
that display with parenthesis. This includes parenthesis by themselves,
all trig function, etc. It should be extended by the specific function
class.
*/
//class FunctionWithParen extends Operator
var tree = require('./tree');	// node tree helper file

	//=======================================================
	// Constructor
	//=======================================================
	FunctionWithParen = function(type)
	{
		tree.Operator.call(this);	// Call the parent constructor (was super())

		this.className = "FunctionWithParen";
		this.isBinary = true;
		this.precedence = 100;

		this.middleNode = null;
	}

	//=======================================================
	// Inheritance
	//=======================================================
	FunctionWithParen.prototype = new tree.Operator();
	FunctionWithParen.prototype.constructor = FunctionWithParen;

	//=======================================================
	//=======================================================
	FunctionWithParen.prototype.deleteNode = function(deleteChildren)
	{
		if (deleteChildren)
		{
			if (this.leftNode !== null)
				this.leftNode.deleteNode(deleteChildren);
			if (this.rightNode !== null)
				this.rightNode.deleteNode(deleteChildren);
		}

		if (this.middleNode !== null)
			this.middleNode.deleteNode(true);
		removeNode(this);
	}

	//=======================================================
	//=======================================================
	FunctionWithParen.prototype.insertMiddle = function(node)
	{
		this.middleNode = node;
		node.parentNode = this;
	}

	/***********************
	This function determines whether the "node" exists anywhere
	in the tree rooted at "this".
	***********************/
	FunctionWithParen.prototype.existInTree = function(node)
	{
		if (tree.Operator.prototype.existInTree.call(this, node) ||
			(this.middleNode !== null && this.middleNode.existInTree(node)))
				return true;

		return false;
	}

	//=======================================================
	//=======================================================
	FunctionWithParen.prototype.assignNodeNewChild = function(matchingNode, newNode)
	{
		if (this.leftNode === matchingNode)
			this.leftNode = newNode;
		else if (this.rightNode === matchingNode)
			this.rightNode = newNode;
		else
			this.middleNode = newNode;
	}

	//=======================================================
	//=======================================================
	FunctionWithParen.prototype.isFull = function()
	{
		if (this.middleNode !== null)
			return true;
		else
			return false;
	}

	//=======================================================
	//=======================================================
	FunctionWithParen.prototype.insertBalancedNode = function(node)
	{
		if (this.middleNode === null)
		{
			this.middleNode = node;
			node.parentNode = this;
		}
	}

	//=======================================================
	//=======================================================
	FunctionWithParen.prototype.canSimplifyNode = function()
	{
		return false;
	}

	//=======================================================
	//=======================================================
	FunctionWithParen.prototype.getChildren = function()
	{
		var children = [];
		if (this.middleNode !== null)
			children.push(this.middleNode);

		return children;
	}

	//=======================================================
	//=======================================================
	FunctionWithParen.prototype.duplicateTree = function(root)
	{
		var tempNode = this.duplicateNode(root);		// cast to FunctionWithParen
		if (this.middleNode !== null)
		{
			tempNode.middleNode = this.middleNode.duplicateTree(root);
			tempNode.middleNode.parentNode = tempNode;
		}
		else
			tempNode.middleNode = null;

		return tempNode;
	}

	//=======================================================
	//=======================================================
	FunctionWithParen.prototype.hasChildren = function()
	{
		return (this.middleNode !== null);
	}

module.exports = FunctionWithParen;
},{"./tree":47}],19:[function(require,module,exports){
//==========================================================================
// Tree node type: Horizontal Operator
//
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
var tree = require('./tree');	// General math tools

//class HorizontalOperator extends Operator{

	//=======================================================
	// Constructor
	//=======================================================
	HorizontalOperator = function()
	{
		tree.Operator.call(this);	// Call the parent constructor (was super())

		this.className = "HorizontalOperator";
		this.isBinary = true;
		this.n  = "";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	HorizontalOperator.prototype = new tree.Operator();
	HorizontalOperator.prototype.constructor = HorizontalOperator;

/*************************************************************/
/*   	FUNCTIONS THAT RETURN INFO ABOUT THE GIVEN TREE		 */
/*************************************************************/
	//=======================================================
	//=======================================================
	HorizontalOperator.prototype.canDistribute = function(){ return true; }

	//=======================================================
	// This is also used by nRoot, a sibling class.
	// Cross-calling class methods like this is bad form.  It
	// would be better to move the functionality to the base class,
	// but it might not be appropriate there.  It could also move
	// to a tools module.
	//=======================================================
	HorizontalOperator.prototype.duplicateTree = function(root)
	{
		var tempNode = this.duplicateNode(root);

		if (this.leftNode !== null)
		{
			tempNode.leftNode = this.leftNode.duplicateTree(root);
			tempNode.leftNode.parentNode = tempNode;
		}
		else
			tempNode.leftNode = null;

		if (this.rightNode !== null)
		{
			tempNode.rightNode = this.rightNode.duplicateTree(root);
			tempNode.rightNode.parentNode = tempNode;
		}
		else
			tempNode.rightNode = null;

		return tempNode;
	}

	//=======================================================
	//=======================================================
	HorizontalOperator.prototype.evaluateNode = function(variableValue)
	{
		return this.performOp(this.leftNode.evaluateNode(variableValue),
                              this.rightNode.evaluateNode(variableValue));
	}

	//=======================================================
	//=======================================================
	HorizontalOperator.prototype.evaluateNodeWithVariables = function(variables)
	{
		return this.performOp(
                this.leftNode.evaluateNodeWithVariables(variables),
                this.rightNode.evaluateNodeWithVariables(variables));
	}

	//=======================================================
	//=======================================================
	HorizontalOperator.prototype.getApproximateValueOfTree = function(variables)
	{
		var firstNumber = this.leftNode.getApproximateValueOfTree(variables);
        if (this.rightNode) // NF: add this because get called with rithNode of null value
        {
            var secondNumber = this.rightNode.getApproximateValueOfTree(variables);
            firstNumber = isNaN(firstNumber) && this.leftNode === null ? 1 : firstNumber;
            secondNumber = isNaN(secondNumber) && this.rightNode === null ? 1: secondNumber;
            return this.performApproximateOp(firstNumber, secondNumber);
        }
        else
            return firstNumber; //this.leftNode; NF: we need to return the value, not the tree node!
	}

	//=======================================================
	//=======================================================
	HorizontalOperator.prototype.isLinear = function()
	{
		var children = tree.Operator.prototype.getChildren.call(this);
		var linear = true;
		while (children.length > 0)
			linear = children.pop().isLinear() && linear;

		if (!linear)
			return false;

		if ((this instanceof tree.Addition) || (this instanceof tree.Subtraction)
            || (this instanceof tree.Equality))
			return true;
		if (this instanceof tree.Division)
		{
			var nodes = [];
			this.rightNode.findAllInstancesOfClass("Variable", nodes);
			if (nodes.length > 0)
				return false;
			while (nodes.length > 0)
				nodes.pop();

			this.rightNode.findAllInstancesOfClass("Numerical", nodes);
			while (nodes.length > 0)
			{
				if (nodes.pop().equalsZero())
					return false;
			}

			return true;
		}
		if (this instanceof tree.Multiplication)
		{
			var leftNodes = [];
			this.leftNode.findAllInstancesOfClass("Variable", leftNodes);

			var rightNodes = [];
			this.rightNode.findAllInstancesOfClass("Variable", rightNodes);

			if (leftNodes.length > 0 && rightNodes.length > 0)
				return false;
			else
				return true;
		}

		return false;
	}

	//=======================================================
	//=======================================================
	HorizontalOperator.prototype.isPolynomial = function()
	{
		return tree.Node.prototype.checkAllChildren.call(this, "isPolynomial");
	}

	//=======================================================
	//=======================================================
	HorizontalOperator.prototype.isPolynomialExponent = function()
	{
		return tree.Node.prototype.checkAllChildren.call(this, "isPolynomialExponent");
	}

	//=======================================================
	//=======================================================
	HorizontalOperator.prototype.isRational = function()
	{
		return tree.Node.prototype.checkAllChildren.call(this, "isRational");
	}

	//=======================================================
	//=======================================================
	HorizontalOperator.prototype.performApproximateOp = function(op1, op2)
	{
		return null;
	}

	//=======================================================
	//=======================================================
	HorizontalOperator.prototype.performOp = function(op1, op2)
	{
		return null;
	}

/*************************************************************/
/*  	 	FUNCTIONS THAT MODIFY THE GIVEN TREE			 */
/*************************************************************/

	/***************************************************************
	 * This function distributes a negative to the children of this
	 * node. It can only do this if the precendence of this node is
	 * greater or equal to the precedence of the node that told it
	 * to distribute the negative.
	 ***************************************************************/
	HorizontalOperator.prototype.distributeNegative = function(newPrecedence)
	{
		var distributed = false;

		if (this.precedence < newPrecedence)
			return false;
		// //trace("distributenegative horizontal op");
		// //trace(this.getTreeAsString());
		// //trace(this.leftNode.getTreeAsString());
		// //trace(this.rightNode.getTreeAsString());
		var leftNodeChanged = false;
		if (this instanceof tree.Addition || this instanceof tree.Subtraction)
		{
			if (this.leftNode instanceof tree.Numerical)
			{
				// this.leftNode was cast to Numerical (twice)
				this.leftNode.updateValue(tree.Fraction.multiply(this.leftNode.number, new tree.Fraction(-1)));
				leftNodeChanged = true;
			}
			else if (this.leftNode instanceof tree.Variable || this.leftNode instanceof tree.Power)
			{
				var newOp = new tree.Multiplication();
				var newCoeff = new tree.Numerical(-1);
				Node.insertLeft(newCoeff, newOp);
				newOp.setRoot(this.rootNode);
				newOp.rightNode = this.leftNode;
				this.leftNode.parentNode = newOp;
				this.leftNode = newOp;
				newOp.parentNode = this;
				leftNodeChanged = true;
			}
			else
				this.leftNode.distributeNegative(this.precedence);

			if (this.rightNode instanceof tree.Numerical)
				// this.rightNode was cast to Numerical (twice)
				this.rightNode.updateValue(tree.Fraction.multiply(this.rightNode.number, new tree.Fraction(-1)));
			else if (this.rightNode instanceof tree.Variable || this.rightNode instanceof tree.Power)
			{
				var newOp = new tree.Multiplication();
				var newCoeff = new tree.Numerical(-1);
				Node.insertLeft(newCoeff, newOp);
				newOp.setRoot(this.rootNode);
				newOp.rightNode = this.rightNode;
				this.rightNode.parentNode = newOp;
				this.rightNode = newOp;
				newOp.parentNode = this;
			}
			else
				this.rightNode.distributeNegative(this.precedence);
		}
		else
		{
			distributed = this.leftNode.distributeNegative(this.precedence);
			if (!distributed)
				distributed = this.rightNode.distributeNegative(this.precedence);
			if (!distributed){
				//now we need to create a numerical node to disribute to
				// //trace("we got non addition substraction");
				// //trace(this.getTreeAsString());
				if (this instanceof tree.Multiplication && this.leftNode instanceof tree.Numerical)
				{
					//we are going to multiply left side by negative one, but if parent is +/-, then just update parent op
					//so we dont have 2+-3*4
					if (!this.leftNode.isNegative()
                        && this.parentNode.rightNode === this
                        && (this.parentNode instanceof tree.Addition || this.parentNode instanceof tree.Subtraction))
					{
						if (this.parentNode instanceof tree.Addition)
							var newOp = new tree.Subtraction();
						else
							var newOp = new tree.Addition();

						newOp.parentNode = this.parentNode.parentNode;
						newOp.parentNode.assignNodeNewChild(this.parentNode, newOp);
						newOp.leftNode = this.parentNode.leftNode;
						newOp.rightNode = this.parentNode.rightNode;
						newOp.leftNode.parentNode = newOp;
						newOp.rightNode.parentNode = newOp;
					}
					else
						this.leftNode.updateValue(tree.Fraction.multiply(this.leftNode.number, new Fraction(-1)));
				}
				else
				{
					var newOp = new tree.Multiplication();
					var newCoeff = new tree.Numerical(-1);
					Node.insertLeft(newCoeff, newOp);
					newOp.setRoot(this.rootNode);
					newOp.rightNode = this.leftNode;
					this.leftNode.parentNode = newOp;
					this.leftNode = newOp;
					newOp.parentNode = this;
				}
			}

			return true;
		}
	}

	//=======================================================
	//=======================================================
	HorizontalOperator.prototype.removeNumerical = function()
	{
		if (this.leftNode instanceof tree.Numerical)
			this.leftNode.deleteNode(false);
		else if (this.rightNode instanceof tree.Numerical)
			this.rightNode.deleteNode(false);
	}

	//=======================================================
	//=======================================================
	HorizontalOperator.prototype.simplify = function(parentPrecedence, reduceFracs, rules)
	{
		// //trace("reduce fracs horizontal " + reduceFracs);

		if (!this.canSimplifyNode()) // changed to call memeber function by adding "this"
			return tree.Operator.prototype.simplify.call(this, parentPrecedence, reduceFracs, rules);

		var simplifyObject = new Object({changed:false});
		var leftObject;
		var rightObject;
		var finalObject = new Object();
		if (this.leftNode !== null)
			leftObject = this.leftNode.simplify(this.precedence, reduceFracs, rules);
        if (leftObject.changed)
            return setObjChange(simplifyObject);

		if (this.rightNode !== null)
			rightObject = this.rightNode.simplify(this.precedence, reduceFracs, rules);
        if (rightObject.changed)
            return setObjChange(simplifyObject);

		if (this.leftNode instanceof tree.Numerical && this.rightNode instanceof tree.Numerical)
		{
            // changed combineNumericals call to member (derived) function call:
			finalObject = this.combineNumericals(leftObject, rightObject, reduceFracs);

			simplifyObject.changed = finalObject.changed;
			simplifyObject.reduced = finalObject.reduced;

			if ((this.parentNode && this.parentNode.isChild(finalObject.Numerical))
                || this.precedence === parentPrecedence)
			{
				//this means I should pass my information up the tree
				simplifyObject.Numerical = finalObject.Numerical;
				simplifyObject.isOpposite = finalObject.isOpposite;
			}
		}
		else
		{
			if (this.precedence <= parentPrecedence) // || this.precedence === 0) // similar operation or a number
			{
                processSimpflifyObj(leftObject, simplifyObject);
                if (simplifyObject.changed)
                    return simplifyObject;
                
                processSimpflifyObj(rightObject, simplifyObject);
                if (simplifyObject.changed)
                    return simplifyObject;
			}
		}

		return simplifyObject;
	}

/*************************************************************/
/*						PRIVATE FUNCTIONS					 */
/*************************************************************/
    setObjChange = function(listObj)
    {
        listObj.changed = true;
        return listObj;
    }

	//=======================================================
	//=======================================================
    processSimpflifyObj = function(spObj, listObj)
    {
        //this means I should pass my information up the tree
        if (spObj.hasOwnProperty("Numerical")){
            if (spObj.Numerical && spObj.Numerical.parentNode instanceof tree.HorizontalOperator)
            {
                if (listObj.Numerical)
                    listObj.changed = true;
                else
                    listObj.Numerical = spObj.Numerical;
            }
            listObj.isOpposite = spObj.isOpposite;
        }
    }
    
	//=======================================================
	//=======================================================
	function combineNumericals(leftObject, rightObject, reduceFracs)
	{
		return null;
	}

	//=======================================================
	// Doesn't appear to be used
	//=======================================================
	function getNodeAsString()
	{
		return this.n;
	}

	//=======================================================
    // NF: converted from private to public
	//=======================================================
	HorizontalOperator.prototype.getOpposite = function(num)
	{
		if (this instanceof tree.Division || this instanceof tree.Multiplication)
			return num.reciprocal();
		else if (this instanceof tree.Subtraction || this instanceof tree.Addition)
			return tree.Fraction.multiply(num, new Fraction(-1));
		else
			return num;
	}

	//=======================================================
    // NF: converted from private to public
	//=======================================================
	HorizontalOperator.prototype.needsOpposite = function()
	{
		return (this instanceof tree.Division || this instanceof tree.Subtraction)
	}

module.exports = HorizontalOperator;

},{"./tree":47}],20:[function(require,module,exports){
//==========================================================================
// Tree node type: Implied multiplication
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
/***************************************************
 * This class represents a multiplication operator
 * that was created by the parser. It represents
 * an implied multiplication, rather than one that
 * was directly put in.
 *
 * For example:
 * "3x + 2*x = 10"
 * In this case a "ForcedMultiplication" would be created
 * in between the 3 and the x, but a real multiplication
 * would be created between the 2 and the x.
 ******************************************************/
//class Calculator.MathTree.ImpliedMultiplication extends Multiplication
var tree = require('./tree');	// node tree helper file

	//=======================================================
	// Constructor
	//=======================================================
	ImpliedMultiplication = function()
	{
		tree.Multiplication.call(this);	// Call the parent constructor (was super())

		this.n = "#";
		this.className = "ImpliedMultiplication";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	ImpliedMultiplication.prototype = new tree.Multiplication();
	ImpliedMultiplication.prototype.constructor = ImpliedMultiplication;

	//=======================================================
	//=======================================================
	ImpliedMultiplication.prototype.getNodeAsString = function()
	{
		if (this.leftNode && this.leftNode.isNegativeOne()
            && !(this.rightNode instanceof tree.Numerical))
		{
			this.leftNode.showNumber = false;
			return " ";
		}

		return this.n;
	}

	//=======================================================
	// This function only needs to be overridden if the class has any
	// parameters in its constructor.
	//
	// In this case there are no parameters, but the class name
	// is being redirected to Multiplication (NF: no longer true).  Essentially, a
	// duplicated node would be regular multiplication rather
	// than implied multiplication.
	//=======================================================
	ImpliedMultiplication.prototype.duplicateNode = function(root)
	{
		var tempNode = new tree.ImpliedMultiplication;
		tempNode.setRoot(root);
		tempNode.lastAction = this.lastAction;
		return tempNode;
	}

module.exports = ImpliedMultiplication;
},{"./tree":47}],21:[function(require,module,exports){
//==========================================================================
// Tree node type
//
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
var tree = require('./tree');	// General math tools

//class Calculator.MathTree.Inequality extends Equality{

	//=======================================================
	// Constructor
	//=======================================================
	Inequality = function(symbol)
	{
		tree.Equality.call(this);	// Call the parent constructor (was super())

		this.precedence = 500;
		this.n = symbol;
		this.className = "Inequality";
	}

	//=======================================================
	// Inheritance
	//=======================================================
//	console.log(tree);
    Inequality.prototype = new tree.Equality();
	Inequality.prototype.constructor = Inequality;


	//=======================================================
	//=======================================================
	Inequality.prototype.getNodeAsString = function()
	{
		return this.n;
	}

	//=======================================================
	// This function only needs to be overriden if the class has any
	// parameters in its constructor.
	//=======================================================
	Inequality.prototype.duplicateNode = function(root)
	{
		var tempNode = new tree[this.className](this.n);
		tempNode.setRoot(root);
		tempNode.lastAction = this.lastAction;
		return tempNode;
	}

	//=======================================================
	//=======================================================
	Inequality.prototype.doAction = function(func, val)
	{
		if (func instanceof Multiplication || func instanceof Division)
			if (val < 0)
				switchOperator();
	}

	//=======================================================
	//=======================================================
	Inequality.prototype.getOppositeOperator = function()
	{
		switch (this.n){
			case "<":
				return ">";
			case "<=":
				return ">=";
			case ">":
				return "<";
			case ">=":
				return "<=";
			default:
				return this.n;
		}
	}

	//=======================================================
	//=======================================================
	Inequality.prototype.invertInequality = function()
	{
//		//trace("inverting inequality");
		var newIneq = new Inequality(this.getOppositeOperator());
		newIneq.parentNode = this.parentNode;
		newIneq.leftNode = this.leftNode;
		newIneq.rightNode = this.rightNode;
		newIneq.leftNode.parentNode = newIneq;
		newIneq.rightNode.parentNode = newIneq;
		newIneq.setRoot(this.rootNode);
		this.rootNode.rootNode = newIneq;
	}

	//=======================================================
	//=======================================================
	Inequality.prototype.validateTree = function(variableValue)
	{
		var leftValue = this.leftNode.evaluateNode(new tree.Fraction(variableValue));
		var rightValue = this.rightNode.evaluateNode(new tree.Fraction(variableValue));

		switch (this.n){
			case "<":
				return leftValue.lessThan(rightValue);
			case "<=":
				return (leftValue.lessThan(rightValue) || leftValue.equals(rightValue));
			case ">":
				return leftValue.greaterThan(rightValue);
			case ">=":
				return (leftValue.greaterThan(rightValue) || leftValue.equals(rightValue));
			case "!=":
				return !leftValue.equals(rightValue);
			default:
//				//trace("unknown inequality " + n);
				break;
		}
	}

	//=======================================================
	//=======================================================
	Inequality.prototype.isGreaterThan = function()
	{
		switch (this.n)
		{
			case "<":
			case "<=":
				return false;
			case ">":
			case ">=":
				return true;
		}
	}

	//=======================================================
	//=======================================================
	Inequality.prototype.isSameDirection = function(otherOp)
	{
		switch (this.n)
		{
			case "<":
			case "<=":
				return (otherOp.n === "<" || otherOp.n === "<=");
			case ">":
			case ">=":
				return (otherOp.n === ">" || otherOp.n === ">=");
			default:
				return tree.Equality.isSameDirection.call(this, otherOp)
		}
	}

module.exports = Inequality;
},{"./tree":47}],22:[function(require,module,exports){
//==========================================================================
//class Calculator.MathTree.InfiniteSolutions extends HorizontalOperator{
var tree = require('./tree');	// node tree helper file

	//=======================================================
	// Constructor
	//=======================================================
	InfiniteSolutions = function()
	{
		Equiv.HorizontalOperator.call(this);	// Call the parent constructor (was super())

		this.className = "InfiniteSolutions";
		this.isBinary = true;
	}

	//=======================================================
	//=======================================================
	InfiniteSolutions.prototype.canDistribute = function()
	{
		return false;
	}

	//=======================================================
	//=======================================================
	InfiniteSolutions.prototype.getOpAsString = function()
	{
		return "infinitesolutions";
	}

	//=======================================================
	//=======================================================
	InfiniteSolutions.prototype.isPolynomial = function()
	{
		return false;
	}

	//=======================================================
	//=======================================================
	InfiniteSolutions.prototype.isRational = function()
	{
		return false;
	}

	//=======================================================
	//=======================================================
	InfiniteSolutions.prototype.getTreeAsString = function(isDecimal)
	{
		return "infinitesolutions";
	}

module.exports = InfiniteSolutions;

},{"./tree":47}],23:[function(require,module,exports){
//==========================================================================
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Calculator.MathTree.Logarithm extends Operator{
var tree = require('./tree');	// node tree helper file

	//left node is content of log
	//right node is base of log

	//=======================================================
	// Constructor
	//=======================================================
	Logarithm = function()
	{
		tree.Operator.call(this);	// Call the parent constructor (was super())

		this.className = "Logarithm";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	Logarithm.prototype = new tree.Operator();
	Logarithm.prototype.constructor = Logarithm;


	//=======================================================
	//=======================================================
	Logarithm.prototype.canSimplifyNode = function()
	{
		return true;
	}

	//=======================================================
	//=======================================================
	Logarithm.prototype.getTreeAsString = function(isDecimal)
	{

		var tempString = "log(";
		if (this.rightNode !== null)
			tempString += this.rightNode.getTreeAsString(isDecimal);

		tempString += ", ";

		if (this.leftNode !== null)
			tempString += this.leftNode.getTreeAsString(isDecimal);

		tempString += ")";
		return tempString;
	}

	//=======================================================
	//=======================================================
	Logarithm.prototype.duplicateTree = function(root)
	{
		var tempNode = this.duplicateNode(root);		// Was type cast to Logarithm

		if (this.rightNode !== null)
		{
			tempNode.rightNode = this.rightNode.duplicateTree(root);
			tempNode.rightNode.parentNode = tempNode;
		}
		else
			tempNode.rightNode = null;

		if (this.leftNode !== null)
		{
			tempNode.leftNode = this.leftNode.duplicateTree(root);
			tempNode.leftNode.parentNode = tempNode;
		}
		else
			tempNode.leftNode = null;

		return tempNode;
	}

	//=======================================================
	//=======================================================
	Logarithm.prototype.getBase = function()
	{
		if (this.rightNode !== null && this.rightNode instanceof tree.Variable && this.rightNode.isConstant())	// this.rightNode was cast to Variable
			return this.rightNode.getConstant();	// Was typecast to Variable
		if (this.rightNode !== null && this.rightNode instanceof tree.Numerical)
			return this.rightNode.number;	// Was typecast to Numerical
		else
			return null;
	}

	//=======================================================
	//=======================================================
	Logarithm.prototype.getLog = function()
	{
		return this.leftNode;
	}

	//=======================================================
	//=======================================================
	Logarithm.prototype.getApproximateValueOfTree = function(variables, bForcePositive)
	{
		var baseFraction = this.getBase();

		if (baseFraction === null)
			var base = this.rightNode.getApproximateValueOfTree(variables, bForcePositive);
		else
			base = baseFraction.numerator/baseFraction.denominator;

		var value = this.getLog().getApproximateValueOfTree(variables, bForcePositive);
/*        
        if (bForcePositive)
        {
            base = Math.abs(base);
            value = Math.abs(value);
        }
*/
		////trace("the base and value of this log");
		////trace(this.getTreeAsString());
		////trace(base);
		////trace(value);

		return Math.log(value) / Math.log(base);
	}

	//=======================================================
	//=======================================================
	Logarithm.prototype.evaluateNodeWithVariables = function(variables)
	{
		var evalBase = this.rightNode.evaluateNodeWithVariables(variables);
		var evalLog = this.leftNode.evaluateNodeWithVariables(variables);

		var value = evalLog.numerator / evalLog.denominator;
		var base = evalBase.numerator / evalBase.denominator;

		var a = Math.log(value) / Math.log(base);
		var frac = new tree.Fraction(a);
		////trace("after operation log in evaluatenodewithvariables");
		////trace(frac.numerator);
		////trace(frac.denominator);
		return frac;
	}

	//=======================================================
	//=======================================================
	Logarithm.prototype.evaluateNode = function(variableValue)
	{
		var evalLog = this.leftNode.evaluateNode(variableValue);
		var evalBase = this.rightNode.evaluateNode(variableValue);

		var value = evalLog.numerator / evalLog.denominator;
		var base = evalBase.numerator / evalBase.denominator;

		var a = Math.log(value) / Math.log(base);
		var frac = new tree.Fraction(a);
		////trace("after operation log in evaluatenodewithvariables");
		////trace(frac.numerator);
		////trace(frac.denominator);
		return frac;
	}

	//=======================================================
	//=======================================================
	Logarithm.prototype.insertBalancedNode = function(node)
	{
		if (this.leftNode === null)
		{
			this.leftNode = node;
			node.parentNode = this;
		}
		else
		{
			this.rightNode = node;
			node.parentNode = this;
		}
	}

module.exports = Logarithm;

},{"./tree":47}],24:[function(require,module,exports){
//==========================================================================
// Tree node type: Mixed Numbers
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//This class represents any numerical value.
// class MixedNumber extends Node
var tree = require('./tree');	// node tree helper file

	//=======================================================
	// Constructor
	//=======================================================
	MixedNumber = function()
	{
		tree.Node.call(this);	// Call the parent constructor (was super())

		this.className = "MixedNumber";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	MixedNumber.prototype = new tree.Node();
	MixedNumber.prototype.constructor = MixedNumber;

/*************************************************************/
/*   	FUNCTIONS THAT ARE SPECIFIC TO THIS CLASS			 */
/*************************************************************/
	//=======================================================
	//=======================================================
	MixedNumber.prototype.number = function(f)
	{
		// Getter
		if (typeof(f) === "undefined")
			return this.mixed;

		// Setter
		this.mixed = f;

		var whole = Math.floor(this.mixed.numerator / this.mixed.denominator);
		var diff = Math.abs(this.mixed.numerator / this.mixed.denominator) - whole;
		this.leftNode = new tree.Numerical(whole, 1);

		var diffString = diff.toString();
		var n = parseInt(diffString.substring(diffString.indexOf(".") + 1), 10);
		this.rightNode = new tree.Numerical(n, Math.pow(10, n.toString().length));
	}

/*************************************************************/
/*   	FUNCTIONS THAT RETURN INFO ABOUT THE GIVEN TREE		 */
/*************************************************************/
	//=======================================================
	//=======================================================
	MixedNumber.prototype.findLikeTerms = function(terms, isNegative)
	{
		var term = "constant";
		var coefficient = new tree.Fraction(this.rightNode.number.denominator * this.leftNode.number.numerator +
			this.rightNode.number.numerator, this.rightNode.number.denominator);

		//check if numerical is degree of root, if its is, ignore
		if (this.parentNode instanceof tree.NRoot && this.parentNode.rightNode === this)
			return;

		if (isNegative)
			coefficient = Fraction.multiply(coefficient, new tree.Fraction(-1));

		if (terms.hasOwnProperty(term))
		{
			var oldCoefficient = terms[term];
			terms[term] = Fraction.plus(oldCoefficient, coefficient);
			terms.changed = true;
		}
		else
		{
//r			terms.addProperty(term);
			terms[term] = coefficient;
		}
	}

	//=======================================================
	//=======================================================
	MixedNumber.prototype.makeNegativeMixedNumber = function()
	{
		if (this.parentNode instanceof tree.Multiplication && this.parentNode.leftNode.isNegativeOne())
		{
			//trace("combine neg one with mixed number");
			this.leftNode.number = Fraction.multiply(this.leftNode.number, new tree.Fraction( -1, 1));

			this.parentNode.parentNode.assignNodeNewChild(this.parentNode, this);
			this.parentNode = this.parentNode.parentNode;
			if (this.parentNode === null)
				this.rootNode.rootNode = this;

			return true;
		}

		return false;
	}

	//=======================================================
	//=======================================================
	MixedNumber.prototype.insertBalancedNode = function(node)
	{
		if (this.rightNode === null)
		{
			this.rightNode = node;
			node.parentNode = this;
		}
		else
		{
			this.leftNode = node;
			node.parentNode = this;
		}

		if (this.rightNode !== null && this.leftNode !== null)	//populate fraction
			this.mixed = new tree.Fraction(this.rightNode.number.denominator * this.leftNode.number.numerator +
				this.rightNode.number.numerator, this.rightNode.number.denominator);
	}

	//=======================================================
	//=======================================================
	MixedNumber.prototype.duplicateTree = function(root)
	{
		var tempNode = Power(duplicateNode(root));

		if (this.leftNode !== null)
		{
			tempNode.leftNode = this.leftNode.duplicateTree(root);
			tempNode.leftNode.parentNode = tempNode;
		}
		else
			tempNode.leftNode = null;

		if (this.rightNode !== null)
		{
			tempNode.rightNode = this.rightNode.duplicateTree(root);
			tempNode.rightNode.parentNode = tempNode;
		}
		else
			tempNode.rightNode = null;
		return tempNode;
	}

	//=======================================================
	//=======================================================
	MixedNumber.prototype.evaluateNode = function(variableValue)
	{
		var theNum = Math.abs(this.rightNode.number.denominator * this.leftNode.number.numerator) +
			Math.abs(this.rightNode.number.numerator);

		if (this.leftNode.isNegative())
			theNum = -theNum;

		return new tree.Fraction(theNum, this.rightNode.number.denominator);
	}

	//=======================================================
	//=======================================================
	MixedNumber.prototype.evaluateNodeWithVariables = function(variables)
	{
		return evaluateNode();
	}

	//=======================================================
	//=======================================================
	MixedNumber.prototype.getApproximateValueOfTree = function(variables)
	{
		var val = evaluateNode();
		return val.numerator / val.denominator;
	}

	//=======================================================
	//=======================================================
	MixedNumber.prototype.checkEquality = function(mixed)
	{
		var num = mixed.leftNode;
		var frac = mixed.rightNode;

		if (num.checkEquality(this.leftNode.number) && frac.checkEquality(this.rightNode.number))
			return true;
		else
			return false;
	}

/*************************************************************/
/*						PRIVATE FUNCTIONS					 */
/*************************************************************/

	//=======================================================
	//=======================================================
	MixedNumber.prototype.getTreeAsString = function(isDecimal)
	{
		var tempString = "mix(";

		if (this.leftNode !== null)
			tempString += this.leftNode.getTreeAsString(isDecimal);

		tempString += ", ";
		if (this.rightNode !== null)
			tempString += this.rightNode.getTreeAsString(isDecimal);

		tempString += ")";
		return tempString;
	}

	//=======================================================
	//=======================================================
	MixedNumber.prototype.getNodeAsString = function(isDecimal)
	{
		return getTreeAsString(isDecimal);
	}

	//=======================================================
	//=======================================================
	MixedNumber.prototype.updateValue = function(newNum)
	{
		this.mixed.numerator = newNum.numerator;
		this.mixed.denominator = newNum.denominator;
	}

module.exports = MixedNumber;

},{"./tree":47}],25:[function(require,module,exports){
//==========================================================================
// Tree node type: MultDivide
//
// base class for Multiplication and Division
//==========================================================================
//class extends HorizontalOperator
var tree = require('./tree');	// General math tools

	//=======================================================
	// Constructor
	//=======================================================
	MultDivide = function()
	{
		tree.HorizontalOperator.call(this);	// Call the parent constructor (was super())

		this.n = "*";
		this.precedence = 8;
		this.className = "MultDivide";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	MultDivide.prototype = new tree.HorizontalOperator();
	MultDivide.prototype.constructor = MultDivide;

	//=======================================================
	//=======================================================
	MultDivide.prototype.areAllVariablesCombined = function()
	{
		var variables = {};
        this.findAllVariables(variables);

        for (var prop in variables)
        {
            if (variables[prop] > 1)
                return false;
        }

		return true;
	}

	//=======================================================
	//=======================================================
	MultDivide.prototype.findLikeTerms = function(terms, isNegative)
	{
		var term = this.getTerm(this.precedence);
		var coefficient = this.getCoefficient(this.precedence);

		if (isNegative)
			coefficient = tree.Fraction.multiply(coefficient, new tree.Fraction(-1));

		// Code below for terms that are parens ie 3(x-2) so we can find the x in there and add it as a 3x term
        // create a tree with branches on each side of the term:
        // process each side of tree (with variable instances):
		var termRoot = tree.Root.createTree(term);

		if (termRoot.rootNode instanceof tree.Parenthesis)
		{
			var tempTerm;
			var termArray = [];
			termRoot.rootNode.middleNode.getPolyTerms(termArray);

	//		trace("terms inside term");
			for (var k = 0; k < termArray.length; k++)
			{
				var tempObj = {};
				tempTerm = termArray[k];
				tempTerm.findAllVariables(tempObj);

				for (var g in tempObj)
				{
					if (!terms.hasOwnProperty(g))
					{
//r						terms.addProperty(g);
						terms[g] = coefficient;
					}
					else
					{
						var oldCoefficient = terms[g];
						terms[g] = tree.Fraction.plus(oldCoefficient, coefficient);
					}
				}
			}
		}
        else
        {
            // if left side and right side all contains variables:
            terms.changed = terms.changed || (!this.areAllVariablesCombined()); //this.combinePowers() // NF: add this to addres 2x * x kind of problem
        }

		if (terms.hasOwnProperty(term))
		{
			var oldCoefficient = terms[term];
			terms[term] = tree.Fraction.plus(oldCoefficient, coefficient);
			terms.changed = true;
		}
		else
			terms[term] = coefficient;
            
        terms.changed = terms.changed || this.checkSqrtPowerCombination();
	}

	//=======================================================
    // return TRUE: combinale and should be further simplified
    //        FALSE: OK
	//=======================================================
	MultDivide.prototype.checkSqrtPowerCombination = function()
	{
        var lt = this.leftNode;
        var rt = this.rightNode;
        
        // sqrt(x) * sqrt(y) should be simplified to sqrt(xy):
        if (lt instanceof tree.SquareRoot && rt instanceof tree.SquareRoot)
            return true;
/*
        // x^2 * sqrt(x) can not be simplified futher:
        if ((lt instanceof tree.SquareRoot || (lt instanceof tree.Power && lt.isSquarePower()))
            &&
            (rt instanceof tree.SquareRoot || (rt instanceof tree.Power && rt.isSquarePower())))
            return true;
 */            
        return false;
    }
    
module.exports = MultDivide;
},{"./tree":47}],26:[function(require,module,exports){
//==========================================================================
// Tree node type: Multiplication
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Multiplication extends MultDivide
var tree = require('./tree');	// General math tools
var _ = require('underscore'); 

	//=======================================================
	// Constructor
	//=======================================================
	Multiplication = function()
	{
		tree.MultDivide.call(this);	// Call the parent constructor (was super())

		this.n = "*";
		this.precedence = 8;
		this.className = "Multiplication";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	Multiplication.prototype = new tree.MultDivide();
	Multiplication.prototype.constructor = Multiplication;


/*************************************************************/
/*   	FUNCTIONS THAT RETURN INFO ABOUT THE GIVEN TREE		 */
/*************************************************************/

	//=======================================================
	//=======================================================
	Multiplication.prototype.moveNumberCoefficientsToLeft = function()
	{
		var leftVars = [];
		this.leftNode.findAllInstancesOfClass("Variable", leftVars);
		if (leftVars.length > 0 && this.rightNode instanceof tree.Numerical)
		{
			var refNode = this.leftNode;
			this.leftNode = this.rightNode;
			this.rightNode = refNode;

			return true;
		}

		return false;
	}

	//=======================================================
	//=======================================================
	Multiplication.prototype.areAllVarsMultiplied = function()
	{
		var variables = {};
		var lt = this.leftNode;
		var rt = this.rightNode;

		if (lt instanceof tree.Parenthesis)
			lt = lt.middleNode;
		if (rt instanceof tree.Parenthesis)
			rt = rt.middleNode;

		if (isOneMultOrOneVar(lt, rt) || isOneMultOrOneVar(rt, lt) || areBothMult(lt, rt))
		{
			this.findAllVariables(variables);
             
            // anything needs multiplied should be checked with multiple vars:  
            var baseVars = {};
			for (var prop in variables)
			{
                if (variables[prop] > 1)
					return false;

                var base = prop.substr(0, prop.indexOf("_"));
                var expon = prop.substr(prop.lastIndexOf("_")+1); // +1 to bypass the last "_"
				
                if (base == "" || expon == "")
                    continue; //base = prop;
                
				if (expon > 1)
				{
					if (baseVars.hasOwnProperty(base+"power"))
						return false;
					else
		                baseVars[base+"power"] = 1;
				}
				else // exponent < 1: it's a root
				{
					if (baseVars.hasOwnProperty(base+"root"))
						return false;
					else
		                baseVars[base+"root"] = 1;
				}
			}
		}

		return true;
	}

	//=======================================================
	//=======================================================
    isOneMultOrOneVar = function(mPtr, vPtr)
    {
        return (mPtr.checkType("Multiplication") && mPtr.parenChildsAreSingleTerm()
                || vPtr.checkType("Variable"));
    }
    
	//=======================================================
	//=======================================================
    areBothMult = function(lt, rt)
    {
        return ((lt.checkType("Multiplication") && lt.parenChildsAreSingleTerm() &&
                 rt.checkType("Multiplication") && rt.parenChildsAreSingleTerm()))
    }
/* 
	//=======================================================
	//=======================================================
	Multiplication.prototype.areAllVariablesCombined = function()
	{
		var variables = {};
		var checkNodeLeft = this.leftNode;
		var checkNodeRight = this.rightNode;
		var divCombined = true;

		if (checkNodeLeft instanceof tree.Parenthesis)
			checkNodeLeft = checkNodeLeft.middleNode;
		if (checkNodeRight instanceof tree.Parenthesis)
			checkNodeRight = checkNodeRight.middleNode;

		if (checkNodeLeft instanceof tree.Division)
			divCombined = checkNodeLeft.areAllVariablesCombined();
		if (checkNodeRight instanceof tree.Division)
			divCombined = checkNodeRight.areAllVariablesCombined() && divCombined;

		if (!divCombined)
			return false;

		if (checkNodeLeft && checkNodeRight) // anything needs multiplied should be checked with multiple vars:
		{
			this.findAllVariables(variables);

			for (var prop in variables)
			{
				if (variables[prop] > 1)
					return false;
			}
		}

		return true;
	}
*/
	//=======================================================
	//=======================================================
	Multiplication.prototype.combineFractionCoeffwithVariable = function()
	{
		var combined = false;
		var numNode;
		var varNode;

		if (this.leftNode instanceof tree.Numerical && !(this.leftNode.isInteger()) && this.rightNode instanceof tree.Variable)
		{
			numNode = this.leftNode;
			varNode = this.rightNode;
		}
		else if (this.rightNode instanceof tree.Numerical && !(this.rightNode.isInteger()) && this.leftNode instanceof tree.Variable)
		{
			numNode = this.rightNode;
			varNode = this.leftNode;
		}
		else
			return combined;

		var divNode = new tree.Division();
		var numeratorNode;
		var numerator  = numNode.number.numerator;
		var denominator = numNode.number.denominator;

		if (Math.abs(numerator) !== 1 || numNode.isNegative())
		{
			var mult = new Multiplication();
			var multNum = new tree.Numerical(numerator, 1);
			mult.leftNode = multNum;
			mult.rightNode = varNode;

			multNum.parentNode = mult;
			varNode.parentNode = mult;
			numeratorNode = mult;
		}
		else
			numeratorNode = varNode;

		var denominatorNode = new tree.Numerical(denominator, 1);
		divNode.leftNode = numeratorNode;
		divNode.rightNode = denominatorNode;
		numeratorNode.parentNode = divNode;
		denominatorNode.parentNode = divNode;
		divNode.parentNode = this.parentNode;
		this.parentNode.assignNodeNewChild(this, divNode);

		return true;
	}

	//=======================================================
	//=======================================================
	Multiplication.prototype.getMultipliedVariables = function(variables)
	{
		if (this.leftNode instanceof Multiplication)
			this.leftNode.getMultipliedVariables(variables);
		if (this.rightNode instanceof Multiplication)
			this.rightNode.getMultipliedVariables(variables);

		if (this.leftNode instanceof tree.Variable ||
			this.leftNode instanceof tree.Power ||
			(this.leftNode instanceof tree.Parenthesis && this.parenChildsAreSingleTerm("left")))
		{
			this.leftNode.findAllVariables(variables);
		}
		if (this.rightNode instanceof tree.Variable ||
			this.rightNode instanceof tree.Power ||
			(this.rightNode instanceof tree.Parenthesis && this.parenChildsAreSingleTerm("right")))
		{
			this.rightNode.findAllVariables(variables);
		}
	}

	//=======================================================
	//=======================================================
	Multiplication.prototype.areAllVariablesMultiplied = function()
	{
		var variables = {};
		this.getMultipliedVariables(variables);

		for (var prop in variables)
		{
			if (variables[prop] > 1)
				return false;
		}

		return true;
	}

	//=======================================================
	//=======================================================
	Multiplication.prototype.countFactors = function()
	{
		return this.leftNode.countFactors() + this.rightNode.countFactors() + 1;
	}
/*
	//=======================================================
	//=======================================================
	Multiplication.prototype.findLikeTerms = function(terms, isNegative)
	{
		var term = this.getTerm(this.precedence);
		var coefficient = this.getCoefficient(this.precedence);

        // parse term with *:
        // create a tree with branches on each side of the term:
        // process each side of tree (with variable instances):
        
		if (isNegative)
			coefficient = tree.Fraction.multiply(coefficient, new tree.Fraction(-1));

		// Code below for terms that are parens ie 3(x-2) so we can find the x in there and add it as a 3x term
		var termRoot = tree.Root.createTree(term);

		if (termRoot.rootNode instanceof tree.Parenthesis)
		{
			var tempTerm;
			var termArray = [];
			termRoot.rootNode.middleNode.getPolyTerms(termArray);

			//trace("terms inside term");
			for (var k = 0; k < termArray.length; k++)
			{
				var tempObj = {};
				tempTerm = termArray[k];
				tempTerm.findAllVariables(tempObj);

				for (var g in tempObj)
				{
					if (!terms.hasOwnProperty(g))
					{
//r						terms.addProperty(g);
						terms[g] = coefficient;
					}
					else
					{
						var oldCoefficient = terms[g];
						terms[g] = tree.Fraction.plus(oldCoefficient, coefficient);
					}
				}
			}
		}
        else
        {
            // if left side and right side all contains variables:
            terms.changed = terms.changed || (!this.areAllVariablesCombined()); //this.combinePowers() // NF: add this to addres 2x * x kind of problem        }
        }

        if (terms.changed)
            return; // no point to linger
        
		if (terms.hasOwnProperty(term))
		{
			var oldCoefficient = terms[term];
			terms[term] = tree.Fraction.plus(oldCoefficient, coefficient);
			terms.changed = true;
		}
		else
		{
			terms[term] = coefficient;
            terms.changed = terms.changed || this.checkSqrtPowerCombination();
		}
	}
*/
	//=======================================================
	//=======================================================
	Multiplication.prototype.getCoefficient = function(newPrecedence)
	{
		if (this.precedence <= newPrecedence)
		{
			var coeffLeft = new tree.Fraction(1);
			var coeffRight = new tree.Fraction (1);

			if (this.leftNode !== null)
				coeffLeft = this.leftNode.getCoefficient(newPrecedence);
			if (this.rightNode !== null)
				coeffRight = this.rightNode.getCoefficient(newPrecedence);

			return tree.Fraction.multiply(coeffLeft, coeffRight);
		}
		else
			return null;
	}

	//=======================================================
	//=======================================================
	Multiplication.prototype.getDegree = function()
	{
		var degree = 0;
		var child;
		var myChildren = this.getChildren();

		while (myChildren.length > 0)
		{
			child = myChildren.pop();
			if (child !== null)
				degree += child.getDegree();
		}

		return degree;
	}

	//=======================================================
	//=======================================================
	Multiplication.prototype.getFactors = function(terms, isNumerator)
	{
		if (terms.order === undefined)
			terms.order = [];


        var rightIsPowerOrNroot = (this.rightNode instanceof tree.Parenthesis
                            && this.rightNode.middleNode instanceof tree.powerNroot);
        
        // deal with situation such as: -(4(x+1))
        if (this.leftNode instanceof tree.Numerical && this.leftNode.equalsNegativeOne() &&
            this.rightNode instanceof tree.Parenthesis && !rightIsPowerOrNroot)
        {
            var newTerms = {};
                newTerms.order = [];
            var rt = this.rightNode.middleNode;
            rt.leftNode.getFactors(newTerms, isNumerator);

            if (rt instanceof tree.Multiplication) // only change the sign of the 1st element:
            {
                var key01 = _.pairs(newTerms)[0][0]; // get the 1st key
                if (key01 == "order")
                    key01 = _.pairs(newTerms)[0][1]; // get the next key
                
                // add negative sign for the key:
                var value = newTerms[key01]; 
                newTerms["-"+key01] = value;
                delete newTerms[key01];

                rt.rightNode.getFactors(newTerms, isNumerator); // get the rest factors
            }
            else // addSubtract:
                if (rt instanceof tree.AddSubtractBase)
            {
                rt.rightNode.getFactors(newTerms, isNumerator);
                
                /* // this part need to distinguish multiplication result vs add/subtract result from the above getFactors:
                _.each(newTerms, function(value, key)
                {
                    if (key != "order")
                    {
                        if (key[0] != '-')
                            key = "-" + key;
                        else
                            key = key.substring(1, key.length-1);
                    }
                }) */
            }

            // combine newTerms into terms:
            for (var i= 0; i<newTerms.order.length; i++)
                terms.order[terms.order.length] = newTerms.order[i]; // follow the same order

            _.each(newTerms, function(value, key)
            {
                if (key != "order")
                {
                    if (terms.hasOwnProperty(key))
                    {
                        var sum = new tree.Numerical(terms[key].numerator + value.numerator,
                                                      terms[key].denominator + value.denominator);
                        terms[key] = sum;
                    }
                    else
                        terms[key] = value;
                }
            })
            
            return; // anything else (such as trig, AND, OR etc) don't get any factors
        }
        else
        {
            this.leftNode.getFactors(terms, isNumerator);
            this.rightNode.getFactors(terms, isNumerator);
        }
	}

	//=======================================================
	//=======================================================
	Multiplication.prototype.getNumerical = function()
	{
		if (this.leftNode instanceof tree.Numerical)
			return this.leftNode.number;
		else if (this.rightNode instanceof tree.Numerical)
			return this.rightNode.number;
		else
			return undefined;
	}

	//=======================================================
	//=======================================================
	Multiplication.prototype.getPolyCoefficient = function()
	{
		return tree.Fraction.multiply(this.leftNode.getPolyCoefficient(), this.rightNode.getPolyCoefficient());
	}

	//=======================================================
	//=======================================================
	Multiplication.prototype.performApproximateOp = function(op1, op2)
	{
		return op1 * op2;
	}

	//=======================================================
	//=======================================================
	Multiplication.prototype.performOp = function(op1, op2)
	{

		return tree.Fraction.multiply(op1, op2);
	}

/*************************************************************/
/*  	 	FUNCTIONS THAT MODIFY THE GIVEN TREE			 */
/*************************************************************/

	//=======================================================
	//=======================================================
	Multiplication.prototype.checkForOnes = function()
	{
		var foundOne = false;

		if (this.leftNode !== null)
			foundOne = this.leftNode.checkForOnes() || foundOne;

		if (this.rightNode !== null)
			foundOne = this.rightNode.checkForOnes() || foundOne;

		if (this.leftNode instanceof tree.Numerical && this.leftNode.equalsOne())
		{
			this.leftNode.deleteNode(false);
			this.rightNode.parentNode = this.parentNode;	// May be null

			// @DG: parentNode is null sometimes. This is an attempt to prevent the crash while maintaining the operation.
			if (this.parentNode)
				this.parentNode.assignNodeNewChild(this, this.rightNode);
			else
				this.rootNode.rootNode = this.rightNode;

			//changed
			return true;
		}

		if (this.rightNode instanceof tree.Numerical && this.rightNode.equalsOne())
		{
			this.rightNode.deleteNode(false);
			this.leftNode.parentNode = this.parentNode;	// May be null

			// @DG: parentNode is null sometimes. This is an attempt to prevent the crash while maintaining the operation.
			if (this.parentNode)
				this.parentNode.assignNodeNewChild(this, this.leftNode);
			else
				this.rootNode.rootNode = this.leftNode;

			//changed
			return true;
		}

		return foundOne;
	}
/*
	//=======================================================
    // return TRUE: combinale and should be further simplified
    //        FALSE: OK
	//=======================================================
	Multiplication.prototype.checkSqrtPowerCombination = function()
	{
        var lt = this.leftNode;
        var rt = this.rightNode;
        
        // sqrt(x) * sqrt(y) should be simplified to sqrt(xy):
        if (lt instanceof tree.SquareRoot && rt instanceof tree.SquareRoot)
            return true;

        return false;
    }
*/    
	//=======================================================
	//=======================================================
	Multiplication.prototype.combinePowers = function()
	{
		var terms = {changed:false, combinable:true};
		this.leftNode.getVariableFactors(terms, false);
		this.rightNode.getVariableFactors(terms, false);

		if (!terms.combinable)
			return false;

		if (terms.changed)
		{
			var newTree = this.buildVariableFactorTree(terms);
			newTree.setRoot(this.rootNode);

			if (this.parentNode === null)
				this.rootNode.rootNode = newTree;
			else
			{
				newTree.parentNode = this.parentNode;
				this.parentNode.assignNodeNewChild(this, newTree);
			}
			return true;
		}
		else
			return false;
	}

	//=======================================================
	//=======================================================
	Multiplication.prototype.combineSquareRoots = function(isNumerator)
	{
		var leftObject;
		var rightObject;
		var finalObject = {changed:false};

		if (this.leftNode !== null)
			leftObject = this.leftNode.combineSquareRoots(isNumerator);

		if (this.rightNode !== null)
			rightObject = this.rightNode.combineSquareRoots(isNumerator);

		if (leftObject.hasOwnProperty("squareRoot") && rightObject.hasOwnProperty("squareRoot"))
		{
			//combine them if they are on the same side of fraction
			if (leftObject.isNumerator === rightObject.isNumerator)
			{
				var mult = new Multiplication();
				mult.leftNode = leftObject.squareRoot.middleNode;
				mult.leftNode.parentNode = mult;
				mult.rightNode = rightObject.squareRoot.middleNode;
				mult.rightNode.parentNode = mult;
				leftObject.squareRoot.middleNode = mult;
				mult.parentNode = leftObject.squareRoot;
				leftObject.squareRoot.setRoot(leftObject.squareRoot.rootNode);

				rightObject.squareRoot.parentNode.assignNodeNewChild(rightObject.squareRoot, null);

				finalObject = this.leftNode;
				finalObject.changed = true;
			}
		}
		else if (leftObject.hasOwnProperty("squareRoot"))
			finalObject = leftObject;
		else if (rightObject.hasOwnProperty("squareRoot"))
			finalObject = this.rightNode;

		return finalObject;
	}

	//=======================================================
	//=======================================================
	Multiplication.prototype.distributeNode = function(node, distributeRight)
	{
		//trace("in distribute node multi with "+node.getTreeAsString());
		if (node.precedence < this.precedence)
		{
			//trace("distr multi prece 1");
			//trace(this.getTreeAsString());

			if (node instanceof tree.Numerical || node instanceof tree.Variable)
			{
				//doesn't matter whether we're distributing left or right,
				//just get rid of the parenthesis
				var tempNode = this.duplicateNode(this.rootNode);
				var amount;
				if (distributeRight)
				{
					amount = this.leftNode.duplicateTree(this.rootNode);
					Node.insertLeft(amount, tempNode);
					tempNode.rightNode = node;
				}
				else
				{
					amount = this.rightNode.duplicateTree(this.rootNode);
					Node.insertRight(amount, tempNode);
					tempNode.leftNode = node;
				}

				tempNode.parentNode = node.parentNode;
				tempNode.parentNode.assignNodeNewChild(node, tempNode);
				node.parentNode = tempNode;

				return true;
			}

			if (distributeRight)
			{
				var distributed = false;
				//trace("distributing right");
				if (node.leftNode instanceof tree.Numerical || node.leftNode instanceof tree.Variable)
				{
					//trace("left node var or number");
					var tempNode = this.duplicateNode(this.rootNode);
					var amount = this.leftNode.duplicateTree(this.rootNode);
					tempNode.leftNode = amount;
					amount.parentNode = tempNode;

					tempNode.rightNode = node.leftNode;
					tempNode.rightNode.parentNode = tempNode;
					node.leftNode = tempNode;
					tempNode.parentNode = node;
					distributed = true;
					//trace("after job");
					//trace(this.rootNode.getTreeAsString());
				}
				else
				{
					//trace("left node not var or number");
					//trace("sending "+node.leftNode.getTreeAsString());
					distributed = this.distributeNode(node.leftNode, distributeRight) || distributed;
				}

				if (node.rightNode instanceof tree.Numerical || node.rightNode instanceof tree.Variable)
				{
					//trace("right node var or number");
					var tempNode = this.duplicateNode(this.rootNode);
					var amount = this.leftNode.duplicateTree(this.rootNode);
					tempNode.leftNode = amount;
					amount.parentNode = tempNode;

					tempNode.rightNode = node.rightNode;
					tempNode.rightNode.parentNode = tempNode;
					node.rightNode = tempNode;
					tempNode.parentNode = node;
					distributed = true;
					//trace("after job");
					//trace(this.rootNode.getTreeAsString());
				}
				else
				{
					//trace("right node not var or number");
					distributed = this.distributeNode(node.rightNode, distributeRight) || distributed;
				}

				return distributed;
			}
			else
			{
				var distributed = false;
				//trace("distri left");
				if (node.leftNode instanceof tree.Numerical || node.leftNode instanceof tree.Variable)
				{
					//trace("left numerical or var");
					var tempNode = this.duplicateNode(this.rootNode);
					var amount = this.rightNode.duplicateTree(this.rootNode);
					tempNode.rightNode = amount;
					amount.parentNode = tempNode;

					tempNode.leftNode = node.leftNode;
					tempNode.leftNode.parentNode = tempNode;
					node.leftNode = tempNode;
					tempNode.parentNode = node;
					distributed = true;
					//trace("after job");
					//trace(this.rootNode.getTreeAsString());
				}
				else
				{
					//trace("not left num var");
					distributed = this.distributeNode(node.leftNode, distributeRight) || distributed;
				}
				if (node.rightNode instanceof tree.Numerical || node.rightNode instanceof tree.Variable)
				{
					//trace("right is numerical or var");
					var tempNode = this.duplicateNode(this.rootNode);
					var amount = this.rightNode.duplicateTree(this.rootNode);
					tempNode.rightNode = amount;
					amount.parentNode = tempNode;

					tempNode.leftNode = node.rightNode;
					tempNode.leftNode.parentNode = tempNode;
					node.rightNode = tempNode;
					tempNode.parentNode = node;
					distributed = true;
					//trace("after job");
					//trace(this.rootNode.getTreeAsString());
				}
				else
				{
					//trace("right not num or var");
					distributed = this.distributeNode(node.rightNode, distributeRight) || distributed;
				}
				return distributed;
			}
		}
		else
		{
			//trace("distr multi prece 2");//need to choose just one node to distribute to
			//trace(this.getTreeAsString());

			if (distributeRight)	//need more here.
			{
				//trace("dis right");
				//trace(this.rootNode.getTreeAsString());

				var tempNode = this.duplicateNode(this.rootNode);
				var amount = this.leftNode.duplicateTree(this.rootNode);
				//trace(node.leftNode.className+" "+node.rightNode.className+" "+amount.className);
				tempNode.leftNode = amount;
				amount.parentNode = tempNode;

				//check if node is negative variable which is multiplication node with minus and var childs
				if (node.leftNode instanceof tree.Numerical && node.leftNode.isNegative() && node.rightNode instanceof tree.Variable && amount instanceof tree.Numerical)
				{
					//trace("multiply neg variable");
					var numVar = node.leftNode.number;
					var numAmount = amount.number;
					amount.updateValue(new tree.Fraction(numAmount.numerator*numVar.numerator, numAmount.denominator*numVar.denominator));
					tempNode.rightNode = node.rightNode;
					node.rightNode.parentNode = tempNode;
					node.parentNode.assignNodeNewChild(node, tempNode);
					tempNode.parentNode = node.parentNode;
				}
				else
				{
					//trace("old logic");
					tempNode.rightNode = node;
					node.parentNode.assignNodeNewChild(node, tempNode);
					tempNode.parentNode = node.parentNode;
					node.parentNode = tempNode;
				}

				//trace("after job2");
				//trace(this.rootNode.getTreeAsString());
				return true;
			}
			else
			{
				//trace("dis left");
				//trace(this.rootNode.getTreeAsString());
				//trace(this.getTreeAsString());
				//trace(node.getTreeAsString());
				var tempNode = this.duplicateNode(this.rootNode);
				var amount = this.rightNode.duplicateTree(this.rootNode);
				tempNode.rightNode = amount;
				amount.parentNode = tempNode;

				if (node instanceof tree.Power)
				{
					tempNode.leftNode = node;

					node.parentNode.assignNodeNewChild(node, tempNode)
					tempNode.parentNode = node.parentNode;
					node.parentNode = tempNode;
				}
				else
				{
					tempNode.leftNode = node.rightNode;
					tempNode.leftNode.parentNode = tempNode;
					node.rightNode = tempNode;
					tempNode.parentNode = node;
				}

				//trace("after job3");
				//trace(this.rootNode.getTreeAsString());
				return true;
			}
		}
	}

	//=======================================================
	//=======================================================
	Multiplication.prototype.removeNulls = function()
	{
		var removedNulls = false;

		if (this.leftNode !== null)
			removedNulls = this.leftNode.removeNulls() || removedNulls;
		if (this.rightNode !== null)
			removedNulls = this.rightNode.removeNulls() || removedNulls;

        if (this.parentNode)
        {
            if (this.leftNode === null)
            {
                this.parentNode.assignNodeNewChild(this, this.rightNode);
                this.rightNode.parentNode = this.parentNode;
                if (this.rootNode.rootNode === this)
                    this.rootNode.rootNode = this.rightNode;
                return true;
            }
            else if (this.rightNode === null)
            {
                this.parentNode.assignNodeNewChild(this, this.leftNode);
                this.leftNode.parentNode = this.parentNode;
                if (this.rootNode.rootNode === this)      //rootNode is not defined: changed all rootNode to this.rootNode
                    this.rootNode.rootNode = this.leftNode;
                return true;
            }
        }
		return removedNulls;
	}


/*************************************************************/
/*						PRIVATE FUNCTIONS					 */
/*************************************************************/

	//=======================================================
	//=======================================================
	Multiplication.prototype.canSimplifyNode = function()
	{
		if (this.rightNode instanceof tree.Variable && this.leftNode.isNegativeOne())
			return false;

		return true;
	}

	//=======================================================
	//=======================================================
	Multiplication.prototype.combineNumericals = function(leftObject, rightObject, reduceFracs)
	{
		var finalObject = {changed:true};
		var leftNum = leftObject.Numerical.number;
		var rightNum = rightObject.Numerical.number;

		if (leftObject.isOpposite)
			leftNum = this.getOpposite(leftNum);
		if (rightObject.isOpposite)
			rightNum = this.getOpposite(rightNum);

		var newNum = this.performOp(leftNum, rightNum);

        if (leftNum.isInteger() && rightNum.isInteger())
            reduceFracs = false;
                
		if (reduceFracs)
        {
			var reduced = newNum.reduce();

            if (reduced === false)
            {
                finalObject.changed = false; // shouldn't be changed for non-reduced fraction
                return finalObject;
            }
        }

		if (!leftObject.isOpposite && newNum.isInteger())
		{
			leftObject.Numerical.updateValue(newNum);
			rightObject.Numerical.deleteNode();
			finalObject.Numerical = leftObject.Numerical;
			finalObject.isOpposite = leftObject.isOpposite;
		}
		else if (!rightObject.isOpposite && newNum.isInteger())
		{
			rightObject.Numerical.updateValue(newNum);
			leftObject.Numerical.deleteNode();
			finalObject.Numerical = rightObject.Numerical;
			finalObject.isOpposite = rightObject.isOpposite;
		}
		else if (leftObject.isOpposite && newNum.reciprocal().isInteger())
		{
			newNum = this.getOpposite(newNum);
			leftObject.Numerical.updateValue(newNum);
			rightObject.Numerical.deleteNode();
			finalObject.Numerical = leftObject.Numerical;
			finalObject.isOpposite = leftObject.isOpposite;
		}
		else if (rightObject.isOpposite && newNum.reciprocal().isInteger())
		{
			newNum = this.getOpposite(newNum);
			rightObject.Numerical.updateValue(newNum);
			leftObject.Numerical.deleteNode();
			finalObject.Numerical = rightObject.Numerical;
			finalObject.isOpposite = rightObject.isOpposite;
		}
		else
		{ //just put it on the left
			if (leftObject.isOpposite)
				newNum = this.getOpposite(newNum);
			leftObject.Numerical.updateValue(newNum);
			rightObject.Numerical.deleteNode();
			finalObject.Numerical = leftObject.Numerical;
			finalObject.isOpposite = leftObject.isOpposite;
		}

		this.removeNulls();
		return finalObject;
	}

	//=======================================================
	//=======================================================
	Multiplication.prototype.getNodeAsString = function()
	{
		if (this.leftNode && this.leftNode.isNegativeOne() && !(this.rightNode instanceof tree.Numerical))
		{
			this.leftNode.showNumber = false;
			return " ";
		}

		return "*";
	}

	//=======================================================
	//=======================================================
	Multiplication.prototype.replaceNumerical = function(num)
	{
		if (this.leftNode instanceof tree.Numerical)
			this.leftNode.updateValue(num);
		else if (this.rightNode instanceof tree.Numerical)
			this.rightNode.updateValue(num);
	}

	//=======================================================
	//=======================================================
	Multiplication.prototype.doubleNegative = function()
	{
		//trace("in double negative multi");
		var doubleNegatives = false;
		if (this.leftNode !== null)
			doubleNegatives = this.leftNode.doubleNegative() || doubleNegatives;
		if (this.rightNode !== null)
			doubleNegatives = this.rightNode.doubleNegative() || doubleNegatives;

		var numFrac;
		var denFrac;
		var numNumerical;
		var denNumerical;
		var foundNumberNum = false;
		var foundNumberDen = false;

		if (this.leftNode instanceof Multiplication && this.leftNode.leftNode.isNegative())
		{

			numNumerical = this.leftNode.leftNode;
			numFrac = numNumerical.number;

			foundNumberNum = true;
		}
		else if (this.leftNode instanceof tree.Numerical && this.leftNode.isNegative())
		{
			numNumerical = this.leftNode;
			numFrac = numNumerical.number;
			foundNumberNum = true;
		}

		if (this.rightNode instanceof Multiplication && this.rightNode.leftNode.isNegative())
		{
			denNumerical = this.rightNode.leftNode;
			denFrac = denNumerical.number;
			foundNumberDen = true;
		}
		else if (this.rightNode instanceof tree.Numerical && this.rightNode.isNegative())
		{
			denNumerical = this.rightNode;
			denFrac = denNumerical.number;
			foundNumberDen = true;
		}

		if (foundNumberNum && foundNumberDen)
		{
			//trace("found two negative numbers in multiplication that can be turned into positive");
			//trace(numFrac.asStringNew());
			//trace(denFrac.asStringNew());
			numFrac = numFrac.getAbs();
			denFrac = denFrac.getAbs();
			numNumerical.updateValue(numFrac);
			denNumerical.updateValue(denFrac);
			doubleNegatives = true;
		}

		return doubleNegatives;
	}

	//=======================================================
	//=======================================================
	Multiplication.prototype.parenChildsAreSingleTerm = function(oneSide)
	{
		var tempParen;
		oneSide = (oneSide === null || oneSide === undefined) ? "leftandright" : oneSide.toLowerCase();

		if (oneSide.indexOf("left") >= 0)
		{
			if (this.leftNode instanceof tree.Parenthesis)
			{
				tempParen = this.leftNode;

				while (tempParen.middleNode instanceof tree.Parenthesis)
					tempParen = tempParen.middleNode;

				if (tempParen.middleNode instanceof tree.Addition || tempParen.middleNode instanceof tree.Subtraction)
					return false;

			}
		}

		if (oneSide.indexOf("right") >=0)
		{
			if (this.rightNode instanceof tree.Parenthesis)
			{
				tempParen = this.rightNode;

				while (tempParen.middleNode instanceof tree.Parenthesis)
					tempParen = tempParen.middleNode;

				if (tempParen.middleNode instanceof tree.Addition || tempParen.middleNode instanceof tree.Subtraction)
					return false;

			}
		}

		return true;
	}

	//=======================================================
	//=======================================================
	Multiplication.prototype.isNumericalTimesNegativeOne = function()
	{
		return (this.leftNode.isNegativeOne() && this.rightNode instanceof tree.Numerical)
	}

	//=======================================================
    // simplify conditions:
    //    - should de-factor if no factor rule is set, one side is addition
    //    - both sides are numericals
	//=======================================================
	Multiplication.prototype.simplify = function(parentPrecedence, reduceFracs, rules)
	{
		var simplifyObject = new Object({changed:false});

        if (!this.areAllVarsMultiplied())            
        {
            simplifyObject.changed = true;
            return simplifyObject; // early out if already failed
        }

        var lt = this.leftNode;
        if (lt instanceof tree.Parenthesis)
            lt = lt.middleNode;
            
        var rt = this.rightNode;
        if (rt instanceof tree.Parenthesis)
            rt = rt.middleNode;
            
        if (!lt.equalsMagOne() && !rt.equalsMagOne() &&
            (lt instanceof tree.AddSubtractBase || rt instanceof tree.AddSubtractBase)
            || (lt instanceof tree.Numerical && rt instanceof tree.Numerical))
        {
            simplifyObject.changed = true;
            return simplifyObject; // early out if already failed
        }
        
        simplifyObject = lt.simplify(this.precedence, reduceFracs, rules);
        if (simplifyObject.changed)
            return simplifyObject; // early out if already failed
        
        simplifyObject = rt.simplify(this.precedence, reduceFracs, rules);
        return simplifyObject;
	}

module.exports = Multiplication;
},{"./tree":47,"underscore":61}],27:[function(require,module,exports){
//==========================================================================
// Tree node type: nth Roots
//
// @FIXME/dg: PROBLEM! What is the proper format of nroot(b,p)?
// Some routines (evaluateNode, evaluateNodeWithVariables) assume 'p' is a power, meaning 0.5 would be a square root.
// Other routines (getApproximateValueOfTree) assume 'p' is the degree, meaning 2 would be a square root.
// The parser is the ultimate arbiter. It says degree: nroot(81,3) is the cubed root of 81.
//
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class NRoot extends Operator
var tree = require('./tree');	// node tree helper file

	//=======================================================
	// Constructor
	//=======================================================
	NRoot = function()
	{
		tree.powerNroot.call(this);	// Call the parent constructor (was super())
		this.className = "NRoot";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	NRoot.prototype = new tree.powerNroot();
	NRoot.prototype.constructor = NRoot;
/*
	//=======================================================
	//=======================================================
	NRoot.prototype.canSimplifyNode = function()
	{
		return true;
	}
*/
	//=======================================================
	//=======================================================
	NRoot.prototype.getTreeAsString = function(isDecimal)
	{
		var tempString = "nroot(";

		if (this.leftNode !== null)
			tempString += this.leftNode.getTreeAsString(isDecimal);

		tempString += ", ";

		if (this.rightNode !== null)
			tempString += this.rightNode.getTreeAsString(isDecimal);

		tempString += ")";

		return tempString;
	}

	//=======================================================
	// This is the same as horizontalOperator's implementation.
	// Cross-calling class methods like this is bad form.  It
	// would be better to move the functionality to the base class,
	// but it might not be appropriate there.  It could also move
	// to a tools module.
	//=======================================================
	NRoot.prototype.duplicateTree = function(root)
	{
		return tree.HorizontalOperator.prototype.duplicateTree.call(this, root);
	}

	//=======================================================
	//=======================================================
	NRoot.prototype.getExponentValue = function()
	{
		if (this.rightNode !== null && this.rightNode instanceof tree.Numerical)
			return this.rightNode.number;
		else
			return null;
	}

	//=======================================================
	// DG: Added to allow non-numerical exponents
	//
	// Not used externally, so technically doesn't need to be
	// added to the prototype. However, doing so forces it
	// to be called with a 'this' context.
	//=======================================================
	NRoot.prototype.getExponent = function()
	{
		return this.rightNode;
	}

	//=======================================================
	//=======================================================
	NRoot.prototype.getBase = function()
	{
		return this.leftNode;
	}

	//=======================================================
	//=======================================================
	NRoot.prototype.getApproximateValueOfTree = function(variables)
	{
		var base = this.getBase().getApproximateValueOfTree(variables);
//		var tempPow = this.getExponentValue();		// DG: Only worked with numbers
		var power = this.getExponent().getApproximateValueOfTree(variables);
		var isNegative = false;

		// Math.pow doesn't work with negative numbers, but some negatives are legit!
		if (base < 0 && !(power % 2 === 0))
		{
			base = Math.abs(base);
			isNegative = true;
		}

		power = 1 / power;		// DG: Take the reciprocal here. The inverse was needed above.

		var result = Math.pow(base, power);	// DG: This will be NaN for imaginary numbers! It might be good to handle 'i'.
		if (isNegative)
			result = -result;

		return fixJSMath(result);
	}

	//=======================================================
	// NOTE: The original version of nroot was BROKEN!
	// evaluateNode & evaluateNodeWithVariables were using
	// the degree incorrectly, and didn't work.
	//=======================================================
	NRoot.prototype.evaluateNodeWithVariables = function(variables)
	{
		var evalBase = this.leftNode.evaluateNodeWithVariables(variables);
		var evalDegree = this.rightNode.evaluateNodeWithVariables(variables);
		var degree = evalDegree.denominator / evalDegree.numerator;		// Take the reciprocal
		degree = roundDegree(degree);

		////trace("the degree of this nroot");
		////trace(this.getTreeAsString());
		////trace(degree);
		////trace(evalBase.asStringNew());
		////trace(this.parentNode.className);

		evalBase.numerator = Math.pow(evalBase.numerator, degree);
		evalBase.denominator = Math.pow(evalBase.denominator, degree);
		////trace("after operation nroot");
		////trace(evalBase.numerator);
		////trace(evalBase.denominator);

		return evalBase;
	}

	//=======================================================
	// This takes a Fraction parameter
	//
	// NOTE: The original version of nroot was BROKEN!
	// evaluateNode & evaluateNodeWithVariables were using
	// the degree incorrectly, and didn't work.
	//=======================================================
	NRoot.prototype.evaluateNode = function(variableValue)
	{
		var evalBase = this.leftNode.evaluateNode(variableValue);
		var evalDegree = this.rightNode.evaluateNode(variableValue);
		var degree = evalDegree.denominator / evalDegree.numerator;		// Take the reciprocal
		degree = roundDegree(degree);

		evalBase.numerator = Math.pow(evalBase.numerator, degree);
		evalBase.denominator = Math.pow(evalBase.denominator, degree);

		return evalBase;
	}

	//=======================================================
	// check if there is any perfect power inside the n root
	//
	// Returns False: no perfect power
	//=======================================================
	NRoot.prototype.checkPerfectPower = function()
	{
        var base = this.leftNode;
    
        if ((this.rightNode instanceof tree.Numerical && this.rightNode.isInteger())
            || this instanceof tree.SquareRoot)
        {
            var exponent = 2;
            if (!(this instanceof tree.SquareRoot))
                exponent = this.rightNode.number.numerator;
            else
                base = this.middleNode;
                
            while(base instanceof tree.Parenthesis)
                base = base.middleNode;
                
            if (base instanceof tree.Numerical)
                return base.isPartialPerfectPower(exponent);
            
            if (base instanceof tree.Multiplication && base.parenChildsAreSingleTerm())
            {
                var numbers = [];
                base.findAllInstancesOfClass("Numerical", numbers);
                for (var i= 0; i< numbers.length; i++)
                    if (numbers[i].parentNode === base && // only deal with multiplication
                        numbers[i].isPartialPerfectPower(exponent))
                        return true;
            }
        }
            
        return false;
	}

	//=======================================================
	// Round degree -- helper for evaluateNode/evaluateNodeWithVariables
	//
	//=======================================================
	function roundDegree(degree)
	{
		if (Math.floor(degree) !== degree)
		{
			//round
			degree = degree * Math.pow(10,3);
			degree = Math.floor(degree);
			degree = degree / Math.pow(10,3);
		}

		return degree;
	}

	//=======================================================
	// DG: Added helper to deal with JS rounding issue
	//
	// Compensate for binary rounding issue.
	// Arguments: number to check
	//=======================================================
	function fixJSMath(num)
	{
		if (num === undefined) return num;

		// Get the magnitude of the number
		var mag = Math.floor(log10(Math.abs(num)));

		// Round off relative to the magnitude.  This will protect very small numbers.
		return round(num, 10-mag);
	}

	//=======================================================
	// Round function that operates an an arbitrary decimal position
	// Arguments: number to round, number of decimal places
	//=======================================================
	function round(rnum, rlength)
	{
		return Math.round(rnum * Math.pow(10, rlength)) / Math.pow(10, rlength);
	}

	//=======================================================
	// JS doesn't have a log10 function
	//=======================================================
	function log10(val)
	{
		return Math.log(val) / Math.LN10;
	}

module.exports = NRoot;

},{"./tree":47}],28:[function(require,module,exports){
//==========================================================================
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Calculator.MathTree.NaturalLog extends Logarithm
var tree = require('./tree');	// node tree helper file

	//left node is content of log
	//right node is base of log

	//=======================================================
	// Constructor
	//=======================================================
	NaturalLog = function()
	{
		tree.Logarithm.call(this);	// Call the parent constructor (was super())

		this.middleNode = null;
		this.className = "NaturalLog";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	NaturalLog.prototype = new tree.Logarithm();
	NaturalLog.prototype.constructor = NaturalLog;


	//=======================================================
	//=======================================================
	NaturalLog.prototype.getTreeAsString = function(isDecimal)
	{
		var tempString = "ln(";
		if (this.middleNode !== null)
			tempString += this.middleNode.getTreeAsString(isDecimal);
		tempString += ")";

		return tempString;
	}

	//=======================================================
	//=======================================================
	NaturalLog.prototype.assignNodeNewChild = function(matchingNode, newNode)
	{
		if (this.leftNode === matchingNode)
			this.leftNode = newNode;
		else if (this.rightNode === matchingNode)
			this.rightNode = newNode;
		else
			this.middleNode = newNode;
	}

	//=======================================================
	//=======================================================
	NaturalLog.prototype.duplicateTree = function(root)
	{
		var tempNode =  this.duplicateNode(root);   // NF only use root will not get NatualLog into rootNode;

		if (this.middleNode !== null)
		{
			tempNode.middleNode = this.middleNode.duplicateTree(root);
			tempNode.middleNode.parentNode = tempNode;
		}
		else
			tempNode.middleNode = null;

		return tempNode;
	}

	//=======================================================
	//=======================================================
	NaturalLog.prototype.evaluateNodeWithVariables = function(variables)
	{
		var evalBase = this.getBase();
		var evalLog = this.middleNode.evaluateNodeWithVariables(variables);

		var value = evalLog.numerator / evalLog.denominator;
		var base = evalBase.numerator / evalBase.denominator;

		var a = Math.log(value) / Math.log(base);
		var frac = new tree.Fraction(a);

		return frac;
	}

	//=======================================================
	//=======================================================
	NaturalLog.prototype.getApproximateValueOfTree = function(variables)
	{
		//var baseFraction = this.getBase();
		var value = this.getLog().getApproximateValueOfTree(variables);

		var base = Math.E;//baseFraction.numerator/baseFraction.denominator;
		return Math.log(value) / Math.log(base);
	}

	//=======================================================
	//=======================================================
	NaturalLog.prototype.evaluateNode = function(variableValue)
	{
		var evalLog = this.middleNode.evaluateNode(variableValue);
		var evalBase = this.getBase();

		var value = evalLog.numerator / evalLog.denominator;
		var base = evalBase.numerator / evalBase.denominator;

		var a = Math.log(value) / Math.log(base);
		var frac = new tree.Fraction(a);

		return frac;
	}

	//=======================================================
	//=======================================================
	NaturalLog.prototype.insertBalancedNode = function(node)
	{
		if (this.middleNode === null)
		{
			this.middleNode = node;
			node.parentNode = this;
		}
	}

	//=======================================================
	//=======================================================
	NaturalLog.prototype.isFull = function()
	{
		if (this.middleNode !== null)
			return true;
		else
			return false;
	}

	//=======================================================
	//=======================================================
	NaturalLog.prototype.getChildren = function()
	{
		var children = [];
		if (this.middleNode !== null)
			children.push(this.middleNode);

		return children;
	}

	//=======================================================
	//=======================================================
	NaturalLog.prototype.getBase = function()
	{
		return new tree.Fraction(Math.E);
	}

	//=======================================================
	//=======================================================
	NaturalLog.prototype.getLog = function()
	{
		return this.middleNode;
	}

module.exports = NaturalLog;

},{"./tree":47}],29:[function(require,module,exports){
//==========================================================================
// Tree node type: No Solutions
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Calculator.MathTree.NoSolutions extends HorizontalOperator{
var tree = require('./tree');	// node tree helper file

	//=======================================================
	// Constructor
	//=======================================================
	NoSolutions = function()
	{
		tree.HorizontalOperator.call(this);	// Call the parent constructor (was super())

		this.className = "NoSolutions";
		this.isBinary = true;
	}

	//=======================================================
	//=======================================================
	NoSolutions.prototype.canDistribute = function()
	{
		return false;
	}

	//=======================================================
	//=======================================================
	NoSolutions.prototype.getOpAsString = function()
	{
		return "no solutions";
	}

	//=======================================================
	//=======================================================
	NoSolutions.prototype.isPolynomial = function()
	{
		return false;
	}

	//=======================================================
	//=======================================================
	NoSolutions.prototype.isRational = function()
	{
		return false;
	}

	//=======================================================
	//=======================================================
	NoSolutions.prototype.getTreeAsString = function(isDecimal)
	{
		return "nosolutions";
	}

module.exports = NoSolutions;

},{"./tree":47}],30:[function(require,module,exports){
//==========================================================================
// Tree node type: Node base class
//
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
var tree = require('./tree');	// node tree helper file

/*
This class is the base class for all objects in an equation. It is the
object that makes up the tree that represents all equations. Each node
has at a minimum a left, right and parent node. It is subclassed by many
other classes.
*/
//class Node{

	//=======================================================
	// Constructor
	//=======================================================
	Node = function()
	{
		this.className = "Node";
		this.leftNode = null;
		this.rightNode = null;
		this.parentNode = null;
	}

	//=======================================================
	// This function only needs to be overriden if the class has any
	// parameters in its constructor.
	//=======================================================
	Node.prototype.duplicateNode = function(root)
	{
		var tempNode = new tree[this.className];
		tempNode.setRoot(root);
		tempNode.lastAction = this.lastAction;
		return tempNode;
	}

	/*************************************************************/
	/*   	FUNCTIONS THAT RETURN INFO ABOUT THE GIVEN TREE		 */
	/*************************************************************/

	//=======================================================
	//=======================================================
	Node.prototype.areAllNumbersWithExponentsSimplified = function(ignoreNegExpos)
	{
		return this.checkAllChildren("areAllNumbersWithExponentsSimplified", ignoreNegExpos);
	}

	//=======================================================
	//=======================================================
	Node.prototype.areParensToExponentSimplified = function()
	{
		return this.checkAllChildren("areParensToExponentSimplified");
	}

	//=======================================================
	//=======================================================
	Node.prototype.moveNumberCoefficientsToLeft = function()
	{
		return this.checkAllChildren("moveNumberCoefficientsToLeft");
	}

	//=======================================================
	//=======================================================
	Node.prototype.areAllVariablesCombined = function()
	{
		return this.checkAllChildren("areAllVariablesCombined");
	}

	//=======================================================
	//=======================================================
	Node.prototype.areAllFactorsCancelled = function()
	{
		return this.checkAllChildren("areAllFactorsCancelled");
	}

	//=======================================================
	//=======================================================
	Node.prototype.convertPowersToSqrt = function()
	{
		return this.checkAnyChildren("convertPowersToSqrt");
	}

	//=======================================================
	//=======================================================
	Node.prototype.makeNegativeMixedNumber = function()
	{
		return this.checkAnyChildren("makeNegativeMixedNumber");
	}

	//=======================================================
	//=======================================================
	Node.prototype.areFractionsUnderRadicals = function()
	{
		if (this instanceof tree.NRoot)
		{
            var ptr = this.middleNode;
            if (ptr instanceof tree.Parenthesis)
                ptr = ptr.middleNode;
            
            // fraction:    
            if (ptr instanceof tree.Numerical && !ptr.isInteger())
				return true;
            
            if (ptr)
            {
                // division:
                var nodes = [];
                ptr.findAllInstancesOfClass("Division", nodes);
                if (nodes.length > 0)
                    return true;
            }
		}
		return this.checkAnyChildren("areFractionsUnderRadicals");
	}

	//=======================================================
	//=======================================================
	Node.prototype.areRadicalsInDenominator = function()
	{
		if (this.areFractionsUnderRadicals())
            return true;
            
		if (this instanceof tree.Division && this.rightNode)
		{
			var nodes = [];
			this.rightNode.findAllInstancesOfClass("NRoot", nodes);
			if (nodes.length > 0)
				return true;
		}

		if (this instanceof tree.Power) // deal with x^0.5 situation:
		{
            if (this.rightNode instanceof tree.Numerical && this.rightNode.equalsOneHalf())
            {
                var base = this.leftNode;
                while(base instanceof tree.Parenthesis)
                    base = base.middleNode;
                    
            //    console.log("base =", base);
                if (base instanceof tree.Division
                    || (base instanceof tree.Numerical && !base.isInteger()))
                    return true;
            }
        }
        
		return this.checkAnyChildren("areRadicalsInDenominator");
	}

	//=======================================================
	//=======================================================
	Node.prototype.canInsertToRightOf = function(node)
	{
		return (this instanceof tree.Operator && this.precedence >= node.precedence)
	}

	//=======================================================
	//=======================================================
	Node.prototype.countFactors = function()
	{
		return 1;
	}

	//=======================================================
	// Note that numbers, such as 1/3, don't count as fractions
	//=======================================================
	Node.prototype.countFractions = function()
	{
		var myChildren = this.getChildren();

		var num = 0;
		if (this instanceof tree.Division)
			num = 1;

		var child;
		while (myChildren.length > 0)
		{
			child = myChildren.pop();

			if (child !== null)
				num += child.countFractions();
		}

		return num;
	}

	//=======================================================
	//=======================================================
	Node.prototype.countRadicals = function()
	{
		var myChildren = this.getChildren();

		var num = 0;
		if (this instanceof tree.NRoot)
			num = 1;

		var child;
		while (myChildren.length > 0)
		{
			child = myChildren.pop();

			if (child !== null)
				num += child.countRadicals();
		}

		return num;
	}

	/******************************************
	 * This function returns the number
	 * of terms in the tree. This function
	 * assumes that this tree is a polynomial
	 ******************************************/
	Node.prototype.countTerms = function()
	{
		var terms = 0;
		var child;
		var myChildren = this.getChildren();

		while (myChildren.length > 0)
		{
			child = myChildren.pop();
			if (child !== null)
				terms += child.countTerms();
		}

		if (terms === 0 && this === this.rootNode.rootNode)
			terms = 1;

		return terms;
	}

	/**********************************************
	* This function determines whether the "node"
	* exists anywhere in the tree rooted at "this".
	***********************************************/
	Node.prototype.existInTree = function(node)
	{
		if (this === node)
			return true;

		if (this.leftNode !== null && this.leftNode.existInTree(node))
			return true;

		if (this.rightNode !== null && this.rightNode.existInTree(node))
			return true;

		return false;
	}


	/**************************************************
	 * This function finds all instances of the given
	 * class and puts a reference to each one into
	 * the given array.
	 **************************************************/
	Node.prototype.findAllInstancesOfClass = function(desiredClass, nodes)
	{
		if (this.checkType(desiredClass))
			nodes.push(this);

		this.withAllChildren("findAllInstancesOfClass", desiredClass, nodes);
	}

	/*******************************************
	 * This function finds all variables that
	 * are found in the tree. The index of each
	 * item is the variable and the item is the
	 * number of times that varibles occurs in
	 * the tree. x^2 only counts as once. So in
	 * 3x*x^4*x^2 would say that the x appears
	 * 3 times. The function is called by
	 * getAllVariables in Root.
	 *******************************************/
	Node.prototype.findAllVariables = function(list)
	{
		this.withAllChildren("findAllVariables", list);
	}

	//=======================================================
	//=======================================================
	Node.prototype.areAllVariablesMultiplied = function()
	{
		return this.checkAllChildren("areAllVariablesMultiplied");
	}

	//=======================================================
	//=======================================================
	Node.prototype.findLikeTerms = function(terms, isNegative)
	{
		this.withAllChildren("findLikeTerms", terms, isNegative);
	}

	//=======================================================
	//=======================================================
	Node.prototype.findNodesWithId = function(id, ops)
	{
		this.withAllChildren("findNodesWithId", id, ops);

		if (this instanceof tree.TemporaryNode && this.id === id)
			ops.push(this);

		return ops;
	}

	/****************************************************
	 * This function returns a pointer to an
	 * instance of the desired variable, null otherwise
	 ***************************************************/
	Node.prototype.findVariable = function(varMatch)
	{
		var varFound;
		var myChildren = this.getChildren();

		while (myChildren.length > 0)
		{
			varFound = myChildren.pop().findVariable(varMatch);
			if (varFound instanceof tree.Variable)
				return varFound;
		}

		return null;
	}

	/**************************************************
	 * This function returns an array of all the
	 * children in "this" node. When the children are
	 * are "popped" off they come off right, then left.
	 * If a child is null, then a null is placed in
	 * the array.
	 * NF: added null node check before adding it.
	 **************************************************/
	Node.prototype.getChildren = function()
	{
		var children = [];
		if (this.leftNode)
            children.push(this.leftNode);
		if (this.rightNode)
    		children.push(this.rightNode);
		return children;
	}

	//=======================================================
	//=======================================================
	Node.prototype.getCoefficient = function(newPrecedence)
	{
		if (this.precedence > newPrecedence)
			return new tree.Fraction(1);
	}

	/**************************************************
	 * This function returns the degree of the tree.
	 * The degree is defined as the degree of the term
	 * with the highest degree.
	 **************************************************/
	Node.prototype.getDegree = function()
	{
		var degree = 0;
		var myChildren = this.getChildren();
		var child;
		while (myChildren.length > 0)
		{
			child = myChildren.pop();
			if (child !== null)
				degree = Math.max(degree, child.getDegree());
		}
		return degree;
	}

	//=======================================================
	//=======================================================
	Node.prototype.getFactors = function(terms, isNumerator)
	{
		if (terms.order === undefined)
			terms.order = [];

		var term = this.getTreeAsString();
		if (term === "-")
			term = "-1";

		var exponent;
		if (isNumerator)
			exponent = new tree.Fraction(1);
		else
			exponent = new tree.Fraction(-1);

		if (terms.hasOwnProperty(term))
		{
			var oldExponent = terms[term];
			terms[term] = tree.Fraction.plus(oldExponent, exponent);
		}
		else
		{
//r			terms.addProperty(term);
			terms[term] = exponent;
			terms.order.push(term);
		}
	}

	/********************************************
	 * This function returns the leftmost leaf
	 * from this node. A leaf is a node with
	 * no children.
	 *******************************************/
	Node.prototype.getLeftLeaf = function()
	{
		var tempNode = this;
		while (!tempNode.isLeaf() && tempNode !== null && tempNode !== undefined)
			tempNode = tempNode.leftNode;
		return tempNode;
	}

	//=======================================================
	//=======================================================
	Node.prototype.getPolyCoefficient = function()
	{
		var leftDegree = this.leftNode.getDegree();
		var rightDegree = this.rightNode.getDegree();

		if (leftDegree > rightDegree){
			return this.leftNode.getPolyCoefficient();
		}
		else{
			return this.rightNode.getPolyCoefficient();
		}
	}

	//=======================================================
	//=======================================================
	Node.prototype.getRightLeaf = function()
	{
		var tempNode = this;
		while (!tempNode.isLeaf() && tempNode !== null && tempNode !== undefined)
			tempNode = tempNode.rightNode;
		return tempNode;
	}

	//=======================================================
	//=======================================================
	Node.prototype.getTreeAsArray = function(nodes)
	{
		var children = this.getChildren();

		// Left children
		var child = children.shift();
		if (child) // !== null)
			child.getTreeAsArray(nodes);

		// Self
		nodes.push(this);

		// Right children
		child = children.shift();
		if (child) // !== null)
			child.getTreeAsArray(nodes);
	}

	//=======================================================
	//=======================================================
	Node.prototype.getTreeAsString = function(isDecimal)
	{
		var tempString = "";

		if (this.leftNode !== null)
			tempString += this.leftNode.getTreeAsString(isDecimal) + " ";

		tempString += this.getNodeAsString(isDecimal);

		if (this.rightNode !== null)
			tempString += " " + this.rightNode.getTreeAsString(isDecimal);

		return tempString;
	}

	//=======================================================
	//=======================================================
	Node.prototype.hasChildren = function()
	{
		return (this.leftNode !== null || this.rightNode !== null)
	}

	/*****************************************
	 * This function determines if this node
	 * has been deleted. Returns true if it
	 * has, false otherwise.
	 *****************************************/
	Node.prototype.hasBeenDeleted = function()
	{
		var children = this.getChildren();
		while (children.length > 0)
		{
			if (children.pop().parentNode === this)
				return false;
		}

		var parentsChildren = this.parentNode.getChildren();
		while (parentsChildren.length > 0)
		{
			if (parentsChildren.pop() === this)
				return false;
		}

		return true;
	}

	/*****************************************
	 * This function returns true if the
	 * given node is one of the direct
	 * children of this node, false otherwise.
	 *****************************************/
	Node.prototype.isChild = function(node)
	{
		var children = this.getChildren();
		while (children.length > 0)
		{
			if (children.pop() === node)
				return true;
		}

		return false;
	}

	//=======================================================
	//=======================================================
	Node.prototype.isFull = function()
	{
        //console.log("left = " + this.leftNode + "; right = " + this.rightNode);
		if (this.leftNode !== null && this.rightNode !== null)
			return true;
		else
			return false;
	}

	//=======================================================
	//=======================================================
	Node.prototype.isLeaf = function()
	{
		if (this.leftNode === null && this.rightNode === null)
			return true;
		else
			return false;
	}

	//=======================================================
	//=======================================================
	Node.prototype.isLinear = function()
	{
		return false;
	}

	//=======================================================
	//=======================================================
	Node.prototype.isNumber = function()
	{
		if (this instanceof tree.Numerical || this instanceof tree.MixedNumber)
			return true;
		else
			return false;
	}

	/**********************************************
	 * This function returns true if the tree
	 * represents a polynomial, false otherwise.
	 **********************************************/
	Node.prototype.isPolynomial = function()
	{
		return false;
	}


	/***************************************
	 * This function returns true if the
	 * tree represents a possible exponent
	 * in a polynomial expression. This means
	 * that the operators are only +-/* and
	 * the rest are numericals.
	 ****************************************/
	Node.prototype.isPolynomialExponent = function()
	{
		return false;
	}

	//=======================================================
	//=======================================================
	Node.prototype.isRadical = function()
	{
		return this.checkAllChildren("isRadical");
	}

	//=======================================================
	//=======================================================
	Node.prototype.isRational = function()
	{
		return false;
	}

	/************************************************
	* This function returns true if the tree is a
	* polynomial and is ordered, false otherwise.
	* This function assumes that this tree represents
	* a polynomial in the standard form.
	*************************************************/
	Node.prototype.isOrderedPolynomial = function()
	{
		if (this.rootNode.rootNode === this)
			return true;
		return false;
	}

	/***************************************************
	 * This function returns true if the tree with this
	 * node as its root needs a parenthesis around it
	 * when being multiplied by something.
	 ***************************************************/
	Node.prototype.needsParen = function()
	{
		switch (className){
			case "Addition":
			case "BooleanOperator":
			case "Subtraction":
				return true;
			default:
				return false;
		}
	}

	/******************************************************
	* This function checks if the tree is a valid equation,
	* given the value for the variable. If the tree does not
	* represent an equation it returns false.
	********************************************************/
	Node.prototype.validateTree = function(variableValue)
	{
			return false;
	}

/*************************************************************/
/* 			FUNCTIONS THAT MODIFY THE GIVEN TREE			 */
/*************************************************************/

	//=======================================================
	//=======================================================
	Node.prototype.addNegative = function()
	{
		return this.checkAnyChildren("addNegative");
	}

	/********************************************
	 * This function checks for and removes any
	 * unnecessary ones. For example, 1*x or
	 * x/1. It returns true if any 1's were
	 * removed, false otherwise.
	 ********************************************/
	Node.prototype.checkForOnes = function()
	{
		return this.checkAnyChildren("checkForOnes");
	}

	//=======================================================
	//=======================================================
	Node.prototype.checkForNegativeExponents = function()
	{
		return this.checkAnyChildren("checkForNegativeExponents");
	}

	//=======================================================
	//=======================================================
	Node.prototype.checkForZeroExponents = function(onlyVars)
	{
		return this.checkAnyChildren(checkForZeroExponents);
	}

	//=======================================================
	//=======================================================
	Node.prototype.combineNumbersWithExponents = function()
	{
		this.withAllChildren("combineNumbersWithExponents");
	}

	//=======================================================
	//=======================================================
	Node.prototype.removeNegativeDenominators = function()
	{
		return this.checkAnyChildren("removeNegativeDenominators");
	}

	/***************************************************
	 * This function combines and powers within a given
	 * monomial. For example, 3x^2x^3 becomes 3x^5. It
	 * returns true if any powers were combined, false
	 * otherwise.
	 ***************************************************/
	Node.prototype.combinePowers = function()
	{
		return this.checkAnyChildren("combinePowers");
	}

	/******************************************************
	 * This function combines any single variables factors
	 * (x, but not (x+1)). NOT IMPLEMENTED
	 ******************************************************/
	Node.prototype.combineSingleVariables = function()
	{
		return this.checkAnyChildren("combineSingleVariables");
	}

	//=======================================================
	//=======================================================
	Node.prototype.combineSquareRoots = function(isNumerator)
	{
		return {changed: this.checkAnyChildren("combineSquareRoots", isNumerator)};
	}

	//=======================================================
	//=======================================================
	Node.prototype.distribute = function()
	{
		return this.checkAnyChildren("distribute");
	}

	//=======================================================
	//=======================================================
	Node.prototype.doubleNegative = function()
	{
		return this.checkAnyChildren("doubleNegative");
	}

	//=======================================================
	//=======================================================
	Node.prototype.checkForPowersToTheOne = function()
	{
		return this.checkAnyChildren("checkForPowersToTheOne");
	}

	//=======================================================
	//=======================================================
	Node.prototype.makePowSquareRoot = function(b)
	{
		var myChildren = this.getChildren();
		while (myChildren.length > 0)
		{
			var child = myChildren.pop();
			if (child instanceof tree.Power)
				child.returnSqrt = b;

			child.makePowSquareRoot(b);
		}
	}

	//=======================================================
	//=======================================================
	Node.prototype.doublePlusMinus = function()
	{
		return this.checkAnyChildren("doublePlusMinus");
	}

	/*****************************************
	 * This function reduces all fractions in
	 * the tree. The function returns true if
	 * there were any fractions reduced, false
	 * otherwise.
	 *****************************************/
	Node.prototype.reduceFractions = function(toInt)
	{
		return this.checkAnyChildren("reduceFractions", toInt);
	}

	//=======================================================
	//This function converts numerical exponents (numerical base and numerical exponent)
	//i.e pow(2,3) to numbers i.e 8
	//=======================================================
	Node.prototype.simplifyNumericalExponents = function()
	{
		return this.checkAnyChildren("simplifyNumericalExponents");
	}

	//=======================================================
	//=======================================================
	Node.prototype.removeNulls = function()
	{
		return this.checkAnyChildren("removeNulls");
	}

	//=======================================================
	//=======================================================
	Node.prototype.removeParen = function()
	{
		return this.checkAnyChildren("removeParen");
	}

	//=======================================================
	//=======================================================
	Node.prototype.combineFractionCoeffwithVariable = function()
	{
		return this.checkAnyChildren("combineFractionCoeffwithVariable");
	}

	//=======================================================
	//=======================================================
	Node.prototype.removeZeros = function()
	{
		return this.checkAnyChildren("removeZeros");
	}

	//=======================================================
	//=======================================================
	Node.prototype.setAction = function(action, doChildren)
	{
		this.lastAction = action;
		if (doChildren)
			this.withAllChildren("setAction", action, doChildren);
	}

	//=======================================================
	//=======================================================
	Node.prototype.setRoot = function(root)
	{
		this.rootNode = root;
		this.withAllChildren("setRoot", root);
	}

	//=======================================================
	//=======================================================
	Node.prototype.simplify = function(parentPrecedence, reduceFracs, rules)
	{
		return this.checkAnyChildren("simplify", this.precedence, reduceFracs, rules);
	}

	/*******************************************************
	 * This function subsitutes the given *numerical* value
	 * for the given variable in the entire tree.
	 ******************************************************/
	Node.prototype.subForVariable = function(variable, value)
	{
		this.withAllChildren("subForVariable", variable, value);
	}

	//=======================================================
	//=======================================================
	Node.prototype.undoFractions = function()
	{
		return this.checkAnyChildren("undoFractions");
	}

	//=======================================================
	//=======================================================
	Node.prototype.undoVerticalDivision = function()
	{
		return this.checkAnyChildren("undoVerticalDivision");
	}

	//=======================================================
	//=======================================================
	Node.prototype.undoSimpleVerticalDivision = function()
	{
		return this.checkAnyChildren("undoSimpleVerticalDivision");
	}

	/*************************************************************/
	/* 			FUNCTIONS THAT MODIFY THIS NODE					 */
	/*************************************************************/

	/***************************************************
	* This function finds the location of "matchingNode"
	* in the children of this node, and inserts the
	* "newNode" in its place.
	****************************************************/
	Node.prototype.assignNodeNewChild = function(matchingNode, newNode)
	{
		if (this.leftNode === matchingNode)
			this.leftNode = newNode;
		else if (this.rightNode === matchingNode)
			this.rightNode = newNode;
	}

	/**********************************************************
	* This function deletes "this" node. It takes one parameter
	* which determines whether you should delete the children of
	* this node. If the children of this node deleted, then
	* all the children of its children will also be deleted.
	***********************************************************/
	Node.prototype.deleteNode = function(deleteChildren)
	{
		if (deleteChildren)
		{
			if (this.leftNode !== null)
				this.leftNode.deleteNode(deleteChildren);
			if (this.rightNode !== null)
				this.rightNode.deleteNode(deleteChildren);
		}
		this.parentNode.assignNodeNewChild(this, null)
		delete this;
	}

	//=======================================================
	//=======================================================
	Node.prototype.insertBalancedNode = function(node)
	{
		if (this.rightNode === null){
			this.rightNode = node;
			node.parentNode = this;
		}
		else{
			this.leftNode = node;
			node.parentNode = this;
		}
	}

	/****************************************************************/
	/*		FUNCTIONS THAT EXISTS SOLEY FOR EXTENDED CLASSES		*/
	/****************************************************************/

	//=======================================================
	//=======================================================
	Node.prototype.canRemoveZero = function()
	{
		return false;
	}

	//=======================================================
	//=======================================================
	Node.prototype.canSimplifyNode = function()
	{
		return false;
	}

	//=======================================================
	//=======================================================
	Node.prototype.distributeNode = function(node, distributeRight)
	{
		return false;
	}

	//=======================================================
	//=======================================================
	Node.prototype.duplicateTree = function(root)
	{
		return null;
	}

	//=======================================================
	//=======================================================
	Node.prototype.evaluateNode = function(variableValue)
	{
		//trace("Node.evaluateNode should never get called");
		return null;
	}

	//=======================================================
	//=======================================================
	Node.prototype.evaluateNodeWithVariables = function(variables)
	{
		//trace("Node.evaluateNodeWithVariables should never get called");
		return null;
	}


	//=======================================================
	//=======================================================
	Node.prototype.getApproximateValueOfTree = function(variables)
	{
		//trace("Node.getApproximateValueOfTree should never get called");
		return null;
	}

	//=======================================================
	//=======================================================
	Node.prototype.getPolyTerms = function(polyList)
	{
		//trace("getTerms should never get called by " + className);
        return;
	}

	//=======================================================
    // default methods for the classed don't support these:
	//=======================================================
	Node.prototype.orderPolynomial = function()
	{
		//trace("orderPolynomial should never get called by " + className);
		return false;
	}

	//=======================================================
	Node.prototype.checkForOnes = function()
	{
        return this.checkAnyChildren("checkForOnes");
	}

	//=======================================================
	Node.prototype.checkForZeros = function()
	{
        return this.checkAnyChildren("checkForZeros");
	}

	//=======================================================
	// check if there is any perfect square inside square root
	//
	// Returns true: success - no perfect square inside
	//=======================================================
	Node.prototype.checkPerfectPower = function()
	{
        return this.checkAnyChildren("checkPerfectPower");
	}

	//=======================================================
	//=======================================================
	Node.prototype.getNodeAsString = function()
	{
		return "";
	}

	//=======================================================
	//=======================================================
	Node.prototype.getNumerical = function()
	{
		return null;
	}

	//=======================================================
	//=======================================================
	Node.prototype.removeNumerical = function()
	{
	}

	/****************************************************************/
	/*						STATIC FUNCTIONS	 					*/
	/****************************************************************/


	/*************************************************************
	 * This function inserts the "insertNode" to the left of
	 * the "curentNode". "insertNode" cannot have any children
	 * because the left subtree of the "currentNode" becomes the
	 * left subtree of the "insertNode"
	 *************************************************************/
	Node.insertLeft = function(insertNode, currentNode)
	{
		insertNode.leftNode = currentNode.leftNode;
		if (insertNode.leftNode !== null)
			insertNode.leftNode.parentNode = insertNode;
		currentNode.leftNode = insertNode;
		insertNode.parentNode = currentNode;
	}

	/*************************************************************
	 * This function inserts the "insertNode" to the right of
	 * the "curentNode". "insertNode" cannot have any children
	 * because the right subtree of the "currentNode" becomes the
	 * right subtree of the "insertNode"
	 *************************************************************/
	Node.insertRight = function(insertNode, currentNode)
	{
		insertNode.rightNode = currentNode.rightNode;
		if (insertNode.rightNode !== null)
			insertNode.rightNode.parentNode = insertNode;
		currentNode.rightNode = insertNode;
		insertNode.parentNode = currentNode;
	}

	/***********************************************************
	 * This function removes the given "node" from the tree.
	 * It does not remove any of its children. It returns the
	 * root of the tree.
	 ***********************************************************/
	Node.removeNode = function(node, rootNode)
	{
		var tempNode = node.leftNode;

		if (node.leftNode !== null){  //this node has at least a left child
			node.leftNode.parentNode = node.parentNode;

			while (tempNode.rightNode !== null)
				tempNode = tempNode.rightNode;
			tempNode.rightNode = node.rightNode;

			if (node.parentNode === null)  //this node was the root
				rootNode = node.leftNode;
			else{  //this node was not the root
				node.parentNode.assignNodeNewChild(node, node.leftNode);
			}
		}
		else if (node.rightNode !== null){  //this node only has a right child
			node.rightNode.parentNode = node.parentNode;

			if (node.parentNode === null) //this node was the root
				rootNode = node.rightNode;
			else{  //this node was not the root
				node.parentNode.assignNodeNewChild(node, node.rightNode);
			}
		}
		else{  //this node has no children
			if (node.parentNode === null) //this node was the root
				rootNode = null;
			else{ //this node was not the root
				node.parentNode.assignNodeNewChild(node, null);
			}
		}
		node.rightNode = null;
		node.leftNode = null;
		node.parentNode = null;
		return rootNode;
	}

	/*************************************************************/
	/*						PRIVATE FUNCTIONS					 */
	/*************************************************************/

	/*************************************************************
	 * This function takes the given object and creates a tree
	 * from it. Each property in the object is either a constant
	 * or a variable and the power to which it is raised.
	 *  NF: this was a private function. It is called from multiplication.combinePowers,
	 *  therefore need to be visible from outside.
	 *************************************************************/
	Node.prototype.buildVariableFactorTree = function (terms)
	{
		var tempRootNode = null;
		if (terms.constant !== undefined){
			if (!terms.constant.equalsTo(1)){
				tempRootNode = new tree.Numerical(terms.constant.numerator, terms.constant.denominator);
			}
		}
		for (var prop in terms){
			if (prop !== "changed" && prop !== "combinable" && prop !== "constant"){
				var newTerm;
				if (terms[prop].equalsTo(1))
					newTerm = new tree.Variable(prop);
				else
				{
					newTerm = new tree.Power();
					newTerm.leftNode = new tree.Variable(prop);
					newTerm.leftNode.parentNode = newTerm;
					newTerm.rightNode = new tree.Numerical(terms[prop].numerator, terms[prop].denominator);
					newTerm.rightNode.parentNode = newTerm;
				}
				if (tempRootNode === null)
					tempRootNode = newTerm;
				else
				{
					var newMult = new tree.Multiplication();
					newMult.leftNode = tempRootNode;
					tempRootNode.parentNode = newMult;
					newMult.rightNode = newTerm;
					newTerm.parentNode = newMult;
					tempRootNode = newMult;
				}
			}
		}
		return tempRootNode;
	}

	//=======================================================
	//=======================================================
	Node.prototype.checkType = function(desiredClass)
	{
		switch (desiredClass)
		{
			case "AbsoluteValue":
				return (this instanceof tree.AbsoluteValue);
			case "Addition":
				return (this instanceof tree.Addition);
			case "BooleanOperator":
				return (this instanceof tree.BooleanOperator);
			case "NoSolutions":
				return (this instanceof tree.NoSolutions);
			case "InfiniteSolutions":
				return (this instanceof tree.InfiniteSolutions);
			case "Comma":
				return (this instanceof tree.Comma);
			case "Division":
				return (this instanceof tree.Division);
			case "Equality":
				return (this instanceof tree.Equality);
			case "FunctionWithParen":
				return (this instanceof tree.FunctionWithParen);
			case "TrigFunction":
				return (this instanceof tree.TrigFunction);
			case "HorizontalOperator":
				return (this instanceof tree.HorizontalOperator);
			case "ImpliedMultiplication":
				return (this instanceof tree.ImpliedMultiplication);
			case "Inequality":
				return (this instanceof tree.Inequality);
			case "Logarithm":
				return (this instanceof tree.Logarithm);
			case "MixedNumber":
				return (this instanceof tree.MixedNumber);
			case "Multiplication":
				return (this instanceof tree.Multiplication);
			case "NaturalLog":
				return (this instanceof tree.NaturalLog);
			case "Node":
				return (this instanceof Node);
			case "NRoot":
				return (this instanceof tree.NRoot);
			case "Numerical":
				return (this instanceof tree.Numerical);
			case "Operator":
				return (this instanceof tree.Operator);
			case "Parenthesis":
				return (this instanceof tree.Parenthesis);
			case "Power":
				return (this instanceof tree.Power);
			case "Sigma":
				return (this instanceof tree.Sigma);
			case "Sine":
				return (this instanceof tree.Sine);
			case "Cosine":
				return (this instanceof tree.Cosine);
			case "Tangent":
				return (this instanceof tree.Tangent);
			case "Cotangent":
				return (this instanceof tree.Cotangent);
			case "Secant":
				return (this instanceof tree.Secant);
			case "Cosecant":
				return (this instanceof tree.Cosecant);
			case "SquareRoot":
				return (this instanceof tree.SquareRoot);
			case "Subscript":
				return (this instanceof tree.Subscript);
			case "Subtraction":
				return (this instanceof tree.Subtraction);
			case "UnknownEquality":
				return (this instanceof tree.UnknownEquality);
			case "Variable":
				return (this instanceof tree.Variable);
			case "VerticalDivision":
				return (this instanceof tree.VerticalDivision);
			default:
				return false;
		}
	}

	//=======================================================
	//=======================================================
	Node.prototype.getTerm = function(newPrecedence)
	{
		if (this.precedence <= newPrecedence)
		{
			var term = "";
			if (!(this.leftNode instanceof tree.Numerical))
			{
				term = this.leftNode.getTerm(newPrecedence);
				if (!(this.rightNode instanceof tree.Numerical))
					term += this.getNodeAsString();
			}

			if(this.rightNode && // NF: added due to a test instance of null
                !(this.rightNode instanceof tree.Numerical))
				term += this.rightNode.getTerm(newPrecedence);

			return term;
		}
		else
			return this.getTreeAsString();
	}

	/******************************************************
	 * This function gets all of the variable factors in
	 * a term. It is called by combinePowers and uses
	 * buildVariableFactorTree to create the tree after.
	 *
	 * DG: This was marked as private, but isn't used internally!
	 ******************************************************/
	Node.prototype.getVariableFactors = function(terms, isDenominator)
	{
		this.withAllChildren("getVariableFactors", terms, isDenominator);
	}

	//=======================================================
	//=======================================================
	function replaceNumerical(val)
	{
	}

	//=======================================================
	// Ensure that all of this node's children satisfy a condition
	//=======================================================
	Node.prototype.checkAllChildren = function(testFunc)
	{
		var child;
		var allTrue = true;
		var myChildren = this.getChildren();

		while (myChildren.length > 0)
		{
			child = myChildren.pop();

			if (child && child[testFunc])
				allTrue = child[testFunc].apply(child, Array.prototype.slice.call(arguments, 1)) && allTrue;
		}

		return allTrue;
	}

	//=======================================================
	// Check if any of this node's children satisfy a condition
	//
	// This is most commonly used to perform an operation on all
	// child nodes of a tree, and return whether any operations
	// were successful.
    //
    // usage WARNING: the default is False if the function is not defined for any children.
    //       therefore your function should return false as successful, true as failure.
    //       otherwise morjority without such function defined will be failed.
	//=======================================================
	Node.prototype.checkAnyChildren = function(testFunc)
	{
		var child;
		var anyTrue = false;
		var myChildren = this.getChildren();
        var ret;

		while (myChildren.length > 0
               && !anyTrue) // stop looking if we find one
		{
			child = myChildren.pop();

			if (child && child[testFunc])
				//anyTrue = child[testFunc].apply(child, Array.prototype.slice.call(arguments, 1)) || anyTrue;
            {
				ret = child[testFunc].apply(child, Array.prototype.slice.call(arguments, 1));
                if (testFunc == "simplify")
                    anyTrue |= ret.changed;
                else
                    anyTrue |= ret;
            }   
		}

        if (testFunc == "simplify")
        {
            if (typeof ret === 'undefined')
                return {changed: false};
            else
                return ret;
        }
        else
    		return anyTrue;
	}

	//=======================================================
	//=======================================================
	Node.prototype.withAllChildren = function(func)
	{
		var child;
		var myChildren = this.getChildren();

		while (myChildren.length > 0)
		{
			child = myChildren.pop();

			if (child && child[func])
				child[func].apply(child, Array.prototype.slice.call(arguments, 1));
		}
	}

	//=======================================================
	// Create a default implementation. This is getting called
	// on non-Numericals
	//=======================================================
	Node.prototype.isNegativeOne = function()
	{
		return false;
	}

	//=======================================================
	//=======================================================
	Node.prototype.equalsMagOne = function()
	{
		return (this instanceof tree.Numerical
                && this.equalsMagnitudeOne())
	}

module.exports = Node;

},{"./tree":47}],31:[function(require,module,exports){
//==========================================================================
// Tree node type: Numbers
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
var tree = require('./tree');	// General math tools

// This class represents any numerical value.
// - class extends Node

	//=======================================================
	// Constructor
	//=======================================================
	Numerical = function(numer, denom)
	{
		tree.Node.call(this);	// Call the parent constructor (was super())

		this.className = "Numerical";
		this.precedence = 0;
		this.precision = 5;
		this.showNumber = true;
        this.isDecimal = false;
        this.implied = false; // for checkForOne(

		numer = (numer !== undefined && !isNaN(numer)) ? parseFloat(numer.toString()) : 0;
		denom = (denom !== undefined && !isNaN(denom)) ? parseFloat(denom.toString()) : 1;

		// If the numerator is a decimal, convert it to a fraction
		if (numer % 1 !== 0)
		{
            this.isDecimal = true;
			denom = 1;

			// Keep trying
			while (numer % 1 !== 0)
			{
				numer *= 10;
				denom *= 10;
				numer = parseFloat(numer.toString());
				denom = parseFloat(denom.toString());
			}
		}

		this.number = new tree.Fraction(numer, denom);
	}

	//=======================================================
	// Inheritance
	//=======================================================
	Numerical.prototype = new tree.Node();
	Numerical.prototype.constructor = Numerical;


/*************************************************************/
/*   	FUNCTIONS THAT ARE SPECIFIC TO THIS CLASS			 */
/*************************************************************/

	//=======================================================
	//=======================================================
	Numerical.prototype.isIdentical = function(value)
	{
        if (this.isDecimal)
            return this.isEquivalant(value);
            
		return (this.number.numerator === value.numerator
                && this.number.denominator === value.denominator);
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.isIdentical = function(value)
	{
        if (this.isDecimal)
            return this.isEquivalant(value);
            
		return (this.number.numerator === value.numerator
                && this.number.denominator === value.denominator);
//		return (this.number.numerator* value.denominator
//                === value.numerator * this.number.denominator);
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.isEquivalant = function(value)
	{
		return (this.number.numerator* value.denominator
                === value.numerator * this.number.denominator);
	}
	
    //=======================================================
	//=======================================================
	Numerical.prototype.removeNegativeDenominators = function()
	{
		return tree.Fraction.fixNegative(this.number);
	}

	/*********************************************************
	 * This function checks to see if two numbers are
	 * *equivalent* to each other. This does NOT check to see
	 * if both are *identical* (ie - one could be a reduced
	 * version of the other
	 *********************************************************/
	Numerical.prototype.checkEquality = function(value)
	{

		if (parseFloat((value.numerator * this.number.denominator).toString()) ===
				parseFloat((value.denominator * this.number.numerator).toString()))
			return true;
		else
			return false;
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.checkForOnes = function()
    {
        var parent = this.parentNode;
        if (parent && !this.implied)
        {
            if ((parent instanceof tree.Multiplication)
                || (parent instanceof tree.Division && parent.rightNode === this))
            return this.equalsMagnitudeOne();
        }
        return false;
    }

	//=======================================================
	//=======================================================
	Numerical.prototype.equalsOne = function()
	{
		return (this.number.numerator === this.number.denominator)
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.equalsNegativeOne = function()
	{
		return (this.number.numerator === -this.number.denominator)
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.lessThanOne = function()
	{
		return (this.number.numerator < this.number.denominator)
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.lessThanMagnitudeOne = function()
	{
		return (Math.abs(this.number.numerator) <
                Math.abs(this.number.denominator))
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.equalsMagnitudeOne = function()
	{
		return Math.abs(this.number.numerator) === Math.abs(this.number.denominator)
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.equalsZero = function()
	{
		return (this.number.numerator === 0 && this.number.denominator !== 0)
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.equalsOneHalf = function()
	{
		return (this.number.numerator / this.number.denominator == 0.5)
	}

	//=======================================================
	//=======================================================
	//=======================================================
	//=======================================================
	Numerical.prototype.isLinear = function()
	{
		return true;
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.isNegative = function()
	{
		if (this.number.numerator < 0 && this.number.denominator > 0)
			return true;
		else if (this.number.denominator < 0 && this.number.numerator > 0)
			return true;
		else
			return false;
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.setPrecision = function(newPrecision)
	{
		this.precision = newPrecision;
	}

/*************************************************************/
/*   	FUNCTIONS THAT RETURN INFO ABOUT THE GIVEN TREE		 */
/*************************************************************/

	//=======================================================
	//=======================================================
	Numerical.prototype.countFactors = function()
	{
		if (this.equalsOne())
			return 0;
		else
			return 1;
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.duplicateNode = function(root)
	{
		var tempNode = new tree[this.className](this.number.numerator, this.number.denominator);
		tempNode.setRoot(root);
		tempNode.lastAction = this.lastAction;
        tempNode.isDecimal = this.isDecimal;
        tempNode.implied = this.implied;
		return tempNode;
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.duplicateTree = function(root)
	{
		var tempNode = this.duplicateNode(root);

		if (this.leftNode !== null)
		{
			tempNode.leftNode = this.leftNode.duplicateTree(root);
			tempNode.leftNode.parentNode = tempNode;
		}
		else
			tempNode.leftNode = null;

		if (this.rightNode !== null)
		{
			tempNode.rightNode = this.rightNode.duplicateTree(root);
			tempNode.rightNode.parentNode = tempNode;
		}
		else
			tempNode.rightNode = null;

		return tempNode;
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.evaluateNode = function(variableValue)
	{
		return this.number;
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.evaluateNodeWithVariables = function(variables)
	{
		return this.evaluateNode();
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.getApproximateValueOfTree = function(variables)
	{
		var val = this.evaluateNode();
		return val.numerator / val.denominator;
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.findLikeTerms = function(terms, isNegative)
	{
		var term = "constant";
		var coefficient = new tree.Fraction(this.number.numerator, this.number.denominator);

		//check if numerical is degree of root, if its is, ignore
		if (this.parentNode instanceof tree.NRoot && this.parentNode.rightNode === this)
			return;

		if (isNegative)
			coefficient = tree.Fraction.multiply(coefficient, new tree.Fraction(-1));

		if (terms.hasOwnProperty(term))
		{
			var oldCoefficient = terms[term];
			terms[term] = tree.Fraction.plus(oldCoefficient, coefficient);
			terms.changed = true;
		}
		else
		{
//r			terms.addProperty(term);
			terms[term] = coefficient;
		}
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.getCoefficient = function(newPrecedence)
	{
		return this.number;
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.getDegree = function()
	{
		return 0;
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.getFactors = function(terms, isNumerator)
	{
		if (terms.order === undefined)
			terms.order = [];
		if (this.equalsOne())
			return;
		else
			return tree.Node.prototype.getFactors.call(this, terms, isNumerator);
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.getNumerical = function()
	{
		return this.number;
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.getPolyCoefficient = function()
	{
		return this.number;
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.getVariableFactors = function(terms, isDenominator)
	{
		var term = "constant";
		var value;

		if (isDenominator)
			value = this.number.getReciprocal();
		else
			value = this.number.duplicate();

		if (terms.hasOwnProperty(term))
		{
			var oldValue = terms[term];
			terms[term] = tree.Fraction.multiply(oldValue, value);
			terms.changed = true;
		}
		else
		{
//r			terms.addProperty(term);
			terms[term] = value;
		}
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.isFull = function()
	{
		return true;
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.isInteger = function()
	{
		return this.number.isInteger();
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.isPerfectSquare = function()
	{
		return this.number.isPerfectSquare();
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.isPartialPerfectPower = function(exponent)
	{
		return this.number.isPartialPerfectPower(exponent);
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.isPolynomial = function()
	{
		return true;
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.isPolynomialExponent = function()
	{
		return true;
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.isRational = function()
	{
		return true;
	}

/*************************************************************/
/*  	 	FUNCTIONS THAT MODIFY THE GIVEN TREE			 */
/*************************************************************/

	//=======================================================
	//=======================================================
	Numerical.prototype.distributeNegative = function(newPrecedence)
	{
		updateValue(tree.Fraction.multiply(this.number, new tree.Fraction(-1)));
		return true;
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.reduceFractions = function(toInt)
	{
        if (this.isDecimal)
            return false;
        
		var reduced = tree.Node.prototype.reduceFractions.call(this, toInt);
		if (toInt)
			reduced = this.number.reduceToInteger() || reduced;
		else reduced = this.number.reduce() || reduced;
		return reduced;
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.removeZeros = function()
	{
		//trace("removing zeros in numerical");
		var remove=false;
		if (this.number.numerator === 0)
			remove=true;
		else if (Math.abs(this.number.numerator) === 1)
		{
			//check if we have a 0.000000 fraction
			if (Math.abs(this.number.denominator) > 1000000)
				remove = true;
		}
		if (remove && this.parentNode.canRemoveZero())
		{
			this.parentNode.assignNodeNewChild(this, null);
			return true;
		}
		else
			return false;
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.simplify = function(parentPrecendence, reduceFracs)
	{
		var simplifyObject = new Object({changed:false, isOpposite:false}); //, Numerical:this});
        
        // avoid adding numerical value into variable such as -x,
        // therefore only value is not one in multiplication will add Numerical class:
        if (!(this.equalsMagnitudeOne() && this.parentNode instanceof tree.Multiplication)) 
            simplifyObject.Numerical = this;
            
		return simplifyObject;
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.undoFractions = function()
	{
		if (this.number.isInteger())
			return false;

		var tempNode = parentNode;
		while (tempNode.parentNode !== null && !(tempNode.parentNode instanceof tree.Division))
			tempNode = tempNode.parentNode;

		if (tempNode.parentNode instanceof tree.Division)
		{
			var newMult = new tree.Multiplication();
			var newNum = new Numerical(this.number.denominator);

			newMult.leftNode = newNum;
			newNum.parentNode = newMult;

			if (tempNode.parentNode.leftNode === tempNode)
			{
				//Its on the left, so move denominator to the right
				if (tempNode.parentNode.rightNode instanceof tree.Parenthesis)
				{
					newMult.rightNode = Parenthesis(tempNode.parentNode.rightNode).middleNode;
					newMult.rightNode.parentNode = newMult;
					newMult.parentNode = tempNode.parentNode;
					tempNode.parentNode.rightNode = newMult;
				}
				else
				{
					var paren = new tree.Parenthesis();
					paren.middleNode = newMult;
					newMult.parentNode = paren;
					newMult.rightNode = tempNode.parentNode.rightNode;
					newMult.rightNode.parentNode = newMult;
					paren.parentNode = tempNode.parentNode;
					tempNode.parentNode.rightNode = paren;
				}
			}
			else
			{
				//Its on the right, so move the denominator to the left
				newMult.rightNode = tempNode.parentNode.leftNode;
				newMult.rightNode.parentNode = newMult;
				newMult.leftNode = newNum;
				newNum.parentNode = newMult;
				newMult.parentNode = tempNode.parentNode;
				tempNode.parentNode.leftNode = newMult;
			}
			this.number.denominator = 1;
			newMult.setRoot(rootNode);
		}
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.updateValue = function(newNum)
	{
		this.number.numerator = newNum.numerator;
		this.number.denominator = newNum.denominator;
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.addValue = function(valTop, valBottom)
	{
		this.updateValue();
	}

/*************************************************************/
/*						PRIVATE FUNCTIONS					 */
/*************************************************************/

	//=======================================================
	//=======================================================
	Numerical.prototype.getNodeAsString = function(isDecimal)
	{
		if ((this.parentNode instanceof tree.Multiplication && this.parentNode.leftNode === this && this.isNegativeOne())
				|| (!this.showNumber && this.isNegativeOne()))
			return "-";

		if (isDecimal)
			return (this.number.numerator / this.number.denominator).toString();

		var myString = this.number.numerator.toString();
		if (this.number.denominator !== 1)
			myString += "/" + this.number.denominator.toString();

		return myString;
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.removeNumerical = function()
	{
		this.parentNode.assignNodeNewChild(this, null);
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.replaceNumerical = function(newNum)
	{
		this.updateValue(newNum);
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.isNegativeOne = function()
	{
		return (this.number.numerator === -1 && this.number.denominator === 1)
	}

	//=======================================================
	//=======================================================
	Numerical.prototype.findAllInstancesOfClass = function(desiredClass, nodes)
	{
		if (this.checkType(desiredClass))
        {        
            if (this.parentNode instanceof tree.Division)
            {
                // flip the numerator and denominator for equiv compare:
                var nodeDiv = new tree.Numerical(this.number.denominator, this.number.numerator); 
                nodes.push(nodeDiv);
            }
            else // make right node of subtraction tree negative:
                if (this.parentNode &&
                    (this.parentNode instanceof tree.Subtraction ||
                    (this.parentNode.parentNode instanceof tree.Subtraction
                    && this.parentNode === this.parentNode.parentNode.rightNode)))
                {
                    var nodeSub = new tree.Numerical(-(this.number.numerator), this.number.denominator);
                    nodes.push(nodeSub);
                }
                else
                {
                    var powerExponent = (this.parentNode && this.parentNode instanceof tree.Power
                                         && this.parentNode.rightNode == this);
                    if (!powerExponent)
                        nodes.push(this);
                }
        }
        
		this.withAllChildren("findAllInstancesOfClass", desiredClass, nodes);
	}
    
module.exports = Numerical;
},{"./tree":47}],32:[function(require,module,exports){
//==========================================================================
// Tree node type: Operators
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
var tree = require('./tree');	// General math tools

/*
This class represents any mathematical operator. It is subclassed by
a number of other classes.
*/
//class Operator extends Node{

	//=======================================================
	// Constructor
	//=======================================================
	Operator = function(type)
	{
		tree.Node.call(this);	// Call the parent constructor (was super())

		this.className = "Operator";
		this.precedence = 20;

		this.isBinary = false;
	}

	//=======================================================
	// Inheritance
	//=======================================================
	Operator.prototype = new tree.Node();
	Operator.prototype.constructor = Operator;

module.exports = Operator;

},{"./tree":47}],33:[function(require,module,exports){
//==========================================================================
// Tree node type: Parenthesis
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Calculator.MathTree.Parenthesis extends FunctionWithParen
var tree = require('./tree');	// General math tools

	//=======================================================
	// Constructor
	//=======================================================
	Parenthesis = function(type)
	{
		tree.FunctionWithParen.call(this);	// Call the parent constructor (was super())

		this.leftBrace = (type !== undefined ? type : "(");
		this.rightBrace = getOtherBrace(this.leftBrace);
		this.className = "Parenthesis";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	Parenthesis.prototype = new tree.FunctionWithParen();
	Parenthesis.prototype.constructor = Parenthesis;

	//=======================================================
	//=======================================================
	function getOtherBrace(brace)
	{
		var map = {
			"{": "}",
			"[": "]",
			"(": ")"
		};
		return map[brace];
	}

	//=======================================================
	//=======================================================
	Parenthesis.prototype.getTreeAsString = function(isDecimal)
	{
		var tempString = " " + this.leftBrace + " ";

		if (this.middleNode !== null)
			tempString += this.middleNode.getTreeAsString(isDecimal);

		tempString += " " + this.rightBrace + " ";
		return tempString;
	}

	//=======================================================
	//=======================================================
	Parenthesis.prototype.distribute = function()
	{
		//////trace("distribute parens");
		////trace(this.middleNode.getTreeAsString());

		if ((this.middleNode !== null) && (this.middleNode.distribute()))
			return true;

		if (this.parentNode instanceof tree.HorizontalOperator && this.parentNode.canDistribute())
		{
			////trace("parent is horizontal and can distribute");
			////trace(this.middleNode.getTreeAsString());
			////trace(this.parentNode.getTreeAsString());
			////trace(this.rootNode.getTreeAsString());

			var distributeRight = (this.parentNode.rightNode === this);
			this.parentNode.distributeNode(this.middleNode, distributeRight);
			////trace("after distribute");
			////trace(this.middleNode.getTreeAsString());
			////trace(this.parentNode.getTreeAsString());
			////trace(this.rootNode.getTreeAsString());

			if (this.parentNode.parentNode !== null)
			{
				this.middleNode.parentNode = this.parentNode.parentNode;
				this.parentNode.parentNode.assignNodeNewChild(this.parentNode, this.middleNode);
				////trace("parent of parent diff from null");
				////trace(this.middleNode.getTreeAsString());
				////trace(this.parentNode.getTreeAsString());
				////trace(this.rootNode.getTreeAsString());
			}
			else
			{ //the parent must be the root

				//check to see if distributes stuff is part of the root	or some left overs that we arent gonna include in tree
				////trace("parent of parent is null");
				////trace(this.middleNode.getTreeAsString());
				////trace(this.parentNode.getTreeAsString());
				////trace(this.rootNode.getTreeAsString());
				if (this.rootNode.rootNode.existInTree(this.middleNode))
				{
					////trace("parent of parent is null and exists in tree");
					if (this.parentNode instanceof tree.Subtraction || this.parentNode instanceof tree.Addition)
					{
						////trace("parent of paren is subtraction or addition, we are done");
					}
					else
					{
						this.rootNode.rootNode = this.middleNode;
						this.middleNode.parentNode = null;
					}
				}

				//this.parentNode.deleteNode(true);
			}

			//changed
			return true;
		}

		return false;
	}

	//=======================================================
	//=======================================================
	Parenthesis.prototype.evaluateNode = function(variableValue)
	{
		if (this.middleNode !== null)
			return this.middleNode.evaluateNode(variableValue);
	}

	//=======================================================
	//=======================================================
	Parenthesis.prototype.evaluateNodeWithVariables = function(variables)
	{
		if (this.middleNode !== null)
			return this.middleNode.evaluateNodeWithVariables(variables);
	}

	//=======================================================
	//=======================================================
	Parenthesis.prototype.getApproximateValueOfTree = function(variables)
	{
		if (this.middleNode !== null)
			return this.middleNode.getApproximateValueOfTree(variables);
	}

	//=======================================================
	//=======================================================
	Parenthesis.prototype.getFactors = function(terms, isNumerator)
	{
		if (terms.order === undefined)
			terms.order = [];
		this.middleNode.getFactors(terms, isNumerator);
	}

	//=======================================================
	//=======================================================
	Parenthesis.prototype.getPolyCoefficient = function()
	{
		return this.middleNode.getPolyCoefficient();
	}

	//=======================================================
	//=======================================================
	Parenthesis.prototype.duplicateNode = function(root)
	{
		var tempNode = new tree[this.className](this.leftBrace);
		tempNode.setRoot(root);
		tempNode.lastAction = this.lastAction;
		return tempNode;
	}

	//=======================================================
	//=======================================================
	Parenthesis.prototype.isPolynomial = function()
	{
		if (this.middleNode !== null && this.middleNode.isPolynomial())
			return true;
		else
			return false;
	}

	//=======================================================
	//=======================================================
	Parenthesis.prototype.isRational = function()
	{
		if (this.middleNode !== null && this.middleNode.isRational())
			return true;
		else
			return false;
	}

	//=======================================================
	//=======================================================
	Parenthesis.prototype.removeNulls = function()
	{
		var removedNulls = false;
		if (this.middleNode !== null)
			removedNulls = this.middleNode.removeNulls() || removedNulls;

		if (this.middleNode === null && this.parentNode)
		{
			this.parentNode.assignNodeNewChild(this, null);
			if (this.rootNode.rootNode === this)
				this.rootNode.rootNode = null;

			return true;
		}

		return removedNulls;
	}

	//=======================================================
	//=======================================================
	Parenthesis.prototype.removeParen = function()
	{
		////trace("remove paren in node paren");
		////trace(this.parentNode.className);
		////trace(this.middleNode.className);
		////trace(this.middleNode.isLeaf());
		var removedParen = false;
		if (this.middleNode !== null)
			removedParen = this.middleNode.removeParen() || removedParen;

		//check if middle node is a fraction raised to a power, then we need parens
		if ((this.middleNode instanceof tree.Numerical) && !(this.middleNode.isInteger()) && (this.parentNode instanceof tree.Power))
			return removedParen;
		//check if we have a negative numerical in parens raised to a power, if thats the causse parens are necessary
		if (this.middleNode instanceof tree.Numerical && this.middleNode.isNegative() && this.parentNode instanceof tree.Power)
			return removedParen;
		//check for trig function inside a parens to a power
		if (this.middleNode instanceof tree.TrigFunction && this.parentNode instanceof tree.Power)
			return removedParen;
		if (this.middleNode.isLeaf() ||
			(this.parentNode instanceof tree.TrigFunction && this.middleNode instanceof Parenthesis) ||
			this.middleNode instanceof tree.Power ||
			(this.middleNode instanceof tree.Multiplication && this.middleNode.leftNode instanceof tree.Numerical && this.middleNode.rightNode instanceof Parenthesis) ||
			(this.rootNode.rootNode === this && !(this.middleNode instanceof tree.Comma)) )
		{
			////trace("middle node is leaf");
			////trace(this.parentNode);

			this.middleNode.parentNode = this.parentNode;

			if (this.parentNode !== null)
				this.parentNode.assignNodeNewChild(this, this.middleNode);
			else
				this.rootNode.rootNode = this.middleNode;

			removedParen = true;
			////trace("after mod");
			////trace(getTreeAsString());
		}

		return removedParen;
	}

	//=======================================================
	//=======================================================
	Parenthesis.prototype.simplify = function(parentPrecedence, reduceFracs, rules)
	{
		return this.middleNode.simplify(parentPrecedence, reduceFracs, rules);
	}

module.exports = Parenthesis;
},{"./tree":47}],34:[function(require,module,exports){
//==========================================================================
// Basic tree parser
// Adapted from the Calculator/MathTree AS Class
//
// DG NOTE: This pre-supposed a currently non-existant translation layer!
// Commas for coordinates are translated into backslashes
//==========================================================================
var tree = require('./tree');	// node tree helper file

    Parser = {};

/***************************************************************
 * This class takes a string that represents an infix expression
 * and turns it into a postfix expression. It also keeps any
 * parenthesis that user placed.
 * Infix: (4-3)/(4+1)
 * Postfix: 34-(14+(/
 * This parser needs to know all possible functions that could be
 * used. It also assumes that all variables are only one letter
 * long.
 */

	var expression;//:String;  	//the infix expression to be parsed
	var iPos;//:Number;  		//current position in the infix expression
	var stack;//:Array;
	var postFixTokens;//:Array;

	// Used during parsing
	var readyForUnaryOp;
	var lastTokenWasNumber;
	var lastTokenWasParen;
	var lastTokenWasVariable;
	var lastTokenWasNonFunctionParen;
	var workingWithSigma;

	var tempToken;//:Object;
	var nextChar;

	// Parser actions, by opening character
	var parseObject = {
		'&': 'logic',
		'|': 'logic',
		',': 'comma',		// This comma is a separator inside functions such as pow(x,2)
		'(': 'open',
		')': 'close',
		'[': 'open',
		']': 'close',
		'{': 'open',
		'}': 'close',
		'=': 'equal',
		'!': 'not',
		'<': 'inequality',
		'>': 'inequality',
		'~': 'tilde',		// Multiplication with an x (not a dot)
		'$': 'dollars',		// Division with a division sign (not a fraction)
		'@': 'ellipsis',
		'*': 'highpri',
		'/': 'highpri',
		'+': 'lowpri',
		'-': 'lowpri',
		'�': 'lowpri',
		'\\': 'lowpri'		// Comma, for coordinates
	};

	//=======================================================
	//=======================================================
	Parser.parse = function(equation)
	{
		expression = equation;
		iPos = -1;		// We start with an increment, so use -1
		stack = [];
		postFixTokens = [];

		// Reset vars
		readyForUnaryOp = true;
		lastTokenWasNumber = false;
		lastTokenWasParen = false;
		lastTokenWasVariable = false;
		lastTokenWasNonFunctionParen = false;
		workingWithSigma = false;

		return parse();
	}

	//=======================================================
	//
	//=======================================================
	Parser.tokenList = function()
	{
		return postFixTokens;
	}

	//=======================================================
	// This is the main routine of this module.
	// Parse and tokenize an equation string.
	//=======================================================
	function parse()
	{
		// Run a simple cleanup pass on the expression before parsing
		expression = cleanExpression(expression);

		// Special case infinite and no solutions.  They appear as a sequence of multiplied variables to the parser.
		if (expression === "infinitesolutions")
		{
			postFixTokens.push(new tree.Token(tree.Token.functionType, "infinitesolutions"));
			return true;
		}
		else if(expression === "nosolutions")
		{
			postFixTokens.push(new tree.Token(tree.Token.functionType, "nosolutions"));
			return true;
		}

		// This is an interesting special case.  It could just tokenize here instead.
		if (expression === "-")
			expression = "-1";

		//----------------------------------------
		// Main parse loop
		//----------------------------------------
		while (iPos < (expression.length-1))
		{
			nextChar = expression.charAt(++iPos);	// iPos points at the current char (not the next available char)

			// Skip low-ASCII characters (0-31)
			if (nextChar <= ' ')
				continue;

			// Perform the correct action based on the next character
			// Special case numbers and letters since they cover a large range
			if (isNumber(nextChar))
            {
				if (!number())
                    return false;
            }
			else if (isAlpha(nextChar))
            {
				if (!letter())
                    return false;
            }            
			else if (parseObject[nextChar])
				Parser[parseObject[nextChar]]();
			else
			{
				//fw.debug("parse: unexpected character: " + nextChar);
				return false;
			}
		}

        if (readyForUnaryOp)
            return false; // incomplete operation - missing the tail operand
        
		// Have processed all input characters.  Now flush stack.
		while (tempToken = stack.pop())
			postFixTokens.push(tempToken);

		// Walk the token list and ensure everything is balanced.
		return isBalanced();
	}

	//==========================================================================
	// Parse actions
	//==========================================================================

	//=======================================================
	// Parse a numeric expression
	// Numbers can be integers, decimals, or fractions
	//=======================================================
	function number(isNegative)
	{
		var tempChar = nextChar;
		var tempDenominator = 1;
		var tempNumerator = undefined;
		var foundDivision = false;
		var decimalFound = (tempChar === ".");

        if (isNegative)
            tempChar = '-' + nextChar;
            
		while (iPos < expression.length)
		{
			nextChar = expression.charAt(++iPos);

			// Check for decimal points
			if (nextChar === ".")
			{
				if (decimalFound)
					return true; // false;	// Decimal already found, decimal number is not well formatted

				decimalFound = true;
			}

			if (!isNumber(nextChar))	// Non-numeric character detected.
			{
				if (!foundDivision && nextChar === "/")
				{
					if (isNumber(expression.charAt(iPos+1)) && !decimalFound
                        && expression.charAt(iPos+1) != '1') // so that chekForOne in division can find it 
					{
						//check first if denominator is decimal
						if (isDecimal(parseFloat(expression.substring(iPos+1))))
							break;

						tempNumerator = tempChar;
						tempChar = "";
						foundDivision = true;
					}
					else
						break;
				}
				else
					break;
			}
			else
				tempChar += nextChar;		// nextChar is a number.  Concatenate it to tempChar, our number string
		}

		// Back off one char (before whatever caused us to exit) unless we're at EOS
		if (iPos < expression.length)
			iPos--;

		// Figure out what to do with tempChar
		if (tempNumerator === undefined)
			tempNumerator = tempChar;
		else
			tempDenominator = tempChar;

		if (lastTokenWasNonFunctionParen)
			addOp("#");

		//postFixTokens.push(new tree.Token(tree.Token.numberType, new tree.Fraction(parseFloat(tempNumerator), parseFloat(tempDenominator))));
        
        // need to deal with the case of division by zero:
        var frac = new tree.Fraction(parseFloat(tempNumerator), parseFloat(tempDenominator));
        if (!isNaN(frac.numerator) && !isNaN(frac.denominator))
            postFixTokens.push(new tree.Token(tree.Token.numberType, frac));
        else
            return false; // divide by zero - not a good equation

		lastTokenWasNumber = true;
		lastTokenWasVariable = false;
		readyForUnaryOp = false;
		lastTokenWasNonFunctionParen = false;
		// DG: Not setting lastTokenWasParen?
        return true;
	}

	//=======================================================
	// Letter characters
	//=======================================================
	function letter()
	{
		var tempChar = nextChar;
		var firstLetterPos = iPos;

		// Scan ahead for the next non-alpha character
		nextChar = expression.charAt(++iPos);
		while (iPos < expression.length && isAlpha(nextChar))
		{
			tempChar += nextChar;
			nextChar = expression.charAt(++iPos);
		}

		// DG: Handle the case where EOS was reached before a non-letter
		if (iPos >= expression.length)
			nextChar = '';

		if (nextChar === "(")
		{
            if (tempChar === "alert")
                return false; // javar function is not allowed
            
    		// Check if tempchar is a variable followed immediately by a function, e.g. xsqrt() or xypow()
			for (var r = 1; r < tempChar.length; r++)
			{
				if (isFunction(tempChar.substring(r)))
				{
					// We found a variable and a function attached
					// Reset to point to the function, which will be parsed the next time through the loop (by this very routine, but only after the variable(s) are stripped off)
					nextChar = tempChar.charAt(r);
					iPos = firstLetterPos + r;
					tempChar = tempChar.substring(0, r);
					break;
				}
			}
		}

		// Now we need to test to see if its a variable or a function
		if (nextChar === "(" && isFunction(tempChar))
		{
			// This was a function
			if (lastTokenWasNumber || lastTokenWasParen || lastTokenWasVariable)
				addOp("#");

			stack.push(new tree.Token(tree.Token.parenFunctionType, tempChar));

			if(tempChar === "sigma")
				workingWithSigma = true;
			lastTokenWasNumber = false;
			lastTokenWasParen = false;
			readyForUnaryOp = true;
			lastTokenWasVariable = false;
			lastTokenWasNonFunctionParen=false;

//			//trace('func: ' + tempChar);
		}
		else	// It's a variable or a operation
		{
			// Step through each variable.  Variables can only be one character long.
			for (var i = 0; i < tempChar.length; i++)
			{
				if (lastTokenWasNumber || lastTokenWasParen || lastTokenWasVariable)
					addOp("#");

				postFixTokens.push(new tree.Token(tree.Token.variableType, tempChar.charAt(i)));
				lastTokenWasVariable = true;
			}

			// Push nextChar back into the queue
			iPos--;

//			//trace('vars: ' + tempChar);

			lastTokenWasVariable = true;
			lastTokenWasNumber = false;
			lastTokenWasParen = false;
			readyForUnaryOp = false;
			lastTokenWasNonFunctionParen = false;
		}
        return true;
	}

	//=======================================================
	// Handle & and |
	//=======================================================
	Parser.logic = function()
	{
		// Convert items on the stack to tokens
		// DG: This doesn't stop for parentheses.  Is that correct?
		// It's definitely not working correctly
//		while (tempToken = stack.pop())
//			postFixTokens.push(tempToken);

		// Push the new logic character to the stack
//		stack.push(new tree.Token(tree.Token.functionType, nextChar));

		// This seems to be correct, and probably is everywhere
		addByPrecedence();

		lastTokenWasNumber = false;
		lastTokenWasParen = false;
		readyForUnaryOp = true;
		lastTokenWasVariable = false;
		lastTokenWasNonFunctionParen=false;
	}

	//=======================================================
	// Handle a comma (inside functions)
	//=======================================================
	Parser.comma = function()
	{
		// Need to pop back to the function
		while (tempToken = stack.pop())
		{
			if (tempToken.tokenType === tree.Token.parenFunctionType)
			{
				stack.push(tempToken);
				break;
			}
			else
				postFixTokens.push(tempToken);
		}

		lastTokenWasNumber = false;
		lastTokenWasParen = false;
		readyForUnaryOp = true;
		lastTokenWasVariable = false;
		lastTokenWasNonFunctionParen = false;
	}

	//=======================================================
	// Open an enclosure of some type: (, [, {
	// Note that the exact char doesn't matter.  All openers are treated identically.
	//=======================================================
	Parser.open = function()
	{
		if(lastTokenWasNumber || lastTokenWasParen || lastTokenWasVariable)
			addOp("#");

		stack.push(new tree.Token(tree.Token.leftParenType, nextChar));

		lastTokenWasNumber = false;
		lastTokenWasParen = false;
		readyForUnaryOp = true;
		lastTokenWasVariable = false;
		lastTokenWasNonFunctionParen = false;
	}

	//=======================================================
	// Close an enclosure of some type: ), ], }
	// Note that the exact char doesn't matter.  All openers are treated identically.
	// They don't even have to match the opener.
	//=======================================================
	Parser.close = function()
	{
		var success = false;

		// Have a ')' so pop off the stack and put into postfix list until a
		// '(' or a parenFunction is popped.
		while (tempToken = stack.pop())
		{
			postFixTokens.push(tempToken);

			if (tempToken.tokenType === tree.Token.leftParenType || tempToken.tokenType === tree.Token.parenFunctionType)
			{
				lastTokenWasParen = true;
				if (tempToken.tokenType === tree.Token.leftParenType)
					lastTokenWasNonFunctionParen = true;

				if (tempToken.tokenValue === "sigma")
					workingWithSigma = false;

				success = true;
				break;
			}
		}

		lastTokenWasNumber = false;
		readyForUnaryOp = false;
		lastTokenWasVariable = false;

		// DG: Not setting lastTokenWasParen or lastTokenWasNonFunctionParen in all cases
		// The routine assumes that a match will eventually be made.
		// At least throw a message to the log
		//if (!success)
			//trace("Closing parenthesis doesn't have a matching opener!");
	}

	//=======================================================
	// Equal sign
	//=======================================================
	Parser.equal = function()
	{
		if (workingWithSigma)
		{
			//trace("working with sigma =");
			addOp(nextChar);
		}
		else
		{
			var tempChar = expression.charAt(iPos+1);

			// =? appears to be a special case.
			if (tempChar === "?")
			{
				nextChar += tempChar;
				iPos++;
			}

			addByPrecedence();
		}

		lastTokenWasNumber = false;
		lastTokenWasParen = false;
		readyForUnaryOp = true;
		lastTokenWasVariable = false;
		lastTokenWasNonFunctionParen = false;
	}

	//=======================================================
	// !, which is part of !=
	// The tokenizer doesn't know how to process ! as factorial
	//=======================================================
	Parser.not = function()
	{
		var tempChar = expression.charAt(iPos+1);	// Could be OOB!
		if (tempChar === "=")
		{
			nextChar += tempChar;
			iPos++;
		}

		addByPrecedence();

		lastTokenWasNumber = false;
		lastTokenWasParen = false;
		readyForUnaryOp = true;
		lastTokenWasVariable = false;
		lastTokenWasNonFunctionParen = false;
	}

	//=======================================================
	//
	//=======================================================
	Parser.inequality = function()
	{
		var tempChar = expression.charAt(iPos+1);	// Could be OOB!

		// Check for <= or >=
		if (tempChar === "=")
		{
			nextChar += tempChar;
			iPos++;
			tempChar = expression.charAt(iPos+1);
		}

		// Check for <?, >?, <=?, >=?
		if (tempChar === "?")
		{
			nextChar += tempChar;
			iPos++;
		}

		addByPrecedence();

		lastTokenWasNumber = false;
		lastTokenWasParen = false;
		readyForUnaryOp = true;
		lastTokenWasVariable = false;
		lastTokenWasNonFunctionParen = false;
	}

	//=======================================================
	// Tilde: This is a stand-in for "times" (the x multiplication symbol?)
	// It takes 2 parameters and has the same precedence as * and /
	// This should just use the highpri routine!
	//=======================================================
	Parser.tilde = function()
	{
		addOp(nextChar);

		lastTokenWasNumber = false;
		lastTokenWasParen = false;
		readyForUnaryOp = true;
		lastTokenWasVariable = false;
		lastTokenWasNonFunctionParen = false;
	}

	//=======================================================
	// Dollar sign: This is a stand-in for "Divide" (for actual divide symbol?)
	// It takes 2 parameters and has the same precedence as * and /
	// This should just use the highpri routine!
	//=======================================================
	Parser.dollars = function()
	{
		addOp(nextChar);

		lastTokenWasNumber = false;
		lastTokenWasParen = false;
		readyForUnaryOp = true;
		lastTokenWasVariable = false;
		lastTokenWasNonFunctionParen = false;
	}

	//=======================================================
	//
	//=======================================================
	Parser.ellipsis = function()
	{
		postFixTokens.push(new tree.Token(tree.Token.variableType, "..."));

		lastTokenWasVariable = true;
		lastTokenWasNumber = false;
		lastTokenWasParen = false;
		readyForUnaryOp = false;
		lastTokenWasNonFunctionParen = false;

		//trace("adding ellipsis parser");
	}

	//=======================================================
	// High-priority operator
	//=======================================================
	Parser.highpri = function()
	{
		// Have a '*' or '/'. Pop off any operators of equal or higher
		// precedence and put them into postfix list. If a '(' or lower
		// precedence operator (such as '+' or '-') is popped, put it back and
		// stop looking. Push new '*' or '/'.

		// DG: I can't help but notice that the comment above isn't what's actually happening
		addOp(nextChar);

		lastTokenWasNumber = false;
		lastTokenWasParen = false;
		readyForUnaryOp = true;
		lastTokenWasVariable = false;
		lastTokenWasNonFunctionParen = false;
	}

	//=======================================================
	// Low-priority operator
	//=======================================================
	Parser.lowpri = function()
	{
		if (readyForUnaryOp)
		{
			// Pop the operators of higher precedence (this is the special
			// case where there aren't any)
			if (nextChar === "-")
            {
                if (expression.charAt(iPos-1) != ',') // not part of a function such as pow(x,-2):
                    stack.push(new tree.Token(tree.Token.unaryNeg, nextChar));
                else
                {
                    nextChar = expression.charAt(++iPos);
                    if (isNumber(nextChar))
                    {
                        if (number(true))
                            lastTokenWasNumber = true;
                    }
                    else
                        lastTokenWasNumber = false;
                }
            }
		}
		else
		{
			 // Have a '+' or '-'. Pop off any operators of equal or higher
			// precedence (that includes all of them) and put them into
			// postfix list. If a '(' is popped, put it back and stop looking.
			// Push new '+' or '-'.
			addOp(nextChar);
            lastTokenWasNumber = false;
		}

		lastTokenWasParen = false;
		readyForUnaryOp = true;
		lastTokenWasVariable = false;
		lastTokenWasNonFunctionParen = false;
	}

	//==========================================================================
	// Helper Functions
	//==========================================================================

	//=======================================================
	//=======================================================
	function addOp(chr)
	{
		var token;
		var newToken = new tree.Token(tree.Token.functionType, chr);

//		//trace('addOp');
//		newToken.printToken();

		while (token = stack.pop())
		{
//			token.printToken();

			// DG: This is a bit suspect.  I removed a redundant clause.  Does it really cover all cases?
			if ((token.tokenType === tree.Token.functionType && token.getPrecedence() >= newToken.getPrecedence())
				|| token.tokenType === tree.Token.unaryNeg)
			{
				postFixTokens.push(token);
			}
			else
				break;
		}

		// Put back the one we didn't need to pop off
		if (token != undefined)
			stack.push(token);

		stack.push(newToken);

//		Parser.printArray();
	}

	//=======================================================
	// Add tokens based on precedence.  Helper for other actions.
	//=======================================================
	function addByPrecedence()
	{
		var newToken = new tree.Token(tree.Token.functionType, nextChar);

//		//trace('addByPrecedence');
//		newToken.printToken();

		while (tempToken = stack.pop())
		{
			if (tempToken.getPrecedence() >= newToken.getPrecedence())
				postFixTokens.push(tempToken);
			else
				break;
		}

		// Put back the one we didn't need to pop off
		if (tempToken !== undefined)
			stack.push(tempToken);

		stack.push(newToken);

//		Parser.printArray();
	}

	//=======================================================
	// Walk the token list and ensure everything is balanced.
	//=======================================================
	function isBalanced()
	{
		var tempStack = [];
		for (var i = 0; i < postFixTokens.length; i++)
		{
			var type = postFixTokens[i].tokenType;
			if (type === tree.Token.numberType || type === tree.Token.variableType)
			{
				tempStack.push(1);
				continue;
			}
			else if (type === tree.Token.functionType || type === tree.Token.parenFunctionType)
			{
				var opCnt = postFixTokens[i].getNumberOps();
//				//trace(postFixTokens[i].tokenValue + '. Uses: ' + opCnt + ', has: ' + tempStack.length);
				if (tempStack.length >= opCnt)
				{
					for (var j = 0; j < opCnt; j++)
						tempStack.pop();

					tempStack.push(1);
					continue;
				}
				else
					return false;
			}
		}

//		Parser.printArray();
		return (tempStack.length === 1);
	}

	//=======================================================
	// Clean up the expression
	//=======================================================
	function cleanExpression(expr)
	{
		// List of replacements to conduct.
		// [From, To]
		var cleanup = [
			[' ', ''],		// Space
			['	', ''],		// Tab
			['+/-', '�'],	// Convert to a single character
			['#', '*'],
			['...', '@'],	// Convert to a single character (used internally only)
			[String.fromCharCode(0x2212), '-'],
//			[',', '\\']		// DG: Convert comma to backslash.  This previously occurred externally and may not have been used for every comma.
							// DG: Removed comma translation.  Coordinate pairs should use \\ as a separator.  Functions like pow(x,2) need to use a comma.  They are different!
		];

		// split/join isn't the most efficient, but there is no replace all function without
		// using regular expressions, which are hard to use dynamically.

		for (var i = 0; i < cleanup.length; i++)
			expr = expr.split(cleanup[i][0]).join(cleanup[i][1]);

		return expr;
	}

	//=======================================================
	// Test cleanExpression
	//=======================================================
	Parser.testCleanExpression = function(exp)
	{
		return cleanExpression(exp);
	}

	//=======================================================
	//=======================================================
	function isNumber(char)
	{
		return ("0123456789.").indexOf(char) >= 0;
	}

	//=======================================================
	// This is named poorly.  Checks if a number if a non-integer value.
	//=======================================================
	function isDecimal(possibleNumber)
	{
//		//trace("in is decimal");
//		//trace(possibleNumber);

		if (isNaN(possibleNumber))
			return false;

		return !(possibleNumber === Math.floor(possibleNumber))
	}

	//=======================================================
	//=======================================================
	function isAlpha(char)
	{
		// Slower but clearer method: Actually document what the characters are.
		// If we add more exceptions, turn it into a JSON object
		var infinity = String.fromCharCode(0x221E);
		var euler = String.fromCharCode(0x2107);
		var pi = String.fromCharCode(0x03C0);

		return ((char >= "a" && char <= "z" ) || (char >= "A" && char <= "Z" ) || (char === infinity) || (char === pi) || (char === euler))
	}

	//=======================================================
	// Determine whether a string is a function name
	//=======================================================
	function isFunction(func)
	{
//		//trace("in isfunction parse with " + func);

		// I believe switch ends up as a bunch of compares.  Using a hash would probably be faster.
		switch(func)
		{
			case "nroot":
			case "mix":
			case "sin":
			case "cos":
			case "tan":
			case "cot":
			case "sec":
			case "csc":
			case "pow":
			case "sqrt":
			case "sub":
			case "abs":
			case "div":
			case "sigma":
			case "log":
			case "ln":
				return true;
			default:
				return false;
		}
	}
/*
	//=======================================================
	//=======================================================
	Parser.printArray = function()
	{
		//trace("Printing");
//		//trace(postFixTokens);

		for (var i = postFixTokens.length - 1; i >= 0; i--)
			postFixTokens[i].printToken();

//		//trace("Stack");
//		for (var i = stack.length - 1; i >= 0; i--)
//			stack[i].printToken();
	}
*/
module.exports = Parser;
},{"./tree":47}],35:[function(require,module,exports){
//==========================================================================
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Calculator.MathTree.PlusMinus extends HorizontalOperator
var tree = require('./tree');	// node tree helper file

	//=======================================================
	// Constructor
	//=======================================================
	PlusMinus = function()
	{
		tree.HorizontalOperator.call(this);	// Call the parent constructor (was super())

		this.n = "�";
		this.precedence = 5;
		this.className = "PlusMinus";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	PlusMinus.prototype = new tree.HorizontalOperator();
	PlusMinus.prototype.constructor = PlusMinus;


/*************************************************************/
/*   	FUNCTIONS THAT RETURN INFO ABOUT THE GIVEN TREE		 */
/*************************************************************/

	//=======================================================
	//=======================================================
	PlusMinus.prototype.canRemoveZero = function()
	{
		return true;
	}

	//=======================================================
	//=======================================================
	PlusMinus.prototype.countTerms = function()
	{
		var terms = 0;
		var childTerms = 0;
		var myChildren = getChildren();
		var child;
		while (myChildren.length > 0)
		{
			child = myChildren.pop();
			if (child !== null)
			{
				childTerms = child.countTerms();

				if (childTerms === 0)
					terms++;
				else
					terms += childTerms;
			}
		}
		return terms;
	}

	//=======================================================
	//=======================================================
	PlusMinus.prototype.findLikeTerms = function(terms, isNegative)
	{
		if (this.leftNode !== null)
			this.leftNode.findLikeTerms(terms, isNegative);

		if (this.rightNode !== null)
			this.rightNode.findLikeTerms(terms, false);
	}

	//=======================================================
	//=======================================================
	PlusMinus.prototype.getNumerical = function()
	{
		if (this.leftNode instanceof tree.Numerical)
			return this.leftNode.number;
		else if (this.rightNode instanceof tree.Numerical)
			return this.rightNode.number;
		else
			return undefined;
	}

	//=======================================================
	//=======================================================
	PlusMinus.prototype.getPolyTerms = function(polyList)
	{
		if (this.leftNode instanceof tree.Addition || this.leftNode instanceof tree.Subtraction)
		{
			polyList.push(this.rightNode.duplicateTree(this.rootNode));
			this.leftNode.getPolyTerms(polyList);
		}
		else
		{
			//This means that we are at the end of the line
			polyList.push(this.leftNode.duplicateTree(this.rootNode));
			polyList.push(this.rightNode.duplicateTree(this.rootNode));
		}
	}

	//=======================================================
	//=======================================================
	PlusMinus.prototype.getPolyCoefficient = function()
	{
		var leftDegree = this.leftNode.getDegree();
		var rightDegree = this.rightNode.getDegree();

		if (leftDegree > rightDegree)
			return this.leftNode.getPolyCoefficient();
		else if (leftDegree < rightDegree)
			return this.rightNode.getPolyCoefficient();
		else	//this means they are the same, so add them.
			return tree.Fraction.plus(this.leftNode.getPolyCoefficient(), this.rightNode.getPolyCoefficient());
	}

	//=======================================================
	//=======================================================
	PlusMinus.prototype.isOrderedPolynomial = function()
	{
		if (this.leftNode instanceof tree.Addition || this.leftNode instanceof tree.Subtraction)
		{
			if (this.leftNode.rightNode.getDegree() <= this.rightNode.getDegree())
				return false;
			else
				return this.leftNode.isOrderedPolynomial();
		}
		else
		{
			if (this.leftNode.getDegree() <= this.rightNode.getDegree())
				return false;
			else
				return true;
		}
	}

	//=======================================================
	//=======================================================
	PlusMinus.prototype.performApproximateOp = function(op1, op2)
	{
		return op1 + op2;
	}

	//=======================================================
	//=======================================================
	PlusMinus.prototype.performOp = function(op1, op2)
	{
		return tree.Fraction.plus(op1, op2);
	}

/*************************************************************/
/*  	 	FUNCTIONS THAT MODIFY THE GIVEN TREE			 */
/*************************************************************/

	//=======================================================
	//=======================================================
	PlusMinus.prototype.addNegative = function()
	{
		var addedNegative = tree.HorizontalOperator.addNegative.call(this);
		if (this.rightNode !== null)
		{
			if (this.rightNode instanceof tree.Numerical && this.rightNode.isNegative())
			{
				var tempNode = new tree.Subtraction();
				this.rightNode.updateValue(tree.Fraction.multiply(this.rightNode.number, new tree.Fraction(-1)));
				//changed

				tempNode.parentNode = this.parentNode;
				this.parentNode.assignNodeNewChild(this, tempNode);
				this.leftNode.parentNode = tempNode;
				tempNode.leftNode = this.leftNode;
				this.rightNode.parentNode = tempNode;
				tempNode.rightNode = this.rightNode;

				return true;
			}
		}
		return addedNegative;
	}

	//=======================================================
	//=======================================================
	PlusMinus.prototype.orderPolynomial = function()
	{
		var swapped = false;
		var rightDegree = this.rightNode.getDegree();
		var leftDegree;

		if (this.leftNode instanceof tree.Addition || this.leftNode instanceof tree.Subtraction)
		{
			swapped = this.leftNode.orderPolynomial();

			leftDegree = this.leftNode.rightNode.getDegree();
			if (leftDegree < rightDegree)
			{
				//now we need to swap the subtrees, including the operator.
				var tempNode = this.leftNode;
				this.leftNode = tempNode.leftNode;
				this.leftNode.parentNode = this;
				tempNode.leftNode = this;
				tempNode.parentNode = this.parentNode;
				this.parentNode.assignNodeNewChild(this, tempNode);
				this.parentNode = tempNode;
				if (this.rootNode.rootNode === this)
					this.rootNode.rootNode = tempNode;
				swapped = true;
			}
		}
		else
		{
			//This means that we are at the end of the line
			leftDegree = this.leftNode.getDegree();

			if (leftDegree < rightDegree)
			{
				//now we need to swap the subtrees
				var tempNode = this.leftNode;
				this.leftNode = this.rightNode;
				this.rightNode = tempNode;

				swapped = true;
			}
		}

		return swapped;
	}

	//=======================================================
	//=======================================================
	PlusMinus.prototype.removeParen = function()
	{
		var removedParen = false;

		if (this.leftNode !== null)
			removedParen = this.leftNode.removeParen() || removedParen;

		if (this.rightNode !== null)
			removedParen = this.rightNode.removeParen() || removedParen;

		if (this.leftNode !== null && this.leftNode instanceof tree.Parenthesis)
		{
			this.leftNode.middleNode.parentNode = this;
			//changed
			this.leftNode = this.leftNode.middleNode;
			removedParen = true;
		}

		if (this.rightNode !== null && this.rightNode instanceof tree.Parenthesis)
		{
			this.rightNode.middleNode.parentNode = this;
			//changed
			this.rightNode = this.rightNode.middleNode;
			removedParen = true;
		}

		return removedParen;
	}

	//=======================================================
	//=======================================================
	PlusMinus.prototype.removeNulls = function()
	{
		var removedNulls = false;

		if (this.leftNode !== null)
			removedNulls = this.leftNode.removeNulls() || removedNulls;

		if (this.rightNode !== null)
			removedNulls = this.rightNode.removeNulls() || removedNulls;

		if (this.leftNode === null)
		{
			this.parentNode.assignNodeNewChild(this, this.rightNode);
			this.rightNode.parentNode = this.parentNode;
			if (this.rootNode.rootNode === this)
				this.rootNode.rootNode = this.rightNode;
			return true;
		}
		else if (this.rightNode === null)
		{
			this.parentNode.assignNodeNewChild(this, this.leftNode);
			this.leftNode.parentNode = this.parentNode;
			if (this.rootNode.rootNode === this)
				this.rootNode.rootNode = this.leftNode;
			return true;
		}

		return removedNulls;
	}

/*************************************************************/
/*						PRIVATE FUNCTIONS					 */
/*************************************************************/

	//=======================================================
	//=======================================================
	PlusMinus.prototype.canDistribute = function()
	{
		return false;
	}

	//=======================================================
	//=======================================================
	PlusMinus.prototype.canSimplifyNode = function()
	{
		return true;
	}

	//=======================================================
	//=======================================================
	PlusMinus.prototype.getNodeAsString = function()
	{
		return "�";
	}

	//=======================================================
	//=======================================================
	PlusMinus.prototype.replaceNumerical = function(num)
	{
		if (this.leftNode instanceof tree.Numerical)
			this.leftNode.updateValue(num);
		else if (this.rightNode instanceof tree.Numerical)
			this.rightNode.updateValue(num);
	}

module.exports = PlusMinus;

},{"./tree":47}],36:[function(require,module,exports){
//==========================================================================
// Tree node type: Powers (exponents)
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Calculator.MathTree.Power extends Operator{
var tree = require('./tree');	// node tree helper file
var _ = require('underscore'); 

	//=======================================================
	// Constructor
	//=======================================================
	Power = function()
	{
		tree.powerNroot.call(this);	// Call the parent constructor (was super())

		this.className = "Power";
		this.returnSqrt = true;
	}

	//=======================================================
	// Inheritance
	//=======================================================
	Power.prototype = new tree.powerNroot();
	Power.prototype.constructor = Power;


/*************************************************************/
/*   	FUNCTIONS THAT RETURN INFO ABOUT THE GIVEN TREE		 */
/*************************************************************/
    Power.prototype.isSquarePower = function()
    {
        return (this.righNode instanceof tree.Numerical && this.righNode.number.equalsTwo());
    }
	//=======================================================
    // It only checks exponents to see any numbers exist.
    // If does, then fail the simplification.
	//=======================================================
	Power.prototype.areAllNumbersWithExponentsSimplified = function(ignoreNegExpos)
	{
		if (ignoreNegExpos && this.rightNode instanceof tree.Numerical && this.rightNode.isNegative())
			return true;

		var nodes = [];
		this.leftNode.findAllInstancesOfClass("Numerical", nodes);

		return (nodes.length > 0)
	}

	//=======================================================
    // It only checks parenthesis contains any content.
    // If not, then fail the simplification.
	//=======================================================
	Power.prototype.areParensToExponentSimplified = function()
	{
		if (this.leftNode instanceof tree.Parenthesis)
		{
			var parenNode = this.leftNode.middleNode;

			if (parenNode instanceof tree.Variable ||
					parenNode instanceof tree.Numerical ||
					parenNode instanceof tree.Multiplication ||
					parenNode instanceof tree.Division)
				return false;
		}

		return true;
	}

	//=======================================================
	//=======================================================
	Power.prototype.duplicateTree = function(root)
	{
		var tempNode = this.duplicateNode(root);

		if (this.leftNode !== null)
		{
			tempNode.leftNode = this.leftNode.duplicateTree(root);
			tempNode.leftNode.parentNode = tempNode;
		}
		else
			tempNode.leftNode = null;

		if (this.rightNode !== null)
		{
			tempNode.rightNode = this.rightNode.duplicateTree(root);
			tempNode.rightNode.parentNode = tempNode;
		}
		else
			tempNode.rightNode = null;

		return tempNode;
	}

	//=======================================================
    // complain if base is 1
	//=======================================================
	Power.prototype.checkForOnes = function()
	{
        var baseNode = this.getBase();
        var expNode = this.rightNode;

        if (baseNode instanceof tree.Numerical && baseNode.equalsOne()
            || (expNode instanceof tree.Numerical && expNode.equalsOne()))
            return true; // found one
        
        return this.checkAnyChildren("checkForOnes");
    }
    
	//=======================================================
	//=======================================================
	Power.prototype.checkForPowersToTheOne = function()
	{
		var expVal = this.getExponentValue();	// This returns null on error
		if (expVal && expVal.equalsTo && expVal.equalsTo(1,1))
		{
			var newNode = this.getBase();
			newNode.parentNode = this.parentNode;
			newNode.parentNode && newNode.parentNode.assignNodeNewChild(this, newNode);	// DG: Added null check -- was crashing

			return true;
		}

		return false;
	}

	//=======================================================
	//=======================================================
	Power.prototype.simplify = function(parentPrecedence, reduceFracs, rules)
	{
		var simplifyObject = new Object({changed:false});

        // only base and exponent are all numbers that simplification apply:
		if (rules && !rules.allowNegExp)
		{
            if (this.leftNode instanceof tree.Numerical
                && this.rightNode instanceof tree.Numerical
                && !this.rightNode.equalsOneHalf()) // 0.5 power is sqrt, so don't simplify
			{
				simplifyObject.changed = true;
				return simplifyObject;
			}
			
			var parent = this.parentNode;
			
			// detecting the likes of pow(x, 4)/pow(x,2):
			if (parent)
			{
				parent.orderPolynomial();
				
				if((parent instanceof tree.Division || parent instanceof tree.Multiplication)
					&& parent.rightNode && parent.rightNode != this
					&& parent.rightNode instanceof tree.Power)
				{
					// put base of power in descending order:
					//this.leftNode.orderPolynomial();
					//parent.rightNode.leftNode.orderPolynomial();
					
					var ltStr = this.leftNode.getTreeAsString().trim();
					var rtStr = parent.rightNode.leftNode.getTreeAsString().trim();
					if (ltStr === rtStr)
					{
						simplifyObject.changed = true;
						return simplifyObject;
					}
				}
			}
		}
       // else
        {
            simplifyObject = this.leftNode.simplify(this.precedence, reduceFracs, rules);
            if (simplifyObject.changed)
                return simplifyObject; // early out if already failed
            
            simplifyObject = this.rightNode.simplify(this.precedence, reduceFracs, rules);
            if (simplifyObject.changed)
                return simplifyObject; // early out if already failed
    
    // ----- deal with simplification such as 'pow((pow(x,4)/pow(y,11)),8)' ---------
            var ptr = this.leftNode; // base pointer:
            if (ptr instanceof tree.Parenthesis)
                ptr = ptr.middleNode;
                
            simplifyObject.changed = true; // need to falt after the following tests:
                
            if (ptr instanceof tree.Power)  // embedded power
                return simplifyObject;
            
            var plt = ptr.leftNode; // base left child
            if (ptr instanceof tree.Multiplication) // embedded power multiplication:
            {
                var prt = ptr.rightNode;
                if ( (plt instanceof tree.Power && plt.hasNumericalExponent())
                ||( prt instanceof tree.Power && prt.hasNumericalExponent()))
 				return simplifyObject;
			}
                
            if (ptr instanceof tree.Division // embedded power division:
                && plt instanceof tree.Power && plt.hasNumericalExponent())
                    return simplifyObject;
                
            simplifyObject.changed = false; // reset back default
            // ------------------------------------------------------------
			
			var selfConstOrVar = (this.leftNode instanceof tree.Variable
								|| this.leftNode instanceof tree.Numerical)
            var childSqrt = (this.leftNode instanceof tree.Parenthesis
							 && this.leftNode.middleNode instanceof tree.SquareRoot);
            var parentSqrt = (this.parentNode instanceof tree.SquareRoot
							 && selfConstOrVar);
            var Two = new tree.Fraction(2, 1);
            var pwrBgrThan2 = (this.rightNode instanceof tree.Numerical
                               && this.rightNode.number.greaterEqualThan(Two));
			
            if ((parentSqrt || childSqrt) && pwrBgrThan2)
			{
				simplifyObject.changed = true;
				return simplifyObject;
			}
        }
        
        simplifyObject.changed = simplifyObject.changed || (!this.areAllVariablesCombined());
        return simplifyObject;
    }
    
	//=======================================================
	//=======================================================
	Power.prototype.hasNumericalExponent = function()
    {
        return (this.rightNode instanceof tree.Numerical);
    }

	//=======================================================
    // true = failed simplification
	//=======================================================
	Power.prototype.simplifyNumericalExponents = function()
	{
		//trace("simplifying numerical expo");

        // only base and exponent are all numbers that simplification apply:
		if (this.leftNode instanceof tree.Numerical && this.rightNode instanceof tree.Numerical)
		{
			//trace("going to simplify expo");
			var base = this.leftNode.number;
			var exp = this.rightNode.number;

			var baseNumber = base.numerator / base.denominator;

			if (exp.denominator !== 1)
				return false;

			var expNumber = exp.numerator;

			var answerNum = Math.pow(base.numerator, expNumber);
			var answerDen = Math.pow(base.denominator, expNumber);

			//trace("answer in simplify expon, num and den");
			//trace(answerNum);
			//trace(answerDen);
			if (isNaN(answerNum) || answerNum === Infinity || isNaN(answerDen) || answerDen === Infinity)
				return false;

			var answerNode = new tree.Numerical(answerNum, answerDen);

			if (this.parentNode !== null)
			{
				answerNode.parentNode = this.parentNode;
				this.parentNode.assignNodeNewChild(this, answerNode);
			}
			else
				this.rootNode.rootNode = answerNode;
		}
		//else
			return false;
	}

	//=======================================================
	//=======================================================
	Power.prototype.evaluateNode = function(variableValue)
	{
		var base = this.leftNode.evaluateNode(variableValue);
		var pow = this.rightNode.evaluateNode(variableValue);

		base.numerator = Math.pow(base.numerator, pow.numerator);
		base.denominator = Math.pow(base.denominator, pow.numerator);

		return base;
	}

	//=======================================================
	//=======================================================
	Power.prototype.evaluateNodeWithVariables = function(variables)
	{
		var base = this.leftNode.evaluateNodeWithVariables(variables);
		var pow = this.rightNode.evaluateNodeWithVariables(variables);

        if (base && pow)
        {
            var answer = new tree.Fraction(1);
            answer.numerator = Math.pow(base.numerator, pow.numerator);
            answer.denominator = Math.pow(base.denominator, pow.numerator);
    
            return answer;
        }
        
        return null;
	}

	//=======================================================
	//=======================================================
	Power.prototype.getApproximateValueOfTree = function(variables)
	{
		var base = this.leftNode.getApproximateValueOfTree(variables);
		var pow = this.rightNode.getApproximateValueOfTree(variables);

		return Math.pow(base, pow); // divide by zero: eval = 0 and pow = -1; it will return "infinity".
	}
/*
	//=======================================================
	//=======================================================
	Power.prototype.findLikeTerms = function(terms, isNegative)
	{
		var term = this.getTreeAsString();

		var coefficient;
		if (isNegative)
			coefficient = new tree.Fraction(-1);
		else
			coefficient = new tree.Fraction(1);

		if (terms.hasOwnProperty(term))
		{
			var oldCoefficient = terms[term];
			terms[term] = Fraction.plus(oldCoefficient, coefficient);
			terms.changed = true;
		}
		else
		{
//r			terms.addProperty(term);
			terms[term] = coefficient;
		}
	}
*/
	//=======================================================
	//=======================================================
	Power.prototype.getBase = function()
	{
		return this.leftNode;
	}

	//=======================================================
	//=======================================================
	Power.prototype.getDegree = function()
	{
		if (this.rightNode instanceof tree.Numerical)
			return this.rightNode.number.numerator;
		else
			return 0;
	}

	//=======================================================
	//=======================================================
	Power.prototype.getExponentValue = function()
	{
		if (this.rightNode instanceof tree.Numerical)
			return this.rightNode.number;
		else
			return null;
	}

	//=======================================================
    // push each new term under this node as string into the terms.order object,
    // combine into the existing terms if find any match.
	//=======================================================
	Power.prototype.getFactors = function(terms, isNumerator)
	{
		if (terms.order === undefined)
			terms.order = [];

		var term = this.leftNode.getTreeAsString();

		if (this.leftNode instanceof tree.Parenthesis)
			term = this.leftNode.middleNode.getTreeAsString();

		if (isNumerator)
			var exponent = new tree.Fraction(this.rightNode.number.numerator,
                                             this.rightNode.number.denominator);
		else
			var exponent = new tree.Fraction(-1 * this.rightNode.number.numerator,
                                             this.rightNode.number.denominator);
		if (terms.hasOwnProperty(term))
		{
			var oldExponent = terms[term];
			terms[term] = tree.Fraction.plus(oldExponent, exponent);
		}
		else
		{
			terms[term] = exponent;
			terms.order.push(term);
		}
	}

	//=======================================================
	//=======================================================
	Power.prototype.getPolyCoefficient = function()
	{
		return new tree.Fraction(1);
	}

	//=======================================================
	// Convert this node and all children to a string
	//=======================================================
	Power.prototype.getTreeAsString = function(isDecimal)
	{
		// Convert exponents of 1/2 to square roots (if this.returnSqrt is set to specifically allow it)
		// DG: rightNode was being cast to Division to calculate isOneHalf.
		if ((this.rightNode.isIdentical && this.rightNode.isIdentical(new tree.Fraction(1, 2))
              || tree.Division.prototype.isOneHalf.call(this.rightNode))
			&& this.returnSqrt)
		{
			var tempString = "sqrt(";

			if (this.leftNode !== null)
				tempString += this.leftNode.getTreeAsString(isDecimal);

			tempString += ")";
			return tempString;
		}

		var tempString = "pow(";

		if (this.leftNode !== null)
			tempString += this.leftNode.getTreeAsString(isDecimal);

		tempString += ", ";

		if (this.rightNode !== null)
			tempString += this.rightNode.getTreeAsString(isDecimal);

		tempString += ")";
		return tempString;
	}

	//=======================================================
	// If this is a power of 1/2, convert it to a square root
	//=======================================================
	Power.prototype.convertPowersToSqrt = function()
	{
		// Convert exponents of 1/2 to square roots (if this.returnSqrt is set to specifically allow it)
		// DG: rightNode was being cast to Division to calculate isOneHalf.
//		if ( (this.rightNode.isIdentical && this.rightNode.isIdentical(new tree.Fraction(1, 2))
//              || tree.Division.prototype.isOneHalf.call(this.rightNode)))
		if (this.rightNode instanceof tree.Numerical && this.rightNode.equalsOneHalf())
		{
			var newSqrt = new tree.SquareRoot();
			newSqrt.rootNode = this.rootNode;
			newSqrt.middleNode = this.leftNode;
			this.leftNode.parentNode = newSqrt;

			if (this.parentNode !== null)
			{
				newSqrt.parentNode = this.parentNode;
				this.parentNode.assignNodeNewChild(this, newSqrt);
			}
			else
				this.rootNode.rootNode = newSqrt;

			return true;
		}

		return false;
	}

	//=======================================================
	//=======================================================
	Power.prototype.getVariableFactors = function(terms, isDenominator)
	{
		var term = this.leftNode.getNodeAsString();
		var power;

		if (this.rightNode instanceof tree.Numerical)
		{
			if (isDenominator)
				power = tree.Fraction.multiply(this.rightNode.number, new tree.Fraction(-1));
			else
				power = this.rightNode.number.duplicate();
		}
		else
			terms.combinable = false;

		if (terms.hasOwnProperty(term))
		{
			var oldPower = terms[term];
			terms[term] = tree.Fraction.plus(oldPower, power);
			terms.changed = true;
		}
		else
		{
//r			terms.addProperty(term);
			terms[term] = power;
		}
	}

	//=======================================================
	//=======================================================
	Power.prototype.isPolynomial = function()
	{
		if (this.leftNode instanceof tree.Variable && this.rightNode.isPolynomialExponent())
			return true;
		else
			return false;
	}

	//=======================================================
	//=======================================================
	Power.prototype.isRational = function()
	{
		if (this.leftNode instanceof tree.Variable && this.rightNode.isPolynomialExponent())
			return true;
		else
			return false;
	}

/*************************************************************/
/*  	 	FUNCTIONS THAT MODIFY THE GIVEN TREE			 */
/*************************************************************/

	//=======================================================
	//=======================================================
	Power.prototype.combineNumbersWithExponents = function()
	{
		if (!(this.rightNode instanceof tree.Numerical))
			return;

		var numberNodes = [];
		this.leftNode.findAllInstancesOfClass("Numerical", numberNodes);

		var base;
		var exponent;
		var number;
		var tempNode;
		var valid;
		var isNumerator;

		while (numberNodes.length > 0)
		{
			number = numberNodes.pop();
			base = number.number.duplicate();
			exponent = this.rightNode.getNumerical();
			valid = true;
			isNumerator = true;
			tempNode = number;
			while (tempNode.parentNode !== this)
			{
				if (tempNode.parentNode instanceof tree.Multiplication || tempNode.parentNode instanceof tree.Parenthesis)
				{
				}
				else if (tempNode.parentNode instanceof tree.Division)
				{
					if (tempNode.parentNode.rightNode === tempNode)
						exponent = new tree.Fraction(exponent.numerator * -1, exponent.denominator);
				}
				else
				{
					valid = false;
					break;
				}
				tempNode = tempNode.parentNode;
			}
			if (valid)
			{
				if (exponent.isNegative())
				{
					//base = base.reciprocal();
					exponent = tree.Fraction.multiply(exponent, new tree.Fraction(-1));
					isNumerator = false;
				}
				if (exponent.isInteger())
					base = new tree.Fraction (Math.pow(base.numerator, exponent.numerator), Math.pow(base.denominator, exponent.numerator));
				else
					//trace("HAVE NOT IMPLEMENTED FRACTIONAL EXPONENTS");

				//In this case the power is the root of the whole tree
				if (this.parentNode === null)
				{
					if (!isNumerator)
					{
						var newRoot = new tree.Division();
						newRoot.rootNode = this.rootNode;
						newRoot.leftNode = this;
						this.parentNode = newRoot;
						newRoot.rightNode = new tree.Numerical(base.numerator, base.denominator);
						newRoot.rightNode.parentNode = newRoot;
						this.rootNode.rootNode = newRoot;
					}
					else
					{
						var newRoot = new tree.Multiplication();
						newRoot.rootNode = this.rootNode;
						newRoot.rightNode = this;
						this.parentNode = newRoot;
						newRoot.leftNode = new tree.Numerical(base.numerator, base.denominator);
						newRoot.leftNode.parentNode = newRoot;
						this.rootNode.rootNode = newRoot;
					}
				}
				else
				{
					if (!isNumerator)
					{
						var newRoot = new tree.Division();
						newRoot.rootNode = this.rootNode;
						newRoot.parentNode = this.parentNode;
						this.parentNode.assignNodeNewChild(this, newRoot);
						newRoot.leftNode = this;
						this.parentNode = newRoot;
						newRoot.rightNode = new tree.Numerical(base.numerator, base.denominator);
						newRoot.rightNode.parentNode = newRoot;
					}
					else
					{
						var newRoot = new tree.Multiplication();
						newRoot.rootNode = this.rootNode;
						newRoot.parentNode = this.parentNode;
						this.parentNode.assignNodeNewChild(this, newRoot);
						newRoot.rightNode = this;
						this.parentNode = newRoot;
						newRoot.leftNode = new tree.Numerical(base.numerator, base.denominator);
						newRoot.leftNode.parentNode = newRoot;
					}
				}

				//Now we need to remove the number from inside the power
				if (number.parentNode === this)
					//this means that the number was the only part of the base
					this.parentNode.assignNodeNewChild(this, null);
				else
					number.parentNode.assignNodeNewChild(number, null);
			}

			this.leftNode.removeNulls();
		}
	}

	//=======================================================
	//=======================================================
	Power.prototype.checkForNegativeExponents = function()
	{
		if (this.rightNode instanceof tree.Numerical)
			return this.rightNode.isNegative();

		return false;
	}

	//=======================================================
	//=======================================================
	Power.prototype.checkForZeroExponents = function(onlyVars)
	{
		if (this.rightNode instanceof tree.Numerical)
		{
			if (!onlyVars)
				return this.rightNode.number.equalsZero();
			else if (this.leftNode instanceof tree.Variable)
				return this.rightNode.number.equalsZero();
		}

		return false;
	}

	//=======================================================
	//=======================================================
    Power.prototype.processVars = function(ptr, termTail, list)
    {
        var terms = {};
        ptr.findAllVariables(terms);
        var noNumCombine = (ptr instanceof tree.Parenthesis
                            && ptr.middleNode instanceof tree.AddSubtractBase);
        
        if (ptr instanceof tree.Numerical)
            terms.numerical = 1; // numerical base
        
        // change newTerms name to reflect the power hierachy:
        _.each(terms, function(value, key) // find the objects to change key name:
        {
            var term = key+termTail;
            if (list.hasOwnProperty(term))
                list[term]++; // make it combinable
            else if (term.indexOf("numerical") == -1) // don't add numerical)
                list[term] = terms[key]; //1; // add the new term
        });
	}

module.exports = Power;

},{"./tree":47,"underscore":61}],37:[function(require,module,exports){
//==========================================================================
// Tree node type: Square roots
// base for Power and nRoot Classes
//==========================================================================
var tree = require('./tree');	// General math tools
var _ = require('underscore'); 

	//=======================================================
	// Constructor
	//=======================================================
	powerNroot = function(type)
	{
		tree.Operator.call(this);	// Call the parent constructor (was super())
//		tree.NRoot.call(this);	// Call the parent constructor (was super())

		this.className = "powerNroot";

		// All data is stored in the middle note (nRoots use the left and right node -- shouldn't this just be an nRoot with a forced 2 for the right node??
		this.middleNode = null;
	}

	//=======================================================
	// Inheritance
	//=======================================================
	powerNroot.prototype = new tree.Operator();
	powerNroot.prototype.constructor = powerNroot;

/*************************************************************/
/*   	FUNCTIONS THAT RETURN INFO ABOUT THE GIVEN TREE		 */
/*************************************************************/

	//=======================================================
	//=======================================================
	powerNroot.prototype.canSimplifyNode = function()
	{
		return true;
	}

	//=======================================================
	//=======================================================
	powerNroot.prototype.checkForOnes = function()
	{
        return this.checkAnyChildren("checkForOnes");
	}

	//=======================================================
	//=======================================================
	powerNroot.prototype.checkForZeros = function()
	{
        return this.checkAnyChildren("checkForZeros");
	}

	//=======================================================
	//=======================================================
	powerNroot.prototype.findLikeTerms = function(terms, isNegative)
	{
		var term = this.getTreeAsString();
		var coefficient = new tree.Fraction(1);

		if (terms.hasOwnProperty(term))
		{
			terms.changed = true;
            return;
		}
		else
			terms[term] = coefficient;

        var newTerms = {changed: false}; // can't combine base and exponent with something else
        
        var ptr = this.middleNode; // squareRoot
        if (!ptr)
            ptr = this.leftNode;
    
        this.findComponentLikeTerms(ptr, newTerms, isNegative);
            
        if (this.rightNode && !newTerms.changed)
        {
            newTerms = {changed: false}; // can't combine base and exponent with something else
            this.findComponentLikeTerms(this.rightNode, newTerms, isNegative);
        }
        terms.changed = terms.changed || newTerms.changed;
	}

	//=======================================================
	//=======================================================
	powerNroot.prototype.findComponentLikeTerms = function(component, terms, isNegative)
	{
		var term = component.getTreeAsString();
		var coefficient = new tree.Fraction(1);
        var newTerms = { changed:false };

		if (isNegative)
			coefficient = new tree.Fraction(-1);

		if (terms.hasOwnProperty(term))
		{
			var oldCoefficient = terms[term];
			terms[term] = tree.Fraction.plus(oldCoefficient, coefficient);
			terms.changed = true;
		}
		else
		{
            if (component instanceof tree.powerNroot) // in case such as power(power(base, exponent1), exponent2)
                component.findLikeTerms(terms, isNegative);
            else
            {
                component.checkAnyChildren("findLikeTerms", newTerms, isNegative);
                if (newTerms.changed)
                {
                    terms.changed = true;
                    return; // found error, no points to linger around
                }
                
                var termTail = "";
                if (newTerms.constant)
                    termTail = newTerms.constant.numerator + "/" + newTerms.constant.denominator;
                    
                // change newTerms name to reflect the power hierachy:
                _.each(newTerms, function(value, key) // find the objects to change key name:
                {
                    if (value.type == 'var')
                    {
                        term = key+termTail;
                        if (terms.hasOwnProperty(term))
                        {
                            var oldCoefficient = terms[term];
                            terms[term] = tree.Fraction.plus(oldCoefficient, coefficient);
                            terms.changed = true;
                        }
                        else
                            terms[term] = coefficient; // add the new term
                    }
                });
            }
		}
	}

	//=======================================================
	//=======================================================
	powerNroot.prototype.findAllVariables = function(list)
	{
        var termTail = "_1/2"; 
        var ptr = this.middleNode; // for squareRoot
        if (!ptr)
        {
            ptr = this.leftNode;
            termTail = "_" + this.rightNode.getNodeAsString();
        }
        this.processVars (ptr, "_base"+termTail, list);
        
        if (this.rightNode)
            this.processVars (this.rightNode, termTail, list);
    }
    
	//=======================================================
	//=======================================================
    powerNroot.prototype.processVars = function(ptr, termTail, list)
    {        
        var terms = {};
        ptr.findAllVariables(terms);
        var noNumCombine = (ptr instanceof tree.Parenthesis && ptr.middleNode instanceof tree.AddSubtractBase);
        
        if (ptr instanceof tree.Numerical)
            terms.numerical = 1;

        // change newTerms name to reflect the power hierachy:
        _.each(terms, function(value, key) // find the objects to change key name:
        {
            var term = key+termTail;
            _.each(list, function(listValue, listKey) // find the objects to change key name:
            {
                if (listKey == term
                    || // such as sqrt(3)*sqrt(x) = sqrt(3x), but not combining such as pow(x+1)*pow(x-1):
                    (!noNumCombine && terms.numerical && // as long as there is var & constant with the same level 
                        listKey.indexOf(termTail) != -1)
                    )
                    list[listKey]++; // make it combinable
            });

            if (!list.hasOwnProperty(term) && term.indexOf("numerical") == -1) // don't add numerical
                list[term] = 1; // add the new term
        });
	}

	//=======================================================
	//=======================================================
	powerNroot.prototype.simplify = function(parentPrecedence, reduceFracs, rules)
	{
		var simplifyObject = new Object({changed:false});

        if (this.leftNode)
        {
            simplifyObject = this.leftNode.simplify(this.precedence, reduceFracs, rules);
            if (simplifyObject.changed)
                return simplifyObject; // early out if already failed
        }
        
        if (this.rightNode)
        {
            simplifyObject = this.rightNode.simplify(this.precedence, reduceFracs, rules);
            if (simplifyObject.changed)
                return simplifyObject; // early out if already failed
        }    

        if (this.middleNode)
            simplifyObject = this.middleNode.simplify(this.precedence, reduceFracs, rules);

        simplifyObject.changed = simplifyObject.changed || (!this.areAllVariablesCombined());
        
		return simplifyObject;
	}
/*    
	//=======================================================
    // anything needs multiplied should be checked with multiple vars:
    //=======================================================
	powerNroot.prototype.areAllVariablesCombined = function() //parentPrecedence, reduceFracs, rules)
	{
       var parent = this.parentNode;
        while (parent && parent instanceof tree.Parenthesis)
            parent = parent.parentNode;
        
        if (parent && parent instanceof tree.Multiplication)
        {
            otherPow = parent.leftNode;
        }
		return true;
    }
*/
    
module.exports = powerNroot;
},{"./tree":47,"underscore":61}],38:[function(require,module,exports){
//==========================================================================
// Tree node type: Root
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
var tree = require('./tree');	// General math tools
var Parser = require('./parser');
var _ = require('underscore'); 

    //=======================================================
	// Constructor
	//=======================================================
	function Root()
	{
		this.distributeNode = null;
		this.className = "Root";
	}

//==========================================================================
// FUNCTIONS THAT RETURN INFO ABOUT THE GIVEN TREE
//==========================================================================

	//=======================================================
	//=======================================================
	Root.prototype.areAllNumbersWithExponentsSimplified = function(ignoreNegExpos)
	{
		ignoreNegExpos = ignoreNegExpos === undefined ? false : ignoreNegExpos;
		return this.rootNode.areAllNumbersWithExponentsSimplified(ignoreNegExpos);
	}

	//=======================================================
	//=======================================================
	Root.prototype.switchInequality = function()
	{
		if (this.rootNode instanceof tree.Inequality)
		{
			this.rootNode.invertInequality();
			return true;
		}

		return false;
	}

	//=======================================================
	 // This function returns true if all the
	 // variables in a single term in the tree
	 // have been combined. For example, 3*x*x
	 // would return false, 3x^2 would return
	 // true.
	//=======================================================
	Root.prototype.areAllVariablesCombined = function()
	{
		return this.rootNode.areAllVariablesCombined();
	}

	//=======================================================
	//=======================================================
	Root.prototype.moveNumberCoefficientsToLeft = function()
	{
		return this.rootNode.moveNumberCoefficientsToLeft();
	}

	//=======================================================
	//=======================================================
	Root.prototype.combinePowers = function()
	{
		return this.rootNode.combinePowers();
	}

	//=======================================================
	//=======================================================
	Root.prototype.areFractionsUnderRadicals = function()
	{
		return this.rootNode.areFractionsUnderRadicals();
	}

	//=======================================================
	//=======================================================
	Root.prototype.areAllFactorsCancelled = function()
	{
		return this.rootNode.areAllFactorsCancelled();
	}

	//=======================================================
	//=======================================================
	Root.prototype.areRadicalsInDenominator = function()
	{
		return this.rootNode.areRadicalsInDenominator();
	}

	/********************************************
	 * This function returns the number of terms
	 * in the polynomial tree.
	 ******************************************/
	Root.prototype.countTerms = function()
	{
		if (this.isPolynomial())
			return this.rootNode.countTerms();
		else
			return Number.NaN;
	}

	/********************************************
	 * This function returns the number of factors
	 * in the tree. A factor is anything that is
	 * multiplied. 2*x*x*(x-2)^2 has 5 factors.
	 * The number 1 is never a factor. So
	 * x*x*(1)*(x-2) has only 3 factors, but
	 * x*x*(3-2)*(x-2) has 4 factors (it doesn't
	 * figure out that (3-2) is just a one.)
	 ********************************************/
	Root.prototype.countFactors = function()
	{
		if (this.isPolynomial())
			return this.rootNode.countFactors();
		else
			return Number.NaN;
	}

	/*********************************************
	 * This function creates a duplicate version
	 * of the tree and returns the root of the new
	 * tree.
	 *********************************************/
	Root.prototype.duplicateTree = function()
	{
        if (!this.rootNode)
            return null;

		var newRoot = new Root();
		newRoot.rootNode = this.rootNode.duplicateTree(newRoot);
		return newRoot;
	}

	/********************************************
	 * This function replaces all variables with
	 * the given value and attempt to evaluate
	 * the tree. If possible it returns the value
	 * of the tree, null otherwise (eg - it might
	 * be an equation, not an expression).
	 */
	Root.prototype.evaluateTree = function(value)
	{
		return this.rootNode.evaluateNode(value);
	}

	//=======================================================
	//=======================================================
	Root.prototype.evaluateTreeWithVariables = function(variables)
	{
		var answer = this.rootNode.evaluateNodeWithVariables(variables);
		return answer;
	}

	//=======================================================
	//=======================================================
	Root.prototype.findAllInstancesOfClass = function(desiredClass)
	{
		var nodes = [];
		if (desiredClass === "SquareRoot")
			this.convertPowersToSqrt();

		this.rootNode && this.rootNode.findAllInstancesOfClass(desiredClass, nodes);

		return nodes;
	}

	//=======================================================
	//find all Division nodes that should be Numericals and returns an array of numericals
	//with them
	//=======================================================
	Root.prototype.findAllNumericalDivisions = function()
	{
		var numericalDivs = [];
		var nodes = [];
		this.rootNode.findAllInstancesOfClass("Division", nodes);
		var tempDivision;
		var tempNumerical;
		for (var i=0; i<nodes.length; i++)
		{
			tempDivision = Division(nodes[i]);
			if (tempDivision.leftNode instanceof tree.Numerical && tempDivision.rightNode instanceof tree.Numerical)
			{
				var numFrac = tempDivision.leftNode.number;
				var denFrac = tempDivision.rightNode.number;
				if (numFrac.denominator === 1 && denFrac.denominator === 1)
					numericalDivs.push(new tree.Numerical(numFrac.numerator, denFrac.numerator));

			}
		}

		return numericalDivs;
	}

	/*********************************************
	 * This function returns an array of all nodes
	 * in the tree that have the given opId. This
	 * is used in the basic calculator to find
	 * certain operators that we added at the same
	 * time.
	 *********************************************/
	Root.prototype.findNodesWithId = function(opId)
	{
		var ops = [];

		if (this.distributeNode !== null)
			this.distributeNode.findNodesWithId(opId, ops);
		else
			this.rootNode.findNodesWithId(opId, ops);

		return ops;
	}

	//=======================================================
	// DG: An identical routine was being created every time
	// getAllVariables was being run, which is wasteful.
	// Object/function allocation increases dreaded garbage
	// collection.
	//=======================================================
	function countVars()
	{
		var i = 0;
		for (var prop in this)
		{
			if (prop !== "count")
				i++;
		}

		return i;
	}

	/*******************************************
	 * This function returns an object with all
	 * of the variables that are found in the
	 * tree. The index of each item is the
	 * variable and the item is the number
	 * of times that varibles occurs in the tree.
	 * x^2 only counts as once. So in 3x*x^4*x^2
	 * would say that the x appears 3 times.
	 *******************************************/
	Root.prototype.getAllVariables = function(stripTail)
	{
		var list = {};

		this.rootNode.findAllVariables(list);

		list.count = countVars;

		if (stripTail)
		{
			_.each(list, function(listValue, listKey) // find the objects to change key name:
            {
                var pos = listKey.indexOf("_");

				if (pos != -1) // replace old key with new one without tail:
				{
					var newKey = listKey.substr(0, pos); // truncate the tail
					if (list.hasOwnProperty(newKey))
						list[newKey]++;
					else
						list[newKey] = list[listKey]; // copy old key value to new key

					delete list[listKey]; 	// delete old key pair
				}
            });
		}

		return list;
	}

	//=======================================================
	//=======================================================
	Root.prototype.getApproximateValueOfTree = function(variables, bForcePositive)
	{
		this.undoVerticalDivision();
		return this.rootNode.getApproximateValueOfTree(variables, bForcePositive);
	}

	/******************************************
	 * This function returns the degree of the
	 * polynomial tree.
	 ******************************************/
	Root.prototype.getDegree = function()
	{
		return this.rootNode.getDegree();
	}

	/**************************************************
	 * This function returns and object with
	 * all of the factors in the given tree.
	 * Each factor is a parameter in the returned
	 * object. The value is the number of times
	 * each factor appears (the resulting exponent.)
	 * There is also a parameter called "order" which
	 * is an array of the factors in order of their
	 * appearance, left to right.
	 **************************************************/
	Root.prototype.getFactors = function()
	{
		var factors = {};
		factors.order = [];
		this.rootNode.getFactors(factors, true);
		return factors;
	}

	/*********************************************
	 * This function takes an empty array and
	 * populates it with the root of each term
	 * in the polynomial tree.
	 ********************************************/
	Root.prototype.getPolyTerms = function(polyList)
	{
		this.rootNode.getPolyTerms(polyList);
	}

	//=======================================================
	//=======================================================
	Root.prototype.getPolyCoefficient = function()
	{
		return this.rootNode.getPolyCoefficient();
	}

	/*********************************************
	 * This function returns the current solution
	 * to the current equation if there is one.
	 * There is a solution if there is a variable
	 * solved for a number. It returns null if
	 * a solution has not been found.
	 *********************************************/
	Root.prototype.getSolution = function()
	{
		//trace("called get solution");
		//trace(this.getTreeAsString());
		if (this.rootNode instanceof tree.Equality
            && this.rootNode.leftNode instanceof tree.Numerical
            && this.rootNode.rightNode instanceof tree.Variable)
			return this.rootNode.leftNode.number;
		else if (this.rootNode instanceof tree.Equality
                 && this.rootNode.rightNode instanceof tree.Numerical
                 && this.rootNode.leftNode instanceof tree.Variable)
			return this.rootNode.rightNode.number;
	}

	//=======================================================
	//=======================================================
	Root.prototype.getTreeAsArray = function()
	{
		var nodes = [];
		this.rootNode.getTreeAsArray(nodes);
		return nodes;
	}

	/************************************************
	 * This function returns the tree as a string
	 * turning all numbers to decimals (rather than
	 * fractions) if isDecimal is true. It only puts
	 * nodes into the string that were orginally part
	 * of the tree. For example, any implied
	 * multiplications are not included.
	 ************************************************/
	Root.prototype.getTreeAsOriginalString = function(isDecimal)
	{
		var strTree = this.rootNode.getTreeAsString(isDecimal);
		var substrs = strTree.split("#");
		return substrs.join("");
	}

	/**********************************************
	 * This function returns the tree as a string
	 * turning all numbers to decimals (rather than
	 * fractions) if isDecimal is true. It puts ALL
	 * nodes in the tree into the string.
	 ***********************************************/
	Root.prototype.getTreeAsString = function(isDecimal)
	{
		var strTree = this.rootNode.getTreeAsString(isDecimal);
		var substrs = strTree.split("#");
		return substrs.join("*");
	}

	//=======================================================
	//=======================================================
	Root.prototype.makeNegativeMixedNumber = function()
	{
		return this.rootNode.makeNegativeMixedNumber();
	}

	/********************************************
	 * This function tests to see if all like
	 * terms have been combined. It returns true
	 * if there are no like terms.
	 ********************************************/
	Root.prototype.isFullyCombined = function()
	{
		//return this.rootNode.isFullyCombined();

		if (this.rootNode instanceof tree.Equality || this.rootNode instanceof tree.BooleanOperator)
		{
			var termsLeft = {changed:false};
			var termsRight = {changed:false};
			this.rootNode.leftNode.findLikeTerms(termsLeft, false);
			this.rootNode.rightNode.findLikeTerms(termsRight, false);

			if (!termsLeft.changed && !termsRight.changed)
				return true;
			else
				return false;
		}
		else
		{
			var terms = {changed:false};
			this.rootNode.findLikeTerms(terms, false);

			if (!terms.changed)
				return true;
			else
				return false;
		}
	}

	//=======================================================
	//=======================================================
	Root.prototype.isLinear = function()
	{
		return this.rootNode.isLinear();
	}

	/*******************************************
	 * This function returns true if the tree
	 * is a polynomial and is ordered.
	 ******************************************/
	Root.prototype.isOrderedPolynomial = function()
	{
		return (this.isPolynomial() && this.rootNode.isOrderedPolynomial());
	}

	/******************************************
	 * This function returns true if the
	 * tree is a polynomial, false otherwise.
	 ******************************************/
	Root.prototype.isPolynomial = function()
	{
		return this.rootNode.isPolynomial();
	}

	//=======================================================
	//=======================================================
	Root.prototype.isRadical = function()
	{
		return this.rootNode.isRadical();
	}

	//=======================================================
	//=======================================================
	Root.prototype.isRational = function()
	{
		return this.rootNode.isRational();
	}


//==========================================================================
// FUNCTIONS THAT MODIFY THE GIVEN TREE
//==========================================================================

	//=======================================================
	//=======================================================
	Root.prototype.addNegative = function()
	{
		return this.rootNode.addNegative();
	}

	//=======================================================
	//=======================================================
	Root.prototype.checkForOnes = function()
	{
		return this.rootNode.checkForOnes();
	}

	//=======================================================
	//=======================================================
	Root.prototype.checkPerfectPower = function()
	{
		return this.rootNode.checkPerfectPower();
	}

	//=======================================================
	//looks if there are negative exponents
	//=======================================================
	Root.prototype.checkForNegativeExponents = function()
	{
		return this.rootNode.checkForNegativeExponents();
	}

	//=======================================================
	//only vars used to check only variables to the zero
	//=======================================================
	Root.prototype.checkForZeroExponents = function(onlyVars)
	{
		return this.rootNode.checkForZeroExponents(onlyVars);
	}

	//=======================================================
	//=======================================================
	Root.prototype.removeNegativeDenominators = function()
	{
		return this.rootNode.removeNegativeDenominators();
	}


	/*****************************************************
	 * This function combines all like terms in the
	 * tree. It works on both equations and expressions.
	 * It returns true if there were terms to be combined,
	 * false otherwise.
	 * NF: this is not actually used. The ones being used are in each class of the node
	 *****************************************************/
	Root.prototype.combineLikeTerms = function()
	{
		//trace("combine like terms root");
		//trace(getTreeAsString());
		//trace(findAllInstancesOfClass("Comma").length);
		if (findAllInstancesOfClass("Comma").length > 0)
			return false;

		//no support for multiple boolean ops expressions
		if (findAllInstancesOfClass("BooleanOperator").length > 1)
			return false;

		if (this.rootNode instanceof tree.Equality || this.rootNode instanceof tree.BooleanOperator)
		{
			//trace("found equality or boolean in combine like terms");
			var termsLeft = {changed:false};
			var termsRight = {changed:false};
			this.rootNode.leftNode.findLikeTerms(termsLeft, false);
			this.rootNode.rightNode.findLikeTerms(termsRight, false);

			if (!termsLeft.changed && !termsRight.changed)
				return false;
			else
			{
				var newEquation = "";

				newEquation = createStringFromObject(termsLeft);
				newEquation += this.rootNode.getNodeAsString();
				newEquation += createStringFromObject(termsRight);

				this.createTreeWithRoot(newEquation);
				return true;
			}
		}
		else
		{
			var terms = {changed:false};
			this.rootNode.findLikeTerms(terms, false);

			//trace(terms.changed);
			if (!terms.changed)
				return false;
			else
			{
				var newEquation = createStringFromObject(terms);
				//trace("terms changed in combine like terms");
				//trace(newEquation);
				this.createTreeWithRoot(newEquation);
				return true;
			}
		}
	}

	//=======================================================
	//=======================================================
	Root.prototype.combineNumbersWithExponents = function()
	{
		this.rootNode.combineNumbersWithExponents();
		this.rootNode.removeNulls();
	}

	//=======================================================
	//=======================================================
	Root.prototype.combineSquareRoots = function()
	{
		var squareRootObject = this.rootNode.combineSquareRoots(true);
		if (squareRootObject.changed)
			this.rootNode.removeNulls();
		return squareRootObject.changed;
	}

	/***********************************************
	 * This function creates a MathTree that
	 * represents the given string.
	 *
	 * @FIXME/dg: This assumes knowledge of the parser, which is bad design!
	 ***********************************************/
	Root.prototype.createTreeWithRoot = function(equation)
	{
		if (Parser.parse(equation))
		{
			var tokenList = Parser.tokenList();
			////trace("printing tokens in createtreewithroot");

//			for (var i = tokenList.length - 1; i >= 0; i--)
//                tokenList[i].printToken();

            //console.log("tokenList length = " + tokenList.length);
            buildTreeFromStack(tokenList, this);
		}
		else
		{
			this.rootNode = null;
			//trace("that's not a good equation");
			//trace(equation);
		}
	}

	//=======================================================
	//=======================================================
	Root.prototype.distribute = function()
	{
		var dist = false;
		while (this.rootNode.distribute())
			dist = true;

		this.rootNode.removeNulls();
		return dist;
	}

	/******************************************************
	 * This function is used in the basic calculator. When
	 * the user is doing "operations" to both sides of the
	 * equation the operations are stored separately in the
	 * disributeNodes until the user says "go". Then this
	 * is the function that actually applies them to the
	 * tree.
	 ******************************************************/
	Root.prototype.distributeTree = function()
	{
		if (this.distributeNode !== null && this.rootNode instanceof tree.Equality)
		{
			var leftSide = this.distributeNode.duplicateTree(this);
			var rightSide = this.distributeNode.duplicateTree(this);

			if (leftSide instanceof tree.Addition || leftSide instanceof tree.Subtraction
                || (leftSide instanceof tree.Division && !this.rootNode.leftNode.hasChildren()))
			{
				leftSide.leftNode = this.rootNode.leftNode;
				leftSide.leftNode.parentNode = leftSide;
				leftSide.parentNode = this.rootNode;
				this.rootNode.leftNode = leftSide;
			}
			else if (leftSide instanceof tree.Multiplication && !this.rootNode.leftNode.hasChildren())
			{
				leftSide.rightNode = this.rootNode.leftNode;
				leftSide.rightNode.parentNode = leftSide;
				leftSide.parentNode = this.rootNode;
				this.rootNode.leftNode = leftSide;
			}
			else if (leftSide instanceof tree.Division)
			{
				leftSide.leftNode = new tree.Parenthesis("(");
				leftSide.leftNode.parentNode = leftSide;
				leftSide.leftNode.middleNode = this.rootNode.leftNode;
				this.rootNode.leftNode.parentNode = leftSide.leftNode;
				leftSide.parentNode = this.rootNode;
				this.rootNode.leftNode = leftSide;
			}
			else
			{
				leftSide.rightNode = new tree.Parenthesis("(");
				leftSide.rightNode.parentNode = leftSide;
				leftSide.rightNode.middleNode = this.rootNode.leftNode;
				this.rootNode.leftNode.parentNode = leftSide.rightNode;
				leftSide.parentNode = this.rootNode;
				this.rootNode.leftNode = leftSide;
			}

			if (rightSide instanceof tree.Addition || rightSide instanceof tree.Subtraction
                || (rightSide instanceof tree.Division && !this.rootNode.rightNode.hasChildren()))
			{
				rightSide.leftNode = this.rootNode.rightNode;
				rightSide.leftNode.parentNode = rightSide;
				rightSide.parentNode = this.rootNode;
				this.rootNode.rightNode = rightSide;
			}
			else if (rightSide instanceof tree.Multiplication && !this.rootNode.rightNode.hasChildren()){
				rightSide.rightNode = this.rootNode.rightNode;
				rightSide.rightNode.parentNode = rightSide;
				rightSide.parentNode = this.rootNode;
				this.rootNode.rightNode = rightSide;
			}
			else if (rightSide instanceof tree.Division)
			{
				rightSide.leftNode = new tree.Parenthesis("(");
				rightSide.leftNode.parentNode = rightSide;
				rightSide.leftNode.middleNode = this.rootNode.rightNode;
				this.rootNode.rightNode.parentNode = rightSide.leftNode;
				rightSide.parentNode = this.rootNode;
				this.rootNode.rightNode = rightSide;
			}
			else
			{
				rightSide.rightNode = new tree.Parenthesis("(");
				rightSide.rightNode.parentNode = rightSide;
				rightSide.rightNode.middleNode = this.rootNode.rightNode;
				this.rootNode.rightNode.parentNode = rightSide.rightNode;
				rightSide.parentNode = this.rootNode;
				this.rootNode.rightNode = rightSide;
			}
		}

		this.distributeNode = null;
	}

	//=======================================================
	//=======================================================
	Root.prototype.makePowSquareRoot = function(b)
	{
		this.rootNode.makePowSquareRoot(b);
	}

	//=======================================================
	//=======================================================
	Root.prototype.doubleNegative = function()
	{
		return this.rootNode.doubleNegative();
	}

	//=======================================================
	//=======================================================
	Root.prototype.doublePlusMinus = function()
	{
		return this.rootNode.doublePlusMinus();
	}

	//=======================================================
	//=======================================================
	Root.prototype.checkForPowersToTheOne = function()
	{
		return this.rootNode.checkForPowersToTheOne();
	}

	/********************************************
	 * This function puts the polynomial tree in
	 * descending order.
	 *******************************************/
	Root.prototype.orderPolynomial = function()
	{
		var swapped = true;

		while (swapped)
			swapped = this.rootNode.orderPolynomial();
	}

	//=======================================================
	//=======================================================
	Root.prototype.simplifyNumericalExponents = function()
	{
		return this.rootNode.simplifyNumericalExponents();
	}

	//=======================================================
	//=======================================================
	Root.prototype.areParensToExponentSimplified = function()
	{
		return this.rootNode.areParensToExponentSimplified();
	}

	//=======================================================
	//=======================================================
	Root.prototype.reduceFractions = function(toInt)
	{
		toInt = toInt === undefined ? false : toInt;
		var reduceMore = false;
		if (this.rootNode instanceof tree.Division &&
            this.rootNode.leftNode instanceof tree.Numerical && this.rootNode.leftNode.isNegative() &&
            this.rootNode.rightNode instanceof tree.Numerical && this.rootNode.rightNode.isNegative())
			reduceMore = true;
		return this.rootNode.reduceFractions(toInt) || reduceMore;
	}

	//=======================================================
	//=======================================================
	Root.prototype.areAllVariablesMultiplied = function()
	{
		return this.rootNode.areAllVariablesMultiplied();
	}

	//=======================================================
	//=======================================================
	Root.prototype.removeNulls = function()
	{
		return this.rootNode.removeNulls();
	}

	//=======================================================
	//=======================================================
	Root.prototype.removeParen = function()
	{
		return this.rootNode.removeParen();
	}

	//=======================================================
	// Makes (1/3)*x into x/3 or (2/5)*x into (2x)/5
	//=======================================================
	Root.prototype.combineFractionCoeffwithVariable = function()
	{
		return this.rootNode.combineFractionCoeffwithVariable();
	}

	//=======================================================
	//=======================================================
	Root.prototype.removeZeros = function()
	{
		return this.rootNode.removeZeros();
	}

	//=======================================================
	//=======================================================
	Root.prototype.convertPowersToSqrt = function()
	{
		return this.rootNode.convertPowersToSqrt();

	}
	/**********************************************
	 * This function sets the action for the entire
	 * tree to the given action.
	 **********************************************/
	Root.prototype.setAction = function(action)
	{
		this.rootNode.setAction(action, true);
	}

	//=======================================================
	//=======================================================
	Root.prototype.simplify = function(rules)
	{
		reduceFracs = true;
		var simplifyObject = this.rootNode.simplify(-1, reduceFracs, rules);

		if (simplifyObject.changed)
			this.rootNode.removeNulls();

        if (typeof simplifyObject.reduced != 'undefined' && simplifyObject.reduced === false) // NF: shouldn't complain about non-reducable number
            simplifyObject.changed = false; // overide previous simplify result
        
		return simplifyObject.changed;
	}

	/*******************************************************
	 * This function subsitutes the given *numerical* value
	 * for the given variable in the entire tree.
	 ******************************************************/
	Root.prototype.subForVariable = function(variable, value)
	{
		//trace("running sub for variable");
		//trace(this.rootNode.getTreeAsString());
		//trace(variable);
		//trace(value.asString());
		this.rootNode.subForVariable(variable, value);
	}

	//=======================================================
	//=======================================================
	Root.prototype.undoFractions = function()
	{
		return this.rootNode.undoFractions();
	}

	//=======================================================
	// This function looks at all divisions and if it can make a numerical fraction
	// it does, e.g. (2x)/4 is turned into (2/4)*x
	//=======================================================
	Root.prototype.undoVerticalDivision = function(removeOnes)
	{
		var undo = this.rootNode.undoVerticalDivision();
//NF		removeOnes = (removeOnes === undefined) ? true : removeOnes;

// NF: checkForOnes is only used now in the upper level where the rules are checked, here is just waste power
// NF		if (removeOnes)
// NF			this.checkForOnes();

		this.removeNulls();
		return undo;
	}

	/*********************************************************
	 * This function looks for all instances of vertical
	 * division with only 1 integer on the top and bottom and
	 * turns it into a regular number.
	 *********************************************************/
	Root.prototype.undoSimpleVerticalDivision = function()
	{
		var undo = this.rootNode.undoSimpleVerticalDivision();
		this.checkForOnes();

		this.removeNulls();
		return undo;
	}

//==========================================================================
// STATIC FUNCTIONS
//==========================================================================

	//=======================================================
	// Helper routine to add or subtract equations
	//=======================================================
	function addSubEquations(equation1, equation2, operation)
	{
		var root2 = equation2.duplicateTree();
		var root1 = equation1.rootNode.duplicateTree(root2);

		var leftAdd = new tree[operation]();
		leftAdd.rightNode = root2.rootNode.leftNode;
		leftAdd.rightNode.parentNode = leftAdd;
		leftAdd.leftNode = root1.leftNode;
		leftAdd.leftNode.parentNode = leftAdd;
		leftAdd.parentNode = root2.rootNode;
		root2.rootNode.leftNode = leftAdd;

		var rightAdd = new tree[operation]();
		rightAdd.rightNode = root2.rootNode.rightNode;
		rightAdd.rightNode.parentNode = rightAdd;
		rightAdd.leftNode = root1.rightNode;
		rightAdd.leftNode.parentNode = rightAdd;
		rightAdd.parentNode = root2.rootNode;
		root2.rootNode.rightNode = rightAdd;

		return root2;
	}

	/*************************************************
	 * This function adds two equations together and
	 * returns the root of the new equation.
	 ************************************************/
	Root.addEquations = function(equation1, equation2)
	{
		return addSubEquations(equation1, equation2, "Addition");
	}

	/*************************************************
	 * This function subtracts two equations together and
	 * returns the root of the new equation.
	 ************************************************/
	Root.subtractEquations = function(equation1, equation2)
	{
		return addSubEquations(equation1, equation2, "Subtraction");
	}

	//=======================================================
	//function to add two equations or polynomials
	//=======================================================
	Root.addEquationsOrPoly = function(exp1, exp2)
	{
		if (exp1.rootNode instanceof tree.Equality && exp2.rootNode instanceof tree.Equality)
			return addEquations(exp1, exp2);

		var addition = new tree.Addition();

		addition.leftNode = exp1.rootNode;
		addition.leftNode.parentNode = addition;
		addition.rightNode = exp2.rootNode;
		addition.rightNode.parentNode = addition;

		return Root.createDuplicateTree(addition);
	}

	//=======================================================
	//function to subtract two equations or polynomials
	//=======================================================
	Root.subtractEquationsOrPoly = function(exp1, exp2)
	{
		if (exp1.rootNode instanceof tree.Equality && exp2.rootNode instanceof tree.Equality)
			return subtractEquations(exp1, exp2);

		return Root.createTree(exp1.getTreeAsString(false)+"-("+exp2.getTreeAsString(false)+")");
	}

	/**********************************************************
	* This function creates a tree based on the stack created
	* by a parse and returns the root of the tree it created.
	*
	* PARAM: stack: An array of tokens, in reverse order (i.e. a stack)
	**********************************************************/
	Root.buildTree = function(stack, currentLocation)
	{
		while (stack.length > 0)
		{
			var token = stack.pop();

            //console.log("before catch; token.tokenType = " + token.tokenType);
			switch (token.tokenType)
			{
				case tree.Token.numberType:
                //    console.log("numberType, tokenType = " + token.tokenType
                //                + "; numerator = " + token.tokenValue.numerator
                //                + "; denominator = " + token.tokenValue.denominator);
                    var newNode = new tree.Numerical(token.tokenValue.numerator, token.tokenValue.denominator);
                    //console.log("currentLocation bf insert = " + currentLocation + "; newNode = " + newNode);
                    
					currentLocation = insertNewNode(currentLocation, newNode);
                    //console.log("currentLocation af insert = " + currentLocation);
					break;

				case tree.Token.functionType:
					currentLocation = getFunction(token, currentLocation);
					break;

				case tree.Token.leftParenType:
					currentLocation = insertNewNode(currentLocation, new tree.Parenthesis(token.tokenValue));
					break;

				case tree.Token.variableType:
					if (token.tokenValue === "...")
						currentLocation = insertNewNode(currentLocation, new tree.Ellipsis());
					else
						currentLocation = insertNewNode(currentLocation, new tree.Variable(token.tokenValue));
					break;

				case tree.Token.unaryNeg:
					if (stack[stack.length - 1].tokenType === tree.Token.numberType)
					{
						currentLocation = insertNewNode(currentLocation,
                                                new tree.Numerical(-1*stack[stack.length - 1].tokenValue.numerator,
                                                                   stack[stack.length - 1].tokenValue.denominator));
						stack.pop();
					}
					else
					{
						currentLocation = insertNewNode(currentLocation, new tree.ImpliedMultiplication());
                        if (currentLocation)
                        {
                            currentLocation.leftNode = new tree.Numerical(-1);
                            currentLocation.leftNode.implied = true; // for checkForOne() to use
		                    currentLocation.leftNode.parentNode = currentLocation;
                            Root.buildTree(stack, currentLocation);
                        }
                        else
                            console.log("unaryNeg (not a number) failed to insert new node!")
					}
					break;

				case tree.Token.parenFunctionType:
                    var func = token.getFunction();
                    //if (func !== undefined && func != "Unknown function")
                    try {
                        currentLocation = insertNewNode(currentLocation, new tree[token.getFunction()]);
                    }
                    catch(err){
                        //trace("token deosn't have a function!");
                    }
					break;
                
                default:
                    console.log("no catch; token.tokenType = " + token.tokenType);
					break;
			}
		}

		var tempNode = currentLocation;
        if (!currentLocation)
            console.log("no currentLocation; token.tokenType = " + token.tokenType);
        
		while (tempNode && tempNode.parentNode !== null)
			tempNode = tempNode.parentNode;

		return tempNode;
	}

	//=======================================================
	// Helper for buildTree
	//=======================================================
	function getFunction(token, currentLocation)
	{
		var hasParams = {
			Inequality: true,
			UnknownEquality: true,
			BooleanOperator: true
		};

		var func = token.getFunction();	// Function name, which is also the class (in the Equiv namespace)
		var params = hasParams[func] ? token.tokenValue : undefined;	// A few constructors take token.tokenValue as a parameter

        //console.log("func= " + func);

		var op = new tree[func](params);

		// Finally, insert the new node and return the updated currentLocation
		return insertNewNode(currentLocation, op)
	}

	/*************************************************
	 * This function duplicates the given tree and
	 * returns a root of the tree. This can be used
	 * to duplicate subtrees of bigger trees.
	 *************************************************/
	Root.createDuplicateTree = function(topNode)
	{
		var root = new Root();
		root.rootNode = topNode.duplicateTree(root);
		return root;
	}

	/***********************************************
	 * This function creates a MathTree that
	 * represents the given string and returns the
	 * root of that tree.
	 ***********************************************/
	Root.createTree = function(equation)
	{
		var root = new Root();
		root.createTreeWithRoot(equation);
		return root;
	}

	/***********************************************************
	 * This function takes two roots as its arguments and
	 * attempts to substitute the first equation into the second
	 * one. For this to happen the first equation must be solved
	 * for a variable. It returns the root of the new tree if a
	 * substitution was possible, null otherwise.
	 ************************************************************/
	Root.substitute = function(subEquation, subIntoEquation)
	{
		if (subEquation.rootNode.leftNode instanceof tree.Variable || subEquation.rootNode.rightNode instanceof tree.Variable)
		{
			var variable;
			var subRoot;
			var newRoot = subIntoEquation.duplicateTree();

			if (subEquation.rootNode.leftNode instanceof tree.Variable)
			{
				variable = subEquation.rootNode.leftNode.n;
				subRoot = subEquation.rootNode.rightNode.duplicateTree(newRoot);
			}
			else{
				variable = subEquation.rootNode.rightNode.n;
				subRoot = subEquation.rootNode.leftNode.duplicateTree(newRoot);
			}

			var varMatch = newRoot.rootNode.findVariable(variable);
			if (varMatch.parentNode instanceof tree.Addition
                || (varMatch.parentNode instanceof tree.Subtraction
                    && varMatch.parentNode.leftNode === varMatch))
			{
				subRoot.parentNode = varMatch.parentNode;
				varMatch.parentNode.assignNodeNewChild(varMatch, subRoot);
			}
			else
			{
				var paren = new tree.Parenthesis("(");
				paren.middleNode = subRoot;
				subRoot.parentNode = paren;
				paren.parentNode = varMatch.parentNode;
				varMatch.parentNode.assignNodeNewChild(varMatch, paren);
			}

			return newRoot;
		}
		else
			return null;
	}

	/*******************************************************
	 * This function takes two roots as its arguments and
	 * attempts to substitute one equation into another. For
	 * this to happen one equation must be solved for a
	 * variable. If both equations are solved for a variable
	 * then it will sub equation1 into equation2. It returns
	 * the root of the new tree if a substitution was possible,
	 * null otherwise.
	 ********************************************************/
	Root.substituteEquations = function(equation1, equation2)
	{
		var subEquation;
		var subIntoEquation;

		if (equation1.rootNode.leftNode instanceof tree.Variable
            || equation1.rootNode.rightNode instanceof tree.Variable)
		{
			subEquation = equation1;
			subIntoEquation = equation2;
		}
		else if (equation2.rootNode.leftNode instanceof tree.Variable
                 || equation2.rootNode.rightNode instanceof tree.Variable)
		{
			subEquation = equation2;
			subIntoEquation = equation1;
		}
		else{
			return null;
		}

		return Root.substitute(subEquation, subIntoEquation);
	}

//==========================================================================
// PRIVATE FUNCTIONS
//==========================================================================
	function buildTreeFromStack(stack, root)
	{
//r		root.rootNode = null;
		root.rootNode = Root.buildTree(stack, null);
        if (root.rootNode)
        {
            root.rootNode.setRoot(root);

            // conver all power of 0.5 nodes to sqrt:
            root.rootNode.checkAnyChildren("convertPowersToSqrt");
    
            if (root.rootNode instanceof tree.Power)
                root.convertPowersToSqrt();
        }
        else
            console.log("no rootNode for: " + stack);
	}

	/**********************************************************
	 * This function is used by the combineLikeTerms function.
	 **********************************************************/
	function createStringFromObject(obj)
	{
		var equation = "";
		for (var prop in obj){
			if (prop !== "changed"){
				if (obj[prop].numerator !== 0){
					if (prop === "constant"){
						equation += obj[prop].numerator;
						if (obj[prop].denominator !== 1)
							equation += " / " + obj[prop].denominator;
					}
					else{
						if (obj[prop].numerator !== 1 || obj[prop].denominator !== 1){
							equation += obj[prop].numerator;
							if (obj[prop].denominator !== 1)
								equation += " / " + obj[prop].denominator;
							equation += " * " + prop;
						}
						else
							equation += prop;
					}
					equation += "+";
				}
			}
		}
		equation = equation.substr(0, equation.length - 1);

		if (equation === "")
			equation = "0";

		return equation;
	}

	/******************************************************
	 * This function inserts a new node into the tree, based
	 * on where the last node was inserted. This function
	 * is used to build up a completely formatted tree from
	 * a post-fix expression. It returns the node that was
	 * inserted.
	 *******************************************************/
	function insertNewNode(currentLocation, node)
	{
		if (!currentLocation)  //there are no nodes in the tree
			return node;
		else
		{
			if (!currentLocation.isFull())
			{
				currentLocation.insertBalancedNode(node);
				return node;
			}
			else
			{
				while (currentLocation.isFull() && currentLocation.parentNode !== null)
					currentLocation = currentLocation.parentNode;
                    
//                console.log("isFull() = " + currentLocation.isFull() + "; location = " + currentLocation.getTreeAsString());
				if (currentLocation.isFull())
                {
					console.log("error encountered at " + currentLocation.getTreeAsString() + " "
                          + currentLocation.parentNode);
                }
				else
				{
					currentLocation.insertBalancedNode(node);
					return node;
				}
			}
		}
	}

module.exports = Root;
},{"./parser":34,"./tree":47,"underscore":61}],39:[function(require,module,exports){
//==========================================================================
// Tree node type Function
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Calculator.MathTree.Secant extends TrigFunction
var tree = require('./tree');	// node tree helper file

	//=======================================================
	// Constructor
	//=======================================================
	Secant = function()
	{
		tree.TrigFunction.call(this);	// Call the parent constructor (was super())

		this.className = "Secant";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	Secant.prototype = new tree.TrigFunction();
	Secant.prototype.constructor = Secant;


	//=======================================================
	//=======================================================
	Secant.prototype.evaluateNode = function(variableValue)
	{
		var eval = this.middleNode.evaluateNode(variableValue);
		var val = eval.numerator / eval.denominator;

		var a = 1/Math.cos(val);
		var frac = new tree.Fraction(a);
		return frac;
	}

	//=======================================================
	//=======================================================
	Secant.prototype.getApproximateValueOfTree = function(variables)
	{
		var temp = 1/Math.cos(this.middleNode.getApproximateValueOfTree(variables));

		temp = temp*Math.pow(10, 6);
		temp = Math.floor(temp);
		temp = temp/Math.pow(10,6);

		return temp;
	}

	//=======================================================
	//=======================================================
	Secant.prototype.evaluateNodeWithVariables = function(variables)
	{
		var eval = this.middleNode.evaluateNodeWithVariables(variables);
		var val = eval.numerator / eval.denominator;

		var a = 1/Math.cos(val);
		var frac = new tree.Fraction(a);

		return frac;
	}

	//=======================================================
	//=======================================================
	Secant.prototype.getTreeAsString = function(isDecimal)
	{
		var tempString = "sec(";
		if (this.middleNode !== null)
			tempString += this.middleNode.getTreeAsString(isDecimal);
		tempString += ")";

		return tempString;
	}

	//=======================================================
	//=======================================================
	Secant.prototype.getNodeAsString = function(isDecimal)
	{
		return "sec()";
	}

module.exports = Secant;

},{"./tree":47}],40:[function(require,module,exports){
//==========================================================================
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Calculator.MathTree.Sigma extends Operator{
var tree = require('./tree');	// node tree helper file

	//=======================================================
	// Constructor
	//=======================================================
	Sigma = function()
	{
		tree.Operator.call(this);	// Call the parent constructor (was super())

		this.className = "Sigma";
		this.middleNode = null;
	}

	//=======================================================
	// Inheritance
	//=======================================================
	Sigma.prototype = new tree.Operator();
	Sigma.prototype.constructor = Sigma;


	//=======================================================
	//=======================================================
	Sigma.prototype.canSimplifyNode = function()
	{
		return true;
	}

	//=======================================================
	//=======================================================
	Sigma.prototype.getTreeAsString = function(isDecimal)
	{
		var tempString = "sigma(";
		if (this.rightNode !== null)
			tempString += this.rightNode.getTreeAsString(isDecimal);

		tempString += ", ";

		if (this.leftNode !== null)
			tempString += this.leftNode.getTreeAsString(isDecimal);

		tempString += ", ";

		if (this.middleNode !== null)
			tempString += this.middleNode.getTreeAsString(isDecimal);

		tempString += ")";
		return tempString;
	}

	//=======================================================
	//=======================================================
	Sigma.prototype.getNodeAsString = function(isDecimal)
	{
		return this.getTreeAsString(isDecimal);
	}

	//=======================================================
	//=======================================================
	Sigma.prototype.duplicateTree = function(root)
	{
		var tempNode = Sigma(duplicateNode(root));

		if (this.middleNode !== null)
		{
			tempNode.middleNode = this.middleNode.duplicateTree(root);
			tempNode.middleNode.parentNode = tempNode;
		}
		else
			tempNode.middleNode = null;

		if (this.leftNode !== null)
		{
			tempNode.leftNode = this.leftNode.duplicateTree(root);
			tempNode.leftNode.parentNode = tempNode;
		}
		else
			tempNode.leftNode = null;

		if (this.rightNode !== null)
		{
			tempNode.rightNode = this.rightNode.duplicateTree(root);
			tempNode.rightNode.parentNode = tempNode;
		}
		else
			tempNode.rightNode = null;

		return tempNode;
	}

	//=======================================================
	//=======================================================
	Sigma.prototype.getTopValue = function()
	{
		return this.leftNode;
	}

	//=======================================================
	//=======================================================
	Sigma.prototype.getBottomValue = function()
	{
		return this.rightNode;
	}

	//=======================================================
	//=======================================================
	Sigma.prototype.getApproximateValueOfTree = function(variables)
	{
		return null;
	}

	//=======================================================
	//=======================================================
	Sigma.prototype.evaluateNodeWithVariables = function(variables)
	{
		return null;
	}

	//=======================================================
	//=======================================================
	Sigma.prototype.evaluateNode = function(variableValue)
	{
		return null;
	}

	//=======================================================
	//=======================================================
	Sigma.prototype.isFull = function()
	{
		return (this.middleNode !== null &&
				this.leftNode !== null &&
				this.rightNode !== null)
	}

	//=======================================================
	//=======================================================
	Sigma.prototype.assignNodeNewChild = function(matchingNode, newNode)
	{
		if (this.middleNode === matchingNode)
			this.middleNode = newNode;
		else if (this.leftNode === matchingNode)
			this.leftNode = newNode;
		else if (this.rightNode === matchingNode)
			this.rightNode = newNode;
	}

	//=======================================================
	//=======================================================
	Sigma.prototype.insertBalancedNode = function(node)
	{
		if (this.middleNode === null)
		{
			this.middleNode = node;
			node.parentNode = this;
		}
		else if (this.leftNode === null)
		{
			this.leftNode = node;
			node.parentNode = this;
		}
		else
		{
			this.rightNode = node;
			node.parentNode = this;
		}
	}

	//=======================================================
	//=======================================================
	Sigma.prototype.getChildren = function()
	{
		return [this.leftNode, this.rightNode, this.middleNode];
	}

module.exports = Sigma;

},{"./tree":47}],41:[function(require,module,exports){
//==========================================================================
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Calculator.MathTree.Sine extends TrigFunction
var tree = require('./tree');	// node tree helper file

	//=======================================================
	// Constructor
	//=======================================================
	Sine = function()
	{
		tree.TrigFunction.call(this);	// Call the parent constructor (was super())

		this.className = "Sine";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	Sine.prototype = new tree.TrigFunction();
	Sine.prototype.constructor = Sine;


	//=======================================================
	//=======================================================
	Sine.prototype.evaluateNode = function(variableValue)
	{
		var eval = this.middleNode.evaluateNode(variableValue);
		var val = eval.numerator / eval.denominator;

		var a = Math.sin(val);
		var frac = new tree.Fraction(a);
		return frac;
	}

	//=======================================================
	//=======================================================
	Sine.prototype.getApproximateValueOfTree = function(variables)
	{
		var temp = Math.sin(this.middleNode.getApproximateValueOfTree(variables));
		temp *= Math.pow(10, 6);
		temp = Math.floor(temp);
		temp /= Math.pow(10,6);
		return temp;
	}

	//=======================================================
	//=======================================================
	Sine.prototype.evaluateNodeWithVariables = function(variables)
	{
		var eval = this.middleNode.evaluateNodeWithVariables(variables);

		var val = eval.numerator / eval.denominator;

		var a = Math.sin(val);
		return new tree.Fraction(a);
	}

	//=======================================================
	//=======================================================
	Sine.prototype.getTreeAsString = function(isDecimal)
	{
		var tempString = "sin(";

		if (this.middleNode !== null)
			tempString += this.middleNode.getTreeAsString(isDecimal);

		tempString += ")";
		return tempString;
	}

	//=======================================================
	//=======================================================
	Sine.prototype.getNodeAsString = function(isDecimal)
	{
		return "sin()";
	}

module.exports = Sine;

},{"./tree":47}],42:[function(require,module,exports){
//==========================================================================
// Tree node type: Square roots
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Calculator.MathTree.SquareRoot extends NRoot{
var tree = require('./tree');	// node tree helper file

//	var minMiddleWidth = 15;	// Not used in this module.  Perhaps accessed externally?
//	var MIDDLEBUFFER = 10;		// Not used in this module.  Perhaps accessed externally?

	//=======================================================
	// Constructor
	//=======================================================
	SquareRoot = function(type)
	{
		tree.NRoot.call(this);	// Call the parent constructor (was super())

		this.className = "SquareRoot";

		// All data is stored in the middle note (nRoots use the left and right node -- shouldn't this just be an nRoot with a forced 2 for the right node??
		this.middleNode = null;
	}

	//=======================================================
	// Inheritance
	//=======================================================
	SquareRoot.prototype = new tree.NRoot();
	SquareRoot.prototype.constructor = SquareRoot;


/*************************************************************/
/*   	FUNCTIONS THAT RETURN INFO ABOUT THE GIVEN TREE		 */
/*************************************************************/
/*
	//=======================================================
	//=======================================================
	SquareRoot.prototype.canSimplifyNode = function()
	{
		return true;
	}
*/
	//=======================================================
	//=======================================================
	SquareRoot.prototype.duplicateTree = function(root)
	{
		var tempNode = this.duplicateNode(root);

		if (this.middleNode !== null)
		{
			tempNode.middleNode = this.middleNode.duplicateTree(root);
			tempNode.middleNode.parentNode = tempNode;
		}
		else
			tempNode.middleNode = null;

		return tempNode;
	}
/*
	//=======================================================
	//=======================================================
	SquareRoot.prototype.findLikeTerms = function(terms, isNegative)
	{
		var term = this.getTreeAsString();
		var coefficient;

		if (isNegative)
			coefficient = new tree.Fraction(-1);
		else
			coefficient = new tree.Fraction(1);

		if (terms.hasOwnProperty(term))
		{
			var oldCoefficient = terms[term];
			terms[term] = Fraction.plus(oldCoefficient, coefficient);
			terms.changed = true;
		}
		else
		{
//r			terms.addProperty(term);
			terms[term] = coefficient;
		}
	}
*/
	//=======================================================
	//=======================================================
	SquareRoot.prototype.getBase = function()
	{
		return this.middleNode;
	}

	//=======================================================
	//=======================================================
	SquareRoot.prototype.getChildren = function()
	{
		var children = [];
		if (this.middleNode !== null)
			children.push(this.middleNode);
		return children;
	}

	//=======================================================
	//=======================================================
	SquareRoot.prototype.getExponentValue = function()
	{
			return new tree.Fraction(1, 2);
	}

	//=======================================================
	//=======================================================
	SquareRoot.prototype.getTreeAsString = function(isDecimal)
	{
		var tempString = "sqrt( ";

		if (this.middleNode !== null)
			tempString += this.middleNode.getTreeAsString(isDecimal);

		tempString += " )";

		return tempString;
	}

	//=======================================================
	//=======================================================
	SquareRoot.prototype.isFull = function()
	{
		if (this.middleNode !== null)
			return true;
		else
			return false;
	}

	//=======================================================
	//=======================================================
	SquareRoot.prototype.isRadical = function()
	{
		if (this.middleNode.countRadicals() > 1)
			return false;

		return tree.NRoot.prototype.isRadical.call(this);
	}

/*************************************************************/
/*  	 	FUNCTIONS THAT MODIFY THE GIVEN TREE			 */
/*************************************************************/

	//=======================================================
	//=======================================================
	SquareRoot.prototype.assignNodeNewChild = function(matchingNode, newNode)
	{
		if (this.middleNode === matchingNode)
			this.middleNode = newNode;
	}

	//=======================================================
	//=======================================================
	SquareRoot.prototype.combineSquareRoots = function(isNumerator)
	{
		return {
			changed: false,
			squareRoot: this,
			isNumerator: isNumerator
		};
	}

	//=======================================================
	//=======================================================
	SquareRoot.prototype.insertBalancedNode = function(node)
	{
		if (this.middleNode === null)
		{
			this.middleNode = node;
			node.parentNode = this;
		}
	}

	//=======================================================
	//=======================================================
	SquareRoot.prototype.getApproximateValueOfTree = function(variables, bForcePositive)
	{
		var base = this.getBase().getApproximateValueOfTree(variables);
        if (bForcePositive)
            base = Math.abs(base);

		var tempPow = this.getExponentValue();

		var power = tempPow.numerator / tempPow.denominator;

		return Math.pow(base, power);
	}

	//=======================================================
	// This takes an Object parameter: hash of variables
	//
	// Returns a Fraction
	//=======================================================
	SquareRoot.prototype.evaluateNodeWithVariables = function(variables)
	{
		var evalBase = this.middleNode.evaluateNodeWithVariables(variables);
		var degree = 0.5;

		evalBase.numerator = Math.pow(evalBase.numerator, degree);
		evalBase.denominator = Math.pow(evalBase.denominator, degree);
		return evalBase;
	}

	//=======================================================
	// This takes a Fraction parameter
	//
	// Returns a Fraction
	//=======================================================
	SquareRoot.prototype.evaluateNode = function(variableValue)
	{
		var evalBase = this.middleNode.evaluateNode(variableValue);
		var degree = 0.5;

		evalBase.numerator = Math.pow(evalBase.numerator, degree);
		evalBase.denominator = Math.pow(evalBase.denominator, degree);

		return evalBase;
	}
/*
	//=======================================================
	// check if there is any perfect square inside square root
	//
	// Returns False: no perfect square
	//=======================================================
	SquareRoot.prototype.checkPerfectPower = function()
	{
		if (this.middleNode instanceof tree.Numerical)
			return this.middleNode.number.isPerfectSquare();
            
        return false;
	}
*/    
module.exports = SquareRoot;

},{"./tree":47}],43:[function(require,module,exports){
//==========================================================================
// Tree node type: Subtraction
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Calculator.MathTree.Subtraction extends HorizontalOperator
var tree = require('./tree');	// General math tools

	//=======================================================
	// Constructor
	//=======================================================
	Subtraction = function()
	{
		tree.AddSubtractBase.call(this);	// Call the parent constructor (was super())

		this.n = String.fromCharCode(0x2212);
		this.precedence = 5;
		this.className = "Subtraction";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	Subtraction.prototype = new tree.AddSubtractBase();
	Subtraction.prototype.constructor = Subtraction;

/*************************************************************/
/*   	FUNCTIONS THAT RETURN INFO ABOUT THE GIVEN TREE		 */
/*************************************************************/
/*
	//=======================================================
	//=======================================================
	Subtraction.prototype.canRemoveZero = function()
	{
		return true;
	}

	//=======================================================
	//=======================================================
	Subtraction.prototype.countTerms = function()
	{
		var terms = 0;
		var childTerms = 0;
		var child;
		var myChildren = this.getChildren();

		while (myChildren.length > 0)
		{
			child = myChildren.pop();
			if (child !== null)
			{
				childTerms = child.countTerms();
				if (childTerms === 0)
					terms++;
				else
					terms += childTerms;
			}
		}

		return terms;
	}
*/
	//=======================================================
	//=======================================================
	Subtraction.prototype.findLikeTerms = function(terms, isNegative)
	{
		if (this.leftNode !== null)
			this.leftNode.findLikeTerms(terms, isNegative);
		if (this.rightNode !== null)
		{
			if (this.parentNode instanceof tree.AddSubtractBase)
            {
                this.rightNode.findLikeTerms(terms, !isNegative);

                var variables = {};
                this.parentNode.findAllVariableGroups(variables);
    
                for (var prop in variables)
                {
                    if (variables[prop] > 1)
                        terms.changed = true;
                }
            }
			else
				this.rightNode.findLikeTerms(terms, !isNegative);
		}
	}

	//=======================================================
	//=======================================================
	Subtraction.prototype.getNumerical = function()
	{
		if (this.leftNode instanceof tree.Numerical)
			return this.leftNode.number;
		else if (this.rightNode instanceof tree.Numerical)
			return tree.Fraction.multiply(this.rightNode.number, new tree.Fraction(-1));
		else
			return undefined;
	}

	//=======================================================
	//=======================================================
	Subtraction.prototype.getPolyTerms = function(polyList)
	{
		// //trace("in get poly terms substr");
		// //trace(this.getTreeAsString());
		// //trace(this.leftNode.getTreeAsString());
		// //trace(this.rightNode.getTreeAsString());
		if (this.leftNode instanceof tree.Addition || this.leftNode instanceof Subtraction)
		{
			var tempNode = new tree.Multiplication();
			tempNode.rightNode = this.rightNode.duplicateTree(this.rootNode);
			tempNode.rightNode.parentNode = tempNode;
			tempNode.leftNode = new tree.Numerical(-1);
			tempNode.leftNode.parentNode = tempNode;
			polyList.push(tempNode);
			this.leftNode.getPolyTerms(polyList);
		}
		else
		{
			//This means that we are at the end of the line
			polyList.push(this.leftNode.duplicateTree(this.rootNode));

			var tempNode = new tree.Multiplication();
			tempNode.rightNode = this.rightNode.duplicateTree(this.rootNode);
			tempNode.rightNode.parentNode = tempNode;
			tempNode.leftNode = new tree.Numerical(-1);
			tempNode.leftNode.parentNode = tempNode;
			polyList.push(tempNode);
		}
	}

	//=======================================================
	//=======================================================
	Subtraction.prototype.getPolyCoefficient = function()
	{
		var leftDegree = this.leftNode.getDegree();
		var rightDegree = this.rightNode.getDegree();

		if (leftDegree > rightDegree)
			return this.leftNode.getPolyCoefficient();
		else if (leftDegree < rightDegree)
			return tree.Fraction.multiply(new tree.Fraction(-1), this.rightNode.getPolyCoefficient());
		else
			return tree.Fraction.minus(this.leftNode.getPolyCoefficient(), this.rightNode.getPolyCoefficient());
	}
/*
	//=======================================================
	//=======================================================
	Subtraction.prototype.isOrderedPolynomial = function()
	{
		if (this.leftNode instanceof tree.Addition || this.leftNode instanceof Subtraction)
		{
			if (this.leftNode.rightNode.getDegree() <= this.rightNode.getDegree())
				return false;
			else
				return this.leftNode.isOrderedPolynomial();
		}
		else
		{
			if (this.leftNode.getDegree() <= this.rightNode.getDegree())
				return false;
			else
				return true;
		}
	}
*/
/*************************************************************/
/*  	 	FUNCTIONS THAT MODIFY THE GIVEN TREE			 */
/*************************************************************/

	//=======================================================
	//=======================================================
	Subtraction.prototype.distribute = function()
	{
		if (this.rightNode instanceof tree.Parenthesis)
		{
			this.rightNode.middleNode.parentNode = this;
			this.rightNode = this.rightNode.middleNode;
		}

		if (this.rightNode instanceof tree.Addition || this.rightNode instanceof Subtraction)
		{
			this.rightNode.distributeNegative();
			var newOp = new tree.Addition();
			newOp.setRoot(this.rootNode);
			newOp.leftNode = this.leftNode;
			newOp.rightNode = this.rightNode;
			newOp.leftNode.parentNode = newOp;
			newOp.rightNode.parentNode = newOp;
			newOp.parentNode = this.parentNode;
			if (this.rootNode.rootNode === this)
				this.rootNode.rootNode = newOp;
			else
				this.parentNode.assignNodeNewChild(this, newOp);

			return true;
		}

		return tree.HorizontalOperator.prototype.distribute.call(this);
	}

	//=======================================================
	//=======================================================
	Subtraction.prototype.distributeNode = function(node, distributeRight)
	{
		// //trace("distribute node subtraction");
		return distribute();
	}

	//=======================================================
	//=======================================================
	Subtraction.prototype.doubleNegative = function()
	{
		// //trace("in double negative");
		var doubleNegatives = false;

		if (this.leftNode !== null)
			doubleNegatives = this.leftNode.doubleNegative() || doubleNegatives;

		if (this.rightNode !== null)
			doubleNegatives = this.rightNode.doubleNegative() || doubleNegatives;

		if (this.rightNode !== null)
		{
			// //trace("right node not null");
			// //trace(this.rightNode.getTreeAsString());
			// //trace(this.leftNode.getTreeAsString());

			if (this.rightNode instanceof tree.Numerical && this.rightNode.isNegative())
			{
				var tempNode = new tree.Addition();
				this.rightNode.updateValue(tree.Fraction.multiply(this.rightNode.number, new tree.Fraction(-1)));

				//changed
				// //trace("changing in double negative");
				tempNode.leftNode = this.leftNode;
				tempNode.leftNode.parentNode = tempNode;
				tempNode.rightNode = this.rightNode;
				tempNode.rightNode.parentNode = tempNode;
				tempNode.parentNode = this.parentNode;
				this.parentNode.assignNodeNewChild(this, tempNode);
				this.parentNode = null;
				this.leftNode = null;
				this.rightNode = null;

				tempNode.rootNode = this.rootNode;
				if (tempNode.parentNode === null)
					tempNode.rootNode.rootNode = tempNode;

				return true;
			}
			else if (this.rightNode instanceof tree.Multiplication)
			{
				//check if leftnode is negative number
				// //trace("right node is multiplication");
				// //trace(this.rightNode.getTreeAsString());
				// //trace(this.rightNode.leftNode.getTreeAsString());
				// //trace(this.rightNode.rightNode.getTreeAsString());
				var lastMultNode = this.rightNode.leftNode;
				while (lastMultNode instanceof tree.Multiplication)
				{
					lastMultNode = lastMultNode.leftNode;
				}
				//if (this.rightNode.leftNode instanceof tree.Numerical && this.rightNode.leftNode.isNegative())
				if (lastMultNode instanceof tree.Numerical && lastMultNode.isNegative())
				{
					var tempNode = new tree.Addition();
					lastMultNode.updateValue(tree.Fraction.multiply(lastMultNode.number, new tree.Fraction(-1)));
					//changed
					tempNode.leftNode = this.leftNode;
					tempNode.leftNode.parentNode = tempNode;
					tempNode.rightNode = this.rightNode;
					tempNode.rightNode.parentNode = tempNode;
					tempNode.parentNode = this.parentNode;
					this.parentNode.assignNodeNewChild(this, tempNode);

					tempNode.rootNode = this.rootNode;
					if (tempNode.parentNode === null)
						tempNode.rootNode.rootNode = tempNode;

					if (this.parentNode.parentNode === null)
							this.parentNode.rootNode.rootNode = this.parentNode;

					return true;
				}
			}
		}

		return doubleNegatives;
	}
/*
	//=======================================================
	//=======================================================
	Subtraction.prototype.orderPolynomial = function()
	{
		var swapped = false;
		var rightDegree =  this.rightNode.getDegree();
		var leftDegree;
		// //trace("ordering poly in substraction");
		// //trace(this.leftNode.getTreeAsString());
		// //trace(this.rightNode.getTreeAsString());
		if (this.leftNode instanceof tree.Addition || this.leftNode instanceof Subtraction)
		{
			// //trace("we have an addition or substraction");
			swapped = this.leftNode.orderPolynomial();

			leftDegree = this.leftNode.rightNode.getDegree();
			if (leftDegree < rightDegree)
			{
				//now we need to swap the subtrees, including the operator.
				var tempNode = this.leftNode;
				this.leftNode = tempNode.leftNode;
				this.leftNode.parentNode = this;
				tempNode.leftNode = this;
				tempNode.parentNode = this.parentNode;
				this.parentNode.assignNodeNewChild(this, tempNode);
				this.parentNode = tempNode;
				if (this.rootNode.rootNode === this)
					this.rootNode.rootNode = tempNode;
				swapped = true;
			}
		}
		else
		{
			// //trace("we didnt find add or sub as childs");
			//This means that we are at the end of the line
			leftDegree = this.leftNode.getDegree();

			if (leftDegree < rightDegree)
			{

				//now we need to swap the subtrees, but since this
				//is subtraction we need to deal with making new operators

				var addNode = new tree.Addition();
				addNode.rightNode = this.leftNode;
				addNode.rightNode.parentNode = addNode;
				addNode.parentNode = this.parentNode;
				if (this.parentNode !== null)
					this.parentNode.assignNodeNewChild(this, addNode);
				else this.rootNode.rootNode = addNode;

				addNode.leftNode = this;
				this.parentNode = addNode;
				this.leftNode = null;
				// //trace("creating the new add node");
				// //trace(addNode.getTreeAsString());
				// //trace(rootNode.getTreeAsString());
				swapped = true;
			}

		}
		return swapped;
	}
*/
	//=======================================================
	//=======================================================
	Subtraction.prototype.performApproximateOp = function(op1, op2)
	{
		return op1 - op2;
	}

	//=======================================================
	//=======================================================
	Subtraction.prototype.performOp = function(op1, op2)
	{
		return tree.Fraction.minus(op1, op2);
	}

	//=======================================================
	//=======================================================
	Subtraction.prototype.removeNulls = function()
	{
		var removedNulls = false;

		if (this.leftNode !== null)
			removedNulls = this.leftNode.removeNulls() || removedNulls;

		if (this.rightNode !== null)
			removedNulls = this.rightNode.removeNulls() || removedNulls;

		if (this.parentNode && this.rightNode === null)
		{
			this.parentNode.assignNodeNewChild(this, this.leftNode);
			this.leftNode.parentNode = this.parentNode;

			if (this.rootNode.rootNode === this)
				this.rootNode.rootNode = this.leftNode;

			return true;
		}
		else if (this.leftNode === null)
		{
			var tempNode = new tree.Multiplication();
			var amount = new tree.Numerical(-1);

			Node.insertLeft(amount, tempNode);

			tempNode.parentNode = this.parentNode;
			tempNode.rightNode = this.rightNode;
			tempNode.rightNode.parentNode = tempNode;
			tempNode.parentNode.assignNodeNewChild(this, tempNode);
			tempNode.setRoot(this.rootNode);

			if (this.rootNode.rootNode === this)
				this.rootNode.rootNode = tempNode;

			//need to distribute here
			tempNode.simplify();
			tempNode.removeNulls();
		}
		return removedNulls;
	}

/*************************************************************/
/*						PRIVATE FUNCTIONS					 */
/*************************************************************/

	//=======================================================
	//=======================================================
	Subtraction.prototype.canSimplifyNode = function()
	{
		return true;
	}

	//=======================================================
	//=======================================================
	Subtraction.prototype.combineNumericals = function(leftObject, rightObject, reduceFracs)
	{
		var finalObject = {changed:true};
		var leftNum = leftObject.Numerical.number;
		var rightNum = rightObject.Numerical.number;

		if (leftObject.isOpposite)
			leftNum = this.getOpposite(leftNum);
		if (rightObject.isOpposite)
			rightNum = this.getOpposite(rightNum);

		var newNum = this.performOp(leftNum, rightNum);
		// //trace("combinenumerical substract " + reduceFracs);

		if (reduceFracs)
			var reduced = newNum.reduce();

		if (!leftObject.isOpposite)
		{
			leftObject.Numerical.updateValue(newNum);
			rightObject.Numerical.deleteNode();
			finalObject.Numerical = leftObject.Numerical;
			finalObject.isOpposite = leftObject.isOpposite;
		}
		else if (rightObject.isOpposite)
		{
			//Here we want to put it on the right only if it is the opposite
			//because the right side of a subtraction is already opposite.
			rightObject.Numerical.updateValue(newNum);
			leftObject.Numerical.deleteNode();
			finalObject.Numerical = rightObject.Numerical;
			finalObject.isOpposite = !rightObject.isOpposite;
		}
		else
		{
			newNum = this.getOpposite(newNum);
			leftObject.Numerical.updateValue(newNum);
			rightObject.Numerical.deleteNode();
			finalObject.Numerical = leftObject.Numerical;
			finalObject.isOpposite = leftObject.isOpposite;
		}

		this.removeNulls();
		return finalObject;
	}

	//=======================================================
	//=======================================================
	Subtraction.prototype.getNodeAsString = function()
	{
		return this.n;
	}

	//=======================================================
	//=======================================================
	Subtraction.prototype.replaceNumerical = function(num)
	{
		if (this.leftNode instanceof tree.Numerical)
			this.leftNode.updateValue(num);
		else if (this.rightNode instanceof tree.Numerical)
			this.rightNode.updateValue(tree.Fraction.multiply(num, new tree.Fraction(-1)));
	}

module.exports = Subtraction;
},{"./tree":47}],44:[function(require,module,exports){
//==========================================================================
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Calculator.MathTree.Tangent extends TrigFunction
var tree = require('./tree');	// node tree helper file

	//=======================================================
	// Constructor
	//=======================================================
	Tangent = function()
	{
		tree.TrigFunction.call(this);	// Call the parent constructor (was super())

		this.className = "Tangent";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	Tangent.prototype = new tree.TrigFunction();
	Tangent.prototype.constructor = Tangent;


	//=======================================================
	//=======================================================
	Tangent.prototype.evaluateNode = function(variableValue)
	{
		var eval = this.middleNode.evaluateNode(variableValue);
		var val = eval.numerator / eval.denominator;

		var a = Math.tan(val);
		var frac = new tree.Fraction(a);
		return frac;
	}

	//=======================================================
	//=======================================================
	Tangent.prototype.getApproximateValueOfTree = function(variables)
	{
		var temp = Math.tan(this.middleNode.getApproximateValueOfTree(variables));

		temp = temp*Math.pow(10, 6);
		temp = Math.floor(temp);
		temp = temp/Math.pow(10,6);

		return temp;
	}

	//=======================================================
	//=======================================================
	Tangent.prototype.evaluateNodeWithVariables = function(variables)
	{
		var eval = this.middleNode.evaluateNodeWithVariables(variables);
		var val = eval.numerator / eval.denominator;

		var a = Math.tan(val);
		var frac = new tree.Fraction(a);

		return frac;
	}

	//=======================================================
	//=======================================================
	Tangent.prototype.getTreeAsString = function(isDecimal)
	{
		var tempString = "tan(";
		if (this.middleNode !== null)
			tempString += this.middleNode.getTreeAsString(isDecimal);
		tempString += ")";

		return tempString;
	}

	//=======================================================
	//=======================================================
	Tangent.prototype.getNodeAsString = function(isDecimal)
	{
		return "tan()";
	}

module.exports = Tangent;

},{"./tree":47}],45:[function(require,module,exports){
//==========================================================================
// Tree node type: Times (multiplication symbol, as used in scientific notation)
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Calculator.MathTree.Times extends Multiplication
var tree = require('./tree');	// node tree helper file

	//=======================================================
	// Constructor
	//=======================================================
	Times = function()
	{
		tree.Multiplication.call(this);	// Call the parent constructor (was super())

		this.className = "Times";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	Times.prototype = new tree.Multiplication();
	Times.prototype.constructor = Times;

module.exports = Times;

},{"./tree":47}],46:[function(require,module,exports){
//==========================================================================
// Tokenizer.  Works in conjunction with the parser to convert text-based
// formulas into a tree structure.
//
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
/*
This class represents one token in a mathematical expression.
Currently tokens can represent numbers, functions, and parenthesis.
The token class contains the info about precedence.
*/
	//=======================================================
	// Token constructor
	//=======================================================
	Token = function(myType, myValue)
	{
		this.tokenType = myType;
		this.tokenValue = myValue;

		// Functions have a precedence
		if (myType === Token.functionType
            || myType === Token.unaryNeg) // such as minus sign
			this.setPrecendence();
	}

	// Token type enumeration
	Token.numberType = 0;
	Token.functionType = 1;
	Token.leftParenType = 2;
	Token.variableType = 3;
	Token.parenFunctionType = 4;
	Token.unaryNeg = 5;
	Token.ellipsisType = 6;

	//=======================================================
	//=======================================================
	Token.prototype.setPrecendence = function()
	{
		switch (this.tokenValue)
		{
			case "+":
			case "-":
			case "�":
			case String.fromCharCode(0x2212):	// Negative.  These should have been removed during parsing.
			case "\\": // This is a comma for coordinate pairs/triples
				this.precedence = 3;
				break;

			case "*":
			case "/":
			case "#":
			case "div":
			case "~":
			case "$":
				this.precedence = 6;
				break;

			case "=":
			case "<=":
			case ">=":
			case "<":
			case ">":
			case "=?":
			case "<=?":
			case ">=?":
			case "<?":
			case ">?":
			case "!=":
				this.precedence = 1;
				break;

			case "&":
			case "|":
			case "infinitesolutions":
			case "nosolutions":
				this.precedence = 0;
				break;

			case "(":
			case "sin":
			case "cos":
			case "tan":
			case "cot":
			case "sec":
			case "csc":
				this.precedence = 75;
				break;

			default:
				this.precedence = 50;
				break;
		}
	}

	//=======================================================
	// Get the number of operators for a given function
	//=======================================================
	Token.prototype.getNumberOps = function()
	{
		switch (this.tokenValue)
		{
			case "+":
			case "-":
			case "�":
			case "\\":	// Comma
			case "*":
			case "#":
			case "/":
			case "=":
			case String.fromCharCode(0x2212):
			case "<":
			case ">":
			case "<=":
			case ">=":
			case "=?":
			case "<?":
			case ">?":
			case "<=?":
			case ">=?":
			case "!=":
			case "pow":
			case "nroot":
			case "log":
			case "sub":
			case "mix":
			case "&":
			case "|":
			case "infinitesolutions":
			case "nosolutions":
			case "div":
			case "~":
			case "$":
				return 2;
			case "(":
			case "sin":
			case "cos":
			case "tan":
			case "cot":
			case "sec":
			case "csc":
			case "abs":
			case "sqrt":
			case "ln":
				return 1;
			case "sigma":
				return 3;
		}
	}

	//=======================================================
	// Getter function: return a token's precedence
	//=======================================================
	Token.prototype.getPrecedence = function()
	{
		return this.precedence;
	}

	//=======================================================
	// This doesn't appear to be used.
	// It doesn't support many of the functions handled by this class.
	//=======================================================
	Token.prototype.evaluate = function(param1, param2)
	{
		switch (this.tokenValue)
		{
			case "+":
				return param1 + param2;

			case "-":
			case String.fromCharCode(0x2212):
				return param1 - param2;

			case "*":
				return param1 * param2;

			case "/":
				return param1 / param2;

			case "sin":
				return Math.sin(param1);

			case "cos":
				return Math.cos(param1);

			case "tan":
				return Math.tan(param1);
		}
	}

	//=======================================================
	// Returns the name of a function
	// This should probably be named toString for consistency (in JS)
	//=======================================================
	Token.prototype.getFunction = function()
	{
		switch (this.tokenValue)
		{
			case "+":
				return "Addition";
			case "�":
				return "PlusMinus";
			case "\\":
				return "Comma";
			case "...":
				return "Ellipsis";
			case "-":
			case String.fromCharCode(0x2212):
				return "Subtraction";
			case "*":
//			case "#": // treat implied mult as regular mult
				return "Multiplication";
			case "#":
				return "ImpliedMultiplication";
			case "/":
				return "Division";
			case "=":
				return "Equality";
			case "<":
			case ">":
			case "<=":
			case ">=":
			case "!=":
				return "Inequality";
			case "=?":
			case "<?":
			case ">?":
			case "<=?":
			case ">=?":
				return "UnknownEquality";
			case "sin":
				return "Sine";
			case "cos":
				return "Cosine";
			case "tan":
				return "Tangent";
			case "cot":
				return "Cotangent";
			case "sec":
				return "Secant";
			case "csc":
				return "Cosecant";
			case "abs":
				return "AbsoluteValue";
			case "sqrt":
				return "SquareRoot";
			case "pow":
				return "Power";
			case "sub":
				return "Subscript";
			case "nroot":
				return "NRoot";
			case "log":
				return "Logarithm";
			case "ln":
				return "NaturalLog";
			case "sigma":
				return "Sigma";
			case "mix":
				return "MixedNumber";
			case "&":
			case "|":
				return "BooleanOperator";
			case "infinitesolutions":
				return "InfiniteSolutions";
			case "nosolutions":
				return "NoSolutions";
			case "div":
				return "VerticalDivision";
			case "~":
				return "Times";
			case "$":
				return "Divide";
		}

		return "Unknown function";
	}

	//=======================================================
	//=======================================================
	Token.prototype.printToken = function()
	{
		/*// functionType
		if (this.tokenType === Token.functionType)
			//trace("tokenType " + this.getFunction());
		else
			//trace("tokenType (non function) " + this.tokenType + " value = " + this.tokenValue);
        */    
	}

module.exports = Token;
},{}],47:[function(require,module,exports){
//==========================================================================
// Tree - node tree helper file
//==========================================================================
exports.Root = require('./root');
exports.Token = require('./token');
exports.Node = require('./node');
exports.Operator = require('./operator');
exports.HorizontalOperator = require('./horizontalOperator');

exports.Equality = require('./equality');
exports.Inequality = require('./inequality');
exports.Numerical = require('./numerical');
exports.Variable = require('./variable');
exports.BooleanOperator = require('./booleanOperator');
exports.MixedNumber = require('./mixedNumber');

exports.AddSubtractBase = require('./addSubtractBase');
exports.Addition = require('./addition');
exports.Subtraction = require('./subtraction');
exports.MultDivide = require('./multDivide');
exports.Division = require('./division');
exports.Multiplication = require('./multiplication');
exports.ImpliedMultiplication = require('./impliedMultiplication');
exports.Times = require('./times');

exports.FunctionWithParen = require('./functionWithParen');
exports.Parenthesis = require('./parenthesis');
exports.AbsoluteValue = require('./absoluteValue');

exports.Variable = require('./variable');
exports.Ellipsis = require('./ellipsis');

exports.Fraction = require('./fraction');
exports.Comma = require('./comma');
exports.Sigma = require('./sigma');
exports.PlusMinus = require('./plusMinus');

exports.powerNroot = require('./powerNroot');
exports.Power = require('./power');
exports.NRoot = require('./nRoot');
exports.Logarithm = require('./logarithm');
exports.NaturalLog = require('./naturalLog');

exports.TrigFunction = require('./trigFunction');
exports.Cosecant = require('./cosecant');
exports.Cosine = require('./cosine');
exports.Cotangent = require('./cotangent');
exports.Secant = require('./secant');
exports.Tangent = require('./tangent');
exports.Sine = require('./sine');
exports.SquareRoot = require('./squareRoot');

exports.NoSolutions = require('./noSolutions');
exports.InfiniteSolutions = require('./infiniteSolutions');

},{"./absoluteValue":6,"./addSubtractBase":7,"./addition":8,"./booleanOperator":9,"./comma":10,"./cosecant":11,"./cosine":12,"./cotangent":13,"./division":14,"./ellipsis":15,"./equality":16,"./fraction":17,"./functionWithParen":18,"./horizontalOperator":19,"./impliedMultiplication":20,"./inequality":21,"./infiniteSolutions":22,"./logarithm":23,"./mixedNumber":24,"./multDivide":25,"./multiplication":26,"./nRoot":27,"./naturalLog":28,"./noSolutions":29,"./node":30,"./numerical":31,"./operator":32,"./parenthesis":33,"./plusMinus":35,"./power":36,"./powerNroot":37,"./root":38,"./secant":39,"./sigma":40,"./sine":41,"./squareRoot":42,"./subtraction":43,"./tangent":44,"./times":45,"./token":46,"./trigFunction":48,"./variable":49}],48:[function(require,module,exports){
//==========================================================================
// Tree node type: Trig Function
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
//class Calculator.MathTree.TrigFunction extends FunctionWithParen {
var tree = require('./tree');	// node tree helper file

	//=======================================================
	// Constructor
	//=======================================================
	TrigFunction = function()
	{
		tree.FunctionWithParen.call(this);	// Call the parent constructor (was super())

		this.className = "TrigFunction";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	TrigFunction.prototype = new tree.FunctionWithParen();
	TrigFunction.prototype.constructor = TrigFunction;

module.exports = TrigFunction;

},{"./tree":47}],49:[function(require,module,exports){
//==========================================================================
// Tree node type: Variables
// Adapted from the Calculator/MathTree AS Class
//==========================================================================
var tree = require('./tree');	// General math tools

/*  This class represents any numerical value.
    class Variable extends Node
*/

	//=======================================================
	// Constructor
	//=======================================================
	Variable = function(myVar)
	{
		tree.Node.call(this);	// Call the parent constructor (was super())

		this.n = myVar;
		this.precedence = 100;
		this.className = "Variable";
	}

	//=======================================================
	// Inheritance
	//=======================================================
	Variable.prototype = new tree.Node();
	Variable.prototype.constructor = Variable;


/*************************************************************/
/*   	FUNCTIONS THAT RETURN INFO ABOUT THE GIVEN TREE		 */
/*************************************************************/

	//=======================================================
	//=======================================================
	Variable.prototype.duplicateNode = function(root)
	{
		var tempNode = new tree[this.className](this.n);
		tempNode.setRoot(root);
		tempNode.lastAction = this.lastAction;
		return tempNode;
	}

	//=======================================================
	//=======================================================
	Variable.prototype.duplicateTree = function(root)
	{
		var tempNode = this.duplicateNode(root);

		if (this.leftNode !== null)
		{
			tempNode.leftNode = this.leftNode.duplicateTree(root);
			tempNode.leftNode.parentNode = tempNode;
		}
		else
			tempNode.leftNode = null;

		if (this.rightNode !== null)
		{
			tempNode.rightNode = this.rightNode.duplicateTree(root);
			tempNode.rightNode.parentNode = tempNode;
		}
		else
			tempNode.rightNode = null;

		return tempNode;
	}

	//=======================================================
	// This takes a Fraction parameter
	//
	// It doesn't seem to care about this instance's data
	//=======================================================
	Variable.prototype.evaluateNode = function(variableValue)
	{
		return new tree.Fraction(variableValue.numerator, variableValue.denominator);
	}

	//=======================================================
	// This takes an Object parameter: hash of variables
	//=======================================================
	Variable.prototype.evaluateNodeWithVariables = function(variables)
	{
		if (variables.hasOwnProperty(this.n))	// See if this variable exists in variables
			return variables[this.n];			// Return our name (not value)
		else
			return null;
	}

	//=======================================================
	// This takes an object {varName: Fraction, ...}
	//
	// Returns a number
	//=======================================================
	Variable.prototype.getApproximateValueOfTree = function(variables)
	{
		if (this.isPi())
			return Math.PI;
		else if (this.isEuler())
			return Math.E;
		else if (variables.hasOwnProperty(this.n))	// See if this variable exists in variables
			return variables[this.n].numerator / variables[this.n].denominator;	// Evaluate the value passed in for our variable
		else
			return null;
	}

	//=======================================================
	//=======================================================
	Variable.prototype.isPi = function()
	{
		if (this.n === String.fromCharCode(960))
			return true;

		return false;
	}

	//=======================================================
	//=======================================================
	Variable.prototype.isEuler = function()
	{
		if (this.n === String.fromCharCode(8455))
			return true;
		return false;
	}

	//=======================================================
	//=======================================================
	Variable.prototype.isConstant = function()
	{
		if (this.isPi() || this.isEuler())
			return true;

		return false;
	}

	//=======================================================
	//=======================================================
	Variable.prototype.getConstant = function()
	{
		if (this.isPi())
			return new tree.Fraction(Math.PI);
		else if (this.isEuler())
			return new tree.Fraction(Math.E);

		return null;

	}

	//=======================================================
	//=======================================================
	Variable.prototype.findAllVariables = function(list)
	{
		if (list.hasOwnProperty(this.n))
			list[this.n]++;
		else
		{
//r			list.addProperty(this.n);
			list[this.n] = 1;
		}
	}

	//=======================================================
	//=======================================================
	Variable.prototype.findLikeTerms = function(terms, isNegative)
	{
		var term = this.getNodeAsString();
		var coefficient;
		//trace("we got variable in find like terms");
		//trace(isNegative);

		if (isNegative)
			coefficient = new tree.Fraction(-1);
		else
			coefficient = new tree.Fraction(1);

		if (terms.hasOwnProperty(term))
		{
			var oldCoefficient = terms[term];
			terms[term] = tree.Fraction.plus(oldCoefficient, coefficient);
			terms.changed = true;
		}
		else
		{
//r			terms.addProperty(term);
			terms[term] = coefficient;
		}
        
        return terms.changed; // this is providing feedback if called from checkAnyChildren loop 
	}

	//=======================================================
	//=======================================================
	Variable.prototype.findVariable = function(varMatch)
	{
		if (this.n === varMatch)
			return this;
		else
			return tree.Node.prototype.findVariable.call(this, varMatch);
	}

	//=======================================================
	//=======================================================
	Variable.prototype.getCoefficient = function()
	{
		return new tree.Fraction(1);
	}

	//=======================================================
	//=======================================================
	Variable.prototype.getDegree = function()
	{
		return 1;
	}

	//=======================================================
	//=======================================================
	Variable.prototype.getNodeAsString = function()
	{
		return this.n;
	}

	//=======================================================
	//=======================================================
	Variable.prototype.getPolyCoefficient = function()
	{
		return new tree.Fraction(1);
	}

	//=======================================================
	//=======================================================
	Variable.prototype.getVariableFactors = function(terms, isDenominator)
	{
		var term = this.getNodeAsString();
		var power;
		if (isDenominator)
			power = new tree.Fraction(-1);
		else
			power = new tree.Fraction(1);

		if (terms.hasOwnProperty(term)){
			var oldPower = terms[term];
			terms[term] = tree.Fraction.plus(oldPower, power);
			terms.changed = true;
		}
		else{
//r			terms.addProperty(term);
			terms[term] = power;
		}
	}

	//=======================================================
	//=======================================================
	Variable.prototype.isFull = function()
	{
		return true;
	}

	//=======================================================
	//=======================================================
	Variable.prototype.isLinear = function()
	{
		return true;
	}

	//=======================================================
	//=======================================================
	Variable.prototype.isPolynomial = function()
	{
		return true;
	}

	//=======================================================
	//=======================================================
	Variable.prototype.isRational = function()
	{
		return true;
	}

	//=======================================================
	//=======================================================
	Variable.prototype.subForVariable = function(variable, value)
	{
		if (this.n === variable)
		{
			var newNode = new tree.Numerical(value.numerator, value.denominator);
			newNode.rootNode = rootNode;
			newNode.parentNode = parentNode;
			parentNode.assignNodeNewChild(this, newNode);

			//check that parent is not implied multiplication, if it is, change for regular
			if (this.parentNode instanceof ImpliedMultiplication)
			{
				var newMulti = new tree.Multiplication();
				newMulti.leftNode = this.parentNode.leftNode;
				newMulti.rightNode = this.parentNode.rightNode;

				newMulti.parentNode = this.parentNode.parentNode;
				this.parentNode.parentNode.assignNodeNewChild(this.parentNode, newMulti);
				newMulti.leftNode.parentNode = newMulti;
				newMulti.rightNode.parentNode = newMulti;

				setRoot(rootNode);

			}
		}
	}

/*************************************************************/
/*  	 	FUNCTIONS THAT MODIFY THE GIVEN TREE			 */
/*************************************************************/

	//=======================================================
	//=======================================================
	Variable.prototype.updateCoefficient = function(val)
	{
		if (parentNode instanceof Multiplication &&
			(this.parentNode.leftNode instanceof Numerical || this.parentNode.rightNode instanceof Numerical))
		{
			if (val.equalsZero())
				parentNode.deleteNode(true);
			else
				this.parentNode.replaceNumerical(val);
		}
		else if (val.equalsZero())
			this.parentNode.assignNodeNewChild(this, null);
		else if (!val.equalsTo(1, 1))
		{ //need to add in a coefficient
			var tempNode = new tree.Multiplication();
			var amount = new tree.Numerical(val.numerator, val.denominator);
			Node.insertLeft(amount, tempNode);
			tempNode.rightNode = this;
			tempNode.parentNode = this.parentNode;
			this.parentNode.assignNodeNewChild(this, tempNode);
			this.parentNode = tempNode;
		}
	}

	//=======================================================
	//=======================================================
	Variable.prototype.removeVariable = function()
	{
		if (this.parentNode instanceof Division || this.parentNode instanceof Multiplication)
		{
			var coeff = this.parentNode.getNumerical();
			if (coeff !== undefined)
				this.parentNode.parentNode.assignNodeNewChild(this.parentNode, null);
		}

		this.parentNode.assignNodeNewChild(this, null);
	}

module.exports = Variable;
},{"./tree":47}],50:[function(require,module,exports){
//=======================================================
// This old module (Bebeth 2/2/05) generated random-no-repeat
// values on the fly. It didn't have any code to detect
// pool exhaustion; if the sequence was from 1-10, the 11th
// random number request would loop forever.
//
// Though less generic, the new routine generates a sequence
// only once, then loops through that list in the same order,
// forever.
// The actual uses of this module are to pull 50 or 75 integers
// in the range of -100 to 100. Since it's such a large chunk of
// the possible numbers, we might as well use a fixed set.
//=======================================================
var tree = require('./nodeTree/tree');	// node tree helper file

	var SET_SIZE = 75;
	var SET_MIN = -100;
	var SET_MAX = 100;

	var numList = [];
	var listIdx = 0;

	populate();

	//=======================================================
	// Initial set population
	//=======================================================
	function populate()
	{
		var idx = 0;
		while (true)
		{
			// Choose a candidate
			var rnd = getRnd();
			var found = false;

			// See if we've already used the candidate
			for (var j = 0; j < idx; j++)
			{
				if (numList[j] === rnd)
				{
					found = true;
					break;
				}
			}

			// If the candidate doesn't already exist, save it
			if (!found)
			{
				numList[idx++] = rnd;

				// If we're done, exit
				if (idx === SET_SIZE)
					break;
			}
		}
	}

	//=======================================================
	//
	//=======================================================
	function getRnd()
	{
		var num = Math.random() * (SET_MAX - SET_MIN + 1) + SET_MIN;
		return Math.round(num);
	}

	//=======================================================
	// I'm not sure why this converts to a fraction with 10ths,
	// but I assume it's important.
	//=======================================================
	function getRand()
	{
		var num = numList[listIdx];
		if (++listIdx >= SET_SIZE)
			listIdx = 0;

		var randomFraction = new tree.Fraction(num*10, 10);
	    randomFraction.reduce();

		return randomFraction;
	}
exports.getRand = getRand;

/*
class Calculator.MathTree.RandomGenerator
{
	private var min:Number;
	private var max:Number;

	private var precision:Number;

	private var values:Array;

	private var nextNegative:Boolean=false;

	function RandomGenerator(minValue:Number, maxValue:Number, prec:Number){
		min = minValue;
		max = maxValue;
		precision = prec;

		values = new Array();
	}

	function reset(){
		while(values.length > 0)
			values.pop();
	}

	function getRand():Fraction{
		var randomFraction:Fraction;
		var randomNum:Number;
		var foundGoodOne:Boolean = false;
		while(!foundGoodOne){
			randomNum = Math.random() * (max - min + 1) + min;
		    randomNum = Math.round((randomNum*Math.pow(10, precision)));
			randomFraction = new Fraction(randomNum, Math.pow(10, precision));
		    randomFraction.reduce();

		    foundGoodOne = true;
		    for(var i:Number = 0; i<values.length; i++){
		    	if(randomFraction.equivalent(values[i])){
		    		foundGoodOne = false;
		    		break;
		    	}
		    }
		}
		//trace("we got a random value in random gen");
		//trace(randomFraction.asStringNew());
		values.push(randomFraction);

		return randomFraction;
	}

}
*/
},{"./nodeTree/tree":47}],51:[function(require,module,exports){
//==========================================================================
// Equivalence Engine: Main Entry Point
//
// Adapted from the KineticInput/KineticInputHandler AS Class
//==========================================================================
var tree            = require('./eqTools/nodeTree/tree'); // node tree helper file
var eqTools         = require('./eqTools/eqTools');	      // tools
var answerType      = require('./eqTools/answerType');    // answer type function
var typeList        = require('./eqTools/answerTypeList');// answer type list
var latexToEquiv    = require('./eqTools/latexToEquiv');  // convert latex to KL string
var mathML          = require('./eqTools/mathML');        // convert mathMl to KL string
var Parser          = require('./eqTools/nodeTree/parser');  // node tree parser
var ruleTranslate   = require('./rules/translation');     // translate extern rules to internal rules
var message         = require('./message');     // smart feedback messages
var _               = require('underscore');     // translate extern rules to internal rules

exports.tree            = tree;
exports.eqTools         = eqTools;
exports.answerType      = answerType;
exports.typeList        = typeList;
exports.latexToEquiv    = latexToEquiv;
exports.mathML          = mathML;
exports.Parser          = Parser;
exports.ruleTranslate   = ruleTranslate;

// -------------------------------------------------------------------------
var equivalenceRules;

	//=======================================================
	// Main entry point. Perform necessary type conversion
	// on values and rules, then perform the comparison.
	//=======================================================
	compare = function(teacherMathMl, studentLatex, rules)
    {
        console.log("rules = ", rules);
        var objRules = convertXmlToObjSimple(rules);
        var translatedRules = ruleTranslate.translate(objRules);

        console.log("translated Rules = ", translatedRules);

        equivObj = {};

        // call early rule check routine here:
        if (translatedRules.NO_PARENTHESES // replaced (!parensAllowed)
            && (studentLatex.indexOf("\left(")>=0)) // || strStudent.indexOf(")")>=0))
        {
            setMsg(equivObj, message.getMsg().noparen);
            return wrapResult(equivObj, false);
        }        
		
//        console.log("studentLatex = ", studentLatex);
		// Perform format conversion
        var studentKL = latexToEquiv.LatexToKI(studentLatex);
        console.log("studentKL = ", studentKL);
        
//NF TODO: scan teacher answer. If parenthesis is used, set NOPAREN rule to FALSE.
// "<mo>( and "<mo>)" ?

//        console.log("teacherMathMl = ", teacherMathMl);
        var teacherKL = mathML.mathMLtoString(teacherMathMl);
        console.log("teacherKL = ", teacherKL);

        var equivPass = checkAnswer(studentKL, teacherKL, translatedRules, equivObj);
        
//        console.log("equivPass = ", equivPass);
        
        return wrapResult(equivObj, equivPass);

    /*
        return {
            iscorrect: (wrongList.length === 0),
    		wrong: wrongList,
            equiv: (wrongList.length === 0 ? "correct" : "incorrect")
        };
    */
    }
    exports.compare = compare;

    //=======================================================
    //=======================================================
    wrapResult = function (equivObj, equivPass)
    {
        equivObj.iscorrect = (equivPass === true);
        if (equivPass === true)
            equivObj.equiv = "correct";
        else
            if (equivObj.equiv != "error")
        {
            if (equivObj.feedback && equivObj.feedback != "")
                equivObj.equiv = "feedback";
            else
                equivObj.equiv = "incorrect";
        }
        return equivObj; //checkAnswer(studentKL, teacherKL, translatedRules);
    }

    //=======================================================
    // Convert from an XML string to an object
    // Messy second version. Combine this with the version above!
    //=======================================================
    convertXmlToObjSimple = function(xmlStr)
    {
        if (typeof(xmlStr) !== 'string')
            xmlStr = "";

        // Sample data: <rule value="True" id="equivalentPoly"/><rule value="False" id="reduced"/>
        var getRules = /<rule[^>]+>/g;
        var rules = xmlStr.match(getRules);

        var out = {};
        var getId = /id="([^"]*)"/;
        var getVal = /value="([^"]*)"/;
        rules && _.each(rules, function(str, idx) {
            var id = str.match(getId)[1];
            var val = str.match(getVal)[1];
            out[id] = (val.toLowerCase() === 'true');
        });

        return out;
    }
/*
	//=======================================================
	// Set equivalence rules
	//
	// Params: rules: XML-formatted string
	//=======================================================
	function setEquivalenceRules(rules)
	{
		var test = "<xml><rule value=\"True\" id=\"equivalentPoly\"/><rule value=\"False\" id=\"reduced\"/><rule value=\"False\" id=\"parensAllowed\"/><rule value=\"False\" id=\"likeTermsCombined\"/></xml>";
		var xmlDoc = $.parseXML(test);

		// Clear out the rules
		equivalenceRules = {};

		var rules = $('rule', $(xmlDoc)).each(function() {
			var name = $(this).attr('id');
			var state = $(this).attr('value');
			if (typeof(state) === "string")
				state = state.toLowerCase();

			equivalenceRules[name] = (state === 'true');
		});
	}

//	equivalenceRules = setEquivalenceRules();
*/
	//=======================================================
	//=======================================================
    passedPreCheck = function(student, teacher, rules)
    {
		if (student === "" || typeof(student) === 'undefined' || student === null ||
			teacher === "" || typeof(teacher) === 'undefined' || teacher === null)
			return false;

    //    console.log("student= " + student + "; teacher = " + teacher + "; rules = ", rules);
        return true;
    }
    
	//=======================================================
	//=======================================================
    requireExactMatch = function(student, teacher, rules)
    {
        if ((rules && rules.exactAnswer)
            || student === "infinitesolutions" || student === "nosolutions"
            || teacher === "infinitesolutions" || teacher === "nosolutions"//)
            || student === teacher) // might as well short the circuit if they are identical
            return true; // require
        
        return false; // not requre
    }

	//=======================================================
	// Function Name: checkAnswer
	//	- This is the main work horse of the class and has beeen stripped off any content related to the
	//	  visual and hardware-input modules.
	//
	// Note: The input strings should not have any empty spaces between the closing tag and the next opening tag.
	//       The internal engine can not handle it correctly. This should not be a problem since the server already
	//	   cleans the string before sending here. If there is a need to do the cleaning in the future, we can
	//	   add the feature in the function of cleanMathMLString.
	//
	// Input:
	// 	student - MathMLL string format of the student answer.
	//			  It might tag along unit information such as degrees and should be stripped off.
	// 	teacher - MathMLL string format of the student answer.
	//
	// Return:
	// 	true - the input student answer is equivalent to the teacher's answer
	//		   and both contain valide MathML format strings.
	//	false - otherwise.
	//=======================================================
	checkAnswer = function (student, teacher, rules, msgObj)
	{
        student = student.trim();
        teacher = teacher.trim();
        if (!passedPreCheck(student, teacher, rules))
            return false;
        
        // has to be after exact match checking:
        stdLow = student.toLowerCase();
        tchLow = teacher.toLowerCase();

		// change all mult operation to implied op so they can be identical:
		student = student.replace(/\*/g, "");
		teacher = teacher.replace(/\*/g, "");
        if (requireExactMatch(student, teacher, rules))
            return (student === teacher);
        
 		var std = tree.Root.createTree(stdLow);
		var tch = tree.Root.createTree(tchLow);
        
        var stdCopy = std.duplicateTree();
        var tchCopy = tch.duplicateTree();
        if (!checkSpecialRules(student, stdCopy, tchCopy, rules, msgObj))
            return false;

        // get student answer type:
        var stdAnsType = answerType.getType(student, std);
        var tchAnsType = answerType.getType(teacher, tch);
        var ansType    = tchAnsType;

//        console.log("stdAnsType= " + stdAnsType + "; tchAnsType = " + tchAnsType);

        var slop = (rules != null && rules.allowSlop);
        var param = [std, tch, rules];
        if (tchAnsType.stdType)
        {
            param.push(stdAnsType.type);
            param.push(student);
        }
        else
            if (stdAnsType.stdType)
            {
                param = [tch, std, rules]; // swap positions for student and teacher nodes
                param.push(tchAnsType.type);
                param.push(teacher);
                ansType = stdAnsType;
            }
        
        if (ansType.type == typeList.types.COORDINATE)
            param = [stdAnsType, tchAnsType, slop];

        return ansType.compare.apply(this, param);
	}
exports.checkAnswer = checkAnswer;


	//=======================================================
	// return: true = match
	//=======================================================
	impliedMultMatch = function(student, teacher)
	{
		// change all mult operation to implied op so they can be identical:
		std = student.replace("*", "");
		tch = teacher.replace("*", "");
		return (std == tch);
	}

	//=======================================================
	//=======================================================
    function setMsg(msgObj, msg)
    {
        if (msgObj)
            msgObj.feedback = msg;
    }
    
    function exitWithMsg(msgObj, msg){
        setMsg(msgObj, msg);
        return false;
    }

	//=======================================================
	// Function name: checkSpecialRules
	//
	// return: true = pass; false = fail
	//=======================================================
    function checkSpecialRules(strStudent, std, tch, rules, msgObj)
    {
		// Check for failure to parse
		if (!std || !std.rootNode || !tch || !tch.rootNode)
			return false;

        // x * 1 or x + 0 is not allowed:
        if (std.rootNode.checkForOnes())
            return exitWithMsg(msgObj, message.getMsg().ones);
        if (std.rootNode.checkForZeros())
            return exitWithMsg(msgObj, message.getMsg().zeroes);
        
        if (std.rootNode instanceof tree.Division && std.rootNode.checkForDenomZeros())
            return exitWithMsg(msgObj, message.getMsg().divideZero);

        if (!rules)  //return true;
            rules = {}; // so that we can force simplify rule later
        rules.simplify = true; // the system set up is such that the simplify rule is always on
        
        if (rules.factored)
        {
            if (!eqTools.compareFactorObjects(std.getFactors(), tch.getFactors()))
                return exitWithMsg(msgObj, message.getMsg().factor);

            return true; // factored trump simplify
        }

        if (!rules.allowNegExp && std.checkForNegativeExponents())
            return exitWithMsg(msgObj, message.getMsg().negExp);

        rules.simplify = true; // the system set up is such that the simplify rule is always on
        var simplified = false;
        if (rules.simplify) // no other rules necessary:
        {
            if (std.reduceFractions()) // fractions such as 6/2 can be further reduced?
                return exitWithMsg(msgObj, message.getMsg().reduce); //"fraction needs to be reduced.");
            else if (std.simplify(rules)) // can be further simplified?
                    return exitWithMsg(msgObj, message.getMsg().simplify); //"Expression should be simplified.");
                else if (!std.isFullyCombined()) // is already fully combined of like terms?
                        return exitWithMsg(msgObj, message.getMsg().terms); //"All same terms need to be combined.");
                    else if (std.areRadicalsInDenominator()) // are radicals rationalized?
                            return exitWithMsg(msgObj, message.getMsg().rationalize); //"Radicals can not be in denominators.");
                        else if (std.checkPerfectPower()) // no perfect squares found?
                                return exitWithMsg(msgObj, message.getMsg().perfRoots); //"All perfect-nroot factors need to be factored out the root simble.");
        }

        if (rules.descendingOrder &&
            (!std.isOrderedPolynomial()))
            return exitWithMsg(msgObj, message.getMsg().descend);
            
        simplified = true;
        
//        if (rules.allowSlop)
//            simplified = simplified & eqTools.compareNumbersWithSlop(tch, std);
            
        return simplified;
    }

	//=======================================================
	// Function name: cleanMathMLString
	// 	- strip off anything outside of the MathML tags in the string. However, no attempt is made to check
	//	  the content inside of the MathML tags.
	//
	// Note that this will cause any answer not wrapped in <math> tags to fail
	//
	// Input:
	// 	strInputStr - MathML string that may or may not include garbage outside of the MathML tags.
	// Return:
	// 	strProcessed - the clean MathML string.
	//	empty string - if the string doesn't include any valid MathML tags.
	//
	// Created by: Nick Feng	11/17/2011
	//=======================================================
	function cleanMathMLString(strInputStr)
	{
		return strInputStr.replace(/(<math.+<\/math>)/, "$1");
	}
/*
// test:
//    var student = '(1.7*pow(x,2))/sqrt(pow(x,2)-6x+9)';
//    var teacher = '(pow(x,2)*1.7)/sqrt(-6x+9+pow(x,2))';
			var student = '2x/2';
			var teacher = 'x';

    var res = checkAnswer(student, teacher, {simplify: true});
    console.log("res= " + res);
*/
},{"./eqTools/answerType":1,"./eqTools/answerTypeList":2,"./eqTools/eqTools":3,"./eqTools/latexToEquiv":4,"./eqTools/mathML":5,"./eqTools/nodeTree/parser":34,"./eqTools/nodeTree/tree":47,"./message":52,"./rules/translation":54,"underscore":61}],52:[function(require,module,exports){
var msg = {
    ones: "Multiplication or division by one is not allowed in this answer.",
    zeroes: "Addition or subtraction by zero is not allowed in this answer.",
    reduce: "All fractions need to be reduced.",
    simplify: "The expression should be simplified.",
    terms: "Combine like terms.",
    rationalize: "Radicals cannot be in the denominator.",
    factor: "Factor the expression.",
    descend: "Arrange the expression in descending order.",
    noparen: "Parentheses are not allowed in this answer.",
    divideZero: "Division by zero is not allowed.",
    perfRoots: "Answer must be in simplified radical form.",
    negExp: "Negative exponents are not allowed in this answer."
};
//=======================================================
// Returns the master list of smart feedback messages
//=======================================================
function getMsg()
{
	return msg;
}
exports.getMsg = getMsg;
},{}],53:[function(require,module,exports){
//===========================================================================================
// Equivalence Main Module
//===========================================================================================
//var equation = require('./equation/equation');

//=======================================================
// Globals
//=======================================================
var ruleObj = {

/* -- Only implemented in numeric answers. Needs a major overhaul to be useful.
    allowSlop: {
        text: "Allow slop",
        help: "If set, decimal answers can have a variation of 1 in the least significant digit. Example: 1.01 through 1.03 are accepted if the answer is 1.02."
    },
*/

/* -- This is fully implemented, but isn't useful.
 * -- Instead we will eventually need half of this: Fractions don't need to be reduced.
    dontSimplify: {
        text: "Answers don't need to be fully simplified",
        help: "Fractions don't need to be reduced and like terms don't need to be combined."
    },
*/

    exactAnswer: {
        text: "Exact match required",
        help: "The user's answer must be completely identical to the author's answer."
    },

    NO_PARENTHESES: {
        text: "No parentheses allowed",
        help: "No parentheses are allowed in the answer if this is set."
    },

	descendingOrder: {
		text: "Descending order",
		help: "Polynomials must be in descending order."
	},

	factored: {
		text: "Factored polynomial",
		help: "The answer is expected as a factored polynomial."
	},

	cantFlip: {
		text: "No equation flipping",
		help: "Expressions on the left and right side of the equation or inequality can't be flipped."
	},

	allowNegExp: {
		text: "Allow negative exponents",
		help: "Negative exponents aren't allowed unless this rule is set."
	}

};

//=======================================================
// Returns the master list of rules for equation equivalence
//=======================================================
function getRules()
{
	return ruleObj;
}
exports.getRules = getRules;
},{}],54:[function(require,module,exports){
//===========================================================================================
// Equivalence rules Translate Module
//===========================================================================================
var _ = require("underscore");

// Rule Translation List.
// Any rules that match a list key are converted to "name".
// If "flip" is true, the state of the rule is also flipped.
var ruleObj = {
	parensAllowed: {
		name: 'NO_PARENTHESES',
		flip: true
	},

	noNegExp: {
		name: 'allowNegExp',
		flip: true
	}
};

// Rule override list.
// Any rule in here is forced to the supplied setting.
var forceRules = {
	simplify: true
}

//=======================================================
// Returns the translated list of rules for equation equivalence.
//=======================================================
function translate(rulesIn)
{
	// Handle translation
//    walkOutTable(rulesIn);	// DG: This was too aggressive. Don't do it.
    var rulesOut = walkInTable(rulesIn);

	// Handle forced settings
	rulesOut = forceSettings(rulesOut);

	return rulesOut;
}

//=======================================================
// Convert rules that are in ruleObj. Otherwise pass them through.
//=======================================================
function walkInTable(rulesIn)
{
    var rulesOut = {};

    _.each(rulesIn, function(val, inName) // iterate the fulesIn object:
    {
        // if finds the match in ruleObj,
        if (ruleObj[inName]) // assign rulesOut with the internal name with value:
            rulesOut[ruleObj[inName].name] = (ruleObj[inName].flip? !val : val);
        else
            rulesOut[inName] = val; // otherwise just copy the rulesIn element
    });

    return rulesOut;
}

//=======================================================
//
//=======================================================
function forceSettings(rules)
{
	_.each(forceRules, function(val, key) {
		rules[key] = val;
	});

	return rules;	// Technically redundant since rules is being changed in place.
}

exports.translate = translate;
},{"underscore":61}],"equiv":[function(require,module,exports){
module.exports=require('3TpD7p');
},{}],"3TpD7p":[function(require,module,exports){
//===========================================================================================
// Equivalence Main Module
//===========================================================================================
var freeMath    = require('./freeInput/math');
var freePhysics = require('./freeInput/physics');
var graphPlot   = require('./graph/checkPoints');
var graphConst  = require('./graph/const');
var equation    = require('./equation/equation');
var rules       = require('./equation/rules/rules');

exports.equationDbg = equation;

//=======================================================
// Globals
//=======================================================
var errorResponse = {iscorrect: false, equiv: "incorrect", wrong: []};		// Sent on equivalence check errors
var disasterResponse = {iscorrect: false, equiv: "error", wrong: []};		// Sent on equivalence check errors

//===========================================================================================
// Equivalence Checking
//===========================================================================================

//=======================================================
//=======================================================
var typeMap = {
	free: compFreeInputs,
	graphPlot: compGraphPlots,
	graphConst: compGraphConst,
	equation: compEquation
}

//=======================================================
// Main Entry Point: Check a submission against an answer
//=======================================================
function compare(type, correct, submitted, rules, equivType)
{
    if (!type || !correct || !submitted)
        return disasterResponse;
    
	// it seems the type functions are all looking for the first item in the array.
	if (Array.isArray(correct))
		correct = correct[0];

	if (typeMap[type])
		return typeMap[type](correct, submitted, rules, equivType);

	return errorResponse;
}
exports.compare = compare;

//=======================================================
// Compare free input values
//=======================================================
function compFreeInputs(correct, submitted, rules, equivType)
{
	var free = (equivType === 'physics') ? freePhysics : freeMath;

	// Verify 'correct' parameter
	if (!correct.length || correct.length < 1)
		return errorResponse;

	// Extract answers from the 'correct' parameter
	var ans = freePhysics.extractAnswers(correct);

	if (ans.length < 1)
		return errorResponse;

	// Perform the actual comparison
	return free.compare(ans, submitted);
}

//=======================================================
// Compare free equation input values
//=======================================================
function compEquation(correct, submitted, rules, equivType)
{
//    console.log("correct = " + correct + "; submitted = " + submitted + "; rules = " + rules + "; equivType = " + equivType);
	
    // Verify 'correct' parameter
	if (typeof(correct) !== 'string' || typeof(submitted) !== 'string'
        || correct.length < 1 || submitted.length < 1)
		return errorResponse;

    if (!rules) // prevent empty rules object
        rules = {};

	// Perform the actual comparison
	var result = equation.compare(correct, submitted, rules);

	// add the missing field:
    result.wrong = [];
        
	return result;
}

//=======================================================
// Compare coordinate points plotted on a graph against
// equations
//=======================================================
function compGraphPlots(correct, submitted)
{
	var result = graphPlot.compare(submitted, correct);

	// Check for errors encountered by the module
	if (typeof(result.equiv) === 'string' && result.equiv === 'incorrect')
		return errorResponse;

	return result;
}

//=======================================================
// Compare values for a geometric figure.
//=======================================================
function compGraphConst(correct, submitted)
{
	var result = graphConst.compare(submitted, correct);

	// Check for errors encountered by the module
	if (typeof(result.equiv) === 'string' && result.equiv === 'incorrect')
		return errorResponse;

	return result;
}

//============= Supplemental Routines ===============================
// 
//==============================================================
// Returns the master list of rules for equation equivalence
//==============================================================
function ruleList()
{
	// Fetch the rules from the algebraic equivalence module
	return rules.getRules();
}
exports.ruleList = ruleList;
},{"./equation/equation":51,"./equation/rules/rules":53,"./freeInput/math":57,"./freeInput/physics":58,"./graph/checkPoints":59,"./graph/const":60}],57:[function(require,module,exports){
//===========================================================================================
// Simple Numerical Equivalence, used by Free Input
//===========================================================================================
var mathTools = require('mathTools');	// General math tools

// Number of significant digits to check against (according to our special rules -- see getBounds() for details)
var defSigDig = 2;

var ePattern = /e(.+)$/;

//=======================================================
//
//=======================================================
function isArray(array)
{
	return !!(array && array.constructor == Array);
}

//=======================================================
// parameters:
//   num - the number to get bounds
//   digit - the sigificant digit where the slop will be applied to get the boundary numbers.
//           digit is capped at 3.
//
// The current rules in the math homework system for the "slop" value are
//  (also see the comment for the truncate function):
//   0 is exact
//   1 is +/- 1 on the 1st sig digit
//   2 is +/- 1 on the 2nd sig digit, if mag > 1
//   2 is +/- 2 on the 2nd sig digit, if mag <= 1
//   3 is +/- 1 on the 3rd digit, if mag < 100 (for 2 integer digits)
//   3 is +/- 2 on the 3rd digit, if mag >= 100 (for 3 or more integer digits)
//
// So if sig digits are 3 and the answer is 12.1, 12.0 through 12.2 (+/- 1 on 3rd sig digit) is correct.
// but if sig digits are 3 and the answer is 121.1, 119.x through 123.x (+/- 2 on 3rd sig digit) is correct.
//
// Note: truncate a or b on the sig digit position is the responsibility of the calling function,
// since it has better knowlege of number's range
//=======================================================
function getBounds(num, digit)
{
    var d = Math.min(digit, 3); // capped at 3

    var slop = d > 1 ? 2 : d; // sig digit is 2 or greater: slop factor = 2
                              // sig digit is 0:            slop factor = 0
                              // sig digit is 1:            slop factor = 1

    num = Number(num);
    strExp = num.toExponential();
    //console.log("strExp  = " + strExp );

    // fine tune slop according to magnitude of the number:
    var mag = Math.abs(num);
    if (mag < 100 && d ==3      // 2 interger digits
        || mag >= 1 && d ==2)   // 1 integer digit
        slop = 1;

	var exponent = d - 1; // power to normalize the input number

  //  console.log("d = " + d + "; slop = " + slop);
	if (strExp != "")
	{
		var matches = ePattern.exec(strExp);
		if (matches)
		{
            // matches[1] has the string form of the exponential number:
			var pow10 = Math.pow(10, parseInt(matches[1], 10));

            // normalize the number:
            num /= pow10; // num = one integer digit with decimal point digits

            //normalize the slop:
			var exp = Math.pow(10, exponent); // 10 * desired exponential number for slop
            var nSlop = slop / exp;

        // console.log("pow10 = " + pow10 + "; nSlop = " + nSlop);

            // normalized bounds:
            var lowerBound = num - nSlop;
			var upperBound = num + nSlop;

            // bounds for the desired integer power:
			lowerBound = lowerBound * pow10;
			upperBound = upperBound * pow10;
		}
	}
	else // we should never get here !!!
	{
		var exp = Math.pow(10, exponent); // d = 3: exp = 100; slop*exp = 2 * 100 = 200
        var dSlop = slop * exp;
		lowerBound = num - dSlop;
		upperBound = num + dSlop;
	}

	return [mathTools.fixJSMath(lowerBound), mathTools.fixJSMath(upperBound)];
}

//=======================================================
// Check slop factor
//=======================================================
function isWithinSlopRange(a, b, sigDig)
{
	// Both are numeric.  Check with a slop factor.
	var bounds = getBounds(a, sigDig);

	return (bounds[0] <= b) && (b <= bounds[1]);
}

//=======================================================
//=======================================================
function checkEquiv(a, b, sigDig)
{
	return isWithinSlopRange(a, b, sigDig);
}

/*==================================================================================
 'a' is treated as the answer, and 'b' is treated as the value submitted by a user

 truncate a or b on the sig digit position according to the following rule:

    a					                        b
    ______________________________________________
    |a| >= 1:
    1 integer digit without dec digits:		No slop.
    1 integer digit with 1 dec digit: 		truncate to the 1st decimal digit, then no slop.

    1 integer digit with dec digits         truncate to the 1st decimal digit, then +/- 1.
    truncate to the 1st decimal digit:

    2 integer digits: 	                    (b has decimal digits) truncate to the 1st decimal digit, then +/- 1.
    2 integer digits:	                    (b has no decimal digits) truncate 'a' to integer, then no slop.

    3 or more integer digits: 	            3rd sig digit +/- 2.
    ______________________________________________
    |a| < 1:
    1 SD:                                   No slop.
    2+ SD:                                  +/- 2 on the 2nd significant digit.

==================================================================================*/
function truncate(a, b)
{
    var mag = Math.abs(a);
    var aTrunk = a;
    var bTrunk = b;
    var d = 0; // default is no slop

    if (mag >= 100) // 3 or more interger digits:
    {
        // do truncation - compare only up to 3rd sig digit:
        aTrunk = mathTools.truncateToSigFigs(aTrunk, 3);
        bTrunk = mathTools.truncateToSigFigs(bTrunk, 3);
        d = 3;
    }
    else if (mag >= 10) // 2 interger digits:
    {
        var sigDigits = mathTools.getSignificantDigits(bTrunk);
        if (sigDigits > 2 // student input has decimal digits:
            || (Math.abs(bTrunk) < 10 && sigDigits > 1)) // corner case of the likes of 9.9 compare with 10
        {
            // compare only up to 1 dec digit:
            aTrunk = mathTools.truncateToSigFigs(aTrunk, 3);
            bTrunk = mathTools.truncateToSigFigs(bTrunk, 3);
            d = 3;
        }
        else  // student input has no decimal digits:
        {
            // compare only integer digits:
            aTrunk = mathTools.truncateToSigFigs(aTrunk, 2);
            bTrunk = mathTools.truncateToSigFigs(bTrunk, 2);
        }
    }
    else if (mag >= 1) // 1 interger digit:
    {
        var sigDigits = mathTools.getSignificantDigits(aTrunk);

        if (sigDigits == 2) // 1 decimal digit:
            bTrunk = mathTools.truncateToSigFigs(bTrunk, 2); // truncate input to 1 dec digit

        else if (sigDigits > 2)  // compare only up to 1 dec digit
        {
            aTrunk = mathTools.truncateToSigFigs(aTrunk, 2);
            bTrunk = mathTools.truncateToSigFigs(bTrunk, 2);
            d = 2;
        }
    }
    else // < 1:
    {
        if (mathTools.getSignificantDigits(aTrunk) != 1)
        {
            aTrunk = mathTools.truncateToSigFigs(aTrunk, 2);
            bTrunk = mathTools.truncateToSigFigs(bTrunk, 2);
            d = 2;
        }
    }

    return [aTrunk, bTrunk, d];
}

//==================================================================================
// Array equivalency comparison
//
// 'a' is treated as the answer, and 'b' is treated as the value submitted by a user
//
// Arrays are guaranteed to be only one level deep
//
// truncate a or b on the sig digit position,
//  since this function has better knowlege of number's range.
//==================================================================================
function compare(a, b)
{
	if (!isArray(a) || !isArray(b) || a.length !== b.length)
		return "error";

	var wrongList = [];
	for (var i = 0; i < a.length; i++)
	{
        var fa = parseFloat(a[i]);
        var fb = parseFloat(b[i]);

        // Allow for non-numeric answers
        if (isNaN(fa) || isNaN(fb))
        {
            console.log("One of the inputs is not a number");
            if (a[i] != b[i])
                wrongList.push(i);
            continue;
        }

        trunc = truncate(fa, fb);
//        console.log("aTrunk = " + trunc[0] + "; bTrunk = " + trunc[1] + "; d = " + trunc[2]);

        if (checkEquiv(trunc[0], trunc[1], trunc[2]) === false)
            wrongList.push(i);
	}

	return {
        iscorrect: (wrongList.length === 0),
		wrong: wrongList,
        equiv: (wrongList.length === 0 ? "correct" : "incorrect")
    };
/*    
    {
		equiv: (wrongList.length === 0),
		wrong: wrongList
	};
*/	
}
exports.compare = compare;

},{"mathTools":"mathTools"}],58:[function(require,module,exports){
//===========================================================================================
// Simple Numerical Equivalence, used by Free Input
//===========================================================================================
var mathTools = require('mathTools');	// General math tools

// Number of significant digits to check against (according to our special rules -- see getBounds() for details)
var defSigDig = 2;

var ePattern = /e(.+)$/;

//=======================================================
//
//=======================================================
function isArray(array)
{
	return !!(array && array.constructor == Array);
}

//=======================================================
// parameters:
//   num - the number to get bounds
//   d   - the sigificant digit where the slop will be applied to get the boundary numbers.
//
// The current rules in the homework system for the "slop" value are:
//   0 is exact
//   1 is +/- 1 on the 1st sig digit
//   2 is +/- 1 on the 2nd sig digit
//   3 is +/- 2 on the 3rd digit
//   4 is +/- 3 on the 4th digit
//   And so on
//
// So if sig digits are 3 and the answer is 2.01, 1.99 through 2.03 (+/- 2) is graded as correct.
//=======================================================
function getBounds(num, d)
{
	var slop = d > 1 ? d - 1 : d; // slop factor is d-1 for 2 or greater
	var exponent = d - 1;
    num = Number(num);
    strExp = num.toExponential();

	if (strExp != "")
	{
		var matches = ePattern.exec(strExp);
		if (matches)
		{
			var pow10 = Math.pow(10, parseInt(matches[1], 10));
			num /= pow10;
			var exp = Math.pow(10, exponent);
			var lowerBound = num - slop / exp;  // get the lower bound
			var upperBound = num + slop / exp;
			lowerBound = lowerBound * pow10;
			upperBound = upperBound * pow10;
		}
	}
	else
	{
		var exp = Math.pow(10, d);
		lowerBound = num - slop / exp;
		upperBound = num + slop / exp;
	}

	return [mathTools.fixJSMath(lowerBound), mathTools.fixJSMath(upperBound)];
}

//=======================================================
// Check slop factor
//=======================================================
function isWithinSlopRange(a, b, sigDig)
{
	var fa = parseFloat(a);
	var fb = parseFloat(b);

	// Allow for non-numeric answers
	if (isNaN(fa) || isNaN(fb))
		return a == b;

	// Both are numeric.  Check with a slop factor.
	var bounds = getBounds(fa, sigDig);

	return (bounds[0] <= fb) && (fb <= bounds[1]);
}

//=======================================================
//
//=======================================================
function checkEquiv(a, b, sigDig)
{
	return isWithinSlopRange(a, b, sigDig);
}

//=======================================================
// Array equivalency comparison
//
// 'a' is treated as the answer, and 'b' is treated as the value submitted by a user
//
// Arrays are guaranteed to be only one level deep
//=======================================================
function compare(a, b)
{
	if (!isArray(a) || !isArray(b) || a.length !== b.length)
		return "error";

	var wrongList = [];
	for (var i = 0; i < a.length; i++)
	{
		if (checkEquiv(a[i], b[i], defSigDig) === false)
			wrongList.push(i);
	}

	return  {
        iscorrect: (wrongList.length === 0),
		wrong: wrongList,
        equiv: (wrongList.length === 0 ? "correct" : "incorrect")
    };
/*    {
		equiv: (wrongList.length === 0),
		wrong: wrongList
	};
*/	
}
exports.compare = compare;

//=======================================================
// Extracts answers from a single string, then compares
// against correct answers
//=======================================================
var maction = /<maction[^>]*>(.+?)<\/maction>/g;	// Find everything in <maction> tags
//var tags = /<([^>]+?)>(.+?)<\/\1>/g;				// Destroy all tags, keeping content (matched tag search)
var tags = /<[^>]+?>/g;							// Destroy all tags, keeping content (find anything inside <>)

function extractAnswers(single)
{
	var out = [];

	if (single && typeof(single) === 'string')
	{
		single.replace(maction, function(text) {
			// 'text' contains everything that was inside an <maction> tag pair
			var noTags = text.replace(tags, "");		// Was "$2"
			// 'noTags' contains the flattened version of 'text'. This isn't ideal, but should be good enough.
			out.push(noTags);
		});
	}

	return out;
}
exports.extractAnswers = extractAnswers;

},{"mathTools":"mathTools"}],59:[function(require,module,exports){
//===========================================================================================
// Graph input answer checking
//
// Checks to see whether submitted coordinate pairs match an equation.
//===========================================================================================
//var mathTools = require('mathTools');	// General math tools

//=======================================================
// Globals to tune how strict answer checking is for
// various graph types.
//=======================================================
var marginOfError = 0.3;
var moeLine = 0.45;
var moeCircle = 0.09;		// Multiply by radius to get margin of error in units
var moeHyperbola = 0.5;		// This doesn't scale, making the check too strict with high values
var moeParabola = 0.025;	// Scaled margin, with a separately enforced minimum

//=======================================================
//=======================================================
function isArray(array)
{
	return !!(array && array.constructor == Array);
}

//=======================================================
// Functions to check each graph type, along with argument
// count expected.
//=======================================================
var funcs = {
	point: { argCnt: 2, func: point },
	line: { argCnt: 2, func: line },
	circle: { argCnt: 3, func: circle },
	ellipse: { argCnt: 4, func: ellipse },
	hyperbolaxpos: { argCnt: 4, func: hyperbolaX },
	hyperbolaypos: { argCnt: 4, func: hyperbolaY },
	parabolax2: { argCnt: 3, func: parabolaX },
	parabolay2: { argCnt: 3, func: parabolaY }
}

//=======================================================
//=======================================================
function compare(submitted, correct)
{
    // Ensure variables are defined
    var correct = correct || "";
    submitted = submitted || [[]];

    // Verify submitted is an array. The inner arrays can be verified later.
    if (!isArray(submitted))
        return "error";

    // Parse the equation
    correct = correct.replace(/\s*/g, "").toLowerCase();    // Remove white space, convert to lower case
    var corData = extractData(correct);
    if (corData === "error")
        return "error";

    var wrongList = [];

    for (var i = 0, len = submitted.length; i < len; i++)
    {
        var pair = submitted[i];
        // Each element in submitted is currently a string and so is converted here to an array for the procdessing that follows.
        if (!Array.isArray(pair))
            pair = pair.split(",");


        if (!isArray(pair) || pair.length !== 2)
            return "error";

        // Call a type-specific verification routine
        if (funcs[corData.type] && (corData.args.length === funcs[corData.type].argCnt))
        {
            var res = funcs[corData.type].func(pair[0], pair[1], corData.args);
            if (!res)
                wrongList.push(i);
        }
        else
            return "error";
    }

	return  {
        iscorrect: (wrongList.length === 0),
		wrong: wrongList,
        equiv: (wrongList.length === 0 ? "correct" : "incorrect")
    };
/*    {
		equiv: (wrongList.length === 0),
		wrong: wrongList
	};
*/	
}
exports.compare = compare;

//=======================================================
//
//=======================================================
function extractData(str)
{
	var idx = str.indexOf('=');
	if ((idx === -1) || (idx === (str.length-1)))	// Make sure there's an =, and it's not the last character in the string
		return "error";

	var eqType = str.slice(0, idx);				// Find the type

	var eqArgs = str.slice(idx+1).split(',');
	for (var i = 0; i < eqArgs.length; i++)
		eqArgs[i] = parseFloat(eqArgs[i]);

	return {
		type: eqType,
		args: eqArgs
	}
}

//=======================================================
//=======================================================
function point(x, y, args)
{
	x = parseFloat(x);
	y = parseFloat(y);
	return (x === args[0] && y === args[1]);
}

//=======================================================
//=======================================================
function line(x, y, args)
{
	// args: m, b

	// The margin of error should depend on the graph scale, but we don't have that information.

	// If the slope > 1, use x.  Otherwise use y.
	if (Math.abs(args[0]) <= 1)
	{
		var yTest = args[0] * x + args[1];
		return (Math.abs(y - yTest) <= moeLine);
	}
	else
	{
		var xTest = (y - args[1]) / args[0]
		return (Math.abs(x - xTest) <= moeLine);
	}
}

//=======================================================
// Args: x_origin, y_origin, radius
//=======================================================
function circle(x, y, args)
{
	var xo = x - args[0];	// Translate to the origin
	var yo = y - args[1];

	// Determine distance to the origin (submitted radius)
	// sqrt is slow, but I don't see how to avoid it. Distance squared is fine, but deltas of
	// squared distances are useless.
	var radSubmitted = Math.sqrt(xo * xo + yo * yo);
	var delta = Math.abs(args[2] - radSubmitted);

	var modifiedMOE = moeCircle * Math.abs(args[2]);	// Multiply the margin of error by the radius
	return (delta <= modifiedMOE);
}

//=======================================================
// Args: h (x_origin), k (y_origin), a, b
//=======================================================
function ellipse(x, y, args)
{
	var xo = x - args[0];	// Translate to the origin
	var yo = y - args[1];
	var a = args[2];
	var b = args[3];

	// Special check to ensure legal values. Negatives work below since we're using squares.
	if ((a < 0) || (b < 0))
		return false;

	// y^2 = (1-x^2/a^2)*b^2 -- Don't take the square root because it could be imaginary
	var yTest = ( 1 - xo*xo / (a*a) ) * b*b;
	var modifiedMOE = marginOfError * Math.max(a, b);	// Multiply the margin of error by the larger of a or b

	// Compare against the square of the MoE since y is still squared.
	// This is a bit questionable, like the circle check was before being fixed.
	// Comparing differences of squares is obviously not proportional to comparing differences.
	// In preliminary testing, it seems to be okay.
	return (Math.abs(yo*yo - yTest) <= (modifiedMOE*modifiedMOE));
}

//=======================================================
	// Args: h, k, a, b
//=======================================================
function hyperbolaX(x, y, args)
{
	var xo = x - args[0];	// Translate to the origin
	var yo = y - args[1];
	var a = args[2];
	var b = args[3];

	// a * Math.sqrt( y*y / (b*b) + 1);
	// Solve for x for hyperbolaX.  We can get large y errors in some cases.
	var xTest = Math.sqrt((yo*yo / (b*b) + 1)) * a;
	var test = Math.min(Math.abs(xo - xTest), Math.abs(xo + xTest));
	return (test <= moeHyperbola);
}

//=======================================================
//=======================================================
function hyperbolaY(x, y, args)
{
	// Args: h, k, a, b
	var xo = x - args[0];	// Translate to the origin
	var yo = y - args[1];
	var a = args[2];
	var b = args[3];

	// b * Math.sqrt( x*x / (a*a) + 1)
	// Solve for y for hyperbolaY.  We can get large x errors in some cases.
	var yTest = Math.sqrt(xo*xo / (a*a) + 1) * b;
	var test = Math.min(Math.abs(yo - yTest), Math.abs(yo + yTest));
	return (test <= moeHyperbola);
}

//=======================================================
// Args: h, k, p
//=======================================================
function parabolaX(x, y, args)
{
	var xo = x - args[0];	// Translate to the origin
	var yo = y - args[1];

	// y = x^2 / 4p
	var yTest = xo*xo / (4*args[2]);
	var test = Math.abs(yo - yTest);

	var modifiedMOE = Math.max(0.5, Math.abs(moeParabola*y));	// Keep a minimum margin of error
	return (test <= modifiedMOE);
}

//=======================================================
// Args: h, k, p
//=======================================================
function parabolaY(x, y, args)
{
	var xo = x - args[0];	// Translate to the origin
	var yo = y - args[1];

	// x = y^2 / 4p
	var xTest = yo*yo / (4*args[2]);
	var test = Math.abs(xo - xTest);

	var modifiedMOE = Math.max(0.5, Math.abs(moeParabola*x));	// Keep a minimum margin of error
	return (test <= modifiedMOE);
}

},{}],60:[function(require,module,exports){
//===========================================================================================
// Graph const checking
//
// Checks to see ...
//===========================================================================================

//=======================================================
// Functions to check each graph type, along with argument
// count expected.
//=======================================================
var funcs = {
	point: { argCnt: 2 },
	line: { argCnt: 2 },
	circle: { argCnt: 3 },
	ellipse: { argCnt: 4 },
	hyperbolaxpos: { argCnt: 4 },
	hyperbolaypos: { argCnt: 4 },
	parabolax2: { argCnt: 3 },
	parabolay2: { argCnt: 3 }
}

//=======================================================
//=======================================================
function compare(submitted, correct)
{
    // Ensure variables are defined
    var correct = correct || "";
    submitted = submitted || [[]];
    // Verify submitted is an array. The inner arrays can be verified later.
    if (!Array.isArray(submitted))
        return "error";
    // Parse the equation
    correct = correct.replace(/\s*/g, "").toLowerCase();    // Remove white space, convert to lower case
    var corData = extractData(correct);
    if (corData === "error")
        return "error";

	if (!funcs[corData.type] || corData.args.length !== funcs[corData.type].argCnt)
		return "error";
	
    var wrongList = [];

    for (var i = 0, len = submitted.length; i < len; i++)
    {
        var res = parseFloat(submitted[i]) === corData.args[i];
        if (!res)
            wrongList.push(i);
    }

	return  {
        iscorrect: (wrongList.length === 0),
		wrong: wrongList,
        equiv: (wrongList.length === 0 ? "correct" : "incorrect")
    };
/*    {
		equiv: (wrongList.length === 0),
		wrong: wrongList
	};
*/	
}
exports.compare = compare;

//=======================================================
//
//=======================================================
function extractData(str)
{
	var idx = str.indexOf('=');
	if ((idx === -1) || (idx === (str.length-1)))	// Make sure there's an =, and it's not the last character in the string
		return "error";

	var eqType = str.slice(0, idx);				// Find the type

	var eqArgs = str.slice(idx+1).split(',');
	for (var i = 0; i < eqArgs.length; i++)
		eqArgs[i] = parseFloat(eqArgs[i]);

	return {
		type: eqType,
		args: eqArgs
	}
}


},{}],61:[function(require,module,exports){
//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.6.0';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return obj;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
    return obj;
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    any(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
    each(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, function(value, index, list) {
      return !predicate.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
    each(obj, function(value, index, list) {
      if (!(result = result && predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
    each(obj, function(value, index, list) {
      if (result || (result = predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    var result = -Infinity, lastComputed = -Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed > lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    var result = Infinity, lastComputed = Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed < lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Shuffle an array, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return value;
    return _.property(value);
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    iterator = lookupIterator(iterator);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iterator, context) {
      var result = {};
      iterator = lookupIterator(iterator);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    _.has(result, key) ? result[key].push(value) : result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Split an array into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(array, predicate) {
    var pass = [], fail = [];
    each(array, function(elem) {
      (predicate(elem) ? pass : fail).push(elem);
    });
    return [pass, fail];
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.contains(other, item);
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, 'length').concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error('bindAll must be passed function names');
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;
      if (last < wait) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))
                        && ('constructor' in a && 'constructor' in b)) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function () {
      return value;
    };
  };

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    return function(obj) {
      if (obj === attrs) return true; //avoid comparing an object to itself.
      for (var key in attrs) {
        if (attrs[key] !== obj[key])
          return false;
      }
      return true;
    }
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() { return new Date().getTime(); };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}).call(this);

},{}]},{},[])