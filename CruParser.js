var { Course, Slot } = require('./course');

// for testing purposes
const fs = require('fs');
fs.readFile(('./data/AB/edt.cru'), 'utf8', function (err,data) {
            if (err) {
                return err;
            }
      
            var analyzer = new CruParser(true, true);
            analyzer.parse(data);
            
            if(analyzer.errorCount === 0){
                console.log("The .cru file is a valid cru file");
            }else{
                console.log("The .cru file contains error");
            }
            
            console.log(analyzer.parsedCourse);

        });


// CruParser

var CruParser = function(sTokenize, sParsedSymbols){
	// The list of course parsed from the input file.
	this.parsedCourse = [];
    this.symb = ["+","P=","H=","S=","//", "/"];
	this.showTokenize = sTokenize; // true to show the tokenized data
    this.showParsedSymbols = sParsedSymbols; // true to show parsed symbols during the parsing
	this.errorCount = 0;
}

// Parser procedure

// tokenize : tranform the data input into a list
CruParser.prototype.tokenize = function(data){
	var separator = /\/\/|\+|P=|H=|S=|[A-Za-z0-9:]+/g;
	data = data.match(separator);
	const tokens = []
	/* for (let i = 0; i < data.length; i++) {
		if (data[i] === "P=" || data[i] === "H=" || data[i] === "S=") continue; // retirer les P=, H=, S=
		tokens.push(data[i]);
	} */
	
	return tokens;
}




// parse
CruParser.prototype.parse = function(data){
// parse : analyze data by calling the first non terminal rule of the grammar
	var tData = this.tokenize(data);
	if(this.showTokenize){
		console.log(tData);
	}
	this.listCourse(tData);
}

// Parser operand

CruParser.prototype.errMsg = function(msg, input){
	this.errorCount++;
	console.log("Parsing Error ! on "+input+" -- msg : "+msg);
}

// Read and return a symbol from input
CruParser.prototype.next = function(input){
	var curS = input.shift();
	if(this.showParsedSymbols){
		console.log(curS);
	}
	return curS
}

// accept : verify if the arg s is part of the language symbols.
CruParser.prototype.accept = function(s){
	var idx = this.symb.indexOf(s);
	// index 0 exists
	if(idx === -1){
		this.errMsg("symbol "+s+" unknown", [" "]);
		return false;
	}

	return idx;
}



// check : check whether the arg elt is on the head of the list
CruParser.prototype.check = function(s, input){
	if(this.accept(input[0]) == this.accept(s)){
		return true;	
	}
	return false;
}

// expect : expect the next symbol to be s.
CruParser.prototype.expect = function(s, input){
	if(s == this.next(input)){
		//console.log("Reckognized! "+s)
		return true;
	}else{
		this.errMsg("symbol "+s+" doesn't match", input);
	}
	return false;
}


// Parser rules

// <liste_poi> = *(<poi>) "$$"
CruParser.prototype.listCourse = function(input){
	this.course(input);
	this.expect("$$", input);
}

// <poi> = "START_POI" <eol> <body> "END_POI"
CruParser.prototype.course = function(input){

	if(this.check("+", input)){
		this.expect("+", input);
		var args = this.body(input);
		var p = new Course(args.nm, args.sl);
		this.expect("//",input);
		this.parsedCourse.push(p);
		if(input.length > 0){
			this.course(input);
		}
		return true;
	}else{
		return false;
	}

}

// CoursData = "+" CodeCours CRLF Slot+
CruParser.prototype.body = function(input){
	var nm = this.name(input);
	var sl = this.slot(input);
	return { nm: nm, sl: sl };
}

// CodeCours = 3*8(ALPHA / DIGIT)
CruParser.prototype.name = function(input){
	this.expect("+",input);
	var curS = this.next(input);
	if(matched = curS.match(/[A-Za-z0-9]{3,8}/)){
		return matched[0];
	}else{
		this.errMsg("Invalid name", input);
	}
}

// Slot = Index "," Type ",P=" Capacite",H=" Jour SP HeureDeb "-" HeureFin",F" SousGrp",S="Salle "//" CRLF
CruParser.prototype.slot = function(input){
	this.expect("1",input); // slots start with 1
	var curS = this.next(input);
	if(matched = curS.match(/(-?\d+(\.\d+)?);(-?\d+(\.\d+)?)/)){ 
		return { lat: matched[1], lng: matched[3] };
	}else{
		this.errMsg("Invalid latlng", input);
	}
}

// <optional> = *(<note>)
// <note> = "note: " "0"/"1"/"2"/"3"/"4"/"5"
CruParser.prototype.note = function (input, curPoi){
	if(this.check("note", input)){
		this.expect("note", input);
		var curS = this.next(input);
		if(matched = curS.match(/[0-5]/)){
			curPoi.addRating(matched[0]);
			if(input.length > 0){
				this.note(input, curPoi);
			}
		}else{
			this.errMsg("Invalid note");
		}	
	}
}


module.exports = CruParser;