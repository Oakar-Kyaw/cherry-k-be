const AccessoryItem = require("../models/accessoryItem")
const GeneralItem = require("../models/generalItem")
const MedicineItem = require("../models/medicineItem")
const ProcedureItem = require("../models/procedureItem")
const Stock = require("../models/stock")

class AddStockAndSubtractStock {
    constructor(relatedBranch) {
        this.relatedBranch = relatedBranch
    }
    // add medicine item from stock
    async addMedicineStock(id,qty) {
        try{
            let queryMedicineItem = await Stock.findOne({relatedMedicineItems:id, relatedBranch: this.relatedBranch}) 
            let totalUnit = queryMedicineItem.totalUnit + qty
            let currentQty = ( queryMedicineItem.fromUnit * totalUnit ) / queryMedicineItem.toUnit
            let updateMedicineItem = await Stock.findOneAndUpdate({relatedMedicineItems:id, relatedBranch: this.relatedBranch},{
                                      totalUnit: totalUnit,
                                      currentQty: currentQty
                                    },{new:true}) 
            
           }catch(error){
             return {
                 error: true,
                 message: error.message
             }
           }
    }
    // add accessory item from stock
    async addAccessoryItemStock(id,qty) {
        try{
            let queryAccessoryItem = await Stock.findOne({relatedAccessoryItems:id, relatedBranch: this.relatedBranch}) 
            let totalUnit = queryAccessoryItem.totalUnit + qty
            let currentQty = ( queryAccessoryItem.fromUnit * totalUnit ) / queryAccessoryItem.toUnit
            let updateAccessoryItem = await Stock.findOneAndUpdate({relatedAccessoryItems:id, relatedBranch: this.relatedBranch},{
                                      totalUnit: totalUnit,
                                      currentQty: currentQty
                                    },{new:true}) 
            
           }catch(error){
             return {
                 error: true,
                 message: error.message
             }
           }
    }
    // add procedure item from stock
    async addProcedureStock(id,qty) {
        try{
            let queryProcedureItem = await Stock.findOne({relatedProcedureItems:id, relatedBranch: this.relatedBranch}) 
            let totalUnit = queryProcedureItem.totalUnit + qty
            let currentQty = ( queryProcedureItem.fromUnit * totalUnit ) / queryProcedureItem.toUnit
            let updateProcedureItem = await Stock.findOneAndUpdate({relatedProcedureItems:id, relatedBranch: this.relatedBranch},{
                                      totalUnit: totalUnit,
                                      currentQty: currentQty
                                    },{new:true}) 
            
           }catch(error){
             return {
                 error: true,
                 message: error.message
             }
           }
    }
    // add general item from stock
    async addGeneralStock(id,qty) {
        try{
            let queryGeneralItem = await Stock.findOne({relatedGeneralItems:id, relatedBranch: this.relatedBranch}) 
            let totalUnit = queryGeneralItem.totalUnit + qty
            let currentQty = ( queryGeneralItem.fromUnit * totalUnit ) / queryGeneralItem.toUnit
            let updateGeneralItem = await Stock.findOneAndUpdate({relatedGeneralItems:id, relatedBranch: this.relatedBranch},{
                                      totalUnit: totalUnit,
                                      currentQty: currentQty
                                    },{new:true}) 
            
           }catch(error){
             return {
                 error: true,
                 message: error.message
             }
           }
    }
    // subtract medicine item from stock
    async subtractMedicineStock(id,qty) {
      try{
       let queryMedicineItem = await Stock.findOne({relatedMedicineItems:id, relatedBranch: this.relatedBranch}) 
       let totalUnit = queryMedicineItem.totalUnit - qty
       let currentQty = ( queryMedicineItem.fromUnit * totalUnit ) / queryMedicineItem.toUnit
       let updateMedicineItem = await Stock.findOneAndUpdate({relatedMedicineItems:id, relatedBranch: this.relatedBranch},{
                                 totalUnit: totalUnit,
                                 currentQty: currentQty
                               },{new:true}) 
       
      }catch(error){
        return {
            error: true,
            message: error.message
        }
      }
      
    }
    // subtract procedure item from stock
    async subtractProcedureStock(id,qty) {
        try{
         let queryProcedureItem = await Stock.findOne({relatedProcedureItems:id, relatedBranch: this.relatedBranch}) 
         let totalUnit = queryProcedureItem.totalUnit - qty
         let currentQty = ( queryProcedureItem.fromUnit * totalUnit ) / queryProcedureItem.toUnit
         let updateProcedureItem = await Stock.findOneAndUpdate({relatedProcedureItems:id, relatedBranch: this.relatedBranch},{
                                   totalUnit: totalUnit,
                                   currentQty: currentQty
                                 },{new:true}) 
         
        }catch(error){
          return {
              error: true,
              message: error.message
          }
        }
        
      }
    // subtract accessory item from stock
    async subtractAccessoryStock(id,qty) {
        try{
         let queryAccessoryItem = await Stock.findOne({relatedAccessoryItems:id, relatedBranch: this.relatedBranch}) 
         let totalUnit = queryAccessoryItem.totalUnit - qty
         let currentQty = ( queryAccessoryItem.fromUnit * totalUnit ) / queryAccessoryItem.toUnit
         let updateAccessoryItem = await Stock.findOneAndUpdate({relatedAccessoryItems:id, relatedBranch: this.relatedBranch},{
                                   totalUnit: totalUnit,
                                   currentQty: currentQty
                                 },{new:true}) 
         
        }catch(error){
          return {
              error: true,
              message: error.message
          }
        }
        
      }
    // subtract general item from stock
    async subtractGeneralStock(id,qty) {
        try{
         let queryGeneralItem = await Stock.findOne({relatedGeneralItems:id, relatedBranch: this.relatedBranch}) 
         let totalUnit = queryGeneralItem.totalUnit - qty
         let currentQty = ( queryGeneralItem.fromUnit * totalUnit ) / queryGeneralItem.toUnit
         let updateGeneralItem = await Stock.findOneAndUpdate({relatedGeneralItems:id, relatedBranch: this.relatedBranch},{
                                   totalUnit: totalUnit,
                                   currentQty: currentQty
                                 },{new:true}) 
         
        }catch(error){
          return {
              error: true,
              message: error.message
          }
        }
        
      }
      // add medicine item 
    async addMedicine(id,qty) {
        try{
            let queryMedicineItem = await MedicineItem.findOne({_id:id}) 
            let totalUnit = parseInt(queryMedicineItem.totalUnit) + qty
            let currentQuantity = ( parseInt(queryMedicineItem.fromUnit) * totalUnit ) / parseInt(queryMedicineItem.toUnit)
            let updateMedicineItem = await MedicineItem.findOneAndUpdate({_id:id},{
                                      totalUnit: totalUnit,
                                      currentQuantity: currentQuantity
                                    },{new:true}) 
            
           }catch(error){
             return {
                 error: true,
                 message: error.message
             }
           }
    }
    // add accessory item 
    async addAccessory(id,qty) {
        try{
            let queryAccessoryItem = await AccessoryItem.findOne({_id:id}) 
            let totalUnit = parseInt(queryAccessoryItem.totalUnit) + qty
            let currentQuantity = ( parseInt(queryAccessoryItem.fromUnit) * totalUnit ) / parseInt(queryAccessoryItem.toUnit)
            let updateAccessoryItem = await AccessoryItem.findOneAndUpdate({_id:id},{
                                      totalUnit: totalUnit,
                                      currentQuantity: currentQuantity
                                    },{new:true}) 
            
           }catch(error){
             return {
                 error: true,
                 message: error.message
             }
           }
    }
    // add procedure item 
    async addProcedure(id,qty) {
        try{
            let queryProcedureItem = await ProcedureItem.findOne({_id:id}) 
            let totalUnit = parseInt(queryProcedureItem.totalUnit) + qty
            let currentQuantity = ( parseInt(queryProcedureItem.fromUnit) * totalUnit ) / parseInt(queryProcedureItem.toUnit)
            let updateProcedureItem = await ProcedureItem.findOneAndUpdate({_id:id},{
                                      totalUnit: totalUnit,
                                      currentQuantity: currentQuantity
                                    },{new:true}) 
            
           }catch(error){
             return {
                 error: true,
                 message: error.message
             }
           }
    }
    // add general item 
    async addGeneral(id,qty) {
        try{
            let queryGeneralItem = await GeneralItem.findOne({_id:id}) 
            let totalUnit = parseInt(queryGeneralItem.totalUnit) + qty
            let currentQuantity = ( parseInt(queryGeneralItem.fromUnit) * totalUnit ) / parseInt(queryGeneralItem.toUnit)
            let updateGeneralItem = await GeneralItem.findOneAndUpdate({_id:id},{
                                      totalUnit: totalUnit,
                                      currentQuantity: currentQuantity
                                    },{new:true}) 
            
           }catch(error){
             return {
                 error: true,
                 message: error.message
             }
           }
    }
    // subtract medicine item 
    async subtractMedicine(id,qty) {
      try{
       let queryMedicineItem = await MedicineItem.findOne({_id:id}) 
       let totalUnit = parseInt(queryMedicineItem.totalUnit) - qty
       let currentQuantity = ( parseInt(queryMedicineItem.fromUnit) * totalUnit ) / parseInt(queryMedicineItem.toUnit)
       let updateMedicineItem = await MedicineItem.findOneAndUpdate({_id:id},{
                                 totalUnit: totalUnit,
                                 currentQuantity: currentQuantity
                               },{new:true}) 
       
      }catch(error){
        return {
            error: true,
            message: error.message
        }
      }
      
    }
    // subtract procedure item 
    async subtractProcedure(id,qty) {
        try{
         let queryProcedureItem = await ProcedureItem.findOne({_id:id}) 
         let totalUnit = parseInt(queryProcedureItem.totalUnit) - qty
         let currentQuantity = ( parseInt(queryProcedureItem.fromUnit) * totalUnit ) / parseInt(queryProcedureItem.toUnit)
         let updateProcedureItem = await ProcedureItem.findOneAndUpdate({_id:id},{
                                   totalUnit: totalUnit,
                                   currentQuantity: currentQuantity
                                 },{new:true}) 
         
        }catch(error){
          return {
              error: true,
              message: error.message
          }
        }
        
      }
    // subtract accessory item 
    async subtractAccessory(id,qty) {
        try{
         let queryAccessoryItem = await AccessoryItem.findOne({_id:id}) 
         let totalUnit = parseInt(queryAccessoryItem.totalUnit) - qty
         let currentQuantity = ( parseInt(queryAccessoryItem.fromUnit) * totalUnit ) / parseInt(queryAccessoryItem.toUnit)
         let updateAccessoryItem = await AccessoryItem.findOneAndUpdate({_id:id},{
                                   totalUnit: totalUnit,
                                   currentQuantity: currentQuantity
                                 },{new:true}) 
         
        }catch(error){
          return {
              error: true,
              message: error.message
          }
        }
        
      }
    // subtract general item 
    async subtractGeneral(id,qty) {
        try{
         let queryGeneralItem = await GeneralItem.findOne({_id:id}) 
         let totalUnit = parseInt(queryGeneralItem.totalUnit) - qty
         let currentQuantity = ( parseInt(queryGeneralItem.fromUnit) * totalUnit ) / parseInt(queryGeneralItem.toUnit)
         let updateGeneralItem = await GeneralItem.findOneAndUpdate({_id:id},{
                                   totalUnit: totalUnit,
                                   currentQuantity: currentQuantity
                                 },{new:true}) 
         
        }catch(error){
          return {
              error: true,
              message: error.message
          }
        }
        
      }
}

module.exports =  AddStockAndSubtractStock