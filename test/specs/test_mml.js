//===========================================================================================
// MathML and XML processing
//===========================================================================================
describe("MathML Processing", function() {

	//=======================================================
	//=======================================================
	it("Should replace sections wrapped with <mo>[ with <mtext>[", function() {
		// Somewhat complex example: 7[a](y/[b])8sqrt([c+1])
		var source =
			'<math xmlns="http://www.w3.org/1998/Math/MathML">' +
			 '<mrow>' +
			  '<mn>7</mn>' +
			  '<mo stretchy="false">[</mo><mi>a</mi><mo stretchy="false">]</mo>' +
			  '<mfrac>' +
			   '<mi>y</mi>' +
			   '<mrow>' +
				'<mo stretchy="false">[</mo><mi>b</mi><mo stretchy="false">]</mo>' +
			   '</mrow>' +
			  '</mfrac>' +
			  '<mn>8</mn>' +
			  '<msqrt>' +
			   '<mrow>' +
				'<mo stretchy="false">[</mo><mi>c</mi><mo>+</mo><mn>1</mn><mo stretchy="false">]</mo>' +
			   '</mrow>' +
			  '</msqrt>' +
			 '</mrow>' +
			'</math>';

		var xml = app.xml.stringToXML(source);
		xml = $(xml);
		app.mathML.cleanBrackets(xml);
		var result = app.xml.XMLToString(xml[0]);

		var desired =
			'<math xmlns="http://www.w3.org/1998/Math/MathML">' +
			 '<mrow>' +
			  '<mn>7</mn>' +
			  '<mtext>[a]</mtext>' +
			  '<mfrac>' +
			   '<mi>y</mi>' +
			   '<mrow>' +
			    '<mtext>[b]</mtext>' +
			   '</mrow>' +
			  '</mfrac>' +
			  '<mn>8</mn>' +
			  '<msqrt>' +
			   '<mrow>' +
			    '<mtext>[c+1]</mtext>' +
			   '</mrow>' +
			  '</msqrt>' +
			 '</mrow>' +
			'</math>';

		expect(result).toBe(desired);
	});

	//=======================================================
	//=======================================================
	it("should set the MathML namespace if it isn't already set", function() {
		var source =
			'<math>' +
			  '<mn>7</mn>' +
			'</math>';

		// XML-based test.
//		var xml = app.xml.stringToXML(source);
//		app.mathML.setNamespace(xml);
//		var result = app.xml.XMLToString(xml[0]);

		var result = app.mathML.setNamespace(source);

		var desired =
			'<math xmlns="http://www.w3.org/1998/Math/MathML">' +
			  '<mn>7</mn>' +
			'</math>';

		expect(result).toBe(desired);
	});

	//=======================================================
	//=======================================================
	it("should set accent=true for all overbars", function() {
		// Try <mover>, <mover accent="false"> with overbar, and <mover> with a different character
		var source =  "<math xmlns='http://www.w3.org/1998/Math/MathML'><mrow><msqrt><mrow><msup>" +
			"<mover><mi>a</mi><mo>¯</mo></mover><mn>2</mn></msup><mo>+</mo><msup>" +
			"<mover accent='false'><mi>b</mi><mo>¯</mo></mover>" +
			"<mover><mi>a</mi><mo>^</mo></mover><mn>2</mn></msup></mrow></msqrt></mrow></math>";

		var desired = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><msqrt><mrow><msup><mover accent="true"><mi>a</mi><mo>¯</mo></mover><mn>2</mn></msup><mo>+</mo><msup><mover accent="true"><mi>b</mi><mo>¯</mo></mover><mover><mi>a</mi><mo>^</mo></mover><mn>2</mn></msup></mrow></msqrt></mrow></math>';

		var xml = app.xml.stringToXML(source);
		xml = $(xml);
		app.mathML.fixOverbars(xml);
		var result = app.xml.XMLToString(xml[0]);

		expect(result).toBe(desired);
	});

	//=======================================================
	//=======================================================
	it("should replace all <mfenced> parenthesis blocks with a <mo>(</mo>...<mo>)</mo> block", function() {
		var source =
			"<math xmlns='http://www.w3.org/1998/Math/MathML'>" +
			  "<mfenced>" +
				"<mi>a</mi>" +
				"<mo>+</mo>" +
				"<mfrac>" +
				 "<mrow>" +
				  "<mi>b</mi>" +
				  "<mo>[</mo><mi>d</mi><mo>]</mo>" +
				 "</mrow>" +
				 "<mrow>" +
				  "<mfenced>" +
					"<mi>c</mi><mo>+</mo><mn>1</mn>" +
				  "</mfenced>" +
				 "</mrow>" +
				"</mfrac>" +
			  "</mfenced>" +
			"</math>";

		var desired =
			'<math xmlns="http://www.w3.org/1998/Math/MathML">' +
			  '<mrow>' +
			  '<mo>(</mo>' +
				'<mi>a</mi>' +
				'<mo>+</mo>' +
				'<mfrac>' +
				 '<mrow>' +
				  '<mi>b</mi>' +
				  '<mo>[</mo><mi>d</mi><mo>]</mo>' +
				 '</mrow>' +
				 '<mrow>' +
				   '<mrow>' +
					'<mo>(</mo>' +
					  '<mi>c</mi><mo>+</mo><mn>1</mn>' +
					'<mo>)</mo>' +
				   '</mrow>' +
				 '</mrow>' +
				'</mfrac>' +
			  '<mo>)</mo>' +
			  '</mrow>' +
			'</math>';

		var xml = app.xml.stringToXML(source);
		xml = $(xml);
		app.mathML.fixParens(xml);
		var result = app.xml.XMLToString(xml[0]);

		expect(result).toBe(desired);
	});

	//=======================================================
	//=======================================================
	it("should wrap portions of text nodes in arbitrary tags", function() {
		var source =  'This is a test';
		var desired = 'This <span class="myclass">is a</span> test';

		var xml = app.xml.stringToXML(source);
		xml = $(xml);
		app.xml.splitTextNode(xml[0].firstChild, 5, 9, 'span', 'myclass');
		var result = app.xml.XMLToString(xml[0]);

		expect(result).toBe(desired);
	});

	//=======================================================
	//=======================================================
	it("should highlight variables inside HTML", function() {
		var source =  '<p>Hi: [a] [c]!</p><p>Or [b+1] <i>is </i>nice.</p>';
		var desired = '<p>Hi: <span class="hasVariable">[a]</span><span class="hasVariable">[c]</span>!</p><p>Or <span class="hasVariable">[b+1]</span><i>is </i>nice.</p>';

		var xml = app.xml.stringToXML(source);
		xml = $(xml);
		app.mathML.highlightVars(xml);
		var result = app.xml.XMLToString(xml[0]);

		expect(result).toBe(desired);
	});

	//=======================================================
	//=======================================================
	it("should highlight variables inside MathML", function() {
		var source =  '<math><mtext>[a+b]</mtext></math>';
		var desired = '<math><mtext class="hasVariable">[a+b]</mtext></math>';

		var xml = app.xml.stringToXML(source);
		xml = $(xml);
		app.mathML.cleanBrackets(xml);
		app.mathML.highlightVars(xml);
		var result = app.xml.XMLToString(xml[0]);

		expect(result).toBe(desired);
	});

	//=======================================================
	//=======================================================
	it("should remove highlighting from variables inside HTML", function() {
		var source =  '<p>Hi: <span class="hasVariable">[a]</span> <span class="hasVariable">[c]</span>!</p><p>Or <span class="hasVariable">[b+1]</span> <i>is </i>nice.</p>';
		var desired = '<p>Hi: [a] [c]!</p><p>Or [b+1] <i>is </i>nice.</p>';

		var xml = app.xml.stringToXML(source);
		xml = $(xml);
		app.mathML.removeHighlights(xml);
		var result = app.xml.XMLToString(xml[0]);

		expect(result).toBe(desired);
	});

	//=======================================================
	//=======================================================
	it("should remove highlighting from variables inside MathML", function() {
		var source =  '<math><mtext class="hasVariable">[a+b]</mtext></math>';
		var desired = '<math><mtext>[a+b]</mtext></math>';

		var xml = app.xml.stringToXML(source);
		xml = $(xml);
		app.mathML.removeHighlights(xml);
		var result = app.xml.XMLToString(xml[0]);

		expect(result).toBe(desired);
	});

	//=======================================================
	//=======================================================
	it("should convert <maction> tags to <menclose>", function() {
		var source =  '<math><maction><mtext>[a+1]</mtext></maction></math>';
		var desired = '<math><menclose notation="box"><mtext>[a+1]</mtext></menclose></math>';

		var xml = app.xml.stringToXML(source);
		xml = $(xml);
		app.mathML.hideMaction(xml);
		var result = app.xml.XMLToString(xml[0]);

		expect(result).toBe(desired);
	});

	//=======================================================
	//=======================================================
	it("should convert <menclose> tags to <maction>", function() {
		var source =  '<math><menclose notation="box">[a+1]</menclose></math>';
		var desired = '<math><maction selection="1" actiontype="input">[a+1]</maction></math>';

		var xml = app.xml.stringToXML(source);
		xml = $(xml);
		app.mathML.showMaction(xml);
		var result = app.xml.XMLToString(xml[0]);

		expect(result).toBe(desired);
	});

	//=======================================================
	//=======================================================
	it("should be able to insert nodes between a given node and its children", function() {
		var source =  '<a><b/><c/></a><d/>';
		var desired = '<a><e><b/><c/></e></a><d/>';

		var xml = app.xml.stringToXML(source);
		xml = $(xml);
		app.xml.xmlWrapChildren(xml.find('a')[0], 'e');
		var result = app.xml.XMLToString(xml[0]);

		expect(result).toBe(desired);
	});

	//=======================================================
	//=======================================================
	it("should resize the =? combo", function() {
		var source =  '<mover><mo>=</mo><mo>?</mo></mover>';
		var desired = '<mover><mo>=</mo><mo mathsize="small">?</mo></mover>';

		var xml = app.xml.stringToXML(source);
		xml = $(xml);
		app.resizeQuestionEquals(xml);
		var result = app.xml.XMLToString(xml[0]);

		expect(result).toBe(desired);
	});

	//=======================================================
	//=======================================================
	it("should remove function application operators", function() {
		var source =  '<mi>f</mi><mo>&#x2061;</mo><mrow><mo>(</mo><mi>x</mi><mo>)</mo></mrow>';
		var desired = '<mi>f</mi><mrow><mo>(</mo><mi>x</mi><mo>)</mo></mrow>';

		var xml = app.xml.stringToXML(source);
		xml = $(xml);
		app.deleteFunctions(xml);
		var result = app.xml.XMLToString(xml[0]);

		expect(result).toBe(desired);
	});

	//=======================================================
	//=======================================================
	it("should split XML nodes into multiple pieces", function() {
		var source = '<mtext>first.second</mtext>';
		var desired = '<mtext>first</mtext><mtext>.second</mtext>';

		var xml = app.xml.stringToXML(source);
		xml = $(xml);
		var node = xml.find('mtext')[0];
		app.xml.splitNode(node, 5);
		var result = app.xml.XMLToString(xml[0]);

		expect(result).toBe(desired);
	});

	//=======================================================
	//=======================================================
	describe("convert mspace-based newlines to mtables", function() {

		//=======================================================
		//=======================================================
		it("should handle simple cases with 2 lines", function() {

			var source = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>a</mi><mspace linebreak="newline"/><mi>b</mi></math>'
			var desired = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mtable rowspacing="0" columnalign="left"><mtr><mtd><mi>a</mi></mtd></mtr><mtr><mtd><mi>b</mi></mtd></mtr></mtable></math>'

	//		var source = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mfrac><mn>1</mn><mn>2</mn></mfrac><mi>x</mi><mspace linebreak="newline"/><mfrac><mn>3</mn><mn>4</mn></mfrac><mi>y</mi></math>'
	//		var desired = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mtable rowspacing="0" columnalign="left"><mtr><mtd><mfrac><mn>1</mn><mn>2</mn></mfrac><mi>x</mi></mtd></mtr><mtr><mtd><mfrac><mn>3</mn><mn>4</mn></mfrac><mi>y</mi></mtd></mtr></mtable></math>';

			var xml = app.xml.stringToXML(source);
			xml = $(xml);
			app.mathML.convertNewlines(xml);
			var result = app.xml.XMLToString(xml[0]);

			expect(result).toBe(desired);
		});

		//=======================================================
		//=======================================================
		it("should handle complex cases with 2 lines", function() {

			var source = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mfrac><mn>1</mn><mn>2</mn></mfrac><mi>x</mi><mspace linebreak="newline"/><mfrac><mn>3</mn><mn>4</mn></mfrac><mi>y</mi></math>'
			var desired = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mtable rowspacing="0" columnalign="left"><mtr><mtd><mfrac><mn>1</mn><mn>2</mn></mfrac><mi>x</mi></mtd></mtr><mtr><mtd><mfrac><mn>3</mn><mn>4</mn></mfrac><mi>y</mi></mtd></mtr></mtable></math>';

			var xml = app.xml.stringToXML(source);
			xml = $(xml);
			app.mathML.convertNewlines(xml);
			var result = app.xml.XMLToString(xml[0]);

			expect(result).toBe(desired);
		});

		//=======================================================
		//=======================================================
		it("should handle complex cases with 3 lines", function() {
			var source = '<math xmlns="http://www.w3.org/1998/Math/MathML"><msup><mi>a</mi><mn>2</mn></msup><mi>b</mi><mspace linebreak="newline"/><mi>c</mi><msup><mi>d</mi><mn>2</mn></msup><mspace linebreak="newline"/><msup><mi>e</mi><mn>2</mn></msup><mi>f</mi></math>'
			var desired = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mtable rowspacing="0" columnalign="left"><mtr><mtd><msup><mi>a</mi><mn>2</mn></msup><mi>b</mi></mtd></mtr><mtr><mtd><mi>c</mi><msup><mi>d</mi><mn>2</mn></msup></mtd></mtr><mtr><mtd><msup><mi>e</mi><mn>2</mn></msup><mi>f</mi></mtd></mtr></mtable></math>'

			var xml = app.xml.stringToXML(source);
			xml = $(xml);
			app.mathML.convertNewlines(xml);
			var result = app.xml.XMLToString(xml[0]);

			expect(result).toBe(desired);
		});

		//=======================================================
		//=======================================================
		it("should handle cases with empty middle lines", function() {
			var source = '<math xmlns="http://www.w3.org/1998/Math/MathML"><msqrt><mn>4</mn></msqrt><mspace linebreak="newline"/><mspace linebreak="newline"/><msqrt><mn>9</mn></msqrt></math>';
			var desired = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mtable rowspacing="0" columnalign="left"><mtr><mtd><msqrt><mn>4</mn></msqrt></mtd></mtr><mtr><mtd/></mtr><mtr><mtd><msqrt><mn>9</mn></msqrt></mtd></mtr></mtable></math>';

			var xml = app.xml.stringToXML(source);
			xml = $(xml);
			app.mathML.convertNewlines(xml);
			var result = app.xml.XMLToString(xml[0]);

			expect(result).toBe(desired);

		});

		//=======================================================
		//=======================================================
		it("should handles cases with blank final lines", function() {
			var source = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>a</mi><mspace linebreak="newline"/><mi>b</mi><mspace linebreak="newline"/><mspace linebreak="newline"/></math>';
			var desired = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mtable rowspacing="0" columnalign="left"><mtr><mtd><mi>a</mi></mtd></mtr><mtr><mtd><mi>b</mi></mtd></mtr><mtr><mtd/></mtr><mtr><mtd/></mtr></mtable></math>';

			var xml = app.xml.stringToXML(source);
			xml = $(xml);
			app.mathML.convertNewlines(xml);
			var result = app.xml.XMLToString(xml[0]);

			expect(result).toBe(desired);
		});

	});

});
