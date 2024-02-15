const { encryptPassword } = require("../lib/generalFunction")
const MobileWalletUser = require("../models/mobileWalletUser")

exports.createMobileWalletUser = async (req,res) => {
  let data = req.body
  let { password } = data
  try {
    data.password = await encryptPassword(password)
    let createWalletUser = await MobileWalletUser.create(data)
    res.status(200).send({
        success: true,
        message: "Created User Successfully",
        data: createWalletUser
    })
  }catch(error){
    res.status(500).send({
        error: true,
        message: error.message
    })
  }
}

exports.getAllMobileWalletUser = async (req,res) => {
    try{
      let query = { isDeleted: false }
      let queryWalletUser = await MobileWalletUser.find(query).populate("relatedPatient relatedPontTier relatedCart")
      res.status(200).send({
        success: true,
        data: queryWalletUser
      })
    }catch(error){
        res.status(500).send({
            error: true,
            message: error.message
        })
    }
}

exports.editMobileWalletUser = async (req,res) => {
    try{
       let data = req.body
       console.log("daf ",data)
       let updateMobileUser = await MobileWalletUser.findByIdAndUpdate(req.params.id,data,{new: true}).populate("relatedPatient relatedPontTier relatedCart")
       res.status(200).send({
        success: true,
        data: updateMobileUser
       })
    }catch(error){
        res.status(500).send({
            error: true,
            message: error.message
        })
    }
}