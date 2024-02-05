const MobileBooking = require("../models/mobileBooking")

exports.createMobileBooking = async (req,res) => {
    try{
     let data = req.body
     let result = await MobileBooking.create(data)
     res.status(200).send({
        success: true,
        data: result,
        message: "Mobile Booking is successfully created."
     })
    }catch(error){
       res.status(200).send({
         error: true,
         message: error.message
       })
    }
    
}

exports.getAllMobileBooking = async (req,res) => {
    try{
        let { relatedPatient, relatedCart, serviceProvider, relatedBranch, service, date } = req.query
        let startDate = new Date(date)
        // console.log("start date is ",startDate)
        let endDate = new Date( startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1, startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds())
        // console.log("start date is ",endDate)
        let query = {isDeleted:false}
        relatedPatient ? query["relatedPatient"] = relatedPatient : ""
        relatedCart ? query["relatedCart"] = relatedCart : ""
        serviceProvider ? query["serviceProvider"] = serviceProvider : ""
        relatedBranch ? query["relatedBranch"] = relatedBranch : ""
        service ? query["service"] = service : ""
        date ? query["date"] = { $gte: new Date(startDate) , $lt: new Date(endDate) } : ""
        console.log("date is ",query)
        // relatedCart ? query["relatedCart"] = relatedCart : ""
        let queryResult = await MobileBooking.find(query).populate("relatedBranch service serviceProvider relatedPatient relatedCart")
        if(queryResult){
            res.status(200).send({
                success: true,
                data: queryResult,
                message: "Mobile Booking Query"
            })
        }else {
            res.status(200).send({
                success: true,
                message: "There is no mobile booking"
            })
        }
    }catch(error){
        res.status(200).send({
            error: true,
            message: error.message
          })
    }
}

exports.updateMobileBooking = async (req,res) => {
    let data = req.body
    try{
       let updateResult = await MobileBooking.findByIdAndUpdate(req.params.id, data)
       res.status(200).send({
        success: true,
        data: updateResult,
        message: "Mobile Booking is successfully updated"
      })
     }catch(error){
        res.status(200).send({
            error: true,
            message: error.message
          })
     }
}

exports.deleteMobileBooking = async (req,res) => {
    try{
        let deleteResult = await MobileBooking.findByIdAndUpdate(req.params.id,{ isDeleted: true })
        res.status(200).send({
            success:true,
            message: "Mobile Booking is successfully deleted."
        })
       
    }catch(error){
        res.status(200).send({
            error: true,
            message: error.message
          })
    }
}