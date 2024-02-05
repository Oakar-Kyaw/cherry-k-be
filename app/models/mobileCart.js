const mongoose = require("mongoose")
mongoose.promise = global.Promise
const Schema = mongoose.Schema

let mobileCartSchema = new Schema({
    treatment: [{
        treatment_id : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Treatments"
       },
       deductPoint: {
        type: Number
       },
       date: {
        type: Date
       },
       totalAmount: {
         type: Number
       }
    }
    ],
    isDeleted: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
    },
    createdAt: {
        type:Date,
        default: Date.now
    }
})

module.exports = mongoose.model("MobileCarts",mobileCartSchema)