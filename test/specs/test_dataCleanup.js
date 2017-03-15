describe("Model Cleanup", function() {

    //=========================
	// Interface Selection
    //=========================
	describe("cleanHtml", function() {
		//=======================================================
		//=======================================================
		it("should remove empty classes from spans", function() {
			var test = '<span class="">test</span>' +
					   'hello<span id="bob" class="bob">lala<span id="joe" class="" style="width:10px">stuff</span></span>';
			var cleaned = app.testCleanHtml(test);

			expect(cleaned).toBe('<span>test</span>hello<span id="bob" class="bob">lala<span id="joe" style="width:10px">stuff</span></span>');
		});

		//=======================================================
		//=======================================================
		it("should replace all single quotes in tags with double quotes", function() {
			var test = "<span class='la' style='width:10px'>this can't fail, or won't</span>"+
					   "<span id='hi'>can't<span id='there'>won't</span>shouldn't can't</span>";
			var cleaned = app.testCleanHtml(test);

			expect(cleaned).toBe('<span class="la" style="width:10px">this can\'t fail, or won\'t</span><span id="hi">can\'t<span id="there">won\'t</span>shouldn\'t can\'t</span>');
		});
	});

});