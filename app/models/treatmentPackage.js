"use strict"

const mongoose = require("mongoose")
mongoose.Promise = global.Promise 
const Schema = mongoose.Schema

const treatmentPackageSchema = Schema({
    isDeleted: {
        type: Boolean,
        default: false
    },
    name: {
        type: String
    },
    relatedTreatment: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Treatments"
        }
    ],
    relatedTreatmentList: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TreatmentLists"
        }
    ],
    TCLSellingPrice: {
        type: Number
    },
    EightMileSellingPrice: {
        type: Number
    },
    NPTSellingPrice: {
        type: Number
    },
    LSHSellingPrice: {
        type: Number
    },
    MDYSellingPrice: {
        type: Number
    },
    KShoppingSellingPrice: {
        type: Number
    },
    SanChaungSellingPrice: {
        type: Number
    },
    ThingangyunSellingPrice: {
        type: Number
    },
    relatedBranch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branches"
    },
    status: {
        type: String,
        default: "Active",
        enum: [ "Active", "Deactivate" ]
    },
    expireAt: {
        type: Date,
        index: {
           expireAfterSeconds: 1
        }
    }
})

module.exports = new mongoose.model("TreatmentPackages",treatmentPackageSchema)