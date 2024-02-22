'use strict';

const mongoose = require('mongoose');
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;
const validator = require('validator');


let MedicineItemSchema = new Schema({
  code: {
    type: String
  },
  medicineItemName: {
    type: String
  },
  name: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicineLists'
  },
  currentQuantity: {
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
    default: 1
  },
  toUnit: {
    type: Number,
    default: 1
  },
  totalUnit: {
    type: Number
  },
  updatedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  reOrderQuantity: {
    type: Number,
    default : 0
  },
  perUnitQuantity: {
    type: Number,
    default : 0
  },
  relatedBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branches'
  },
  unit:{
    type:String
  },
  TCLSellingPrice: {
    type: Number,
    default : 0
  }
});

module.exports = mongoose.model('MedicineItems', MedicineItemSchema);

//Author: Kyaw Zaw Lwin
