const moment = require("moment-timezone");
const TreatmentVoucher = require("../models/treatmentVoucher");

exports.filterByQueryParams = (queryParams) => {
  let query = {
    relatedBank: { $exists: true },
    isDeleted: false,
    relatedBranch: { $exists: true },
  };

  const {
    startDate,
    endDate,
    createdBy,
    purchaseType,
    relatedDoctor,
    bankType,
    tsType,
    relatedPatient,
    bankID,
    relatedBranch,
    income,
  } = queryParams;

  if (startDate && endDate)
    query.createdAt = { $gte: startDate, $lte: endDate };
  if (relatedPatient) query.relatedPatient = relatedPatient;
  if (bankType) query.bankType = bankType;
  if (createdBy) query.createdBy = createdBy;
  if (tsType) query.tsType = tsType;
  if (bankID) query.relatedBank = bankID;
  if (purchaseType) query.purchaseType = purchaseType;
  if (relatedDoctor) query.relatedDoctor = relatedDoctor;
  if (relatedBranch) query.relatedBranch = relatedBranch;

  return query;
};

exports.populateResults = async (query, skipIndex, limitNumber) => {
  return TreatmentVoucher.find({ ...query, Refund: false })
    .populate(
      "medicineItems.item_id multiTreatment.item_id relatedTreatment relatedBranch relatedDoctor relatedBank relatedCash relatedPatient relatedAccounting payment createdBy newTreatmentVoucherId relatedRepay"
    )
    .populate({
      path: "relatedTreatmentSelection",
      populate: [
        {
          path: "relatedAppointments",
          populate: {
            path: "relatedDoctor",
            model: "Doctors",
          },
        },
        {
          path: "relatedTreatment",
          model: "Treatments",
        },
      ],
    })
    .populate({
      path: "secondAccount",
      model: "AccountingLists",
      populate: {
        path: "relatedHeader",
        model: "AccountHeaders",
      },
    })
    .populate({
      path: "relatedTreatmentPackage",
      populate: {
        path: "item_id",
      },
    })
    .skip(skipIndex)
    .limit(limitNumber);
};

exports.getTotalItems = async (query) => {
  return TreatmentVoucher.countDocuments(query);
};

exports.calculateTotals = (resultArray) => {
  let totals = resultArray.reduce(
    (totals, sale) => {
      const totalAmount =
        (sale.paidAmount || 0) +
        (sale.msPaidAmount || 0) +
        (sale.totalPaidAmount || 0) +
        (sale.psPaidAmount || 0);

      totals.cash +=
        sale.secondAccount?.relatedHeader.name === "Cash In Hand"
          ? sale.secondAmount || 0
          : 0;
      totals.bank +=
        sale.secondAccount?.relatedHeader.name === "Cash At Bank"
          ? sale.secondAmount || 0
          : 0;

      return totals;
    },
    { cash: 0, bank: 0 }
  );

  return totals;
};

// More helper functions to handle specific parts of the process, like cash/bank calculations, repayments, etc.
