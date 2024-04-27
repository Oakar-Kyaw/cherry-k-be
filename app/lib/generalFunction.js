const bcrypt = require("bcryptjs")
const CONFIG = require('../../config/db');
const jwt = require('jsonwebtoken');
const treatmentPackage = require("../models/treatmentPackage");
const accountingList = require("../models/accountingList");
require('dotenv').config()

exports.encryptPassword = async (givenPassword) => {
    let salt = process.env.SALT_KEY
    
    let saltRound = parseInt(process.env.SALT_ROUND)
    let bcryptHash = await bcrypt.hash( givenPassword, saltRound )
    return bcryptHash
}

//compare password
exports.comparePassword = async (givenPassword, hashedPassword) => {
    const equalPassword = await bcrypt.compare(givenPassword,hashedPassword)
    if(equalPassword){
        return true
    }
    else {
      return false
    }
}

//generate token
exports.generateTokens =  (user) => {
   console.log("generate token")
   var token = jwt.sign(
      { credentials: `${user._id}.${CONFIG.jwtKey}.${user.phone}` },
      CONFIG.jwtSecret,
      { expiresIn: CONFIG.defaultPasswordExpire },
    );
   
   return token;
}

//issue to clinic loop 
exports.loopIssue = ( array,fn ) => {
   for (const e of array) {
      fn(e)
   }
}

// loop through treatement for mobile
exports.loopThroughTreatment = (treatmentList) => {
    let response = []
    treatmentList.map(treatment => {
        let data = {
           id: treatment._id,
           name: treatment.name || "none",
           sellingPrice: treatment.sellingPrice || "none",
           description: treatment.description || "none",
           title: treatment.treatmentName && treatment.treatmentName.name ? treatment.treatmentName.name : "none",
           categories: treatment.treatmentName && treatment.treatmentName.bodyParts  ? treatment.treatmentName.bodyParts :"none" , 
           doctor: treatment.relatedDoctor && treatment.relatedDoctor.name ? treatment.relatedDoctor.name : "none",
           therapist: treatment.relatedTherapist && treatment.relatedTherapist.name ? treatment.relatedTherapist.name : "none"
        }
          treatment.TCLSellingPrice ?
             data["TCLSellingPrice"] = treatment.TCLSellingPrice
          : treatment.ThingangyunSellingPrice ?
             data["ThingangyunSellingPrice"] = treatment.ThingangyunSellingPrice
          : treatment.EightMileSellingPrice ?
             data["EightMileSellingPrice"] = treatment.EightMileSellingPrice
          : treatment.NPTSellingPrice ?
             data["NPTSellingPrice"] = treatment.NPTSellingPrice
          : treatment.LSHSellingPrice ?
             data["LSHSellingPrice"] = treatment.LSHSellingPrice
          : treatment.MDYSellingPrice ?
             data["MDYSellingPrice"] = treatment.MDYSellingPrice
          : treatment.KShoppingSellingPrice ?
             data["KShoppingSellingPrice"] = treatment.KShoppingSellingPrice
          : treatment.SanChaungSellingPrice ?
             data["SanChaungSellingPrice"] = treatment.SanChaungSellingPrice
          : ""
         
        response.push(data)
     })
     return response;
}

exports.createAccountList = async(req,res) => {
   let packageId = await treatmentPackage.find({})
   packageId.map(async(p)=>{
      const accResult = await accountingList.create({
         name: p.name + 'income',
         subHeader: p.name + 'income',
         relatedType: "6467310959a9bc811d97e9c9", //Profit and Loss
         relatedHeader: "646731e059a9bc811d97eab9",//Revenue
         })
      await treatmentPackage.findByIdAndUpdate(p._id,{relatedAccount:accResult._id})   
   })
  
   res.status(200).send({
      success: true,
      package: packageId
   })
}