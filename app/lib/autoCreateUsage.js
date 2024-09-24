const StockModel = require("../models/stock");
const MachineModel = require("../models/fixedAsset");
const Log = require("../models/log");

exports.autoCreateUsage = async (usage, relatedBranch) => {
  let { procedureMedicine, proceureAccessory, generalItem, machine } = usage;

  let machineError = [];
  let procedureItemsError = [];
  let accessoryItemsError = [];
  let generalItemsError = [];

  let procedureItemsFinished = [];
  let accessoryItemsFinished = [];
  let generalItemsFinished = [];
  let machineFinished = [];

  let createdBy = req.credentials.id;

  if (procedureMedicine && procedureMedicine.length > 0) {
    for (const e of procedureMedicine) {
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

        console.log("cedcure", totalUnit, result, from, to, currentQty);

        try {
          const result = await StockModel.findOneAndUpdate(
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

        procedureItemsFinished.push(e);
        const logResult = await Log.create({
          relatedTreatmentSelection: relatedTreatmentSelection,
          relatedAppointment: relatedAppointment,
          relatedProcedureItems: e.item_id,
          currentQty: stock.totalUnit,
          actualQty: e.actual,
          finalQty: totalUnit,
          relatedBranch: relatedBranch,
          type: "Usage",
          createdBy: createdBy,
        });
      }
    }
  }

  if (proceureAccessory && proceureAccessory.length > 0) {
    for (const e of procedureAccessory) {
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

        console.log("cedcure", totalUnit, result, from, to, currentQty);

        try {
          accessoryItemsFinished.push(e);
          const result = await StockModel.findOneAndUpdate(
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
        const logResult = await Log.create({
          relatedTreatmentSelection: relatedTreatmentSelection,
          relatedAppointment: relatedAppointment,
          relatedAccessoryItems: e.item_id,
          currentQty: stock.totalUnit,
          actualQty: e.actual,
          finalQty: totalUnit,
          type: "Usage",
          relatedBranch: relatedBranch,
          createdBy: createdBy,
        });
      }
    }
  }

  if (generalItem && generalItem.length > 0) {
    for (const e of generalItem) {
      const stock = await Stock.findOne({
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

        try {
          generalItemsFinished.push(e);
          const result = await StockModel.findOneAndUpdate(
            {
              relatedGeneralItems: e.item_id,
              relatedBranch: relatedBranch,
            },
            { totalUnit: totalUnit, currentQty: currentQty },
            { new: true }
          );
        } catch (error) {
          generalItemsError.push(e);
        }

        const logResult = await Log.create({
          relatedTreatmentSelection: relatedTreatmentSelection,
          relatedAppointment: relatedAppointment,
          relatedGeneralItems: e.item_id,
          currentQty: stock.totalUnit,
          actualQty: e.actual,
          finalQty: totalUnit,
          type: "Usage",
          relatedBranch: relatedBranch,
          createdBy: createdBy,
        });
      }
    }
  }

  if (machine && machine.length > 0) {
    for (const e of machine) {
      if (e.stock < e.actual) {
        machineError.push(e);
      } else if (e.stock >= e.actual) {
        const result = await MachineModel.find({ _id: e.item_id });
        let totalUnit = e.stock - e.actual;
        const from = result[0].fromUnit;
        const to = result[0].toUnit;
        const currentQty = (from * totalUnit) / to;

        try {
          machineFinished.push(e);
          const result = await StockModel.findOneAndUpdate(
            { relatedMachine: e.item_id, relatedBranch: relatedBranch },
            { totalUnit: totalUnit, currentQty: currentQty },
            { new: true }
          );
        } catch (error) {
          machineError.push(e);
        }

        const logResult = await Log.create({
          relatedTreatmentSelection: relatedTreatmentSelection,
          relatedAppointment: relatedAppointment,
          relatedMachine: e.item_id,
          currentQty: e.stock,
          actualQty: e.actual,
          finalQty: totalUnit,
          type: "Usage",
          relatedBranch: relatedBranch,
          createdBy: createdBy,
        });
      }
    }
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
