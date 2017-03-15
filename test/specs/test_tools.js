describe("UserTools", function() {

    //=========================
	// Interface Selection
    //=========================
	describe("Interface selection", function() {
		beforeEach(function() {
			app.interfaces.groups.test1a = {tabs:'test1b'};
			app.interfaces.groups.test2a = {tabs:'test2b'};
			app.interfaces.groups.test3a = {tabs:'test3b'};
			app.interfaces.groups.defaulttabs = {tabs:'default'};

			app.interfaces.defaultIF = 'defaulttabs';
			app.interfaces.priorities = ['test1a', 'test2a', 'test3a'];
		});

		it("should return a default interface if no group list is supplied", function() {
			var iface = app.selectInterface();
			expect(iface).toBe('default');
		});

		it("should return a default interface if an empty group list is supplied", function() {
			var iface = app.selectInterface([]);
			expect(iface).toBe('default');
		});

		it("should return a default interface if no recognized groups are supplied", function() {
			var iface = app.selectInterface(['spork','knife']);
			expect(iface).toBe('default');
		});

		it("should return the correct interface if a single group is supplied", function() {
			var iface = app.selectInterface(['test2a']);
			expect(iface).toBe('test2b');
		});

		it("should return the highest priority interface if multiple groups are supplied", function() {
			var iface = app.selectInterface(['test3a', 'test1a']);
			expect(iface).toBe('test1b');
		});
	});

});
