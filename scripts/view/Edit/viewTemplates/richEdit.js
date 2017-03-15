//=======================================================
// Rich edit (ckeditor)
//=======================================================
;(function() {
	app.RichEditView = app.PEView.extend({
		compare: app.simpleCompare,

		//---------------------------------------
		//---------------------------------------
		events: {
			'click .startEdit': 'edit',
			'click button': 'stopEdit',
			'globalSave' : 'stopEdit'
		},

		//---------------------------------------
		//---------------------------------------
		initialize: function() {
			this.original = this.last = this.options.original && this.options.original.get(this.field);
			this.isDirty = !this.compare(this.model.get(this.field), this.original);

			// This creates zombies!  It needs to be manually unbound!
//			this.model.on('change:' + this.field, this.modelChanged, this);	// This SHOULD work, but it doesn't always!
			this.modelChanged = _.bind(this.modelChanged, this);		// Use these two lines instead
			this.model.on('change:' + this.field, this.modelChanged);
		},

		//---------------------------------------
		//---------------------------------------
		render: function() {
			var data = this.model.get(this.field);
			if (this.dataOut)
				data = this.dataOut(data);

			if (this.options.edit)
			{
				data = app.createWirisMML(data);	// Slightly redundant with this.dataOut, but perform some emergency MathML munges to allow WIRIS to work on otherwise valid MathML

				// This textarea must already exist in the DOM.  Under our current render model, it doesn't if we start in edit mode!
				this.$el.html(app.templates.editor({header: this.header, value: data || ''}));
				this.$('.richEdit').ckeditor();
			}
			else {

				this.$el.html(app.templates.textItemComplex({header: this.header, value: data || '<i>undefined</i>'}));

				//----------------------
				app.jaxify(this.$el);
				//----------------------
			}

			return this.el;
		},

		//---------------------------------------
		// Fetch the value from the control
		//---------------------------------------
		value: function() {
			var ed = this.$('.richEdit');
			if (ed.length > 0)
				var out = ed.val();
			else
			{
				var out = this.$('.value').html();
				out = app.removeHighlights(out);	// Strip syntax highlighting
			}

			return this.dataIn ? this.dataIn(out) : out;
		},

		//---------------------------------------
		// Enter edit mode
		//---------------------------------------
		edit: function() {
			if (!this.options.edit)
			{
				this.options.edit = true;
				this.render();
			}
		},

		//---------------------------------------
		// Exit edit mode
		//---------------------------------------
		stopEdit: function() {
			if (this.options.edit)
			{
				this.options.edit = false;

				// I hate having this here, but the page crashes if WIRIS is open when CKEditor closes
				// The bug was actually unrelated to whether WIRIS is closed or not.
				// However, it's better to close the window anyway if it's still open.
				if (_wrs_int_window_opened)
					_wrs_int_window.close();

				// Close CKEditor
				this.$('.richEdit').ckeditorGet().destroy();

				// Do some filtering on the values
				this.filterMML();

//				fw.debug('Saved: ' + this.value());
				app.changed.call(this);		// Do this after destroy()
				this.render();		// Can this be removed??
			}
		},

		//---------------------------------------
		// Clean up WIRIS MML
		//---------------------------------------
		filterMML: function() {
			var el = this.$('.richEdit');
			var out = el.val();

			var cleaned = this.stripSingleParagraphs(out);
			cleaned = app.cleanWirisMML(cleaned);
			el.val(cleaned);
		},

		//---------------------------------------
		// If there is only a single paragraph, strip the <p> markers
		//---------------------------------------
		stripSingleParagraphs: function(string) {
			if (!string)
				return string;	// Probably a null string, but pass it back anyway

			var match = string.match(/<p>/g);
			if (match && match.length === 1 && string.indexOf('<p>') === 0)
				string = string.replace(/<p>(.*)<\/p>/g, "$1");

			return string;
		},

		//---------------------------------------
		// Close routine.  Unbind model events.
		//---------------------------------------
		close: function() {
			this.model.off(null, this.modelChanged);
		}
	});
})();
