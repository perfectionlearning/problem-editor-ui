//=======================================================
// Question image overlay
//=======================================================
;(function() {

	//=======================================================
	// CSS sets math and mfrac tags to specific
	// font sizes.  This allows those to be overridden
	// by the insertion of inline styles.
	//=======================================================
	function setMmlFont(el, size)
	{
		var els = el.getElementsByTagName('math');
		var innerEls = el.getElementsByTagName('mfrac');
		if (els.length > 0)
		{
			els[0].setAttribute('style', 'font-size: ' + size);
			if (innerEls.length > 0) {
				innerEls[0].setAttribute('style', 'font-size:140%');
			}
		}
	}

	//=======================================================
	//=======================================================
	app.QImageOverlayView = app.PEView.extend({
		className: 'overlay',
		field: 'qImgText',

		events: {
//			'mousedown .image-overlay': 'highlightOn',
			'mouseover': 'highlightOn',
			'mouseout': 'highlightOff'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {

			var data = this.model.get(this.field)[this.options.idx];

			this.$el.html(app.replaceVars(data.text));
			this.$el.addClass('image-overlay image-overlay-stopped');
			this.$el.css({
				left: this.screenX(data.x),
				top: this.screenY(data.y),
				'font-size': data.size || '5pt',
				color: data.color || 'black'
			});

			if (this.options.makeDraggable)
				this.draggable();

			//----------------------
			app.jaxify(this.$el);
			//----------------------

			return this;
		},

		//---------------------------------------
		//---------------------------------------
		draggable: function() {
			var that = this;

			this.$el.draggable({
				start: function(e, ui) {
					$(this).addClass('image-overlay-drag');
				},

				drag: function(e, ui) {
					var pos = $(this).position();
					var top = that.dataY(Math.round(pos.top));
					var left = that.dataY(Math.round(pos.left));
					var idx = that.options.idx;
//					that.model.trigger('evtRefreshCoordinates', idx, left, top);
				},

				stop: function(e, ui) {
					var el = $(this);
					var pos = el.position();
					var top = Math.round(pos.top);
					var left = Math.round(pos.left);
					var idx = that.options.idx;
					that.model.trigger('evtRefreshCoordinates', idx, that.dataX(left), that.dataY(top));

					el.removeClass('image-overlay-drag');
				}
			});

//			this.$el.css('position', '');
		},

		//---------------------------------------
		//---------------------------------------
		highlightOn: function() {
			if (this.options.canHighlight)
				this.$el.addClass('image-overlay-highlight');
		},

		//---------------------------------------
		//---------------------------------------
		highlightOff: function() {
			if (this.options.canHighlight)
				this.$el.removeClass('image-overlay-highlight');
		},

		//---------------------------------------
		// Return screen coordinates for positioning.
		//
		// These vary from internal coordinates since they
		// may include padding, borders, etc.
		//---------------------------------------
		screenX: function(x) {
			if (defined(x))
				return x-3;
			else
				return 0;
		},

		//---------------------------------------
		// Return screen coordinates for positioning
		//
		// These vary from internal coordinates since they
		// may include padding, borders, etc.
		//---------------------------------------
		screenY: function(y) {
			if (defined(y))
				return y-3;
			else
				return 0;
		},

		//---------------------------------------
		// Return data coordinates for positioning
		//
		// These vary from screen coordinates. They
		// shouldn't include padding, borders, etc.
		//---------------------------------------
		dataX: function(x) {
			return x+3;
		},

		//---------------------------------------
		// Return data coordinates for positioning
		//
		// These vary from screen coordinates. They
		// shouldn't include padding, borders, etc.
		//---------------------------------------
		dataY: function(y) {
			return y+3;
		}

	});
})();
