const AddStockAndSubtractStock = require("../lib/addStockAndSubtractFunction")
const DismissItemFromHo = require("../models/dismissItemFromHo")

exports.createDismissItemFromHo = async (req,res) => {
    try{
       let { accessoryItems, procedureItems, generalItems, medicineItems } = req.body
       let data = req.body
       let result = await DismissItemFromHo.create(data)
       let stockInstance = new AddStockAndSubtractStock()
       if(accessoryItems && accessoryItems.length != 0){
         accessoryItems.map(item =>{
               stockInstance.subtractAccessory(item.item_id,item.qty)
         })
       }
       if(procedureItems && procedureItems.length != 0){
        procedureItems.map(item =>{
              stockInstance.subtractProcedure(item.item_id,item.qty)
        })
      }
      if(generalItems && generalItems.length != 0){
        generalItems.map(item =>{
              stockInstance.subtractGeneral(item.item_id,item.qty)
        })
      }
      if(medicineItems && medicineItems.length != 0){
        medicineItems.map(item =>{
              stockInstance.subtractMedicine(item.item_id,item.qty)
        })
      }
       res.status(200).send({
        success: true,
        data: result,
        message: "Dismissed Successfully"
      })
    }catch(error){
        res.status(500).send({
            error: true,
            message: error.message
        })
    }
}
//list all transfer to ho request
exports.listAllDismissItemFromHo = async (req,res) => {
    let { limit, skip, exact} = req.query;
    try {
        // console.log("this is role ")
        let query = { isDeleted: false }
        let startDate = new Date(exact)
        let endDate = new Date( startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1, startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds())
        limit = limit ? limit : 0
        skip = skip ? ( skip || 0 ) * limit : 0
        exact ? query["date"] = { "$gte": new Date(startDate), "$lt": new Date(endDate) } : ""
        let result = await DismissItemFromHo.find(query).skip(skip).limit(limit).populate({
                               path: "procedureItems",
                               populate:{
                                path: "item_id"
                               }
                            }).populate({
                                path: "medicineItems",
                                populate:{
                                 path: "item_id"
                                }
                            }).populate({
                                path: "accessoryItems",
                                populate:{
                                 path: "item_id"
                                }
                            }).populate({
                                path: "generalItems",
                                populate:{
                                 path: "item_id"
                                }
                            })
        let count = await DismissItemFromHo.find(query).count()
        if(result){
            res.status(200).send({
                success: true,
                data: result,
                meta_data : {
                    total_count: count,
                    skip: skip ? skip : 0,
                    limit: limit ? limit : 0,
                    per_page: limit ? limit : count,
                    total_page: limit ? Math.ceil(count/limit) : 1
                }
            })
        }
        else {
            res.status(200).send({
                success: true,
                data: "There is no Dismissed Items"
            })
        }
        
    }catch(error){
        res.status(500).send({
            error:true,
            message:error.message
        })
    }
}
//get transfer to ho request by id
exports.DismissItemFromHoById = async ( req, res ) => {
    let { id } = req.params
    try{
      let result = await DismissItemFromHo.findOne({ _id: id }).populate({
                            path: "procedureItems",
                            populate:{
                            path: "item_id"
                            }
                        }).populate({
                            path: "medicineItems",
                            populate:{
                                path: "item_id"
                            }
                        }).populate({
                            path: "accessoryItems",
                            populate:{
                                path: "item_id"
                            }
                        }).populate({
                            path: "generalItems",
                            populate:{
                                path: "item_id"
                            }
                        })
      result ? res.status(200).send({
                                 success: true,
                                 data: result
                                    })
             : res.status(200).send({
                success: true,
                message: "There is no data for this one"
             })
    }
    catch(error){
        res.status(500).send({
            error:true,
            message:error.message
        })
    }   
}

exports.updateDismissItemFromHoById = async ( req, res ) => {
    let { id } = req.params
    const { accessoryItems, procedureItems, generalItems, medicineItems, ...data} = req.body;
    try{
        let queryItemAndUpdate = await DismissItemFromHo.findByIdAndUpdate(id, {
            $unset: {
                medicineItems: "",
                generalItems: "",
                procedureITems: "",
                accessoryItems: "" 
            }
        })
        data["accessoryItems"] = accessoryItems || []
        data["procedureItems"] = procedureItems || []
        data["generalItems"] = generalItems || []
        data["medicineItems"] = medicineItems || []
        let result = await DismissItemFromHo.findByIdAndUpdate(id,{...data},{new: true})
        result ? res.status(200).send({
                                 success: true,
                                 data: result,
                                 message: "Updated Successfully"
                                    })
             : res.status(200).send({
                success: true,
                message: "There is no data for this one"
             })
    }
    catch(error){
        res.status(500).send({
            error:true,
            message:error.message
        })
    }   
}

exports.deleteDismissItemFromHoById = async ( req, res ) => {
    let { id } = req.params
    try{
      let time = new Date(Date.now())
      console.log("this ",time)
      let result = await DismissItemFromHo.findByIdAndUpdate(id,{isDeleted: true, expireAt: time})
      result ? res.status(200).send({
                                 success: true,
                                 message: "Deleted Successfully"
                                    })
             : res.status(200).send({
                success: true,
                message: "There is no data for this one"
             })
    }
    catch(error){
        res.status(500).send({
            error:true,
            message:error.message
        })
    }   
}

exports.getDismissItemFromHoCode = async (req,res) => {
    try{
       let queryDICount = await DismissItemFromHo.findOne({ isDeleted: false}).count()
       let code = `DI-${ queryDICount + 1 }`
       res.status(200).send({
         success: true,
         code: code,
         message: "This is Your Code"
       })
    }catch(error){
        re.status(500).send({
            error: true,
            message: error.message
        })
    }
}