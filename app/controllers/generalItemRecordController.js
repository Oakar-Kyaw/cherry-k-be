const GeneralItemRecord = require("../models/generalItemRecord")
const moment = require("moment-timezone")

exports.listAllGeneralItemRecord = async (req,res) => {
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
     let result = await GeneralItemRecord.find(query).populate([
       {
        path:"relatedBranch"
       },
       {
        path:"generalItems",
        populate:{
            path:"item_id"
        }
     }]).limit(limit).skip(skip)
     let count = await GeneralItemRecord.find(query).count()
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

exports.getSpecificGeneralItemRecord = async(req,res) => {
    try {
        let result = await GeneralItemRecord.findById(req.params.id).populate([
            {
             path:"relatedBranch"
            },
            {
             path:"generalItems",
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

exports.createGeneralItemRecord  = async(req,res) => {
  let data = req.body
  try {
    let result = await GeneralItemRecord.create(data);
    res.status(200).send({
        success: true,
        message: "Created General Item Record Successfully."
    })
  }catch(error){
    res.status(500).send({
        error: true,
        message: error.message
    })
  }
}

exports.editGeneralItemRecord = async(req,res) => {
    req.body.editTime = moment().tz('Asia/Yangon').format('MMMM Do YYYY, h:mm:ss a')
    req.body.editPerson = req.credentials.id
    req.body.editEmail =  req.credentials.email
    let { generalItems, ...data } = req.body
    try {
        if(generalItems){
                let deleteGeneralItem = await GeneralItemRecord.findByIdAndUpdate(req.params.id,{$unset: {"generalItems" : ""}})
                let addGeneralItem = await GeneralItemRecord.findByIdAndUpdate(req.params.id,{generalItems: generalItems, ...data})
            }
            let editGeneralItem = await GeneralItemRecord.findByIdAndUpdate(req.params.id, {...data}, {new: true}).populate([
                {
                path:"relatedBranch"
                },
                {
                path:"generalItems",
                populate:{
                    path:"item_id"
                }
            }])
            res.status(200).send({
                success: true,
                message: "Successfully Edited",
                data: editGeneralItem
            })
    }catch(error){
        res.status(200).send({
            error: true,
            message: error.message
        })
    }
    
}

exports.deleteGeneralItemRecord = async (req,res) => {
    try{
        req.body.deleteTime = moment().tz('Asia/Yangon').format('MMMM Do YYYY, h:mm:ss a')
        req.body.deletePerson = req.credentials.id
        req.body.deleteEmail =  req.credentials.email
        let result = await GeneralItemRecord.findByIdAndUpdate(req.params.id,{isDeleted: true, ...req.body})
        res.status(200).send({
            success: true,
            message: "Deleted General Item Record Successfully."
        })
    }catch(error){
        res.status(200).send({
            error: true,
            message: error.message
        })
    }
}