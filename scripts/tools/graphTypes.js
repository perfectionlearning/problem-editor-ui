//=======================================================
// Graph type tables
//=======================================================
;(function() {

		// Maps between model entry and UI display, plus contains other useful data for each graph type
		//  name: UI display text
		//  params: Text displayed for each type-specific parameter
		//  eqVars: Must be the same length as params!  List of variables in the mathml that get replaced.
		//  mml: MathML string that gets displayed as the formula.  Variables in eqVars are replaced by the parameters the user sets. In the MathML, they must be wrapped in <param> tags.
		app.graphTypeMap = {
			point: {
				name: 'Point',
				params: ['x', 'y'],
				eqVars: ['x', 'y'],
				mml: "<math xmlns='http://www.w3.org/1998/Math/MathML'><mrow><mo>(</mo><param>x</param><mo>,</mo><param>y</param><mo>)</mo></mrow></math>"
			},

			line: {
				name: 'Line',
				params: ['m', 'b'],
				eqVars: ['m', 'b'],
				mml: "<math xmlns='http://www.w3.org/1998/Math/MathML'><mrow><mi>y</mi><mo>=</mo><param>m</param><mi>x</mi><mo>+</mo><param>b</param></mrow></math>"
			},

			log: {
				name: 'Logarithm',
				params: ['a', 'b', 'h', 'k'],
				eqVars: ['a', 'b', 'h', 'k'],
				mml: "<math xmlns='http://www.w3.org/1998/Math/MathML'><mi>y</mi><mo>=</mo><param>k</param><mo>+</mo><param>a</param><msub><mi>log</mi><param>b</param></msub><mo>(</mo><mi>x</mi><mo>-</mo><param>h</param><mrow><mo>)</mo></mrow></math>"
			},

			exponent: {
				name: 'Exponent',
				params: ['a', 'b', 'h', 'k'],
				eqVars: ['a', 'b', 'h', 'k'],
				mml: "<math xmlns='http://www.w3.org/1998/Math/MathML'><mi>y</mi><mo>=</mo><param>b</param><msup><param>a</param><mrow><mi>x</mi><mo>-</mo><param>h</param></mrow></msup><mo>+</mo><param>k</param></math>"
			},

			rational: {
				name: 'Rational',
				params: ['a', 'h', 'k'],
				eqVars: ['a', 'h', 'k'],
				mml: "<math xmlns='http://www.w3.org/1998/Math/MathML'><mi>y</mi><mo>=</mo><mfrac><param>a</param><mrow><mi>x</mi><mo>-</mo><param>h</param></mrow></mfrac><mo>+</mo><param>k</param></math>"
			},

			radical: {
				name: 'Radical',
				params: ['a', 'h', 'k', 'n'],
				eqVars: ['a', 'h', 'k', 'n'],
				mml: "<math xmlns='http://www.w3.org/1998/Math/MathML'><mi>y</mi><mo>=</mo><param>a</param><mroot><mrow><mi>x</mi><mo>-</mo><param>h</param></mrow><param>n</param></mroot><mo>+</mo><param>k</param></math>"
			},

			sin: {
				name: 'Sine',
				params: ['a', 'h', 'k'],
				eqVars: ['a', 'h', 'k'],
				mml: "<math xmlns='http://www.w3.org/1998/Math/MathML'><mi>y</mi><mo>=</mo><param>k</param><mo>+</mo><param>a</param><mi>sin</mi><mo>(</mo><mi>x</mi><mo>-</mo><param>h</param><mrow><mo>)</mo></mrow></math>"
			},

			cos: {
				name: 'Cosine',
				params: ['a', 'h', 'k'],
				eqVars: ['a', 'h', 'k'],
				mml: "<math xmlns='http://www.w3.org/1998/Math/MathML'><mi>y</mi><mo>=</mo><param>k</param><mo>+</mo><param>a</param><mi>cos</mi><mo>(</mo><mi>x</mi><mo>-</mo><param>h</param><mrow><mo>)</mo></mrow></math>"
			},

			tan: {
				name: 'Tangent',
				params: ['a', 'h', 'k'],
				eqVars: ['a', 'h', 'k'],
				mml: "<math xmlns='http://www.w3.org/1998/Math/MathML'><mi>y</mi><mo>=</mo><param>k</param><mo>+</mo><param>a</param><mi>tan</mi><mo>(</mo><mi>x</mi><mo>-</mo><param>h</param><mrow><mo>)</mo></mrow></math>"
			},

			circle: {
				name: 'Circle',
				params: ['Center x', 'Center y', 'Radius'],
				eqVars: ['h', 'k', 'r'],
				mml: "<math xmlns='http://www.w3.org/1998/Math/MathML'><mrow><msup><mrow><mrow><mo>(</mo><mrow><mi>x</mi><mo>-</mo><param>h</param></mrow><mo>)</mo></mrow></mrow><mn>2</mn></msup><mo>+</mo><msup><mrow><mrow><mo>(</mo><mrow><mi>y</mi><mo>-</mo><param>k</param></mrow><mo>)</mo></mrow></mrow><mn>2</mn></msup><mo>=</mo><msup><param>r</param><mn>2</mn></msup></mrow></math>"
			},

			ellipse: {
				name: 'Ellipse',
				params: ['h', 'k', 'a', 'b'],
				eqVars: ['h', 'k', 'a', 'b'],
				mml: "<math xmlns='http://www.w3.org/1998/Math/MathML'><mrow><mfrac><mrow><msup><mrow><mo>(</mo><mi>x</mi><mo>-</mo><param>h</param><mo>)</mo></mrow><mn>2</mn></msup></mrow><mrow><msup><param>a</param><mn>2</mn></msup></mrow></mfrac><mo>+</mo><mfrac><mrow><msup><mrow><mo>(</mo><mi>y</mi><mo>-</mo><param>k</param><mo>)</mo></mrow><mn>2</mn></msup></mrow><mrow><msup><param>b</param><mn>2</mn></msup></mrow></mfrac><mo>=</mo><mn>1</mn></mrow></math>"
			},

			hyperbolaxpos: {
				name: 'Hyperbola X',
				params: ['h', 'k', 'a', 'b'],
				eqVars: ['h', 'k', 'a', 'b'],
				mml: "<math xmlns='http://www.w3.org/1998/Math/MathML'><mrow><mfrac><mrow><msup><mrow><mo>(</mo><mi>x</mi><mo>-</mo><param>h</param><mo>)</mo></mrow><mn>2</mn></msup></mrow><mrow><msup><param>a</param><mn>2</mn></msup></mrow></mfrac><mo>-</mo><mfrac><mrow><msup><mrow><mo>(</mo><mi>y</mi><mo>-</mo><param>k</param><mo>)</mo></mrow><mn>2</mn></msup></mrow><mrow><msup><param>b</param><mn>2</mn></msup></mrow></mfrac><mo>=</mo><mn>1</mn></mrow></math>"
			},
			hyperbolaypos: {
				name: 'Hyperbola Y',
				params: ['h', 'k', 'a', 'b'],
				eqVars: ['h', 'k', 'a', 'b'],
				mml: "<math xmlns='http://www.w3.org/1998/Math/MathML'><mrow><mfrac><mrow><msup><mrow><mo>(</mo><mi>y</mi><mo>-</mo><param>k</param><mo>)</mo></mrow><mn>2</mn></msup></mrow><mrow><msup><param>b</param><mn>2</mn></msup></mrow></mfrac><mo>-</mo><mfrac><mrow><msup><mrow><mo>(</mo><mi>x</mi><mo>-</mo><param>h</param><mo>)</mo></mrow><mn>2</mn></msup></mrow><mrow><msup><param>a</param><mn>2</mn></msup></mrow></mfrac><mo>=</mo><mn>1</mn></mrow></math>"
			},

			parabolax2: {
				name: 'Parabola X',
				params: ['h', 'k', 'p'],
				eqVars: ['h', 'k', 'p'],
				mml: "<math xmlns='http://www.w3.org/1998/Math/MathML'><mi>y</mi><mo>-</mo><param>k</param><mo>=</mo><mfrac><mn>1</mn><mrow><mn>4</mn><param>p</param></mrow></mfrac><mo>(</mo><mi>x</mi><mo>-</mo><param>h</param><msup><mrow><mo>)</mo></mrow><mn>2</mn></msup></math>"
			},
			parabolay2: {
				name: 'Parabola Y',
				params: ['h', 'k', 'p'],
				eqVars: ['h', 'k', 'p'],
				mml: "<math xmlns='http://www.w3.org/1998/Math/MathML'><mi>x</mi><mo>-</mo><param>h</param><mo>=</mo><mfrac><mn>1</mn><mrow><mn>4</mn><param>p</param></mrow></mfrac><mo>(</mo><mi>y</mi><mo>-</mo><param>k</param><msup><mrow><mo>)</mo></mrow><mn>2</mn></msup></math>"
			},
			parabolastd: {
				name: 'Parabola standard form',
				params: ['a', 'b', 'c'],
				eqVars: ['a', 'b', 'c'],
				mml: "<math xmlns='http://www.w3.org/1998/Math/MathML'><mi>y</mi><mo>=</mo><msup><param>a</param><mn>2</mn></msup><mo>+</mo><param>b</param><mi>x</mi><mo>+</mo><param>c</param></math>"
			}
		}

		//=======================================================
		// Convert from graph name to internal graph type
		//=======================================================
		app.getGraphType = function(name) {
			var out = "";
			$.each(app.graphTypeMap, function(key, val) {
				if (val.name === name)
				{
					out = key;
					return false;	// break
				}
			});

			return out;
		}

		//=======================================================
		//=======================================================
		app.graphTypeList = function() {
			var out = [];
			$.each(app.graphTypeMap, function(idx, val) {
				out.push(val.name);
			});

			return out;
		}

})();
