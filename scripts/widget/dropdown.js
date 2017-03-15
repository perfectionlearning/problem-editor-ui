//===========================================================================================
// jQuery Plugin to create a dropdown menu
//
// Options:
//===========================================================================================
(function($) {
	//=======================================================
	//=======================================================
    $.dropdown = function(data) {
        var filter_options = $.map(data, function(filter) { return '<li>'+filter+'</li>'; });
        var filter_html = '<div><ul><li>Remove Filter</li>' + filter_options.join('') + '</ul></div>';

        return filter_html;
	};

}(jQuery));
