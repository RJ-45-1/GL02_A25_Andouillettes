var Engine = {
    running: false,
    check: function () {
        console.log("Engine Ready !")
        console.log("Cyan level checked".cyan)
        return true
    },
    start: function () {
        this.running = true
        console.log("Engine Started !")
    },
    stop: function () {
        this.running = false
        console.log("Engine Stopped !")
    }
}

module.exports = Engine