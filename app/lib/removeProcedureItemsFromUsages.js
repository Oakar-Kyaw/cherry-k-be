const { default: mongoose } = require("mongoose");
const AppointmentsModel = require("../models/appointment");
const StockModel = require("../models/stock");

exports.updateStocksBasedOnUsage = async (relatedBranch) => {
  try {
    if (!relatedBranch) {
      return {
        status: 404,
        error: true,
        message: "Branch ID is required",
      };
    }

    const appointmentDocs = await AppointmentsModel.aggregate([
      {
        $match: {
          isDeleted: false,
          usageStatus: "Finished",
          relatedBranch: mongoose.Types.ObjectId(relatedBranch),
        },
      },

      {
        $lookup: {
          from: "usages",
          localField: "relatedUsage",
          foreignField: "_id",
          as: "usagesData",
        },
      },

      { $unwind: { path: "$usagesData", preserveNullAndEmptyArrays: true } },

      {
        $match: {
          "usagesData.procedureMedicine": { $exists: true, $ne: [] },
        },
      },

      {
        $project: {
          "usagesData.procedureMedicine": 1,
          relatedBranch: 1,
        },
      },
    ]);

    for (const appointment of appointmentDocs) {
      for (const medicine of appointment.usagesData.procedureMedicine) {
        const stock = await StockModel.findOne({
          relatedProcedureItems: mongoose.Types.ObjectId(medicine.item_id),
          relatedBranch: mongoose.Types.ObjectId(relatedBranch),
        });

        if (stock) {
          const totalUnit = Number(stock.totalUnit) - Number(medicine.actual);
          const currentyQty =
            (Number(stock.currentQty) * totalUnit) / Number(stock.totalUnit);

          await StockModel.findOneAndUpdate(
            {
              relatedProcedureItems: mongoose.Types.ObjectId(medicine.item_id),
              relatedBranch: mongoose.Types.ObjectId(relatedBranch),
            },
            { totalUnit: totalUnit, currentQty: currentyQty },
            { new: true }
          );
        }
      }
    }

    return {
      status: 200,
      success: true,
      message: "Stocks updated successfully based on usage data",
    };
  } catch (e) {
    return {
      status: 500,
      error: true,
      message: "Error updating stocks based on usage data",
    };
  }
};
