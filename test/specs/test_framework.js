describe("Framework", function() {

    //=========================
    // Top-level Framework
    //=========================
    it("should initialize itself to a global variable", function() {
		expect(fw).toBeDefined();
		expect(fw instanceof framework).toBeTruthy();
    });

    it("should allow modules to register themselves", function() {
		var f = new framework();
		spyOn(f, 'registerModule');
		f.registerModule("assets", {});

		expect(f.registerModule).toHaveBeenCalled();
    });

    it("should reset all modules when reset", function() {
        var f = new framework();
		var a = { r: function(){} };
		var b = { r: function(){} };

		var x = spyOn(a, 'r');	// spyOn before registering, so the spy is registered instead
		var y = spyOn(b, 'r');

		f.registerModule("a", {reset: a.r});
		f.registerModule("b", {reset: b.r});
		f.reset();

		expect(x.callCount).toBe(1);
		expect(y.callCount).toBe(1);
    });

    //=========================
	// AJAX Chaining
    //=========================
	describe("Chaining Module", function() {

		beforeEach(function() {
			app.act = [];

			app.funcs = {
				action: function(id){
					app.act.push(new jQuery.Deferred());
					return app.act[app.act.length-1];
				},
				fail: function(id){},
				done: function(id){}
			}

			app.testChainOfEvents = [
				{
					action: function(){
						return app.funcs.action(0)
					},
					fail: function(){app.funcs.fail(0)},
					done: function(response){app.funcs.done(0)}
				},
				{
					action: function(){
						var test = app.funcs.action(1);
						return test;
					}
				},
				{
					action: function(){return app.funcs.action(2)},
					fail: function(){app.funcs.fail(2)},
					done: function(){app.funcs.done(2)}
				}
			];
		});

		afterEach(function() {
			app.testChainOfEvents = [];
		});

		it("should perform a chain's action", function() {
			var spy = spyOn(app.funcs, 'action');
			fw.startChain(app.testChainOfEvents);

			expect(spy).toHaveBeenCalledWith(0);
			expect(spy.callCount).toBe(1);
		});

		it("should perform a chain's fail method if the action fails", function() {
			var spy = spyOn(app.funcs, 'fail');
			fw.startChain(app.testChainOfEvents);

			app.act[0].reject();
			expect(spy).toHaveBeenCalledWith(0);
			expect(spy.callCount).toBe(1);
		});

		it("should perform a chain's done method if the action is successful", function() {
			var spy = spyOn(app.funcs, 'done');
			fw.startChain(app.testChainOfEvents);

			app.act[0].resolve();
			expect(spy).toHaveBeenCalledWith(0);
			expect(spy.callCount).toBe(1);
		});

		it("should move on to the next step if an action is successful", function() {
			var spy = spyOn(app.funcs, 'action').andCallThrough();
			fw.startChain(app.testChainOfEvents);

			app.act[0].resolve();
			expect(spy.mostRecentCall.args[0]).toBe(1);
			expect(spy.callCount).toBe(2);
		});

		it("should move on to the next step if a skipIf condition is true", function() {
			var spy = spyOn(app.funcs, 'action').andCallThrough();

			app.testChainOfEvents[0].preReq = ['skipIf', true];
			fw.startChain(app.testChainOfEvents);

			expect(spy.mostRecentCall.args[0]).toBe(1);
			expect(spy.callCount).toBe(1);
			delete app.testChainOfEvents[0].preReq;
		});

		it("should move on to the next step if a skipUnless condition is false", function() {
			var spy = spyOn(app.funcs, 'action').andCallThrough();

			app.testChainOfEvents[0].preReq = ['skipUnless', false];
			fw.startChain(app.testChainOfEvents);

			expect(spy.mostRecentCall.args[0]).toBe(1);
			expect(spy.callCount).toBe(1);
			delete app.testChainOfEvents[0].preReq;
		});

		it("should abort if an abortIf condition is true", function() {
			var spy = spyOn(app.funcs, 'action').andCallThrough();

			app.testChainOfEvents[0].preReq = ['abortIf', true];
			fw.startChain(app.testChainOfEvents);

			expect(spy.callCount).toBe(0);
			delete app.testChainOfEvents[0].preReq;
		});

		it("should abort if an abortUnless condition is false", function() {
			var spy = spyOn(app.funcs, 'action').andCallThrough();

			app.testChainOfEvents[0].preReq = ['abortUnless', false];
			fw.startChain(app.testChainOfEvents);

			expect(spy.callCount).toBe(0);
			delete app.testChainOfEvents[0].preReq;
		});

		it("should pass the server response to the done function on success", function() {
			var spy = spyOn(app.testChainOfEvents[0], 'done');
			fw.startChain(app.testChainOfEvents);

			app.act[0].resolve('testy');
			expect(spy).toHaveBeenCalledWith('testy');
			expect(spy.callCount).toBe(1);
		});

		it("should abort if a step fails", function() {
			var spy = spyOn(app.funcs, 'action').andCallThrough();
			fw.startChain(app.testChainOfEvents);

			app.act[0].reject();
			expect(spy.callCount).toBe(1);	// First action was called, second wasn't
		});
	});

});
