'use strict'
const KmaxVoucher = require('../models/kmaxVoucher')
const Transaction = require('../models/transaction')
const Debt = require('../models/debt')
const Accounting = require('../models/accountingList')
const Patient = require('../models/patient')
const Stock = require('../models/stock')
const Log = require('../models/log')
const MedicineItem = require('../models/medicineItem')
const ProcedureItem = require('../models/procedureItem')
const AccessoryItem = require('../models/accessoryItem')


//loop function
const loopForMedicineProcedureAndAccessory = (number,fn) => {
    for(let i= 0 ; i < number; i++){
       fn(i)
    }
}

exports.listAllKmaxVouchers = async (req, res) => {
  let { keyword, role, limit, skip } = req.query
  let count = 0
  let page = 0
  try {
    limit = +limit <= 100 ? +limit : 10 //limit
    skip = +skip || 0
    let query = req.mongoQuery,
      regexKeyword
    role ? (query['role'] = role.toUpperCase()) : ''
    keyword && /\w/.test(keyword)
      ? (regexKeyword = new RegExp(keyword, 'i'))
      : ''
    regexKeyword ? (query['name'] = regexKeyword) : ''
    if (req.query.createdBy) query.createdBy = req.query.createdBy
    console.log(query)
    let result = await KmaxVoucher.find(query).populate(
      'relatedDoctor relatedTreatment secondAccount relatedAppointment relatedPatient relatedBank relatedCash paymentType relatedBranch createdBy relatedAccounting payment medicineSale procedureSale.item_id accessorySale.item_id'
    )
    count = await KmaxVoucher.find(query).count()
    const division = count / limit
    page = Math.ceil(division)
    res.status(200).send({
      success: true,
      count: count,
      _metadata: {
        current_page: skip / limit + 1,
        per_page: limit,
        page_count: page,
        total_count: count
      },
      list: result
    })
  } catch (e) {
    //console.log(e)
    return res.status(500).send({ error: true, message: e.message })
  }
}

exports.getKmaxVoucher = async (req, res) => {
  let query = req.mongoQuery
  if (req.params.id) query._id = req.params.id
  const result = await KmaxVoucher.find(query).populate(
    'relatedDoctor relatedTreatment secondAccount relatedAppointment relatedPatient relatedBank relatedCash paymentType relatedBranch createdBy relatedAccounting payment'
      ).populate({
        path:"medicineSale",
        populate:{
          path:"medicineSale"
        }
      }).populate({
        path:"procedureSale",
        populate:{
          path:"item_id"
        }
      }).populate({
        path:"accessorySale",
        populate:{
          path:"item_id"
        }
      })
  if (!result)
    return res.status(500).json({ error: true, message: 'No Record Found' })
  return res.status(200).send({ success: true, data: result })
}

exports.createKmaxVoucher = async (req, res, next) => {
  let data = req.body
  let { msPaidAmount } = req.body
  let createdBy = req.credentials.id
  try {
    let { medicineSale, procedureSale, accessorySale, relatedBranch, balance, relatedPatient, payAmount, relatedBank, relatedCash  } = data
    //search ids from medicine sale and loop and search in medicine item
    if(medicineSale.length != 0) {
       loopForMedicineProcedureAndAccessory(medicineSale.length, async function (i) {
       let queryMedicine = await MedicineItem.findById(medicineSale[i].item_id);
       let totalQty = queryMedicine.totalUnit - ( medicineSale[i].qty * queryMedicine.toUnit );
       let currentQty =  ((totalQty < 0 ? 0 : totalQty) * queryMedicine.fromUnit )/ queryMedicine.toUnit;
       let updateAndQueryMedicine = await MedicineItem.findByIdAndUpdate(
        medicineSale[i].item_id,
         {
           currentQuantity : currentQty,
           totalUnit : totalQty
         }
       )
    })
  }

    //search ids from procedure sale and loop and search in procedure item
    if(procedureSale.length != 0) {  loopForMedicineProcedureAndAccessory(procedureSale.length, async function (i) {
      let queryProcedure = await  ProcedureItem.findById(procedureSale[i].item_id);
      let totalQty = queryProcedure.totalUnit - ( procedureSale[i].qty * queryProcedure.toUnit );
      let currentQty =  ((totalQty < 0 ? 0 : totalQty) * queryProcedure.fromUnit )/ queryProcedure.toUnit;
      let updateAndQueryProcedure = await ProcedureItem.findByIdAndUpdate(
       procedureSale[i].item_id,
        {
          currentQuantity : currentQty,
          totalUnit : totalQty
        }
      )
   })
  }
   //search ids from accessory sale and loop and search in accessory item
   if(accessorySale.length !=0) {

    loopForMedicineProcedureAndAccessory(accessorySale.length, async function (i) {
    let queryAccessory = await AccessoryItem.findById(accessorySale[i].item_id);
    let totalQty = queryAccessory.totalUnit - ( accessorySale[i].qty * queryAccessory.toUnit );
    let currentQty =  ((totalQty < 0 ? 0 : totalQty) * queryAccessory.fromUnit )/ queryAccessory.toUnit;
    let updateAndQueryAccessory = await AccessoryItem.findByIdAndUpdate(
     accessorySale[i].item_id,
      {
        currentQuantity : currentQty,
        totalUnit : totalQty
      }
    )
 })
}
    //prepare CUS-ID
   const latestDocument = await KmaxVoucher.find({}, { seq: 1 })
     .sort({ _id: -1 })
      .limit(1)
      .exec()
    if (latestDocument.length == 0)
       
      data = { ...data, seq: 1, voucherCode: 'KVC-1' } // if seq is undefined set initial patientID and seq
    if (latestDocument.length) {
    
      const increment = latestDocument[0].seq + 1
      data = { ...data, voucherCode: 'KVC-' + increment, seq: increment }
   }
    const patientUpdate = await Patient.findOneAndUpdate(
      { _id: req.body.relatedPatient },
      {
        $inc: {
          conditionAmount: req.body.grandTotal,
          conditionPurchaseFreq: 1,
          conditionPackageQty: 1
        }
     },
      { new: true }
   )
//
    let objID = ''
    if (req.body.relatedBank) objID = req.body.relatedBank
    if (req.body.relatedCash) objID = req.body.relatedCash
   //transaction
    const acc = await Accounting.find({ _id: objID })
    
    const accResult = await Accounting.findOneAndUpdate(
      { _id: objID },
      { amount: parseInt(req.body.payAmount) + parseInt(acc[0].amount) },
    { new: true }
    )
    
    const newKmaxVoucher = new KmaxVoucher(data)
    const medicineSaleResult = await newKmaxVoucher.save()
     console.log("medicine result is ",medicineSaleResult._id.valueOf());
    const fTransaction = new Transaction({
      amount: data.payAmount,
      date: Date.now(),
      remark: req.body.remark,
      relatedAccounting: '646739c059a9bc811d97fa8b', //Sales (Medicines),
      relatedKmaxVoucher: medicineSaleResult._id,
      type: 'Credit',
      createdBy: createdBy
    })
    const fTransResult = await fTransaction.save()
    var amountUpdate = await Accounting.findOneAndUpdate(
      { _id: '646739c059a9bc811d97fa8b' },
      { $inc: { amount: -data.payAmount } }
    )
    //sec transaction
    const secTransaction = new Transaction({
      amount: data.payAmount,
      date: Date.now(),
      remark: req.body.remark,
      relatedBank: req.body.relatedBank,
      relatedCash: req.body.relatedCash,
      type: 'Debit',
      relatedTransaction: fTransResult._id,
      createdBy: createdBy
    })
    const secTransResult = await secTransaction.save()
    var fTransUpdate = await Transaction.findOneAndUpdate(
      { _id: fTransResult._id },
      {
        relatedTransaction: secTransResult._id
      },
      { new: true }
    )
    data = {
      ...data,
      relatedTransaction: [fTransResult._id, secTransResult._id],
      createdBy: createdBy,
      relatedBranch: req.body.relatedBranch
    }

   
    

   if (medicineSale !== undefined) {
     for (const e of medicineSale) {
       let totalUnit = e.stock - e.qty
       const result = await Stock.find({
         relatedMedicineItems: e.item_id,
     //    relatedBranch: relatedBranch
       })
       console.log("Result realted medicine "+JSON.stringify(e.quantity))
       const from = result[0].fromUnit
       const to = result[0].toUnit
       const currentQty = (from * totalUnit) / to
       try {
         const result = await Stock.findOneAndUpdate(
           { relatedMedicineItems: e.item_id}, //relatedBranch: relatedBranch },
           { totalUnit: totalUnit, currentQty: currentQty },
           { new: true }
         )
       } catch (error) {
         return res.status(500).send({ error: true, message: error.message })
       }
       const logResult = await Log.create({
         relatedTreatmentSelection: null,
         relatedAppointment: null,
         relatedMedicineItems: e.item_id,
         currentQty: e.stock,
         actualQty: e.actual,
         finalQty: totalUnit,
         type: 'K-Mart Sale',
         relatedBranch: relatedBranch,
         createdBy: createdBy
       })
     }
   }

   if (procedureSale !== undefined) {
     for (const e of procedureSale) {
       let totalUnit = e.stock - e.qty
       const result = await Stock.find({
         relatedProcedureItems: e.item_id,
       //  relatedBranch: relatedBranch
       })
       const from = result[0].fromUnit
       const to = result[0].toUnit
       const currentQty = (from * totalUnit) / to
       try {
         const result = await Stock.findOneAndUpdate(
           { relatedProcedureItems: e.item_id, relatedBranch: relatedBranch },
           { totalUnit: totalUnit, currentQty: currentQty },
           { new: true }
         )
       } catch (error) {
         return res.status(500).send({ error: true, message: error.message })
       }
       const logResult = await Log.create({
         relatedTreatmentSelection: null,
         relatedAppointment: null,
         relatedProcedureItems: e.item_id,
         currentQty: e.stock,
         actualQty: e.actual,
         finalQty: totalUnit,
         type: 'K-Mart Sale',
         relatedBranch: relatedBranch,
         createdBy: createdBy
       })
    }
   }
  
   if (accessorySale !== undefined) {
     for (const e of accessorySale) {
       let totalUnit = e.stock - e.qty
       const result = await Stock.find({
         relatedAccessoryItems: e.item_id,
       //  relatedBranch: relatedBranch
       })
       const from = result[0].fromUnit
       const to = result[0].toUnit
       const currentQty = (from * totalUnit) / to
       try {
         const result = await Stock.findOneAndUpdate(
           { relatedAccessoryItems: e.item_id, relatedBranch: relatedBranch },
           { totalUnit: totalUnit, currentQty: currentQty },
           { new: true }
         )
       } catch (error) {
         return res.status(500).send({ error: true, message: error.message })
       }
       const logResult = await Log.create({
         relatedTreatmentSelection: null,
         relatedAppointment: null,
         relatedAccessoryItems: e.item_id,
         currentQty: e.stock,
         actualQty: e.actual,
         finalQty: totalUnit,
         type: 'K-Mart Sale',
         relatedBranch: relatedBranch,
         createdBy: createdBy
       })
     }
   }
  
  

   //first transaction
  
   if (req.body.relatedBankAccount) {
     var amountUpdate = await Accounting.findOneAndUpdate(
       { _id: req.body.relatedBankAccount },
       { $inc: { amount: data.payAmount } }
     )
   } else if (req.body.relatedCash) {
     var amountUpdate = await Accounting.findOneAndUpdate(
       { _id: req.body.relatedCash },
       { $inc: { amount: data.payAmount } }
     )
   }
   
   
   //balance 
   if (balance > 0) {
    let relatedTreatmentVoucherId = medicineSaleResult._id.valueOf();
    const debtCreate = await Debt.create({
        "balance": balance,
        "relatedPatient": relatedPatient,
        "knasRelatedTreatmentVoucher": relatedTreatmentVoucherId
    })
    console.log("debt create is ",relatedTreatmentVoucherId)
    const fTransaction = new Transaction({
        "amount": balance,
        "date": Date.now(),
        "remark": req.body.remark || "",
        "relatedAccounting": "6505692e8a572e8de464c0ea", //Account Receivable from Customer
        "type": "Debit",
        "createdBy": createdBy
    })
    const fTransResult = await fTransaction.save()
    var amountUpdate = await Accounting.findOneAndUpdate(
        { _id: "6505692e8a572e8de464c0ea" },  //Account Receivable from Customer
        { $inc: { amount: balance } }
    )

    const secTransaction = new Transaction(
        {
            "amount": msPaidAmount,
            "date": Date.now(),
            "remark": req.body.remark || " ",
            "relatedBank": relatedBank,
            "relatedCash": relatedCash,
            "type": "Debit",
            "relatedTransaction": fTransResult._id,
            "createdBy": createdBy
        }
    )
    const secTransResult = await secTransaction.save();
    var fTransUpdate = await Transaction.findOneAndUpdate(
        { _id: fTransResult._id },
        {
            relatedTransaction: secTransResult._id
        },
        { new: true }
    )
    if (relatedBank) {
        var amountUpdate = await Accounting.findOneAndUpdate(
            { _id: relatedBank },
            { $inc: { amount: payAmount } }
        )
    } else if (relatedCash) {
        var amountUpdate = await Accounting.findOneAndUpdate(
            { _id: relatedCash },
            { $inc: { amount: payAmount } }
        )
    }
}
   res.status(200).send({
     message: 'KmaxVoucher Transaction success',
     success: true,
     fTrans: fTransUpdate,
     sTrans: secTransResult,
     accResult: accResult,
    data: medicineSaleResult
   })
  } catch (error) {
    console.log(error)
    return res.status(500).send({ error: true, message: error.message })
  }

}

exports.createKmaxVoucherTransaction = async (req, res, next) => {
  try {
    let createdBy = req.credentials.id
    let relatedBranch = req.body.relatedBranch
    let medicineItemError = []
    let medicineItemFinished = []
    //first transaction
    const fTransaction = new Transaction({
      amount: req.body.amount,
      date: req.body.date,
      remark: req.body.remark,
      relatedAccounting: '6423eb395fb841d5566db36d',
      type: 'Credit',
      createdBy: createdBy,
      relatedBranch: relatedBranch
    })
    const fTransResult = await fTransaction.save()
    var amountUpdate = await Accounting.findOneAndUpdate(
      { _id: '6423eb395fb841d5566db36d' },
      { $inc: { amount: data.payAmount } }
    )
    //sec transaction
    const secTransaction = new Transaction({
      amount: req.body.amount,
      date: req.body.date,
      remark: req.body.remark,
      relatedBank: req.body.relatedBank,
      relatedCash: req.body.relatedCash,
      type: 'Debit',
      relatedTransaction: fTransResult._id,
      createdBy: createdBy,
      relatedBranch: relatedBranch
    })
    const secTransResult = await secTransaction.save()
    var fTransUpdate = await Transaction.findOneAndUpdate(
      { _id: fTransResult._id },
      {
        relatedTransaction: secTransResult._id
      },
      { new: true }
    )
    if (req.body.relatedBankAccount) {
      var amountUpdate = await Accounting.findOneAndUpdate(
        { _id: req.body.relatedBankAccount },
        { $inc: { amount: req.body.amount } }
      )
    } else if (req.body.relatedCash) {
      var amountUpdate = await Accounting.findOneAndUpdate(
        { _id: req.body.relatedCash },
        { $inc: { amount: req.body.amount } }
      )
    }
    let objID = ''
    if (req.body.relatedBank) objID = req.body.relatedBank
    if (req.body.relatedCash) objID = req.body.relatedCash
    //transaction
    const acc = await Accounting.find({ _id: objID })
    const accResult = await Accounting.findOneAndUpdate(
      { _id: objID },
      { amount: parseInt(req.body.amount) + parseInt(acc[0].amount) },
      { new: true }
    )
    req.body = {
      ...req.body,
      createdBy: createdBy,
      relatedBranch: relatedBranch
    }
    console.log(req.body)
    let { medicineItems } = req.body
    if (medicineItems !== undefined) {
      medicineItems.map(async (e, i) => {
        if (e.stock < e.quantity) {
          medicineItemError.push(e)
        } else if (e.stock > e.quantity) {
          const result = await Stock.find({
            _id: e.item_id,
            relatedBranch: relatedBranch
          })
          let totalUnit = e.stock - e.quantity
          let from = result[0].fromUnit
          let to = result[0].toUnit
          let currentQty = (from * totalUnit) / to
          try {
            medicineItemFinished.push(e)
            const result = await Stock.findOneAndUpdate(
              { _id: e.item_id, relatedBranch: relatedBranch },
              { totalUnit: totalUnit, currentQty: currentQty },
              { new: true }
            )
          } catch (error) {
            medicineItemError.push(e)
          }
          const logResult = await Log.create({
            relatedProcedureItems: e.item_id,
            currentQty: e.stock,
            actualQty: e.quantity,
            finalQty: totalUnit,
            relatedBranch: relatedBranch,
            type: 'Medicine Sale',
            createdBy: createdBy
          })
        }
      })
    }
    const newKmaxVoucher = new KmaxVoucher(req.body)
    //const medicineSaleResult = newKmaxVoucher.save()
    res.status(200).send({
      message: 'KmaxVoucher Transaction success',
      success: true,
      fTrans: fTransUpdate,
      sTrans: secTransResult,
      accResult: accResult,
    //  data: medicineSaleResult,
      medicineItemFinished: medicineItemFinished,
      medicineItemError: medicineItemError
    })
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message })
  }
}

exports.updateKmaxVoucher = async (req, res, next) => {
  try {
    console.log("what is id ", req.body.id)
    const result = await KmaxVoucher.findOneAndUpdate(
      { _id: req.body.id },
      req.body,
      { new: true }
    ).populate(
      'relatedDoctor relatedTreatment secondAccount relatedAppointment relatedPatient relatedBank relatedCash paymentType relatedBranch createdBy relatedAccounting payment medicineSale.item_id procedureSale.item_id accessorySale.item_id'
    )
    if (!result)
      return res.status(500).send({ error: true, message: 'Query Error!' })
    if (result === 0)
      return res.status(500).send({ error: true, message: 'No Records!' })
    return res.status(200).send({ success: true, data: result })
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message })
  }
}

exports.deleteKmaxVoucher = async (req, res, next) => {
  try {
    const result = await KmaxVoucher.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: true },
      { new: true }
    )
    return res
      .status(200)
      .send({ success: true, data: { isDeleted: result.isDeleted } })
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message })
  }
}

exports.activateKmaxVoucher = async (req, res, next) => {
  try {
    const result = await KmaxVoucher.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: false },
      { new: true }
    )
    return res
      .status(200)
      .send({ success: true, data: { isDeleted: result.isDeleted } })
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message })
  }
}

exports.createCode = async (req, res, next) => {
  let data = {}
  try {
    const latestDocument = await KmaxVoucher.find({}, { seq: 1 })
      .sort({ _id: -1 })
      .limit(1)
      .exec()
    if (latestDocument.length == 0)
      data = { ...data, seq: 1, voucherCode: 'KVC-1' } // if seq is undefined set initial patientID and seq
    if (latestDocument.length) {
      const increment = latestDocument[0].seq + 1
      data = { ...data, voucherCode: 'KVC-' + increment, seq: increment }
    }
    return res.status(200).send({
      success: true,
      data: data
    })
  } catch (err) {
    return res.status(500).send({
      error: true,
      message: err
    })
  }
}
exports.filterKmaxVouchers = async (req, res, next) => {
  try {
    let query = req.mongoQuery
    const { start, end } = req.query
    if (start && end) query.createdAt = { $gte: start, $lte: end }
    if (Object.keys(query).length === 0)
      return res
        .status(404)
        .send({
          error: true,
          message: 'Please Specify A Query To Use This Function'
        })
    const result = await KmaxVoucher.find(query).populate(
      'relatedDoctor relatedTreatment secondAccount relatedAppointment relatedPatient relatedBank relatedCash paymentType relatedBranch createdBy relatedAccounting payment medicineSale.item_id procedureSale.item_id accessorySale.item_id'
    )
    if (result.length === 0)
      return res.status(404).send({ error: true, message: 'No Record Found!' })
    res.status(200).send({ success: true, data: result })
  } catch (err) {
    return res.status(500).send({ error: true, message: err.message })
  }
}

exports.getwithExactDate = async (req, res) => {
  try {
    let { exact } = req.query
    const date = new Date(exact)
    const startDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ) // Set start date to the beginning of the day
    const endDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1
    ) // Set end date to the beginning of the next day
    let result = await KmaxVoucher.find({
      createdAt: { $gte: startDate, $lt: endDate }
    })
      .populate('relatedPatient relatedTransaction relatedCash')
      .populate('relatedAppointment')
      .populate('medicineItems.item_id')
      .populate('relatedTreatment')
      .populate('createdBy')
    if (result.length === 0)
      return res.status(404).send({ error: true, message: 'Not Found!' })
    return res.status(200).send({ success: true, data: result })
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message })
  }
}

exports.searchKmaxVoucher = async (req, res, next) => {
  try {
    let query = req.mongoQuery
    let { search } = req.body
    if (search) query.$text = { $search: search }
    const result = await KmaxVoucher.find(query).populate(
      'relatedDoctor relatedTreatment secondAccount relatedAppointment relatedPatient relatedBank relatedCash paymentType relatedBranch createdBy relatedAccounting payment medicineSale.item_id procedureSale.item_id accessorySale.item_id'
    )
    if (result.length === 0)
      return res.status(404).send({ error: true, message: 'No Record Found!' })
    return res.status(200).send({ success: true, data: result })
  } catch (err) {
    return res.status(500).send({ error: true, message: err.message })
  }
}

exports.KmaxVoucherFilter = async (req, res) => {
  let secondBankCashAmount = []
  let firstBankName = []
  let firstCashName = []
  let secondCashName=[]
  let query = { relatedBank: { $exists: true }, isDeleted: false }
  let response = {
    success: true,
    data: {}
  }
  try {
    const {
      startDate,
      endDate,
      createdBy,
      purchaseType,
      relatedDoctor,
      bankType,
      tsType,
      relatedPatient,
      bankID,
      relatedBranch,
      income
    } = req.query
    if (startDate && endDate)
      query.createdAt = { $gte: startDate, $lte: endDate }
    if (relatedPatient) query.relatedPatient = relatedPatient
    if (bankType) query.bankType = bankType
    if (createdBy) query.createdBy = createdBy
    if (bankID) query.relatedBank = bankID
    if (purchaseType) query.purchaseType = purchaseType
    if (relatedDoctor) query.relatedDoctor = relatedDoctor
   
    if (relatedBranch) query.relatedBranch = relatedBranch //relatedTreatment secondAccount relatedTreatmentSelection  relatedBranch relatedDoctor relatedBank relatedCash medicineItems.item_id multiTreatment.item_id relatedAccounting payment
    let allBankResult = await KmaxVoucher.find(query)
      .populate(
        'relatedPatient relatedCash createdBy'
      ).populate({
        path:"secondAccount",
        model:"AccountingLists",
        populate: {
            path:"relatedHeader",
            model:"AccountHeaders"
        }
      }).populate({
        path: "medicineSale",
        populate: {
            path: "medicineSale"
        }
      }).populate({
        path: "procedureSale",
        populate: {
          path: "item_id"
        }
      }).populate({
        path: "accessorySale",
        populate: {
          path: "item_id"
        }
      })
    let bankResult = await KmaxVoucher.find({...query,Refund: false})
      .populate(
        'relatedPatient relatedCash createdBy'
      ).populate({
        path:"secondAccount",
        model:"AccountingLists",
        populate: {
            path:"relatedHeader",
            model:"AccountHeaders"
        }
    }).populate({
      path: "medicineSale",
      populate: {
          path: "medicineSale"
      }
    }).populate({
      path: "procedureSale",
      populate: {
        path: "item_id"
      }
    }).populate({
      path: "accessorySale",
      populate: {
        path: "item_id"
      }
    })
      
      // .populate({
      //   path: 'relatedTreatmentSelection',
      //   model: 'TreatmentSelections',
      //   populate: {
      //     path: 'relatedAppointments',
      //     model: 'Appointments',
      //     populate: {
      //       path: 'relatedDoctor',
      //       model: 'Doctors'
      //     }
      //   }
      // })
    if (!bankID) {
      const { relatedBank, ...query2 } = query
      query2.relatedCash = { $exists: true } 
     
      let allCashResult = await KmaxVoucher.find(query2) //relatedAccounting payment relatedTreatmentSelection medicineItems.item_id multiTreatment.item_id relatedTreatment secondAccount relatedBranch relatedDoctor relatedBank
        .populate(
          'relatedCash relatedPatient createdBy'
        ).populate({
          path:"secondAccount",
          model:"AccountingLists",
          populate: {
              path:"relatedHeader",
              model:"AccountHeaders"
          }
      }).populate({
        path: "medicineSale",
        populate: {
            path: "medicineSale"
        }
      }).populate({
        path: "procedureSale",
        populate: {
          path: "item_id"
        }
      }).populate({
        path: "accessorySale",
        populate: {
          path: "item_id"
        }
      })
        let cashResult = await KmaxVoucher.find({...query2, Refund: false}) //relatedAccounting payment relatedTreatmentSelection medicineItems.item_id multiTreatment.item_id relatedTreatment secondAccount relatedBranch relatedDoctor relatedBank
        .populate(
          'relatedCash relatedPatient createdBy'
        ).populate({
          path:"secondAccount",
          model:"AccountingLists",
          populate: {
              path:"relatedHeader",
              model:"AccountHeaders"
          }
      }).populate({
        path: "medicineSale",
        populate: {
            path: "medicineSale"
        }
      }).populate({
        path: "procedureSale",
        populate: {
          path: "item_id"
        }
      }).populate({
        path: "accessorySale",
        populate: {
          path: "item_id"
        }
      })
        // .populate({
        //   path: 'relatedTreatmentSelection',
        //   model: 'TreatmentSelections',
        //   populate: {
        //     path: 'relatedAppointments',
        //     model: 'Appointments',
        //     populate: {
        //       path: 'relatedDoctor',
        //       model: 'Doctors'
        //     }
        //   }
        // })
      const CashNames = cashResult.reduce(
        (result, { relatedCash, paidAmount, secondAccount, secondAmount}) => {
          if(secondAccount && secondAccount.relatedHeader.name === "Cash At Bank" ){
            const bankName =secondAccount.name;
            secondBankCashAmount.push({bankname:bankName,amount:secondAmount})                
        } 
          if (relatedCash) {
            const { name } = relatedCash
            result[name] = (result[name] || 0) + (paidAmount || 0)
          }
          return result
        },
        {}
      )
      if(CashNames) {
        Object.keys(CashNames).forEach(key=> firstCashName.push({cashname:key, amount:CashNames[key]}) )    
      }
      const CashTotal = cashResult.reduce(
        (total, sale) => total + (sale.paidAmount || 0),
        0
      )
      income ?
       response.data = { ...response.data, CashNames: CashNames, CashTotal: CashTotal }  
       :  response.data = { ...response.data, CashList: allCashResult, CashNames: CashNames, CashTotal: CashTotal}}
    //filter solid beauty
    const BankNames = bankResult.reduce(
      (result, { relatedBank, paidAmount, secondAccount, secondAmount}) => {
        if(secondAccount && secondAccount.relatedHeader.name == "Cash In Hand"){
          let {name} = secondAccount;
          secondCashName.push({cashname:name, amount:secondAmount})
      }
      else  if(secondAccount && secondAccount.relatedHeader.name === "Cash At Bank" ){
          const bankName =secondAccount.name;
          secondBankCashAmount.push({bankname:bankName,amount:secondAmount})                
      } 
        if (relatedBank) {
          const { name } = relatedBank
          result[name] = (result[name] || 0) + (paidAmount || 0)
        }
        return result
      },
      {}
    )
    const BankTotal = bankResult.reduce(
      (total, sale) => total + (sale.paidAmount || 0),
      0
    )
    
    let secondBank = secondBankCashAmount.reduce((result, nextresult) => {
      const equalBankName = result.find(t => t.bankname === nextresult.bankname);

     if (equalBankName) {
         equalBankName.amount += nextresult.amount;
     } else {
     result.push({ bankname: nextresult.bankname, amount: nextresult.amount });
    }

      return result;
      }, []);

      if(BankNames){
        Object.keys(BankNames).forEach(key=> firstBankName.push({bankname:key, amount:BankNames[key]}) )    
    }
    income ? response.data = { ...response.data, firstBankNames:firstBankName, firstCashNames:firstCashName, secondBankNames:secondBank, secondCashNames:secondCashName, BankTotal: BankTotal }  
    : response.data = { ...response.data, BankList: allBankResult, firstBankNames:firstBankName, firstCashNames:firstCashName, secondBankNames:secondBank, secondCashNames:secondCashName, BankTotal: BankTotal }  
    
    // income ?
    //   response.data = {
    //   ...response.data,
    //   BankNames: BankNames,
    //   BankTotal: BankTotal
    //   }
    // : 
    // response.data = {
    //   ...response.data,
    //   BankList: bankResult,
    //   BankNames: BankNames,
    //   BankTotal: BankTotal
    //   }
    return res.status(200).send(response)
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message })
  }
}
