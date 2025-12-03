// course.js
var Course = function(name, slots){
	this.name = name;
	this.slots = slots;
}
	
var Slot = function(type, capacity, day, start, end, subgroup, room) {
    this.type = type;
    this.capacity = capacity;
    this.day = day;
    this.start = start;
    this.end = end;
    this.subgroup = subgroup;
    this.room = room;

};

module.exports.Course = Course;
module.exports.Slot = Slot;