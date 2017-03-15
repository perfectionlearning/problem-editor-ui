//===========================================================================================
// HTML templates used to render views
//===========================================================================================
(function() {
	var reviewStatusHeaderCode =
		'<div class="statusHeader">' +
		'<span class="status"><%= status %></span>' +
		'<span class="closeStatus"><span>x</span></span>' +
		'</div>';
	
	var reviewCommentsCode =
		'<div class="commentHeader">Comments</div>' +
		'<textarea class="comments"></textarea>' +
		'<div class="review-comments-buttons">' +
		'<a href="#" class="review-cancel">Cancel</a>' +
		'<a href="#" class="review-save">Save</a> ' +
		'</div>' +
		'<div class="errorMsg">A Failure status requires entry of an explanation.</div>'+
		'<br class="clear"/>';

	var popupCode = {};

	popupCode.fail =
        '<div class="reviewPopupWrapper">' +
			reviewStatusHeaderCode +
		'   <span class="commonFailures">' +
		'	'
		'	</span>' +
		'	<div class="reviewPopup review-fail">' +
			reviewCommentsCode +
		'	</div>' +
		'</div>';
	popupCode.pass =
        '<div class="reviewPopupWrapper">' +
			reviewStatusHeaderCode +
		'	<div class="reviewPopup review-pass">' +
			reviewCommentsCode +
		'	</div>' +
		'</div>';
	popupCode.history = '';
	popupCode.note =
        '<div class="reviewPopupWrapper">' +
			reviewStatusHeaderCode +
		'	<div class="reviewPopup review-note">' +
			reviewCommentsCode +
		'	</div>' +
		'</div>';
	popupCode.assign =
        '<div class="reviewPopupWrapper">' +
			reviewStatusHeaderCode +
		'	<div class="reviewPopup review-note">' +
			reviewCommentsCode +
		'	</div>' +
		'</div>';

	app.templates || (app.templates = {});

	//=======================================================
	// Review Pane: Status + menu
	//=======================================================
	app.templates.simpleReview = _.template(
		'<div class="rightEdge">' +
			'<div class="reviewPopupPlaceholder"></div>' +
			'<ul class="reviewMenu"><li>Menu' +
			'<ul>' +
			    '<li>Fail</li>' +
			    '<li>Pass</li>' +
			    '<li>Unreviewed</li>' +
			    '<li>Note</li>' +
			    '<li>History</li>' +
			'</ul></li>' +
			'</ul>' +
		'</div>' +

		'<%= status %>' +
		''
	);

	//=======================================================
	// Review Pane container for Whiteboard
	//=======================================================
	app.templates.reviewContainer = _.template(
		'<div id="review-container" class="reviewContainerBlock">'+
		'</div>'
	);
	
	//=======================================================
	// Review Pane: Status + menu + who, when, what
	//=======================================================
	app.templates.adminReviewMenuOption = _.template(
		'<li><%= label %></li>'
	);
	
	app.templates.adminReview = _.template(
		'<div id="review_<%= id %>" class="reviewBlock">' +
			'<div class="rightEdge">' +
				'<div class="reviewPopupPlaceholder"><div class="positioner"></div></div>' +
				'<ul class="reviewMenu"><li>Menu' +
				'<ul>' +
				'<% _.each(menu, function(item) {' +
				'print("<li>" + item.label + "</li>");' +
				'}); %>' +
				'</ul>' +
			'</div>' +

			'<span class="latest-status <%= statusClass %>"><%= status %></span>' +
			'<br class="clear"/>' +
			'<span class="object-name"><%= objectName %></span><br/>' + 
			'<div class="<%= statusDetailsClass %>">' +
				'<span class="when"><%= when %></span>, ' +
				'<span class="user"><%= user %></span><br/>' +
                '<div class="<%= notesClass %>">' +
					'<% $.each(recentHistory, function(idx, item) {' +
					'print ("<div class=\'recent-note\'>");' +
					'print ("<div class=\'append-note\'></div>");' +
					'print (item.notes + "<br/><span>(" + item.user_name + ", " + item.datetime + ")</span>");' +
					'print ("<textarea class=\'note-to-append\'></textarea>");' +
					'print ("<input type=\'hidden\' class=\'event-id\' value=\'" + item.event_id + "\'/>");' +
					'print ("<div class=\'review-comments-buttons\'>");' +
					'print ("<a href=\'#\' class=\'review-cancel\'>Cancel</a>");' +
					'print ("<a href=\'#\' class=\'review-save\'>Save</a>");' +
					'print ("</div><br class=\'clear\'>");' +
					'print ("</div>");' +
					'}); %>' +
				'</div>' +
			'</div>' +
		'</div>' +
		''
	);

	app.templates.adminReviewEmpty = _.template(
		'<div id="review_<%= id %>" class="reviewBlock">' +
			'<div class="rightEdge">' +
				'<div class="reviewPopupPlaceholder"></div>' +
				'<ul class="reviewMenu"><li>Menu' +
				'<ul>' +
				'<% $.each(menu, function(idx, item) {' +
				'print("<li>" + item.label + "</li>");' +
				'}); %>' +
				'</ul>' +
			'</div>' +

		'</div>' +
		''
	);

	//=======================================================
	// Review Pane: popups
	//=======================================================
	app.templates.reviewOptionPopup = {
		fail: _.template(
	        '<div class="reviewPopupWrapper">' +
				reviewStatusHeaderCode +
			'   <div class="commonFailuresWrapper">' +
			'	    <span class="commonFailuresHeader"><span>Select reason for failure</span>'+
			'   		<ul class="commonFailures">' +
			'<% $.each(commonFailures, function(idx, item) { ' +
			'	print("<li>"+item+"</li>");' +
			'}); %>' +
			'			</ul>' +
			'		</span><br/>' +
			'   </div>' +
			'	<div class="reviewPopup review-fail">' +
			'		<div class="commentHeader">Comments</div>' +
			'		<textarea class="comments"><%= notes %></textarea>' +
			'		<div class="review-comments-buttons">' +
			'			<a href="#" class="review-cancel">Cancel</a>' +
			'			<a href="#" class="review-save">Save</a> ' +
			'		</div>' +
			'		<div class="errorMsg">A Failure status requires entry of an explanation.</div>' +
			'       <br class="clear"/>' +
			'	</div>' +
			'</div>'
		),

		pass: _.template(
			popupCode['pass']
		),
		
		history: _.template(
        '<div class="reviewPopupWrapper">' +
			reviewStatusHeaderCode +
		'	<div class="reviewPopup review-history">' +
        '	  <div class="hist-cols">' +
        '	    <div class="hist-status">Status</div>' +
        '	    <div class="hist-who">User</div>' +
        '	    <div class="hist-assigned">Assigned</div>' +
		'	    <div class="hist-date">Date</div><br class="clear"/>' +
		'	  </div>' +
		'	  <div class="history-list">' +
		'<% $.each(hist, function(idx, item) {' +
        '	print("<div class=\'hist-status " + item.statClass + "\'>"+item.status+"</div>");' +
        '	print("<div class=\'hist-who\'>"+item.user_name+"</div>");' +
        '	print("<div class=\'hist-assigned\'>"+item.assigned_to+"</div>");' +
		'	print("<div class=\'hist-date\'>"+item.date+"</div>");' +
        '	print("<div class=\'"+item.notesClass+"\'>"+item.notes+"</div>");' +
		'}); %>' +
		'	  </div>' +
		'	</div>' +
		'</div>'
		),
		
		assign: _.template(
	        '<div class="reviewPopupWrapper">' +
				reviewStatusHeaderCode +
			'   <div class="commonFailuresWrapper">' +
			'	    <span class="assignHeader"><span>Select a user to assign to</span>'+
			'   		<ul class="user-list">' +
			'<% $.each(userList, function(idx, item) { ' +
			'	print("<li>"+item+"</li>");' +
			'}); %>' +
			'			</ul>' +
			'		</span><br/>' +
			'   </div>' +
			'	<div class="reviewPopup review-assign">' +
			'		<div class="commentHeader">Comments</div>' +
			'		<textarea class="comments"><%= notes %></textarea>' +
			'		<div class="review-comments-buttons">' +
			'			<a href="#" class="review-cancel">Cancel</a>' +
			'			<a href="#" class="review-save">Save</a> ' +
			'		</div>' +
			'       <br class="clear"/>' +
			'	</div>' +
			'</div>'
		),

		note: _.template(
			popupCode['note']
		)
	};

	//=======================================================
	// Review Pane: Failed addition
	//=======================================================
	app.templates.reviewFailed = _.template(
		'<div class="commentHeader">Comments</div>' +
		'<textarea class="comments"></textarea>' +
		''
	);

	//=======================================================
	// Query history wrapper
	//=======================================================
	app.templates.queryReviewWrapper = _.template(
	    '<div class="queryReviewWrapper"><div class="positioner"><%= code %></div><div>'
	);
})();
