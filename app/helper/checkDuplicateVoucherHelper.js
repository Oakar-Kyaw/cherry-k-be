const treatmentVoucher = require("../models/treatmentVoucher")
const { startDateEndDateHelper } = require("./dateHelper")
const { TreatmentVoucherFilter } = require("../controllers/treatmentVoucherController")

function compareTwoArray(real, compare){
    switch(real.length === compare.length){
        case true:
            let checkArray = false
             compare.map(item=>{
               const checkItemFromArray = real.includes(item)
               if(!checkItemFromArray){
                 return false
               }else{
                 checkArray = true
               }
             })
             return checkArray
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
    let voucher = await treatmentVoucher.find(query)
    if(voucher.length > 0) {  
        let voucherExist = TreatmentVoucherFilter
        voucher.some(v=>{
            const realItemArrayId = []
            const array = tsType === "TSMulti" ? v.multiTreatment : v.medicineItems
            array.map(arr=> realItemArrayId.push(arr.item_id.toString()))
            const compareArray = tsType === "TSMulti" ?  JSON.parse(multiTreatment) : JSON.parse(medicineItems)
            const compareItemId = compareArray.map(arr=> arr.item_id)
            console.log( compareTwoArray(realItemArrayId, compareItemId),"c")
            if(compareTwoArray(realItemArrayId, compareItemId))
             {
                voucherExist = true
                return true
             }
            else{
                voucherExist = false
            }
        })
        return voucherExist
    }
    return false
}
