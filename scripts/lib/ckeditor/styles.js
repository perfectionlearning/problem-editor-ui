/**
 * Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

// This file contains style definitions that can be used by CKEditor plugins.
//
// The most common use for it is the "stylescombo" plugin, which shows a combo
// in the editor toolbar, containing all styles. Other plugins instead, like
// the div plugin, use a subset of the styles on their feature.
//
// If you don't have plugins that depend on this file, you can simply ignore it.
// Otherwise it is strongly recommended to customize this file to match your
// website requirements and design properly.

CKEDITOR.stylesSet.add( 'default', [
	/* Block Styles */


	/* Inline Styles */

	{ name: 'Math',	element: 'span', attributes: { 'class': 'math' } },
	{ name: 'Symbols', element: 'span', attributes: { 'class': 'Symbols' } },

	{ name: 'Equation Prefix/Suffix', element: 'outside' },
	{ name: "Don't print", element: 'span', attributes: { 'class': 'no-print' } }
] );
