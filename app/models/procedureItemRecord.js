"use strict"
 
const mongoose = require("mongoose")
mongoose.promise = global.Promise
const Schema = mongoose.Schema

const ProcedureItemRecordSchema = new Schema({
    procedureItems: [{
        item_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProcedureItems"
        },
        qty: {
            type: Number,
            default: 0
        },
        actual: {
            type: Number,
            default: 0
        }
    }],
    relatedBranch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branches"
    },
    reason: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    editTime: {
        type: String
      },
      editPerson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
      },
      editEmail: {
        type: String
      },
      location: {
        type: String
      },
      deleteTime: {
        type: String
      },
      deletePerson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
      },
      deleteEmail: {
        type: String
      },
})

module.exports = mongoose.model("ProcedureItemRecords",ProcedureItemRecordSchema)