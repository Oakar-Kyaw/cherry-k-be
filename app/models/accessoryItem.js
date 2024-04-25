'use strict';

const mongoose = require('mongoose');
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;
const validator = require('validator');


let AccessoryItem = new Schema({
  code: {
    type: String
  },
  accessoryItemName:{
    type:String,
  },
  name: {
    type:mongoose.Schema.Types.ObjectId,
    ref:'ProcedureAccessories'
  },
  currentQuantity: {
    type:Number,
    default : 0
  },
  reOrderQuantity: {
    type:Number,
    default : 0
  },
  purchasePrice: {
    type:Number,
    default : 0
  },
  sellingPrice: {
    type:Number,
    default : 0
  },
  description: {
    type:String,
  },
  fromUnit: {
    type:Number,
    default : 1
  },
  toUnit: {
    type:Number,
    default : 1
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
  totalUnit:{
    type:Number
  },
  relatedCategory: {
    type:mongoose.Schema.Types.ObjectId,
    ref:'Categories'
  },
  perUnitQuantity:{
    type:Number,
    default : 0
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

module.exports = mongoose.model('AccessoryItems', AccessoryItem);

//Author: Kyaw Zaw Lwin
