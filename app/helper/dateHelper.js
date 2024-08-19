"use strict"

const moment = require("moment-timezone")

exports.startDateEndDateHelper = (date) => {
    let startDate, endDate
    if(date.value == "substract"){
        console.log('substract', date.exact)
        endDate = new Date(date.exact).toISOString()
        startDate = moment.tz(endDate, "Asia/Yangon").subtract(1, "day").startOf("day").format()
    }
    else if(date.value == "add"){
        startDate = new Date(date.exact).toISOString()
        endDate = moment.tz(startDate, "Asia/Yangon").add(1, "day").startOf("day").format()
    }
    return { startDate: startDate, endDate: endDate}
}