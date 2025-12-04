// course.js
var Course = function (name, slots) {
	this.name = name;
	this.slots = slots;
}

// Get all rooms used by this course
Course.prototype.getRooms = function () {
	return this.slots.map(function(slot) {
		return slot.room;
	});
}

// Get slots for a specific room
Course.prototype.getSlotsByRoom = function (room) {
	return this.slots.filter(function(slot) {
		return slot.room === room;
	});
}

var Slot = function (type, capacity, day, start, end, subgroup, room) {
	this.type = type;
	this.capacity = capacity;
	this.day = day;
	this.start = start;
	this.end = end;
	this.subgroup = subgroup;
	this.room = room;
}

// Convert time string "HH:MM" to minutes for comparison
Slot.prototype.getStartMinutes = function () {
	var parts = this.start.split(':');
	return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

Slot.prototype.getEndMinutes = function () {
	var parts = this.end.split(':');
	return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

// Check if two slots overlap (same day and time)
Slot.prototype.overlaps = function (otherSlot) {
	if (this.day !== otherSlot.day) {
		return false;
	}
	if (this.room !== otherSlot.room) {
		return false;
	}
	
	var thisStart = this.getStartMinutes();
	var thisEnd = this.getEndMinutes();
	var otherStart = otherSlot.getStartMinutes();
	var otherEnd = otherSlot.getEndMinutes();
	
	return !(thisEnd <= otherStart || otherEnd <= thisStart);
}

module.exports = {
	Course: Course,
	Slot: Slot
};