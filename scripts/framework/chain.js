//===========================================================================================
// AJAX Chaining Module (SJAX)
//
// chain fields:
//	preReq: Pre-requisite conditions to running this entry [verb, condition]
//	action: AJAX request code (must return a jXHR object)
//	fail: Called on AJAX failure
//	done: Called on AJAX success
//
// preReq verbs:
//	skipIf: Skip this step if the condition is true
//	skipUnless: Skip this step if the condition is false
//	abortIf: Abort this chain if the condition is true
//	abortUnless: Abort this chain if the condition is false
//
// Skipping and aborting don't call either the fail or done routine, so there is no notification
// of either.  This may need to change!
//
// If no FAIL routine is supplied and a step fails, the entire chain is aborted (without notice!)
//
// API:
//	startChain(chain)
//	abortChain() -- Immediately abort chain
//===========================================================================================
(function() {

	//=======================================================
	//=======================================================
	framework.prototype.startChain = function(chain)
	{
		var chainObj = {
			chain: chain,
			index: 0
		};

		doStep(chainObj);
		return chainObj;
	}

	//=======================================================
	//=======================================================
	framework.prototype.abortChain = function(chain)
	{
		chain.index = -10;	// We can't use -1, since an async operation will increment this.  -2 or lower is required.
	}

	//=======================================================
	// Handle one complete entry in a chain
	//=======================================================
	function doStep(chain)
	{
		// Only do the step if there is a valid step
		if (chain.index < 0 || chain.index >= chain.chain.length)
			return;

		var step = chain.chain[chain.index];

		var preAction = step.preReq && step.preReq[0] && doPreReq(step.preReq);
		if (preAction === 'abort')
		{
			fw.abortChain(chain);
			return;
		}
		else if (preAction === 'skip')
		{
			chain.index++;
			doStep(chain);	// I'm not a fan of unneccessary recursion, but this seems to be the easiest method
			return;
		}

		// The pre-requisite is complete.  Get on with the request
		if (step.action)
		{
			var jXHR = step.action();

			// Link to done and fail routines, if supplied
			jXHR && step.fail && jXHR.fail(step.fail);
			jXHR && jXHR.done(function(response){ajaxDone(chain, response)});
		}
	}

	//=======================================================
	// Handle a pre-requisite for a step
	//=======================================================
	function doPreReq(preReq)
	{
		switch (preReq[0])
		{
			case 'skipIf':
				if (preReq[1])
					return 'skip';
				break;

			case 'skipUnless':
				if (!preReq[1])
					return 'skip';
				break;

			case 'abortIf':
				if (preReq[1])
					return 'abort';
				break;

			case 'abortUnless':
				if (!preReq[1])
					return 'abort';
				break;
		}

		return false;	// The default -- don't skip or abort
	}

	//=======================================================
	// A request was successfully completed.  Move to the next one.
	//=======================================================
	function ajaxDone(chain, response)
	{
		// Call the done routine, if one was supplied
		var step = chain.chain[chain.index];
		step.done && step.done(response);

		// Move on to the next step
		chain.index++;
		doStep(chain);	// I'm not a fan of unneccessary recursion, but this seems to be the easiest method
	}

})();
