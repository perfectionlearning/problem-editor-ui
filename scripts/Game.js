//=======================================================
// Define top-level namespace object and its major interfaces
//=======================================================
if (typeof app === 'undefined')
	app = {};

app.Views = {};

app.Math = require('mathTools');	// These are used by the app and by libraries
app.xml = require('xml');
app.VTP = require('vtp');
app.Equiv = require('equiv');
app.Modal = require('Modal');

//=======================================================
// Add global constants to the top-level namespace
//=======================================================
app.ctr = 0;	// Global up-counter for unique IDs

// CORS, baby! Instead of dynamically determining the endpoint just use the live version.
// The dev server is no longer around, so there's only one endpoint anyway.
app.serverPath = 'http://denali.kineticbooks.com:8081/dagan/';

/*
if (window.location.href.indexOf('localhost') === -1)
{
    if (window.location.href.indexOf('ProblemEditDev') === -1)
        app.serverPath = '../dagan/';
    else
        app.serverPath = '../hw/';
}
else
	app.serverPath = '/devserver/dagan/';	// Release server
//	app.serverPath = '/pe_dev/dagan/';		// Dev server for testing
*/

app.commRoot = app.serverPath + 'index.php';

app.paths = {
	userStatus: '/users/status',
	login: '/users/login',
	logout: '/users/logout',
	userList: '/users',

	getLockState: '/locks/getlocks',
	lock: '/locks/lock',
	unlock: '/locks/unlock',

	bookList: '/books',
	wbList: '/whiteboards/in_chapter/',
	problemList: '/problems/filter/',

	query: '/info/status',
	problemQuery: '/problems/filter/in_chapter/',

	history: '/history/object_revisions/problem',
	changeStatus: '/reviews/change_status',

	tagTypes: "",

	tagList: "/tags",
	tagsByType: "/tags/type",
	tagsBySkill: "/topic_object_skills",
	tagsSearch: "/tags/search",

	standardTypes: "/standards/types",
	standardsType:  "/standards/type/",
	standardsByTag: "/standards/search"
}

app.reviewURL = "http://review.kineticbooks.com/hwg/reviewPageEditor.php?problem_id=";
app.bookLaunchUrl = "http://denali.kineticbooks.com:8081/books/fpp/code/Release/BookReview/project.html#obj=";

app.problemIdentifier = "PROBLEM";

app.AppTitle = "Problem Editor";

app.ReviewTool = location.search.indexOf('rev=1') != -1;

//==========================================================================
//==========================================================================

//=======================================================
// Called whenever the user navigates away from the app.
// Not called when switching routes/contexts within the app.
//=======================================================
function navAwayHandler(e)
{
	// Disable for Dagan. The prompt makes debugging more arduous.
	var curUser = (app.userState && app.userState.get('name'));
	if (curUser === 'dagang')
		return null;

	if (!fw.canChangeContext())
		return "Are you sure? You have unsaved data.";	// Doesn't show up in Firefox

	return null;
}

//=======================================================
// High level game manager
//=======================================================
$(function() {
	// Install global exception handler
//	window.onerror = app.exception;
	window.onbeforeunload = navAwayHandler;

	// Allow CORS
	$.ajaxSetup({
		xhrFields: {withCredentials: true},
		cache: true
	});

	//-----------------------
	// Contexts
	//-----------------------
	var contexts = {
		edit: app.Views.Edit,
		save: app.Views.Save,
		problemList: app.Views.ProblemList,
		objectList: app.Views.ObjectList,
		qcProblemSets: app.Views.QCProblemSets,		// "Find problems by chapter" query
		quickCheck: app.Views.QuickCheck,
		objectList: app.Views.ObjectList,
		login: app.Views.Login,
		history: app.Views.History,
		top: app.Views.TopPage,
		problemLocked: app.Views.ProblemLocked,
		myLocks: app.Views.MyLocks
	}

	//-----------------------
	// Routes
	//-----------------------
	var Router = Backbone.Router.extend({
		routes: {
			'login': 'login',
			'top': 'top',
			'problemSets/:chid': 'problemSetQuery',		// "Find problems by chapter" query
			'quickCheck/:qcid': 'quickCheckProblem',
			'problemList/:filter': 'probQuery',
			'objectList': 'objQuery',
			'edit/:pid': 'edit',
			'history/:pid': 'history',
			'create': 'create',
			'test': 'test',
			'*path': 'defaultRoute'
		},

		//-----------------------
		//-----------------------
		defaultRoute: function() {
			app.changeContext('login');
		},

		//-----------------------
		//-----------------------
		login: function() {
			app.changeContext('login');
		},

		//-----------------------
		//-----------------------
		history: function(pid) {
			app.curProbID = pid;
			app.changeContext('history');
		},

		//-----------------------
		//-----------------------
		top: function() {
			app.changeContext('top');
		},

		//-----------------------
		//-----------------------
		probQuery: function(filter) {
			app.queryID = filter;
			app.changeContext('problemList');
		},

		//-----------------------
		objQuery: function() {
			app.changeContext('objectList');
		},

		//-----------------------
		//-----------------------
		problemSetQuery: function(chid) {
			app.chapterProbList.set({id:chid});
			app.changeContext('qcProblemSets');
		},

		//-----------------------
		//-----------------------
		quickCheckProblem: function(qcid) {
			app.curProbID = qcid;
			app.changeContext('quickCheck');
		},

		//-----------------------
		//-----------------------
		edit: function(problemID) {
			// Need to specify the problem!
			app.curProbID = problemID;
			app.changeContext('edit');
		},

		//-----------------------
		//-----------------------
		create: function() {
			app.curProbID = undefined;
			app.changeContext('edit');
		},

		//-----------------------
		//-----------------------
		test: function() {
			jasmine.getEnv().addReporter(new jasmine.TrivialReporter());
			jasmine.getEnv().execute();
		}
	});

	//-----------------------
	// Start the app
	//-----------------------
	setHeaderFooter();

	var topContainer = $("#Editor");			// Ideally this is the only external dependency
	fw.contextInit(contexts, topContainer);		// context list, parent container, page to start on

	app.router = new Router();
	Backbone.history.start();

	//=======================================================
	//=======================================================
	function setHeaderFooter()
	{
		var head = new app.TitleBarView({el: '#header', model:app.curProblem});
		var foot = new app.InfoBarView({el: '#footer', model:app.curProblem});
		head.render();
		foot.render();
	}

	//=======================================================
	// Move this to somewhere else!
	//=======================================================
	app.ObjectTypes = {
		whiteboard: "Whiteboard",
		activity: "Activity",
		sectext: "Section text",
		qc: "Quick check",
		app: "Application problem",
		wb: "Normal whiteboard",
		actwb: "Activity whiteboard",
		sum: "Whiteboard summaries",
		jsact: "JavaScript activity",
		unityact: "Unity activity"
//		problem: "Problem"
	};

});
