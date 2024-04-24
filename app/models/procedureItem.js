'use strict';

const mongoose = require('mongoose');
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;
const validator = require('validator');


let procedureItemSchema = new Schema({
  code: {
    type: String
  },
  procedureItemName: {
    type: String,
  },
  name: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProcedureMedicines'
  },
  currentQuantity: {
    type: Number,
    default : 0
  },
  reOrderQuantity: {
    type: Number,
    default : 0
  },
  purchasePrice: {
    type: Number,
    default : 0
  },
  sellingPrice: {
    type: Number,
    default : 0
  },
  description: {
    type: String,
  },
  fromUnit: {
    type: Number,
    default : 1
  },
  toUnit: {
    type: Number,
    default : 1
  },
  updatedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  totalUnit: {
    type: Number
  },
  perUnitQuantity: {
    type: Number,
    default : 0
  },
  relatedBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branches'
  },
  unit: {
    type: String
  },
  TCLSellingPrice: {
    type: Number,
    default : 0
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

module.exports = mongoose.model('ProcedureItems', procedureItemSchema);

//Author: Kyaw Zaw Lwin
