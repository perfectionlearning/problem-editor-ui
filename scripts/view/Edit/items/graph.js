/********************************************************************************
 Creates a graph display

 Arguments:

  eq: Array of objects that contains the items to plot.  If empty, no items are plotted.
      [ eq: "", color: "" ]
      eq strings are types followed by parameters:

		point x,y,label

		line m,b

		circle x,y,radius

		ellipse center point x (h), center point y (k), distance from foci 1 (a), distance from foci 2 (b)

		hyperbolaXpos center point x (h), center point y (k), distance from center to vertex on the x origin (a), distance from center to vertex on the y origin (b) -- using formula (x-h)^2 / a^2 - (y-k)^2 / b^2 = 1
		hyperbolaYpos center point x (h), center point y (k), distance from center to vertex on the x origin (a), distance from center to vertex on the y origin (b) -- using formula (y-k)^2 / a^2 - (x-h)^2 / b^2 = 1

		parabolaX2 h,k,p -- using formula 4p(y-k)=(x-h)^2
		parabolaY2 h,k,p -- using formula 4p(x-h)=(y-k)^2

		(more later)

  xRange: [min, max, grid step size]
  yRange: [min, max, grid step size]
  labelSkip: Number of axis ticks to skip when labeling (0 = label every tick)
  usePiLabels: Use pi for labeling

********************************************************************************/
(function() {

	var _xMax_lgc, _xMin_lgc, _xStep_lgc, xUpperBound, xLowerBound;
	var _yMax_lgc, _yMin_lgc, _yStep_lgc, yUpperBound, yLowerBound;
	var _aryEq;
	var ctx;

    //===============================================================================
    //===============================================================================
	app.GraphView = app.PEView.extend({
		tagName: 'canvas',
		className: 'graph',
		size: 200,
		field: 'graphequations',

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			this.$el.attr({width: this.size, height: this.size});

			// These need to be unbound manually if the view is ever destroyed!
			this.render = _.bind(this.render, this);
			this.model.on('change:graphparms', this.render);
			this.model.on('change:graphequations', this.render);
			this.model.on('change:vars', this.render);
		},

		/*************************************************************************
		 This is the main function of the graph object
		 Input:
			_aryEq - arry of equations to draw
		*************************************************************************/
		render: function()
		{
			var eq = this.model.get(this.field);
			if (!eq || eq.length < 1)
				return this.el;

			_aryEq = eq.slice(0);		// Clone

			// Fill in variables
			_aryEq = $.map(_aryEq, function(val) {
				return app.replaceVars(val);
			});

			this.setAxis();
			_grid.draw();
			drawEquations();

			return this.el;
		},

		//---------------------------------------
		//---------------------------------------
		setAxis: function()
		{
			var parms = this.model.get('graphparms');

			// Set some default values if they are missing
			// This is messy!  This module needs to be wrapped for the Images tab, like
			// it is for answer types.  Default handling should be centralized.
			if (!defined(parms.x))
				parms.x = [-10, 10, 1];
			if (!defined(parms.y))
				parms.y = [-10, 10, 1];
			if (!defined(parms.skip))
				parms.skip = 1;

			// Get the 2D context
			ctx = this.el.getContext("2d");

			_grid.create({
				ctx: ctx,
				w: this.size,
				h: this.size,

				xRange: parms.x,
				yRange: parms.y,
				labelSkip: parms.skip,
				usePiLabels: parms.usePiLabels
			});

			// index values for xRange, yRange to replace the magic numbers:
			var minIdx = 0, maxIdx=1, StepSize=2;

			_xMax_lgc = parms.x[maxIdx];
			_xMin_lgc = parms.x[minIdx];
			_xStep_lgc = parms.x[StepSize];

			_yMax_lgc = parms.y[maxIdx];
			_yMin_lgc = parms.y[minIdx];
			_yStep_lgc = parms.y[StepSize];

			var clearanceFactor = 1.2;
			xUpperBound = _xMax_lgc * clearanceFactor; // make sure the graph draws to the border
			xLowerBound = _xMin_lgc * clearanceFactor; // make sure the graph draws to the border
			yUpperBound = _yMax_lgc * clearanceFactor; // make sure the graph draws to the border
			yLowerBound = _yMin_lgc * clearanceFactor; // make sure the graph draws to the border
		},

		//--------------------------
		// Close routine.  Unbind model events.
		//--------------------------
		close: function() {
			this.model.off(null, this.render);
		}

	});

    //===============================================================================
    // Required API for Input Types
    //===============================================================================

    //===================== draw equations ============================
    function appendColorFn(arg, color, drawFn)
    {
        drawFn.apply(this, arg.concat(color));
    }

    //=================================================
    //=================================================
    function initConicFn(arg, color)
    {
        arg.unshift(color); // Add elements at beginning of args array
        return initConics.apply(this, arg);
    }

	//=================================================
	// set transform matrix to identity
	//=================================================
	function setTransformToIdentity(canvasContext)
	{
		canvasContext.setTransform(1, 0, 0, 1, 0, 0);
	}

    //=================================================
    //=================================================
    function drawEquations(newEq)
    {
        var drawAry;

        if (newEq)  drawAry = newEq;
        else
        {
            if (!_aryEq || _aryEq.length == 0)  return;
            drawAry = _aryEq;
        }

		setTransformToIdentity(ctx);

        var strEq, colorEq, eqType, args, option;

        var eq = {
			log: { nParam:4,   fn: function(arg, color){ appendColorFn(arg, color, drawLogEqn) } },// 'logarithm',

			exponent: { nParam:4,   fn: function(arg, color){ appendColorFn(arg, color, drawExpEqn) } },// 'exponent',

			radical: { nParam:4,   fn: function(arg, color){ appendColorFn(arg, color, drawRadEqn) } },// 'radical',

			rational: { nParam:3,   fn: function(arg, color){ appendColorFn(arg, color, drawRatEqn) } },// 'rational',

			sin: { nParam:3,   fn: function(arg, color){ appendColorFn(arg, color, drawSinEqn) } },// 'sine',

			cos: { nParam:3,   fn: function(arg, color){ appendColorFn(arg, color, drawCosEqn) } },// 'cosine',

			tan: { nParam:3,   fn: function(arg, color){ appendColorFn(arg, color, drawTanEqn) } },// 'tangent',

			parabolastd: { nParam:3, fn: function(arg, color){ appendColorFn(arg, color, drawQuadSEqn) } },// 'quadratic (Standard)',

//			quadv: { nParam:3, fn: function(arg, color){ appendColorFn(arg, color, drawQuadVEqn) } },// 'quadratic (Vertex)',

			line: { nParam:2,   fn: function(arg, color){ appendColorFn(arg, color, drawLineEqn) } },// 'line',

			circle: { nParam:3,   fn: function(arg, color){ appendColorFn(arg, color, drawCircle) } }, // 'circle',

			//=================================================================================
			parabolax2: { nParam:3,   fn: function (arg, color)                              // 'parabolax2',
                    {   var cnc = initConicFn(arg, color);

                        // parabolaX2 h,k,p -- using formula 4p(y-k)=(x-h)^2
                        // after translate to (h, k): y = +- x^2 / 4p
                        cnc.bDrawPositiveY = false;
                        cnc.Eq = function(x, a) { return x*x / (4*a); }
                        var p = arg[3], h = arg[1]; // color, h, k, a, b
                        var xMaxY_lgc = Math.sqrt(4 * p * _yMax_lgc); // since 4py = x^2

						cnc.xStart = 0;
						cnc.dX = -cnc.dX; // make it positive
						cnc.xCompare = function(x, h) { return x >=0 && x <= xUpperBound + Math.abs(h); }

						arg.unshift(cnc);	// stuff extra param at beginning of arg

						// set up for drawConicsYtoX:
						cnc.EqYtoX = function(y, p) { return (Math.sqrt(4*p*y)); }
						cnc.yStart = 0;
						if (p < 0)
							cnc.yCompare = function(y, k) { return y <= 0 && y >= yLowerBound - Math.abs(k);  }
						else
						{
							cnc.dY = -cnc.dY; // make it positive
							cnc.yCompare = function(y, k) { return y >= 0 && y <= yUpperBound + Math.abs(k);
						}                        }

                        drawConics.apply(this, arg); }
                    },

			//=================================================================================
			parabolay2: { nParam:3,   fn: function (arg, color)                              // 'parabolay2',
                    {   var cnc = initConicFn(arg, color);

                        // parabolaY2 h,k,p -- using formula 4p(x-h)=(y-k)^2
                        // after translate to (h, k): y = +- sqrt(4px)
                        cnc.bDrawNegativeX = false;

						var a = arg[3]; // color, h, k, a, b
						var Sign = mathSign(a); // sign of a
						cnc.xStart *= Sign;
						cnc.dX *= Sign; // keep going forever with this condition??
						if (Sign < 0)
						{
							cnc.xCompare = function(x) { return x <= cnc.xVertex; };
							cnc.yCompare = function(y, k) { return y >= 0 && y <= yUpperBound + Math.abs(k); }
						}

                        cnc.Eq = function(x, a) { return 2 * Math.sqrt( a * x ); }
                        arg.unshift(cnc);	// stuff extra param at beginning of arg

						// set up for drawConicsYtoX:
						cnc.EqYtoX = function(y, p) { return (y*y/(4*p)); }
						cnc.yStart *= Sign;

                        drawConics.apply(this, arg); }
                    },

			//=================================================================================
			ellipse: { nParam:4,   fn: function (arg, color)                              // 'ellipse',
                    {   var cnc = initConicFn(arg, color);
						var a = arg[3], b = arg[4]; // color, h, k, a, b
                        cnc.xVertex = a;
                        cnc.xVertexPx = _grid.xLgcLengthToPx(a);
						cnc.yVertex = b;
						cnc.yVertexPx = _grid.yLgcLengthToPx(b);
						cnc.xStart = 0;
						
						if (a < 0)
						{
							cnc.xCompare = function(x, h, a)
										{ return x >= Math.max(a, xLowerBound-Math.abs(h)); };
						}
						else
						{
							cnc.dX = -cnc.dX; // make it positive
							cnc.xCompare = function(x, h, a)
										{ return x <= Math.min(a, xUpperBound+Math.abs(h)); };
						}

                        /**********************************************************************
                            Draw an ellipse in the equation of (x-h)^2/a^2 + (y-k)^2/b^2 = 1;
                            if h, k are zeros (we translate the system origin to h,k),
                            the resulting equation will be     x^2/a^2 + y^2/b^2 = 1;

                            therefore:   y = +- sqrt(1 - x^2/a^2) * b
                         **********************************************************************/
                        cnc.Eq = function(x, a, b) { return Math.sqrt( 1 - x*x / (a*a) ) * b; }

						// set up for drawConicsYtoX:
						cnc.EqYtoX = function(y, a, b) { return a* Math.sqrt(1 - y*y/(b*b)); }

						if (b<0) {
							cnc.dY = -cnc.dY; // make it positive
							cnc.yCompare = function(y, k, b)
										{ return y < 0 && y >= Math.min(b, yLowerBound-Math.abs(k)); }
						}
						else
							cnc.yCompare = function(y, k, b)
										{ return y > 0 && y <= Math.min(b, yUpperBound+Math.abs(k)); }

                        arg.unshift(cnc);	// stuff extra param at beginning of arg
                        drawConics.apply(this, arg); }
                    },

			//=================================================================================
			hyperbolaxpos: { nParam:4,   fn: function (arg, color)                           // 'hyperbolaxpos',
                    {   var cnc = initConicFn(arg, color);
                        var a = arg[3], b = arg[4]; // color, h, k, a, b
                        cnc.xVertex = a;
                        cnc.xVertexPx = _grid.xLgcLengthToPx(a);

						cnc.yVertex = b;
						cnc.yVertexPx = _grid.yLgcLengthToPx(b);

						cnc.xCompare = function(x, h, a) { return x >=a; }// && x <= xUpperBound; }

                        // (x-h)^2/a^2 - (y-k)^2/b^2 = 1
                        cnc.Eq = function(x, a, b) { return b * Math.sqrt( x*x / (a*a) - 1); }

						// set up for drawConicsYtoX:
						cnc.EqYtoX = function(y, a, b) { return (a* Math.sqrt(1 + y*y/(b*b))); }

						if (b < 0)
						{
							cnc.dY = -cnc.dY; // make it positive
							cnc.yCompare = function(y) { return y <= 0;  }
						}
						else
							cnc.yCompare = function(y) { return y >= 0; }// && y <= yUpperBound; }

                        arg.unshift(cnc);	// stuff extra param at beginning of arg
                        drawConics.apply(this, arg); }
                    },

			//=================================================================================
			hyperbolaypos: { nParam:4,   fn: function (arg, color)                            // 'hyperbolaypos',
                    {   var cnc = initConicFn(arg, color);
						var a = arg[3], b = arg[4]; // color, h, k, a, b

                        // (y-k)^2/b^2 - (x-h)^2/a^2 = 1
                        cnc.Eq = function(x, a, b) { return b * Math.sqrt( x*x / (a*a) + 1); }

						// set up for drawConicsYtoX:
						cnc.EqYtoX = function(y, a, b) { return (a* Math.sqrt(y*y/(b*b)-1)); }
						if (a < 0)
						{
							cnc.dX = -cnc.dX; // make it positive
							cnc.xStart = -cnc.xStart;
							cnc.xCompare = function(x) { return x <= 0;  }
						}

						if (b < 0)
							cnc.dY = -cnc.dY; // make it positive

						cnc.yCompare = function(y, k, b) { return Math.abs(y) >= Math.abs(b); }// && y <= yUpperBound; }

                        arg.unshift(cnc);	// stuff extra param at beginning of arg
                        drawConics.apply(this, arg); }
                    },

			//=================================================================================
            point:  { nParam:2,   fn: function(arg, color, option)
                        {   arg.unshift(color, option); // stuff extra param at beginning,
                                                    // since label in the arg is an optional param
                            drawDotEq.apply(this, arg); }
					}
		};

		//--------------------------------------------------------
        for (var i=0; i < drawAry.length; i++)
        {
            strEq = drawAry[i];
            colorEq = drawAry[i].color || 'black';
            option = drawAry[i].option;

            // parse the parameters:
            strEq = strEq.replace(/\s*/g, "").toLowerCase();
            eqType = strEq.slice(0, strEq.indexOf('='));
            args = strEq.slice(strEq.indexOf('=')+1).split(','); //.concat(colorEq);

            // build parameters and then draw the equation:
            if ( defined(eq[eqType]) )
            {
                // parse the parameters for current equation:
                for (var j=0; j < eq[eqType].nParam; j++) // string to number:
                    if ( isNaN( args[j] = parseFloat(args[j]) ) )
						args[j] = 0;
                        //fw.error(eqType + " equation parameter has to be a number!");

                if (args.length >= eq[eqType].nParam)
                   eq[eqType].fn(args, colorEq, option);
                else
					continue;
                    //fw.error(eqType + " equation does not have right number of parameters!");
            }
			else
				fw.warning('Attempting to graph unknown type: ' + eqType);
        }
    }

    /************************************************************************************
      Draw a straight line.
      Input:
        x1, y1  - start point in pixel unit
        x2, y2  - end point in pixel unit
        width   - line width in pixel unit
        color   - line color
    ************************************************************************************/
    app.drawLine = function(x1, y1, x2, y2, width, color)
    {
        x1 = Math.round(x1);
        y1 = Math.round(y1);
        x2 = Math.round(x2);
        y2 = Math.round(y2);

		ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();

        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        ctx.stroke();
        ctx.closePath();
    }

    /************************************************************************************
    ************************************************************************************/
    function drawDotEq(color, option, x, y, label)
    {
        //pt_px = _grid.LgcPtToCanvasPt(x, y);
        _grid.drawMouseLgcPt({x:x, y:y}, '', option, label);
    }

    /************************************************************************************
      Take the input degree and return the translated radians.
    ************************************************************************************/
    function degToRadian(deg)
    {
        return deg * Math.PI / 180;
    }

    /************************************************************************************
      x, y             - position of the local object coordinates in pixel unit to
                         translate system origin to before rotation.
      directionDegree  - rotation in degrees
    ************************************************************************************/
    function transform(x, y, rotateDeg)
    {
        var directionInRad = degToRadian(rotateDeg);

		setTransformToIdentity(ctx);

        // translate rotation center to the tip position:
        ctx.translate(x, y);
        ctx.rotate(directionInRad);
    }

    /************************************************************************************
      x, y             - position of the arrow tip in pixel unit
      directionDegree  - direction in degrees where the arrow points to
                         zero degree - arrow points to the right
      length           - length of the arrow along the opposite direction of arrow tip
    ************************************************************************************/
    app.drawArrow = function(x, y, directionDegree, length, color)
    {
        var arrowSlentDegree = 5;
        var width = length * Math.tan(degToRadian(arrowSlentDegree));

        transform(x, y, directionDegree);

        // pretend the rotation degree is zero so we draw an arrow points to the right,
        // the trasform call above will take care the rotation effect.
        // since the screen origin has been translated to the tip of the arraw,
        // we need to use the local coordinate instead of original x,y:
        //
        app.drawLine(0, 0, -length, +width, 2, color);
        app.drawLine(0, 0, -length, -width, 2, color);
    }

	//=======================================================
	//=======================================================
    function drawDot(x, y, size)
    {
        ctx.fillRect(x-size/2, y-size/2, size, size);
    }

	//=======================================================
	//=======================================================
    function drawLineEqn(slope_lgc, intersect_lgc, color)
    {
        var ptScn1, ptScn2,
			x1 = xLowerBound,
            x2 = xUpperBound;

        var y1 = (x1 * slope_lgc + intersect_lgc),
            y2 = (x2 * slope_lgc + intersect_lgc);

        ptScn1 = _grid.LgcPtToCanvasPt(x1, y1);
        ptScn2 = _grid.LgcPtToCanvasPt(x2, y2);

		setTransformToIdentity(ctx);

        app.drawLine(ptScn1.x, ptScn1.y, ptScn2.x, ptScn2.y, 1, color); //that.graphColor);
    }

	//=======================================================
	// calculate y-value of exponential function at a given x-value
	// a: base of exponent
	// b: vertical scaling factor
	// h: horizontal shift
	// k: vertical shift
	// x: x-value to calculate value at
	//=======================================================
	function exponent(a,b,h,k,x)
	{
		if( (a == 0) && (x == 0) )
		{
			return Number.NaN;
		}
		else
		{
			return b * Math.pow(a,x-h)+k;
		}
	}

	//=======================================================
	// draw an exponential function
	// a: base of exponent
	// b: coefficient of exponent term
	// h: horizontal shift
	// k: vertical shift
	//=======================================================
	function drawExpEqn(a, b, h, k, color)
	{
		var ptScn1 = null,
		    ptScn2 = null,
			x1 = xLowerBound, // logical minimum x-value
			x2 = xUpperBound; // logical maximum x-value

		// determine minimum canvas point
		var canvasMinPt = _grid.LgcPtToCanvasPt(x1,0);

		// determine maximum canvas point
		var canvasMaxPt = _grid.LgcPtToCanvasPt(x2,0);

		// determine distance covered by a pixel
		var pixelDist = (x2 - x1) / (canvasMaxPt.x - canvasMinPt.x);

		// set transform matrix to identity:
		setTransformToIdentity(ctx);

		// for each pixel:
		for(var x = x1; x < x2; x += pixelDist)
		{
			// determine value of exponential function
			var y = exponent(a,b,h,k,x);

			// if this is the first point, move to the first point
			if(ptScn1 == null)
			{
				ptScn1 = _grid.LgcPtToCanvasPt(x, y);
				ptScn2 = _grid.LgcPtToCanvasPt(x, y);
			}

			// if this is not the first point, draw a line between the previous point and the current one
			else
			{
				ptScn1 = ptScn2;
				ptScn2 = _grid.LgcPtToCanvasPt(x, y);
				app.drawLine(ptScn1.x, ptScn1.y, ptScn2.x, ptScn2.y, 1, color); //that.graphColor);
			}
		}
	}

	//=======================================================
	// calculate y-value of logarithm function at a given x-value
	// a: vertical scaling factor
	// b: base of logarithm
	// h: horizontal shift
	// k: vertical shift
	// x: x-value to calculate value at
	//=======================================================
	function logarithm(a, b, h, k, x)
	{
	  if(x-h <= 0)
	  {
	    return -Infinity;
	  }
	  else if( (b <= 0) || (b == 1) )
	  {
	    return Number.NaN;
	  }
	  else
	  {
	    var y;
	    y = Math.log(x-h)/Math.log(b);
	    y *= a;
	    y += k;
	    return y;
	  }
    }

	//=======================================================
    // draw a logarithmic function
	// a: vertical scaling factor
	// b: base of logarithm
	// h: horizontal shift
	// k: vertical shift
	//=======================================================
	function drawLogEqn(a, b, h, k, color)
	{
		var ptScn1 = null,
		    ptScn2 = null,
			x1 = xLowerBound, // logical minimum x-value
			x2 = xUpperBound, // logical maximum x-value
			prevX = 0, prevY = 0;

		// determine minimum canvas point
		var canvasMinPt = _grid.LgcPtToCanvasPt(x1,0);

		// determine maximum canvas point
		var canvasMaxPt = _grid.LgcPtToCanvasPt(x2,0);

		// determine distance covered by a pixel
		var pixelDist = (x2 - x1) / (canvasMaxPt.x - canvasMinPt.x);

		// set transform matrix to identity:
		setTransformToIdentity(ctx);

		// for each pixel:
		//for(var x = x1; x < x2; x += pixelDist)
		for(var x = h; x < x2; x += pixelDist)
		{
			// determine value of log function
			var y = logarithm(a,b,h,k,x);

			// if this is the first point, move to the first point
			if(ptScn1 == null)
			{
				ptScn1 = _grid.LgcPtToCanvasPt(x, y);
				ptScn2 = _grid.LgcPtToCanvasPt(x, y);
			}

			// if this is not the first point, draw a line between the previous point and the current one
			else
			{
				ptScn1 = ptScn2;
				ptScn2 = _grid.LgcPtToCanvasPt(x, y);
				if(prevY == -Infinity)
				{
					if(a>0)
					{
						ptScn1 = _grid.LgcPtToCanvasPt(x, yLowerBound);
					}
					else
					{
						ptScn1 = _grid.LgcPtToCanvasPt(x, yUpperBound);
					}
				}
				app.drawLine(ptScn1.x, ptScn1.y, ptScn2.x, ptScn2.y, 1, color); //that.graphColor);
			}
			prevX = x;
			prevY = y;
		}
	}

	//=======================================================
	// calculate y-value of radical function at a given x-value
	// a: vertical scaling factor
	// h: horizontal shift
	// k: vertical shift
	// n: degree of the root
	// x: x-value to calculate value at
	//=======================================================
	function radical(a,h,k,n,x)
	{
		// I think we only want to allow integers for the degree of the root.
		// Consider removing this check if it degrades performance too much.
		if(n % 1 != 0)
		{
			return Number.NaN;
		}

		// determine the value of the radicand so as to avoid having multiple subtractions in this function
		var radicand = x-h;

		// if the degree of the root is even:
		if(n % 2 == 0)
		{
			// negative numbers do not have real roots of even degree
			if(radicand < 0)
			{
				return Number.NaN;
			}

			// raising a number to the 1/nth power is the same as taking the nth root of that number
			else
			{
				return a*Math.pow(radicand,1/n)+k;
			}
		}

		// if the degree of the root is odd:
		else
		{
			if(n % 2 == 0)
			{
				Console.log('Something went wrong.');
			}
			// there is a bug in the Math.pow() function where it does not return the correct answer when
			// raising a negative number to a fractional power.
			var factor = (radicand < 0) ? -1 : 1;

			return factor*a*Math.pow(factor*radicand,1/n)+k;
		}
	}

	//=======================================================
	// draw a radical function
	// a: vertical scaling factor
	// h: horizontal shift
	// k: vertical shift
	// n: degree of the root
	//=======================================================
	function drawRadEqn(a, h, k, n, color)
	{
		var ptScn1 = null,
		    ptScn2 = null,
		    ptScn0 = null,
			x1 = xLowerBound, // logical minimum x-value
			x2 = xUpperBound; // logical maximum x-value

		// determine minimum canvas point
		var canvasMinPt = _grid.LgcPtToCanvasPt(x1,0);

		// determine maximum canvas point
		var canvasMaxPt = _grid.LgcPtToCanvasPt(x2,0);

		// determine distance covered by a pixel
		var pixelDist = (x2 - x1) / (canvasMaxPt.x - canvasMinPt.x);

		// set transform matrix to identity:
		setTransformToIdentity(ctx);

		// if n is even, start graphing at h instead of the left edge of the grid
		if(n%2 == 0)
		{
			x1 = h;
		}

		// for each pixel:
		for(var x = x1; x < x2; x += pixelDist)
		{
			// determine value of radical function
			var y = radical(a,h,k,n,x);

			// if this is the first point, move to the first point
			if(ptScn1 == null)
			{
				ptScn1 = _grid.LgcPtToCanvasPt(x, y);
				ptScn2 = _grid.LgcPtToCanvasPt(x, y);
			}

			// if this is not the first point:
			else
			{
				ptScn1 = ptScn2;
				ptScn2 = _grid.LgcPtToCanvasPt(x, y);
				app.drawLine(ptScn1.x, ptScn1.y, ptScn2.x, ptScn2.y, 1, color); //that.graphColor);
			}
		}
	}

	//=======================================================
	// calculate y-value of rational function at a given x-value
	// a: vertical scaling factor
	// h: horizontal shift
	// k: vertical shift
	//=======================================================
	function rational(a, h, k, x)
	{
		if(x == h)
		{
			return Number.NaN;
		}
		else
		{
			return a/(x-h)+k;
		}
	}

	//=======================================================
	// draw a rational function
	// a: vertical scaling factor
	// h: horizontal shift
	// k: vertical shift
	//=======================================================
	function drawRatEqn(a, h, k, color)
	{
		var ptScn1 = null,
		    ptScn2 = null,
			x1 = xLowerBound, // logical minimum x-value
			x2 = xUpperBound; // logical maximum x-value
			var topPt;
			var botPt;
			var prevX=0;
			var prevY=0;

		// determine minimum canvas point
		var canvasMinPt = _grid.LgcPtToCanvasPt(x1,0);

		// determine maximum canvas point
		var canvasMaxPt = _grid.LgcPtToCanvasPt(x2,0);

		// determine distance covered by a pixel
		var pixelDist = (x2 - x1) / (canvasMaxPt.x - canvasMinPt.x);

		// set transform matrix to identity:
		setTransformToIdentity(ctx);

		// for each pixel:
		for(var x = x1; x < x2; x += pixelDist)
		{
			// determine value of radical function
			var y = rational(a,h,k,x);

			// if this is the first point, move to the first point
			if(ptScn1 == null)
			{
				ptScn1 = _grid.LgcPtToCanvasPt(x, y);
			}

			// otherwise, set ptScn1 to the old point, and set ptScn2 to the new point
			else
			{
				ptScn1 = ptScn2;
			}
			ptScn2 = _grid.LgcPtToCanvasPt(x, y);

			// if they are on opposite sides of the asymptote,
			// draw lines to the edge of the canvase as appropriate
			if( (x >= h) && (prevX <= h) )
			{
				// if a is positive, draw a line from the last point on the first arm to the bottom of the grid,
 				// and a line from the top of the grid to the first point on the second arm
 				if(a > 0)
 				{
					ptScn2 = _grid.LgcPtToCanvasPt(x, y);
					botPt = _grid.LgcPtToCanvasPt(prevX, yLowerBound);
 					app.drawLine(ptScn1.x, ptScn1.y, botPt.x, botPt.y, color);

 					topPt = _grid.LgcPtToCanvasPt(x, yUpperBound);
 					app.drawLine(topPt.x, topPt.y, ptScn2.x, ptScn2.y, color);
 				}

 				// if a is negative, draw a line from the last point on the first arm to the top of the grid,
 				// and a line from the bottom of the grid to the first point on the second arm
 				else
 				{
					ptScn2 = _grid.LgcPtToCanvasPt(x, y);
 					var topPt = _grid.LgcPtToCanvasPt(prevX, yUpperBound);
 					app.drawLine(ptScn1.x, ptScn1.y, topPt.x, topPt.y, color);

 					var botPt = _grid.LgcPtToCanvasPt(x, yLowerBound);
 					app.drawLine(botPt.x, botPt.y, ptScn2.x, ptScn2.y, color);
				}
			}

			// if the new point is off the canvas, and the old point is on the canvas,
			// draw a vertical line from the old point to the appropriate canvas edge.
			else if( (prevY < yUpperBound) &&
				(prevY > yLowerBound) &&
				(y > yUpperBound) )
			{
				topPt = _grid.LgcPtToCanvasPt(prevX, yUpperBound);
				app.drawLine(ptScn1.x, ptScn1.y, topPt.x, topPt.y, 1, color); //that.graphColor);
			}
			else if( (prevY < yUpperBound) &&
					 (prevY > yLowerBound) &&
					 (y < yLowerBound) )
			{
				botPt = _grid.LgcPtToCanvasPt(prevX, yLowerBound);
				app.drawLine(ptScn1.x, ptScn1.y, botPt.x, botPt.y, 1, color); //that.graphColor);
			}

			// if the new point is on the canvas, and the old point is off the canvas,
			// draw a vertical line from the appropriate canvas edge to the new point.
			else if( (y < yUpperBound) &&
					 (y > yLowerBound) &&
					 (prevY < yLowerBound) )
			{
				ptScn1 = _grid.LgcPtToCanvasPt(x, yLowerBound);
				ptScn2 = _grid.LgcPtToCanvasPt(x, y);
				app.drawLine(ptScn1.x, ptScn1.y, ptScn2.x, ptScn2.y, 1, color); //that.graphColor);
			}
			else if( (y < yUpperBound) &&
					 (y > yLowerBound) &&
					 (prevY > yUpperBound) )
			{
				ptScn1 = _grid.LgcPtToCanvasPt(x, yUpperBound);
				ptScn2 = _grid.LgcPtToCanvasPt(x, y);
				app.drawLine(ptScn1.x, ptScn1.y, ptScn2.x, ptScn2.y, 1, color); //that.graphColor);
			}

			// if both points are on the canvas:
			else if( (prevY < yUpperBound) &&
					 (prevY > yLowerBound) &&
					 (y < yUpperBound) &&
			    	 (y > yLowerBound) )
			{
				app.drawLine(ptScn1.x, ptScn1.y, ptScn2.x, ptScn2.y, 1, color); //that.graphColor);
			}
			prevX = x;
			prevY = y;
		}
	}

	//=======================================================
	// calculate a sine function
	// a: vertical scaling factor
	// h: horizontal shift
	// k: vertical shift
	//=======================================================
	function sin(a, h, k, x)
	{
		return a*Math.sin(x-h)+k;
	}

	//=======================================================
	// calculate a cosine function
	// a: vertical scaling factor
	// h: horizontal shift
	// k: vertical shift
	//=======================================================
	function cos(a, h, k, x)
	{
		return a*Math.cos(x-h)+k;
	}

	//=======================================================
	// calculate a tangent function
	// a: vertical scaling factor
	// h: horizontal shift
	// k: vertical shift
	//=======================================================
	function tan(a, h, k, x)
	{
		if( (x-h) % Math.PI == 0)
		{
			return Number.NaN;
		}
		else
		{
			return a*Math.tan(x-h)+k;
		}
	}

	//=======================================================
	// draw a sine function
	// a: vertical scaling factor
	// h: horizontal shift
	// k: vertical shift
	//=======================================================
	function drawSinEqn(a, h, k, color)
	{
		var ptScn1 = null,
		    ptScn2 = null,
			x1 = xLowerBound, // logical minimum x-value
			x2 = xUpperBound; // logical maximum x-value

		// determine minimum canvas point
		var canvasMinPt = _grid.LgcPtToCanvasPt(x1,0);

		// determine maximum canvas point
		var canvasMaxPt = _grid.LgcPtToCanvasPt(x2,0);

		// determine distance covered by a pixel
		var pixelDist = (x2 - x1) / (canvasMaxPt.x - canvasMinPt.x);

		// set transform matrix to identity:
		setTransformToIdentity(ctx);

		// for each pixel:
		for(var x = x1; x < x2; x += pixelDist)
		{
			// determine value of sine function
			var y = sin(a,h,k,x);

			// if this is the first point, move to the first point
			if(ptScn1 == null)
			{
				ptScn1 = _grid.LgcPtToCanvasPt(x, y);
				ptScn2 = _grid.LgcPtToCanvasPt(x, y);
			}

			// if this is not the first point, draw a line between the previous point and the current one
			else
			{
				ptScn1 = ptScn2;
				ptScn2 = _grid.LgcPtToCanvasPt(x, y);
				app.drawLine(ptScn1.x, ptScn1.y, ptScn2.x, ptScn2.y, 1, color); //that.graphColor);
			}
		}
	}

	//=======================================================
	// draw a cosine function
	// a: vertical scaling factor
	// h: horizontal shift
	// k: vertical shift
	//=======================================================
	function drawCosEqn(a, h, k, color)
	{
		var ptScn1 = null,
		    ptScn2 = null,
			x1 = xLowerBound, // logical minimum x-value
			x2 = xUpperBound; // logical maximum x-value

		// determine minimum canvas point
		var canvasMinPt = _grid.LgcPtToCanvasPt(x1,0);

		// determine maximum canvas point
		var canvasMaxPt = _grid.LgcPtToCanvasPt(x2,0);

		// determine distance covered by a pixel
		var pixelDist = (x2 - x1) / (canvasMaxPt.x - canvasMinPt.x);

		// set transform matrix to identity:
		ctx.setTransform(1, 0, 0, 1, 0, 0);

		// for each pixel:
		for(var x = x1; x < x2; x += pixelDist)
		{
			// determine value of cosine function
			var y = cos(a,h,k,x);

			// if this is the first point, move to the first point
			if(ptScn1 == null)
			{
				ptScn1 = _grid.LgcPtToCanvasPt(x, y);
				ptScn2 = _grid.LgcPtToCanvasPt(x, y);
			}

			// if this is not the first point, draw a line between the previous point and the current one
			else
			{
				ptScn1 = ptScn2;
				ptScn2 = _grid.LgcPtToCanvasPt(x, y);
				app.drawLine(ptScn1.x, ptScn1.y, ptScn2.x, ptScn2.y, 1, color); //that.graphColor);
			}
		}
	}
	//=======================================================
	// draw a tangent function
	// a: vertical scaling factor
	// h: horizontal shift
	// k: vertical shift
	//=======================================================
	function drawTanEqn(a, h, k, color)
	{
		var ptScn1 = null,
		    ptScn2 = null,
			x1 = xLowerBound, // logical minimum x-value
			x2 = xUpperBound; // logical maximum x-value
			var prevX, prevY;

		// determine minimum canvas point
		var canvasMinPt = _grid.LgcPtToCanvasPt(x1,0);

		// determine maximum canvas point
		var canvasMaxPt = _grid.LgcPtToCanvasPt(x2,0);

		// determine distance covered by a pixel
		var pixelDist = (x2 - x1) / (canvasMaxPt.x - canvasMinPt.x);

		// set transform matrix to identity:
		ctx.setTransform(1, 0, 0, 1, 0, 0);

		// for each pixel:
		for(var x = x1; x < x2; x += pixelDist)
		{
			// determine value of tangent function
			var y = tan(a,h,k,x);

			// if this is the first point, move to the first point
			if(ptScn1 == null)
			{
				ptScn1 = _grid.LgcPtToCanvasPt(x, y);
			}

			// otherwise, set ptScn1 to the old point, and set ptScn2 to the new point
			else
			{
				ptScn1 = ptScn2;
			}
			ptScn2 = _grid.LgcPtToCanvasPt(x, y);

			// if they are on opposite sides of the asymptote,
			// draw lines to the edge of the canvase as appropriate
			if( (a > 0) && (y < prevY) )
			{
				ptScn2 = _grid.LgcPtToCanvasPt(x, y);
				var topPt = _grid.LgcPtToCanvasPt(prevX, yUpperBound);
				app.drawLine(ptScn1.x, ptScn1.y, topPt.x, topPt.y, color);

				var botPt = _grid.LgcPtToCanvasPt(x, yLowerBound);
				app.drawLine(botPt.x, botPt.y, ptScn2.x, ptScn2.y, color);
			}

 				// if a is negative, draw a line from the last point on the first arm to the top of the grid,
 				// and a line from the bottom of the grid to the first point on the second arm
 			else if( (a < 0) && (y > prevY) )
			{
				// if a is positive, draw a line from the last point on the first arm to the bottom of the grid,
 				// and a line from the top of the grid to the first point on the second arm
				ptScn2 = _grid.LgcPtToCanvasPt(x, y);
				botPt = _grid.LgcPtToCanvasPt(prevX, yLowerBound);
				app.drawLine(ptScn1.x, ptScn1.y, botPt.x, botPt.y, color);

				topPt = _grid.LgcPtToCanvasPt(x, yUpperBound);
				app.drawLine(topPt.x, topPt.y, ptScn2.x, ptScn2.y, color);
			}

			// if the new point is off the canvas, and the old point is on the canvas,
			// draw a vertical line from the old point to the appropriate canvas edge.
			else if( (prevY < yUpperBound) &&
				(prevY > yLowerBound) &&
				(y > yUpperBound) )
			{
				topPt = _grid.LgcPtToCanvasPt(prevX, yUpperBound);
				app.drawLine(ptScn1.x, ptScn1.y, topPt.x, topPt.y, 1, color); //that.graphColor);
			}
			else if( (prevY < yUpperBound) &&
					 (prevY > yLowerBound) &&
					 (y < yLowerBound) )
			{
				botPt = _grid.LgcPtToCanvasPt(prevX, yLowerBound);
				app.drawLine(ptScn1.x, ptScn1.y, botPt.x, botPt.y, 1, color); //that.graphColor);
			}

			// if the new point is on the canvas, and the old point is off the canvas,
			// draw a vertical line from the appropriate canvas edge to the new point.
			else if( (y < yUpperBound) &&
					 (y > yLowerBound) &&
					 (prevY < yLowerBound) )
			{
				ptScn1 = _grid.LgcPtToCanvasPt(x, yLowerBound);
				ptScn2 = _grid.LgcPtToCanvasPt(x, y);
				app.drawLine(ptScn1.x, ptScn1.y, ptScn2.x, ptScn2.y, 1, color); //that.graphColor);
			}
			else if( (y < yUpperBound) &&
					 (y > yLowerBound) &&
					 (prevY > yUpperBound) )
			{
				ptScn1 = _grid.LgcPtToCanvasPt(x, yUpperBound);
				ptScn2 = _grid.LgcPtToCanvasPt(x, y);
				app.drawLine(ptScn1.x, ptScn1.y, ptScn2.x, ptScn2.y, 1, color); //that.graphColor);
			}

			// if both points are on the canvas:
			else if( (prevY < yUpperBound) &&
					 (prevY > yLowerBound) &&
					 (y < yUpperBound) &&
			    	 (y > yLowerBound) )
			{
				app.drawLine(ptScn1.x, ptScn1.y, ptScn2.x, ptScn2.y, 1, color); //that.graphColor);
			}
			prevX = x;
			prevY = y;

		}
	}

	//=======================================================
	// calculate a quadratic function in standard form at a given x-value
	// a: coefficient of squared term
	// b: coefficient of linear term
	// c: constant term
	//=======================================================
	function qS(a, b, c, x)
	{
		return a*x*x + b*x + c;
	}

	//=======================================================
	// draw a quadratic function in standard form
	// a: coefficient of squared term
	// b: coefficient of linear term
	// c: constant term
	//=======================================================
	function drawQuadSEqn(a, b, c, color)
	{
		var ptScn1 = null,
		    ptScn2 = null,
			x1 = xLowerBound, // logical minimum x-value
			x2 = xUpperBound; // logical maximum x-value

		// determine minimum canvas point
		var canvasMinPt = _grid.LgcPtToCanvasPt(x1,0);

		// determine maximum canvas point
		var canvasMaxPt = _grid.LgcPtToCanvasPt(x2,0);

		// determine distance covered by a pixel
		var pixelDist = (x2 - x1) / (canvasMaxPt.x - canvasMinPt.x);

		// set transform matrix to identity:
		setTransformToIdentity(ctx);

		// for each pixel:
		for(var x = x1; x < x2; x += pixelDist)
		{
			// determine value of quadratic function
			var y = qS(a,b,c,x);

			// if this is the first point, move to the first point
			if(ptScn1 == null)
			{
				ptScn1 = _grid.LgcPtToCanvasPt(x, y);
				ptScn2 = _grid.LgcPtToCanvasPt(x, y);
			}

			// if this is not the first point, draw a line between the previous point and the current one
			else
			{
				ptScn1 = ptScn2;
				ptScn2 = _grid.LgcPtToCanvasPt(x, y);
				app.drawLine(ptScn1.x, ptScn1.y, ptScn2.x, ptScn2.y, 1, color); //that.graphColor);
			}
		}
	}

	//=======================================================
	// calculate a quadratic function in vertex form at a given x-value
	// a: vertical scaling factor
	// h: horizontal shift
	// k: vertical shift
	//=======================================================

	function qV(a, h, k, x)
	{
		return a*(x-h)*(x-h)+k;
	}

	//=======================================================
	// draw a quadratic function in standard form
	// a: vertical scaling factor
	// h: horizontal shift
	// k: vertical shift
	//=======================================================
	function drawQuadVEqn(a, h, k, color)
	{
		var ptScn1 = null,
		    ptScn2 = null,
			x1 = xLowerBound,   // logical minimum x-value
			x2 = xUpperBound; // logical maximum x-value

		// determine minimum canvas point
		var canvasMinPt = _grid.LgcPtToCanvasPt(x1,0);

		// determine maximum canvas point
		var canvasMaxPt = _grid.LgcPtToCanvasPt(x2,0);

		// determine distance covered by a pixel
		var pixelDist = (x2 - x1) / (canvasMaxPt.x - canvasMinPt.x);

		// set transform matrix to identity:
		setTransformToIdentity(ctx);

		// for each pixel:
		for(var x = x1; x < x2; x += pixelDist)
		{
			// determine value of quadratic function
			var y = qV(a,h,k,x);

			// if this is the first point, move to the first point
			if(ptScn1 == null)
			{
				ptScn1 = _grid.LgcPtToCanvasPt(x, y);
				ptScn2 = _grid.LgcPtToCanvasPt(x, y);
			}

			// if this is not the first point, draw a line between the previous point and the current one
			else
			{
				ptScn1 = ptScn2;
				ptScn2 = _grid.LgcPtToCanvasPt(x, y);
				app.drawLine(ptScn1.x, ptScn1.y, ptScn2.x, ptScn2.y, 1, color); //that.graphColor);
			}
		}
	}

	//=======================================================
	//=======================================================
    function drawCircle(x_lgc, y_lgc, r_lgc, color)
    {
		// Safety checks -- don't allow negative radius
		if (r_lgc < 0)
			return;

        var ptScn1, ptScn2,
            r_px = _grid.xLgcLengthToPx(r_lgc);

        ptScn1 = _grid.LgcPtToCanvasPt(x_lgc, y_lgc);

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;

		setTransformToIdentity(ctx);

        ctx.arc(ptScn1.x, ptScn1.y, r_px, 0, Math.PI * 2, false);

        ctx.stroke();
        ctx.closePath();
    }

    /******************************************************************************
     Input (all in logic unit and need to be converted to Canvas px unit):
          a, b - x and y axis of the hyperbola.
          h, k - x,y distances from the center of hyperbola to the origin
                 of x,y system.

      Note: The cnc.Eq is to compute y according to x as if h, k are zeros;
      x type:
                hyperbola equation is:   x^2 / a^2 - y^2 / b^2 = 1;

                            therefore:   y = +- b * sqrt(x^2 / a^2 - 1)

      y type:
                hyperbola equation is:   y^2 / b^2 - x^2 / a^2 = 1;

                            therefore:   y = +- b * sqrt(x^2 / a^2 + 1)

      Algorithm:
        All the rendering is from the furthest opening points on the curve to the
      center point where the degenerate points are (eccept for eliipse, which is
      rendered from the center point to the furthest points on the x axist where the
      degenarate points are).
	  When the curve becomes too steep (y increases faster than x does), the rendering
	  swhiches to the algorithm that uses y to generate x coordinate. -- NF, 6/5/2015
    
    *****************************************************************************/
    function initConics(color, h, k, a, b)
    {
        var cnc = {
            dotSize:     1,
            hyperCenter: _grid.LgcPtToCanvasPt(h, k),
			xVertex:     0,		yVertex:     0,
			xVertexPx:   0,		yVertexPx:   0,
            bDrawNegativeX: true,
            bDrawPositiveY: true,
			xStart: xUpperBound + Math.abs(h), // consider after axis shifting
			yStart: yUpperBound + Math.abs(k),

			xCompare: function(x, h, a) { return x >= cnc.xVertex; },
			yCompare: function(y, k, b) { return y >= cnc.yVertex; },
        };

        cnc.dX = a / _grid.xLgcLengthToPx(a); // normalize the delta x

		if (b)
			cnc.dY = b / _grid.yLgcLengthToPx(b); // normalize the delta y
		else // hyperabla only has p which uses the position of a:
			cnc.dY = a / _grid.yLgcLengthToPx(a); // normalize the delta y

		cnc.dX = -cnc.dX;
		cnc.dY = -cnc.dY;

		setTransformToIdentity(ctx);
        ctx.translate(cnc.hyperCenter.x, cnc.hyperCenter.y);

        ctx.fillStyle = color;
        return cnc;
    }

	//======================================================================
	// return true 	= use drawConics function for rendering
	//		  false	= use drawConicsYtoX function for rendering
	//======================================================================
	function shouldRenderConicsXtoY(cnc, x0, y0, h, k, a, b)
	{
		var deltaY = cnc.Eq(x0, a, b) - cnc.Eq(x0 + cnc.dX, a, b);
		var deltaX = cnc.EqYtoX(y0, a, b) - cnc.EqYtoX(y0 + cnc.dY, a, b);

		if (!deltaX ||	// when y is close to zero
			Math.abs(deltaY) <= Math.abs(deltaX))
			return true;

		return false;
	}

    /******************************************************************************
        Draw a conic type such as hyperbola in the equation (x type)
            (x-h)^2/a^2 - (y-k)^2/b^2 = 1
        or y type :
            (y-k)^2/b^2 - (x-h)^2/a^2 = 1

        Input (all in logic unit and need to be converted to Canvas px unit):
          a, b - x and y axis of the hyperbola.
          h, k - x,y distances from the center of hyperbola to the origin
                 of x,y system.

        algorithm:
        1. translate the system origin to h,k;
        2. compute y according to x as if h, k are zeros;

        therefore:   y = +- b * sqrt(x^2/a^2 - 1)
     *****************************************************************************/
    function drawConics(cnc, color, h, k, a, b)
    {
        var x, y;
        var pt = {x:0, y:0};

//		ctx.fillStyle = color; // change color for debugging

		// use logic x to calculate logic y,
		// then convert to canvas coords before drawing it:
		for (x = cnc.xStart; 	cnc.xCompare(x, h, a); 	x += cnc.dX)
		{
			if (!y || shouldRenderConicsXtoY(cnc, x, y, h, k, a, b))
				y = cnc.Eq(x, a, b); //b * Math.sqrt( x*x / (a*a) - 1);
			else
			{
				cnc.yStart = y + cnc.dY;
				drawConicsYtoX(cnc, color, h, k, a, b);
				return;
			}

            pt.x = _grid.xLgcLengthToPx(x);
            pt.y = _grid.yLgcLengthToPx(y);

            drawDot( pt.x,  -pt.y, cnc.dotSize);

            if (cnc.bDrawNegativeX)    //conicType != 'parabolay2')
                drawDot(-pt.x,  -pt.y, cnc.dotSize);

            if (cnc.bDrawPositiveY) //conicType != 'parabolax2')
            {
                drawDot( pt.x, pt.y, cnc.dotSize);

                if (cnc.bDrawNegativeX) //conicType != 'parabolay2')
                    drawDot(-pt.x, pt.y, cnc.dotSize);
            }
        }

        // be nice to next function and reset transform:
		setTransformToIdentity(ctx);
    }

	/******************************************************************************
	When a conic curve changes rapidly in the Y direction, marching an uniform step
	size along the x direction to compute Y will result missed rendering spaces on
	the curve. To solve the problem we need to march an uniform step along the Y
	direction to compute X at such locations. When the curve becomes gentle again
	along the Y direction we go back to march along the X direction for rendering.
	The result will be a clean and smoothly rendered conic curve. -- NF, 6/5/2015

	Input (all in logic unit and need to be converted to Canvas px unit):
	  a, b - x and y axis of the hyperbola.
	  h, k - x,y distances from the center of hyperbola to the origin
			 of x,y system.

	algorithm:
	1. translate the system origin to h, k;
	2. compute x according to y as if h, k are zeros;

	To draw a conic type such as hyperbola in the equation (x type)
			(x-h)^2/a^2 - (y-k)^2/b^2 = 1
	therefore:   x = +- a * sqrt(y^2/b^2 + 1)
	*****************************************************************************/
	function drawConicsYtoX(cnc, color, h, k, a, b)
	{
//		ctx.fillStyle = 'red'; // change color for debugging
		var x, y;
		var pt = {x:0, y:0};

		// use logic y to calculate logic x,
		// then convert to canvas coords before drawing it:
		for (y = cnc.yStart;	cnc.yCompare(y, k, b);	y += cnc.dY)
		{
			if (x && shouldRenderConicsXtoY(cnc, x, y, h, k, a, b))
			{
				cnc.xStart = x + cnc.dX;
				drawConics(cnc, color, h, k, a, b);
				return;
			}
			else
				x = cnc.EqYtoX(y, a, b);

			pt.x = _grid.xLgcLengthToPx(x);
			pt.y = _grid.yLgcLengthToPx(y);

			drawDot( pt.x,  -pt.y, cnc.dotSize);

			if (cnc.bDrawNegativeX)    //conicType != 'parabolay2')
				drawDot(-pt.x,  -pt.y, cnc.dotSize);

			if (cnc.bDrawPositiveY) //conicType != 'parabolax2')
			{
				drawDot( pt.x, pt.y, cnc.dotSize);

				if (cnc.bDrawNegativeX) //conicType != 'parabolay2')
					drawDot(-pt.x, pt.y, cnc.dotSize);
			}
		}

		// be nice to next function and reset transform:
		setTransformToIdentity(ctx);
	}

	//=======================================================
	// Math.sign shim. Math.sign is an experimental function
	// not available in all browsers
	//=======================================================
	function mathSign(value)
	{
		var number = +value;
		if (number === 0) return number;
		if (Number.isNaN(number)) return number;
		return number < 0 ? -1 : 1;
	}

})();
