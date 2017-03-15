//=======================================================
// Question image overlay row edit
//=======================================================
;(function() {

	//=======================================================
	// Clean up WIRIS MML - copied from richEdit.js template file.
	// Added removeHighlights, which is vital! Without it, the database
	// has filled with garbage.
	//=======================================================
	function filterMML(out)
	{
		var cleaned = stripSingleParagraphs(out);
		cleaned = app.cleanWirisMML(cleaned);
		cleaned = app.restoreMathML(cleaned);	// Strip syntax highlighting

		return cleaned;
	}

	//=======================================================
	//=======================================================
	function stripSingleParagraphs(string)
	{
		if (!string)
			return string;	// Probably a null string, but pass it back anyway

		var match = string.match(/<p>/g);
		if (match && match.length === 1 && string.indexOf('<p>') === 0)
			string = string.replace(/<p>(.*)<\/p>/g, "$1");

		return string;
	}

	//=======================================================
	//=======================================================
	app.QImageEditRowView = app.PEView.extend({
		field: 'qImgText',

		colors: ['red', 'green', 'yellow', 'blue', 'black', 'gray', 'white', 'purple', 'orange'],
		sizes: [8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],

		//---------------------------------------
		//---------------------------------------
		events: {
			'click .startEdit': 'richEditor',
			'click button.overlay-edit-done': 'doneButton',
			'globalSave': 'doneButton',
			'click button.img-menu' : 'doPopup',
			'change .x-coord' : 'setX',
			'change .y-coord' : 'setY'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			_.bindAll(this, 'fontSizeChange', 'fontColorChange',
					  'highlightOverlay', 'showSizeSelector', 'showColorSelector', 'deleteOverlay');
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {

			var data = this.model.get(this.field)[this.options.idx];

			var template = !this.options.compact ? app.templates.overlayRow : app.templates.overlayRowCompact;

			this.$el.html(template({
				value: data.text,
				x: data.x,
				y: data.y,
				size: data.size,
				color: data.color
			}));

			//----------------------
			// This breaks the edit row:  field value doesn't get copied into editor.
			app.jaxify(this.$el);
			//----------------------

			return this.el;
		},

		//---------------------------------------
		//---------------------------------------
		doneButton: function(e) {

			// Extract data, then close the editor
			var editor = this.$el.find('.richEdit');
			var obj = editor.ckeditorGet();
			var text = obj.getData();
			text = filterMML(text);
			obj.destroy();

			// Update edited overlay for each instance of the image.
			this.updateModel({text: text});

			// highlight overlay on image.
			this.model.trigger('highlightMyOverlay', this.options.idx);
		},

		//---------------------------------------
		//---------------------------------------
		richEditor: function(e) {
			var idx = this.options.idx;
			this.model.trigger('highlightMyOverlay', idx);

			var fld = $(e.currentTarget);
			var attachEditorTo = fld.parent();
			var data = fld.html();

			// Preserve x and y values at time editor activated.
//			this.data.x = this.$('.x-coord').val();
//			this.data.y = this.$('.y-coord').val();

			// Filter out MathJax code
			var data = app.removeMathJax($(fld).html());
			data = app.restoreMathML(data);
			var editor = app.templates.overlayEditor({value: data || ''});
			attachEditorTo.html(editor);
			this.editor = this.$('.richEdit').ckeditor();

			// FIXME: rt - this has to be bad; figure out alternative
			attachEditorTo.removeClass('startEdit');
		},

		//---------------------------------------
		//---------------------------------------
		setX: function(e) {
			var fld = e.currentTarget;
			this.updateModel({x: fld.value});
		},

		//---------------------------------------
		//---------------------------------------
		setY: function(e) {
			var fld = e.currentTarget;
			this.updateModel({y: fld.value});
		},

		//---------------------------------------
		//---------------------------------------
		doPopup: function(e) {
			var el = e.currentTarget;
			var idx = this.options.idx;
			$(el).buttonPop({
                items: [
                    {label:'Highlight', click:this.highlightOverlay},
					{label:'Set Size', click:this.showSizeSelector},
					{label:'Set Color', click:this.showColorSelector},
                    {label:'Delete', click:this.deleteOverlay},
                ],
                x: e.pageX,
                y: e.pageY-60,
                yMargin: 5,
                xAnim: 25,
                rate: 300,
                event: e
            });
		},

		//---------------------------------------
		// Clicked highlight button for particular overlay row;
		// Send signal to qImage view, with index of overlay to
		// highlight.
		//---------------------------------------
		highlightOverlay: function() {
			this.model.trigger('highlightMyOverlay', this.options.idx);
		},

		//---------------------------------------
		//---------------------------------------
		showSizeSelector: function(ev) {
			var that = this;

			var sizeList = $.map(this.sizes, function(val) {
				return {label:val + ' pt', action: that.fontSizeChange};
			});

			this.$el.contextPopup({
				title: 'Font Size',
				items: sizeList,
				top: ev.pageY + 150,
				left: ev.pageX
			});
		},

		//---------------------------------------
		//---------------------------------------
		fontSizeChange: function(size) {
			var newSize = parseInt(size) + 'pt';
			this.updateModel({size:newSize});
		},

		//---------------------------------------
		//---------------------------------------
		showColorSelector: function(ev) {
			var that = this;

			var list = $.map(this.colors, function(val) {
				return {label:val, action: that.fontColorChange};
			});

			this.$el.contextPopup({
				title: 'Font Color',
				items: list,
				top: ev.pageY,
				left: ev.pageX
			});
		},

		//---------------------------------------
		//---------------------------------------
		fontColorChange: function(color) {
			this.updateModel({color:color});
		},

		//---------------------------------------
		//---------------------------------------
		deleteOverlay: function() {
			this.options.deleteHandler(this.options.idx);
		},

		//---------------------------------------
		//---------------------------------------
		updateModel: function(setting) {
			var that = this;

			// Update the model
			this.options.updateHandler(this.options.idx, setting);

			this.render();
		},

		//---------------------------------------
		//---------------------------------------
		close: function() {
		}
	});

})();
