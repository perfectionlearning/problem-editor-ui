//===========================================================================================
// Fatal Error Handling Module
//===========================================================================================

//=======================================================
// Generic Exception Handler
//=======================================================
app.exception = function(err)
{
	var strip = 'uncaught exception: ';
	if (err.indexOf(strip) === 0)
		err = err.substr(strip.length);

	app.createError('<b>A fatal error has occurred</b><br/><br/>' + err);
}

//=======================================================
//
//=======================================================
app.error = function(err)
{
	app.createError(err);
}

//=======================================================
// Place error text in a pretty box
//=======================================================
app.createError = function(html)
{
	var out = '<div id="error" class="container"><div id="errorBox">' + html + '</div></div>';
	$('body').html(out);

	var x = ($('#error').width() - $('#errorBox').outerWidth()) / 2;
	var y = ($('#error').height() - $('#errorBox').outerHeight()) / 2;
	$('#errorBox').css({left: x + 'px', top: y + 'px'});
}