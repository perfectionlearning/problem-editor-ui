/*********************************************************************************************************/
/**
 * inserthtml plugin for CKEditor 3.x (Author: Lajox ; Email: lajox@19www.com)
 * version:	 1.0
 * Released: On 2009-12-11
 * Download: http://code.google.com/p/lajox
 */
/*********************************************************************************************************/

CKEDITOR.plugins.add('inserthtml',
  {
	lang : [ 'en' ],
    init:function(a) {
	var b="inserthtml";
	var c=a.addCommand(b,new CKEDITOR.dialogCommand(b));
	a.ui.addButton && a.ui.addButton(b,{
					label:a.lang.inserthtml.toolbar,
					command:b,
					icon:this.path+"inserthtml.gif",
					toolbar: 'mode,10'

	});
	CKEDITOR.dialog.add(b,this.path+"dialogs/inserthtml.js")}
});