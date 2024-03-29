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
});

module.exports = mongoose.model('DentalTreatmentHistories', DentalTreatmentHistorySchema);

//Author: Kyaw Zaw Lwin
