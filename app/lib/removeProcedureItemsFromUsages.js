const { default: mongoose } = require("mongoose");
const AppointmentsModel = require("../models/appointment");
const StockModel = require("../models/stock");

exports.updateStocksBasedOnUsage = async (
  // relatedTreatmentSelection,
  // appointmentId,
  procedureMedicine
) => {
  try {
    if (!procedureMedicine || procedureMedicine.length === 0) {
      return {
        status: 400,
        error: true,
        message: "relatedTreatmentSelection is required",
      };
    }

    // const appointmentDocs = await AppointmentsModel.aggregate([
    //   {
    //     $match: {
    //       isDeleted: false,
    //       usageStatus: "Pending",
    //       relatedTreatmentSelection: mongoose.Types.ObjectId(
    //         relatedTreatmentSelection
    //       ),
    //       _id: mongoose.Types.ObjectId(appointmentId),
    //     },
    //   },

    //   {
    //     $unwind: "$procedureMedicine",
    //   },

    //   {
    //     $lookup: {
    //       from: "usages",
    //       let: {
    //         procedureMedicineItemId: "$procedureMedicine.item_id",
    //       },
    //       pipeline: [
    //         {
    //           $match: {
    //             relatedTreatmentSelection: mongoose.Types.ObjectId(
    //               relatedTreatmentSelection
    //             ),
    //             relatedAppointment: mongoose.Types.ObjectId(appointmentId),
    //           },
    //         },
    //         {
    //           $project: {
    //             procedureMedicine: 1,
    //           },
    //         },
    //       ],
    //       as: "usagesData",
    //     },
    //   },

    //   { $unwind: { path: "$usagesData", preserveNullAndEmptyArrays: true } },

    //   {
    //     $match: {
    //       "usagesData.procedureMedicine": { $exists: true, $ne: [] },
    //     },
    //   },

    //   {
    //     $project: {
    //       procedureMedicine: 1,
    //       relatedBranch: 1,
    //     },
    //   },
    // ]);

    // console.log("appointment docs", appointmentDocs);

    // for (const appointment of appointmentDocs) {
    //   for (const medicine of procedureMedicine) {
    //     const appointmentMedicine =
    //       await appointmentDocs.procedureMedicine[0].find(
    //         (med) => med.item_id.toString() === medicine.item_id.toString()
    //       );

    //     if (appointmentMedicine) {
    //       const stock = await StockModel.findOne({
    //         relatedProcedureItems: mongoose.Types.ObjectId(
    //           appointment.procedureMedicine.item_id
    //         ),
    //         relatedBranch: mongoose.Types.ObjectId(appointment.relatedBranch),
    //       });

    //       if (stock) {
    //         const newQuantity =
    //           Number(stock.currentQty) -
    //           Number(appointmentMedicine.perUsageQTY);

    //         const newtotalUnit =
    //           (stock.currentQty * stock.toUnit) / stock.fromUnit;

    //         await AppointmentsModel.findOneAndUpdate(
    //           {
    //             relatedUsage: appointment.relatedUsage,
    //           },
    //           {
    //             usageStatus: "Finished",
    //           }
    //         );

    //         if (newQuantity >= 0) {
    //           await StockModel.findOneAndUpdate(
    //             // {
    //             //   relatedProcedureItems: mongoose.Types.ObjectId(
    //             //     appointment.procedureMedicine.item_id
    //             //   ),
    //             //   relatedBranch: mongoose.Types.ObjectId(
    //             //     appointment.relatedBranch
    //             //   ),
    //             // },
    //             { currentQty: newQuantity, totalUnit: newtotalUnit },
    //             { new: true }
    //           );
    //         } else {
    //           console.warn(
    //             `Insufficient stock for item_id: ${appointment.procedureMedicine.item_id}`
    //           );
    //         }
    //       }
    //     }
    //   }
    // }

    for (const medicine of procedureMedicine) {
      const stock = await StockModel.findOne({
        relatedProcedureItems: mongoose.Types.ObjectId(medicine.item_id),
      });

      if (stock) {
        const newQuantity =
          Number(stock.currentQty) - Number(medicine.perUsageQTY);

        const newtotalUnit = (stock.currentQty * stock.toUnit) / stock.fromUnit;

        if (newQuantity >= 0) {
          await StockModel.findOneAndUpdate(
            {
              relatedProcedureItems: medicine.item_id,
            },
            { currentQty: newQuantity, totalUnit: newtotalUnit },
            { new: true }
          );
        } else {
          console.warn(`Insufficient stock for item_id: ${medicine.item_id}`);
        }
      } else {
        console.warn(`Stock not found for item_id: ${medicine.item_id}`);
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
