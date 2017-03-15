//===========================================================================================
// jQuery Plugin to convert MathML answer strings to MathML plus input boxes
//
// Options:
//===========================================================================================
(function() {
	var UID = 0;

    $.mmlAnswer = function(element, cmd, options) {

		var minWidth = 3;
		var maxWidth = 9;

        // plugin's default options
        // this is private property and is  accessible only from inside the plugin
        var defaults = {
			digitWidth: 4	// Ludicrously small
        }

        // to avoid confusions, use "plugin" to reference the current instance of the object
        var plugin = this;

        // this will hold the merged default, and user-provided options
        // plugin's properties will be available through this object like:
        // plugin.settings.propertyName from inside the plugin or
        // element.data('mmlAnswer').settings.propertyName from outside the plugin, where "element" is the
        // element the plugin is attached to;
        plugin.settings = {};

        var $element = $(element),  // reference to the jQuery version of DOM element the plugin is attached to
             element = element;        // reference to the actual DOM element

		//=======================================================
        // the "constructor" method that gets called when the object is created
		//=======================================================
        plugin.init = function() {
            // the plugin's final properties are the merged default and user-provided options (if any)
            plugin.settings = $.extend({}, defaults, options);

            // code goes here
			plugin.settings.answer = [];

			cmd = clean(cmd);
			plugin.settings.mml = cmd;
			$element.html(cmd);
        }

		//=======================================================
		//=======================================================
		plugin.boxes = function()
		{
			return inputList($element);
		}

		//=======================================================
		//=======================================================
		plugin.boxCount = function()
		{
			return plugin.settings.answer.length;
		}

		//=======================================================
		//=======================================================
		plugin.showAnswer = function()
		{
/*
	Modifying MathML that is part of the DOM isn't working properly.  The Firefox MathML viewer
	shows the newly inserted nodes with capital names, such as <MN> instead of <mn>.
	I’m not sure what the difference is, but they are displayed incorrectly.
	Instead of wrapping in an <mrow>, which just hid the problem, we are forced to remove
	the entire <math> tree from the DOM, edit it as a text string using regular expressions,
	then insert it back into the DOM.  Manipulating it as a disconnected XML tree didn’t
	work; reconverting from text is required.
*/
			var i = 0;
//			var mml = $element.html();
			var mml = plugin.settings.mml;

			var regex = /<menclose class="placeholder" notation="box">.+?<\/menclose>/g;
			mml = mml.replace(regex, function() {
				return '<mn>' + plugin.settings.answer[i++] + '</mn>';
			});

			$element.html(mml);
		}

		//=======================================================
		//=======================================================
		plugin.answers = function()
		{
			return plugin.settings.answer;
		}

		//=======================================================
		// Clean up input boxes
		//=======================================================
		function clean(data)
		{
			var regex = /<maction[^>]*>(.+?)<\/maction>/g;
			mml = data.replace(regex, function(all, ansText) {
				// Strip any tags
				if (ansText.indexOf('<') !== -1)
					var ans = $.trim($(ansText).text());
				else
					ans = ansText;

				plugin.settings.answer.push(ans);	// Save the answer

				var len = ans.length + 1;	// 1 wider than the indicated size
				len = Math.min(len, maxWidth);
				len = Math.max(len, minWidth);

				var charWidth = options.digitWidth;
				var w = len * charWidth;	// We should subtract out the 6 pixels added my <menclose> (is that always 6?) and add the padding we use for our input boxes

//				console.log(ans, len, charWidth, w);

				// This is the good version.  However, Firefox 19 and below don't know how to calculate the width of mspace elements (even though it's explicitly defined!)
				// Note that the <menclose> isn't consistently sized even though the <mspace> is a constant size!
				// <mspace>: 54x16 -> <menclose>: 60x22, <mspace>: 54x16 -> <menclose>: 58x20
				return '<menclose class="placeholder" notation="box"><mspace height="16px" width="' + w + 'px" /></menclose>';
			});

			return mml;
		}

		//=======================================================
		// Returns: {x, y, w, h}
		//=======================================================
		function inputList($el)
		{
			var outer = $el.parent().offset();	// Mega hack!
			var out = [];

			$el.find('.menclose').each(function() {

				// This got a lot more complicated.  The offsets were wrong when they occurred within
				// a scrollable element.  This overly complex method keeps everything straight.
				// The reason for much of the complexity is that $(this) is a MathML element,
				// which is XML rather than a real DOM element.  It doesn't have all of the
				// offset query functions available to normal DOM elements.

				// Figure out $el's position within its parent
				var obj = $el.prop('style');
				if (defined(obj.left))
					var x = obj.left ? parseInt(obj.left, 10) : 0;	// Values returned include "px" at the end.  Use parseInt to clear it.
				if (defined(obj.top))
					var y = obj.top ? parseInt(obj.top, 10) : 0;

				// Figure out position of $(this) relative to $el.
				var thisOfs = $(this).offset();
				var elOfs = $el.offset();
				var dx = thisOfs.left - elOfs.left;
				var dy = thisOfs.top - elOfs.top;

				////////////////////////////////////
				// MathJax left padding compensation
				//
				// The internal <mspace> is smaller; this method isn't great
				////////////////////////////////////
				var emConvert = parseFloat($("body").css("font-size"));
				var padLeft = this.style.paddingLeft ? Math.round(parseFloat(this.style.paddingLeft) * emConvert) : 0	// Assumes padLeft is in em!
				///////////////////////////////

				out.push({
					x: Math.round(x + dx + padLeft),	//Math.round(ofs.left - outer.left),
					y: Math.round(y + dy),	//Math.round(ofs.top - outer.top) + deltaY,
//					w: this.scrollWidth - padLeft,	// jQuery should be able to do this for us, but it doesn't!
//					h: this.scrollHeight
					w: $(this).width(),
					h: $(this).height()
				});
			});

			return out;
		}

		//=======================================================
        // fire up the plugin!
        // call the "constructor" method
		//=======================================================
        plugin.init();

    }

	//=======================================================
    // add the plugin to the jQuery.fn object
	//=======================================================
    $.fn.mmlAnswer = function(cmd, options) {

        // iterate through the DOM elements we are attaching the plugin to
        return this.each(function() {

            // if plugin has not already been attached to the element
            if (undefined == $(this).data('mmlAnswer')) {
                // create a new instance of the plugin
                // pass the DOM element and the user-provided options as arguments
                var plugin = new $.mmlAnswer(this, cmd, options);

                // in the jQuery version of the element
                // store a reference to the plugin object
                // you can later access the plugin and its methods and properties like
                // element.data('mmlAnswer').publicMethod(arg1, arg2, ... argn) or
                // element.data('mmlAnswer').settings.propertyName
                $(this).data('mmlAnswer', plugin);
            }
        });
    }

}());
