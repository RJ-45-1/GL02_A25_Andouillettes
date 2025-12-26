// iCalendar helper functions for RFC 5545 format

// Convert day abbreviation to day index
function getDayIndex(dayAbbr) {
	var dayMap = {
		'L': 0,
		'MA': 1,
		'ME': 2,
		'J': 3,
		'V': 4,
		'S': 5
	};
	return dayMap[dayAbbr] !== undefined ? dayMap[dayAbbr] : -1;
}

// Get all dates that match a specific day of week within a date range
function getDatesForDay(dayAbbr, startDate, endDate) {
	var dates = [];
	var dayIndex = getDayIndex(dayAbbr);
	if (dayIndex === -1) return dates;
	
	var current = new Date(startDate);
	var end = new Date(endDate);
	
	while (current <= end) {
		var jsDay = current.getDay();
		var ourDay = jsDay === 0 ? 6 : jsDay - 1;
		
		if (ourDay === dayIndex) {
			dates.push(new Date(current));
		}
		
		current.setDate(current.getDate() + 1);
	}
	
	return dates;
}

// Format date/time for iCalendar
function formatICSDateTime(date, time) {
	var year = date.getFullYear();
	var month = String(date.getMonth() + 1).padStart(2, '0');
	var day = String(date.getDate()).padStart(2, '0');
	
	var timeParts = time.split(':');
	var hours = String(timeParts[0]).padStart(2, '0');
	var minutes = String(timeParts[1]).padStart(2, '0');
	var seconds = '00';
	
	return year + month + day + 'T' + hours + minutes + seconds + 'Z';
}

// Escape special characters in iCalendar text fields
function escapeICSText(text) {
	if (!text) return '';
	return text.replace(/\\/g, '\\\\')
		.replace(/,/g, '\\,')
		.replace(/;/g, '\\;')
		.replace(/\n/g, '\\n');
}

// Generate a unique UID for each event
function generateUID(courseName, slot, date) {
	var timestamp = date.getTime();
	var courseHash = 0;
	for (var i = 0; i < courseName.length; i++) {
		courseHash = ((courseHash << 5) - courseHash) + courseName.charCodeAt(i);
		courseHash = courseHash & courseHash;
	}
	var roomHash = slot.room ? slot.room.charCodeAt(0) : 0;
	var startHash = slot.start.charCodeAt(0);
	var uid = Math.abs(timestamp + courseHash + roomHash + startHash).toString();
	return uid;
}

module.exports = {
	getDayIndex: getDayIndex,
	getDatesForDay: getDatesForDay,
	formatICSDateTime: formatICSDateTime,
	escapeICSText: escapeICSText,
	generateUID: generateUID
};
