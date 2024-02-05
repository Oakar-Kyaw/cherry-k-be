const mongoose = require("mongoose")
mongoose.Promise = global.Promise 
const Schema = mongoose.Schema

const pointSchema = new Schema({
    tierLevel: {
        type: String,
        enum: [ 'Bronze', 'Silver', 'Gold', 'Platinum',"VIP"]
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    totalPoint: {
        type: Number
    }

})

const pointtier =  new mongoose.model("PointTiers",pointSchema)
module.exports  = pointtier