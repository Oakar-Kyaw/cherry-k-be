const Mobilecart = require("../models/mobileCart")

exports.createMobileCart = async (req,res) => {
  let data = req.body
  try{
    let result = await Mobilecart.create(data)
    res.status(200).send({
        success: true,
        message: "Created Mobile Cart Successfully",
        data: result
    })
  }catch(error){
   res.status(200).send({
      error:true,
      message: error.message
   })
  }
}