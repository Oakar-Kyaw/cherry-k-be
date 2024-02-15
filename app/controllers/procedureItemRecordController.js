const ProcedureItemRecord = require("../models/procedureItemRecord")

exports.listAllProcedureItemRecord = async (req,res) => {
    let { skip, limit, exact, relatedBranch } =req.query
    limit ? limit = limit : 0
    skip ? ( skip * limit): 0
    let startDate = new Date(exact)
    let endDate = new Date( startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1, 
     startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds()
    )
    let query = {isDeleted: false}
    exact ? query["createdAt"] = {
        $gte: new Date(startDate), $lte: new Date(endDate) 
        } 
        : ""
    relatedBranch ? query["relatedBranch"] = relatedBranch : ""
    // console.log("query is ", query)
    try{
     let result = await ProcedureItemRecord.find(query).populate([
       {
        path:"relatedBranch"
       },
       {
        path:"procedureItems",
        populate:{
            path:"item_id"
        }
     }]).limit(limit).skip(skip)
     let count = await ProcedureItemRecord.find(query).count()
     res.status(200).send({
        success:true,
        data: result,
        meta_data: {
            count: count,
            total_page: count/(limit || count),
            limit: limit,
            skip: skip
        }
     })
    }catch(error){
        res.status(500).send({
            error: true,
            message: error.message
        })
    }
}

exports.getSpecificProcedureItemRecord = async(req,res) => {
    try {
        let result = await ProcedureItemRecord.findById(req.params.id).populate([
            {
             path:"relatedBranch"
            },
            {
             path:"procedureItems",
             populate:{
                 path:"item_id"
             }
          }]);
        res.status(200).send({
            success: true,
            data: result
        })
      }catch(error){
        res.status(500).send({
            error: true,
            message: error.message
        })
      }
}

exports.createProcedureItemRecord  = async(req,res) => {
  let data = req.body
  try {
    let result = await ProcedureItemRecord.create(data);
    res.status(200).send({
        success: true,
        message: "Created Procedure Item Record Successfully."
    })
  }catch(error){
    res.status(500).send({
        error: true,
        message: error.message
    })
  }
}

exports.editProcedureItemRecord = async(req,res) => {
    let { procedureItems, ...data } = req.body
    try {
        if(procedureItems){
                let deleteProcedureItem = await ProcedureItemRecord.findByIdAndUpdate(req.params.id,{$unset: {"procedureItems" : ""}})
                let addProcedureItem = await ProcedureItemRecord.findByIdAndUpdate(req.params.id,{procedureItems: procedureItems, ...data})
            }
            let editProcedureItem = await ProcedureItemRecord.findByIdAndUpdate(req.params.id, {...data}, {new: true}).populate([
                {
                path:"relatedBranch"
                },
                {
                path:"procedureItems",
                populate:{
                    path:"item_id"
                }
            }])
            res.status(200).send({
                success: true,
                message: "Successfully Edited",
                data: editMedicineItem
            })
    }catch(error){
        res.status(200).send({
            error: true,
            message: error.message
        })
    }
    
}

exports.deleteProcedureItemRecord = async (req,res) => {
    try{
        let result = await ProcedureItemRecord.findByIdAndUpdate(req.params.id,{isDeleted: true})
        res.status(200).send({
            success: true,
            message: "Deleted Procedure Item Record Successfully."
        })
    }catch(error){
        res.status(200).send({
            error: true,
            message: error.message
        })
    }
}