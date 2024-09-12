"use strict";

const generalItem = require("../models/generalItem");
const medicineItem = require("../models/medicineItem");
const procedureItem = require("../models/procedureItem");
const stock = require("../models/stock");
const stockOpeningClosingModel = require("../models/stockOpeningClosing");

exports.getStockSummaryByQty = async (req, res, next) => {
  const { skip = 1, limit = 20, relatedBranch } = req.query;

  let count = 0;
  let page = 0;

  let StockModelMatch = {
    $or: [
      { finalQty: { $gt: 0 } },
      { currentQty: { $gt: 0 } },
      { totalUnit: { $gt: 0 } },
    ],
    isDeleted: false,
  };

  if (relatedBranch) {
    StockModelMatch.relatedBranch = relatedBranch;
  }

  const pageDivision = count / limit;
  page = Math.ceil(pageDivision);

  try {
    const stockSummary = await stock.aggregate([
      { $match: StockModelMatch },
      {
        $lookup: {
          from: "branches",
          localField: "relatedBranch",
          foreignField: "_id",
          as: "relatedBranches",
        },
      },
      {
        $lookup: {
          from: "medicineitems",
          localField: "relatedMedicineItems",
          foreignField: "_id",
          as: "relatedMedicineItemsData",
        },
      },
      { $unwind: "$relatedBranches" },
      { $unwind: "$relatedMedicineItemsData" },
      {
        $group: {
          _id: "$_id",
          openingStock: { $sum: "$currentQty" },
          relatedBranches: { $push: "$relatedBranches" },
          relatedMedicineItemsData: { $push: "$relatedMedicineItemsData" },
          fromUnit: { $first: "$fromUnit" },
          toUnit: { $first: "$toUnit" },
          totalUnit: { $first: "$totalUnit" },
        },
      },
      {
        $project: {
          _id: 1,
          openingStock: 1,
          relatedBranches: 1,
          relatedMedicineItemsData: 1,
          fromUnit: 1,
          toUnit: 1,
          totalUnit: 1,
        },
      },
    ]);

    const StockModelCount = await stock.find(StockModelMatch).count();

    return res.status(200).json({
      success: true,
      StockCounts: StockModelCount,
      _metadata: {
        current_page: skip / limit + 1,
        per_page: limit,
        page_count: page,
        total_count: count,
      },
      existsStockSchema: stockSummary,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
