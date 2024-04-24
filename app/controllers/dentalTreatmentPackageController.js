const dentalTreatmentPackage = require("../models/dentalTreatmentPackage")
const moment = require("moment")

exports.createDentalTreatmentPackage = async (req,res) => {
    try{
       let data = req.body
       let result = await dentalTreatmentPackage.create(data)
       res.status(200).send({
        success: true,
        data: result,
        message: "Dental Treatment Package Created Successfully"
      })
    }catch(error){
        res.status(500).send({
            error: true,
            message: error.message
        })
    }
}
//list all package from dental Treatment Package Model
exports.listAllDentalTreatmentPackage = async (req,res) => {
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
        let result = await dentalTreatmentPackage.find(query).skip(skip).limit(limit).populate("relatedBranch")
                           .populate("relatedDentalTreatment relatedDentalTreatmentList relatedBranch")
        let count = await dentalTreatmentPackage.find(query).count()
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
                data: "There is no Dental Treatment Package"
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
exports.getDentalTreatmentPackageById = async ( req, res ) => {
    let { id } = req.params
    try{
      let result = await dentalTreatmentPackage.findOne({ _id: id }).populate("relatedBranch relatedDentalTreatment relatedDentalTreatmentList")
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

exports.updateDentalTreatmentPackageById = async ( req, res ) => {
    let { id } = req.params
    req.body.editTime = moment().format('MMMM Do YYYY, h:mm:ss a')
    req.body.editPerson = req.credentials.id
    req.body.editEmail =  req.credentials.email
    const { relatedDentalTreatment, relatedDentalTreatmentList, relatedBranch, ...data} = req.body;
    try{
        if(relatedDentalTreatment && relatedDentalTreatment.length != 0 ){
           let queryItemAndUpdate = await dentalTreatmentPackage.findByIdAndUpdate(id, {
            $unset: {
                relatedDentalTreatment: ""
            }
            }) 
            data["relatedDentalTreatment"] = relatedDentalTreatment
        }
        if(relatedDentalTreatmentList && relatedDentalTreatmentList.length != 0){
            let queryItemAndUpdate = await dentalTreatmentPackage.findByIdAndUpdate(id, {
                $unset: {
                    relatedDentalTreatmentList: ""
                }
                }) 
            data["relatedDentalTreatmentList"]  = relatedDentalTreatmentList
        }
        
        let result = await dentalTreatmentPackage.findByIdAndUpdate(id,{...data},{new: true})
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

exports.deleteDentalTreatmentPackageById = async ( req, res ) => {
    let { id } = req.params
    req.body.deleteTime = moment().format('MMMM Do YYYY, h:mm:ss a')
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
      let result = await dentalTreatmentPackage.findByIdAndUpdate(id,{isDeleted: true, ...req.body, expireAt: deleteTime})
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
