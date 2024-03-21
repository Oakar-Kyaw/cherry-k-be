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
    description: {
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
    TCLEstimateTotalPrice: {
        type: Number
    },
    SOKSellingPrice: {
        type: Number
    },
    SOKEstimateTotalPrice: {
        type: Number
    },
    TGISellingPrice: {
        type: Number
    },
    TGIEstimateTotalPrice: {
        type: Number
    },
    EightMileSellingPrice: {
        type: Number
    },
    EightMileEstimateTotalPrice: {
        type: Number
    },
    NPTSellingPrice: {
        type: Number
    },
    NPTEstimateTotalPrice: {
        type: Number
    },
    LSHSellingPrice: {
        type: Number
    },
    LSHEstimateTotalPrice: {
        type: Number
    },
    MDYSellingPrice: {
        type: Number
    },
    MDYEstimateTotalPrice: {
        type: Number
    },
    KShoppingSellingPrice: {
        type: Number
    },
    KShoppingEstimateTotalPrice: {
        type: Number
    },
    SanChaungSellingPrice: {
        type: Number
    },
    SanChaungEstimateTotalPrice: {
        type: Number
    },
    ThingangyunSellingPrice: {
        type: Number
    },
    ThingangyunEstimateTotalPrice: {
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