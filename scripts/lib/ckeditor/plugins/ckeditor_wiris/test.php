﻿<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
	<head>
		<meta http-equiv="content-type" content="text/html; charset=UTF-8">
		<meta name="keywords" content="math,science" />
		<script type="text/javascript" src="core/WIRISplugins.js?viewer=image"></script>
		<script type="text/javascript">
			String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g, '');};
			function getParameter(name) {
				var value = new RegExp(name+"=([^&]*)","i").exec(window.location);
				if (value!=null && value.length>1) {
					value = decodeURIComponent(value[1].replace(/\+/g,' '));
				} else {
					value = null;
				}
				return value;
			}
			function insertHtml(content) {
				if (content!=null && content.length>0) {
					document.write(content);
				}
			}
			function setValue(id, content) {
				if (content!=null && content.length>0) {
					document.getElementById(id).value = content;
				}
			}
			
			var con = new XMLHttpRequest();
			con.open("GET", "tech.txt", false);
			con.send(null);
			var s = con.responseText;
			tech = s.split("#")[0].trim();
		    if (tech=="php") {
				_wrs_int_conf_file = "integration/loadconfig.php";
			} else if (tech=="aspx") {
				_wrs_int_conf_file = "integration/configurationjs.aspx";
	        } else if (tech=="local-java") {
				_wrs_int_conf_file = "app/configurationjs";
	        } else if (tech=="java") {
				_wrs_int_conf_file = "/pluginwiris_engineapp/configurationjs";
	        }
			var content = getParameter("content");
		</script>
		<script type="text/javascript" src="core/display.js"></script>
		<script type="text/javascript" src="tests/generic_demo.js"></script>

		<script type="text/javascript">
			function wrs_addEvent(element, event, func) {
				if (element.addEventListener) {
					element.addEventListener(event, func, false);
				}
				else if (element.attachEvent) {
					element.attachEvent('on' + event, func);
				}
			}

			wrs_addEvent(window, 'load', function () {
				// Hide the textarea
				var textarea = document.getElementById('example');
				textarea.style.display = 'none';

				// Create the toolbar
				var toolbar = document.createElement('div');
				toolbar.id = textarea.id + '_toolbar';
				
				// Create the WYSIWYG editor
				var iframe = document.createElement('iframe');
				iframe.id = textarea.id + '_iframe';
				
				wrs_addEvent(iframe, 'load', function () {
					// Setting design mode ON
					iframe.contentWindow.document.designMode = 'on';
					
					// Setting the content
					if (iframe.contentWindow.document.body) {
						iframe.contentWindow.document.body.innerHTML = textarea.value;
					
						// WE INIT THE WIRIS PLUGIN HERE
						wrs_int_init(textarea.id);
					}
				});
				
				iframe.src = 'tests/generic_demo.html';		// We set an empty document instead of about:blank for use relative paths for images
				iframe.width = 500;
				iframe.height = 200;

				// Insert the WYSIWYG editor before the textarea
				textarea.parentNode.insertBefore(iframe, textarea);
				
				// Insert the toolbar before the WYSIWYG editor
				iframe.parentNode.insertBefore(toolbar, iframe);
				
				// When the user submits the form, set the textarea value with the WYSIWYG editor content
				var form = document.getElementById('exampleForm');
				
				wrs_addEvent(form, 'submit', function () {
					//textarea.value = iframe.contentWindow.document.body.innerHTML;
					// In our case, the plugin is who sets the textarea content.
				});
			});
			
			function changeDPI() {
				ls = document.getElementsByClassName('Wirisformula');
				for (i=0;i<ls.length;i++) {
					img = ls[i];
					img.width = img.clientWidth;
					img.src = img.src + "&dpi=600";
				}
			}
		</script>
		
		<title>WIRIS Plugin generic integration on PHP | Educational mathematics</title>
	</head>
	<body>
		<h1><a href="http://www.wiris.com"><img src="https://www.wiris.com/en/system/files/attachments/889/wiris_50.png" title="WIRIS" /></a> Test page for WIRIS plugins
			"<script>
			document.write(tech);
			</script>"
		
		</h1>
	
		<form id="exampleForm" method="POST">
			<textarea id="example" name="content" cols="50" rows="10"><?php echo $_POST['content'];?></textarea>
			<br />
			<script>setValue("example",content);</script>
			
			<input id="previewButton" type="submit" value="Preview"/>
		</form>
		
		<h2>Preview</h2>		

		<div id="previewBox">
			<?php echo $_POST['content'];?>
		</div>

		<script>
			var value = document.getElementById("example").value;
			if (value.length==0 || value=="<!-- content "+"value -->") {
				document.getElementById("previewBox").innerHTML = '<span id="previewMessage">Press the "Preview" button.</span>';
			}
		</script>

		</script>
	</body>
</html>
