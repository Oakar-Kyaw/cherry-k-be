const mongoose = require("mongoose");
const TreatmentVoucherModel = require("../models/treatmentVoucher");

const getTop20Treatment = async (
  startDate,
  endDate,
  relatedBranch,
  treatmentType = "treatment"
) => {
  let fieldMapping = {
    treatment: "multiTreatment",
    package: "relatedTreatmentPackage",
    dental: "multiDentalTreatment",
  };

  const treatmentField =
    fieldMapping[treatmentType] || fieldMapping["treatment"];

  if (!mongoose.Types.ObjectId.isValid(relatedBranch)) {
    throw new Error("Invalid branch ID format");
  }

  const topTreatment = await TreatmentVoucherModel.aggregate([
    {
      $match: {
        isDeleted: false,
        createdAt: {
          $gte: new Date(new Date(startDate).setUTCHours(0, 0, 0, 0)),
          $lte: new Date(new Date(endDate).setUTCHours(23, 59, 59, 999)),
        },
        relatedBranch: new mongoose.Types.ObjectId(relatedBranch),
      },
    },
    { $unwind: `$${treatmentField}` },
    {
      $group: {
        _id: `$${treatmentField}.item_id`,
        qty: { $sum: `$${treatmentField}.qty` },
      },
    },
    { $sort: { qty: -1 } },
    { $limit: 20 },
    {
      $lookup: {
        from:
          treatmentType === "package"
            ? "treatmentpackages"
            : treatmentType === "dental"
            ? "dentaltreatments"
            : "treatments",
        localField: "_id",
        foreignField: "_id",
        as: "treatmentDetails",
      },
    },
    { $unwind: "$treatmentDetails" },
    {
      $project: {
        name: "$treatmentDetails.name",
        qty: 1,
      },
    },
  ]);

  return topTreatment;
};

module.exports = {
  getTop20Treatment,
};
