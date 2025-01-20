const { mongoose } = require("mongoose");
const TreatmentVoucherModel = require("../models/treatmentVoucher");

const getTop20Medicines = async (
  startDate,
  endDate,
  relatedBranch,
  category,
  subCategory
) => {
  let categoryFilter = {};

  if (category) {
    categoryFilter["medicineListDetails.relatedCategory"] =
      new mongoose.Types.ObjectId(category);
  }

  if (subCategory) {
    categoryFilter["medicineListDetails.relatedSubCategory"] =
      new mongoose.Types.ObjectId(subCategory);
  }

  const topMedicine = await TreatmentVoucherModel.aggregate([
    {
      $match: {
        isDeleted: false,
        createdAt: {
          $gte: new Date(new Date(startDate).setUTCHours(0, 0, 0, 0)),
          $lte: new Date(new Date(endDate).setUTCHours(23, 59, 59, 999)),
        },
        "medicineItems.item_id": { $exists: true },
        relatedBranch: new mongoose.Types.ObjectId(relatedBranch),
        tsType: "MS",
      },
    },
    { $unwind: "$medicineItems" },
    {
      $lookup: {
        from: "medicineitems",
        localField: "medicineItems.item_id",
        foreignField: "_id",
        as: "medicineItemDetails",
      },
    },
    { $unwind: "$medicineItemDetails" },
    {
      $lookup: {
        from: "medicinelists",
        localField: "medicineItemDetails.name",
        foreignField: "_id",
        as: "medicineListDetails",
      },
    },
    { $unwind: "$medicineListDetails" },
    {
      $match: categoryFilter,
    },
    {
      $group: {
        _id: "$medicineItems.item_id",
        qty: { $sum: "$medicineItems.qty" },
      },
    },
    { $sort: { qty: -1 } },
    { $limit: 20 },
    {
      $lookup: {
        from: "medicineitems",
        localField: "_id",
        foreignField: "_id",
        as: "medicineDetails",
      },
    },
    { $unwind: "$medicineDetails" },
    {
      $project: {
        name: "$medicineDetails.medicineItemName",
        qty: 1,
      },
    },
  ]);

  return topMedicine;
};

module.exports = {
  getTop20Medicines,
};
