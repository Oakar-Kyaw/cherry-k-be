const Mobilecart = require("../models/mobileCart")

exports.getAllMobileCart = async (req,res) => {
  let { skip, limit } = req.query
  limit ? limit = limit : 0
  skip ? skip = skip * limit : 0
  let query = { isDeleted: false }
  try{
    let result = await Mobilecart.find(query).populate("relatedPatient").populate({
      path:"treatment",
      populate:{
        path:"treatment_id"
      }
  }).skip(skip).limit(limit)
  let count = await Mobilecart.find(query).count()
  
    res.status(200).send({
        success: true,
        message: "This is all the list of treatment",
        data: result,
        meta_data: {
          total_count: count,
          total_page:  Math.round(count/(limit || 1)),
          skip: skip,
          current_page: skip || 1,
          limit: limit
        }
    })
  }catch(error){
   res.status(200).send({
      error:true,
      message: error.message
   })
  }
}

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
  let { treatment, ...data  } = req.body
  let {flag} = req.query
  let {id} = req.params
  let updatedCartResult
  try{
    {
      if(flag === "add"){
        updatedCartResult = await Mobilecart.findByIdAndUpdate(id,{$addToSet: {treatment: treatment}, ...data})
        }
      else if (flag === "edit"){
          
      }
    }
    res.status(200).send({
      success: true,
      data: updatedCartResult,
      message: "Updated add to cart successfully"
    })
  }catch(error){
    res.status(500).send({
      error: true,
      message: error.message
    })
  }

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
