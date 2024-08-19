const treatmentVoucher = require("../models/treatmentVoucher")
const moment = require("moment-timezone")
const { startDateEndDateHelper } = require("./dateHelper")

exports.checkDuplicateVoucher = async (data) => {
    const {
        tsType,
        totalAmount,
        msTotalAmount,
        relatedPatient,
        createdAt,
        relatedBranch,
        relatedDoctor
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
    return false
}
