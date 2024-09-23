"use strict";
const AccountBalance = require("../models/accountBalance");
const MedicineSale = require("../models/medicineSale");
const Expense = require("../models/expense");
const Income = require("../models/income");
const TreatmentVoucher = require("../models/treatmentVoucher");
const AccountingList = require("../models/accountingList");
const Transfer = require("../models/transfer");
const kmaxVoucher = require("../models/kmaxVoucher");
const { totalRepayFunction } = require("../lib/repayTotalFunction");
const moment = require("moment-timezone");

exports.listAllAccountBalances = async (req, res) => {
  let { keyword, role, limit, skip } = req.query;
  let count = 0;
  let page = 0;
  try {
    limit = +limit <= 100 ? +limit : 10; //limit
    skip = +skip || 0;
    let query = req.mongoQuery,
      regexKeyword;
    role ? (query["role"] = role.toUpperCase()) : "";
    keyword && /\w/.test(keyword)
      ? (regexKeyword = new RegExp(keyword, "i"))
      : "";
    regexKeyword ? (query["name"] = regexKeyword) : "";
    let result = await AccountBalance.find(query).populate("relatedAccounting");
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
  let query = req.mongoQuery;
  if (req.params.id) query._id = req.params.id;
  const result = await AccountBalance.find(query).populate("relatedAccounting");
  if (result.length === 0)
    return res.status(500).json({ error: true, message: "No Record Found" });
  return res.status(200).send({ success: true, data: result });
};

exports.createAccountBalance = async (req, res, next) => {
  let newBody = req.body;
  let { relatedAccounting, relatedBranch, amount } = newBody;
  let oldBody;
  try {
    const { amount, date, relatedBranch, type } = req.body;
    let endDate;
    let query;
    newBody.createdAt = Date.now();
    const exact = new Date(date);
    // console.log("this is exact",exact)
    // console.log("this is exact",exact.getDate())

    endDate = new Date(
      exact.getFullYear(),
      exact.getMonth(),
      exact.getDate() - 1,
      exact.getHours(),
      exact.getMinutes(),
      exact.getSeconds(),
      exact.getMilliseconds()
    );
    oldBody = {
      relatedAccounting: relatedAccounting,
      type: "Closing",
      amount: amount,
      date: endDate,
      relatedBranch: relatedBranch,
    };
    const oldAccountBalance = new AccountBalance(oldBody);
    const newAccountBalance = new AccountBalance(newBody);
    const oldResult = await oldAccountBalance.save();
    const result = await newAccountBalance.save();
    res.status(200).send({
      message: "AccountBalance create success",
      success: true,
      data: result,
    });
  } catch (error) {
    // console.log(error )
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.accountBalanceTransfer = async (req, res) => {
  try {
    const {
      transferAmount,
      closingAmount,
      closingAcc,
      transferAcc,
      relatedBranch,
      remark,
      date,
      nextDay,
    } = req.body;
    console.log("ts ", req.body);
    const today = new Date(date);
    const startDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      today.getHours(),
      today.getMinutes(),
      today.getSeconds(),
      today.getMilliseconds()
    ); // Set start date to the beginning of the day
    const endDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate() + 1,
      startDate.getHours(),
      startDate.getMinutes(),
      startDate.getSeconds(),
      startDate.getMilliseconds()
    ); // Set end date to the beginning of the next day
    console.log("this is day", startDate, endDate);
    let query = {
      isDeleted: false,
      transferAmount: { $gt: 0 },
      relatedBranch: relatedBranch,
      type: "Closing",
      date: { $gte: new Date(startDate), $lt: new Date(endDate) },
    };
    let queryAccountBalance = await AccountBalance.find(query);
    console.log("qruy", queryAccountBalance);
    if (queryAccountBalance.length != 0)
      res.status(400).send({ success: false, message: "Already Transfered" });
    else {
      const transfered = await AccountingList.findOneAndUpdate(
        { _id: transferAcc },
        { $inc: { amount: transferAmount } },
        { new: true }
      );
      const transferList = await Transfer.create({
        remark: remark,
        amount: transferAmount,
        fromAcc: closingAcc,
        toAcc: transferAcc,
        date: date,
      });
      const closing = await AccountBalance.create({
        type: "Closing",
        amount: closingAmount,
        relatedBranch: relatedBranch,
        remark: remark,
        relatedAccounting: closingAcc,
        date: startDate,
        createdAt: Date.now(),
        transferAmount: transferAmount,
      });
      const opening = await AccountBalance.create({
        type: "Opening",
        amount: closingAmount,
        relatedBranch: relatedBranch,
        remark: remark,
        relatedAccounting: closingAcc,
        date: endDate,
        createdAt: Date.now(),
      });

      return res.status(200).send({
        success: true,
        data: {
          transferResult: transfered,
          closingResult: closing,
          openingResult: opening,
          transferList: transferList,
        },
      });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.updateAccountBalance = async (req, res, next) => {
  try {
    const result = await AccountBalance.findOneAndUpdate(
      { _id: req.body.id },
      req.body,
      { new: true }
    ).populate("relatedAccounting");
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.deleteAccountBalance = async (req, res, next) => {
  try {
    const result = await AccountBalance.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: true },
      { new: true }
    );
    return res
      .status(200)
      .send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.activateAccountBalance = async (req, res, next) => {
  try {
    const result = await AccountBalance.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: false },
      { new: true }
    );
    return res
      .status(200)
      .send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
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
    const startDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds()
    ); // Set start date to the beginning of the day
    const endDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1,
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds()
    ); // Set end date to the beginning of the next day

    const query = {
      isDeleted: false,
      relatedBranch: relatedBranch,
      relatedAccounting: relatedAccounting,
      type: type,
      date: { $gte: startDate, $lt: endDate },
    };

    const latestDocument = await AccountBalance.find(query)
      .sort({ _id: -1 })
      .limit(1);

    const closingQueryData = {
      isDeleted: false,
      relatedBranch: relatedBranch,
      relatedAccounting: relatedAccounting,
      type: "Closing",
      date: { $gte: startDate, $lt: endDate },
    };

    const closingLatestDocument = await AccountBalance.find(closingQueryData)
      .sort({ _id: -1 })
      .limit(1);

    let openingTotal =
      latestDocument.length != 0 && latestDocument[0].type === "Opening"
        ? latestDocument[0].amount
        : 0;

    let transferBalance =
      closingLatestDocument.length != 0
        ? closingLatestDocument[0].transferAmount
        : 0;

    console.log(
      "hello",
      startDate,
      endDate,
      closingLatestDocument,
      latestDocument
    );

    let queryMedicineTotal = {
      Refund: false,
      isDeleted: false,
      tsType: "MS",
      relatedCash: { $exists: true },
      relatedBranch: relatedBranch,
      createdAt: { $gte: startDate, $lt: endDate },
    };
    //createdAt: { $gte: startDate, $lt: endDate },
    //relatedCash exists by Oakar Kyaw
    const medicineSaleFirstCashTotal = await TreatmentVoucher.find(
      queryMedicineTotal
    ).then((msResult) => {
      if (msResult) {
        const msTotal = msResult.reduce((accumulator, currentValue) => {
          return accumulator + currentValue.msPaidAmount;
        }, 0);
        return msTotal;
      }
      return 0;
    });
    //secondAccount cash exists
    const { relatedCash, ...query2 } = queryMedicineTotal;
    query2.secondAccount = { $exists: true };
    const medicineSaleSecondCashTotal = await TreatmentVoucher.find(query2)
      .populate({
        path: "secondAccount",
        populate: {
          path: "relatedHeader",
        },
      })
      .then((msResult) => {
        //   return res.status(200).send({data:msResult})
        const total = msResult.reduce((accumulator, currentValue) => {
          if (
            currentValue.secondAccount.relatedHeader.name === "Cash In Hand"
          ) {
            return accumulator + currentValue.secondAmount;
          } else {
            return accumulator;
          }
        }, 0);
        return total;
      });
    const expenseTotal = await Expense.find({
      isDeleted: false,
      date: { $gte: startDate, $lt: endDate },
      relatedBranch: relatedBranch,
    }).then((result) => {
      if (result) {
        const total = result.reduce((accumulator, currentValue) => {
          return accumulator + currentValue.finalAmount;
        }, 0);
        return total;
      }
      return 0;
    });

    const { tsType, ...queryTreatmentVoucher } = queryMedicineTotal;
    queryTreatmentVoucher.tsType = "TSMulti";

    const TVFirstCashTotal = await TreatmentVoucher.find(queryTreatmentVoucher)
      .populate("secondAccount")
      .then((result) => {
        //    console.log(result)
        if (result) {
          const total = result.reduce((accumulator, currentValue) => {
            return accumulator + currentValue.totalPaidAmount;
          }, 0);
          return total;
        }
        return 0;
      });
    //query only cash TSMulti by second
    let queryTreatmentVoucher2 = {
      isDeleted: false,
      createdAt: { $gte: startDate, $lt: endDate },
      secondAccount: { $exists: true },
      relatedBranch: relatedBranch,
      tsType: "TSMulti",
    };
    const TVSecondCashTotal = await TreatmentVoucher.find(
      queryTreatmentVoucher2
    )
      .populate({
        path: "secondAccount",
        populate: {
          path: "relatedHeader",
        },
      })
      .then((result) => {
        //   return res.status(200).send({data:result})
        const total = result.reduce(
          (accumulator, currentValue) => {
            if (
              currentValue.secondAccount.relatedHeader.name === "Cash In Hand"
            ) {
              return accumulator + currentValue.secondAmount;
            } else {
              return accumulator;
            }
          },

          0
        );

        return total;
      });

    // const expenseTotal = await Expense.find({
    //   isDeleted: false,
    //   date: { $gte: startDate, $lt: endDate },
    //   relatedBranch: relatedBranch,
    // }).then((result) => {
    //   if (result) {
    //     const total = result.reduce((accumulator, currentValue) => {
    //       return accumulator + currentValue.finalAmount;
    //     }, 0);
    //     return total;
    //   }
    //   return 0;
    // });

    // const { tsType, ...queryTreatmentVoucher } = queryMedicineTotal;
    // queryTreatmentVoucher.tsType = "TSMulti";
    // const TVFirstCashTotal = await TreatmentVoucher.find(queryTreatmentVoucher)
    //   .populate("secondAccount")
    //   .then((result) => {
    //     //    console.log(result)
    //   });

    // //query only cash TSMulti by second
    // let queryTreatmentVoucher2 = {
    //   isDeleted: false,
    //   createdAt: { $gte: startDate, $lt: endDate },
    //   secondAccount: { $exists: true },
    //   relatedBranch: relatedBranch,
    //   tsType: "TSMulti",
    // };
    // const TVSecondCashTotal = await TreatmentVoucher.find(
    //   queryTreatmentVoucher2
    // )
    //   .populate({
    //     path: "secondAccount",
    //     populate: {
    //       path: "relatedHeader",
    //     },
    //   })
    //   .then((result) => {
    //     //   return res.status(200).send({data:result})
    //     const total = result.reduce(
    //       (accumulator, currentValue) => {
    //         if (
    //           currentValue.secondAccount.relatedHeader.name === "Cash In Hand"
    //         ) {
    //           return accumulator + currentValue.secondAmount;
    //         } else {
    //           return accumulator;
    //         }
    //       },

    //       0
    //     );

    //     return total;
    //   });

    //query first cash combined vocucher
    let queryCombineTreatmentVoucher = {
      Refund: false,
      isDeleted: false,
      createdAt: { $gte: startDate, $lt: endDate },
      relatedCash: { $exists: true },
      relatedBranch: relatedBranch,
      tsType: "Combined",
    };

    const combinedSaleFristCashTotal = await TreatmentVoucher.find(
      queryCombineTreatmentVoucher
    )
      .populate("secondAccount")
      .then((result) => {
        //    console.log(result)
        if (result) {
          const total = result.reduce((accumulator, currentValue) => {
            return (
              accumulator +
              currentValue.totalPaidAmount +
              currentValue.msPaidAmount
            );
          }, 0);
          return total;
        }
        return 0;
      });

    //query second cash combined voucher
    let queryCombineTreatmentVoucher2 = {
      Refund: false,
      isDeleted: false,
      createdAt: { $gte: startDate, $lt: endDate },
      secondAccount: { $exists: true },
      relatedBranch: relatedBranch,
      tsType: "Combined",
    };

    const combinedSaleSecondCashTotal = await TreatmentVoucher.find(
      queryCombineTreatmentVoucher2
    )
      .populate({
        path: "secondAccount",
        populate: {
          path: "relatedHeader",
        },
      })
      .then((cmResult) => {
        //   return res.status(200).send({data:result})
        const total = cmResult.reduce(
          (accumulator, currentValue) => {
            if (
              currentValue.secondAccount.relatedHeader.name === "Cash In Hand"
            ) {
              return accumulator + currentValue.secondAmount;
            } else {
              return accumulator;
            }
          },

          0
        );

        return total;
      });

    const incomeTotal = await Income.find({
      date: { $gte: startDate, $lt: endDate },
      relatedBranch: relatedBranch,
    }).then((result) => {
      if (result) {
        const total = result.reduce((accumulator, currentValue) => {
          return accumulator + currentValue.finalAmount;
        }, 0);
        return total;
      }
      return 0;
    });

    //Repay
    const totalRepay = await totalRepayFunction({
      relatedBranch: relatedBranch,
      repaymentDate: {
        $gte: moment.tz("Asia/Yangon").format(startDate.toISOString()),
        $lt: moment.tz("Asia/Yangon").format(endDate.toISOString()),
      },
    });

    console.log("Final Data", {
      transferBalances: type === "Opening" ? transferBalance : 0,
    });

    return res.status(200).send({
      success: true,
      openingTotal: openingTotal,
      medicineSaleFirstCashTotal:
        type === "Opening" ? medicineSaleFirstCashTotal : 0,
      medicineSaleSecondCashTotal:
        type === "Opening" ? medicineSaleSecondCashTotal : 0,
      combinedSaleFristCashTotal:
        type === "Opening" ? combinedSaleFristCashTotal : 0,
      combinedSaleSecondCashTotal:
        type === "Opening" ? combinedSaleSecondCashTotal : 0,
      expenseTotal: type === "Opening" ? expenseTotal : 0,
      TVFirstCashTotal: type === "Opening" ? TVFirstCashTotal : 0,
      TVSecondCashTotal: type === "Opening" ? TVSecondCashTotal : 0,
      incomeTotal: type === "Opening" ? incomeTotal : 0,
      transferBalances: type === "Closing" ? transferBalance : 0,
      total:
        type === "Opening"
          ? medicineSaleFirstCashTotal +
            medicineSaleSecondCashTotal +
            TVFirstCashTotal +
            TVSecondCashTotal +
            combinedSaleFristCashTotal +
            combinedSaleSecondCashTotal +
            incomeTotal +
            openingTotal +
            totalRepay.cashTotal
          : 0,
      closingCash:
        type === "Opening"
          ? medicineSaleFirstCashTotal +
            medicineSaleSecondCashTotal +
            TVFirstCashTotal +
            TVSecondCashTotal +
            combinedSaleFristCashTotal +
            combinedSaleSecondCashTotal +
            incomeTotal +
            openingTotal +
            totalRepay.cashTotal -
            (expenseTotal + transferBalance)
          : 0,
      totalRepay: totalRepay,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.getOpeningAndClosingCashAndBankWithExactData = async (req, res) => {
  let { exactDate, relatedBranch, type } = req.query;

  try {
    const date = new Date(exactDate);
    const startDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds()
    ); // Set start date to the beginning of the day

    const endDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1,
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds()
    ); // Set end date to the beginning of the next day

    const AccountQuery = {
      isDeleted: false,
      relatedBranch,
      type: type,
      date: { $gte: startDate, $lt: endDate },
    };

    const accountLatestDocument = await AccountBalance.find(AccountQuery)
      .sort({ _id: -1 })
      .limit(1);

    const AccountClosingQueryData = {
      isDeleted: false,
      relatedBranch,
      type: "Closing",
      date: { $gte: startDate, $lt: endDate },
    };

    const accountClosingLatestDocument = await AccountBalance.find(
      AccountClosingQueryData
    )
      .sort({ _id: -1 })
      .limit(1);

    let AccountOpeningTotal =
      accountLatestDocument.length != 0 &&
      accountLatestDocument[0].type === "Opening"
        ? accountLatestDocument[0].amount
        : 0;

    let AccountTransferBalance =
      accountClosingLatestDocument.length !== 0
        ? accountClosingLatestDocument[0].transferAmount
        : 0;

    // Fetching cash and bank entries from TreatmentVouchers and Expenses
    const medicineSaleQuery = {
      Refund: false,
      isDeleted: false,
      tsType: "MS",
      relatedCash: { $exists: true },
      relatedBank: { $exists: true },
      relatedBranch,
      createdAt: { $gte: startDate, $lt: endDate },
    };

    // Calculate cash totals
    const cashMedicineSaleFirstTotal = await TreatmentVoucher.find(
      medicineSaleQuery
    ).then((msResult) => {
      if (msResult) {
        const msTotal = msResult.reduce((accumulator, currentValue) => {
          return accumulator + currentValue.msPaidAmount;
        }, 0);
        return msTotal;
      }
      return 0;
    });

    const cashMedicineSaleSecondTotal = await TreatmentVoucher.find({
      ...medicineSaleQuery,
      relatedCash: { $exists: true },
      relatedBank: { $exists: false },
      secondAccount: { $exists: true },
    })
      .populate({ path: "secondAccount", populate: { path: "relatedHeader" } })
      .then((msResult) => {
        const total = msResult.reduce(
          (accumulator, currentValue) => {
            if (
              currentValue.secondAccount.relatedHeader.name === "Cash In Hand"
            ) {
              return accumulator + currentValue.secondAmount;
            } else {
              return accumulator;
            }
          },

          0
        );

        return total;
      });

    // Calculate bank totals
    const bankMedicineSaleSecondTotal = await TreatmentVoucher.find({
      ...medicineSaleQuery,
      secondAccount: { $exists: true },
    }).then((msResult) =>
      msResult.reduce((acc, curVal) => {
        if (curVal.paymentType === "Bank") {
          return acc + (curVal.totalAmount || 0);
        }
        return acc;
      }, 0)
    );

    const expenseTotal = await Expense.find({
      isDeleted: false,
      date: { $gte: startDate, $lt: endDate },
      relatedBranch: relatedBranch,
    }).then((result) => {
      if (result) {
        const total = result.reduce((accumulator, currentValue) => {
          return accumulator + currentValue.finalAmount;
        }, 0);
        return total;
      }
      return 0;
    });

    // Calculate cash from Treatment Vouchers
    const TVFirstCashTotal = await TreatmentVoucher.find({
      isDeleted: false,
      createdAt: { $gte: startDate, $lt: endDate },
      relatedBranch,
      tsType: "TSMulti",
    })
      .populate("secondAccount")
      .then((result) => {
        if (result) {
          const total = result.reduce((accumulator, currentValue) => {
            return accumulator + currentValue.totalPaidAmount;
          }, 0);
          return total;
        }
        return 0;
      });

    const TVSecondCashTotal = await TreatmentVoucher.find({
      isDeleted: false,
      createdAt: { $gte: startDate, $lt: endDate },
      secondAccount: { $exists: true },
      relatedBranch,
      tsType: "TSMulti",
    })
      .populate({ path: "secondAccount", populate: { path: "relatedHeader" } })
      .then((result) =>
        result.reduce((acc, curVal) => {
          if (curVal.secondAccount.relatedHeader.name === "Cash In Hand") {
            return acc + curVal.secondAmount;
          }
          return acc;
        }, 0)
      );

    // Calculate bank from Treatment Vouchers
    const TVSecondBankTotal = await TreatmentVoucher.find({
      isDeleted: false,
      createdAt: { $gte: startDate, $lt: endDate },
      secondAccount: { $exists: true },
      relatedBranch,
      tsType: "TSMulti",
    })
      .populate({ path: "secondAccount", populate: { path: "relatedHeader" } })
      .then((result) =>
        result.reduce((acc, curVal) => {
          if (curVal.secondAccount.relatedHeader.name === "Bank") {
            return acc + curVal.secondAmount;
          }
          return acc;
        }, 0)
      );

    return res.status(200).send({
      success: true,
      openingTotal: AccountOpeningTotal,
      cashMedicineSaleFirstTotal:
        type === "Opening" ? cashMedicineSaleFirstTotal : 0,
      cashMedicineSaleSecondTotal:
        type === "Opening" ? cashMedicineSaleSecondTotal : 0,
      bankMedicineSaleSecondTotal:
        type === "Opening" ? bankMedicineSaleSecondTotal : 0,
      expenseTotal: type === "Opening" ? expenseTotal : 0,
      TVFirstCashTotal: type === "Opening" ? TVFirstCashTotal : 0,
      TVSecondCashTotal: type === "Opening" ? TVSecondCashTotal : 0,
      TVSecondBankTotal: type === "Opening" ? TVSecondBankTotal : 0,
      transferBalances: type === "Closing" ? AccountTransferBalance : 0,
      total:
        type === "Opening"
          ? cashMedicineSaleFirstTotal +
            cashMedicineSaleSecondTotal +
            TVFirstCashTotal +
            TVSecondCashTotal +
            AccountOpeningTotal
          : 0,
      closingCash:
        type === "Opening"
          ? cashMedicineSaleFirstTotal +
            cashMedicineSaleSecondTotal +
            TVFirstCashTotal +
            TVSecondCashTotal +
            AccountOpeningTotal -
            (expenseTotal + AccountTransferBalance)
          : 0,
      closingBank:
        type === "Opening"
          ? bankMedicineSaleSecondTotal + TVSecondBankTotal
          : 0,
    });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.knasGetOpeningAndClosingWithExactDate = async (req, res) => {
  let { exact, relatedBranch, type, relatedAccounting } = req.query;

  try {
    const date = new Date(exact);
    const startDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds()
    ); // Set start date to the beginning of the day
    const endDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1,
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds()
    ); // Set end date to the beginning of the next day
    const query = {
      isDeleted: false,
      relatedBranch: relatedBranch,
      relatedAccounting: relatedAccounting,
      type: type,
      date: { $gte: startDate, $lt: endDate },
    };
    const latestDocument = await AccountBalance.find(query)
      .sort({ _id: -1 })
      .limit(1);
    // console.log(latestDocument,"getOpening")
    let openingTotal =
      latestDocument.length != 0 && latestDocument[0].type === "Opening"
        ? latestDocument[0].amount
        : 0;
    let transferBalance =
      latestDocument.length != 0 && latestDocument[0].type === "Closing"
        ? latestDocument[0].transferAmount
        : 0;
    // console.log(startDate, endDate)
    let queryMedicineTotal = {
      Refund: false,
      isDeleted: false,
      relatedCash: { $exists: true },
      relatedBranch: relatedBranch,
      createdAt: { $gte: startDate, $lt: endDate },
    };
    // //createdAt: { $gte: startDate, $lt: endDate },
    // //relatedCash exists by Oakar Kyaw
    const medicineSaleFirstCashTotal = await kmaxVoucher
      .find(queryMedicineTotal)
      .then((msResult) => {
        console.log("ms result i s " + msResult);
        if (msResult) {
          const msTotal = msResult.reduce((accumulator, currentValue) => {
            return accumulator + currentValue.paidAmount;
          }, 0);
          return msTotal;
        }
        return 0;
      });
    //secondAccount cash exists
    const { relatedCash, ...query2 } = queryMedicineTotal;
    query2.secondAccount = { $exists: true };
    const medicineSaleSecondCashTotal = await kmaxVoucher
      .find(query2)
      .populate({
        path: "secondAccount",
        populate: {
          path: "relatedHeader",
        },
      })
      .then((msResult) => {
        console.log("medicine second cash total is ", msResult);
        //   return res.status(200).send({data:msResult})
        const total = msResult.reduce(
          (accumulator, currentValue) => {
            if (
              currentValue.secondAccount.relatedHeader.name === "Cash In Hand"
            ) {
              return accumulator + currentValue.secondAmount;
            } else {
              return accumulator;
            }
          },

          0
        );

        return total;
      });

    const expenseTotal = await Expense.find({
      isDeleted: false,
      date: { $gte: startDate, $lt: endDate },
      relatedBranch: relatedBranch,
    }).then((result) => {
      if (result) {
        console.log("expense result is ", result);
        const total = result.reduce((accumulator, currentValue) => {
          return accumulator + currentValue.finalAmount;
        }, 0);
        return total;
      }
      return 0;
    });

    const incomeTotal = await Income.find({
      date: { $gte: startDate, $lt: endDate },
      relatedBranch: relatedBranch,
    }).then((result) => {
      if (result) {
        const total = result.reduce((accumulator, currentValue) => {
          return accumulator + currentValue.finalAmount;
        }, 0);
        return total;
      }
      return 0;
    });
    //Repay
    const totalRepay = await totalRepayFunction({
      relatedBranch: relatedBranch,
      repaymentDate: {
        $gte: moment.tz("Asia/Yangon").format(startDate.toISOString()),
        $lt: moment.tz("Asia/Yangon").format(endDate.toISOString()),
      },
    });
    // console.log('Final Data',({transferBalances: type === "Opening" ? transferBalance: 0 }))
    return res.status(200).send({
      success: true,
      openingTotal: openingTotal,
      medicineSaleFirstCashTotal:
        type === "Opening" ? medicineSaleFirstCashTotal : 0,
      medicineSaleSecondCashTotal:
        type === "Opening" ? medicineSaleSecondCashTotal : 0,
      expenseTotal: type === "Opening" ? expenseTotal : 0,
      incomeTotal: type === "Opening" ? incomeTotal : 0,
      transferBalances: type === "Closing" ? transferBalance : 0,
      total:
        type === "Opening"
          ? medicineSaleFirstCashTotal +
            medicineSaleSecondCashTotal +
            incomeTotal +
            openingTotal
          : 0,
      closingCash:
        type === "Opening"
          ? medicineSaleFirstCashTotal +
            medicineSaleSecondCashTotal +
            incomeTotal +
            openingTotal -
            expenseTotal
          : 0,
      totalRepay: totalRepay,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.getClosing = async (req, res) => {
  try {
    const query = {
      relatedAccounting: req.query.relatedAccounting,
      type: req.query.type,
    };
    const sort = { _id: -1 }; // Sort by descending _id to get the latest document
    console.log(query, sort, "here");
    const latestDocument = await AccountBalance.findOne(query, null, { sort });
    console.log(latestDocument);
    if (latestDocument === null)
      return res.status(404).send({ error: true, message: "Not Found!" });
    const result = await AccountBalance.find({
      _id: latestDocument._id,
    }).populate("relatedAccounting");
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};
