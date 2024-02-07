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

exports.updateCartById = async (req,res) => {
  let data = req.body
  let {id} = req.params

}

exports.updateCartByEmployeeId = async (req,res) => {
   let { relatedPatient }  = req.params
   try {
     
   }catch(error){
     res.status(500).send({
      error: true,
      message: error.message
     })
   }
}
