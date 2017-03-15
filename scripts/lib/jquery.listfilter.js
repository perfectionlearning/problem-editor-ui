// listFilter narrows down a list based on specified criteria
// By Eli Van Zoeren - http://elivz.com
// This is based on liveUpdate, originally by John Nunemaker and revised by John Resig
//
// $('listToFilter').listFilter('criteriaForm', {listElement: 'li', transition: 'toggle|slide|fade', speed: 500});
// listToFilter (req.) - The container element of the items you want to filter, usually a <ul> or a <ol>
// criteriaForm (req.) - A form containing the options for filtering. <input />, <textarea>, or <select>. Each item should have an ID matching the class-name of an item in the list, but ending in '_filter'. For instance, if there is a subelement of the list items with class="name", you can filter it with <input type="text" id="name_filter".
// listElement (optional) - The direct child element of #listToFilter that represents an individual item. Defaults to 'li'.
// transition (optional) - The effect used for showing and hiding the items as they are filtered. Can be 'toggle', 'slide', or 'fade'. Defaults to 'toggle'.
// speed (optional) - The speed at which the effect happens. Set this to 0 for no transition. Defaults to 500

(function($) {
    $.fn.listFilter = function(form, options) {

        var opts = $.extend({}, $.fn.listFilter.defaults, options),
            list = $(this),
            form = $(form);

        // Cache the list to filter
        if ( list.length ) {
        	var rows = list.find(opts.listElement);
//        	form.submit(function(e) { e.preventDefault(); });

			// Multi-filter version
//        	$(':input', form).keyup(filter).change(filter);
			// debounce the filter on keyup to mitigate the pain of processing a long list.
			var delayedKeyup = _.debounce(filter, 300);
        	//form.keyup(filter).change(filter);
			form.keyup(delayedKeyup).change(filter);

			form.focus();

        	filter();
        }

    	return this;

    	function filter() {
            var scores = [], terms = {};

            // Get all the terms we are sorting by
            terms[form.attr('id').toLowerCase().replace('_filter','')] = form.val().toLowerCase();

			// Multi-filter version
//            $("[id$='_filter']", form).each(function() {
//                terms[$(this).attr('id').toLowerCase().replace('_filter','')] = $(this).val().toLowerCase();
//            });

            // Check each list element against the filter terms
            rows.each(function(i) {
            	var score = true;
				var that = this;
				$.each(terms, function(term, val) {
            		score = score && ($(that).text().toLowerCase().indexOf(val) >= 0 );
            	});
            	scores.push([score, i]);
            });

            // Show or hide each item as necessary
            $.each(scores, function() {
            	switch (opts.transition) {
                    case 'toggle':
                    	this[0] ? $(rows[ this[1] ]).show(opts.speed) : $(rows[ this[1] ]).hide(opts.speed);
                    	break;
                    case 'slide':
                    	this[0] ? $(rows[ this[1] ]).slideDown(opts.speed) : $(rows[ this[1] ]).slideUp(opts.speed);
                    	break;
                    case 'fade':
                    	this[0] ? $(rows[ this[1] ]).fadeIn(opts.speed) : $(rows[ this[1] ]).fadeOut(opts.speed);
                    	break;
            	}
            });
    	}
    };

    // Default options
    $.fn.listFilter.defaults = {
        listElement: 'li',
        transition: 'toggle',  // auto, toggle, slide, or fade
        speed: 500
    };

})(jQuery);