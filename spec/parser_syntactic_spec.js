describe("Program Syntactic testing of CruParser", function(){
	
	beforeAll(function() {
		const course = require('../course');

		const CruParser = require('../CruParser');
		this.analyzer = new CruParser();
		
		this.pEmptyRating = new POI("Café d'Albert", 48.857735, 2.394987, []);

	});
	
	xit("can read a name from a simulated input", function(){
		
		let input = ["name", "Café d'Albert"];
		expect(this.analyzer.name(input)).toBe("Café d'Albert");
		
	});


	xit("can read a lat lng coordinate from a simulated input", function(){
		
		let input = ["latlng", "48.866205;2.399279"];
		expect(this.analyzer.latlng(input)).toEqual({ lat: "48.866205" , lng: "2.399279" });
		
		
	});	

	xit("can read negative lat lng coordinates from a simulated input", function(){
		
		let input = ["latlng", "-48.866205;-2.399279"];
		expect(this.analyzer.latlng(input)).toEqual({ lat: "-48.866205" , lng: "-2.399279" });
		
	});	
	
	xit("can read several rankings for a POI from a simulated input", function(){
		// invalid ratings should not be added
		let input = ["note", "4", "note", "8"];
		this.analyzer.note(input, this.pEmptyRating);
		expect(this.pEmptyRating.ratings).toEqual([ "4" ]);
		
	});	

	xit("can create a complete poi from its string description", function() {

		let input = "START_POI\r\nname: Chez Gabin\r\nlatlng: 48.871794;2.379538\r\nnote: 3\r\nnote: 2\r\nEND_POI";
		this.analyzer.poi(input);
	});
	
	
});