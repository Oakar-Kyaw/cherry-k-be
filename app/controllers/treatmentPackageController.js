const Branch = require("../models/branch")
const TreatmentPackage = require("../models/treatmentPackage")
const moment = require('moment-timezone');

exports.createTreatmentPackage = async (req,res) => {
    try{
      let { name } = req.body;
      let data = req.body
      const accResult = await Accounting.create({
      name: name + 'income',
      subHeader: name + 'income',
      relatedType: "6467310959a9bc811d97e9c9", //Profit and Loss
      relatedHeader: "646731e059a9bc811d97eab9",//Revenue
    })
       data = { ...data, relatedAccount: accResult._id }
       let result = await TreatmentPackage.create(data)
       res.status(200).send({
        success: true,
        data: result,
        message: "Treatment Package Created Successfully"
      })
    }catch(error){
        res.status(500).send({
            error: true,
            message: error.message
        })
    }
}
//list all package from Treatment Package Model
exports.listAllTreatmentPackage = async (req,res) => {
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
        let result = await TreatmentPackage.find(query).skip(skip).limit(limit).populate("relatedBranch")
                           .populate("relatedTreatment relatedTreatmentList relatedBranch")
        let count = await TreatmentPackage.find(query).count()
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
                data: "There is no Treatment Package"
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
exports.getTreatmentPackageById = async ( req, res ) => {
    let { id } = req.params
    try{
      let result = await TreatmentPackage.findOne({ _id: id }).populate("relatedBranch relatedTreatment relatedTreatmentList")
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

exports.updateTreatmentPackageById = async ( req, res ) => {
    let id  = req.params.id
    req.body.editTime = moment().tz('Asia/Yangon').format('MMMM Do YYYY, h:mm:ss a')
    req.body.editPerson = req.credentials.id
    req.body.editEmail =  req.credentials.email
    const { relatedTreatment, relatedTreatmentList, relatedBranch, ...data} = req.body;
    try{
        if(relatedTreatment && relatedTreatment.length != 0 ){
           let queryItemAndUpdate = await TreatmentPackage.findByIdAndUpdate(id, {
            $unset: {
                relatedTreatment: ""
            }
            }) 
            data["relatedTreatment"] = relatedTreatment
        }
        if(relatedTreatmentList && relatedTreatmentList.length != 0){
            let queryItemAndUpdate = await TreatmentPackage.findByIdAndUpdate(id, {
                $unset: {
                    relatedTreatmentList: ""
                }
                }) 
            data["relatedTreatmentList"]  = relatedTreatmentList
        }
        
        let result = await TreatmentPackage.findByIdAndUpdate(id,{...data},{new: true})
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

exports.deleteTreatmentPackageById = async ( req, res ) => {
    req.body.deleteTime = moment().tz('Asia/Yangon').format('MMMM Do YYYY, h:mm:ss a')
    req.body.deletePerson = req.credentials.id
    req.body.deleteEmail =  req.credentials.email
    try{
      let time = new Date()
      let deleteTime = new Date(
            time.getFullYear(),
            time.getMonth() + 1,
            time.getDate(),
            time.getHours(),
            time.getMinutes(),
            time.getSeconds(),
            time.getMilliseconds()
      )
      let data = {
        isDeleted: true,
        ...req.body,
        expireAt: deleteTime
      }
      let result = await TreatmentPackage.findByIdAndUpdate(req.params.id,data)
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
