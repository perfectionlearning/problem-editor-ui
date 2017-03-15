/********************************************************************************

  gridColor: Grid line color
  xRange: [min, max, grid step size]
  yRange: [min, max, grid step size]
********************************************************************************/
(function() {

	_grid = {};

	var Pi = '\u03c0';   //'&#960';
	var _negSignW = 2; // pixels

	var opts;
	var _ctx;
	var _xGrid, _yGrid;

	var style = {
		pointColor: 'darkgreen',
		pointTextColor: 'darkgreen',
		bgColor: 'white',
		gridColor: 'lightgray',
		axisColor: 'black',
		gridFont: "12px serif",
		gridFontColor: '#707070' // light gray
	};

	//=======================================================
	//=======================================================
	_grid.create = function(obj)
	{
		opts = obj;
		_ctx = obj.ctx;

		init();
		draw();
	}

	//=======================================================
	//=======================================================
    function initGrid(max_lgc, min_lgc, step_lgc, length_px, Offset_px)
    {
		if (max_lgc == min_lgc) { // prevent divide by zero later
			max_lgc = 10;
			min_lgc = -10;
		}

        var range_lgc = Math.abs(max_lgc - min_lgc);
        var idealNumGrids = 20, idealStep_lgc,
            maxNumGrids = idealNumGrids, minNumGrids = 4;
        var maxNum = Math.max(Math.abs(max_lgc), Math.abs(min_lgc));
        var metrics = _ctx.measureText("-");
        _negSignW = metrics.width; // pixels

        var grid =
        {
            max_lgc: max_lgc,
            min_lgc: min_lgc,
            step_lgc: step_lgc,
            nScale: 1,
            decimalPoints: 1,  // change this to alter the decimal precision of grid

            toStr: function(x)
            {
                if (typeof(x) == "string")
                    x = parseFloat(x);
                var f = x.toFixed(this.decimalPoints);
                var n = x.toFixed(0);
                if (f - n)
                    return f;
                return n;
            }
        }
        grid.maxDigits = fw.tools.countDigits(maxNum);

        var totalNumGrids = Math.round(range_lgc / step_lgc);

        if (totalNumGrids > maxNumGrids || totalNumGrids < minNumGrids)
        {
            if (range_lgc > idealNumGrids)
                idealStep_lgc = Math.floor(range_lgc / idealNumGrids); // ideal granuality = 20 grids
            else
            {
                idealNumGrids = 8;
                idealStep_lgc = Math.floor(range_lgc / idealNumGrids * 10) / 10;
            }

            grid.step_lgc = idealStep_lgc;
            totalNumGrids = Math.round(range_lgc / idealStep_lgc);
        }

        grid.maxSingleSideGrids = Math.floor(Math.max(Math.abs(max_lgc), Math.abs(min_lgc)) / grid.step_lgc);
//        grid.maxGrids = Math.floor(Math.abs(max_lgc) / grid.step_lgc);
        grid.minGrids = Math.floor(Math.abs(min_lgc) / grid.step_lgc);

        // float result for accurate gird origin computation:
        grid.step_px = ( length_px - Offset_px * 2 ) / totalNumGrids;

        // compute the grid origin:
        grid.origin = Math.round(length_px - Offset_px - Math.abs(max_lgc * grid.step_px / grid.step_lgc));

        // get the interger step size:
        grid.step_px = Math.round(grid.step_px);

//        grid.decimalFactor = 2 / grid.step_lgc; // half point precision
//        if (grid.decimalFactor < 1)
//            grid.decimalPoints = 0;

        return grid;
    }

    /************************************************************************************
      Initialize a

      Input:
		xRange: [min, max, step size]
    	yRange: [min, max, step size]
    ************************************************************************************/
    function init()
    {
        // Compute grid steps:
        var xOffset = 6, // pixels, so the edge of the grid can display points
            yOffset = 6;

        // index values for xRange, yRange to replace the magic numbers:
        var minIdx = 0, maxIdx=1, StepSize=2;

        _xGrid = initGrid(opts.xRange[maxIdx], opts.xRange[minIdx], opts.xRange[StepSize],
                          opts.w, xOffset);
        // y logic system is positive up, but y canvas system is positive down:
        _yGrid = initGrid(opts.yRange[minIdx], opts.yRange[maxIdx], opts.yRange[StepSize],
                          opts.h, yOffset);
    }

    /************************************************************************************
      Draw a x,y coordinate grid on Canvas

      Input:
		gridColor: Grid line color
		axisColor: color for the x,y axis
    ************************************************************************************/
    function draw()
    {
        var axisWidth = 1,
            ticHalfLength = 2, // pixels
            arrawLength = Math.round( 0.5 * _xGrid.step_px ),
            yTicBotm = _yGrid.origin + ticHalfLength,
            yTicTop = _yGrid.origin - ticHalfLength;


        // Paint background:
		_ctx.fillStyle = style.bgColor;
		_ctx.fillRect (0, 0, opts.w, opts.h);

        var color = style.gridColor;
        var axisColor = style.axisColor;

        // draw grid:
        for (var i=1; i <= _xGrid.maxSingleSideGrids; i++)
        {
            for (var j=1; j <= _yGrid.maxSingleSideGrids; j++)
            {
                var y = j * _yGrid.step_px;

                app.drawLine(0, _yGrid.origin + y, opts.w, _yGrid.origin + y, axisWidth, color);

                if (j <= _yGrid.minGrids)
                    app.drawLine(0, _yGrid.origin - y, opts.w, _yGrid.origin - y, axisWidth, color);
            }

            var x    = i * _xGrid.step_px;
            var x_px = _xGrid.origin + x;   // positive region of x:

            // draw short grid Tic on axis:
            app.drawLine(x_px, 0,         x_px, opts.h,   axisWidth, color);     // vertical grid lines
            app.drawLine(x_px, yTicBotm,  x_px, yTicTop,  axisWidth, axisColor); // tic bars

            if (i <= _xGrid.minGrids)
            {
                x_px = _xGrid.origin - x;   // negative region of x:
                app.drawLine(x_px, 0, x_px, opts.h, axisWidth, color);             // vertical grid lines
                app.drawLine(x_px, yTicBotm, x_px, yTicTop, axisWidth, axisColor); // tic bars
            }
        }

        printLabels(ticHalfLength, yTicBotm, yTicTop);

        // draw x axis:
        app.drawLine(0, _yGrid.origin, opts.w, _yGrid.origin, axisWidth, axisColor);

        // draw y axis:
        app.drawLine(_xGrid.origin, 0, _xGrid.origin, opts.h, axisWidth, axisColor);

        // draw arrows:
        app.drawArrow(opts.w-1, _yGrid.origin, 0, arrawLength * _xGrid.nScale, axisColor);  // on x-axis
        app.drawArrow(1, _yGrid.origin, 180, arrawLength * _xGrid.nScale, axisColor);  // on x-axis
        app.drawArrow(_xGrid.origin, 1, -90, arrawLength * _yGrid.nScale, axisColor);       // on y-axis
        app.drawArrow(_xGrid.origin, opts.h-1, 90, arrawLength * _yGrid.nScale, axisColor);       // on y-axis

        // set transform matrix to identity:
        _ctx.setTransform(1, 0, 0, 1, 0, 0); // clean up the transform after drawArrow
    }

	//=======================================================
	//=======================================================
    function isPrintableX(x, str)
    {
        var metrics = _ctx.measureText(str);
        var halfStrW = metrics.width / 2;
        return ( x + halfStrW < opts.w && x - halfStrW > 0 )
    }

	//=======================================================
	//=======================================================
    function isPrintableY(y, str)
    {
        // since measureText doesn't provide height, this is a approximation:
        var metrics = _ctx.measureText("M");
        var halfStrH = metrics.width;

        return ( y + halfStrH < opts.h && y - halfStrH > 0 )
    }

    /************************************************************************************
      Print labels on x and y axis of the grid

      Input:
        ticHalfLength: half length of the tics on the x axis.
        yTicBotm, yTicTop:  top and bottom Y positions of the tics on the x axis.
		gridFont: font for the labels
		gridFontColor: color for the labels
    ************************************************************************************/
    function printLabels(ticHalfLength, yTicBotm, yTicTop)
    {
        var xTextHoriz, yTextHoriz, xTextVert, yTextVert,
            xGridNumber, yGridNumber, content,
            yClearance = 4, // pixels
            xDecimalPts = 0, yDecimalPts = 0,
            iSkipPosit = 0, iSkipNegat = 0,
            maxDenorm = 8;

        var skipCnt = 0;        if (opts.labelSkip) skipCnt = opts.labelSkip;
        var skipStep = _yGrid.step_lgc * (skipCnt + 1),
            skipStepDelta = skipStep - skipStep.toFixed();
        if (skipStepDelta)
            yDecimalPts = 1;

        if (_xGrid.step_lgc < 1)
            xDecimalPts = 2;

        _ctx.font = style.gridFont;
        _ctx.fillStyle = style.gridFontColor; // light gray for grid lines
        _ctx.textAlign = "center";

        // Print grid numbers on x axis:
        yTextHoriz = yTicBotm - ticHalfLength*3;
        for (var i=1; i <= _xGrid.maxSingleSideGrids; i++)
        {
            // position of the label:
            x = i * _xGrid.step_px;
            xTextHoriz = _xGrid.origin + x;

            // numbers on x-axis:
            xGridNumber = (i * _xGrid.step_lgc).toFixed(xDecimalPts);
            if (opts.usePiLabels)
                content = decToFracPiStr(xGridNumber, maxDenorm);
            else
                content = xGridNumber;

            if (i < _xGrid.maxSingleSideGrids || isPrintableX(xTextHoriz, content))
                iSkipPosit = printOneLabel(content, xTextHoriz, yTextHoriz, iSkipPosit, skipCnt);

            xTextHoriz = _xGrid.origin - x - _negSignW;

            if (isPrintableX(xTextHoriz, content))
                iSkipNegat = printOneLabel("-"+content, xTextHoriz, yTextHoriz, iSkipNegat, skipCnt);
        }

        // Print grid numbers on y axis:
        _ctx.textAlign = "right";
        iSkipPosit = iSkipNegat = 0;
        xTextVert = _xGrid.origin -3; // 3 pixels to the left of y axis

        for (var j=1; j <= _yGrid.maxSingleSideGrids; j++)
        {
            // numbers on y-axis:
            yGridNumber = (j * _yGrid.step_lgc).toFixed(yDecimalPts);

            // position of the label:
            y = j * _yGrid.step_px;
            yTextVert = _yGrid.origin - y + yClearance;

            if (isPrintableY(yTextVert, yGridNumber))
				iSkipPosit = printOneLabel(yGridNumber, xTextVert, yTextVert, iSkipPosit, skipCnt);

            // logic y is positive up, while canvas y is positive down:
			yTextVert = _yGrid.origin + y - yClearance;
            if (isPrintableY(yTextVert, yGridNumber))
				iSkipNegat = printOneLabel("-"+yGridNumber, xTextVert, yTextVert, iSkipNegat, skipCnt);
        }
    }

	//=======================================================
	//=======================================================
    function printOneLabel(content, x, y, iSkip, skipCnt)
    {
        if (iSkip == skipCnt)
        {
            _ctx.fillText(content, x, y);
            iSkip = 0;
        }
        else
            iSkip++;
        return iSkip;
    }

    /************************************************************************************
     Convert a decimal number to string of a Pi factored fraction number.
     Input:
        dec         - the decimal number to be converted,
        maxDenom    - optional
                      the max denormitor of the conversion precision, default is 16

     Return:
        xFrac.upper - upper part of the factored fraction
        xFrac.lower - lower part of the factored fraction

     example:       xDec = 1.57;  maxDenorm = 8;
                    return: xFrac.upper = 1; xFrac.lower = 2;    (i.e. 1.57 = 1/2 Pi)
    ************************************************************************************/
    function decToFracPiStr(dec, maxDenorm)
    {
        var numPi = 3.14;
        var str = Pi;

        xFrac = decToFrac(dec, numPi, maxDenorm);
        if (xFrac.upper < 0)
            str = "-" + Pi;

        if (xFrac.lower != xFrac.upper)
        {
            if (Math.abs(xFrac.upper) > 1)
                str = xFrac.upper + Pi;

            if (xFrac.lower > 1)
                str += '/' + xFrac.lower;
        }
        return str;
    }

    /************************************************************************************
     Convert a decimal number to a factored fraction number.
     Input:
        xDec        - the decimal number to be converted,
        comDenorm   - optional
                      the common denormitor used for factoring, most often this = Pi.
                      If just want to convert a decimal number to fraction number,
                      make this equal to 1, which is default.
        maxDenom    - optional
                      the max denormitor of the conversion precision, default is 16

     Return:
        xFrac.upper - upper part of the factored fraction
        xFrac.lower - lower part of the factored fraction

     example:       xDec = 1.57; comDenorm = 3.14; maxDenorm = 8;
                    return: xFrac.upper = 1; xFrac.lower = 2;    (i.e. 1.57 = 1/2 Pi)
    ************************************************************************************/
    function decToFrac(xDec, comDenorm, maxDenorm)
    {
        var xFrac = {}, factor = 1,
            iMaxDenorm = 16, iComDenorm = 1;

        if (comDenorm) iComDenorm = comDenorm;
        if (maxDenorm) iMaxDenorm = maxDenorm;
/*
        for (var i = 1; i < iMaxDenorm; i++)
        {
            for (var j=1; j<=i; j++)
                if ( (i * xDec) % (j * comDenorm) == 0) // found factor
                    return factorOut(j, i);
        }
 */
        // the maxDenorm is not enough, so we round it up:
        xFrac.upper = Math.round(iMaxDenorm * xDec / comDenorm );
        xFrac.lower = iMaxDenorm;
        factorOut(xFrac);
        return xFrac;
    }

    function factorOut(frac) //upper, lower)
    {
        if (frac.upper === 1)
            return;

        for (var i=2; i <= frac.lower; i++)
        {
            if (frac.upper % i == 0 && frac.lower % i == 0)
            {
                frac.upper /= i;
                frac.lower /= i;
                factorOut(frac); // start again until no longer can be factored
            }
        }
    }

/*************************** public interface: ******************************************/

    /************************************************************************************
      Draw
    ************************************************************************************/
    _grid.draw = function()
    {
        draw();
    }

    _grid.LgcPtToCanvasPt = function(xLgc, yLgc)
    {
        var ptScrn = {};
        ptScrn.x = xLgc * _xGrid.step_px / _xGrid.step_lgc + _xGrid.origin;
        ptScrn.y = -yLgc * _yGrid.step_px / _yGrid.step_lgc + _yGrid.origin;

        return ptScrn;
    }

    /*****************************************************************************
      Input: x, y coordinates in canvas system
      Return: point of x,y in Logic unit with round up to half of the decimal precision
    *****************************************************************************/
    _grid.CanvasPtToLgcPt = function(x_px, y_px)
    {
        var ptLgc = {};
        ptLgc.x = this.canvasToLgc(x_px, _xGrid.origin, _xGrid.step_lgc, _xGrid.step_px );
        ptLgc.y = -this.canvasToLgc(y_px, _yGrid.origin, _yGrid.step_lgc, _yGrid.step_px);

        return ptLgc;
    }

    _grid.canvasToLgc = function (x_px, origin_px, step_lgc, step_px)
    {
        var decimalFactor = 2 / step_lgc; // half point precision
//        if (decimalFactor < 1)  decimalPoints = 0;

//        var xLgc = (Math.round((x_px - origin_px) * step_lgc / step_px * decimalFactor)
//                    / decimalFactor).toFixed(decimalPoints);
        var xLgc = Math.round((x_px - origin_px) * step_lgc / step_px * decimalFactor)
                    / decimalFactor;
        return xLgc;
    }

    _grid.xLgcLengthToPx = function(r_lgc)
    {
        return r_lgc * _xGrid.step_px / _xGrid.step_lgc;
    }

    _grid.yLgcLengthToPx = function(r_lgc)
    {
        return r_lgc * _yGrid.step_px / _yGrid.step_lgc;
    }

    /**************************************************************************
     The position of the mouse point is adjusted according to the round up
     logical point. This is to make it easier for the user to click the
     previous point displayed on the screen so the position doesn't have to be
     exact.
     Input:
        msePt_lgc   - x,y position of the mouse in logic unit
        color       - color of the mouse point, dashline, label
        dispPosition - if x,y position should be displayed
        label       - if a string lable should be printed in stead of x,y position
    **************************************************************************/
    _grid.drawMouseLgcPt = function(msePt_lgc, color, dispPosition, label)
    {
        var rCircle = 2; //pixels
        var yLableClearance = 16; // pixels

		if (!color)
			color = style.pointColor;

        // set transform matrix to identity:
        _ctx.setTransform(1, 0, 0, 1, 0, 0);

        var msePt_px  = _grid.LgcPtToCanvasPt(msePt_lgc.x, msePt_lgc.y);
        var xLable = msePt_px.x,
            yLable = msePt_px.y - rCircle * 3;

        // draw the dot:
        //_ctx.beginPath();
        _ctx.fillStyle = color;
    	_ctx.strokeStyle = color;
        _ctx.textAlign = "center";
        _ctx.beginPath();

        _ctx.arc(msePt_px.x, msePt_px.y, rCircle, 0, Math.PI * 2, false);
        _ctx.stroke();
        _ctx.closePath();
        _ctx.fill();

        // print the logical coordinates:
        var pt = {}
        pt.x = (msePt_lgc.x).toFixed(_xGrid.decimalPoints);
        pt.y = (msePt_lgc.y).toFixed(_yGrid.decimalPoints);

        var xStr = _xGrid.toStr(pt.x);
        if (opts.usePiLabels)
            xStr = decToFracPiStr(pt.x, 8);

        if (label)
            label = label.toUpperCase();
        else
		{
            if (dispPosition)
	            label = '(' + xStr + ', ' + _xGrid.toStr(pt.y) + ')';
			else
                return; // work is done if no label
		}

        var metrics = _ctx.measureText(label);
        var halfStrW = metrics.width / 2;

        // adjust position if the dot is near a border:
        if (msePt_px.x > opts.w - halfStrW)
            _ctx.textAlign = "right";
        if (msePt_px.x < halfStrW)
            _ctx.textAlign = "left";
        if (msePt_px.y < yLableClearance)
        {
            yLable = msePt_px.y + yLableClearance;
            if (!label) // label doesn't need to consider mouse cursor issue
            {
                if (msePt_px.x > that.w / 2)
                {
                    _ctx.textAlign = "right";
                    xLable -= 6; // avoid the slanting down arrow handle
                }
                else
                {
                    _ctx.textAlign = "left";
                    xLable += 12; // avoid the slanting down arrow handle
                }
            }
        }

        _ctx.fillStyle = style.pointTextColor;
        _ctx.fillText(label, xLable, yLable);
    }

    /************************************************************************************
     Convert a decimal number to string of a Pi factored fraction number.
     Input:
        dec         - the decimal number to be converted,
        maxDenom    - optional
                      the max denormitor of the conversion precision, default is 16

     Return:
        xFrac.upper - upper part of the factored fraction
        xFrac.lower - lower part of the factored fraction

     example:       xDec = 1.57;  maxDenorm = 8;
                    return: xFrac.upper = 1; xFrac.lower = 2;    (i.e. 1.57 = 1/2 Pi)
    ************************************************************************************/
    _grid.decToFracPiStr = function(dec, maxDenorm)
    {
        return decToFracPiStr(dec, maxDenorm);
    }

    _grid.xToStr = function(x) { return _xGrid.toStr(x); }
    _grid.yToStr = function(y) { return _yGrid.toStr(y); }
})();
