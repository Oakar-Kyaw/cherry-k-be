"use strict";

const generalItem = require("../models/generalItem");
const medicineItem = require("../models/medicineItem");
const procedureItem = require("../models/procedureItem");
const moment = require("moment-timezone");
const stock = require("../models/stock");

exports.getOpeningClosingStock = async (req, res) => {
  const {
    relatedBranch,
    relatedGeneralItems,
    relatedProcedureItems,
    relatedMedicineItems,
    relatedAccessoryItems,
  } = req.query;

  const Date = moment.tz("Asia/Yangon").startOf("day").format();
  const nextDate = moment
    .tz(Date, "Asia/Yangon")
    .add(1, "days")
    .startOf("day")
    .format();

  let query = {
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

  const stockItems = await stock.find(query);

  for (const item of stockItems) {
  }

  return res.status(200).json({ stockItems });
};
