const ExpenseModel = require("../models/expense");
const mongoose = require("mongoose");

const dashboardExpense = async (startDate, endDate, relatedBranch) => {
  try {
    const matchStage = {
      isDeleted: false,
      date: {
        $gte: new Date(new Date(startDate).setUTCHours(0, 0, 0, 0)),
        $lte: new Date(new Date(endDate).setUTCHours(23, 59, 59, 999)),
      },
      relatedBranch: new mongoose.Types.ObjectId(relatedBranch),
    };

    const expense = await ExpenseModel.aggregate([
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: "$relatedBranch",
          totalExpense: { $sum: "$finalAmount" },
        },
      },
    ]);

    return expense;
  } catch (error) {
    console.error("Error on dashboardExpense", error);
    throw new Error(error);
  }
};

module.exports = {
  dashboardExpense,
};
