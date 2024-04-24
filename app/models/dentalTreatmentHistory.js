'use strict';

const mongoose = require('mongoose');
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;


let DentalTreatmentHistorySchema = new Schema({
  relatedAppointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref:'Appointments',
  },
  diagnosis: {
    type: String,
  },
  doctorRemark: {
    type:String
  },
  attachments: {
    type: [mongoose.Schema.Types.ObjectId],
    ref:'Attachments'
  },
  isDeleted: {
    type:Boolean,
    required:true,
    default:false
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

module.exports = mongoose.model('DentalTreatmentHistories', DentalTreatmentHistorySchema);

//Author: Kyaw Zaw Lwin
