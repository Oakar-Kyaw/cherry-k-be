'use strict';

const mongoose = require('mongoose');
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;
const validator = require('validator');


let GeneralItem = new Schema({
  code: {
    type: String
  },
  generalItemName:{
    type:String,
  },
  name: {
    type:mongoose.Schema.Types.ObjectId,
    ref:'GeneralUnits'
  },
  currentQuantity: {
    type:Number,
    default: 0
  },
  reOrderQuantity: {
    type:Number,
    default:0
  },
  purchasePrice: {
    type:Number,
    default: 0
  },
  sellingPrice: {
    type:Number,
    default: 0
  },
  description: {
    type:String,
  },
  fromUnit: {
    type:Number,
    default: 1
  },
  toUnit: {
    type:Number,
    default: 1
  },
  totalUnit: {
    type:Number
  },
  updatedAt: {
    type: Date
  },
  isDeleted: {
    type:Boolean,
    default:false
  },
  relatedCategory: {
    type:mongoose.Schema.Types.ObjectId,
    ref:'Categories'
  },
  perUnitQuantity:{
    type:Number
  },
  relatedBrand: {
    type:mongoose.Schema.Types.ObjectId,
    ref:'Brands'
  },
  relatedSubCategory: {
    type:mongoose.Schema.Types.ObjectId,
    ref:'SubCategories'
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

module.exports = mongoose.model('GeneralItems', GeneralItem);

//Author: Kyaw Zaw Lwin
