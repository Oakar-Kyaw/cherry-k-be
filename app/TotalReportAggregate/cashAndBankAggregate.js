const repaymentModel = require("../models/repayment");
const moment = require("moment-timezone");

// Aggregate Repayment With Cash And Bank
exports.AggregateRepayment = async (req, res) => {
  let aggregateMatch = {
    isDeleted: false,
    $or: [{ repaymentType: "full" }, { repaymentType: "separate" }],
    repaymentAmount: { $gt: 0 },
  };

  try {
    const repaymentReport = await repaymentModel.aggregate([
      {
        $match: aggregateMatch,
      },

      {
        $lookup: {
          from: "branches",
          localField: "relatedBranch",
          foreignField: "_id",
          as: "relatedBranchData",
        },
      },

      {
        $unwind: {
          path: "$relatedBranchData",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "patients",
          localField: "relatedPatient",
          foreignField: "_id",
          as: "relatedPatientData",
        },
      },

      {
        $unwind: {
          path: "$relatedPatientData",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "accountinglists",
          localField: "relatedBank",
          foreignField: "_id",
          as: "relatedBankData",
        },
      },

      {
        $unwind: {
          path: "$relatedBankData",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "accountinglists",
          localField: "secondRelatedBank",
          foreignField: "_id",
          as: "secondRelatedBankData",
        },
      },

      {
        $unwind: {
          path: "$secondRelatedBankData",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "accountinglists",
          localField: "relatedCash",
          foreignField: "_id",
          as: "relatedCashData",
        },
      },

      {
        $unwind: {
          path: "$relatedCashData",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "accountinglists",
          localField: "secondRelatedCash",
          foreignField: "_id",
          as: "secondRelatedCashData",
        },
      },

      {
        $unwind: {
          path: "$secondRelatedCashData",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $group: {
          _id: null,
          bankAmount: {
            $push: {
              bankName: {
                $ifNull: [
                  "$relatedBankData.name",
                  "$secondRelatedBankData.name",
                ],
              },
              amount: {
                $ifNull: [
                  {
                    $add: ["$SeperateBankAmount", "$SecondSeperateBankAmount"],
                  },
                  0,
                ],
              },
            },
          },

          cashAmount: {
            $push: {
              bankName: {
                $ifNull: [
                  "$relatedCashData.name",
                  "$secondRelatedCashData.name",
                ],
              },
              amount: {
                $ifNull: [
                  {
                    $add: ["$SeperateCashAmount"],
                  },
                  0,
                ],
              },
            },
          },

          totalBankAmount: {
            $sum: {
              $ifNull: [
                { $add: ["$SeperateBankAmount", "$SecondSeperateBankAmount"] },
                0,
              ],
            },
          },

          totalCashAmount: {
            $sum: {
              $ifNull: [{ $add: ["$SeperateCashAmount"] }, 0],
            },
          },

          // totalRepaymentAmount: {
          //   $sum: ["$totalBankAmount", "$totalCashAmount"],
          // },
        },
      },

      {
        $project: {
          _id: 0,
          patientName: "$relatedPatientData.name",
          relatedBankName: "$relatedBankData.name",
          secondRelatedBankName: "$secondRelatedBankData.name",
          relatedCashName: "$relatedCashData.name",
          secondRelatedCashName: "$secondRelatedCashData.name",
          branchName: "$relatedBranchData.name",
          repaymentAmount: 1,
          firstRepayAmount: 1,
          secondRepayAmount: 1,
          SeperateBankAmount: 1,
          SecondSeperateBankAmount: 1,
          SeperateCashAmount: 1,
          totalBankAmount: 1,
          totalCashAmount: 1,
          totalRepaymentAmount: {
            $add: ["$totalBankAmount", "$totalCashAmount"],
          },
          bankAmount: 1,
          cashAmount: 1,
        },
      },
    ]);

    return res.status(200).json({ repaymentReport });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error On Aggregating Repayment", error });
  }
};
