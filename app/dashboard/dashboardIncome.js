const IncomeModel = require("../models/income");
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

module.exports = {
  dashboardIncome,
};
