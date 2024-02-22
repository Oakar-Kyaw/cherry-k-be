"use strict"

const { loopIssue } = require("../lib/generalFunction");
const AccountingList = require("../models/accountingList");
const Log = require("../models/log");
const Stock = require("../models/stock");
const TransferFromHo = require("../models/transferFromHo");
const TransferToHoRecord = require("../models/transferToHoRecord");



exports.listAllTransferToHo = async (req,res) => {
    let { keyword, role, limit, page, skip, exact, relatedBranch } = req.query;
    try {
        // console.log("this is role ")
        let query = { isDeleted: false }
        let startDate = new Date(exact)
        let endDate = new Date( startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1, startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds())
        limit = limit ? limit : 0
        skip = skip ? ( skip || 0 ) * limit : 0
        exact ? query["date"] = { "$gte": new Date(startDate), "$lt": new Date(endDate) } : ""
        relatedBranch ? query["relatedBranch"] = relatedBranch : ""
        let result = await TransferToHoRecord.find(query).skip(skip).limit(limit).populate("relatedBranch")
                           .populate({
                               path: "procedureItems",
                               populate:{
                                path: "item_id"
                               }
                            }).populate({
                                path: "medicineItems",
                                populate:{
                                 path: "item_id"
                                }
                            }).populate({
                                path: "accessoryItems",
                                populate:{
                                 path: "item_id"
                                }
                            }).populate({
                                path: "generalItems",
                                populate:{
                                 path: "item_id"
                                }
                            })
        let count = await TransferToHoRecord.find(query).count()
        if(result){
            res.status(200).send({
                success: true,
                data: result,
                meta_data : {
                    total_count: count,
                    skip: skip ? skip : 0,
                    limit: limit ? limit : 0,
                    per_page: limit ? limit : count,
                    total_page: limit ? Math.ceil(count/limit) : 1
                }
            })
        }
        else {
            res.status(200).send({
                success: true,
                data: "There is no transfer Amount"
            })
        }
        
    }catch(error){
        res.status(500).send({
            error:true,
            message:error.message
        })
    }
}

exports.getTransferToHOById = async ( req, res ) => {
    let { id } = req.params
    try{
      let result = await TransferToHoRecord.findOne({ _id: id }).populate("relatedBranch")
                        .populate({
                            path: "procedureItems",
                            populate:{
                            path: "item_id"
                            }
                        }).populate({
                            path: "medicineItems",
                            populate:{
                                path: "item_id"
                            }
                        }).populate({
                            path: "accessoryItems",
                            populate:{
                                path: "item_id"
                            }
                        }).populate({
                            path: "generalItems",
                            populate:{
                                path: "item_id"
                            }
                        })
      result ? res.status(200).send({
                                 success: true,
                                 data: result
                                    })
             : res.status(200).send({
                success: true,
                message: "There is no data for this one"
             })
    }
    catch(error){
        res.status(500).send({
            error:true,
            message:error.message
        })
    }   
}

exports.updateTransferToHOById = async ( req, res ) => {
    let { id } = req.params
    let createdBy = req.credentials.id
    const { accessoryItems, procedureItems, generalItems, medicineItems, relatedBranch, ...data} = req.body;
    try{
         let queryItem = await TransferToHoRecord.findById(id)
        //medicine item 
        if(medicineItems && medicineItems.length != 0){
           if(queryItem.medicineItems && queryItem.medicineItems != 0){
               //if there is a item and loop through item and pull item
               for(let e of queryItem.medicineItems){
                let queryMedicineFromHo =  await Stock.findOne({relatedMedicineItems:e.item_id, relatedBranch: relatedBranch})
                let totalUnit = queryMedicineFromHo.totalUnit - e.qty
                let currentQty = ( queryMedicineFromHo.fromUnit * totalUnit ) / queryMedicineFromHo.toUnit
                let result = await Stock.findOneAndUpdate({relatedMedicineItems:e.item_id, relatedBranch: relatedBranch},{
                    totalUnit: totalUnit,
                    currentQty: currentQty
                 })
               }
               //loop and add medicine item in stock 
               loopIssue(medicineItems, async function(medicineItem){
                let queryMedicineItem = await Stock.findOne({relatedMedicineItems:medicineItem.item_id, relatedBranch: relatedBranch})
                let totalUnit = queryMedicineItem.totalUnit + medicineItem.qty
                let currentQty = ( queryMedicineItem.fromUnit * totalUnit ) / queryMedicineItem.toUnit
                let updateMedicineItem = await Stock.findOneAndUpdate({relatedMedicineItems:medicineItem.item_id, relatedBranch: relatedBranch},{
                    totalUnit: totalUnit,
                    currentQty: currentQty
                })
               })
            //    // update medicine item 
               await TransferToHoRecord.findByIdAndUpdate(id,{
                medicineItems: medicineItems,
               })
           }else { 
               // if there is no medicine item in queryIteem   
               let totalUnit
                loopIssue(medicineItems, async function(medicineItem){
                   let updateMedicineItem = await Stock.findOne({relatedMedicineItems:medicineItem.item_id, relatedBranch: relatedBranch}).then(result => {
                    
                      result.totalUnit += medicineItem.qty
                      totalUnit = result.totalUnit
                      result.currentQty = ( result.fromUnit * result.totalUnit ) / result.toUnit
                      result.save()
                   },{new: true})
               const logResult = await Log.create({
                     "relatedBranch": relatedBranch,
                     "relatedMedicineItems": medicineItem.item_id,
                     "currentQty": medicineItem.stock,
                     "actualQty": medicineItem.actual,
                     "finalQty": totalUnit,
                     "type": "Issue To Ho",
                     "createdBy": createdBy
                   }) 
               })
               await TransferToHoRecord.findByIdAndUpdate(id,{
                   medicineItems: medicineItems,
                  })
              }
           }
           //procedure item 
        if(procedureItems && procedureItems.length != 0){
            if(queryItem.procedureItems && queryItem.procedureItems != 0){
                //if there is a item and loop through item and pull item
                for(let e of queryItem.procedureItems){
                 let queryProcedureFromHo =  await Stock.findOne({relatedProcedureItems:e.item_id, relatedBranch: relatedBranch})
                 let totalUnit = queryProcedureFromHo.totalUnit - e.qty
                 let currentQty = ( queryProcedureFromHo.fromUnit * totalUnit ) / queryProcedureFromHo.toUnit
                 let result = await Stock.findOneAndUpdate({relatedProcedureItems:e.item_id, relatedBranch: relatedBranch},{
                     totalUnit: totalUnit,
                     currentQty: currentQty
                  })
                }
                //loop and add procedure item in stock 
                loopIssue(procedureItems, async function(procedureItem){
                 let queryProcedureItem = await Stock.findOne({relatedProcedureItems:procedureItem.item_id, relatedBranch: relatedBranch})
                 let totalUnit = queryProcedureItem.totalUnit + procedureItem.qty
                 let currentQty = ( queryProcedureItem.fromUnit * totalUnit ) / queryProcedureItem.toUnit
                 let updateProcedureItem = await Stock.findOneAndUpdate({relatedProcedureItems:procedureItem.item_id, relatedBranch: relatedBranch},{
                     totalUnit: totalUnit,
                     currentQty: currentQty
                 })
                })
             //    // update medicine item 
                await TransferToHoRecord.findByIdAndUpdate(id,{
                 procedureItems: procedureItems,
                })
            }else { 
                // if there is no medicine item in queryIteem   
                let totalUnit
                 loopIssue(procedureItems, async function(procedureItem){
                    let updateProcedureItem = await Stock.findOne({relatedProcedureItems:procedureItem.item_id, relatedBranch: relatedBranch}).then(result => {
                     
                       result.totalUnit += procedureItem.qty
                       totalUnit = result.totalUnit
                       result.currentQty = ( result.fromUnit * result.totalUnit ) / result.toUnit
                       result.save()
                    },{new: true})
                const logResult = await Log.create({
                      "relatedBranch": relatedBranch,
                      "relatedProcedureItems": procedureItem.item_id,
                      "currentQty": procedureItem.stock,
                      "actualQty": procedureItem.actual,
                      "finalQty": totalUnit,
                      "type": "Issue To Ho",
                      "createdBy": createdBy
                    }) 
                })
                await TransferToHoRecord.findByIdAndUpdate(id,{
                    procedureItems: procedureItems,
                   })
               }
            }
            //accessory item 
        if(accessoryItems && accessoryItems.length != 0){
            if(queryItem.accessoryItems && queryItem.accessoryItems != 0){
                //if there is a item and loop through item and pull item
                for(let e of queryItem.accessoryItems){
                 let queryAccessoryItemFromHo =  await Stock.findOne({relatedAccessoryItems:e.item_id, relatedBranch: relatedBranch})
                 let totalUnit = queryAccessoryItemFromHo.totalUnit - e.qty
                 let currentQty = ( queryAccessoryItemFromHo.fromUnit * totalUnit ) / queryAccessoryItemFromHo.toUnit
                 let result = await Stock.findOneAndUpdate({relatedAccessoryItems:e.item_id, relatedBranch: relatedBranch},{
                     totalUnit: totalUnit,
                     currentQty: currentQty
                  })
                }
                //loop and add medicine item in stock 
                loopIssue(accessoryItems, async function(accessoryItem){
                 let queryAccessoryItem = await Stock.findOne({relatedAccessoryItems:accessoryItem.item_id, relatedBranch: relatedBranch})
                 let totalUnit = queryMedicineItem.totalUnit + medicineItem.qty
                 let currentQty = ( queryAccessoryItem.fromUnit * totalUnit ) / queryAccessoryItem.toUnit
                 let updateAccessoryItem = await Stock.findOneAndUpdate({relatedAccessoryItems:accessoryItem.item_id, relatedBranch: relatedBranch},{
                     totalUnit: totalUnit,
                     currentQty: currentQty
                 })
                })
             //    // update medicine item 
                await TransferToHoRecord.findByIdAndUpdate(id,{
                 accessoryItems: accessoryItems,
                })
            }else { 
                // if there is no accessory item in queryIteem   
                 loopIssue(accessoryItems, async function(accessoryItem){
                    let updateAccessoryItem = await Stock.findOne({relatedAccessoryItems:accessoryItem.item_id, relatedBranch: relatedBranch}).then(result => {
                     
                       result.totalUnit += accessoryItem.qty
                       totalUnit = result.totalUnit
                       result.currentQty = ( result.fromUnit * result.totalUnit ) / result.toUnit
                       result.save()
                    },{new: true})
                const logResult = await Log.create({
                      "relatedBranch": relatedBranch,
                      "relatedAccessoryItems": accessoryItem.item_id,
                      "currentQty": accessoryItem.stock,
                      "actualQty": accessoryItem.actual,
                      "finalQty": totalUnit,
                      "type": "Issue To Ho",
                      "createdBy": createdBy
                    }) 
                })
                await TransferToHoRecord.findByIdAndUpdate(id,{
                    accessoryItems: accessoryItems,
                   })
               }
            }
        //general item 
        if(generalItems && generalItems.length != 0){
            if(queryItem.generalItems && queryItem.generalItems != 0){
                //if there is a item and loop through item and pull item
                for(let e of queryItem.generalItems){
                 let queryGeneralFromHo =  await Stock.findOne({relatedGeneralItems:e.item_id, relatedBranch: relatedBranch})
                 let totalUnit = queryGeneralFromHo.totalUnit - e.qty
                 let currentQty = ( queryGeneralFromHo.fromUnit * totalUnit ) / queryGeneralFromHo.toUnit
                 let result = await Stock.findOneAndUpdate({relatedGeneralItems:e.item_id, relatedBranch: relatedBranch},{
                     totalUnit: totalUnit,
                     currentQty: currentQty
                  })
                }
                //loop and add general item in stock 
                loopIssue(generalItems, async function(generalItem){
                 let queryGeneralItem = await Stock.findOne({relatedGeneralItems:generalItem.item_id, relatedBranch: relatedBranch})
                 let totalUnit = queryGeneralItem.totalUnit + generalItem.qty
                 let currentQty = ( queryGeneralItem.fromUnit * totalUnit ) / queryGeneralItem.toUnit
                 let updateGeneralItem = await Stock.findOneAndUpdate({relatedGeneralItems:generalItem.item_id, relatedBranch: relatedBranch},{
                     totalUnit: totalUnit,
                     currentQty: currentQty
                 })
                })
             //    // update general item 
                await TransferToHoRecord.findByIdAndUpdate(id,{
                 generalItems: generalItems,
                })
            }else { 
                // if there is no general item in queryIteem   
                 loopIssue(generalItems, async function(generalItem){
                    let updateGeneralItem = await Stock.findOne({relatedGeneralItems:generalItem.item_id, relatedBranch: relatedBranch}).then(result => {
                     
                       result.totalUnit += generalItem.qty
                       totalUnit = result.totalUnit
                       result.currentQty = ( result.fromUnit * result.totalUnit ) / result.toUnit
                       result.save()
                    },{new: true})
                const logResult = await Log.create({
                      "relatedBranch": relatedBranch,
                      "relatedGeneralItems": generalItem.item_id,
                      "currentQty": generalItem.stock,
                      "actualQty": generalItem.actual,
                      "finalQty": totalUnit,
                      "type": "Issue To Ho",
                      "createdBy": createdBy
                    }) 
                })
                await TransferToHoRecord.findByIdAndUpdate(id,{
                    generalItems: generalItems,
                   })
               }
            }
       
        let result = await TransferToHoRecord.findByIdAndUpdate(id,{...data},{new: true})
        result ? res.status(200).send({
                                 success: true,
                                 data: result,
                                 message: "Updated Successfully"
                                    })
             : res.status(200).send({
                success: true,
                message: "There is no data for this one"
             })
    }
    catch(error){
        res.status(500).send({
            error:true,
            message:error.message
        })
    }   
}

exports.deleteTransferToHOById = async ( req, res ) => {
    let { id } = req.params
    let time = new Date(Date.now())
    try{
      let result = await TransferToHoRecord.findByIdAndUpdate(id,{isDeleted: true, expireAt: time})
      result ? res.status(200).send({
                                 success: true,
                                 message: "Deleted Successfully"
                                    })
             : res.status(200).send({
                success: true,
                message: "There is no data for this one"
             })
    }
    catch(error){
        res.status(500).send({
            error:true,
            message:error.message
        })
    }   
}