const TransferToHoRequest = require("../models/transferToHoRequest")

exports.createTransferToHoRequest = async (req,res) => {
    try{
       let data = req.body
       let result = await TransferToHoRequest.create(data)
       res.status(200).send({
        success: true,
        data: result,
        message: "Requested Successfully"
      })
    }catch(error){
        res.status(500).send({
            error: true,
            message: error.message
        })
    }
}
//list all transfer to ho request
exports.listAllTransferToHoRequest = async (req,res) => {
    let { keyword, role, limit, page, skip, exact, relatedBranch } = req.query;
    try {
        // console.log("this is role ")
        let query = { isDeleted: false }
        let startDate = new Date(exact)
        let endDate = new Date( startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1, startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds())
        limit = limit ? limit : 0
        skip = skip ? ( skip || 0 ) * limit : 0
        exact ? query["date"] = { "$gte": new Date(startDate), "$lt": new Date(endDate) } : ""
        relatedBranch ? query["relatedBranch"] = relatedBranch : ""
        let result = await TransferToHoRequest.find(query).skip(skip).limit(limit).populate("relatedBranch")
                           .populate({
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
        let count = await TransferToHoRequest.find(query).count()
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
                data: "There is no Request"
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
exports.getTransferToHOById = async ( req, res ) => {
    let { id } = req.params
    try{
      let result = await TransferToHoRequest.findOne({ _id: id }).populate("relatedBranch")
                        .populate({
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

exports.updateTransferToHoRequestById = async ( req, res ) => {
    let { id } = req.params
    const { accessoryItems, procedureItems, generalItems, medicineItems, relatedBranch, ...data} = req.body;
    try{
        let queryItemAndUpdate = await TransferToHoRequest.findByIdAndUpdate(id, {
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
        let result = await TransferToHoRequest.findByIdAndUpdate(id,{...data},{new: true})
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

exports.deleteTransferToHORequestById = async ( req, res ) => {
    let { id } = req.params
    try{
      let time = new Date(Date.now())
      console.log("this ",time)
      let result = await TransferToHoRequest.findByIdAndUpdate(id,{isDeleted: true, expireAt: time})
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