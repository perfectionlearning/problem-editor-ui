/*********************************************************************************************************/
/**
 * inserthtml plugin for CKEditor 3.x (Author: Lajox ; Email: lajox@19www.com)
 * version:	 1.0
 * Released: On 2009-12-11
 * Download: http://code.google.com/p/lajox
 */
/*********************************************************************************************************/

CKEDITOR.dialog.add("inserthtml",function(e){
	return{
		title:e.lang.inserthtml.title,
		resizable : CKEDITOR.DIALOG_RESIZE_BOTH,
		minWidth:380,
		minHeight:260,

		onShow:function(){
		},

		onOk: ( function() {
			function setData( dialog, newData ) {
				// [IE8] Focus editor before setting selection to avoid setting data on
				// locked selection, because in case of inline editor, it won't be
				// unlocked before editable's HTML is altered. (#11585)
				e.focus();
				e.setData( newData, function() {
					dialog.hide();

					// Ensure correct selection.
					var range = e.createRange();
					range.moveToElementEditStart( e.editable() );
					range.select();
				} );
			}

			return function( event ) {
				var	that = this;

				var sInsert=this.getValueOf('info','insertcode_area');
				var wrap = false;	//this.getValueOf('info','wrapMathML');
				if (sInsert.indexOf('<math') === -1 && wrap)
					sInsert = "<math>" + sInsert + "</math>";

				setTimeout( function() {
					if (sInsert.indexOf('<semantics') !== -1 || sInsert.indexOf('<annotation') !== -1)
						alert("Illegal MathML!  The special KB filter for MathType is required.");
					else if ( sInsert.length > 0 )
					{
						sInsert = app.cleanMathType(sInsert);	// This is a bit of a violation, but use the MathType cleanup singleton to preprocess anything added
//						setData( that, sInsert );	// Replaces everything in the editor
//						e.insertHtml(sInsert, "unfiltered_html");	// Doesn't add MathML unless wrapped in a <span>

						// Attempt to turn the text into HTML. If it fails, alert the user.
						try {
							var element = CKEDITOR.dom.element.createFromHtml( sInsert );
							e.insertElement( element );
							that.hide();
						}
						catch(e) {
							alert('Illegal MathML. Failed to paste.');
						}
					}
				} );

				// Don't let the dialog close before setData is over, to hide
				// from user blinking caused by selection restoring and setting new data.
				return false;
			};
		} )(),

		contents:[
			{	id:"info",
				label:e.lang.inserthtml.commonTab,
				elements:[{
				 type:'vbox',
				 children:[
				  {
					type:'html',
					html:'<span>'+e.lang.inserthtml.HelpInfo+'</span>'
				  },
/*
					{
						type : 'checkbox',
						id : 'wrapMathML',
						isChanged : false,
						label : e.lang.inserthtml.wrapOption
					},
*/
				  {
					type:'textarea',
				    id:'insertcode_area',
					label:'',
					rows:10
				  }]
				}]
			}
		]
	};
});