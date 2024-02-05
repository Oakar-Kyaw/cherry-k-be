const mongoose = require("mongoose")
mongoose.promise = global.Promise
const Schema = mongoose.Schema
const validator = require('validator');

let mobileBookingSchema = new Schema({
    relatedBranch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branches"
    },
    service: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Treatments"
    }],
    isDeleted: {
        type: Boolean,
        default: false
    },
    name: {
        type: String
    },
    phone: {
        type: Number
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            isAsync: true,
            validator: validator.isEmail,
            message: "Invalid Email Address."
        }
    },
    serviceProvider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctors"
    },
    description: {
        type: String,
    },
    date: {
        type: Date,
    },
    time: {
        type: String
    },
    relatedPatient: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Patients"
    },
    relatedCart: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"MobileCarts"
    },
    createdAt: {
        type:Date,
        default: Date.now
    }
})

module.exports = mongoose.model( "MobileBookings", mobileBookingSchema)