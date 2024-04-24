'use strict';

const mongoose = require('mongoose');
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;


let TreatmentListSchema = new Schema({
  code: {
    type: String,
  },
  name: {
    type: String,
  },
  bodyParts: {
    type:String,
    enum:['Face','Body','Body Injection'],
  },
  description: {
    type:String,
  },
  updatedAt: {
    type: Date
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

module.exports = mongoose.model('TreatmentLists', TreatmentListSchema);

//Author: Kyaw Zaw Lwin
