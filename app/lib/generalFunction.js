const bcrypt = require("bcryptjs")
require('dotenv').config()

exports.encryptPassword = async (givenPassword) => {
    let salt = process.env.SALT_KEY
    
    let saltRound = parseInt(process.env.SALT_ROUND)
    console.log(givenPassword)
    let bcryptHash = await bcrypt.hash( givenPassword, saltRound )
    return bcryptHash
}

exports.comparePassword = async (givenPassword, hashedPassword) => {
    let Password = "pass"
    const equalPassword = await bcrypt.compare(Password,hashedPassword)
    console.log("equal Password",equalPassword)
    if(equalPassword){
        return true
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