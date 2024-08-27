const treatmentVoucher = require("../models/treatmentVoucher")
const moment = require("moment-timezone")
const { startDateEndDateHelper } = require("./dateHelper")

function compareTwoArray(real, compare){
    console.log("rela",real,compare)
    switch(real.length === compare.length){
        case true:
             real.some(item=>{
                console.log("item",item, !compare.includes(item))
                if(!compare.includes(item)){
                    console.log("this is item")
                    return false
                }
                return true
             })
        case false:
            return false
    }
}

exports.checkDuplicateVoucher = async (data) => {
    const {
        tsType,
        totalAmount,
        msTotalAmount,
        relatedPatient,
        createdAt,
        relatedBranch,
        relatedDoctor,
        multiTreatment,
        medicineItems
    } = data

    // Convert to UTC and format as ISO 8601 string
    const date = startDateEndDateHelper({exact: createdAt, value: "add"})
    console.log("j", createdAt, date)
    const query = {
        isDeleted: false,
        Refund: false
    }
    tsType ? query.tsType = tsType : ""
    totalAmount ? query.totalAmount = totalAmount : ""
    query.relatedPatient = relatedPatient
    relatedDoctor ? query.relatedDoctor = relatedDoctor : ""
    msTotalAmount ? query.msTotalAmount = msTotalAmount : ""
    createdAt ? query.createdAt = {
        $gte: new Date(date.startDate.split("T")[0]),
        $lt: new Date(date.endDate.split("T")[0])
    } : ""
    relatedBranch ? query.relatedBranch = relatedBranch : ""
    let voucher = await treatmentVoucher.findOne(query)
    if(voucher) return true
    // { 
    //     const realItemArrayId = []
    //     const array = tsType === "TSMulti" ? voucher.multiTreatment : voucher.medicineItems
    //     const realItemId = array.map(arr=> realItemArrayId.push(arr.item_id.toString()))
    //     const compareArray = tsType === "TSMulti" ?  JSON.parse(multiTreatment) : JSON.parse(medicineItems)
    //     const compareItemId = compareArray.map(arr=> arr.item_id)
    //     console.log( compareTwoArray(realItemArrayId, compareItemId),"c")
    //     return compareTwoArray(realItemArrayId, compareItemId)
    // }
    return false
}
