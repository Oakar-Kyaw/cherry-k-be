const mongoose = require("mongoose");
const TreatmentVoucherModel = require("../models/treatmentVoucher");

const getTop20Customers = async (
  startDate,
  endDate,
  relatedBranch,
  treatmentType = "treatment"
) => {
  const fieldMapping = {
    treatment: "multiTreatment",
    package: "relatedTreatmentPackage",
    dental: "multiDentalTreatment",
  };

  const treatmentField =
    fieldMapping[treatmentType] || fieldMapping["treatment"];

  if (!mongoose.Types.ObjectId.isValid(relatedBranch)) {
    throw new Error("Invalid branch ID format");
  }

  const matchStage = {
    isDeleted: false,
    createdAt: {
      $gte: new Date(new Date(startDate).setUTCHours(0, 0, 0, 0)),
      $lte: new Date(new Date(endDate).setUTCHours(23, 59, 59, 999)),
    },
    totalPaidAmount: { $gt: 0 },
    relatedBranch: new mongoose.Types.ObjectId(relatedBranch),
    relatedPatient: { $exists: true },
  };

  const topCustomers = await TreatmentVoucherModel.aggregate([
    { $match: matchStage },
    { $unwind: `$${treatmentField}` },
    {
      $group: {
        _id: "$relatedPatient",
        totalSpent: { $sum: "$totalPaidAmount" },
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 20 },
    {
      $lookup: {
        from: "patients",
        localField: "_id",
        foreignField: "_id",
        as: "customerDetails",
      },
    },
    { $unwind: "$customerDetails" },
    {
      $project: {
        name: "$customerDetails.name",
        totalSpent: 1,
      },
    },
  ]);

  return topCustomers;
};

module.exports = {
  getTop20Customers,
};
