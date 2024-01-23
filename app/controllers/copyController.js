"use strict";
const accessoryItem = require("../models/accessoryItem");
const MedicineItem = require("../models/medicineItem");
const procedureItem = require("../models/procedureItem");
const Stock = require("../models/stock");


exports.createCopyBranch = async (req,res) => { 
  
  async function ProcedureItems (){
    let data = {
      relatedBranch:"6474394fdab649311f9fcc32",
      currentQty:0,
      fromUnit:1, 
      toUnit:1, 
      totalUnit:0, 
      reOrderQuantity:0,
      isDeleted:false
     };
      let MedicineItems = await MedicineItem.find({isDeleted:false});
      let count = await MedicineItem.find({isDeleted:false}).count();
      for(let i=0; i < count; i++){
         data.relatedMedicineItems = MedicineItems[i];
        // data.relatedProcedureItems = ProcedureItems[i];
        //  data.relatedAccessoryItems = AccessoryItems[i];
         let stock = await Stock.create(data); 
      }
    }
 async function MedicineItems (){
  let data = {
    relatedBranch:"6474394fdab649311f9fcc32",
    currentQty:0,
    fromUnit:1, 
    toUnit:1, 
    totalUnit:0, 
    reOrderQuantity:0,
    isDeleted:false
   };
   let ProcedureItems = await procedureItem.find({isDeleted:false});
   let count = await procedureItem.find({isDeleted:false}).count();
    for(let i=0; i < count; i++){
      // data.relatedMedicineItems = MedicineItems[i];
       data.relatedProcedureItems = ProcedureItems[i];
      //  data.relatedAccessoryItems = AccessoryItems[i];
       let stock = await Stock.create(data); 
    }
  }
  async function accessoryItems (){
    let data = {
      relatedBranch:"6474394fdab649311f9fcc32",
      currentQty:0,
      fromUnit:1, 
      toUnit:1, 
      totalUnit:0, 
      reOrderQuantity:0,
      isDeleted:false
     };
    let AccessoryItems = await accessoryItem.find({isDeleted:false});
   // let MedicineItems = await MedicineItem.find({isDeleted:false});
   // let count = await MedicineItem.find({isDeleted:false}).count();
    let count1 = await accessoryItem.find({isDeleted:false}).count();
    for(let i=0; i < count1; i++){
       //data.relatedMedicineItems = MedicineItems[i];
       
      // data.relatedProcedureItems = ProcedureItems[i];
        data.relatedAccessoryItems = AccessoryItems[i];
       let stock = await Stock.create(data); 
    }
  }

  MedicineItems()
  accessoryItems()
  ProcedureItems()
 //  
  // 
  // let ProcedureItems = await procedureItem.find({isDeleted:false});
   
  // 
   //
  //let count = await procedureItem.find({isDeleted:false}).count();
  
  //  for(let i=0; i < count; i++){
  //    // data.relatedMedicineItems = MedicineItems[i];
  //     data.relatedProcedureItems = ProcedureItems[i];
  //    //  data.relatedAccessoryItems = AccessoryItems[i];
  //     let stock = await Stock.create(data); 
  //  }
   
  // let queryStock = await Stock.findById({relatedBranch:"6535f7fef68b0525e0eaf151"})
    
    res.status(200)
    .send({
        success:"Success",
        //data:queryStock,
       // count: count
    })
}

exports.deleteCopy = async (req,res) => {
    let stock = await Stock.deleteMany({relatedBranch: "6535f811f68b0525e0eaf152"})
   // let count = await Stock.findByIdAndDelete({relatedBranch:ObjectId("6535f7fef68b0525e0eaf151")}).sort({"_id":-1}).limit(2).count()
    res.status(200)
    .send({
     //   data:stock,
    //    count:count
    })
}
