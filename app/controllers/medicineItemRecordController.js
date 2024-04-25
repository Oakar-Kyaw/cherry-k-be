const MedicineItemRecord = require("../models/medicineItemRecord")
const moment = require("moment-timezone")

exports.listAllMedicineItemRecord = async (req,res) => {
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
     let result = await MedicineItemRecord.find(query).populate([
       {
        path:"relatedBranch"
       },
       {
        path:"medicineItems",
        populate:{
            path:"item_id"
        }
     }]).limit(limit).skip(skip)
     let count = await MedicineItemRecord.find(query).count()
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

exports.getSpecificMedicineItemRecord = async(req,res) => {
    try {
        let result = await MedicineItemRecord.findById(req.params.id).populate([
            {
             path:"relatedBranch"
            },
            {
             path:"medicineItems",
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

exports.createMedicineItemRecord  = async(req,res) => {
  let data = req.body
  try {
    let result = await MedicineItemRecord.create(data);
    res.status(200).send({
        success: true,
        message: "Created Medicine Item Record Successfully."
    })
  }catch(error){
    res.status(500).send({
        error: true,
        message: error.message
    })
  }
}

exports.editMedicineItemRecord = async(req,res) => {
    req.body.editTime = moment().tz('Asia/Yangon').format('MMMM Do YYYY, h:mm:ss a')
    req.body.editPerson = req.credentials.id
    req.body.editEmail =  req.credentials.email
    let { medicineItems, ...data } = req.body
    try {
        if(medicineItems){
                let deleteMedicineItem = await MedicineItemRecord.findByIdAndUpdate(req.params.id,{$unset: {"medicineItems" : ""}})
                let addMedicineItem = await MedicineItemRecord.findByIdAndUpdate(req.params.id,{medicineItems: medicineItems, ...data})
            }
            let editMedicineItem = await MedicineItemRecord.findByIdAndUpdate(req.params.id, {...data}, {new: true}).populate([
                {
                path:"relatedBranch"
                },
                {
                path:"medicineItems",
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

exports.deleteMedicineItemRecord = async (req,res) => {
    try{
        req.body.deleteTime = moment().tz('Asia/Yangon').format('MMMM Do YYYY, h:mm:ss a')
        req.body.deletePerson = req.credentials.id
        req.body.deleteEmail =  req.credentials.email
        let result = await MedicineItemRecord.findByIdAndUpdate(req.params.id,{isDeleted: true, ...req.body})
        res.status(200).send({
            success: true,
            message: "Deleted Medicine Item Record Successfully."
        })
    }catch(error){
        res.status(200).send({
            error: true,
            message: error.message
        })
    }
}