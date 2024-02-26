'use strict';
const AccessoryItem = require('../models/accessoryItem');
const Branch = require('../models/branch');
const Stock = require('../models/stock');
const Log = require('../models/log')
const AccessoryItemRecord = require('../models/accessoryItemRecord');
const { loopIssue } = require('../lib/generalFunction');
const ProcedureItemRecord = require('../models/procedureItemRecord');
const GeneralItemRecord = require('../models/generalItemRecord');
const MedicineItemRecord = require('../models/medicineItemRecord');
const TransferToHoRecord = require('../models/transferToHoRecord');
const AddStockAndSubtractStock  = require('../lib/addStockAndSubtractFunction');
const TransferToHoRequest = require('../models/transferToHoRequest');

exports.issueToClinic = async (req, res) => {
    try {
      let result
      const { accessoryItems, procedureItems, generalItems, medicineItems, relatedBranch, reason, date } = req.body;
      const createdBy = req.credentials.id
      if (accessoryItems.length === 0 && procedureItems.length === 0 && generalItems.length === 0 && medicineItems.length === 0 ) return res.status(404).send({ error: true, message: 'Not Found!' })
      if (relatedBranch === undefined) {
        for (const e of accessoryItems) {
          const result = await AccessoryItem.find({ _id: e.item_id })
          let totalUnit = result[0].totalUnit - e.qty
          const from = result[0].fromUnit
          const to = result[0].toUnit
          const currentQty = (from * totalUnit) / to
          console.log(totalUnit, currentQty, 'here')
          try {
            const result = await AccessoryItem.findOneAndUpdate(
              { _id: e.item_id },
              { totalUnit: totalUnit, currentQty: currentQty },
              { new: true },
            )
          } catch (error) {
            return res.status(500).send({ error: true, message: error.message })
          }
          const logResult = await Log.create({
            "relatedAccessoryItems": e.item_id,
            "currentQty": e.qty,
            "actualQty": e.qty + totalUnit,
            "finalQty": totalUnit,
            "type": "Issue To Clinic",
            "createdBy": createdBy
          })
        }
      }
      if (accessoryItems && accessoryItems.length != 0 && relatedBranch) {
        loopIssue(accessoryItems,async function(accessoryItem){
          const result = await Stock.find({ relatedAccessoryItems: accessoryItem.item_id, relatedBranch: relatedBranch })
            let totalUnit = result[0].totalUnit - accessoryItem.qty
            const from = result[0].fromUnit
            const to = result[0].toUnit
            const currentQty = (from * totalUnit) / to
          //   console.log(totalUnit, currentQty, 'here')
            const result2 = await Stock.findOneAndUpdate(
              { relatedAccessoryItems: accessoryItem.item_id, relatedBranch: relatedBranch },
              { totalUnit: totalUnit, currentQty: currentQty },
              { new: true },
            )
            const logResult = await Log.create({
              "relatedBranch": relatedBranch,
              "relatedAccessoryItems": accessoryItem.item_id,
              "currentQty": accessoryItem.stock,
              "actualQty": accessoryItem.actual,
              "finalQty": totalUnit,
              "type": "Issue To Clinic",
              "createdBy": createdBy
            })
        })
        result = await AccessoryItemRecord.create({
          accessoryItems: accessoryItems,
          reason: reason,
          createdAt: date,
          relatedBranch: relatedBranch
      })
      } 
      if (procedureItems && procedureItems.length && relatedBranch){
        loopIssue(procedureItems, async function(procedureItem){
          const result = await Stock.find({ relatedProcedureItems: procedureItem.item_id, relatedBranch: relatedBranch })
          let totalUnit = result[0].totalUnit - procedureItem.qty
          const from = result[0].fromUnit
          const to = result[0].toUnit
          const currentQty = (from * totalUnit) / to
        //   console.log(totalUnit, currentQty, 'here')
          const result2 = await Stock.findOneAndUpdate(
            { relatedProcedureItems: procedureItem.item_id, relatedBranch: relatedBranch },
            { totalUnit: totalUnit, currentQty: currentQty },
            { new: true },
          )
          const logResult = await Log.create({
            "relatedBranch": relatedBranch,
            "relatedProcedureItems": procedureItem.item_id,
            "currentQty": procedureItem.stock,
            "actualQty": procedureItem.actual,
            "finalQty": totalUnit,
            "type": "Issue To Clinic",
            "createdBy": createdBy
          })
      })
      result = await ProcedureItemRecord.create({
        procedureItems: procedureItems,
        reason: reason,
        createdAt: date,
        relatedBranch: relatedBranch
     })
      }
      if (generalItems && generalItems.length && relatedBranch){
        loopIssue(generalItems, async function(generalItem){
          const result = await Stock.find({ relatedGeneralItems: generalItem.item_id, relatedBranch: relatedBranch })
          let totalUnit = result[0].totalUnit - generalItem.qty
          const from = result[0].fromUnit
          const to = result[0].toUnit
          const currentQty = (from * totalUnit) / to
        //   console.log(totalUnit, currentQty, 'here')
          const result2 = await Stock.findOneAndUpdate(
            { relatedGeneralItems: generalItem.item_id, relatedBranch: relatedBranch },
            { totalUnit: totalUnit, currentQty: currentQty },
            { new: true },
          )
          const logResult = await Log.create({
            "relatedBranch": relatedBranch,
            "relatedGeneralItems": generalItem.item_id,
            "currentQty": generalItem.stock,
            "actualQty": generalItem.actual,
            "finalQty": totalUnit,
            "type": "Issue To Clinic",
            "createdBy": createdBy
          })
      })
      result = await GeneralItemRecord.create({
        generalItems: generalItems,
        reason: reason,
        createdAt: date,
        relatedBranch: relatedBranch
    })
      }
    if (medicineItems && medicineItems.length && relatedBranch){
         loopIssue(medicineItems, async function(medicineItem){
            const result = await Stock.find({ relatedMedicineItems: medicineItem.item_id, relatedBranch: relatedBranch })
            let totalUnit = result[0].totalUnit - medicineItem.qty
            const from = result[0].fromUnit
            const to = result[0].toUnit
            const currentQty = (from * totalUnit) / to
          //   console.log(totalUnit, currentQty, 'here')
            const result2 = await Stock.findOneAndUpdate(
              { relatedMedicineItems: medicineItem.item_id, relatedBranch: relatedBranch },
              { totalUnit: totalUnit, currentQty: currentQty },
              { new: true },
            )
            const logResult = await Log.create({
              "relatedBranch": relatedBranch,
              "relatedMedicineItems": medicineItem.item_id,
              "currentQty": medicineItem.stock,
              "actualQty": medicineItem.actual,
              "finalQty": totalUnit,
              "type": "Issue To Clinic",
              "createdBy": createdBy
            })
        })
        result = await MedicineItemRecord.create({
          medicineItems: medicineItems,
          reason: reason,
          createdAt: date,
          relatedBranch: relatedBranch
      })
      }
     
      return res.status(200).send({ success: true, data: result })
    } catch (error) {
      return res.status(500).send({ error: true, message: error.message })
    }
  }
  
  // when click confirm button from HO
  exports.confirmIssueToHo = async (req,res) =>{
    const { id, relatedBranch } = req.body;
    try{
       let response = {}
       const stockInstance = new AddStockAndSubtractStock(relatedBranch);
       const queryTransferToHoRequest = await TransferToHoRequest.findOne({_id: id})
       //check if medicineItems exists
       if(queryTransferToHoRequest.medicineItems && queryTransferToHoRequest.medicineItems.length != 0){
          // if there are , loop
          queryTransferToHoRequest.medicineItems.map(result => {
             stockInstance.subtractMedicineStock(result.item_id, result.qty)
             stockInstance.addMedicine(result.item_id, result.qty)
          })
       }
       //check if procedureItems exists
       if(queryTransferToHoRequest.procedureItems && queryTransferToHoRequest.procedureItems.length != 0){
         // if there are , loop
          queryTransferToHoRequest.procedureItems.map(result => {
           stockInstance.subtractProcedureStock(result.item_id, result.qty)
           stockInstance.addProcedure(result.item_id, result.qty)
        })
       }
       //check if accessoryItems exists
       if(queryTransferToHoRequest.accessoryItems && queryTransferToHoRequest.accessoryItems.length != 0){
        // if there are , loop
        queryTransferToHoRequest.accessoryItems.map(result => {
           stockInstance.subtractAccessoryStock(result.item_id, result.qty)
           stockInstance.addAccessory(result.item_id, result.qty)
        })
       }
       //check if generalItems exists
       if(queryTransferToHoRequest.generalItems && queryTransferToHoRequest.generalItems.length != 0){
        // if there are , loop
         queryTransferToHoRequest.generalItems.map(result => {
          stockInstance.subtractGeneralStock(result.item_id, result.qty)
          stockInstance.addGeneral(result.item_id, result.qty)
       })
      }
       response.accessoryItems = queryTransferToHoRequest.accessoryItems
       response.procedureItems = queryTransferToHoRequest.procedureItems
       response.generalItems = queryTransferToHoRequest.generalItems
       response.medicineItems = queryTransferToHoRequest.medicineItems
       response.relatedBranch = queryTransferToHoRequest.relatedBranch
       response.reason = queryTransferToHoRequest.reason
       response.date = queryTransferToHoRequest.date
       response.code = queryTransferToHoRequest.code
       await TransferToHoRequest.findByIdAndUpdate(id,{ isConfirmed: true })
       await TransferToHoRecord.create(response)
       res.status(200).send({
         success: true,
         message: "Confirmed Requested Items Successfully"
       })

       
    }catch(error){
      res.status(500).send({
        error: true,
        message: error.message
     })
    }
  }
