//=======================================================
// Step maps are used to determine how steps match up
// in the Changes view. The difficulty is dealing with
// an unequal number of steps.
//=======================================================
describe("Step Map Creation", function() {

	//=======================================================
	//=======================================================
	describe("Equal Length", function() {

		//=======================================================
		//=======================================================
		it("should return an empty array when there are an equal number of steps", function() {
			var a = [0,1,2,3,4,5];
			var b = [0,1,2,3,4,5];
			var desired = [[0,0],[1,1],[2,2],[3,3],[4,4],[5,5]];
			var result = app.testStepMap(a, b);
			expect(app.objectCompare(result, [])).toBe(true);
			var mapped = app.testMapMassage(result, a.length, b.length);
			expect(app.objectCompare(desired, mapped)).toBe(true);

			var a = [{hi:true}, {bob: 3}];
			var b = [{hi:true}, {bob: 3}];
			var result = app.testStepMap(a, b);
			expect(app.objectCompare(result, [])).toBe(true);

			var a = [{hi:true}, {bob: 3}];
			var b = [{hi:true}];
			var result = app.testStepMap(a, b);
			expect(app.objectCompare(result, [])).toBe(false);
		});

	});

	//=======================================================
	//=======================================================
	describe("Current shorter than old", function() {

		//=======================================================
		//=======================================================
		it("should skip initial entries if they are missing", function() {
			var a = [3,4];		// _ _ 3 4
			var b = [1,2,3,4];	// 1 2 3 4
			var desired = [[-1,0],[-1,1],[0,2],[1,3]];
			var result = app.testStepMap(a, b);
			expect(app.objectCompare(result, [[2,0], [0,0]])).toBe(true);

			var mapped = app.testMapMassage(result, a.length, b.length);
			expect(app.objectCompare(desired, mapped)).toBe(true);
		});

		//=======================================================
		//=======================================================
		it("should skip multiple entries if they are missing", function() {
			var a = [3, 5];			// _ _ 3 _ 5 _
			var b = [1,2,3,4,5,6];	// 1 2 3 4 5 6
			var desired = [[-1,0],[-1,1],[0,2],[-1,3],[1,4],[-1,5]];
			var result = app.testStepMap(a, b);
			expect(app.objectCompare(result, [[2,0], [1,0]])).toBe(true);

			var mapped = app.testMapMassage(result, a.length, b.length);
			expect(app.objectCompare(desired, mapped)).toBe(true);
		});

		//=======================================================
		//=======================================================
		it("shouldn't reorder steps", function() {
			var a = [4,3];				// _ _ _ 4 3 _
			var b = [1,2,3,4,5,6];		// 1 2 3 4 5 6
			var desired = [[-1,0],[-1,1],[-1,2],[0,3],[1,4],[-1,5]];
			var result = app.testStepMap(a, b);
			expect(app.objectCompare(result, [[3,0],[0,0]])).toBe(true);

			var mapped = app.testMapMassage(result, a.length, b.length);
			expect(app.objectCompare(desired, mapped)).toBe(true);
		});

		//=======================================================
		//=======================================================
		it("shouldn't find a match if the difference in length is too small", function() {
			var a = [4,3];			// 4 _ 3 _
			var b = [1,2,3,4];		// 1 2 3 4
			var desired = [[0,0],[-1,1],[1,2],[-1,3]];
			var result = app.testStepMap(a, b);
			expect(app.objectCompare(result, [[0,0],[1,0]])).toBe(true);

			var mapped = app.testMapMassage(result, a.length, b.length);
			expect(app.objectCompare(desired, mapped)).toBe(true);
		});

		//=======================================================
		//=======================================================
		it("shouldn't get too wacky with identical steps", function() {
			var a = [3,3];			// _ _ 3 3
			var b = [1,2,3,4];		// 1 2 3 4
			var desired = [[-1,0],[-1,1],[0,2],[1,3]];
			var result = app.testStepMap(a, b);
			expect(app.objectCompare(result, [[2,0],[0,0]])).toBe(true);
			var mapped = app.testMapMassage(result, a.length, b.length);
			expect(app.objectCompare(desired, mapped)).toBe(true);

			var a = [4,4];			// 4 _ _ 4
			var b = [1,2,3,4];		// 1 2 3 4
			var desired = [[0,0],[-1,1],[-1,2],[1,3]];
			var result = app.testStepMap(a, b);
			expect(app.objectCompare(result, [[0,0],[2,0]])).toBe(true);
			var mapped = app.testMapMassage(result, a.length, b.length);
			expect(app.objectCompare(desired, mapped)).toBe(true);
		});

		//=======================================================
		//=======================================================
		it("should work with no current steps", function() {
			var a = [];			// _ _ _ _
			var b = [1,2,3,4];	// 1 2 3 4
			var desired = [[-1,0],[-1,1],[-1,2],[-1,3]];
			var result = app.testStepMap(a, b);
			expect(app.objectCompare(result, [])).toBe(true);

			var mapped = app.testMapMassage(result, a.length, b.length);
			expect(app.objectCompare(desired, mapped)).toBe(true);
		});

		//=======================================================
		//=======================================================
		it("should work when the first item is deleted", function() {
			var a = [2,3];		// _ 2 3
			var b = [1,2,3];	// 1 2 3
			var desired = [[-1,0],[0,1],[1,2]];
			var result = app.testStepMap(a, b);
			var mapped = app.testMapMassage(result, a.length, b.length);
			expect(app.objectCompare(desired, mapped)).toBe(true);
		});
	});

	//=======================================================
	//=======================================================
	describe("Old shorter than current", function() {

		//=======================================================
		//=======================================================
		it("should skip initial entries if they are missing", function() {
			var a = [3, 4];		// _ _ 3 4
			var b = [1,2,3,4];	// 1 2 3 4
			var desired = [[0, -1],[1, -1],[2, 0],[3, 1]];
			var result = app.testStepMap(b, a);
			expect(app.objectCompare(result, [[0,2], [0,0]])).toBe(true);

			var mapped = app.testMapMassage(result, b.length, a.length);
			expect(app.objectCompare(desired, mapped)).toBe(true);
		});

		//=======================================================
		//=======================================================
		it("should skip multiple entries if they are missing", function() {
			var a = [3, 5];			// _ _ 3 _ 5 _
			var b = [1,2,3,4,5,6];	// 1 2 3 4 5 6
			var desired = [[0,-1],[1,-1],[2,0],[3,-1],[4,1],[5,-1]];
			var result = app.testStepMap(b, a);
			expect(app.objectCompare(result, [[0,2], [0,1]])).toBe(true);

			var mapped = app.testMapMassage(result, b.length, a.length);
			expect(app.objectCompare(desired, mapped)).toBe(true);
		});

		//=======================================================
		//=======================================================
		it("shouldn't reorder steps", function() {
			var a = [4,3];				// _ _ _ 4 3 _
			var b = [1,2,3,4,5,6];		// 1 2 3 4 5 6
			var desired = [[0,-1],[1,-1],[2,-1],[3,0],[4,1],[5,-1]];
			var result = app.testStepMap(b, a);
			expect(app.objectCompare(result, [[0,3],[0,0]])).toBe(true);

			var mapped = app.testMapMassage(result, b.length, a.length);
			expect(app.objectCompare(desired, mapped)).toBe(true);
		});

		//=======================================================
		//=======================================================
		it("shouldn't find a match if the difference in length is too small", function() {
			var a = [4,3];			// 4 _ 3 _
			var b = [1,2,3,4];		// 1 2 3 4
			var desired = [[0,0],[1,-1],[2,1],[3,-1]];
			var result = app.testStepMap(b, a);
			expect(app.objectCompare(result, [[0,0],[0,1]])).toBe(true);

			var mapped = app.testMapMassage(result, b.length, a.length);
			expect(app.objectCompare(desired, mapped)).toBe(true);
		});

		//=======================================================
		//=======================================================
		it("shouldn't get too wacky with identical steps", function() {
			var a = [3,3];			// _ _ 3 3
			var b = [1,2,3,4];		// 1 2 3 4
			var desired = [[0,-1],[1,-1],[2,0],[3,1]];
			var result = app.testStepMap(b, a);
			expect(app.objectCompare(result, [[0,2],[0,0]])).toBe(true);
			var mapped = app.testMapMassage(result, b.length, a.length);
			expect(app.objectCompare(desired, mapped)).toBe(true);

			var a = [4,4];			// 4 _ _ 4
			var b = [1,2,3,4];		// 1 2 3 4
			var desired = [[0,0],[1,-1],[2,-1],[3,1]];
			var result = app.testStepMap(b, a);
			expect(app.objectCompare(result, [[0,0],[0,2]])).toBe(true);
			var mapped = app.testMapMassage(result, b.length, a.length);
			expect(app.objectCompare(desired, mapped)).toBe(true);
		});

		//=======================================================
		//=======================================================
		it("should work with no current steps", function() {
			var a = [];			// _ _ _ _
			var b = [1,2,3,4];	// 1 2 3 4
			var desired = [[0,-1],[1,-1],[2,-1],[3,-1]];
			var result = app.testStepMap(b, a);
			expect(app.objectCompare(result, [])).toBe(true);

			var mapped = app.testMapMassage(result, b.length, a.length);
			expect(app.objectCompare(desired, mapped)).toBe(true);
		});
	});

});