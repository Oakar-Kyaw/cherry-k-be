'use strict';
const AccountBalance = require('../models/accountBalance');
const MedicineSale = require('../models/medicineSale');
const Expense = require('../models/expense');
const Income = require('../models/income');
const TreatmentVoucher = require('../models/treatmentVoucher');
const AccountingList = require('../models/accountingList');
const Transfer = require('../models/transfer');
const kmaxVoucher = require('../models/kmaxVoucher');
const moment = require("moment")

exports.listAllAccountBalances = async (req, res) => {
    let { keyword, role, limit, skip } = req.query;
    let count = 0;
    let page = 0;
    try {
        limit = +limit <= 100 ? +limit : 10; //limit
        skip = +skip || 0;
        let query = req.mongoQuery,
            regexKeyword;
        role ? (query['role'] = role.toUpperCase()) : '';
        keyword && /\w/.test(keyword)
            ? (regexKeyword = new RegExp(keyword, 'i'))
            : '';
        regexKeyword ? (query['name'] = regexKeyword) : '';
        let result = await AccountBalance.find(query).populate('relatedAccounting')
        count = await AccountBalance.find(query).count();
        const division = count / limit;
        page = Math.ceil(division);

        res.status(200).send({
            success: true,
            count: count,
            _metadata: {
                current_page: skip / limit + 1,
                per_page: limit,
                page_count: page,
                total_count: count,
            },
            list: result,
        });
    } catch (e) {
        return res.status(500).send({ error: true, message: e.message });
    }
};

exports.getAccountBalance = async (req, res) => {
    let query = req.mongoQuery
    if (req.params.id) query._id = req.params.id
    const result = await AccountBalance.find(query).populate('relatedAccounting')
    if (result.length === 0)
        return res.status(500).json({ error: true, message: 'No Record Found' });
    return res.status(200).send({ success: true, data: result });
};

exports.createAccountBalance = async (req, res, next) => {
    let newBody = req.body;
    let { relatedAccounting, relatedBranch, amount } = newBody
    let oldBody
    try {
        const { amount, date, relatedBranch, type } = req.body;
        let endDate
        let query 
        newBody.createdAt = Date.now()
        const exact = new Date(date);
        // console.log("this is exact",exact)
        // console.log("this is exact",exact.getDate())
        
        endDate = new Date(exact.getFullYear(), exact.getMonth(), exact.getDate() - 1, exact.getHours(), exact.getMinutes(), exact.getSeconds(), exact.getMilliseconds())
        oldBody = {
                "relatedAccounting": relatedAccounting,
                "type": "Closing",
                "amount": amount,
                "date": endDate,
                "relatedBranch": relatedBranch,
              }
        const oldAccountBalance = new AccountBalance(oldBody)
        const newAccountBalance = new AccountBalance(newBody);
        const oldResult = await oldAccountBalance.save();
        const result = await newAccountBalance.save();
        res.status(200).send({
             message: 'AccountBalance create success',
             success: true,
             data: result
                });
       
    } catch (error) {
        // console.log(error )
        return res.status(500).send({ "error": true, message: error.message })
    }
};


exports.accountBalanceTransfer = async (req, res) => {
    try {
        const { transferAmount, closingAmount, closingAcc, transferAcc, relatedBranch, remark, date, nextDay } = req.body;
        console.log("ts ",req.body)
        const now = new Date().toISOString()
        const givenTime = new Date(date).getTime()
        const Today = new Date(now).getTime()
        const startDate = date ? new Date(date) : ""; // Set start date to the beginning of the daynew Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
        const endDate = nextDay ? new Date(nextDay) : ""; 
         console.log("this is day",startDate,endDate) 
        // let query = { isDeleted:false, relatedBranch: relatedBranch, type:"Closing", date:{ $gte:new Date(startDate), $lt: new Date(endDate)}}
        // let queryAccountBalance = await AccountBalance.findOne(query)
        // if(!queryAccountBalance){
        const transfered = await AccountingList.findOneAndUpdate({ _id: transferAcc }, { $inc: { amount: transferAmount } }, { new: true })
        const transferList = await Transfer.create({
            remark: remark,
            amount: transferAmount,
            fromAcc: closingAcc,
            toAcc: transferAcc,
            date: date
        })
       
        // if (closingAmount != undefined && closingAmount >= 0 && Today >= givenTime ) {
        //     console.log("this iis closing")
        const closing = await AccountBalance.create({
                type: 'Closing',
                amount: closingAmount,
                relatedBranch: relatedBranch,
                remark: remark,
                relatedAccounting: closingAcc,
                date: startDate,
                createdAt: Date.now(),
                transferAmount: transferAmount
            })
            const opening = await AccountBalance.create({
               type:"Opening",
               amount: closingAmount,
               relatedBranch: relatedBranch,
               remark: remark,
               relatedAccounting: closingAcc,
               date: endDate,
               createdAt: Date.now()
            })

            return res.status(200).send({
                success: true, data: {
                    transferResult: transfered,
                    closingResult: closing,
                    openingResult : opening,
                    transferList: transferList
                }
            })
        // }
    //     else if( givenTime > Today ){
    //         return res.status(500).send({
    //             error: true, 
    //             message: "Can't create the date which is greater than today"
    //         })
    //     }
    //     else if(closingAmount == undefined || closingAmount == null || closingAmount < 0 ){
    //             return res.status(500).send({
    //                 error: true, 
    //                 message: "Please Input Valid Transfer Amount"
    //             })
    //     }
    //    }
    //     else {
    //         return res.status(500).send({
    //             error: true, 
    //             message: "Already Transfered Amount for Today"
    //         })
        // } 
 } catch (error) {
        console.log(error)
    }
}

exports.updateAccountBalance = async (req, res, next) => {
    try {
        const result = await AccountBalance.findOneAndUpdate(
            { _id: req.body.id },
            req.body,
            { new: true },
        ).populate('relatedAccounting')
        return res.status(200).send({ success: true, data: result });
    } catch (error) {
        return res.status(500).send({ "error": true, "message": error.message })
    }
};

exports.deleteAccountBalance = async (req, res, next) => {
    try {
        const result = await AccountBalance.findOneAndUpdate(
            { _id: req.params.id },
            { isDeleted: true },
            { new: true },
        );
        return res.status(200).send({ success: true, data: { isDeleted: result.isDeleted } });
    } catch (error) {
        return res.status(500).send({ "error": true, "message": error.message })

    }
}

exports.activateAccountBalance = async (req, res, next) => {
    try {
        const result = await AccountBalance.findOneAndUpdate(
            { _id: req.params.id },
            { isDeleted: false },
            { new: true },
        );
        return res.status(200).send({ success: true, data: { isDeleted: result.isDeleted } });
    } catch (error) {
        return res.status(500).send({ "error": true, "message": error.message })
    }
};

// exports.getOpeningClosingWithExactDate = async (req, res) => {
//     try {
//         const { type, acc, branch, exact } = req.body;
//         const date = new Date(exact);
//         const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()); // Set start date to the beginning of the day
//         const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
//         let query = { relatedAccounting: acc, type: type, date: { $gte: startDate, $lte: endDate } }
//         if (branch) query.relatedBranch = branch
//         const result = await AccountBalance.find(query).populate('relatedAccounting')
//         return res.status(200).send({ success: true, data: result })
//     } catch (error) {
//         return res.status(500).send({ error: true, message: error.message })
//     }
// }

exports.getOpeningAndClosingWithExactDate = async (req, res) => {
    let { exact, relatedBranch, type, relatedAccounting } = req.query;
    
    try {
        const date = new Date(exact);
        const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()); // Set start date to the beginning of the day
        const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()); // Set end date to the beginning of the next day
        const query = { isDeleted:false, relatedBranch: relatedBranch, relatedAccounting: relatedAccounting, type: type, date: { $gte: startDate, $lt: endDate } };
        const latestDocument = await AccountBalance.find(query).sort({_id: -1}).limit(1);
        // console.log(latestDocument,"getOpening")
        let openingTotal = latestDocument.length != 0 && latestDocument[0].type === "Opening" ? latestDocument[0].amount : 0 
        let transferBalance = latestDocument.length != 0 && latestDocument[0].type === "Closing" ?  latestDocument[0].transferAmount : 0
        console.log(startDate, endDate)
        let queryMedicineTotal = {
            Refund: false,
            isDeleted:false,
            tsType:"MS" ,
            relatedCash:{ $exists:true },
            relatedBranch: relatedBranch ,
            createdAt: { $gte: startDate, $lt: endDate },
        }
        //createdAt: { $gte: startDate, $lt: endDate }, 
        //relatedCash exists by Oakar Kyaw
        const medicineSaleFirstCashTotal = await TreatmentVoucher.find(queryMedicineTotal).then(msResult => {
          console.log("ms result i s "+msResult)
           if(msResult){
            const msTotal = msResult.reduce((accumulator, currentValue) => { return accumulator + currentValue.msPaidAmount }, 0)
            return msTotal
           } 
           return 0;
        }
        )
        //secondAccount cash exists
        const { relatedCash, ...query2 } = queryMedicineTotal;
        query2.secondAccount = { $exists: true };
        console.log("second account is ",query2)
        const medicineSaleSecondCashTotal = await TreatmentVoucher.find(query2)
                        .populate({
                            path:"secondAccount",
                            populate:{
                                path: "relatedHeader"
                        }
                    })
                    .then(msResult => {
                console.log("medicine second cash total is " ,msResult)
                //   return res.status(200).send({data:msResult})
                const total = msResult.reduce((accumulator, currentValue) => {
                if(currentValue.secondAccount.relatedHeader.name === "Cash In Hand"){
                return accumulator + currentValue.secondAmount
                } 
                else {
                return accumulator;
                }
                }

                ,0)

                return total;

                }
                ) 

        const expenseTotal = await Expense.find({ isDeleted:false, date: { $gte: startDate, $lt: endDate }, relatedBranch: relatedBranch }).then(result => {
           if(result){
            console.log("expense result is ",result)
            const total = result.reduce((accumulator, currentValue) => { return accumulator + currentValue.finalAmount }, 0)
            return total
           }
            return 0;
        }
        )
        
        const { tsType, ...queryTreatmentVoucher} = queryMedicineTotal;
        queryTreatmentVoucher.tsType = 'TSMulti';
        const TVFirstCashTotal = await TreatmentVoucher.find(queryTreatmentVoucher).populate("secondAccount").then(result => {
        //    console.log(result)
          if(result){
           const total = result.reduce((accumulator, currentValue) => { return accumulator + currentValue.totalPaidAmount }, 0)
           return total 
          }
            return 0;
        }
        )

         //query only cash TSMulti by second
         let queryTreatmentVoucher2 =  {
            isDeleted:false,
            createdAt: { $gte: startDate, $lt: endDate }, 
            secondAccount: { $exists: true },
            relatedBranch: relatedBranch, 
            tsType: 'TSMulti'
        };
        const TVSecondCashTotal = await TreatmentVoucher.find(queryTreatmentVoucher2)
                                     .populate({
                                        path:"secondAccount",
                                        populate:{
                                            path: "relatedHeader"
                                    }
                                  })
                                .then(result => {
               console.log("TV second cash total is " ,result)
           //   return res.status(200).send({data:result})
           const total = result.reduce((accumulator, currentValue) => {
            if(currentValue.secondAccount.relatedHeader.name === "Cash In Hand"){
              return accumulator + currentValue.secondAmount
            } 
            else {
                return accumulator;
            }
            }
           
            ,0)
         
           return total;
            
        }
        ) 
        
        //query first cash combined vocucher
        let queryCombineTreatmentVoucher = {
            Refund: false,
            isDeleted : false,
            createdAt: { $gte: startDate, $lt: endDate }, 
            relatedCash: { $exists: true },
            relatedBranch: relatedBranch, 
            tsType: 'Combined'
        }
        
        const combinedSaleFristCashTotal = await TreatmentVoucher.find(queryCombineTreatmentVoucher).populate("secondAccount").then(result => {
            //    console.log(result)
              if(result){
               const total = result.reduce((accumulator, currentValue) => { return accumulator + currentValue.totalPaidAmount + currentValue.msPaidAmount }, 0)
               return total 
              }
                return 0;
            }
            )
        
        //query second cash combined voucher
       let queryCombineTreatmentVoucher2 = {
        Refund: false,
        isDeleted : false,
        createdAt: { $gte: startDate, $lt: endDate }, 
        secondAccount: { $exists: true },
        relatedBranch: relatedBranch, 
        tsType: 'Combined'
       }
        const combinedSaleSecondCashTotal =  await TreatmentVoucher.find(queryCombineTreatmentVoucher2)
                    .populate({
                        path:"secondAccount",
                        populate:{
                            path: "relatedHeader"
                    }
                })
                .then(cmResult => {
            console.log("TV second cash total is " ,cmResult)
            //   return res.status(200).send({data:result})
            const total = cmResult.reduce((accumulator, currentValue) => {
            if(currentValue.secondAccount.relatedHeader.name === "Cash In Hand"){
            return accumulator + currentValue.secondAmount
            } 
            else {
            return accumulator;
            }
            }

            ,0)

            return total;

            }
            ) 

        const incomeTotal = await Income.find({ date: { $gte: startDate, $lt: endDate }, relatedBranch: relatedBranch }).then(result => {
            if(result){
              const total = result.reduce((accumulator, currentValue) => { return accumulator + currentValue.finalAmount }, 0)
              return total  
            }
            return 0;
        }
        )
        console.log('Final Data',({transferBalances: type === "Opening" ? transferBalance: 0 }))
        return res.status(200).send({ success: true, 
                                      openingTotal: openingTotal, 
                                      medicineSaleFirstCashTotal: type === "Opening" ? medicineSaleFirstCashTotal : 0,
                                      medicineSaleSecondCashTotal: type === "Opening" ? medicineSaleSecondCashTotal : 0,
                                      combinedSaleFristCashTotal: type === "Opening" ? combinedSaleFristCashTotal : 0,
                                      combinedSaleSecondCashTotal: type === "Opening" ? combinedSaleSecondCashTotal : 0,     
                                      expenseTotal: type === "Opening" ? expenseTotal : 0, 
                                      TVFirstCashTotal: type === "Opening" ? TVFirstCashTotal : 0, 
                                      TVSecondCashTotal: type === "Opening" ? TVSecondCashTotal : 0,
                                      incomeTotal: type === "Opening" ? incomeTotal : 0, 
                                      transferBalances: type === "Closing" ? transferBalance: 0 ,
                                      total: type === "Opening" ? (medicineSaleFirstCashTotal + medicineSaleSecondCashTotal + TVFirstCashTotal + TVSecondCashTotal + combinedSaleFristCashTotal + combinedSaleSecondCashTotal + incomeTotal + openingTotal) : 0 , 
                                      closingCash: type === "Opening" ? (medicineSaleFirstCashTotal + medicineSaleSecondCashTotal + TVFirstCashTotal + TVSecondCashTotal + combinedSaleFristCashTotal + combinedSaleSecondCashTotal + incomeTotal + openingTotal) - expenseTotal : 0,
                                      }
                                      )
    } catch (error) {
        console.log(error)
        return res.status(500).send({ error: true, message: error.message })
    }
}

exports.knasGetOpeningAndClosingWithExactDate = async (req, res) => {
    let { exact, relatedBranch, type, relatedAccounting } = req.query;
    
    try {
        const date = new Date(exact);
        const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()); // Set start date to the beginning of the day
        const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()); // Set end date to the beginning of the next day
        const query = { isDeleted:false, relatedBranch: relatedBranch, relatedAccounting: relatedAccounting, type: type, date: { $gte: startDate, $lt: endDate } };
        const latestDocument = await AccountBalance.find(query).sort({_id: -1}).limit(1);
        // console.log(latestDocument,"getOpening")
        let openingTotal = latestDocument.length != 0 && latestDocument[0].type === "Opening" ? latestDocument[0].amount : 0 
        let transferBalance = latestDocument.length != 0 && latestDocument[0].type === "Closing" ?  latestDocument[0].transferAmount : 0 
        // console.log(startDate, endDate)
        let queryMedicineTotal = {
            Refund: false,
            isDeleted:false,
            tsType:"MS" ,
            relatedCash:{ $exists:true },
            relatedBranch: relatedBranch ,
            createdAt: { $gte: startDate, $lt: endDate },
        }
        // //createdAt: { $gte: startDate, $lt: endDate }, 
        // //relatedCash exists by Oakar Kyaw
        const medicineSaleFirstCashTotal = await kmaxVoucher.find(queryMedicineTotal).then(msResult => {
          console.log("ms result i s "+msResult)
           if(msResult){
            const msTotal = msResult.reduce((accumulator, currentValue) => { return accumulator + currentValue.paidAmount }, 0)
            return msTotal
           } 
           return 0;
        }
        )
        //secondAccount cash exists
        const { relatedCash, ...query2 } = queryMedicineTotal;
        query2.secondAccount = { $exists: true };
        const medicineSaleSecondCashTotal = await kmaxVoucher.find(query2)
                        .populate({
                            path:"secondAccount",
                            populate:{
                                path: "relatedHeader"
                        }
                    })
                    .then(msResult => {
                console.log("medicine second cash total is " ,msResult)
                //   return res.status(200).send({data:msResult})
                const total = msResult.reduce((accumulator, currentValue) => {
                if(currentValue.secondAccount.relatedHeader.name === "Cash In Hand"){
                return accumulator + currentValue.secondAmount
                } 
                else {
                return accumulator;
                }
                }

                ,0)

                return total;

                }
                ) 

        const expenseTotal = await Expense.find({ isDeleted:false, date: { $gte: startDate, $lt: endDate }, relatedBranch: relatedBranch }).then(result => {
           if(result){
            console.log("expense result is ",result)
            const total = result.reduce((accumulator, currentValue) => { return accumulator + currentValue.finalAmount }, 0)
            return total
           }
            return 0;
        }
        )
        
        
        const incomeTotal = await Income.find({ date: { $gte: startDate, $lt: endDate }, relatedBranch: relatedBranch }).then(result => {
            if(result){
              const total = result.reduce((accumulator, currentValue) => { return accumulator + currentValue.finalAmount }, 0)
              return total  
            }
            return 0;
        }
        )
        // console.log('Final Data',({transferBalances: type === "Opening" ? transferBalance: 0 }))
        return res.status(200).send({ success: true, 
                                      openingTotal: openingTotal, 
                                      medicineSaleFirstCashTotal: type === "Opening" ? medicineSaleFirstCashTotal : 0,
                                      medicineSaleSecondCashTotal: type === "Opening" ? medicineSaleSecondCashTotal : 0,    
                                      expenseTotal: type === "Opening" ? expenseTotal : 0, 
                                      incomeTotal: type === "Opening" ? incomeTotal : 0, 
                                      transferBalances: type === "Closing" ? transferBalance: 0 ,
                                      total: type === "Opening" ? medicineSaleFirstCashTotal + medicineSaleSecondCashTotal + incomeTotal + openingTotal : 0, 
                                      closingCash: type === "Opening" ?  (medicineSaleFirstCashTotal + medicineSaleSecondCashTotal + incomeTotal + openingTotal) - expenseTotal : 0
                                      }
                                      )
    } catch (error) {
        console.log(error)
        return res.status(500).send({ error: true, message: error.message })
    }
}

exports.getClosing = async (req, res) => {
    try {
        const query = { relatedAccounting: req.query.relatedAccounting, type: req.query.type };
        const sort = { _id: -1 }; // Sort by descending _id to get the latest document
        console.log(query, sort, 'here')
        const latestDocument = await AccountBalance.findOne(query, null, { sort });
        console.log(latestDocument)
        if (latestDocument === null) return res.status(404).send({ error: true, message: 'Not Found!' })
        const result = await AccountBalance.find({ _id: latestDocument._id }).populate('relatedAccounting')
        return res.status(200).send({ success: true, data: result });
    } catch (error) {
        return res.status(500).send({ "error": true, "message": error.message })
    }
}
