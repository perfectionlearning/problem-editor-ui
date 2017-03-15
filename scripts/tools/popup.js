//===========================================================================================
// jQuery Plugin to create a popup button menu
//
// Options:
//===========================================================================================
(function() {

	var buttonHtml = '<button class="buttonPop" style="position:absolute">';
	var itemList;
	var idString = 'buttonPop';

	function click(ev) {
		if ($(ev.target).attr('class') === 'buttonPop')
		{
			var idx = ev.target.id.substring(idString.length);
			itemList && itemList[idx] && itemList[idx].click && itemList[idx].click(ev, itemList[idx]);
		}

		$('.buttonPop').remove();
		$('body').off('click');
	}

	$.fn.buttonPop = function(cmd) {
		switch(cmd)
		{
			case 'close':
				$('.buttonPop').remove();
				break;

			// Create the controls
			default:
				if (!cmd || !cmd.items || !cmd.items.length)
					return this;

				// Close any existing menus.  Necessary because we stop propagation below
				$('.buttonPop').remove();

				var len = cmd.items.length;
				var left = cmd.x + (cmd.xMargin || 0);
				itemList = cmd.items;		// Save for button press handling

				var that = this;
				$.each(cmd.items, function(idx, val) {
					var el = $(buttonHtml).text(val.label).attr('id', idString + idx).appendTo(that.parent());
					var h = el.outerHeight();
					var totalHeight = len * (h + cmd.yMargin) - cmd.yMargin;
					var destY = cmd.y - (totalHeight/2) + (idx * (h + cmd.yMargin));
					el.css({left:left, top:cmd.y - h / 2});

					el.animate({top: destY, left: left + cmd.xAnim}, {queue: false, duration: cmd.rate || 500});
				});

				cmd.event && cmd.event.stopPropagation();
				$('body').click(click);

				return this;
		}
	};

}());
