require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],"YQVpIN":[function(require,module,exports){
//===========================================================================================
// XML Utility Module
//
// Uses internal XML calls to search and modify XML trees
//
// This should by a generic library, but it has special requirements that would have to be
// installed globally.
//===========================================================================================
if ((typeof window === 'undefined') || (typeof window._ === 'undefined'))
	var _ = require('underscore');
else
	_ = window._;

if (typeof window === 'undefined')
	var xmldom = require('xmldom');
else
	xmldom = window;		// Get DOMParser and XMLSerializer from window if it exists

// List of entities that can't be used in XML, and acceptable alternatives
var entityList = [
	['&nbsp;', '&#160;']
];

// List of entities that can't be used in XML, and acceptable alternatives
// Distinguished from the original entityList, in that these should not
// be processed by restoreEntities.
var entities = {
	quot: "&#34;",
	amp: "&#38;",
	apos: "&#39;",
	lt: "&#60;",
	gt: "&#62;",
//	nbsp: "&#160;",		// Leave this one alone
	iexcl: "&#161;",
	cent: "&#162;",
	pound: "&#163;",
	curren: "&#164;",
	yen: "&#165;",
	brvbar: "&#166;",
	sect: "&#167;",
	uml: "&#168;",
	copy: "&#169;",
	ordf: "&#170;",
	laquo: "&#171;",
	not: "&#172;",
	shy: "&#173;",
	reg: "&#174;",
	macr: "&#175;",
	deg: "&#176;",
	plusmn: "&#177;",
	sup2: "&#178;",
	sup3: "&#179;",
	acute: "&#180;",
	micro: "&#181;",
	para: "&#182;",
	middot: "&#183;",
	cedil: "&#184;",
	sup1: "&#185;",
	ordm: "&#186;",
	raquo: "&#187;",
	frac14: "&#188;",
	frac12: "&#189;",
	frac34: "&#190;",
	iquest: "&#191;",
	Agrave: "&#192;",
	Aacute: "&#193;",
	Acirc: "&#194;",
	Atilde: "&#195;",
	Auml: "&#196;",
	Aring: "&#197;",
	AElig: "&#198;",
	Ccedil: "&#199;",
	Egrave: "&#200;",
	Eacute: "&#201;",
	Ecirc: "&#202;",
	Euml: "&#203;",
	Igrave: "&#204;",
	Iacute: "&#205;",
	Icirc: "&#206;",
	Iuml: "&#207;",
	ETH: "&#208;",
	Ntilde: "&#209;",
	Ograve: "&#210;",
	Oacute: "&#211;",
	Ocirc: "&#212;",
	Otilde: "&#213;",
	Ouml: "&#214;",
	times: "&#215;",
	Oslash: "&#216;",
	Ugrave: "&#217;",
	Uacute: "&#218;",
	Ucirc: "&#219;",
	Uuml: "&#220;",
	Yacute: "&#221;",
	THORN: "&#222;",
	szlig: "&#223;",
	agrave: "&#224;",
	aacute: "&#225;",
	acirc: "&#226;",
	atilde: "&#227;",
	auml: "&#228;",
	aring: "&#229;",
	aelig: "&#230;",
	ccedil: "&#231;",
	egrave: "&#232;",
	eacute: "&#233;",
	ecirc: "&#234;",
	euml: "&#235;",
	igrave: "&#236;",
	iacute: "&#237;",
	icirc: "&#238;",
	iuml: "&#239;",
	eth: "&#240;",
	ntilde: "&#241;",
	ograve: "&#242;",
	oacute: "&#243;",
	ocirc: "&#244;",
	otilde: "&#245;",
	ouml: "&#246;",
	divide: "&#247;",
	oslash: "&#248;",
	ugrave: "&#249;",
	uacute: "&#250;",
	ucirc: "&#251;",
	uuml: "&#252;",
	yacute: "&#253;",
	thorn: "&#254;",
	yuml: "&#255;",
	OElig: "&#338;",
	oelig: "&#339;",
	Scaron: "&#352;",
	scaron: "&#353;",
	Yuml: "&#376;",
	fnof: "&#402;",
	circ: "&#710;",
	tilde: "&#732;",
	Alpha: "&#913;",
	Beta: "&#914;",
	Gamma: "&#915;",
	Delta: "&#916;",
	Epsilon: "&#917;",
	Zeta: "&#918;",
	Eta: "&#919;",
	Theta: "&#920;",
	Iota: "&#921;",
	Kappa: "&#922;",
	Lambda: "&#923;",
	Mu: "&#924;",
	Nu: "&#925;",
	Xi: "&#926;",
	Omicron: "&#927;",
	Pi: "&#928;",
	Rho: "&#929;",
	Sigma: "&#931;",
	Tau: "&#932;",
	Upsilon: "&#933;",
	Phi: "&#934;",
	Chi: "&#935;",
	Psi: "&#936;",
	Omega: "&#937;",
	alpha: "&#945;",
	beta: "&#946;",
	gamma: "&#947;",
	delta: "&#948;",
	epsilon: "&#949;",
	zeta: "&#950;",
	eta: "&#951;",
	theta: "&#952;",
	iota: "&#953;",
	kappa: "&#954;",
	lambda: "&#955;",
	mu: "&#956;",
	nu: "&#957;",
	xi: "&#958;",
	omicron: "&#959;",
	pi: "&#960;",
	rho: "&#961;",
	sigmaf: "&#962;",
	sigma: "&#963;",
	tau: "&#964;",
	upsilon: "&#965;",
	phi: "&#966;",
	chi: "&#967;",
	psi: "&#968;",
	omega: "&#969;",
	thetasym: "&#977;",
	upsih: "&#978;",
	piv: "&#982;",
	ensp: "&#8194;",
	emsp: "&#8195;",
	thinsp: "&#8201;",
	zwnj: "&#8204;",
	zwj: "&#8205;",
	lrm: "&#8206;",
	rlm: "&#8207;",
	ndash: "&#8211;",
	mdash: "&#8212;",
	lsquo: "&#8216;",
	rsquo: "&#8217;",
	sbquo: "&#8218;",
	ldquo: "&#8220;",
	rdquo: "&#8221;",
	bdquo: "&#8222;",
	dagger: "&#8224;",
	Dagger: "&#8225;",
	bull: "&#8226;",
	hellip: "&#8230;",
	permil: "&#8240;",
	prime: "&#8242;",
	Prime: "&#8243;",
	lsaquo: "&#8249;",
	rsaquo: "&#8250;",
	oline: "&#8254;",
	frasl: "&#8260;",
	euro: "&#8364;",
	image: "&#8465;",
	weierp: "&#8472;",
	real: "&#8476;",
	trade: "&#8482;",
	alefsym: "&#8501;",
	larr: "&#8592;",
	uarr: "&#8593;",
	rarr: "&#8594;",
	darr: "&#8595;",
	harr: "&#8596;",
	crarr: "&#8629;",
	lArr: "&#8656;",
	uArr: "&#8657;",
	rArr: "&#8658;",
	dArr: "&#8659;",
	hArr: "&#8660;",
	forall: "&#8704;",
	part: "&#8706;",
	exist: "&#8707;",
	empty: "&#8709;",
	nabla: "&#8711;",
	isin: "&#8712;",
	notin: "&#8713;",
	ni: "&#8715;",
	prod: "&#8719;",
	sum: "&#8721;",
	minus: "&#8722;",
	lowast: "&#8727;",
	radic: "&#8730;",
	prop: "&#8733;",
	infin: "&#8734;",
	ang: "&#8736;",
	and: "&#8743;",
	or: "&#8744;",
	cap: "&#8745;",
	cup: "&#8746;",
	int: "&#8747;",
	there4: "&#8756;",
	sim: "&#8764;",
	cong: "&#8773;",
	asymp: "&#8776;",
	ne: "&#8800;",
	equiv: "&#8801;",
	le: "&#8804;",
	ge: "&#8805;",
	sub: "&#8834;",
	sup: "&#8835;",
	nsub: "&#8836;",
	sube: "&#8838;",
	supe: "&#8839;",
	oplus: "&#8853;",
	otimes: "&#8855;",
	perp: "&#8869;",
	sdot: "&#8901;",
	vellip: "&#8942;",
	lceil: "&#8968;",
	rceil: "&#8969;",
	lfloor: "&#8970;",
	rfloor: "&#8971;",
	lang: "&#9001;",
	rang: "&#9002;",
	loz: "&#9674;",
	spades: "&#9824;",
	clubs: "&#9827;",
	hearts: "&#9829;",
	diams: "&#9830;"
};

//=======================================================
// Wrap raw strings so they can be treated as XML
//=======================================================
function addWrapper(string)
{
	// Always wrap, just to be safe.  I wasn't wrapping if the string started with a <math>
	// tag, but some strings have <math>...</math><math>...</math> which can't be parsed.
	return '<wrapper>' + string + '</wrapper>';
}

//=======================================================
// Replace entities that XML doesn't support
//=======================================================
var entityRegex = /&([^;]+);/g;

function replaceEntities(str)
{
	_.each(entityList, function(val, idx) {
		var regExp = new RegExp(val[0], 'g');
		str = str.replace(regExp, val[1]);
	});

	// Also, process entities that are to be replaced but not restored.
	str = str.replace(entityRegex, replaceSingle);

	return str;
}
exports.replaceEntities = replaceEntities;	// Don't use this directly - exposed just for testing

//=======================================================
// Convert from a named entity to a decimal value
//=======================================================
function replaceSingle(all, name)
{
	if (name && entities[name])
		return entities[name];
	else
		return "&" + name + ";";	// It was already a number
}

//=======================================================
// Convert single HTML tags to XHTML.  Make sure there's a />
//=======================================================
function HTMLtoXHTML(str)
{
	// Pattern intended to find non-closed tags that don't have a / before the closing angle bracket.
	var tagPattern = /<((br|hr|img)([^>]*[^\/]){0,1})>/g;
	str = str.replace(tagPattern, "<$1/>");
	return str;
}

//=======================================================
// Restore entities
//=======================================================
function restoreEntities(str)
{
	_.each(entityList, function(val, idx) {
		var regExp = new RegExp(val[1], 'g');
		str = str.replace(regExp, val[0]);
	});

	return str;
}

//=======================================================
// Convert from a string to XML
//=======================================================
function stringToXML(str)
{
	if (typeof str === "undefined")
		str = '';

	// Wrap raw strings
	str = addWrapper(str+'');

	// Replace entities that aren't supported in XML
	str = replaceEntities(str);

	// XML requires unclosed tags to have a slash before the closing angle bracket.
	str = HTMLtoXHTML(str);

	try {
		var doc = new xmldom.DOMParser().parseFromString(str, "text/xml");
	}
	catch(e) {
		return 'fail';
	}

	return doc;
}
exports.stringToXML = stringToXML;

//=======================================================
// Convert from XML to a string
//=======================================================
function XMLToString(oXML)
{
/* BROWSER VERSION
	if (window.ActiveXObject)
		var out = oXML.xml;
	else
		var out = (new XMLSerializer()).serializeToString(oXML);
*/
	// NODE version
	var out = (new xmldom.XMLSerializer()).serializeToString(oXML);

	// Remove any extra wrappers
	out = out.replace(/<\/?wrapper(^>)*\/?>/g, "");
	out = restoreEntities(out);
	out = out.replace(/> </g, '><');		// Remove whitespace between tags
	return out;
}
exports.XMLToString = XMLToString;

//=======================================================
//=======================================================
function rootNode(node)
{
	while (node.parentNode)
		node = node.parentNode;

	return node;
}

//=======================================================
// Determines the correct namespace for a node
//=======================================================
function namespace(node)
{
	// Climb up the tree until a namespace is found
	do {
		// If this node has a namespace, use it
		if (node.namespaceURI)
			return node.namespaceURI;

		node = node.parentNode;
	} while (node)

	return null;
}

//=======================================================
// Splits a node into multiple nodes of the same type, at the supplied index
//=======================================================
function splitNode(node, pos)
{
	var root = rootNode(node);
	var ns = namespace(node);

	var newNode = root.createElementNS(ns, node.tagName);// Create a new node of the desired type

	newNode.textContent = node.textContent.substring(pos);
	node.textContent = node.textContent.substring(0, pos);

	node.parentNode.insertBefore(newNode, node.nextSibling);	// Insert the new node after the existing node

	return node;
}
exports.splitNode = splitNode;

//=======================================================
// Moves a substring from a text node into a child node
//=======================================================
function splitTextNode(node, start, end, tag, tagClass)
{
	var root = rootNode(node);
	var ns = namespace(node);

	// Not really a hack.  If the node passed in isn't a text node, it probably contains a single text node child.
	// This could use better error handling however.
	if (node.nodeType !== 3)
		node = node.firstChild;

	var last = node.splitText(end);		// Split off final piece
	var mid = node.splitText(start);	// Split into starting and middle pieces

	var newNode = root.createElementNS(ns, tag);// Create a new node of the desired type
	newNode.textContent = mid.textContent;		// Move the content from the middle to the new node
	if (tagClass)
		newNode.setAttribute('class', tagClass);	// Set the class on the new node
	mid.parentNode.replaceChild(newNode, mid);	// Replace the middle text node with our new node

	return newNode;
}
exports.splitTextNode = splitTextNode;

//=======================================================
// Change a node from one tag to another
// That's not actually possible in XML, so create a new one,
// transfer all of the old one's children, and then delete the old one.
//=======================================================
function changeXmlNodeType(node, tag, attributes)
{
	// Find the root (actually the document, not the root node.  Who's counting?)
	// We create based on this XML document to ensure we have the right namespace
	var root = rootNode(node);
	var ns = namespace(node);

	// Create a new node of the desired type
	var newNode = root.createElementNS(ns, tag);

	// Set the desired attributes on the new node
	attributes && _.each(attributes, function(val, key) {
		newNode.setAttribute(key, val);
	});

	// Transfer all children from the old node to the new
	while(node.childNodes.length)
		newNode.appendChild(node.childNodes[0]);

	// Replace the old node with the new
	node.parentNode.replaceChild(newNode, node);

	// Return the new node in case the caller needs to perform further operations on it
	return newNode;
}
exports.changeXmlNodeType = changeXmlNodeType;

//=======================================================
// Change a node from one tag to a text node
//=======================================================
function convertToTextNode(node)
{
	// Find the root (actually the document, not the root node.  Who's counting?)
	// We create based on this XML document to ensure we have the right namespace
	var root = rootNode(node);

	// Create a new node of the desired type
	var newNode = root.createTextNode(node.textContent);

	// Replace the old node with the new
	node.parentNode.replaceChild(newNode, node);

	// Normalize the parent
	newNode.parentNode.normalize();
}
exports.convertToTextNode = convertToTextNode;

//=======================================================
// Change a text node to another type
//=======================================================
function convertFromTextNode(node, tag)
{
	// Find the root (actually the document, not the root node.  Who's counting?)
	// We create based on this XML document to ensure we have the right namespace
	var root = rootNode(node);
	var ns = namespace(node);

	// Create a new node of the desired type
	var newNode = root.createElementNS(ns, tag);

	// Move the text
	newNode.textContent = node.textContent;

	// Replace the old node with the new
	node.parentNode.replaceChild(newNode, node);

	// Normalize the parent
	newNode.parentNode.normalize();
}
exports.convertFromTextNode = convertFromTextNode;

//=======================================================
// Inserts a new node between this node and its children
// Better description?: Wrap all of this node's children in a new node
//=======================================================
function xmlWrapChildren(node, tag)
{
	var root = rootNode(node);
	var ns = namespace(node);

	var newNode = root.createElementNS(ns, tag);		// Create a new node of the desired type

	// Transfer all children from the old node to the new
	while(node.childNodes.length)
		newNode.appendChild(node.childNodes[0]);

	// Insert the new node
	node.appendChild(newNode);

	// Return the newly created child
	return newNode;
}
exports.xmlWrapChildren = xmlWrapChildren;

//=======================================================
// Wraps a single node inside a new node
//=======================================================
function xmlWrapNode(node, tag)
{
	var root = rootNode(node);
	var ns = namespace(node);

	var newNode = root.createElementNS(ns, tag);		// Create a new node of the desired type

	// Insert the new node
	node.parentNode.insertBefore(newNode, node);

	// Transfer the single node to the new node
	newNode.appendChild(node);

	return newNode;
}
exports.xmlWrapNode = xmlWrapNode;

//=======================================================
// Deletes a child node, moving all children up
//
// The node passed in is the node to delete.
//=======================================================
function xmlSnipNode(node)
{
	// Transfer all children from the old node to the new
	while(node.childNodes.length)
		node.parentNode.insertBefore(node.childNodes[0], node);

	// Delete the old node
	node.parentNode.removeChild(node);
}
exports.xmlSnipNode = xmlSnipNode;

//=======================================================
// Create a node, and populate it with text data
//
// nsNode is passed in purely as a means of discovering a
// namespace for the new node
//=======================================================
function xmlCreateNode(tag, data, nsNode)
{
	var root = rootNode(nsNode);
	var ns = namespace(nsNode);

	var newNode = root.createElementNS(ns, tag);		// Create a new node of the desired type
	newNode.textContent = data;

	return newNode;
}
exports.xmlCreateNode = xmlCreateNode;

//=======================================================
// Globally replaces nodes of one type with another in an
// xml tree.
//=======================================================
function replaceNodes(xml, tag, content, newTag)
{
	// Find all <mo>[ operators.
	xml.find(tag).each(function() {
		if (this.textContent === content)
		{
			var newNode = changeXmlNodeType(this, newTag);
			newNode.textContent = content;
		}
	});
}
exports.replaceNodes = replaceNodes;

//=======================================================
// Determine if a node has an ancestor of a given type
//=======================================================
function hasAncestor(node, type)
{
	type = type.toLowerCase();
	while (node = node.parentNode)
	{
		if (node.nodeName.toLowerCase() === type)
			return true;
	}

	return false;
}
exports.hasAncestor = hasAncestor;

//===========================================================================================
// Adapted from jQuery -- Callers were using jQuery for basic DOM functionality, but that's
// not possible in node.  Take a minimal subset of jQuery to get those modules running.
//===========================================================================================

//=======================================================
//  Utility function for retrieving the text value of an array of DOM nodes
 // @param {Array|Element} elem
//=======================================================
function text( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		for ( ; (node = elem[i]); i++ ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (see #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};
exports.text = text;

//=======================================================
// Convert a node to a simple text node, equivalent to $.text(xxx)
//=======================================================
function setText(node, text)
{
	// Delete children
//	while(node.childNodes.length)
//		node.removeChild(node.childNodes[0]);

	// Set text
	node.textContent = text;
}
exports.setText = setText;

//=======================================================
// Specialized version of $.find(':contains').
//
// Note that this will find ALL text nodes if the search
// text is an empty string.
//=======================================================
function findContaining(node, text)
{
	var out = [];

	// Check this node, but only if it is a leaf
	// The leaf is the textNode. We usually want the parent, but external routines can deal with that.
	if ((!node.childNodes || node.childNodes.length === 0) &&
		node.textContent.indexOf(text) !== -1)
			out.push(node);

	if (node.childNodes)
	{
		// Check all child nodes
		for (var i = 0; i < node.childNodes.length; i++)
			out = out.concat(findContaining(node.childNodes[i], text));
	}

	return out;
}
exports.findContaining = findContaining;

},{"underscore":1,"xmldom":1}],"xml":[function(require,module,exports){
module.exports=require('YQVpIN');
},{}]},{},[])