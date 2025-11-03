var Engine = {
    running: false,
    check: function () {
        console.log("Magenta level checked".magenta)
        console.log("Engine Ready !")
        console.log("Blue level checked".blue)
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
