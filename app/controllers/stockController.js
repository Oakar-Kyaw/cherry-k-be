"use strict";
const Stock = require("../models/stock");
const ProcedureItems = require("../models/procedureItem");
const MedicineItems = require("../models/medicineItem");
const AccessoryItems = require("../models/accessoryItem");
const Branch = require("../models/branch");
const Log = require("../models/log");
const RecievedRecords = require("../models/recievedRecord");
const StockRequest = require("../models/stockRequest");
const { relative } = require("path");
const moment = require("moment");
const stockEditTransactionModel = require("../models/stockEditTransactionModel");
const stockTransfer = require("../models/stockTransfer");

exports.listAllStocks = async (req, res) => {
  let query = req.mongoQuery;
  try {
    let result = await Stock.find(query)
      .populate("relatedBranch relatedMachine")
      .populate({
        path: "relatedProcedureItems",
        model: "ProcedureItems",
        populate: {
          path: "name",
          model: "ProcedureMedicines",
        },
      })
      .populate({
        path: "relatedMedicineItems",
        model: "MedicineItems",
        populate: {
          path: "name",
          model: "MedicineLists",
        },
      })
      .populate({
        path: "relatedAccessoryItems",
        model: "AccessoryItems",
        populate: {
          path: "name",
          model: "ProcedureAccessories",
        },
      })
      .populate({
        path: "relatedGeneralItems",
        model: "GeneralItems",
        populate: {
          path: "name",
          model: "GeneralUnits",
        },
      });
    let count = await Stock.find(query).count();
    res.status(200).send({
      success: true,
      count: count,
      data: result,
    });
  } catch (error) {
    return res.status(500).send({ error: true, message: "No Record Found!" });
  }
};

exports.getStock = async (req, res) => {
  try {
    let query = req.mongoQuery;
    if (req.params.id) query._id = req.params.id;
    const result = await Stock.find(query).populate(
      "relatedBranch relatedProcedureItems relatedMedicineItems relatedAccessoryItems relatedMachine"
    );
    if (!result)
      return res.status(404).json({ error: true, message: "No Record Found" });
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.getStockByBranchID = async (req, res) => {
  try {
    console.log("here");
    let procedurequery = {
      relatedProcedureItems: { $exists: true },
      isDeleted: false,
    };
    let medicinequery = {
      relatedMedicineItems: { $exists: true },
      isDeleted: false,
    };
    let accessoryquery = {
      relatedAccessoryItems: { $exists: true },
      isDeleted: false,
    };
    let generalquery = {
      relatedGeneralItems: { $exists: true },
      isDeleted: false,
    };
    procedurequery = {
      ...procedurequery,
      relatedBranch: req.query.relatedBranch,
    };
    medicinequery = {
      ...medicinequery,
      relatedBranch: req.query.relatedBranch,
    };
    accessoryquery = {
      ...accessoryquery,
      relatedBranch: req.query.relatedBranch,
    };
    generalquery = { ...generalquery, relatedBranch: req.query.relatedBranch };
    console.log(procedurequery, medicinequery, accessoryquery);
    const procedureResult = await Stock.find(procedurequery)
      .populate("relatedBranch relatedMachine")
      .populate({
        path: "relatedProcedureItems",
        model: "ProcedureItems",
        populate: {
          path: "name",
          model: "ProcedureMedicines",
          populate: {
            path: "relatedBrand",
            model: "Brands",
          },
        },
      })
      .populate({
        path: "relatedMedicineItems",
        model: "MedicineItems",
        populate: {
          path: "name",
          model: "MedicineLists",
          populate: {
            path: "relatedBrand",
            model: "Brands",
          },
        },
      })
      .populate({
        path: "relatedAccessoryItems",
        model: "AccessoryItems",
        populate: {
          path: "name",
          model: "ProcedureAccessories",
          populate: {
            path: "relatedBrand",
            model: "Brands",
          },
        },
      });
    const medicineResult = await Stock.find(medicinequery)
      .populate("relatedBranch relatedMachine")
      .populate({
        path: "relatedProcedureItems",
        model: "ProcedureItems",
        populate: {
          path: "name",
          model: "ProcedureMedicines",
          populate: {
            path: "relatedBrand",
            model: "Brands",
          },
        },
      })
      .populate({
        path: "relatedMedicineItems",
        model: "MedicineItems",
        populate: {
          path: "name",
          model: "MedicineLists",
          populate: {
            path: "relatedBrand",
            model: "Brands",
          },
        },
      })
      .populate({
        path: "relatedAccessoryItems",
        model: "AccessoryItems",
        populate: {
          path: "name",
          model: "ProcedureAccessories",
          populate: {
            path: "relatedBrand",
            model: "Brands",
          },
        },
      });
    const accessoryResult = await Stock.find(accessoryquery)
      .populate("relatedBranch relatedMachine")
      .populate({
        path: "relatedProcedureItems",
        model: "ProcedureItems",
        populate: {
          path: "name",
          model: "ProcedureMedicines",
          populate: {
            path: "relatedBrand",
            model: "Brands",
          },
        },
      })
      .populate({
        path: "relatedMedicineItems",
        model: "MedicineItems",
        populate: {
          path: "name",
          model: "MedicineLists",
          populate: {
            path: "relatedBrand",
            model: "Brands",
          },
        },
      })
      .populate({
        path: "relatedAccessoryItems",
        model: "AccessoryItems",
        populate: {
          path: "name",
          model: "ProcedureAccessories",
          populate: {
            path: "relatedBrand",
            model: "Brands",
          },
        },
      });
    const generalItemResult = await Stock.find(generalquery)
      .populate("relatedBranch relatedMachine")
      .populate({
        path: "relatedProcedureItems",
        model: "ProcedureItems",
        populate: {
          path: "name",
          model: "ProcedureMedicines",
          populate: {
            path: "relatedBrand",
            model: "Brands",
          },
        },
      })
      .populate({
        path: "relatedMedicineItems",
        model: "MedicineItems",
        populate: {
          path: "name",
          model: "MedicineLists",
          populate: {
            path: "relatedBrand",
            model: "Brands",
          },
        },
      })
      .populate({
        path: "relatedAccessoryItems",
        model: "AccessoryItems",
        populate: {
          path: "name",
          model: "ProcedureAccessories",
          populate: {
            path: "relatedBrand",
            model: "Brands",
          },
        },
      })
      .populate({
        path: "relatedGeneralItems",
        model: "GeneralItems",
        populate: {
          path: "name",
          model: "GeneralUnits",
          populate: {
            path: "relatedBrand",
            model: "Brands",
          },
        },
      });
    return res.status(200).send({
      success: true,
      data: {
        ProcedureItems: procedureResult,
        MedicineItems: medicineResult,
        AccessoryItems: accessoryResult,
        GeneralItems: generalItemResult,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.createStock = async (req, res, next) => {
  try {
    const newStock = new Stock(req.body);
    const result = await newStock.save();
    res.status(200).send({
      message: "Stock create success",
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.updateStock = async (req, res, next) => {
  try {
    req.body.editTime = moment()
      .tz("Asia/Yangon")
      .format("MMMM Do YYYY, h:mm:ss a");
    req.body.editPerson = req.credentials.id;
    req.body.editEmail = req.credentials.email;
    const getResult = await Stock.find({ _id: req.body.id });
    await stockEditTransactionModel.create({
      relatedBranch: getResult[0].relatedBranch,
      relatedEditUser: req.body.editPerson,
      relatedGeneralItems: getResult[0].relatedGeneralItems || null,
      relatedProcedureItems: getResult[0].relatedProcedureItems || null,
      relatedMedicineItems: getResult[0].relatedMedicineItems || null,
      relatedAccessoryItems: getResult[0].relatedAccessoryItems || null,
      relatedMachine: getResult[0].relatedMachine || null,
      editQty: req.body.currentQty,
      editTotalUnit: req.body.totalQty,
      currentQty: getResult[0].currentQty,
      totalUnit: getResult[0].totalUnit,
      editTime: req.body.editTime,
      editEmail: req.body.editEmail,
      editPerson: req.body.editPerson,
    });
    console.log("id is ", req.body.id);
    const result = await Stock.findOneAndUpdate(
      { _id: req.body.id, relatedBranch: req.body.relatedBranch },
      req.body,
      { new: true }
    ).populate(
      "relatedBranch relatedProcedureItems relatedMedicineItems relatedAccessoryItems relatedMachine relatedGeneralItems"
    );

    console.log("body", req.body);

    const logResult = await Log.create({
      relatedStock: req.body.id,
      currentQty: getResult[0].totalUnit,
      finalQty: req.body.totalUnit,
      type: "Stock Update",
      relatedBranch: req.mongoQuery.relatedBranch,
      createdBy: req.credentials.id,
    });
    return res
      .status(200)
      .send({ success: true, data: result, log: logResult });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.deleteStock = async (req, res, next) => {
  try {
    req.body.deleteTime = moment().format("MMMM Do YYYY, h:mm:ss a");
    req.body.deletePerson = req.credentials.id;
    req.body.deleteEmail = req.credentials.email;
    const result = await Stock.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: true, ...req.body },
      { new: true }
    );
    return res
      .status(200)
      .send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.activateStock = async (req, res, next) => {
  try {
    const result = await Stock.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: false },
      { new: true }
    );
    return res
      .status(200)
      .send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.copyStock = async (req, res) => {
  try {
    const procedureItems = await ProcedureItems.find({ isDeleted: false });
    const accessoryItems = await AccessoryItems.find({ isDeleted: false });
    const medicineItems = await MedicineItems.find({ isDeleted: false });
    const branches = await Branch.find({});
    for (let i = 0; i < procedureItems.length; i++) {
      const stockResult = await Stock.create({
        relatedProcedureItems: procedureItems[i]._id,
        relatedBranch: "651f84c519683c5a91239741", //k-max
        currentQty: 0,
        totalUnit: 0,
        fromUnit: 1,
        toUnit: 1,
        reOrderQuantity: 0,
      });
      console.log(stockResult);
    }

    for (let i = 0; i < medicineItems.length; i++) {
      console.log("here");
      const stockResult = await Stock.create({
        relatedBranch: "651f84c519683c5a91239741", //k-max,
        relatedMedicineItems: medicineItems[i]._id,
        currentQty: 0,
        totalUnit: 0,
        fromUnit: 1,
        toUnit: 1,
        reOrderQuantity: 0,
      });
    }

    for (let i = 0; i < accessoryItems.length; i++) {
      console.log("here");
      var stockResult = await Stock.create({
        relatedBranch: "651f84c519683c5a91239741", //k-max,
        relatedAccessoryItems: accessoryItems[i]._id,
        currentQty: 0,
        // "currentQty": accessoryItems[i].currentQuantity,
        fromUnit: 1,
        toUnit: 1,
        // "totalUnit": (accessoryItems[i].currentQuantity * accessoryItems[i].toUnit) / accessoryItems[i].fromUnit,
        totalUnit: 0,
        reOrderQuantity: 0,
      });
    }

    return res.status(200).send({ success: true, data: "data" });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.checkReorder = async (req, res) => {
  try {
    let { relatedBranch } = req.query;
    if (relatedBranch) {
      const PIquery = {
        relatedProcedureItems: { $exists: true },
        relatedBranch: relatedBranch,
      };
      const MIquery = {
        relatedMedicineItems: { $exists: true },
        relatedBranch: relatedBranch,
      };
      const AIquery = {
        relatedAccessoryItems: { $exists: true },
        relatedBranch: relatedBranch,
      };
      const relatedProcedureItems = await Stock.find(PIquery).populate(
        "relatedProcedureItems"
      );
      const relatedAccessoryItems = await Stock.find(AIquery).populate(
        "relatedAccessoryItems"
      );
      const relatedMedicineItems = await Stock.find(MIquery).populate(
        "relatedMedicineItems"
      );
      const ProcedureItems = relatedProcedureItems.filter(
        (item) => item.currentQty <= item.reOrderQuantity
      );
      const AccessoryItems = relatedAccessoryItems.filter(
        (item) => item.currentQty <= item.reOrderQuantity
      );
      const MedicineItems = relatedMedicineItems.filter(
        (item) => item.currentQty <= item.reOrderQuantity
      );
      return res.status(200).send({
        success: true,
        data: {
          ProcedureItems: ProcedureItems,
          AccessoryItems: AccessoryItems,
          MedicineItems: MedicineItems,
        },
      });
    } else {
      const relatedMedicineItems = await MedicineItems.find({});
      const relatedAccessoryItems = await AccessoryItems.find({});
      const relatedProcedureItems = await ProcedureItems.find({});
      const ProcedureItemsResult = relatedProcedureItems.filter(
        (item) => item.currentQty <= item.reOrderQuantity
      );
      const AccessoryItemsResult = relatedAccessoryItems.filter(
        (item) => item.currentQty <= item.reOrderQuantity
      );
      const MedicineItemsResult = relatedMedicineItems.filter(
        (item) => item.currentQty <= item.reOrderQuantity
      );
      return res.status(200).send({
        success: true,
        data: {
          ProcedureItems: ProcedureItemsResult,
          AccessoryItems: AccessoryItemsResult,
          MedicineItems: MedicineItemsResult,
        },
      });
    }
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

// exports.checkReorder = async (req, res) => {
//     try {
//         const { relatedBranch } = req.query;

//         const query = { relatedBranch };
//         const projection = { _id: 0, relatedBranch: 0 };

//         const items = await Stock.find(query, projection)
//             .populate('relatedProcedureItems')
//             .populate('relatedAccessoryItems')
//             .populate('relatedMedicineItems')
//             .lean()
//             .exec();

//         const ProcedureItems = items.filter(item => item.relatedProcedureItems && item.totalUnit <= item.reOrderQuantity);
//         const AccessoryItems = items.filter(item => item.relatedAccessoryItems && item.totalUnit <= item.reOrderQuantity);
//         const MedicineItems = items.filter(item => item.relatedMedicineItems && item.totalUnit <= item.reOrderQuantity);

//         return res.status(200).send({
//             success: true,
//             data: {
//                 ProcedureItems,
//                 AccessoryItems,
//                 MedicineItems
//             }
//         });
//     } catch (error) {
//         return res.status(500).send({ error: true, message: error.message });
//     }
// };

exports.stockRecieved = async (req, res) => {
  try {
    let createdBy = req.credentials.id;
    const {
      procedureItemID,
      medicineItemID,
      accessoryItemID,
      generalItemID,
      relatedBranch,
      recievedQty,
      requestedQty,
      fromUnit,
      toUnit,
      stockRequestID,
      transferQty,
      isDone,
    } = req.body;
    console.log("req", req.body);
    let totalUnit = (toUnit * recievedQty) / fromUnit;
    const sqResult = await StockRequest.find({
      _id: stockRequestID,
      isDeleted: false,
    }).populate("relatedTransfer");
    if (sqResult[0].relatedTransfer === undefined)
      return res.status(500).send({
        error: true,
        message: "There is no transfer record for this Request!",
      });
    // console.log('relatedTransfer', sqResult[0].relatedTransfer)
    if (procedureItemID) {
      const srFilter = sqResult[0].procedureMedicine.filter(
        (item) => item.item_id.toString() === procedureItemID
      );
      const recievedQuantity = srFilter[0].requestedQty || 0;
      const realFlag = srFilter[0].flag;
      const flag = sqResult[0].relatedTransfer.procedureMedicine.filter(
        (item) => item.item_id.toString() === procedureItemID
      );
      if (recievedQty > flag[0].transferQty)
        return res.status(500).send({
          error: true,
          message: "RecievedQty cannot be greater than TransferedQty!",
        });
      if (flag.length === 0)
        return res.status(500).send({
          error: true,
          message: "This procedure item does not exists in the stock reqeust!",
        });
      console.log("recivedQuantity", recievedQuantity, realFlag);
      if (realFlag === true) {
        return res
          .status(500)
          .send({ error: true, message: "Already Recieved" });
      } else if (realFlag === false && recievedQuantity > 0) {
        console.log("second cond");
        if (recievedQty > recievedQuantity)
          return res.status(500).send({
            error: true,
            message: "Input cannot be greater than RecievedQty!",
          });
        var result = await Stock.findOneAndUpdate(
          {
            relatedProcedureItems: procedureItemID,
            relatedBranch: relatedBranch,
          },
          {
            $inc: {
              currentQty: parseInt(recievedQty),
              totalUnit: parseInt(totalUnit),
            },
          },
          { new: true }
        )
          .populate(
            "relatedBranch relatedProcedureItems relatedMedicineItems relatedAccessoryItems relatedMachine"
          )
          .populate("createdBy", "givenName");
        const srresult = await StockRequest.findOneAndUpdate(
          { _id: stockRequestID, "procedureMedicine.item_id": procedureItemID },
          { $set: { "procedureMedicine.$.recievedQty": parseInt(recievedQty) } }
        );
        console.log(srresult, "here");
        var RecievedRecordsResult = await RecievedRecords.create({
          createdAt: Date.now(),
          createdBy: createdBy,
          relatedBranch: relatedBranch,
          requestedQty: parseInt(flag[0].requestedQty),
          recievedQty: parseInt(flag[0].transferQty - recievedQty),
          relatedProcedureItems: procedureItemID,
          type: "Transfer",
        });
        if (isDone === true) {
          const srresult = await StockRequest.findOneAndUpdate(
            {
              _id: stockRequestID,
              "procedureMedicine.item_id": procedureItemID,
            },
            { $set: { "procedureMedicine.$.flag": true } },
            { new: true }
          );
          await stockTransfer.findOneAndUpdate(
            {
              _id: srresult.relatedTransfer,
              "procedureMedicine.item_id": procedureItemID,
            },
            { $set: { "procedureMedicine.$.flag": true } }
          );
        }
      } else {
        var result = await Stock.findOneAndUpdate(
          {
            relatedProcedureItems: procedureItemID,
            relatedBranch: relatedBranch,
          },
          {
            $inc: {
              currentQty: parseInt(recievedQty),
              totalUnit: parseInt(totalUnit),
            },
          },
          { new: true }
        )
          .populate(
            "relatedBranch relatedProcedureItems relatedMedicineItems relatedAccessoryItems relatedMachine"
          )
          .populate("createdBy", "givenName");
        const srresult = await StockRequest.findOneAndUpdate(
          { _id: stockRequestID, "procedureMedicine.item_id": procedureItemID },
          { $set: { "procedureMedicine.$.recievedQty": parseInt(recievedQty) } }
        );
        var RecievedRecordsResult = await RecievedRecords.create({
          createdAt: Date.now(),
          createdBy: createdBy,
          relatedBranch: relatedBranch,
          requestedQty: parseInt(flag[0].requestedQty),
          recievedQty: parseInt(recievedQty),
          relatedProcedureItems: procedureItemID,
          type: "Transfer",
        });
        if (isDone === true) {
          const srresult = await StockRequest.findOneAndUpdate(
            {
              _id: stockRequestID,
              "procedureMedicine.item_id": procedureItemID,
            },
            { $set: { "procedureMedicine.$.flag": true } },
            { new: false }
          );
          await stockTransfer.findOneAndUpdate(
            {
              _id: srresult.relatedTransfer,
              "procedureMedicine.item_id": procedureItemID,
            },
            { $set: { "procedureMedicine.$.flag": true } }
          );
        }
      }
    }
    if (medicineItemID) {
      const flag = sqResult[0].relatedTransfer.medicineLists.filter(
        (item) => item.item_id.toString() === medicineItemID
      );
      const srFilter = sqResult[0].medicineLists.filter(
        (item) => item.item_id.toString() === medicineItemID
      );
      const recievedQuantity = srFilter[0].requestedQty || 0;
      const realFlag = srFilter[0].flag;
      if (recievedQty > flag[0].transferQty)
        return res.status(500).send({
          error: true,
          message: "RecievedQty cannot be greater than TransferedQty!",
        });
      if (flag.length === 0)
        return res.status(500).send({
          error: true,
          message: "This medicine item does not exists in the stock reqeust!",
        });
      if (realFlag === true) {
        return res
          .status(500)
          .send({ error: true, message: "Already Recieved" });
      }
      if (realFlag === false && recievedQuantity > 0) {
        if (recievedQty > recievedQuantity)
          return res.status(500).send({
            error: true,
            message: "Input cannot be greater than RecievedQty!",
          });
        var result = await Stock.findOneAndUpdate(
          {
            relatedMedicineItems: medicineItemID,
            relatedBranch: relatedBranch,
          },
          {
            $inc: {
              currentQty: parseInt(recievedQty),
              totalUnit: parseInt(totalUnit),
            },
          },
          { new: true }
        )
          .populate(
            "relatedBranch relatedProcedureItems relatedMedicineItems relatedAccessoryItems relatedMachine"
          )
          .populate("createdBy", "givenName");
        const srresult = await StockRequest.findOneAndUpdate(
          { _id: stockRequestID, "medicineLists.item_id": medicineItemID },
          { $set: { "medicineLists.$.recievedQty": parseInt(recievedQty) } }
        );
        var RecievedRecordsResult = await RecievedRecords.create({
          createdAt: Date.now(),
          createdBy: createdBy,
          relatedBranch: relatedBranch,
          requestedQty: parseInt(flag[0].requestedQty),
          recievedQty: parseInt(recievedQty),
          relatedMedicineItems: medicineItemID,
          type: "Transfer",
        });
        if (isDone === true) {
          const srresult = await StockRequest.findOneAndUpdate(
            { _id: stockRequestID, "medicineLists.item_id": medicineItemID },
            { $set: { "medicineLists.$.flag": true } },
            { new: true }
          );
          await stockTransfer.findOneAndUpdate(
            {
              _id: srresult.relatedTransfer,
              "medicineLists.item_id": medicineItemID,
            },
            { $set: { "medicineLists.$.flag": true } }
          );
        }
      } else {
        var result = await Stock.findOneAndUpdate(
          {
            relatedMedicineItems: medicineItemID,
            relatedBranch: relatedBranch,
          },
          {
            $inc: {
              currentQty: parseInt(recievedQty),
              totalUnit: parseInt(totalUnit),
            },
          },
          { new: true }
        )
          .populate(
            "relatedBranch relatedProcedureItems relatedMedicineItems relatedAccessoryItems relatedMachine"
          )
          .populate("createdBy", "givenName");
        const srresult = await StockRequest.findOneAndUpdate(
          { _id: stockRequestID, "medicineLists.item_id": medicineItemID },
          { $set: { "medicineLists.$.recievedQty": parseInt(recievedQty) } },
          { new: true }
        );
        var RecievedRecordsResult = await RecievedRecords.create({
          createdAt: Date.now(),
          createdBy: createdBy,
          relatedBranch: relatedBranch,
          requestedQty: parseInt(flag[0].requestedQty),
          recievedQty: parseInt(recievedQty),
          relatedMedicineItems: medicineItemID,
          type: "Transfer",
        });
        if (isDone === true) {
          const srresult = await StockRequest.findOneAndUpdate(
            { _id: stockRequestID, "medicineLists.item_id": medicineItemID },
            { $set: { "medicineLists.$.flag": true } },
            { new: true }
          );
          await stockTransfer.findOneAndUpdate(
            {
              _id: srresult.relatedTransfer,
              "medicineLists.item_id": medicineItemID,
            },
            { $set: { "medicineLists.$.flag": true } }
          );
        }
      }
    }
    if (accessoryItemID) {
      const flag = sqResult[0].relatedTransfer.procedureAccessory.filter(
        (item) => item.item_id.toString() === accessoryItemID
      );
      const srFilter = sqResult[0].procedureAccessory.filter(
        (item) => item.item_id.toString() === accessoryItemID
      );
      console.log("srfi", srFilter, accessoryItemID);
      const recievedQuantity = srFilter[0].requestedQty || 0;
      const realFlag = srFilter[0].flag;
      if (recievedQty > flag[0].transferQty)
        return res.status(500).send({
          error: true,
          message: "RecievedQty cannot be greater than TransferedQty!",
        });
      if (flag.length === 0)
        return res.status(500).send({
          error: true,
          message: "This accessory item does not exists in the stock reqeust!",
        });
      if (realFlag === true) {
        return res
          .status(500)
          .send({ error: true, message: "Already Recieved" });
      }
      if (realFlag === false && recievedQuantity > 0) {
        if (recievedQty > recievedQuantity)
          return res.status(500).send({
            error: true,
            message: "Input cannot be greater than RecievedQty!",
          });
        var result = await Stock.findOneAndUpdate(
          {
            relatedAccessoryItems: accessoryItemID,
            relatedBranch: relatedBranch,
          },
          {
            $inc: {
              currentQty: parseInt(recievedQty),
              totalUnit: parseInt(totalUnit),
            },
          },
          { new: true }
        )
          .populate(
            "relatedBranch relatedProcedureItems relatedMedicineItems relatedAccessoryItems relatedMachine"
          )
          .populate("createdBy", "givenName");
        var RecievedRecordsResult = await RecievedRecords.create({
          createdAt: Date.now(),
          createdBy: createdBy,
          relatedBranch: relatedBranch,
          requestedQty: parseInt(flag[0].requestedQty),
          recievedQty: parseInt(recievedQty),
          relatedAccessoryItems: accessoryItemID,
          type: "Transfer",
        });
        const srresult = await StockRequest.findOneAndUpdate(
          {
            _id: stockRequestID,
            "procedureAccessory.item_id": accessoryItemID,
          },
          {
            $set: { "procedureAccessory.$.recievedQty": parseInt(recievedQty) },
          }
        );
        if (isDone === true) {
          const srresult = await StockRequest.findOneAndUpdate(
            {
              _id: stockRequestID,
              "procedureAccessory.item_id": accessoryItemID,
            },
            { $set: { "procedureAccessory.$.flag": true } },
            { new: true }
          );
          await stockTransfer.findOneAndUpdate(
            {
              _id: srresult.relatedTransfer,
              "procedureAccessory.item_id": accessoryItemID,
            },
            { $set: { "procedureAccessory.$.flag": true } }
          );
        }
      } else {
        console.log(
          "this is ",
          totalUnit,
          recievedQty,
          parseInt(flag[0].transferQty - recievedQty)
        );
        var result = await Stock.findOneAndUpdate(
          {
            relatedAccessoryItems: accessoryItemID,
            relatedBranch: relatedBranch,
          },
          {
            $inc: {
              currentQty: parseInt(recievedQty),
              totalUnit: parseInt(totalUnit),
            },
          },
          { new: true }
        )
          .populate(
            "relatedBranch relatedProcedureItems relatedMedicineItems relatedAccessoryItems relatedMachine"
          )
          .populate("createdBy", "givenName");
        const srresult = await StockRequest.findOneAndUpdate(
          {
            _id: stockRequestID,
            "procedureAccessory.item_id": accessoryItemID,
          },
          {
            $set: { "procedureAccessory.$.recievedQty": parseInt(recievedQty) },
          },
          { new: true }
        );
        var RecievedRecordsResult = await RecievedRecords.create({
          createdAt: Date.now(),
          createdBy: createdBy,
          relatedBranch: relatedBranch,
          requestedQty: parseInt(flag[0].requestedQty),
          recievedQty: parseInt(recievedQty),
          relatedAccessoryItems: accessoryItemID,
          type: "Transfer",
        });
        if (isDone === true) {
          console.log("request", isDone, recievedQty);
          const srresult = await StockRequest.findOneAndUpdate(
            {
              _id: stockRequestID,
              "procedureAccessory.item_id": accessoryItemID,
            },
            { $set: { "procedureAccessory.$.flag": true } },
            { new: true }
          );
          await stockTransfer.findOneAndUpdate(
            {
              _id: srresult.relatedTransfer,
              "procedureAccessory.item_id": accessoryItemID,
            },
            { $set: { "procedureAccessory.$.flag": true } }
          );
        }
      }
    }
    if (generalItemID) {
      const srFilter = sqResult[0].generalItems.filter(
        (item) => item.item_id.toString() === generalItemID
      );
      const recievedQuantity = srFilter[0].requestedQty || 0;
      const realFlag = srFilter[0].flag;
      const flag = sqResult[0].relatedTransfer.generalItems.filter(
        (item) => item.item_id.toString() === generalItemID
      );
      if (recievedQty > flag[0].transferQty)
        return res.status(500).send({
          error: true,
          message: "RecievedQty cannot be greater than TransferedQty!",
        });
      if (flag.length === 0)
        return res.status(500).send({
          error: true,
          message: "This procedure item does not exists in the stock reqeust!",
        });
      console.log("recivedQuantity", recievedQuantity, realFlag);
      if (realFlag === true) {
        return res
          .status(500)
          .send({ error: true, message: "Already Recieved" });
      } else if (realFlag === false && recievedQuantity > 0) {
        console.log("second cond");
        if (recievedQty > recievedQuantity)
          return res.status(500).send({
            error: true,
            message: "Input cannot be greater than RecievedQty!",
          });
        var result = await Stock.findOneAndUpdate(
          { relatedGeneralItems: generalItemID, relatedBranch: relatedBranch },
          {
            $inc: {
              currentQty: parseInt(recievedQty),
              totalUnit: parseInt(totalUnit),
            },
          },
          { new: true }
        )
          .populate(
            "relatedBranch relatedProcedureItems relatedGeneralItems relatedMedicineItems relatedAccessoryItems relatedMachine"
          )
          .populate("createdBy", "givenName");
        const srresult = await StockRequest.findOneAndUpdate(
          { _id: stockRequestID, "generalItems.item_id": generalItemID },
          { $set: { "generalItems.$.recievedQty": parseInt(recievedQty) } },
          { new: true }
        );
        console.log(srresult, "here");
        var RecievedRecordsResult = await RecievedRecords.create({
          createdAt: Date.now(),
          createdBy: createdBy,
          relatedBranch: relatedBranch,
          requestedQty: parseInt(flag[0].requestedQty),
          recievedQty: parseInt(flag[0].transferQty - recievedQty),
          relatedGeneralItems: generalItemID,
          type: "Transfer",
        });
        if (isDone === true) {
          const srresult = await StockRequest.findOneAndUpdate(
            { _id: stockRequestID, "generalItems.item_id": generalItemID },
            { $set: { "generalItems.$.flag": true } },
            { new: true }
          );
          await stockTransfer.findOneAndUpdate(
            {
              _id: srresult.relatedTransfer,
              "generalItems.item_id": generalItemID,
            },
            { $set: { "generalItems.$.flag": true } }
          );
        }
      } else {
        var result = await Stock.findOneAndUpdate(
          { relatedGeneralItems: generalItemID, relatedBranch: relatedBranch },
          {
            $inc: {
              currentQty: parseInt(recievedQty),
              totalUnit: parseInt(totalUnit),
            },
          },
          { new: true }
        )
          .populate(
            "relatedBranch relatedProcedureItems relatedGeneralItems relatedMedicineItems relatedAccessoryItems relatedMachine"
          )
          .populate("createdBy", "givenName");
        const srresult = await StockRequest.findOneAndUpdate(
          { _id: stockRequestID, "generalItems.item_id": generalItemID },
          { $set: { "generalItems.$.recievedQty": parseInt(recievedQty) } },
          { new: true }
        );
        var RecievedRecordsResult = await RecievedRecords.create({
          createdAt: Date.now(),
          createdBy: createdBy,
          relatedBranch: relatedBranch,
          requestedQty: parseInt(flag[0].requestedQty),
          recievedQty: parseInt(recievedQty),
          relatedGeneralItems: generalItemID,
          type: "Transfer",
        });
        if (isDone === true) {
          const srresult = await StockRequest.findOneAndUpdate(
            { _id: stockRequestID, "generalItems.item_id": generalItemID },
            { $set: { "generalItems.$.flag": true } },
            { new: true }
          );
          await stockTransfer.findOneAndUpdate(
            {
              _id: srresult.relatedTransfer,
              "generalItems.item_id": generalItemID,
            },
            { $set: { "generalItems.$.flag": true } }
          );
        }
      }
    }

    const logResult = await Log.create({
      relatedStock: result._id,
      currentQty: requestedQty,
      actualQty: recievedQty,
      finalQty: recievedQty,
      type: "Request Recieved",
      relatedBranch: relatedBranch,
      createdBy: createdBy,
    });
    return res.status(200).send({
      success: true,
      data: result,
      log: logResult,
      RecievedRecordsResult: RecievedRecordsResult,
    });
    //return res.status(200).send({ success: true, sqResult: sqResult })
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: true, message: error.message });
  }
};
