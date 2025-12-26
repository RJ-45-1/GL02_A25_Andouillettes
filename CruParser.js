var { Course, Slot } = require('./course');
var iCalendar = require('./iCalendar.js');

// CruParser

var CruParser = function (sTokenize, sParsedSymbols) {
	this.parsedCourse = [];
	this.symb = ["+", "//"];
	this.showTokenize = sTokenize;
	this.showParsedSymbols = sParsedSymbols;
	this.errorCount = 0;
}

// Parser procedure

// tokenize : tranform the data input into a list of tokens
// Returns an array of tokens extracted from the CRU file
CruParser.prototype.tokenize = function (data) {
	var allLines = data.split(/\r?\n/);
	var tokens = [];

	for (var i = 0; i < allLines.length; i++) {
		var line = allLines[i].trim();
		if (line.length === 0) {
			continue;
		}

		if (line.startsWith('+')) {
			var courseName = line.substring(1);
			if (courseName === 'UVUV') {
				continue;
			}
			tokens.push({
				type: 'COURSE',
				value: courseName,
				raw: line
			});
		} else if (/^\d/.test(line)) {
			var slotDataArray = this.parseSlotLine(line);
			if (slotDataArray) {
				for (var j = 0; j < slotDataArray.length; j++) {
					tokens.push({
						type: 'SLOT',
						data: slotDataArray[j],
						raw: line
					});
				}
			}
		}
	}

	return tokens;
}

// Helper function to parse a single slot line
// Handles both regular slots and linked sessions (séances liées) with multiple time/room combinations
CruParser.prototype.parseSlotLine = function (line) {
	var response = [];

	// Pattern: Index,Type,P=Capacite,H=Jour HeureDeb-HeureFin,FSousGrp,S=Salle//
	var basePattern = /^(\d+),([A-Za-z0-9]{2,3}),P=(\d{1,3}),H=([A-Za-z]{1,2})\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2}),F(\d+),S=([A-Za-z0-9]*)\/\/\s*$/;
	var baseMatch = line.match(basePattern);
	
	if (baseMatch) {
		if (this.isValidTime(baseMatch[5]) && this.isValidTime(baseMatch[6])) {
			response.push({
				index: baseMatch[1],
				type: baseMatch[2],
				capacity: parseInt(baseMatch[3]),
				day: baseMatch[4],
				startTime: baseMatch[5],
				endTime: baseMatch[6],
				subgroup: baseMatch[7],
				room: baseMatch[8] || null
			});
		} else {
			return null;
		}
	}
	
	var firstSessionPattern = /H=([A-Za-z]{1,2})\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2}),F([A-Za-z0-9]+),S=([A-Za-z0-9]*)(?:\/|$)/;
	var firstMatch = line.match(firstSessionPattern);

	var hasLinkedSessionsSeparator = firstMatch && /,S=[A-Za-z0-9]*\/[^/]/.test(line);
	
	if (firstMatch && hasLinkedSessionsSeparator) {
		var addPattern = /^(\d+),([A-Za-z0-9]{2,3}),P=(\d{1,3})/;
		var addMatch = line.match(addPattern);
		
		if (addMatch) {
			var day = firstMatch[1];
			var startTime = firstMatch[2];
			var endTime = firstMatch[3];
			var subgroup = firstMatch[4];
			var room = firstMatch[5] || null;
			
			if (this.isValidTime(startTime) && this.isValidTime(endTime)) {
				response.push({
					index: addMatch[1],
					type: addMatch[2],
					capacity: parseInt(addMatch[3]),
					day: day,
					startTime: startTime,
					endTime: endTime,
					subgroup: subgroup,
					room: room
				});
			}
		}
	}

	// Extract additional linked sessions (after /)
	// Pattern: /Day HH:MM-HH:MM,F<digit>,S=Room
	var linkedPattern = /\/([A-Za-z]{1,2})\s+(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2}),F([A-Za-z0-9]+),S=([A-Za-z0-9]*)(?:\/|$)/g;
	var match;

	while ((match = linkedPattern.exec(line)) !== null) {
		var linkedDay = match[1];
		var startHour = match[2];
		var startMin = match[3];
		var endHour = match[4];
		var endMin = match[5];
		var linkedSubgroup = match[6];
		var linkedRoom = match[7] || null;
		
		var linkedStartTime = startHour + ':' + startMin;
		var linkedEndTime = endHour + ':' + endMin;
		
		if (this.isValidTime(linkedStartTime) && this.isValidTime(linkedEndTime)) {
			response.push({
				index: response[0].index,
				type: response[0].type,
				capacity: response[0].capacity,
				day: linkedDay,
				startTime: linkedStartTime,
				endTime: linkedEndTime,
				subgroup: linkedSubgroup,
				room: linkedRoom
			});
		}
	}
	
	return response.length > 0 ? response : null;
}

// Helper function to validate time format HH:MM
CruParser.prototype.isValidTime = function (timeStr) {
	if (!timeStr || timeStr.indexOf(':') === -1) {
		return false;
	}
	var parts = timeStr.split(':');
	if (parts.length !== 2) {
		return false;
	}
	var hours = parseInt(parts[0]);
	var minutes = parseInt(parts[1]);
	return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60;
}

// parse : analyze data by calling the first non terminal rule of the grammar
CruParser.prototype.parse = function (data) {
	var tData = this.tokenize(data);
	if (this.showTokenize) {
		console.table(tData.map(function(token) {
			if (token.type === 'COURSE') {
				return {
					Type: token.type,
					Course: token.value,
					Raw: token.raw
				};
			} else {
				return {
					Type: token.type,
					SlotType: token.data.type,
					Day: token.data.day,
					StartTime: token.data.startTime,
					EndTime: token.data.endTime,
					Capacity: token.data.capacity,
					Room: token.data.room,
					Raw: token.raw
				};
			}
		}));
	}
	this.listCourse(tData);
}

// Parser operand

CruParser.prototype.errMsg = function (msg, input) {
	this.errorCount++;
	console.log("Parsing Error ! on " + input + " -- msg : " + msg);
}

// Read and return a symbol from input
CruParser.prototype.next = function (input) {
	var curS = input.shift();
	if (this.showParsedSymbols) {
		console.log(curS);
	}
	return curS;
}

// accept : verify if the arg s is part of the language symbols.
CruParser.prototype.accept = function (s) {
	var idx = this.symb.indexOf(s);
	// index 0 exists
	if (idx === -1) {
		this.errMsg("symbol " + s + " unknown", [" "]);
		return false;
	}

	return idx;
}

// check : check whether the arg elt is on the head of the list
CruParser.prototype.check = function (s, input) {
	if (input.length > 0 && input[0].type === 'COURSE' && s === "+") {
		return true;
	}
	if (input.length > 0 && input[0].type === 'SLOT' && s === "//") {
		return true;
	}
	return false;
}

// expect : expect the next symbol to be s.
CruParser.prototype.expect = function (s, input) {
	var curToken = this.next(input);
	if (s === "+" && curToken.type === 'COURSE') {
		return true;
	}
	if (s === "//" && curToken.type === 'SLOT') {
		return true;
	}
	if (s === "$$" && input.length === 0) {
		return true;
	}
	this.errMsg("symbol " + s + " doesn't match", curToken);
	return false;
}


// Parser rules

// Emploi = 1*CoursData
CruParser.prototype.listCourse = function (input) {
	this.course(input);
	// No end-of-file marker, just parse all courses
}

// CoursData = "+" CodeCours CRLF Slot+
CruParser.prototype.course = function (input) {

	if (this.check("+", input)) {
		var courseToken = this.next(input);
		var codeCours = courseToken.value;
		
		// Parse slots for this course
		var slots = this.slots(input);
		if (slots.length === 0) {
			this.errMsg("No slots found for course", codeCours);
			return false;
		}

		var p = new Course(codeCours, slots);
		this.parsedCourse.push(p);
		
		if (input.length > 0) {
			this.course(input);
		}
		return true;
	} else {
		return false;
	}
}

// Slot+ = one or more slot lines
CruParser.prototype.slots = function (input) {
	var slots = [];

	while (input.length > 0 && input[0].type === 'SLOT') {
		if (this.check("//", input)) {
			var s = this.slot(input);
			if (s) {
				slots.push(s);
			} else {
				break;
			}
		} else {
			break;
		}
	}

	return slots;
}

// Slot = Index "," Type ",P=" Capacite",H=" Jour SP HeureDeb "-" HeureFin",F" SousGrp",S="Salle "//" CRLF
CruParser.prototype.slot = function (input) {
	if (input.length === 0 || input[0].type !== 'SLOT') {
		return null;
	}

	var slotToken = this.next(input);
	var data = slotToken.data;

	// Validate values according to ABNF rules
	if (!this.validateDay(data.day)) {
		this.errMsg("Invalid day: " + data.day, slotToken.raw);
		return null;
	}

	if (!this.validateType(data.type)) {
		this.errMsg("Invalid type: " + data.type, slotToken.raw);
		return null;
	}

	if (data.capacity < 0 || data.capacity > 999) {
		this.errMsg("Invalid capacity: " + data.capacity, slotToken.raw);
		return null;
	}

	var slotObj = new Slot(data.type, data.capacity, data.day, data.startTime, data.endTime, data.subgroup, data.room);
	return slotObj;
}

// Validate Jour = ("L" / "MA" / "ME" / "J" / "V" / "S")
// L is also accepted as Lundi abbreviation
CruParser.prototype.validateDay = function (day) {
	return /^(L|MA|ME|J|V|S)$/.test(day);
}

// Validate Type = ("C??" / "T??" / "D?" / "D??" / "1*3ALPHA")
CruParser.prototype.validateType = function (type) {
	return /^(C[A-Za-z0-9]{1,2}|T[A-Za-z0-9]{1,2}|D[A-Za-z0-9]{1,2}|[A-Za-z0-9]{2,3})$/.test(type);
}

// ===== Data Analysis Methods =====

// Get all unique rooms in the schedule
CruParser.prototype.getAllRooms = function () {
	var rooms = [];
	for (var i = 0; i < this.parsedCourse.length; i++) {
		var courseRooms = this.parsedCourse[i].getRooms();
		for (var j = 0; j < courseRooms.length; j++) {
			if (rooms.indexOf(courseRooms[j]) === -1) {
				rooms.push(courseRooms[j]);
			}
		}
	}
	return rooms.sort();
}

// Get slots for a specific course
CruParser.prototype.getCourseSlotsInfo = function (courseName) {
	for (var i = 0; i < this.parsedCourse.length; i++) {
		if (this.parsedCourse[i].name === courseName) {
			return this.parsedCourse[i].slots;
		}
	}
	return null;
}

// Get all rooms for a specific course
CruParser.prototype.getCourseRooms = function (courseName) {
	for (var i = 0; i < this.parsedCourse.length; i++) {
		if (this.parsedCourse[i].name === courseName) {
			return this.parsedCourse[i].getRooms();
		}
	}
	return null;
}

// Get maximum capacity for a room
CruParser.prototype.getRoomMaxCapacity = function (room) {
	var maxCapacity = 0;
	for (var i = 0; i < this.parsedCourse.length; i++) {
		var slots = this.parsedCourse[i].slots;
		for (var j = 0; j < slots.length; j++) {
			if (slots[j].room === room && slots[j].capacity > maxCapacity) {
				maxCapacity = slots[j].capacity;
			}
		}
	}
	return maxCapacity;
}

// Get all slots in a specific room
CruParser.prototype.getRoomSlots = function (room) {
	var slots = [];
	for (var i = 0; i < this.parsedCourse.length; i++) {
		var courseSlots = this.parsedCourse[i].slots;
		for (var j = 0; j < courseSlots.length; j++) {
			if (courseSlots[j].room === room) {
				slots.push({
					course: this.parsedCourse[i].name,
					slot: courseSlots[j]
				});
			}
		}
	}
	return slots;
}

// Detect conflicts - overlapping slots in the same room
CruParser.prototype.detectConflicts = function () {
	var conflicts = [];
	var allRooms = this.getAllRooms();
	
	for (var r = 0; r < allRooms.length; r++) {
		var room = allRooms[r];
		var roomSlots = this.getRoomSlots(room);
		
		// Check for overlaps
		for (var i = 0; i < roomSlots.length; i++) {
			for (var j = i + 1; j < roomSlots.length; j++) {
				if (roomSlots[i].slot.overlaps(roomSlots[j].slot)) {
					conflicts.push({
						room: room,
						course1: roomSlots[i].course,
						course2: roomSlots[j].course,
						slot1: roomSlots[i].slot,
						slot2: roomSlots[j].slot
					});
				}
			}
		}
	}
	
	return conflicts;
}

// Get occupancy statistics
CruParser.prototype.getOccupancyStats = function () {
	var allRooms = this.getAllRooms();
	var stats = [];
	
	for (var i = 0; i < allRooms.length; i++) {
		var room = allRooms[i];
		var maxCapacity = this.getRoomMaxCapacity(room);
		var roomSlots = this.getRoomSlots(room);
		var totalSlots = roomSlots.length;
		
		// Calculate total student capacity across all courses in this room
		var totalStudentCapacity = 0;
		for (var j = 0; j < roomSlots.length; j++) {
			totalStudentCapacity += roomSlots[j].slot.capacity;
		}
		
		// Occupancy rate: (total student capacity) / (max room capacity * number of slots) * 100
		// This shows what percentage of the room's total available capacity is being used
		var occupancyRate = 0;
		if (maxCapacity > 0 && totalSlots > 0) {
			occupancyRate = ((totalStudentCapacity / (maxCapacity * totalSlots)) * 100).toFixed(2);
		}
		
		stats.push({
			room: room,
			maxCapacity: maxCapacity,
			totalSlots: totalSlots,
			totalStudentCapacity: totalStudentCapacity,
			occupancyRate: occupancyRate
		});
	}
	
	return stats.sort(function(a, b) {
		return b.maxCapacity - a.maxCapacity;
	});
}

CruParser.prototype.exportToICS = function (startDateStr, endDateStr) {
	var startDate = new Date(startDateStr);
	var endDate = new Date(endDateStr);
	
	var ics = 'BEGIN:VCALENDAR\r\n';
	ics += 'VERSION:2.0\r\n';

	var eventCount = 0;
	
	for (var i = 0; i < this.parsedCourse.length; i++) {
		var course = this.parsedCourse[i];
		
		for (var j = 0; j < course.slots.length; j++) {
			var slot = course.slots[j];

			var datesForDay = iCalendar.getDatesForDay(slot.day, startDate, endDate);
			
			for (var k = 0; k < datesForDay.length; k++) {
				var eventDate = datesForDay[k];
				
				ics += 'BEGIN:VEVENT\r\n';
				ics += 'UID:' + iCalendar.generateUID(course.name, slot, eventDate) + '\r\n';
				ics += 'DTSTAMP:' + iCalendar.formatICSDateTime(new Date(), '00:00') + '\r\n';
				ics += 'DTSTART:' + iCalendar.formatICSDateTime(eventDate, slot.start) + '\r\n';
				ics += 'DTEND:' + iCalendar.formatICSDateTime(eventDate, slot.end) + '\r\n';
				ics += 'SUMMARY:' + iCalendar.escapeICSText(course.name) + ' (' + iCalendar.escapeICSText(slot.type) + ')\r\n';
				
				if (slot.room) {
					ics += 'LOCATION:' + iCalendar.escapeICSText(slot.room) + '\r\n';
				}
				
				ics += 'END:VEVENT\r\n';
				eventCount++;
			}
		}
	}

	if (eventCount === 0) {
		ics += 'BEGIN:VEVENT\r\n';
		ics += 'UID:empty-event\r\n';
		ics += 'DTSTAMP:' + iCalendar.formatICSDateTime(new Date(), '00:00') + '\r\n';
		ics += 'DTSTART:' + iCalendar.formatICSDateTime(new Date(), '00:00') + '\r\n';
		ics += 'DTEND:' + iCalendar.formatICSDateTime(new Date(), '00:00') + '\r\n';
		ics += 'SUMMARY:No events available\r\n';
		ics += 'END:VEVENT\r\n';
	}
	
	return ics += 'END:VCALENDAR\r\n';
}

module.exports = CruParser;
