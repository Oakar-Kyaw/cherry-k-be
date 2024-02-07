const { loopThroughTreatment } = require("../lib/generalFunction")
const Treatment = require("../models/treatment")

exports.getAllTreatment = async (req,res) => {
 let { skip, limit } = req.query
 limit ? + (limit) : 0
 skip ? skip = skip * limit : 0
 console.log("skip is ",skip)
 console.log("limit is ", limit)
 try {
  let treatmentList = await Treatment
                            .find({isDeleted: false})
                            .populate("treatmentName relatedDoctor treatmentName relatedTherapist relatedPatient relatedAppointment relatedBranch")
                            .skip(skip)
                            .limit(limit)
  let count = await Treatment.find({isDeleted: false}).count()
  let treatmentData = loopThroughTreatment(treatmentList)
  res.status(200).send({
    success: true,
    data: treatmentData,
    meta_data: {
      total_count: treatmentData.length,
      total_count: count.length,
      skip: skip,
      limit: limit,
      total_page:  Math.round(count.length / limit)
    }
  })
 }catch(error){
    res.status(500).send({
        error:true,
        message: error.message
      })
 }
  

}

exports.getFilterTreatment = async (req,res) => {
   let { cate, limit, skip } = req.query
   limit ? +limit : 0
   skip ? skip = (skip * limit) : 0 
   try {
      let filterTreatment = await Treatment.find({isDeleted: false})
                                  .populate({
                                    path: "treatmentName",
                                    match: { "bodyParts": {$eq: cate }}
                                  })
                                  .skip(skip)
                                  .limit(limit)
                                  .then(treatments => treatments.filter(treatment => treatment.treatmentName != null))
      let count = await Treatment.find({isDeleted: false})
                                  .populate({
                                    path: "treatmentName",
                                    match: { "bodyParts": {$eq: cate }}
                                  })
                                  .then(treatments => treatments.filter(treatment => treatment.treatmentName != null))
      let filterTreatmentData = loopThroughTreatment(filterTreatment)
      res.status(200).send({
         success: true,
         message: "Get Filtered Treatment",
         data: filterTreatmentData,
         meta_data: {
          total_count: count.length,
          skip: skip,
          limit: limit,
          total_page:  Math.round(count.length / limit)
         }
      })
   }catch(error){
      res.status(500).send({
        error:true,
        message: error.message
      })
   }
}