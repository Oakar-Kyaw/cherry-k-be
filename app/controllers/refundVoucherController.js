const AccountingList = require("../models/accountingList");
const RefundVouchers = require("../models/refundVoucher");
const TreatmentVoucher = require("../models/treatmentVoucher");
const TreatmentSelection = require("../models/treatmentSelection");
const KmaxVoucher = require("../models/kmaxVoucher");
const Stock = require("../models/stock");
const MedicineItem = require("../models/medicineItem");
const AccessoryItem = require("../models/accessoryItem");
const ProcedureItem = require("../models/procedureItem");

//loopItems function 
const loopItems = (length,fn)=>{
   for(let i = 0; i<length; i++){
     fn(i)
   }
}

//list refund voucher
exports.listAllRefundVoucher = async (req, res, next) => {
   
    let { keyword, role, limit, skip } = req.query;
    let count = 0;
    let page = 0 ;

  try {
       limit = +limit <= 100 ? +limit : 10;
       skip += skip || 0 ;
       let query = {isDeleted:false} , regexKeyword
      // role ? ( query["role"] )
   } catch (error) {
     res.status(500)
     .send({
       error : "Failed to list all refund voucher",
       message : error.message
     })
   }
}

//create refund voucher 
exports.createRefundVoucher = async( req, res, next) =>{
  try{
    //let { code, amount, date, refundAccount, refundVoucherId, remark, type, selections } = req.body;
    let { kMax,  cashBackAmount, date, refundAccount, refundVoucherId, remark, type, selections, newTreatmentVoucherId, relatedMedicineItems, relatedAccessoryItems, relatedProcedureItems, relatedBranch } = req.body;
    //let data = {voucherCode : code, refundAccount: refundAccount,refundVoucherId: refundVoucherId, refundDate: date, reason: remark, refundType: type, cashBackAmount: amount};
  
    
    //if refund is treatment
    if(newTreatmentVoucherId){
       //update new treatment voucher id 
       let updatedNewTreatmentVoucherId = await TreatmentVoucher.findByIdAndUpdate(
        refundVoucherId,
        {
            newTreatmentVoucherId: newTreatmentVoucherId
        }
    )
    }
    //if refund is cashback
    else {
      //check if it is from kMax
     if(kMax) {
         let updateKMaxVoucher = {
           Refund :true,
           refundAccount : refundAccount || null,
           refundVoucherId: refundVoucherId,
           refundDate: date, 
           refundReason: remark,
           cashBackAmount: cashBackAmount,
         }
         let updatedKmaxVoucher = await KmaxVoucher.findByIdAndUpdate(
           refundVoucherId,
           updateKMaxVoucher
         )
         //add stock the quantity of refund amount
   //loop relatedeMedicineItems
   if(relatedMedicineItems){
    loopItems(relatedMedicineItems.length,async function(index){
      let relatedMedicineItemsId = relatedMedicineItems[index].item_id;
      let relatedMedicineItemsQuantity = relatedMedicineItems[index].qty;
      let filter = { _id:relatedMedicineItemsId };
      let queryMedicineItem = await MedicineItem.findOne(filter);
      let totalUnit = queryMedicineItem.totalUnit + relatedMedicineItemsQuantity;
      let currentQuantity = totalUnit / queryMedicineItem.toUnit;
      let updatedMedicineItem= await MedicineItem.findOneAndUpdate(
        filter,
        {
          totalUnit:totalUnit,
          currentQuantity:currentQuantity
        }
        )
   })
   }
   
   //add stock the quantity of refund amount
   //loop relatedAccessoryItems
   if(relatedAccessoryItems){
    loopItems(relatedAccessoryItems.length,async function(index){
    let relatedAccessoryItemsId = relatedAccessoryItems[index].item_id;
    let relatedAccessoryItemsQuantity = relatedAccessoryItems[index].qty;
    let filter = { _id:relatedAccessoryItemsId };
    let queryAccessoryItems = await  AccessoryItem.findOne(filter);
    let totalUnit = queryAccessoryItems.totalUnit + relatedAccessoryItemsQuantity;
    let currentQuantity = totalUnit / queryAccessoryItems.toUnit;
    let updatedAccessoryItems= await AccessoryItem.findOneAndUpdate(
      filter,
      {
        totalUnit:totalUnit,
        currentQuantity: currentQuantity
      }
      )
 })
   }
   
 //add stock the quantity of refund amount
   //loop relatedProcedureItems
   if(relatedProcedureItems){
    loopItems(relatedProcedureItems.length,async function(index){
    let relatedProcedureItemsId = relatedProcedureItems[index].item_id;
    let relatedProcedureItemsQuantity = relatedProcedureItems[index].qty;
    let filter = { relatedProcedureItems:relatedProcedureItemsId };   
    let queryProcedureItems = await ProcedureItem.findOne(filter);
    let totalUnit = queryProcedureItems.totalUnit + relatedProcedureItemsQuantity;
    let currentQuantity = totalUnit / queryProcedureItems.toUnit;
    let updatedProcedureItem= await ProcedureItem.findOneAndUpdate(
      filter,
      {
        totalUnit:totalUnit,
        currentQuantity:currentQuantity
      }
      )
 })
   }
   
     }
     //if not from  KMax
     else {
         //payload from req.body to update treatment voucher
         let updateTreatmentVoucherData = {
           Refund :true,
           refundAccount: refundAccount || null,
         //  refundAmount: refundAmount || null,
           refundVoucherId: refundVoucherId,
           refundDate: date, 
           refundReason: remark, 
           refundType: type, 
           cashBackAmount: cashBackAmount,
         // newTreatmentVoucherCode: newTreatmentVoucherCode || null,
         // newTreatmentVoucherId: newTreatmentVoucherId || null
         };
     //let result = await RefundVouchers.create(data);
     if(selections.length != 0 ){
     for(let i = 0 ; i < selections.length ; i++ ) {
     let treatmentSelectionId = selections[i].id;
     let updateTreatmentSelectionRefund = await TreatmentSelection.findByIdAndUpdate(
     treatmentSelectionId,
     {
     Refund : true, 
     }
     )
     }
     //  selections.map(selection => async{
     //     let treatmentSelectionId = selection.id;
     //     let updateTreatmentSelectionRefund = await TreatmentSelection.findByIdAndUpdate(
     //       treatmentSelectionId,
     //       {
     //         Refund : true
     //       }
     //     )
     //  })
     } 
      let addRefund = await TreatmentVoucher.findByIdAndUpdate(refundVoucherId, updateTreatmentVoucherData
     )
     //add stock the quantity of refund amount
   //loop relatedeMedicineItems
   if(relatedMedicineItems){
    loopItems(relatedMedicineItems.length,async function(index){
      let relatedMedicineItemsId = relatedMedicineItems[index].item_id;
      let relatedMedicineItemsQuantity = relatedMedicineItems[index].qty;
      let filter = { relatedBranch:relatedBranch, relatedMedicineItems:relatedMedicineItemsId };
      let queryMedicineItem = await Stock.findOne(filter);
      let totalUnit = queryMedicineItem.totalUnit + relatedMedicineItemsQuantity;
      let currentQuantity = totalUnit / queryMedicineItem.toUnit;
      console.log("medicine ", currentQuantity)
      let updatedMedicineItem= await Stock.updateMany(
        filter,
        {
          $set:{
          totalUnit:totalUnit,
          currentQty:currentQuantity
        }
        }
        )
   })
   }
   
   //add stock the quantity of refund amount
   //loop relatedAccessoryItems
   if(relatedAccessoryItems){
    loopItems(relatedAccessoryItems.length,async function(index){
    let relatedAccessoryItemsId = relatedAccessoryItems[index].item_id;
    let relatedAccessoryItemsQuantity = relatedAccessoryItems[index].qty;
    let filter = { relatedBranch:relatedBranch, relatedAccessoryItems:relatedAccessoryItemsId };
    let queryAccessoryItems = await Stock.findOne(filter);
    let totalUnit = queryAccessoryItems.totalUnit + relatedAccessoryItemsQuantity;
    let currentQuantity = totalUnit / queryAccessoryItems.toUnit;
    console.log("accessory ", currentQuantity)
    let updatedAccessoryItems= await Stock.updateMany(
      filter,
      {
        $set:{
          totalUnit:totalUnit,
          currentQty:currentQuantity
        }
      }
      )
 })
   }
   
 //add stock the quantity of refund amount
   //loop relatedProcedureItems
   if(relatedProcedureItems){
    loopItems(relatedProcedureItems.length,async function(index){
    let relatedProcedureItemsId = relatedProcedureItems[index].item_id;
    let relatedProcedureItemsQuantity = relatedProcedureItems[index].qty;
    let filter = { relatedBranch:relatedBranch, relatedProcedureItems:relatedProcedureItemsId };
    let queryProcedureItems = await Stock.findOne(filter);
    let totalUnit = queryProcedureItems.totalUnit + relatedProcedureItemsQuantity;
    let currentQuantity = totalUnit / queryProcedureItems.toUnit;
    console.log("proceducre ", currentQuantity)
    let updatedProcedureItem= await Stock.updateMany(
      filter,
      {
        $set:{
          totalUnit:totalUnit,
          currentQty:currentQuantity
        }
      }
      )
 })
   }
   
    }
     // let queryVoucher = await TreatmentVoucher.findById(refundVoucherId);
     // queryVoucher.Refund = true;
     // let nooftreatmentselection = queryVoucher.relatedTreatmentSelection.length;
     // for (let i = 0 ; i < nooftreatmentselection; i++ ){
     //       queryVoucher.relatedTreatmentSelection[i].Refund = true;
     // }
     //  queryVoucher.save();
     //console.log("rf "+JSON.stringify(updateTreatmentVoucherData))
   
     /// let updatevoucher = await TreatmentVoucher.findById(refundVoucherId);
     ///  console.log("Result is "+JSON.stringify(updatevoucher))
     let queryAccountingLists = await AccountingList.findById(refundAccount);
     let amounts = queryAccountingLists.amount - cashBackAmount;
     let updatedAccountingLists = await AccountingList.findByIdAndUpdate(refundAccount,{
     amount:amounts
     })
   }
   
   
   
    //query accounting list 
   // let queryUpdatedAccountingLists = await AccountingList.findById(refundAccount);

    //query refund voucher 
  //  let queryRefundVoucher = await RefundVouchers.findById({refundVoucherId : refundVoucherId}).populate("AccountingLists Vouchers")
    res.status(200).send({
        message: "Refund created successfully",
     //   refundVouchers: queryRefundVoucher,
       // accountingList : queryUpdatedAccountingLists
    })
  }
  catch(error){
     res.status(500).send({error:"can't created ",message:error.message})
  }
       
}