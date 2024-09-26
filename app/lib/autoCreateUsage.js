const StockModel = require("../models/stock");
const MachineModel = require("../models/fixedAsset");
const Log = require("../models/log");
const GeneralItem = require("../models/generalItem");
const UsageModel = require("../models/usage");
const ProcedureItem = require("../models/procedureItem");
const AccessoryItem = require("../models/accessoryItem");
const Appointment = require("../models/appointment");
const usageRecord = require("../models/usageRecord");

exports.autoCreateUsage = async (
  usage,
  relatedBranch,
  appointmentId,
  treatmentSelectionId
) => {
  let { procedureMedicine, proceureAccessory, generalItem, machine } = usage;

  let machineError = [];
  let procedureItemsError = [];
  let accessoryItemsError = [];
  let generalItemsError = [];

  let procedureItemsFinished = [];
  let accessoryItemsFinished = [];
  let generalItemsFinished = [];
  let machineFinished = [];

  let noProcedureItemsStock = [];
  let noAccessoryItemsStock = [];
  let noGeneralItemsStock = [];

  // let createdBy = req.credentials.id;

  try {
    if (!relatedBranch || relatedBranch === undefined) {
      return res
        .status(404)
        .send({ error: true, message: "Branch ID is requried" });
    }

    const appResult = await Appointment.findOne({
      _id: appointmentId,
    });

    let status;
    if (appResult.relatedUsage === undefined) {
      if (procedureMedicine && procedureMedicine.length > 0) {
        Promise.all(
          procedureMedicine.map(async (e) => {
            try {
              const stock = await StockModel.findOne({
                relatedProcedureItems: e.item_id,
                relatedBranch: relatedBranch,
              });

              if (!stock) {
                noProcedureItemsStock.push(e);
              } else if (Number(stock.totalUnit) < Number(e.actual)) {
                procedureItemsError.push(e);
              } else if (Number(stock.totalUnit) >= Number(e.actual)) {
                let totalUnit = Number(stock.totalUnit) - Number(e.actual);

                const result = await ProcedureItem.findOne({ _id: e.item_id });
                const from = Number(result.fromUnit);
                const to = Number(result.toUnit);
                const currentQty = Number(from * totalUnit) / to;

                await StockModel.findOneAndUpdate(
                  {
                    relatedProcedureItems: e.item_id,
                    relatedBranch: relatedBranch,
                  },
                  { totalUnit: totalUnit, currentQty: currentQty },
                  { new: true }
                );

                procedureItemsFinished.push(e);

                await Log.create({
                  relatedTreatmentSelection: treatmentSelectionId,
                  relatedAppointment: appointmentId,
                  relatedProcedureItems: e.item_id,
                  currentQty: stock.totalUnit,
                  actualQty: e.actual,
                  finalQty: totalUnit,
                  relatedBranch: relatedBranch,
                  type: "Usage",
                  // createdBy: createdBy,
                });
              }
            } catch (e) {
              procedureItemsError.push(e);
            }
          })
        );
      }

      if (proceureAccessory && proceureAccessory.length > 0) {
        Promise.all(
          proceureAccessory.map(async (e) => {
            try {
              const stock = await StockModel.findOne({
                relatedAccessoryItems: e.item_id,
                relatedBranch: relatedBranch,
              });

              if (!stock) {
                noAccessoryItemsStock.push(e);
              } else if (Number(stock.totalUnit) < Number(e.actual)) {
                accessoryItemsError.push(e);
              } else if (Number(stock.totalUnit) >= Number(e.actual)) {
                let totalUnit = Number(stock.totalUnit) - Number(e.actual);

                const result = await AccessoryItem.findOne({ _id: e.item_id });
                const from = Number(result.fromUnit);
                const to = Number(result.toUnit);
                const currentQty = (from * totalUnit) / to;

                await StockModel.findOneAndUpdate(
                  {
                    relatedAccessoryItems: e.item_id,
                    relatedBranch: relatedBranch,
                  },
                  { totalUnit: totalUnit, currentQty: currentQty },
                  { new: true }
                );

                accessoryItemsFinished.push(e);

                await Log.create({
                  relatedTreatmentSelection: treatmentSelectionId,
                  relatedAppointment: appointmentId,
                  relatedAccessoryItems: e.item_id,
                  currentQty: stock.totalUnit,
                  actualQty: e.actual,
                  finalQty: totalUnit,
                  type: "Usage",
                  relatedBranch: relatedBranch,
                  // createdBy: createdBy,
                });
              }
            } catch (e) {
              accessoryItemsError.push(e);
            }
          })
        );
      }

      if (generalItem && generalItem.length > 0) {
        Promise.all(
          generalItem.map(async (e) => {
            const stock = await StockModel.findOne({
              relatedGeneralItems: e.item_id,
              relatedBranch: relatedBranch,
            });

            if (!stock) {
              noGeneralItemsStock.push(e);
            } else if (Number(stock.totalUnit) < Number(e.actual)) {
              generalItemsError.push(e);
            } else if (Number(stock.totalUnit) >= Number(e.actual)) {
              let totalUnit = Number(stock.totalUnit) - Number(e.actual);

              const result = await GeneralItem.findOne({ _id: e.item_id });
              const from = Number(result.fromUnit);
              const to = Number(result.toUnit);
              const currentQty = (from * totalUnit) / to;

              await StockModel.findOneAndUpdate(
                {
                  relatedGeneralItems: e.item_id,
                  relatedBranch: relatedBranch,
                },
                { totalUnit: totalUnit, currentQty: currentQty },
                { new: true }
              );

              generalItemsFinished.push(e);

              await Log.create({
                relatedTreatmentSelection: treatmentSelectionId,
                relatedAppointment: appointmentId,
                relatedGeneralItems: e.item_id,
                currentQty: stock.totalUnit,
                actualQty: e.actual,
                finalQty: totalUnit,
                type: "Usage",
                relatedBranch: relatedBranch,
                // createdBy: createdBy,
              });
            }
          })
        );
      }

      if (machine && machine.length > 0) {
        Promise.all(
          machine.map(async (e) => {
            if (e.stock < e.actual) {
              machineError.push(e);
            } else if (e.stock >= e.actual) {
              const result = await MachineModel.find({ _id: e.item_id });
              let totalUnit = e.stock - e.actual;
              const from = result[0].fromUnit;
              const to = result[0].toUnit;
              const currentQty = (from * totalUnit) / to;

              await StockModel.findOneAndUpdate(
                { relatedMachine: e.item_id, relatedBranch: relatedBranch },
                { totalUnit: totalUnit, currentQty: currentQty },
                { new: true }
              );

              machineFinished.push(e);

              await Log.create({
                relatedTreatmentSelection: treatmentSelectionId,
                relatedAppointment: appointmentId,
                relatedMachine: e.item_id,
                currentQty: e.stock,
                actualQty: e.actual,
                finalQty: totalUnit,
                type: "Usage",
                relatedBranch: relatedBranch,
                // createdBy: createdBy,
              });
            }
          })
        );
      }

      if (
        machineError.length > 0 ||
        procedureItemsError.length > 0 ||
        accessoryItemsError.length > 0 ||
        generalItemsError.length > 0
      ) {
        status = "In Progress";
      }

      if (
        machineError.length === 0 &&
        procedureItemsError.length === 0 &&
        accessoryItemsError.length === 0 &&
        generalItemsError.length === 0
      ) {
        status = "Finished";
      }

      var usageResult = await UsageModel.create({
        procedureAccessory: accessoryItemsFinished,
        procedureMedicine: procedureItemsFinished,
        generalItem: generalItemsFinished,
        machine: machineFinished,
        machineError: machineError,
        relatedBranch: relatedBranch,
        relatedAppointment: appointmentId,
        procedureItemsError: procedureItemsError,
        accessoryItemsError: accessoryItemsError,
        generalItemsError: generalItemsError,
        usageStatus: status,
        relatedTreatmentSelection: Array.isArray(treatmentSelectionId)
          ? treatmentSelectionId[0]
          : treatmentSelectionId,
      });

      var appointmentUpdateDoc = await Appointment.findOneAndUpdate(
        { _id: appointmentId },
        { usageStatus: status, relatedUsage: usageResult._id }
      );

      const usageRecordResultDoc = await usageRecord.create({
        relatedUsage: usageResult._id,
        usageStatus: status,
        procedureMedicine: procedureItemsFinished,
        procedureAccessory: accessoryItemsFinished,
        generalItem: generalItemsFinished,
        machine: machineFinished,
        relatedBranch: relatedBranch,
        machineError: machineError,
        procedureItemsError: procedureItemsError,
        accessoryItemsError: accessoryItemsError,
        generalItemsError: generalItemsError,
      });
    } else {
      const usageRecordResultDoc = await usageRecord.find(
        { relatedUsage: appResult.relatedUsage },
        { sort: { createdAt: -1 } }
      );

      if (usageRecordResultDoc.length > 0) {
        var URResult = await usageRecord.find({
          _id: usageRecordResultDoc[0]._id,
        });
      }

      const newMachine = machine.filter((val) => {
        const match = URResult[0].machineError.some(
          (errorItem) => errorItem.item_id.toString() === val.item_id
        );

        return match;
      });

      const newPA = proceureAccessory.filter((val) => {
        const match = URResult[0].accessoryItemsError.some(
          (errorItem) => errorItem.item_id.toString() === val.item_id
        );
        return match;
      });

      const newPM = procedureMedicine.filter((val) => {
        const match = URResult[0].procedureItemsError.some(
          (errorItem) => errorItem.item_id.toString() === val.item_id
        );

        return match;
      });

      if (newPM.length > 0) {
        for (const e of newPM) {
          if (e.stock < e.actual) {
            procedureItemsError.push(e);
          } else if (e.stock >= e.actual) {
            let totalUnit = e.stock - e.actual;
            const result = await ProcedureItem.find({ _id: e.item_id });
            const from = result[0].fromUnit;
            const to = result[0].toUnit;

            const currentQty = (from * totalUnit) / to;

            try {
              procedureItemsFinished.push(e);
              await StockModel.findOneAndUpdate(
                {
                  relatedProcedureItems: e.item_id,
                  relatedBranch: relatedBranch,
                },
                { totalUnit: totalUnit, currentQty: currentQty },
                { new: true }
              );
            } catch (error) {
              procedureItemsError.push(e);
            }
            await Log.create({
              relatedTreatmentSelection: treatmentSelectionId,
              relatedAppointment: appointmentId,
              relatedProcedureItems: e.item_id,
              currentQty: e.stock,
              actualQty: e.actual,
              finalQty: totalUnit,
              type: "Usage",
              relatedBranch: relatedBranch,
              // createdBy: createdBy,
            });
          }
        }
      }

      if (newPA !== undefined) {
        for (const e of newPA) {
          if (e.stock < e.actual) {
            accessoryItemsError.push(e);
          } else if (e.stock >= e.actual) {
            let totalUnit = e.stock - e.actual;
            const result = await AccessoryItem.find({ _id: e.item_id });
            const from = result[0].fromUnit;
            const to = result[0].toUnit;
            const currentQty = (from * totalUnit) / to;

            try {
              accessoryItemsFinished.push(e);
              StockModel.findOneAndUpdate(
                {
                  relatedAccessoryItems: e.item_id,
                  relatedBranch: relatedBranch,
                },
                { totalUnit: totalUnit, currentQty: currentQty },
                { new: true }
              );
            } catch (error) {
              accessoryItemsError.push(e);
            }

            Log.create({
              relatedTreatmentSelection: treatmentSelectionId,
              relatedAppointment: appointmentId,
              relatedAccessoryItems: e.item_id,
              currentQty: e.stock,
              actualQty: e.actual,
              finalQty: totalUnit,
              type: "Usage",
              relatedBranch: relatedBranch,
              // createdBy: createdBy,
            });
          }
        }
      }

      if (newMachine !== undefined) {
        for (const e of newMachine) {
          if (e.stock < e.actual) {
            machineError.push(e);
          } else if (e.stock >= e.actual) {
            let totalUnit = e.stock - e.actual;
            const result = await MachineModel.find({ _id: e.item_id });
            const from = result[0].fromUnit;
            const to = result[0].toUnit;
            const currentQty = (from * totalUnit) / to;

            try {
              machineFinished.push(e);
              StockModel.findOneAndUpdate(
                { relatedMachine: e.item_id, relatedBranch: relatedBranch },
                { totalUnit: totalUnit, currentQty: currentQty },
                { new: true }
              );
            } catch (error) {
              machineError.push(e);
            }

            await Log.create({
              relatedTreatmentSelection: treatmentSelectionId,
              relatedAppointment: appointmentId,
              relatedMachine: e.item_id,
              currentQty: e.stock,
              actualQty: e.actual,
              finalQty: totalUnit,
              type: "Usage",
              relatedBranch: relatedBranch,
              // createdBy: createdBy,
            });
          }
        }
      }

      if (
        machineError.length > 0 ||
        procedureItemsError.length > 0 ||
        accessoryItemsError.length > 0 ||
        generalItemsError.length > 0
      ) {
        status = "In Progress";
      }

      if (
        machineError.length === 0 &&
        (procedureItemsError.length === 0) & (accessoryItemsError.length === 0)
      ) {
        status = "Finished";
      }

      var usageUpdate = await UsageModel.findOneAndUpdate(
        { _id: appResult[0].relatedUsage },
        {
          $push: {
            procedureAccessory: { $each: accessoryItemsFinished },
            procedureMedicine: { $each: procedureItemsFinished },
            generalItem: { $each: generalItemsFinished },
            machine: { $each: machineFinished },
          },
          procedureItemsError: procedureItemsError,
          accessoryItemsError: accessoryItemsError,
          generalItemsError: generalItemsError,
          machineError: machineError,
          usageStatus: status,
          relatedBranch: relatedBranch,
          relatedTreatmentSelection: treatmentSelectionId,
        },
        { new: true }
      );

      var usageRecordResult = await usageRecord.create({
        relatedUsage: usageUpdate._id,
        usageStatus: status,
        procedureMedicine: procedureItemsFinished,
        proceureAccessory: accessoryItemsFinished,
        generalItem: generalItemsFinished,
        machine: machineFinished,
        relatedBranch: relatedBranch,
        machineError: machineError,
        procedureItemsError: procedureItemsError,
        accessoryItemsError: accessoryItemsError,
        generalItemsError: generalItemsError,
      });
    }

    let response = { success: true };

    if (machineError.length > 0) response.machineError = machineError;

    if (procedureItemsError.length > 0) {
      response.procedureItemsError = procedureItemsError;
    }

    if (accessoryItemsError.length > 0) {
      response.accessoryItemsError = accessoryItemsError;
    }

    if (generalItemsError.length > 0)
      response.generalItemsError = generalItemsError;

    if (usageResult !== undefined) response.usageResult = usageResult;

    if (usageRecordResult !== undefined)
      response.usageRecordResult = usageRecordResult;

    if (appointmentUpdateDoc !== undefined)
      response.appointmentUpdate = appointmentUpdateDoc;

    if (URResult !== undefined) response.URResult = URResult;
    if (usageUpdate !== undefined) response.usageUpdate = usageUpdate;

    return res.status(200).send(response);
  } catch (e) {
    console.error(e);
  }

  return {
    machineError,
    procedureItemsError,
    accessoryItemsError,
    generalItemsError,
    procedureItemsFinished,
    accessoryItemsFinished,
    generalItemsFinished,
    machineFinished,
  };
};
