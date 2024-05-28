'use strict';

const mongoose = require('mongoose');
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;


let DescriptionSchema = new Schema({
  isDeleted: {
    type: Boolean,
    default: false
  },
  title: {
    type: String
  },
  imageUrl: {
    type: String
  },
  description: {
    type: String
  },
  relatedName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Blogs"
  }
});

module.exports = mongoose.model('Descriptions', DescriptionSchema);

//Author: Oakar Kyaw
