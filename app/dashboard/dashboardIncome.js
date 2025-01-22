const IncomeModel = require("../models/income");
const TreatmentVoucherModel = require("../models/treatmentVoucher");
const RepaymentModel = require("../models/repayment");
const ExpenseModel = require("../models/expense");
const mongoose = require("mongoose");

const dashboardIncome = async (startDate, endDate, relatedBranch) => {
  try {
    const matchStage = {
      isDeleted: false,
      date: {
        $gte: new Date(new Date(startDate).setUTCHours(0, 0, 0, 0)),
        $lte: new Date(new Date(endDate).setUTCHours(23, 59, 59, 999)),
      },
      relatedBranch: new mongoose.Types.ObjectId(relatedBranch),
    };

    const income = await IncomeModel.aggregate([
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: "$relatedBranch",
          totalIncome: { $sum: "$finalAmount" },
        },
      },
    ]);

    return income;
  } catch (error) {
    console.error("Error on dashboardIncome", error);
    throw new Error(error);
  }
};

const getIncomeExpenseReports = async (relatedBranch, year) => {
  if (!year) {
    return { error: "Year is required" };
  }

  if (!relatedBranch) {
    return { error: "Branch is required" };
  }

  const incomeByMonth = [];
  const branchId = new mongoose.Types.ObjectId(relatedBranch);

  for (let month = 0; month < 12; month++) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const startOfMonth = new Date(startDate.setUTCHours(0, 0, 0, 0));
    const endOfMonth = new Date(endDate.setUTCHours(23, 59, 59, 999));

    const matchStage = {
      isDeleted: false,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      relatedBranch: branchId,
      tsType: { $in: ["TSMulti", "MS"] },
    };

    const [voucherResults, repaymentResults, expenseResults] =
      await Promise.all([
        TreatmentVoucherModel.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: null,
              totalAmount: {
                $sum: { $add: ["$totalPaidAmount", "$msPaidAmount"] },
              },
            },
          },
        ]),
        RepaymentModel.aggregate([
          {
            $match: {
              isDeleted: false,
              repaymentDate: { $gte: startOfMonth, $lte: endOfMonth },
              relatedBranch: branchId,
            },
          },
          {
            $group: {
              _id: null,
              totalCashRepayments: { $sum: "$SeperateCashAmount" },
              totalBankRepayments: {
                $sum: {
                  $add: ["$SeperateBankAmount", "$SecondSeperateBankAmount"],
                },
              },
            },
          },
        ]),
        ExpenseModel.aggregate([
          {
            $match: {
              isDeleted: false,
              date: { $gte: startOfMonth, $lte: endOfMonth },
              relatedBranch: branchId,
            },
          },
          {
            $group: {
              _id: null,
              totalExpense: { $sum: "$finalAmount" },
            },
          },
        ]),
      ]);

    const totalIncome =
      voucherResults.length > 0 ? voucherResults[0].totalAmount : 0;
    const totalCashRepayments =
      repaymentResults.length > 0 ? repaymentResults[0].totalCashRepayments : 0;
    const totalBankRepayments =
      repaymentResults.length > 0 ? repaymentResults[0].totalBankRepayments : 0;
    const totalExpenses =
      expenseResults.length > 0 ? expenseResults[0].totalExpense : 0;

    incomeByMonth.push({
      month: month + 1,
      totalIncome,
      totalCashRepayments,
      totalBankRepayments,
      totalExpenses,
      totalOverallIncome:
        totalIncome + totalCashRepayments + totalBankRepayments - totalExpenses,
    });
  }

  return incomeByMonth;
};

module.exports = {
  dashboardIncome,
  getIncomeExpenseReports,
};
