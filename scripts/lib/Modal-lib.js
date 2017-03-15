require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"BliJgm":[function(require,module,exports){
//===============================================================================
// Modal Dialog Box Library
//===============================================================================

var templates = {};

//=======================================================
// Padding after the title
//=======================================================
templates.titlePadding = _.template(
	'<div class="titlePadding">&nbsp;</div>'
);

//=======================================================
// A button with a class
// Params: id, btnClass, text (text displayed on the button)
//=======================================================
templates.buttonClass = _.template(
	'<button id="<%= id %>" class="<%= btnClass %>"><%= text %></button>'
);

//=======================================================
// Dialog box
// Params: title, text
//=======================================================
templates.dialog = _.template(
	'<div class="dialog">' +
		'<div class="dialogTitle"><%= title %></div>' +
		'<div class="dialogText"><%= text %></div>' +
	'</div>'
);

//=======================================================
// Rename Dialog input box
//=======================================================
templates.dialogInput = _.template(
	'<input class="dialogInput" type="text" />'
);

//=======================================================
// Modal Overlay
//
// Options:
//	title: Dialog box title
//	text: HTML that is displayed within the box
//	input: Input type (optional) (valid: "text", "okOnly")
//	ok: Function to call if "OK" is pressed
//	cancel: Function to call if "Cancel" is pressed
//	context: Context for "this" in "ok" and "cancel" routines
//	centerWidth: Width of window to center dialog box in
//=======================================================
exports.View = Backbone.View.extend({

	//---------------------------------------
	//---------------------------------------
	events: {
		'click #modal_ok': 'okay',
		'click #modal_cancel': 'cancel',
		'keydown .dialogInput': function(ev) {
			if (ev.which === 13) this.okay();
			if (ev.which === 27) this.cancel();
		}
	},

	//---------------------------------------
	//---------------------------------------
	initialize: function() {
		// Highly unusual: render from the init routine since it won't occur elsewhere
		this.render();

		// Add this directly to the body
		this.$el.appendTo('body');

		// And then center it
		var dialog = this.$('.dialog');
		var w = dialog.outerWidth();
		var ww = this.options.centerWidth || $('body').outerWidth();

		dialog.css({
			left: (ww - w) / 2,
			top: 150	//mid + tbb - h / 2
		});

		if (this.options.input === "text")
			this.$('.dialogInput').focus();
	},

	//---------------------------------------
	//---------------------------------------
	render: function() {
		this.$el.empty();

		// Add a black backdrop
		this.$el.append('<div class="modal">');

		// Dialog
		this.$el.append(templates.dialog({title: this.options.title, text: this.options.text}));

		// Input field, if any
		if (this.options.input === "text")
			this.$('.dialog').append(templates.dialogInput);

		this.$('.dialog').append(templates.titlePadding);

		// Buttons
		if (this.options.input !== "okOnly")
			this.$('.dialog').append(templates.buttonClass({id: 'modal_cancel', btnClass: 'dialogButton', text: 'Cancel'}));

		this.$('.dialog').append(templates.buttonClass({id: 'modal_ok', btnClass: 'dialogButton', text: 'OK'}));
	},

	//---------------------------------------
	//---------------------------------------
	okay: function() {
		if (this.options.input === "text")
			var param = this.$('.dialogInput').val();

		if (this.options.ok && this.options.context)
			this.options.context[this.options.ok](param);
		else if (this.options.ok)
			this.options.ok(param);

		this.closeDialog();
	},

	//---------------------------------------
	//---------------------------------------
	cancel: function() {
		if (this.options.cancel && this.options.context)
			this.options.context[this.options.cancel]();
		else if (this.options.cancel)
			this.options.cancel();

		this.closeDialog();
	},

	//---------------------------------------
	//---------------------------------------
	closeDialog: function() {
		this.unbind();
		this.remove();
	}
});

},{}],"Modal":[function(require,module,exports){
module.exports=require('BliJgm');
},{}]},{},[])