//===========================================================================================
// MathML Processing Module
//
// Converts MathML from various sources into our standard version
//
// @FIXME/dg: This module has grown considerably.  It's time to consider moving highlighting
// (variable and input box) and variable substitution code to a new module.
//===========================================================================================
;(function() {

	app.mathML = {};

	var mathNamespace = "http://www.w3.org/1998/Math/MathML";

	var multiPartTags = ['msub', 'msup', 'msubsup', 'mover', 'munder', 'munderover'];	// Don't include 'mfrac' or 'mroot' -- They are multi-part, but the first parameter isn't logically connected to preceding siblings of the tag
	var allMultiPartTags = ['msub', 'msup', 'msubsup', 'mover', 'munder', 'munderover', 'mfrac', 'mroot'];	// The complete list.

//===========================================================================================
// WIRIS MathML Processing
//===========================================================================================

	//=======================================================
	// Clean up WIRIS MML
	//
	// This is the pipeline for processing MathML produced by WIRIS
	//=======================================================
	app.cleanWirisMML = function(string)
	{
		string = app.mathML.setNamespace(string);
		string = removeDisplayBlock(string);

		var xml = app.xml.stringToXML(string);
		if (xml === 'fail')
			return string;
		xml = $(xml);

		// @FIXME/dg: Why are all of these in the app.mathML namespace?  Most are private functions.
		// The functions are used by the test specs, so they need some kind of external access.
		app.mathML.flattenMenclose(xml);
		app.mathML.cleanBrackets(xml);
		app.mathML.fixOverbars(xml);
		app.mathML.fixParens(xml);
		app.mathML.shrinkSpaces(xml);
		app.mathML.convertNewlines(xml);
//		app.mathML.WrapMenclose(xml);

		return app.xml.XMLToString(xml[0]);
	}

	//=======================================================
	// Create WIRIS-approved MML
	//
	// WIRIS chokes on some valid MathML.  Perform cleanup before
	// sending data to WIRIS.
	//=======================================================
	app.createWirisMML = function(string)
	{
		string = string || "";
		string = app.mathML.setNamespace(string);
		var xml = app.xml.stringToXML(string);
		if (xml === 'fail')
			return string;
		xml = $(xml);

		// Combined adjacent <mtext> tags.  They will get re-split during cleanWirisMML.
		app.mathML.mergeMtext(xml);

		return app.xml.XMLToString(xml[0]);
	}

	//=======================================================
	// Flatten all data within <menclose>, converting it all
	// to a single <mtext> node.
	//=======================================================
	app.mathML.flattenMenclose = function(xml)
	{
		xml.find('menclose[notation="box"]').each(function() {

			// Flatten data within <menclose> while we're at it (will remove any existing <mtext>
			$(this).text($(this).text());

			// Move all children down a level, placing them within an <mtext>
			app.xml.xmlWrapChildren(this, 'mtext');
		});
	}

	//=======================================================
	// Wraps all <menclose> nodes that are direct children
	// of multi-part nodes in an <mrow>
	//
	// <menclose> nodes get converted to <mn> nodes when displaying the solution
	// to a free input problem, and <mtext> nodes when showing the question.
	// Evidently <mn> nodes can’t be the direct children of <mfrac> (and probably
	// all tags that have parameter nodes).
	//
	// UPDATE:
	// <mn> nodes can be children of <mfrac> nodes.  This change isn’t necessary.
	// The problem occurs only when MathML that is part of the DOM is being manipulated.
	// The Firefox MathML viewer shows the newly inserted nodes with capital names,
	// such as <MN> instead of <mn>.  I’m not sure what the difference is, but they are
	// displayed incorrectly.  Instead of wrapping in an <mrow>, which just hid the problem,
	// we are forced to remove the entire <math> tree from the DOM, edit it as a text string
	// using regular expressions, then insert it back into the DOM.  Manipulating it as a
	// disconnected XML tree didn’t work; reconverting from text was required.
	//
	// Summary: This MathML processing function is no longer being used.
	//=======================================================
	app.mathML.WrapMenclose	= function(xml)
	{
		xml.find('menclose[notation="box"]').each(function() {

			// Make sure we haven't already merged this node into something else.
			if (this.parentNode === null)
				return true;		// continue;

			if (allMultiPartTags.indexOf(this.parentNode.nodeName) !== -1)
				app.xml.xmlWrapNode(this, "mrow");
		});
	}

	//=======================================================
	// Convert <mo>&nbsp;</mo> to <mtext>&nbsp;</mtext>
	// Text spaces are narrower than math spaces.
	//=======================================================
	app.mathML.shrinkSpaces = function(xml)
	{
		xml.find('mo').each(function() {
			if (this.textContent === "\xa0")	// Non-breaking space, in hex
				app.xml.changeXmlNodeType(this, 'mtext');
		});
	}

	//=======================================================
	// Helper to check if a node is a closing bracket
	// Changed: check if a node contains a closing bracket
	//=======================================================
	function isClosing(node)
	{
		return (node.nodeName === 'mtext' && node.textContent.indexOf(']' !== -1))
//		return (node.nodeName === 'mo' && node.textContent === ']')
	}

	//=======================================================
	// Walk a XML tree, searching for the match to an open bracket
	//
	// Returns both the final node, and an indication of whether
	// it is a sibling or not (unless it's easy to determine externally).
	//=======================================================
	function findMatch(node)
	{
		var out = [node];

		while (node = node.nextSibling)
		{
			// Save the current node.  We want to do this in most but not all cases.
			// Instead of special casing everything, we will always save it, and then remove it
			// the one case when we don't actually want it.
			out.push(node);

			// Check for a sibling match
			if (isClosing(node))		// This should be passed in, making this more generic
				return out;

			// Check for a multi-part tag
			if (multiPartTags.indexOf(node.nodeName) !== -1)
			{
				// Check the first child
				if (node.childNodes.length > 0 && isClosing(node.childNodes[0]))
				{
					out.pop();		// Remove the multi-part node from the list.
					out.push(node.childNodes[0]);	// Replace it with the closing node.
					return out;
				}
			}
		}

		return null;	// A match wasn't found in the sibling list
	}

	//=======================================================
	//
	//=======================================================
	function createMText(oldNodes)
	{
		var text = "";
		$.each(oldNodes, function(idx, val) {
			text += val.textContent;
		});

		return app.xml.xmlCreateNode('mtext', text, oldNodes[0]);
	}

	//=======================================================
	// Find the nearest closing bracket, wherever it might be (it will be inside an <mtext>)
	// Return tree if the XML tree has changed
	//
	// Current algorithm: Grab all nodes (including the final one) in a flat array.
	// Create a new mtext node using text content from all those nodes
	// Insert it after the node containing the closing bracket (trouble?
	// Delete all of the nodes in the array
	//=======================================================
	function assimilate(node)
	{
		// Expand the sibling check.  The original version doesn't account for failures to make a match.
		// More importantly, the match can be a child of multi-parameter tags.  It is logically a
		// sibling of the opening bracket, but in the XML tree it isn't really a sibling.

		// The corollary is that an opening bracket that is the first parameter of a multi-part tag could
		// have a closing tag that is an XML sibling, but not a logical sibling, e.g. [^([x])]
		// In practice, that requires nested brackets, which shouldn't occur outside of a matrix.

		// Get all elements contained within the [] pair
		var match = findMatch(node);
		if (match === null)
			return false;		// We didn't do anything

		// Create a new node
		var newNode = createMText(match);

		// Insert the new node after the closing bracket
		var closing = _.last(match);
		closing.parentNode.insertBefore(newNode, closing);

		// Delete all of the old nodes
		$.each(match, function(idx, val) {
			val.parentNode.removeChild(val);
		});

		return true;
	}

	//=======================================================
	// Convert <mo>[</mo> ... <mo>]</mo> to <mtext>[ ... ]<mtext>
	// Also removes all tags from inside brackets
	//=======================================================
	function absorbBrackets(xml)
	{
		// This is a little wacky and inefficient.  If we used our own iterator system, this could be improved.
		// Any time we modify the XML tree, start over completely.  We could have easily deleted an element we are
		// about to scan.  Unless we can remove elements from the .find list, starting over is the only option.
		// Also, the process of <mtext> combining can leave the current node still unbalanced.  At the
		// very least we'd need to restart from the current node rather than continuing on.
		// This obviously can result in rescanning the beginning many times over.  Ideally we'll be
		// working with relatively small trees, so this should still be reasonably quick.  I hope.
		var doScan = true;		// Set true to cause a rescan (start as true to cause an initial scan)
		while (doScan)
		{
			doScan = false;	// Assume this is the final scan

			// Find all <mtext> operators containing [ or ]
			xml.find('mtext').each(function() {
				var openCnt = (this.textContent.match(/\[/g) || []).length;
				var closeCnt = (this.textContent.match(/\]/g) || []).length;

				if (closeCnt >= openCnt)
					return true;		// continue

				if (assimilate(this, xml))
				{
					doScan = true;		// The tree has been changed.  Start over.
					return false;		// break
				}
			});
		}
	}

	//=======================================================
	// Convert all <mo>[</mo> to <mtext>[</mtext> and
	// <mo>]</mo> to <mtext>]</mtext>
	//=======================================================
	function textifyBrackets(xml)
	{
		app.xml.replaceNodes(xml, 'mo', '[', 'mtext');
		app.xml.replaceNodes(xml, 'mo', ']', 'mtext');
	}

	//=======================================================
	// Convert text nodes to <mtext>.  Will this break our Flash container?
	// @FIXME/dg: This may have issues.  If there are non-mtext text nodes that can legitimately contain parenthesis,
	// this will still insert another <mtext> layer around them.
	//=======================================================
	function textifyTextNodes(xml)
	{
		xml.find('math').find(':not(mtext)').contents().filter(function() {return this.nodeType === 3}).each(function() {
			if (this.textContent.indexOf('[') !== -1)
				app.xml.convertFromTextNode(this, 'mtext');
		});
	}

	//=======================================================
	// Determine whether a node will be split in splitBracketNodes
	// We need to know ahead of time, to determine whether the node
	// should be wrapped in an mrow.
	//=======================================================
	function handleWrapping(node, text, pairs)
	{
		// Only worry about wrapping if this node is a parameter in a multi-part tag
		if (allMultiPartTags.indexOf(node.parentNode.nodeName) === -1)
			return;

		var willSplit = false;

		// Go through backwards, or else the indices will change!
		for (var i = pairs.length - 1; i >= 0; i--)
		{
			// Split off anything after the closing bracket, but only if there IS something
			// Split off anything before the opening bracket, but only if there IS something
			if ( (pairs[i][1] < text.length) || (pairs[i][0] > 0) )
			{
				willSplit = true;
				break;
			}
		}

		// If splitting will occur and this node is a parameter in a multi-part tag,
		// then we need to wrap everything in an <mrow>.
		if (willSplit)
			app.xml.xmlWrapNode(node, "mrow");
	}

	//=======================================================
	// Split <mtext> with multiple pairs of brackets into multiple <mtext> nodes
	// Later, we assume that bracket pairs take up an entire <mtext> node.
	//
	// Issue: Nodes can't always be freely split.  Multi-part tags treat nodes
	// as parameters.  Splitting nodes changes the parameters, destroying the markup.
	// Solution: If the parent is a multi-part tag (use the expanded list, not the subset list)
	// then wrap the newly split nodes in an <mrow>
	//
	// Note that we do a lot of joining and splitting.  Even without changing the text,
	// we repeatedly split and merge when opening and closing ckeditor.  That has the
	// potential to create a legion of <mrow> droppings.
	//=======================================================
	function splitBracketNodes(xml)
	{
		xml.find(":contains('[')").
			filter(function() { return $(this).children().length === 0; }).	// :contains searches all children, so every ancestor will get through.  Filter out all but the final child element.
			each(function() {

				if (this.tagName === 'mtext' || this.tagName === 'maction')
				{
					var text = safeTrim($(this).text());
					var pairs = getPairs('[', ']', text);

					// At this point, we need to know if any splitting will actually occur.
					// If splitting will occur and this node is a parameter in a multi-part tag,
					// then we need to wrap everything in an <mrow>.
					handleWrapping(this, text, pairs);

					// Go through backwards, or else the indices will change!
					for (var i = pairs.length - 1; i >= 0; i--)
					{
						// Split off anything after the closing bracket, but only if there IS something
						if (pairs[i][1] < text.length)
						{
							app.xml.splitNode(this, pairs[i][1]);
							text = this.textContent;		// Update text to prevent redundant splitting
						}

						// Split off anything before the opening bracket, but only if there IS something
						if (pairs[i][0] > 0)
						{
							app.xml.splitNode(this, pairs[i][0]);
							text = this.textContent;		// Update text to prevent redundant splitting
						}
					}
				}
			});
	}

	//=======================================================
	// Convert <mo>[</mo> ... <mo>]</mo> to <mtext>[ ... ]<mtext>
	// Also removes all tags from inside brackets
	// DG: Now also converts text nodes containing brackets to <mtext> tags
	//
	// @FIXME/dg: This doesn't detect matrices!
	//=======================================================
	app.mathML.cleanBrackets = function(xml)
	{
		// Convert all <mo>[</mo> and <mo>]</mo> to <mtext>[</mtext> and <mtext>]</mtext>
		// Find mtext nodes that lack termination ("[" or also "[x][a" -- it could contain multiple pairs)
		//   Find the matching termination (keep in mind it could be unterminated itself, e.g. "][a")
		//   Flatten everything between the nodes
		//   Repeat, starting with itself (in case the closing was itself unterminated)


		// Convert text nodes to <mtext>.  Will this break our Flash container?
		textifyTextNodes(xml);

		// Convert all <mo>[</mo> to <mtext>[</mtext> and <mo>]</mo> to <mtext>]</mtext>
		textifyBrackets(xml);

		// Find bracket pairs and combine them into single nodes
		absorbBrackets(xml);

		// Split <mtext> with multiple pairs of brackets into multiple <mtext> nodes
		splitBracketNodes(xml);
	}

	//=======================================================
	// Ensure that the XML namespace is set
	//
	// @FIXME/dg: After many hours of trying, I am forced to give up and move on.
	// I can't do this in XML, though it is trivial using regular expressions.
	// Since <math> is the root node, it might be necessary to create a new XML document.
	//=======================================================
	app.mathML.setNamespace = function(str)
	{
		return str.replace(/<math>/g, '<math xmlns="' + mathNamespace + '">');
	}

	//=======================================================
	// Make sure overbars have accent="true" in the <mover> tag
	//=======================================================
	app.mathML.fixOverbars = function(xml)
	{
		xml.find('mover').each(function() {
			var kids = this.childNodes;

			// We only care if the second child is ¯
			if (kids.length === 2 && kids[1].textContent === '¯')
				$(this).attr('accent', 'true');
		});
	}

	//=======================================================
	// Convert bare <mfenced> to <mo>( and <mo>) pairs.
	//=======================================================
	app.mathML.fixParens = function(xml)
	{
		var ns = xml.find('math').attr('xmlns');

		// Find all <mo>[ operators.
		xml.find('mfenced').each(function() {

			var type = $(this).attr('open');

			// Check for ( wrapping: no type specified
			if (!type)
			{
				// Change this node type to a <mrow>.
				// Everything in the <mfenced> acts as a single node for <msub>, etc.  We need to replicate that.
				var row = xml[0].createElementNS(ns, 'mrow');

				// Get all elements contained within the () pair
				var kids = $(this).children();

				// Create open and close <mo> elements
				var open = xml[0].createElementNS(ns, 'mo');
				open.textContent = '(';
				var close = xml[0].createElementNS(ns, 'mo');
				close.textContent = ')';

				// Add items to the row
				row.appendChild(open);
				$(row).append(kids);
				row.appendChild(close);

				// Remove the old node
				$(row).insertBefore(this);
				$(this).remove();
			}
		});
	}

	//=======================================================
	// Convert <mo>[</mo> ... <mo>]</mo> to <mtext>[ ... ]<mtext>
	// Also removes all tags from inside brackets
	//
	// This mostly just calls app.mathML.cleanBrackets.  The
	// similarity in naming is very confusing.
	//=======================================================
	app.cleanBrackets = function(string)
	{
		var xml = app.xml.stringToXML(string);
		if (xml === 'fail')
			return string;
		xml = $(xml);

		app.mathML.cleanBrackets(xml);
		return app.xml.XMLToString(xml[0]);
	}

	//=======================================================
	// Searches for <menclose> blocks that contain more than one
	// <mtext> entry.  These are broken.
	// Legacy problems don't have <mtext> at all, so len is 0.
	// They are also being flagged as 0.
	// The WIRIS MathML to Image conversion is breaking when
	// class="broken" is set.
	//=======================================================
	function findBrokenMenclose(xml)
	{
		xml.find('menclose[notation="box"]').each(function() {
			var len = $(this).children('mtext').length;
			if (len !== 1)
			{
				$(this).attr('class', 'broken');
			}
		});
	}

	//=======================================================
	// Combined multiple adjacent <mtext> elements into a single <mtext>
	// We go to a lot of effort to split them, but evidently WIRIS can't handle
	// multiple <mtext> nodes.  Combine them just before passing the
	// data into WIRIS, and let splitBracketNodes() split them again afterward.
	//
	// This is (was) highly dangerous.  It's not always safe to merge
	// siblings!  Siblings at the XML level aren't necessarily siblings
	// at the MathML level.  Multi-part tags use siblings as different parameters
	// that mean very different things, e.g. the top and bottom of a fraction.
	//
	// Check the parent type.  If it's a multi-part tag, don't merge them!
	// That includes the full list of multi-part tags, not just the subset in multiPartTags[].
	//
	// Next issue: If there are two sibling <mtext> nodes that should be merged, the
	// .each() will find both.  However, processing of the first one will destroy
	// the second one.  The next time through, any operations are on an orphan.
	// Besides being potentially dangerous, it may promote a memory leak by keeping
	// a reference to the orphan (but probably not).
	//
	// Options:
	//	1) Start over after each merge.  This approach is used elsewhere in a more complex
	//     situation.  It's somewhat inefficient.
	//  2) Check the parent node.  Any node that has been removed from the DOM will have a
	//     null parentNode.
	//
	// Yet another issue: When merging nodes within an <mrow>, which we may have created earlier
	// when splitting the nodes, we may end up with a single node in the <mrow>.  In this case,
	// the best thing to do is to remove the <mrow>.  Otherwise we can end up with a long stack
	// of worthless <mrow> nodes.
	// Actually this didn't turn into a problem.  After the initial <mrow> is added, no more
	// get stacked on.  <mrow> is only added if the parent is a multi-part tag, which is no
	// longer the case when <mrow> is the parent.
	// At most there is a single extraneous <mrow>.  That's really only the case while ckeditor is
	// open.  On closing, either the <mrow> is required again, or it appears to vanish if the
	// need goes away.  Don't both adding <mrow> stripping to this routine.
	//=======================================================
	app.mathML.mergeMtext = function(xml)
	{
		xml.find('mtext').each(function() {

			// Make sure we haven't already merged this node into something else.
			if (this.parentNode === null)
				return true;		// continue;

			if (allMultiPartTags.indexOf(this.parentNode.nodeName) !== -1)
				return true;		// continue;

			var siblings = $(this).nextUntil(':not(mtext)');
			var text = $(this).text() + siblings.text();
			siblings.remove();
			$(this).text(text);
		});
	}

	//=======================================================
	// WIRIS 3 uses this for newlines: <mspace linebreak="newline"/>
	// MathJax supports that, but Firefox doesn’t.
	//
	// WIRIS 2 used tables for newlines. For maximum compatibility,
	// all newlines are converted to tables.
	//=======================================================
	app.mathML.convertNewlines = function(xml)
	{
		// Find the MathML blocks. There might not be any, or more than one.
		xml.find('math').each(function() {

			var math = this;

			// Ensure that there's not already a top-level table
			if (math.firstChild.nodeName === 'mtable')
				return true;	// continue

			// Find all newlines
			var breaks = $(math).find('mspace[linebreak="newline"]');
			if (breaks.length < 1)
				return true;	// continue

			// Ensure that all newlines are at the top level
			var atTopLevel = breaks.filter(function() {return this.parentNode.nodeName === 'math'});
			if (atTopLevel.length !== breaks.length)
				return true;	// continue -- too difficult to handle

			// Wrap the entire MathML block in an <mtable>
			var table = app.xml.xmlWrapChildren(math, 'mtable');
			$(table).attr({
				rowspacing: "0",
				columnalign: "left"
			});

			// Wrap everything around the newlines in <mtr><mtd> tags
			var final;	// Set a variable outside of the 'each' scope
			breaks.each(function() {
				var line = $(this).prevAll(':not(mtr)').get().reverse();	// prevAll gives us reverse order
				final = $(this).nextAll();		// We only care about this the last time through, but save it every time

				var cell = app.xml.changeXmlNodeType(this, 'mtd');
				var row = app.xml.xmlWrapNode(cell, 'mtr');

				for (var i = 0, len = line.length; i < len; i++)
					cell.appendChild(line[i]);
			});

			// The above process doesn't handle the final line
			var cell = app.xml.xmlCreateNode('mtd', '', math);
			table.appendChild(cell);
			var row = app.xml.xmlWrapNode(cell, 'mtr');

			for (var i = 0, len = final.length; i < len; i++)
				cell.appendChild(final[i]);

		});
	}

	//=======================================================
	// Wrap closing parentheses in <mrow> tags
	//
	// This is a bit questionable. It covers up a MathJax "bug".
	// It really shouldn't be necessary, and as such we might
	// not want to pollute the database with it. However, it's
	// not particularly harmful and MathJax is fairly
	// standards-compliant.
	//=======================================================
	app.mathML.wrapParensInRows = function(xml)
	{
		xml.find('mo').each(function() {
			if (this.textContent === ')' && this.parentNode.nodeName !== 'mrow')
				app.xml.xmlWrapNode(this, 'mrow');
		});
	}

	//=======================================================
	// Undo the parentheses wrap
	//
	// This feels risky, but we're careful to check if this
	// is an only child.
	//=======================================================
	app.mathML.unwrapParensInRows = function(xml)
	{
		xml.find('mo').each(function() {
			if (this.textContent === ')' && this.parentNode.nodeName === 'mrow' && this.parentNode.childNodes.length === 1)
				app.xml.xmlSnipNode(this.parentNode);
		});
	}


//===========================================================================================
// Variable highlighting
//===========================================================================================

	//=======================================================
	// Add HTML highlighting to variables in an HTML string
	//=======================================================
	function highlightHtml(el, start, end)
	{
		// Split out the variable blocks for each pair, in reverse order
		// Reverse order is required because splitting is destructive and will modify the indices of everything following.
		app.xml.splitTextNode(el, start, end, 'span', 'hasVariable');
	}

	//=======================================================
	// Add HTML highlighting to variables in a MathML string
	//=======================================================
	function highlightMML(el)
	{
		$(el).attr('class', 'hasVariable');	// addClass doesn't work on xml, but this does.  Go figure.
	}

	//=======================================================
	// Add HTML highlighting to variables in an HTML string
	//
	// The source in this case is generally HTML with embedded MathML
	// The variables receiving highlighting may or may not be inside MathML
	//=======================================================
	app.mathML.highlightVars = function(xml)
	{
		app.mathML.findVarsMML(xml, highlightMML);
		app.mathML.findVarsHtml(xml, highlightHtml);
	}

	//=======================================================
	// Add HTML highlighting to variables in an HTML string
	// Also adds visual verification of broken menclose/maction
	//
	//=======================================================
	app.highlightVars = function(string)
	{
		var xml = app.xml.stringToXML(string);
		if (xml === 'fail')
			return string;
		xml = $(xml);

		app.mathML.highlightVars(xml);
		findBrokenMenclose(xml);

		return app.xml.XMLToString(xml[0]);
	}

	//=======================================================
	// Removes highlighting from MathML nodes
	//=======================================================
	function removeHighlightMML(xml)
	{
		xml.find("mtext").each(function() {
			// Remove the 'hasVariable' class
			if ($(this).attr('class') === 'hasVariable')
				this.removeAttribute('class');
		});
	}

	//=======================================================
	// Removes highlighting from HTML nodes
	//=======================================================
	function removeHighlightHtml(xml)
	{
		xml.find("span").each(function() {
			// Remove the 'hasVariable' class
			if ($(this).attr('class') === 'hasVariable')
				app.xml.convertToTextNode(this);
		});
	}

	//=======================================================
	// Remove HTML highlighting from variables
	//
	// This is undoing the process that app.highlightVars does.
	// Make sure it happens exactly.
	//=======================================================
	app.mathML.removeHighlights = function(xml)
	{
		removeHighlightMML(xml);
		removeHighlightHtml(xml);
	}

	//=======================================================
	// Remove HTML highlighting from variables in an HTML string
	//
	// This is undoing the process that app.highlightVars does.
	// Make sure it happens exactly.
	//=======================================================
	app.removeHighlights = function(string)
	{
		// Convert to XML
		var xml = app.xml.stringToXML(string);
		if (xml === 'fail')
			return string;
		xml = $(xml);

		// Do the actual work
		app.mathML.removeHighlights(xml);

		// Convert back to a string
		return app.xml.XMLToString(xml[0]);
	}


//===========================================================================================
// <maction> processing
//===========================================================================================

	//=======================================================
	//  Get the answer blocks that are used for inputs
	//=======================================================
	app.mathML.getActionTags = function(str)
    {
        var blocks = [];

		var xml = app.xml.stringToXML(str);
		if (xml !== 'fail')
		{
			$(xml).find('maction').each(function() {
				blocks.push($(this).text());
			});
		}

        return blocks;
    }

	//=======================================================
	//  Convert <maction> tags to <menclose> tags for better display
	//=======================================================
	app.mathML.hideMaction = function(xml)
	{
		// Change all <maction> to <menclose>
		xml.find('maction').each(function() {
			app.xml.changeXmlNodeType(this, 'menclose', {notation: 'box'});
		});
	}

	//=======================================================
	//  Convert <menclose> tags to <maction> tags for storage
	//=======================================================
	app.mathML.showMaction = function(xml)
	{
		// Change all <maction> to <menclose>
		xml.find('menclose[notation="box"]').each(function() {
			app.xml.changeXmlNodeType(this, 'maction', {selection: '1', actiontype: 'input'});
		});
	}

	//=======================================================
	// Convert multi-input answers to the MML viewable/editable format
	//
	// This is a filter before rendering
	//=======================================================
	app.multiOut = function(string)
	{
		var xml = app.xml.stringToXML(string);
		if (xml === 'fail')
			return string;
		xml = $(xml);

		app.mathML.hideMaction(xml);
		return app.xml.XMLToString(xml[0]);
	}

	//=======================================================
	// Convert multi-input answers back to <maction> format
	//
	// Convert from display / visual HTML to internal data
	//=======================================================
	app.multiIn = function(string)
	{
		var xml = app.xml.stringToXML(string);
		if (xml === 'fail')
			return string;
		xml = $(xml);

		app.mathML.showMaction(xml);
		return app.xml.XMLToString(xml[0]);
	}

//===========================================================================================
// Variable handling
//
// Everything in this section that isn't commented out is duplicated in the node module!
// This whole module should be moved into a node module.
//===========================================================================================

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
	app.mathML.findVarsHtml = function(xml, func, params)
	{
		// This makes the assumption that both brackets are inside a single bottom-level tag.  That means there can't
		// be any formatting between [ and ].
		// That might not always be the case, but properly cleaning up HTML where it's NOT the case would be a lot more difficult.
		xml.find(":contains('[')").andSelf().contents().	// Crazy method of including text nodes
			filter(function() { return this.nodeType === 3 }).	// :contains searches all children, so every ancestor will get through.  Filter out all but text nodes.
			each(function() {
				if ($(this).parents('math').length === 0)	// Raw HTML -- no <math> ancestors
				{
					// Construct a list of matched [] in the current text element.  There might not be any!
					var pairs = getPairs('[', ']', this.textContent);

					// Reverse order is required because splitting or string replacement is destructive and will modify the indices of everything following.
					// The alternative (if there's any downside to going backwards) would be to not pre-calculate all of the pairs.
					for (var i = pairs.length - 1; i >= 0; i--)
						func(this, pairs[i][0], pairs[i][1], params);
				}
			});
	}

	//=======================================================
	// Locate variable blocks within a MathML string, and perform
	// a callback operation on each
	//=======================================================
	app.mathML.findVarsMML = function(xml, func, params)
	{
		// Assume that cleanBrackets has already been called.
		// Brackets should be either in raw HTML, or inside <mtext>
		xml.find(":contains('[')").
			filter(function() { return $(this).children().length === 0; }).	// :contains searches all children, so every ancestor will get through.  Filter out all but the final child element.
			each(function() {
				// Find the closing bracket: cleanBrackets should have cleaned up MathML.  Raw HTML may be a problem.
				var text = safeTrim($(this).text());
				var left = text.indexOf('[');
				var right = text.indexOf(']', left+1);	// Start from left.

				// There are 3 IF clauses following.  They could be combined into one!
				// Until we need otherwise, only deal with elements that contain both [ and ] -- cleanBrackets should ensure this in MathML
				if (left !== -1 && right !== -1)
				{
					// Check to see if we're inside an mtext
					// Also allow <maction> for variable replacement.  This seems risky!
					if (this.tagName === 'mtext' || this.tagName === 'maction')
					{
						// Add a class to the outer <mtext>.  This only works if there's a single variable block within the
						// <mtext> and the variable block is the entire <mtext>
						if (left !== 0 || right !== (text.length-1))
							alert("Brackets found in <mtext>, but they aren't taking up the entire <mtext> block");

						func(this, params);
					}
				}
			});
	}

/*
	//=======================================================
	// Replace a variable block with the calculated value
	//=======================================================
	function replaceMML(el, callback)
	{
		var calced = callback($.trim(el.textContent));

		$(el).text(calced);

		if (el.nodeName === "mtext")
			app.xml.changeXmlNodeType(el, "mn");
	}

	//=======================================================
	//
	//=======================================================
	function replaceHTML(el, start, end, callback)
	{
		var txt = el.textContent;
		var calced = callback(txt.substring(start, end));

		el.textContent = txt.slice(0, start) + calced + txt.slice(end);
	}

	//=======================================================
	// Replace variable blocks with calculated values that
	// are calculated via a callback
	//=======================================================
	app.findAndReplaceVars = function(string, callback)
	{
		var xml = app.xml.stringToXML(string);
		if (xml === 'fail')
			return string;
		xml = $(xml);

		// Perform the actual replacement
		app.mathML.findVarsMML(xml, replaceMML, callback);
		app.mathML.findVarsHtml(xml, replaceHTML, callback);

		return app.xml.XMLToString(xml[0]);
	}

	//=======================================================
	// Locates all variable blocks in a string
	// Note that is searches for all MathML blocks, then all HTML blocks
	// so they won't be in order!
	//=======================================================
	app.findAllVarBlocks = function(string)
	{
		var xml = app.xml.stringToXML(string);
		if (xml === 'fail')
			return string;
		xml = $(xml);

		// Perform the actual replacement
		var blocks = [];

		app.mathML.findVarsMML(xml, function(el) {
			blocks.push(el.textContent);
		});

		app.mathML.findVarsHtml(xml, function(el, start, end) {
			blocks.push(el.textContent.substring(start, end));
		});

		return blocks;
	}
*/
//===========================================================================================
// MathType Cleanup
//===========================================================================================

	//=======================================================
	// Convert tables with borders to <menclose> (was <maction>)
	//=======================================================
	app.createMactions = function(xml)
	{
		// Search for <mtable frame='solid'> that has a <mrow> child.
		// <mrow> isn't really part of the detection, but we make sure it's there since we expect it.
		xml.find('mtable').each(function() {
			if ($(this).attr('frame') === 'solid')
			{
				if (this.firstChild.nodeName === 'mrow')
					app.xml.xmlSnipNode(this.firstChild);	// Do this first.  'this' will be deleted when changing the type

				app.xml.changeXmlNodeType(this, "menclose", {notation: 'box'});
			}
		});
	}

	//=======================================================
	//=======================================================
	function mathTypeCharConvert(string)
	{
		var convert = [
			["&#8978;", "&#xFE35;"],	// arc to vertical parens
			["&#x2322;", "&#xFE35;"],	// frown to vertical parens
			["&#8211;", "-"],			// en dash to standard minus sign
			["&#8722;", "-"],			// wide minus sign to standard minus sign
			["&#x2212;", "-"],			// wide minus sign to standard minus sign
			["&#8741;", "&#8214;"],		// parallel 2225 to double vert 2016
			["&#x2225;", "&#8214;"],	// parallel 2225 to double vert 2016
			["&#730;", "&#xB0;"],		// ring above to degree
			["&#x2218;", "&#xB0;"],		// ring to degree
			["&#x22C5;", "&#xB7;"],		// dot operator to mid dot
			["&#8729;", "&#xB7;"]		// bullet operator to mid dot
		];

		$.each(convert, function(idx, val) {
			var regex = new RegExp(val[0], 'g');
			string = string.replace(regex, val[1]);
		});

		return string;
	}

	//=======================================================
	// Resize ?= combo
	//=======================================================
	app.resizeQuestionEquals = function(xml)
	{
		xml.find('mover').each(function() {
			var child = this.firstChild;
			if (child.textContent === '=' && child.nextSibling.textContent === '?')
			{
				// Set the ? to use a small size
				child.nextSibling.setAttribute('mathsize', 'small');
			}
		});
	}

	//=======================================================
	// Delete the invisible "function application" operator
	//=======================================================
	app.deleteFunctions = function(xml)
	{
		xml.find('mo').each(function() {
			if (this.textContent.length === 1 && this.textContent.charCodeAt(0) == '8289')
				this.parentNode.removeChild(this);
		});
	}

	//=======================================================
	// Remove display=block
	//=======================================================
	function removeDisplayBlock(string)
	{
		var regex = /\s*display=['"]block['"]/g;
		return string.replace(regex, '');
	}

	//=======================================================
	// Process MathML pasted from MathType in a way similar to our
	// old XSL code.
	//
	// This isn't currently used!
	//=======================================================
	app.cleanMathType = function(string)
	{
		// Perform character conversion in string mode.  It's much easier that way!
		string = mathTypeCharConvert(string);

		// Remove display=block
		string = removeDisplayBlock(string);

		// Now switch into XML mode
		var xml = app.xml.stringToXML(string);
		if (xml === 'fail')
			return string;
		xml = $(xml);

		// Convert tables with borders to <maction>
		app.createMactions(xml);

		// The book XSLT converts <mo>-</mo><mn>3</mn> to <mn>-3</mn>
		// WIRIS doesn't do that, and I don't think it's standard MathML.
		// We won't do that unless we find a good reason.

		// The book XSLT ate function application nodes, e.g. <mo> &#x2061;<!--FUNCTION APPLICATION--> </mo>
		// These are unlikely to appear, but kill them anyway.
		app.deleteFunctions(xml);

		// Resize ?= combo
		app.resizeQuestionEquals(xml);

		// Convert super/subscript

		// Convert back to a string
		return app.xml.XMLToString(xml[0]);
	}

//===========================================================================================
// Convert answer types
//===========================================================================================

	//=======================================================
	// Clean up WIRIS MML
	//
	// This is the pipeline for processing MathML produced by WIRIS
	//=======================================================
	app.wrapVars = function(string)
	{
		string = app.mathML.setNamespace(string);
		var xml = app.xml.stringToXML(string);
		if (xml === 'fail')
			return string;
		xml = $(xml);

		app.mathML.wrapVars(xml);

		var out = app.xml.XMLToString(xml[0]) || "";
		return app.mathML.setNamespace(out);	// MathML namespacing is being lost.  Force it!
	}

	//=======================================================
	// Wrap all variable blocks in <maction> tags
	//
	// The source in this case is generally HTML with embedded MathML
	// The variables receiving highlighting may or may not be inside MathML
	//=======================================================
	app.mathML.wrapVars = function(xml)
	{
		app.mathML.findVarsMML(xml, wrapVarsMML);
		app.mathML.findVarsHtml(xml, wrapVarsHtml);
	}

	//=======================================================
	// A variable block was located in HTML.  It needs to be
	// converted to MathML
	//=======================================================
	function wrapVarsHtml(el, start, end, callback)
	{
		var ins = app.xml.splitTextNode(el, start, end, 'math');			// function(node, start, end, tag, tagClass)

		// Set MathML namespace
		$(ins).attr('xmlns', mathNamespace);
		var maction = app.xml.xmlWrapChildren(ins, 'maction');
		$(maction).attr({selection: '1', actiontype: 'input'});

		app.xml.xmlWrapChildren(maction, 'mtext');
	}

	//=======================================================
	// A variable block was located in MathML.  It needs to be
	// wrapped with an <maction> tag
	//=======================================================
	function wrapVarsMML(el)
	{
		// Wrap this element in an <maction>
		var maction = app.xml.xmlWrapNode(el, 'maction');
		$(maction).attr({selection: '1', actiontype: 'input'});
	}

	//=======================================================
	// A safe trim() function that only removes spaces, not
	// special formatting items such as thin spaces or nbsp.
	//=======================================================
	function safeTrim(text)
	{
		trimLeft = /^ +/;
		trimRight = / +$/;

		return text.toString().replace(trimLeft, "").replace(trimRight, "");
	}

//===========================================================================================
// Visual cleanup
//===========================================================================================

	//=======================================================
	// Increase the size of fractions. We're using inline mode,
	// which tries hard to shrink everything vertically. We'd
	// rather avoid that.
	//=======================================================
	function scaleFractions(xml)
	{
		xml.find('mfrac').each(function() {
			var style = app.xml.xmlWrapNode(this, 'mstyle');
			style.setAttribute('mathsize', '140%');
//			style.setAttribute('scriptminsize', '9pt');
		});
	}

	//=======================================================
	//=======================================================
	app.scaleFractions = function(string)
	{
		// Switch into XML mode
		var xml = app.xml.stringToXML(string);
		if (xml === 'fail')
			return string;
		xml = $(xml);

		scaleFractions(xml);

		// Convert back to a string
		return app.xml.XMLToString(xml[0]);
	}

	//=======================================================
	// Removed fraction scaling
	//=======================================================
	function unscaleFractions(xml)
	{
		xml.find('mstyle[mathsize]').each(function() {
			app.xml.xmlSnipNode(this);
		});
	}

	//=======================================================
	// Should be used in restoreMathML, but needs to be called
	// separately in some cases.
	//=======================================================
	app.unscaleFractions = function(string)
	{
		// Switch into XML mode
		var xml = app.xml.stringToXML(string);
		if (xml === 'fail')
			return string;
		xml = $(xml);

		unscaleFractions(xml);

		// Convert back to a string
		return app.xml.XMLToString(xml[0]);
	}

	//=======================================================
	// Perform various prettification on MathML for display.
	// This includes variable highlighting; we don't always
	// want this full pipeline.
	//=======================================================
	app.prettyDisplay = function(string)
	{
		// Switch into XML mode
		var xml = app.xml.stringToXML(string);
		if (xml === 'fail')
			return string;
		xml = $(xml);

		// Scale fractions
		scaleFractions(xml);

		// Wrap parentheses
		app.mathML.wrapParensInRows(xml);

		// Highlight variable blocks
		app.mathML.highlightVars(xml);

		// Convert back to a string
		return app.xml.XMLToString(xml[0]);
	}

	//=======================================================
	// Removes all temporary "prettification"
	// This needs to undo everything done in app.prettyDisplay
	//=======================================================
	app.restoreMathML = function(string)
	{
		// Convert to XML
		var xml = app.xml.stringToXML(string);
		if (xml === 'fail')
			return string;
		xml = $(xml);

		// Remove fraction scaling
		unscaleFractions(xml);

		// Unwrap parentheses
		app.mathML.unwrapParensInRows(xml);

		// Remove highlighted variable blocks
		app.mathML.removeHighlights(xml);

		// Convert back to a string
		return app.xml.XMLToString(xml[0]);
	}

})();
