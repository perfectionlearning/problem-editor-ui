/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.html or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	// Define changes to default configuration here.
	// For the complete reference:
	// http://docs.ckeditor.com/#!/api/CKEDITOR.config

//==================================================
// DG: Custom toolbar
//==================================================
	config.toolbar = 'plToolbar';
	config.toolbar_plToolbar =
	[
		{ name: 'clipboard', items : [ 'Cut','Copy','Paste','PasteText','PasteFromWord','-','Undo','Redo' ] },
		{ name: 'editing', items : [ 'Find','Replace','-','SelectAll'] },
		{ name: 'basicstyles', items : [ 'Bold','Italic','Underline','Subscript','Superscript','-','RemoveFormat' ] },
		{ name: 'styles', items: ['Styles'] },
		{ name: 'insert', items : [ 'SpecialChar', 'inserthtml', 'ckeditor_wiris_formulaEditor'] },
		{ name: 'devtools', items: ['Sourcedialog'] }
	];

// sourcearea's button name is "Source"
// sourcedialog's button name is "Sourcedialog"

//==================================================
// DG: Removed
//==================================================
/*
	// The toolbar groups arrangement, optimized for two toolbar rows.
	config.toolbarGroups = [
		{ name: 'clipboard',   groups: [ 'clipboard', 'undo' ] },
		{ name: 'editing',     groups: [ 'find', 'selection', 'spellchecker' ] },
		{ name: 'links' },
		{ name: 'insert' },
		{ name: 'forms' },
		{ name: 'tools' },
		{ name: 'document',	   groups: [ 'mode', 'document', 'doctools' ] },	// Source goes to 'mode'
		{ name: 'others' },
		'/',
		{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
		{ name: 'paragraph',   groups: [ 'list', 'indent', 'blocks', 'align', 'bidi' ] },
		{ name: 'styles' },
		{ name: 'colors' },
		{ name: 'about' }
	];

	// Remove some buttons, provided by the standard plugins, which we don't
	// need to have in the Standard(s) toolbar.
	config.removeButtons = 'Underline,Subscript,Superscript';

	// Se the most common block elements.
	config.format_tags = 'p;h1;h2;h3;pre';
*/

	// Make dialogs simpler.
	config.removeDialogTabs = 'image:advanced;link:advanced';

//==================================================
// DG: Additions
//==================================================
	// Add WIRIS to the plugin list
	config.extraPlugins += (config.extraPlugins.length == 0 ? '' : ',') + 'ckeditor_wiris';
	config.extraPlugins += ',inserthtml';

	// Remove bottom line
	config.removePlugins = 'elementspath,sourcearea,entities';

	// Allow all tags (disable ACF)
	config.allowedContent = true;

	// Prevent entity conversion -- Removed "entities" plugin instead
//	config.entities = false;
//	config.basicEntities = false;
//	config.entities_processNumerical = 'force';

	// Set italic style to <i> and not <em>
	config.coreStyles_italic = { element: 'i', overrides: 'em' };

	// Set bold style to <b> and not <strong>
	config.coreStyles_bold = { element: 'b', overrides: 'strong' };

	// Disable toolbar collapse button
	config.toolbarCanCollapse = false;

	// Don't wrap everything in <p>
	config.autoParagraph = false;

	config.width = '95%';
	config.height = 100;
	config.resize_dir = 'both';

	// Modify the list of special characters
	config.specialChars = [
		['&copy;', 'Copyright sign'],
		['&reg;', 'Registered sign'],
		['&trade;', 'Trade mark sign'],
		['&hellip;', 'Horizontal ellipsis'],
		['&prime;', 'Prime, minutes, feet'],
		['&Prime;', 'Double prime, seconds, inches'],
		['&pi;', 'Greek small letter pi'],
		['&infin;', 'Infinity'],
		['&middot;', 'Middle dot'],
		['&times;', 'Multiplication sign'],
		['&divide;', 'Division sign'],
		['&deg;', 'Degree sign'],
		['&ang;', 'Angle'],
		['&#x2225;', 'Parallel'],
		['&ge;', 'Greater-than or equal to'],
		['&le;', 'Less-than or equal to'],
		['&ne;', 'Not equal to'],
		['&cong;', 'Approximately equal to']
	];

};
