//=======================================================
// Interfaces for various user types
//=======================================================
;(function() {
	app.interfaces = {};

	//=======================================================
	// Interface Group Definitions
	//=======================================================
	app.interfaces.defaultIF = 'cms_authors';

	// Used to select the proper tabbed interface for a user with multiple groups
	app.interfaces.priorities = ['cms_authors', 'cms_reviewers', 'cms_vtp'];

	app.interfaces.groups = {
		cms_authors: {
			tabs: 'author',
			permissions: ['edit', 'stepmod', 'splitSteps']
		},

		cms_reviewers: {
			tabs: 'author',
			permissions: []
		},

		cms_vtp: {
			tabs: 'vtp',
			permissions: ['edit']
		}
	};

	//=======================================================
	// Author Tabbed Interface
	//=======================================================

	//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// If you add anything here, be sure to add it to CHANGES.JS
	// as well!
	//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

	app.interfaces.author = [
		{
			name: 'Main',
			items: [
				'Prefix', 'Question',
				'AnswerType', 'Answer', 'Equivalence',
				'MultiHint',
				'ChapterID',
				'Whiteboard',
				'Diff',
				'Skill',
//				'EquationID',
				'Comment'
			]
		},
		{
			name: 'Variables',
			items: ['Question', 'Answer', 'QVars', 'Constraint']
		},
		{
			name: 'Steps',
			items: ['Question', 'Step']
		},
		{
			name: 'Tags',
			items: ['Question', 'TagList', 'TagType', 'TagSkills', 'TagStandards', 'Standards']
		},
		{
			name: 'Images',
			items: ['VarExamples', 'QImage','QImageEdit']
		},

/* -- Not really used. We have too many tabs. Hide this one for now.
		{
			name: 'Scoring',
			items: ['Points', 'Repetitions']
		},
*/
		{
			name: 'Changes',
			items: ['Changes']
		},
		{
			name: 'Review',		// @FIXME/dg: Currently, this tab needs to be last or variables will be incorrectly set and correct answers will be ignored!
			items: ['VarExamples', 'QImage', 'ProblemTest']
		}
	];

	//=======================================================
	// VTP Tabbed Interface
	//=======================================================
	app.interfaces.vtp = [
		{
			name: 'VTP_Main',
			items: [
				'Prefix', 'Question',
				'AnswerType', 'Answer',
				'QVars', 'Constraint'
			]
		},
		{
			name: 'VTP_Steps',
			items: ['Question', 'Step']
		},
		{
			name: 'Images',
			items: ['QImage']
		},
		{
			name: 'Review',
			items: ['VarExamples', 'QImage', 'ProblemTest']
		}
	];

})();
