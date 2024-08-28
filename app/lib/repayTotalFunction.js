const Repay = require("../models/repayment")

exports.totalRepayFunction = async(queryData) => {
    const repay = await Repay.find(queryData)
    const totalRepay = repay.reduce((acc, repayment) => {
    if (repayment.relatedCash) {
        acc.cashTotal = (acc.cashTotal || 0) + (repayment.repaymentAmount || 0)
        return acc
    } 
    // else if (repayment.relatedBank) {
    //     acc.bankTotal = (acc.bankTotal || 0) + (repayment.repaymentAmount || 0)
    //     return acc
    // }
    else {
        return acc
    }
    }, {
    cashTotal: 0,
    // bankTotal: 0
    })
    return totalRepay
}