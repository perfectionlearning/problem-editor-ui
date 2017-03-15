//===========================================================================================
// jQuery Plugin to create mutually exclusive lists
//
// I can't remember the purpose of this. I think more advanced behavior than radio boxes
// was required, possibly through interaction between multiple lists.
// It still serves as a useful container for generating checklists.
//
// Options:
//===========================================================================================
(function() {
	var id;
	var type = "checkbox";
	var options = {};

	//=======================================================
	//=======================================================
	function cleanup(self, parent)
	{
		var inpID = parent.id + 'cl' + id;
		$(self).replaceWith('<tr><td>' +
			'<input type="' + type + '" name="' + parent.id + '" id="' + inpID + '"/>' +
			'<label for="' + inpID + '" title="' + $(self).attr('title') + '">' + $(self).text() + '</label>' +
			'</td></tr>');

		id++;
	}

	//=======================================================
	//=======================================================
	function clearAll(el)
	{
		$(el).find('input').each(function() {
			this.checked = false;
		});
	}

	//=======================================================
	//=======================================================
	$.fn.checklist = function(arg) {

		var cmd;
		if (typeof(arg) !== 'object')
			cmd = arg;
		else
			options = arg;

		switch(cmd)
		{
			case 'value':
				var ins = $(this).find('input');
				var state = [];
				$(this).find('input').each(function(){state.push(this.checked)});
				return state;

			// Create the element
			default:
				// Operate on each element
				return this.each(function() {
					id = 0;	// Reset
					var self = this;
					$(this).find('li').each(function() {cleanup(this, self)});

					// Convert list to table -- Kills indentation
//					$(this).replaceWith('<table>' + $(this).html() + '<table>');

					if (options && defined(options.checked))
					{
						var all = $(this).find('input');

						$.each(options.checked, function(idx, val) {
							all[val] && (all[val].checked = true);
						});

					}

// This block allows checkboxes to work like radio buttons.  Selecting any option clears all others.
					if (options && options.single)
					{
						var parent = this;
						$(this).find('input').change(function(){
							var cur = this.checked;
							clearAll(parent);
							this.checked = cur;
						});
					}
				});
		}

	};

}());
