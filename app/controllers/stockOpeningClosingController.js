"use strict";

const generalItem = require("../models/generalItem");
const medicineItem = require("../models/medicineItem");
const procedureItem = require("../models/procedureItem");
const moment = require("moment-timezone");
const stock = require("../models/stock");
const stockOpeningClosing = require("../models/stockOpeningClosing");

exports.getOpeningClosingStock = async (req, res) => {
  let count = 0;
  let page = 0;

  const {
    relatedBranch,
    relatedGeneralItems,
    relatedProcedureItems,
    relatedMedicineItems,
    relatedAccessoryItems,
    limit = 20,
    skip = 1,
  } = req.query;

  const StartDate = moment.tz("Asia/Yangon").startOf("day").toDate();
  // const nextDate = moment
  //   .tz(Date, "Asia/Yangon")
  //   .add(1, "days")
  //   .endOf("day")
  //   .format();

  const nextDate = moment.tz("Asia/Yangon").endOf("day").toDate();

  let query = {
    date: {
      $gte: StartDate,
      $lt: nextDate,
    },
    isDeleted: false,
  };

  relatedBranch ? (query.relatedBranch = relatedBranch) : "";
  relatedGeneralItems ? (query.relatedGeneralItems = relatedGeneralItems) : "";
  relatedProcedureItems
    ? (query.relatedProcedureItems = relatedProcedureItems)
    : "";
  relatedMedicineItems
    ? (query.relatedMedicineItems = relatedMedicineItems)
    : "";
  relatedAccessoryItems
    ? (query.relatedAccessoryItems = relatedAccessoryItems)
    : "";

  // const stockItems = await stock.find(query);

  // for (const item of stockItems) {
  //   const {
  //     relatedBranch,
  //     relatedAccessoryItems,
  //     relatedGeneralItems,
  //     relatedProcedureItems,
  //     relatedMedicineItems,
  //   } = item;

  //   const totalItems =
  //     (relatedGeneralItems || 0) +
  //     (relatedProcedureItems || 0) +
  //     (relatedMedicineItems || 0) +
  //     (relatedAccessoryItems || 0);

  //   return {
  //     relatedBranch,
  //     relatedGeneralItems,
  //     relatedProcedureItems,
  //     relatedMedicineItems,
  //     relatedAccessoryItems,
  //     totalItems,
  //   };
  // }

  const pageDivision = count / limit;
  page = Math.ceil(pageDivision);

  try {
    const stockItems = await stock
      .find(query)
      .skip((skip - 1) * limit)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      count: count,
      _metadata: {
        current_page: skip / limit + 1,
        per_page: limit,
        page_count: page,
        total_count: count,
      },
      stockItems,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getStockSummaryByDate = async (req, res, next) => {
  const { relatedBranch } = req.query;

  const StartDate = moment.tz("Asia/Yangon").startOf("day").toDate();
  const nextDate = moment.tz("Asia/Yangon").endOf("day").toDate();

  let match = {
    date: {
      $gte: StartDate,
      $lt: nextDate,
    },
    isDeleted: false,
  };

  if (relatedBranch) {
    match.relatedBranch = relatedBranch;
  }

  try {
    const stockSummary = await stock.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$relatedBranch",
          openingStock: { $sum: "$openingStock" },
          closingStock: { $sum: "$closingStock" },
          purchaseStock: { $sum: "$purchaseStock" },
          transferStock: { $sum: "$transferStock" },
        },
      },
    ]);

    return res.status(200).json({ success: true, data: stockSummary });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
