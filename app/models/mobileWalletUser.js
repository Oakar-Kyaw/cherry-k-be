const mongoose = require("mongoose")
const { encryptPassword } = require("../lib/generalFunction")
mongoose.Promise = global.Promise 
const Schema = mongoose.Schema

const walletUserSchema = new Schema({
   // for mobile app account
   isDeleted: {
     type: Boolean,
     default: false
   },
   isAdmin: {
    type: Number,
    enum: [0,1],
    default:0
   },
   phone: {
    type: Number,
    required: true
   },
   email: {
     type: String,
     lowercase:true,
     unique: true
   },
   password: {
    type: String,
    required: [ true, "Password is required"],
   
  },
  total_Point: {
    type: Number,
    default: 0
  },
  token: {
    type: String
  },
  relatedPatient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patients"
  },
  relatedPontTier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PointTiers"
  },
  relatedCart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MobileCarts"
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  securityQuestion: {
    type: String,
    lowercase: true
  },
  securityQuestionAnswer: {
    type: String,
    lowercase: true
  }
  //end for mobile app account
})

walletUserSchema.pre("save", function(next){
  //check if password is presend and is modified
  if(this.password && this.isModified(this.password)) {
     this.password = encryptPassword(this.password)
  }
  next()
})

module.exports = mongoose.model("MobileWalletUsers",walletUserSchema)