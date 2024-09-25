const { default: mongoose } = require("mongoose");
const AppointmentsModel = require("../models/appointment");
const StockModel = require("../models/stock");

exports.updateStocksBasedOnUsage = async (
  relatedTreatmentSelection,
  relatedPatient,
  appointmentId
) => {
  try {
    if (!relatedTreatmentSelection) {
      return {
        status: 400,
        error: true,
        message: "relatedTreatmentSelection is required",
      };
    }

    const appointmentDocs = await AppointmentsModel.aggregate([
      {
        $match: {
          isDeleted: false,
          usageStatus: "Pending",
          relatedPatient: mongoose.Types.ObjectId(relatedPatient),
          relatedTreatmentSelection: mongoose.Types.ObjectId(
            relatedTreatmentSelection
          ),
          _id: mongoose.Types.ObjectId(appointmentId),
        },
      },

      {
        $unwind: "$procedureMedicine",
      },

      {
        $lookup: {
          from: "usages",
          let: {
            procedureMedicineItemId: "$procedureMedicine.item_id",
          },
          pipeline: [
            {
              $match: {
                relatedTreatmentSelection: mongoose.Types.ObjectId(
                  relatedTreatmentSelection
                ),
                relatedAppointment: mongoose.Types.ObjectId(appointmentId),
                procedureMedicine: {
                  $elemMatch: { item_id: "$procedureMedicineItemId" },
                },
              },
            },
            {
              $project: {
                procedureMedicine: 1,
              },
            },
          ],
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
          "procedureMedicine.actual": 1,
          relatedBranch: 1,
        },
      },
    ]);

    console.log("appointment docs", appointmentDocs);

    for (const appointment of appointmentDocs) {
      const stock = await StockModel.findOne({
        relatedProcedureItems: mongoose.Types.ObjectId(
          appointment.procedureMedicine.item_id
        ),
        relatedBranch: mongoose.Types.ObjectId(appointment.relatedBranch),
      });

      if (stock) {
        const newQuantity =
          Number(stock.currentQty) -
          Number(appointment.procedureMedicine.actual);

        const newtotalUnit = (stock.currentQty * stock.toUnit) / stock.fromUnit;

        await AppointmentsModel.findOneAndUpdate(
          {
            relatedUsage: appointment.relatedUsage,
          },
          {
            usageStatus: "Finished",
          }
        );

        if (newQuantity >= 0) {
          await StockModel.findOneAndUpdate(
            {
              relatedProcedureItems: mongoose.Types.ObjectId(
                appointment.procedureMedicine.item_id
              ),
              relatedBranch: mongoose.Types.ObjectId(appointment.relatedBranch),
            },
            { currentQty: newQuantity, totalUnit: newtotalUnit },
            { new: true }
          );
        } else {
          console.warn(
            `Insufficient stock for item_id: ${appointment.procedureMedicine.item_id}`
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
