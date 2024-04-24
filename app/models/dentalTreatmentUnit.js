'use strict';

const mongoose = require('mongoose');
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;


let DentalTreatmentUnitSchema = new Schema({
  code: {
    type: String,
  },
  name: {
    type: String,
  },
  procedureMedicine: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'ProcedureMedicines' //array of objectIDss
  },
  machine: {
    type: [mongoose.Schema.Types.ObjectId], //array of objectIDs
  },
  estimateCost: {
    type: Number
  },
  sellingPrice: {
    type: Number,
  },
  description: {
    type: String,
  },
  updatedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    required: true,
    default: false
  },
  patientTreatmentID: {
    type: String,
  },
  seq: {
    type: Number,
    required: true,
  },
  relatedBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branches'
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
});

module.exports = mongoose.model('DentalTreatmentUnits', DentalTreatmentUnitSchema);

//Author: Kyaw Zaw Lwin
