'use strict';

const mongoose = require('mongoose');
mongoose.promise = global.Promise;
const Schema = mongoose.Schema;


let BlogSchema = new Schema({
  name: {
    type: String
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  relatedDescription:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Descriptions"
  }]
});

module.exports = mongoose.model('Blogs', BlogSchema);

//Author: Oakar Kyaw
