'use strict';
const dentalTreatmentSelection = require('../models/dentalTreatmentSelection');
const Appointment = require('../models/appointment');
const Transaction = require('../models/transaction');
const Patient = require('../models/patient');
const TreatmentVoucher = require('../models/treatmentVoucher');
const Repay = require('../models/repayRecord');
const Accounting = require('../models/accountingList');
const Attachment = require('../models/attachment');
const AdvanceRecords = require('../models/advanceRecord');
const dentalTreatment = require('../models/dentalTreatment');
const Debt = require('../models/debt');
const { ObjectId } = require('mongodb');
const moment = require("moment")

exports.listMultiDentalTreatmentSelections = async (req, res) => {
    let { keyword, role, limit, skip } = req.query;
    let count = 0;
    let page = 0;

    try {
        limit = +limit <= 100 ? +limit : 10; //limit
        skip = +skip || 0;
        let query = req.mongoQuery,
            regexKeyword;
        role ? (query['role'] = role.toUpperCase()) : '';
        keyword && /\w/.test(keyword)
            ? (regexKeyword = new RegExp(keyword, 'i'))
            : '';
        regexKeyword ? (query['name'] = regexKeyword) : '';
        query.tsType = 'TSMulti'
        let result = await dentalTreatmentSelection.find(query).populate('createdBy relatedBranch relatedDentalTreatmentList relatedAppointments relatedPatient finishedAppointments remainingAppointments relatedTransaction').populate({
            path: 'relatedDentalTreatment',
            populate: {
                path: 'relatedDoctor',
                model: 'Doctors'
            }
        })
        let count = await dentalTreatmentSelection.find(query).count();
        const division = count / limit;
        page = Math.ceil(division);
        res.status(200).send({
            success: true,
            count: count,
            _metadata: {
                current_page: skip / limit + 1,
                per_page: limit,
                page_count: page,
                total_count: count,
            },
            list: result,
        });
    } catch (error) {
        return res.status(500).send({ error: true, message: 'No Record Found!' });
    }
};

exports.listAllDentalTreatmentSelections = async (req, res) => {
    let { keyword, role, limit, skip, tsType } = req.query;
    let count = 0;
    let page = 0;

    try {
        limit = +limit <= 100 ? +limit : 10; //limit
        skip = +skip || 0;
        let query = req.mongoQuery,
            regexKeyword;
        role ? (query['role'] = role.toUpperCase()) : '';
        keyword && /\w/.test(keyword)
            ? (regexKeyword = new RegExp(keyword, 'i'))
            : '';
        regexKeyword ? (query['name'] = regexKeyword) : '';
        if (tsType) query.tsType = tsType
        let result = await dentalTreatmentSelection.find(query).populate('createdBy relatedBranch relatedDentalTreatmentList relatedAppointments relatedPatient finishedAppointments remainingAppointments relatedTransaction').populate({
            path: 'relatedDentalTreatment',
            populate: {
                path: 'relatedDoctor',
                model: 'Doctors'
            }
        })
        let count = await dentalTreatmentSelection.find(query).count();
        const division = count / limit;
        page = Math.ceil(division);
        res.status(200).send({
            success: true,
            count: count,
            _metadata: {
                current_page: skip / limit + 1,
                per_page: limit,
                page_count: page,
                total_count: count,
            },
            list: result,
        });
    } catch (error) {
        return res.status(500).send({ error: true, message: 'No Record Found!' });
    }
};

exports.getDentalTreatmentSelection = async (req, res) => {
    let query = req.mongoQuery
    if (req.params.id) query._id = req.params.id
    const result = await dentalTreatmentSelection.find(query).populate('createdBy relatedAppointments remainingAppointments relatedTransaction relatedPatient relatedDentalTreatmentList').populate({
        path: 'relatedDentalTreatment',
        populate: [{
            path: 'relatedDoctor',
            model: 'Doctors'
        }, {
            path: 'procedureMedicine.item_id',
            model: 'ProcedureItems'
        },
        {
            path: 'procedureAccessory.item_id',
            model: 'AccessoryItems'
        },
        {
            path: 'machine.item_id',
            model: 'FixedAssets'
        }]
    });
    if (!result)
        return res.status(500).json({ error: true, message: 'No Record Found' });
    return res.status(200).send({ success: true, data: result });
};

exports.getDentalTreatementSelectionByTreatmentID = async (req, res) => {
    let query = req.mongoQuery
    if (req.params.id) query.relatedDentalTreatment = req.params.id
    const result = await dentalTreatmentSelection.find(query).populate('createdBy relatedAppointments remainingAppointments relatedTransaction relatedPatient relatedDentalTreatmentList').populate({
        path: 'relatedDentalTreatment',
        populate: {
            path: 'relatedDoctor',
            model: 'Doctors'
        }
    })
    if (!result)
        return res.status(500).json({ error: true, message: 'No Record Found' });
    return res.status(200).send({ success: true, data: result });
};

exports.createDentalTreatmentSelectionCode = async (req, res) => {
    let data = req.body;
    try {
        //prepare TS-ID
        const latestDocument = await dentalTreatmentSelection.find({}, { seq: 1 }).sort({ _id: -1 }).limit(1).exec();
        if (latestDocument[0].seq === undefined) data = { ...data, seq: 1, code: "TS-1" } // if seq is undefined set initial patientID and seq
        if (latestDocument[0].seq) {
            const increment = latestDocument[0].seq + 1
            data = { ...data, code: "TS-" + increment, seq: increment }
        }
        return res.status(200).send({
            success: true,
            data: data
        })
    } catch (error) {
        return res.status(500).send({ error: true, message: error.message })
    }
}

exports.createMultiDentalTreatmentSelection = async (req, res, next) => {
    let files = req.files
    let data = req.body
    let createdBy = req.credentials.id
    let { selections, relatedPatient, totalAmount, totalDiscount, totalPaidAmount, treatmentReturn, refundAmount, newTreatmentVoucherCode, date, type, refundVoucherId,  multiDentalTreatment, paidAmount, relatedBank, relatedCash, relatedAppointment, bankType, paymentType, remark, relatedDiscount, relatedDoctor, paymentMethod, dentalTreatmentPackage, relatedBranch } = req.body
    let tvcCreate = false;
    let TSArray = []
    let attachID;
    let response = {
        message: 'Dental Treatment Selection create success',
        success: true
    } 
    let treatmentPackageArray =[]
    try {
       
        if (files.payment) {
            for (const element of files.payment) {
                let imgPath = element.path.split('cherry-k')[1];
                const attachData = {
                    fileName: element.originalname,
                    imgUrl: imgPath,
                    image: imgPath.split('\\')[2]
                };
                const attachResult = await Attachment.create(attachData);
                console.log(attachResult, 'here')
                attachID = attachResult._id.toString()
            }
        }
        console.log(attachID)
        const patientUpdate = await Patient.findOneAndUpdate(
            { _id: relatedPatient },
            { $inc: { conditionAmount: totalAmount, conditionPurchaseFreq: 1, conditionPackageQty: 1 } },
            { new: true }
        )
        data = { ...data, createdBy: createdBy, tsType: 'TSMulti', relatedBranch: data.relatedBranch }
        //Adding TSMulti type
        tvcCreate = true;
        let parsedMulti = JSON.parse(multiDentalTreatment)
        // if (treatmentVoucherResult) { data = { ...data, relatedTreatmentVoucher: treatmentVoucherResult._id } }
        for (const i of parsedMulti) {
            data.multiDentalTreatment = parsedMulti
            data.relatedDentalTreatment = i.item_id
            data.totalAmount = i.price
            data.discount = i.discountAmount
            data.relatedCash = relatedCash
            data.relatedBank = relatedBank
            data.bankType = bankType
            data.paymentMethod = paymentMethod
            //related account for each treatments
            const getAccountingAcccount = await dentalTreatment.findOne({ _id: i.item_id })
            if (getAccountingAcccount.relatedAccount) {
                const sellingPrice = getAccountingAcccount.sellingPrice
                const transaction = await Transaction.create({
                    "amount": req.body.totalPaidAmount,
                    "date": Date.now(),
                    "remark": remark,
                    relatedAccounting: getAccountingAcccount.relatedAccount,
                    "type": "Credit",
                    "createdBy": createdBy
                })
                const amtUpdate = await Accounting.findOneAndUpdate({ _id: getAccountingAcccount.relatedAccount }, { $inc: { amount: req.body.totalPaidAmount } })
            }

            let result = await dentalTreatmentSelection.create(data)
            TSArray.push(result._id)
        }
        if (req.body.secondAmount) {
            var fsecAmtTransResult = await Transaction.create({
                "amount": req.body.secondAmount,
                "relatedBranch": req.body.relatedBranch,
                "date": Date.now(),
                "remark": null,
                "relatedAccounting": req.body.secondAccount,
                "type": "Credit",
                "createdBy": createdBy,
                "relatedBranch": req.mongoQuery.relatedBranch
            })
            const amountUpdates = await Accounting.findOneAndUpdate(
                { _id: req.body.secondAccount },
                { $inc: { amount: req.body.secondAmount } }
            )

        }
        if (tvcCreate === true) {
            //--> treatment voucher create
            let dataTVC = {
                "secondAmount": req.body.secondAmount,
                "secondAccount": req.body.secondAccount,
                "isDouble": req.body.isDouble,
                "relatedDentalTreatmentSelection": TSArray,
                "deposit": req.body.deposit,
                "relatedBranch": req.body.relatedBranch,
                "purchaseType": req.body.purchaseType,
                "relatedDoctor": req.body.relatedDoctor,
                "relatedAppointment": relatedAppointment,
                "relatedPatient": relatedPatient,
                "paymentMethod": req.body.paymentMethod, //enum: ['by Appointment','Lapsum','Total','Advanced']
                "paidAmount": paidAmount,
                "relatedBank": relatedBank,
                "bankType": bankType,//must be bank acc from accounting accs
                "paymentType": paymentType, //enum: ['Bank','Cash']
                "relatedCash": relatedCash, //must be cash acc from accounting accs
                "createdBy": createdBy,
                "remark": remark,
                "payment": attachID,
                "relatedDiscount": relatedDiscount,
                "relatedDoctor": relatedDoctor,
                "totalDiscount": totalDiscount,
                "totalAmount": totalAmount,
                "totalPaidAmount": totalPaidAmount,
                "tsType": "TSMulti",
                "createdAt": req.body.createdAt
            }
            dataTVC.multiDentalTreatment = parsedMulti
            let today = new Date().toISOString()
            const latestDocument = await TreatmentVoucher.find({}, { seq: 1 }).sort({ _id: -1 }).limit(1).exec();
            if (latestDocument.length === 0){
            
              dataTVC = { ...dataTVC, seq: 1, code: "TVC-" + today.split('T')[0].replace(/-/g, '') + "-1" } // if seq is undefined set initial patientID and seq  
            } 
            if (latestDocument.length > 0) {
                const increment = latestDocument[0].seq + 1
                dataTVC = { ...dataTVC, code: "TVC-" + today.split('T')[0].replace(/-/g, '') + "-" + increment, seq: increment }
            }
           
            if(dentalTreatmentPackage && dentalTreatmentPackage.length != 0 ){
                  let dataTVCDentalTreatmentPackageArray = []
                  dentalTreatmentPackage = JSON.parse(dentalTreatmentPackage)
                  dentalTreatmentPackage.map(dentalTreatment=> {
                    dataTVCDentalTreatmentPackageArray.push({item_id: dentalTreatment.item_id, qty: dentalTreatment.qty})
                    treatmentPackageArray.push(treatment.item_id)
                  })
                  dataTVC["relatedDentalTreatmentPackage"] = dataTVCDentalTreatmentPackageArray
            }  
            var treatmentVoucherResult = await TreatmentVoucher.create(dataTVC)
        }
        if (treatmentVoucherResult) {
            var populatedTV = await TreatmentVoucher.find({ _id: treatmentVoucherResult._id }).populate('relatedDiscount multiDentalTreatment.item_id').populate({path: "relatedDentalTreatmentPackage",populate: { path: "item_id"}})
        }
        
        var updatePatient = await Patient.findOneAndUpdate({ _id: relatedPatient }, { $addToSet: { relatedDentalTreatmentSelection: TSArray }, $push: { relatedDentalTreatmentPackage: { $each: treatmentPackageArray }}, $inc: { conditionAmount: req.body.totalAmount, conditionPurchaseFreq: 1, conditionPackageQty: 1 } })
        if (req.body.balance > 0) {
            const debtCreate = await Debt.create({
                "balance": req.body.balance,
                "relatedPatient": data.relatedPatient,
                "relatedTreatmentVoucher": treatmentVoucherResult._id,
                "relatedBranch": relatedBranch
            })
            const fTransaction = new Transaction({
                "amount": req.body.balance,
                "date": Date.now(),
                "remark": remark,
                "relatedAccounting": "6505692e8a572e8de464c0ea", //Account Receivable from Customer
                "type": "Debit",
                "createdBy": createdBy
            })
            const fTransResult = await fTransaction.save()
            var amountUpdate = await Accounting.findOneAndUpdate(
                { _id: "6505692e8a572e8de464c0ea" },  //Account Receivable from Customer
                { $inc: { amount: req.body.balance } }
            )

            const secTransaction = new Transaction(
                {
                    "amount": data.totalPaidAmount,
                    "date": Date.now(),
                    "remark": remark,
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
                    { $inc: { amount: req.body.totalPaidAmount } }
                )
            } else if (relatedCash) {
                var amountUpdate = await Accounting.findOneAndUpdate(
                    { _id: relatedCash },
                    { $inc: { amount: req.body.totalPaidAmount } }
                )
            }
        }

        const fTransaction = new Transaction({
            "amount": req.body.totalAmount,
            "date": Date.now(),
            "remark": remark,
            "relatedAccounting": "6492cbb6dbf11808abf6685d", //Sales Income (Treatment)
            "type": "Credit",
            "createdBy": createdBy
        })
        const fTransResult = await fTransaction.save()
        var amountUpdate = await Accounting.findOneAndUpdate(
            { _id: "6492cbb6dbf11808abf6685d" },  //Sales Income (Treatment)
            { $inc: { amount: req.body.totalAmount } }
        )

        const secTransaction = new Transaction(
            {
                "amount": data.msPaidAmount,
                "date": Date.now(),
                "remark": remark,
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
                { $inc: { amount: req.body.totalPaidAmount } }
            )
        } else if (relatedCash) {
            var amountUpdate = await Accounting.findOneAndUpdate(
                { _id: relatedCash },
                { $inc: { amount: req.body.totalPaidAmount } }
            )
        }
        if (populatedTV) response.treatmentVoucherResult = populatedTV
        if(treatmentReturn === "true" ){
            let updateRefundInTreatmentVoucherList = await TreatmentVoucher.findByIdAndUpdate(
                refundVoucherId,
                { 
                    Refund:true,
                    refundDate: date,
                    refundReason: remark,
                    refundType: type,
                    refundAmount: refundAmount,
                    newTreatmentVoucherCode: newTreatmentVoucherCode || null
                }
            )
            let totalSelectionLength = JSON.parse(selections)
            if(totalSelectionLength.length != 0 ){
              //  console.log("selectinonn is "+ JSON.stringify(totalLength))
                for(let i = 0 ; i < totalSelectionLength.length ; i++ ) {
                   let treatmentSelectionId = totalSelectionLength[i].id;
                      let updateTreatmentSelectionRefund = await dentalTreatmentSelection.findByIdAndUpdate(
                       treatmentSelectionId,
                      {
                        Refund : true
                      }
                  )
                 }
             
             }
        
        }

        
        res.status(200).send(response);

    } catch (error) {
        console.log(error)
        return res.status(500).send({ error: true, message: error.message })
    }
}

exports.createDentalTreatmentSelection = async (req, res, next) => {
    let data = req.body;
    let relatedAppointments = []
    let tvcCreate = false;
    let createdBy = req.credentials.id
    let files = req.files
    try {

        if (req.body.originalDate === undefined) return res.status(500).send({ error: true, message: 'Original Date is required' })
        const appointmentConfig = {
            relatedPatient: req.body.relatedPatient,
            relatedDoctor: req.body.relatedDoctor,
            originalDate: new Date(req.body.originalDate), // Convert to Date object
            phone: req.body.phone,
            relatedBranch: req.body.relatedBranch
        };
        console.log(appointmentConfig)
        const numTreatments = req.body.dentalTreatmentTimes;
        const dataconfigs = [];

        for (let i = 0; i < numTreatments; i++) {
            const date = new Date(appointmentConfig.originalDate);
            date.setDate(date.getDate() + (i * req.body.inBetweenDuration)); // Add 7 days for each iteration
            const config = { ...appointmentConfig, originalDate: date };
            dataconfigs.push(config);
        }
        const appointmentResult = await Appointment.insertMany(dataconfigs)
        appointmentResult.map(function (element, index) {
            relatedAppointments.push(element._id)
        })

        if (files.payment) {
            for (const element of files.payment) {
                let imgPath = element.path.split('cherry-k')[1];
                const attachData = {
                    fileName: element.originalname,
                    imgUrl: imgPath,
                    image: imgPath.split('\\')[2]
                };
                const attachResult = await Attachment.create(attachData);
                var attachID = attachResult._id.toString()
            }
        }

        const patientUpdate = await Patient.findOneAndUpdate(
            { _id: req.body.relatedPatient },
            { $inc: { conditionAmount: req.body.totalAmount, conditionPurchaseFreq: 1, conditionPackageQty: 1 } },
            { new: true }
        )

        data = { ...data, relatedAppointments: relatedAppointments, remainingAppointments: relatedAppointments, createdBy: createdBy, relatedBranch: req.mongoQuery.relatedBranch, tsType: 'TS' }
        console.log(data, 'data1') //adding TS

        // if (req.body.secondAccount) {
        //     const fTransaction = new Transaction({
        //         "amount": req.body.msPaidAmount,
        //         "date": Date.now(),
        //         "remark": req.body.remark,
        //         "relatedAccounting": "646739c059a9bc811d97fa8b", //Sales (Medicines),
        //         "relatedMedicineSale": medicineSaleResult._id,
        //         "type": "Credit",
        //         "createdBy": createdBy
        //     })
        //     const fTransResult = await fTransaction.save()
        //     var amountUpdate = await Accounting.findOneAndUpdate(
        //         { _id: "646739c059a9bc811d97fa8b" },
        //         { $inc: { amount: req.body.msPaidAmount } }
        //     )
        //     //sec transaction
        //     const secTransaction = new Transaction(
        //         {
        //             "amount": req.body.msPaidAmount,
        //             "date": Date.now(),
        //             "remark": req.body.remark,
        //             "relatedBank": req.body.relatedBank,
        //             "relatedCash": req.body.relatedCash,
        //             "type": "Debit",
        //             // "relatedTransaction": fTransResult._id,
        //             "createdBy": createdBy
        //         }
        //     )
        //     const secTransResult = await secTransaction.save();
        //     var fTransUpdate = await Transaction.findOneAndUpdate(
        //         { _id: fTransResult._id },
        //         {
        //             relatedTransaction: secTransResult._id
        //         },
        //         { new: true }
        //     )
        //     if (req.body.relatedBank) {
        //         var amountUpdate = await Accounting.findOneAndUpdate(
        //             { _id: req.body.relatedBank },
        //             { $inc: { amount: req.body.msPaidAmount } }
        //         )
        //     } else if (req.body.relatedCash) {
        //         var amountUpdate = await Accounting.findOneAndUpdate(
        //             { _id: req.body.relatedCash },
        //             { $inc: { amount: req.body.msPaidAmount } }
        //         )
        //     }
        // }

        //first transaction 
        if (req.body.paymentMethod === 'Cash Down') {
            var fTransResult = await Transaction.create({
                "amount": req.body.paidAmount,
                "date": Date.now(),
                "remark": null,
                "relatedAccounting": "6467379159a9bc811d97f4d2", //Advance received from customer
                "type": "Credit",
                "createdBy": createdBy
            })
            var amountUpdate = await Accounting.findOneAndUpdate(
                { _id: "6467379159a9bc811d97f4d2" },
                { $inc: { amount: req.body.paidAmount } }
            )
            //sec transaction
            var secTransResult = await Transaction.create({
                "amount": req.body.paidAmount,
                "date": Date.now(),
                "remark": null,
                "relatedBank": req.body.relatedBank,
                "relatedCash": req.body.relatedCash,
                "type": "Debit",
                "relatedTransaction": fTransResult._id,
                "createdBy": createdBy
            });
            var fTransUpdate = await Transaction.findOneAndUpdate(
                { _id: fTransResult._id },
                {
                    relatedTransaction: secTransResult._id
                },
                { new: true }
            )
            if (req.body.relatedBank) {
                var amountUpdate = await Accounting.findOneAndUpdate(
                    { _id: req.body.relatedBank },
                    { $inc: { amount: req.body.paidAmount } }
                )
            } else if (req.body.relatedCash) {
                var amountUpdate = await Accounting.findOneAndUpdate(
                    { _id: req.body.relatedCash },
                    { $inc: { amount: req.body.paidAmount } }
                )
            }
            tvcCreate = true;
        }
        if (fTransResult && secTransResult) { data = { ...data, relatedTransaction: [fTransResult._id, secTransResult._id] } } //adding relatedTransactions to treatmentSelection model
        if (treatmentVoucherResult) { data = { ...data, relatedTreatmentVoucher: treatmentVoucherResult._id } }
        console.log(data, 'data2')
        const result = await dentalTreatmentSelection.create(data)

        if (req.body.paymentMethod === 'Advance') {
            const treatmentResult = await dentalTreatment.find({ _id: req.body.relatedDentalTreatment })
            let advanceAmount = req.body.totalAmount - req.body.paidAmount

            if (req.body.deferAmount > 0 && req.body.paidAmount !== 0 && req.body.cashBackAmount === 0) {
                var fTransResult = await Transaction.create({
                    "amount": advanceAmount,
                    "date": Date.now(),
                    "remark": null,
                    "relatedAccounting": "6467379159a9bc811d97f4d2", //Advance received from customer
                    "type": "Debit",
                    "createdBy": createdBy
                })
                var amountUpdate = await Accounting.findOneAndUpdate(
                    { _id: "6467379159a9bc811d97f4d2" },
                    { $inc: { amount: -req.body.totalAmount } }
                )
                //sec transaction
                var secTransResult = await Transaction.create({
                    "amount": req.body.paidAmount,
                    "date": Date.now(),
                    "remark": null,
                    "relatedBank": req.body.relatedBank,
                    "relatedCash": req.body.relatedCash,
                    "type": "Debit",
                    "relatedTransaction": fTransResult._id,
                    "createdBy": createdBy
                });
                var fTransUpdate = await Transaction.findOneAndUpdate(
                    { _id: fTransResult._id },
                    {
                        relatedTransaction: secTransResult._id
                    },
                    { new: true }
                )
                if (req.body.relatedBank) {
                    var freqSecamountUpdate = await Accounting.findOneAndUpdate(
                        { _id: req.body.relatedBank },
                        { $inc: { amount: req.body.paidAmount } }
                    )
                } else if (req.body.relatedCash) {
                    var freqSecamountUpdate = await Accounting.findOneAndUpdate(
                        { _id: req.body.relatedCash },
                        { $inc: { amount: req.body.paidAmount } }
                    )

                }
                var secTransResult2 = await Transaction.create({
                    "amount": req.body.totalAmount,
                    "date": Date.now(),
                    "remark": null,
                    "relatedAccounting": treatmentResult[0].relatedAccount,
                    "type": "Credit",
                    "relatedTransaction": fTransResult._id,
                    "createdBy": createdBy
                });
                var freqSecamountUpdate2 = await Accounting.findOneAndUpdate(
                    { _id: treatmentResult[0].relatedAccount },
                    { $inc: { amount: req.body.totalAmount } }
                )
                const ARUpdate = await AdvanceRecords.findOneAndUpdate(
                    { _id: req.body.advanceID },
                    { amount: 0 },
                    { new: true }
                )
            } else if (req.body.deferAmount < 0 && req.body.paidAmount === 0 && req.body.cashBackAmount > 0) {

                //sec transaction
                var fTransResult = await Transaction.create({
                    "amount": req.body.totalAmount,
                    "date": Date.now(),
                    "remark": null,
                    "relatedAccounting": treatmentResult[0].relatedAccount,
                    "type": "Credit",

                    "createdBy": createdBy
                });

                var amountUpdate = await Accounting.findOneAndUpdate(
                    { _id: treatmentResult[0].relatedAccount },
                    { $inc: { amount: req.body.totalAmount } }
                )
                var secTransResult = await Transaction.create({
                    "amount": req.body.totalAmount,
                    "date": Date.now(),
                    "remark": null,
                    "relatedAccounting": "6467379159a9bc811d97f4d2", //Advance received from customer
                    "type": "Debit",
                    "relatedTransaction": fTransResult._id,
                    "createdBy": createdBy
                })

                var amountUpdate = await Accounting.findOneAndUpdate(
                    { _id: "6467379159a9bc811d97f4d2" },
                    { $inc: { amount: -req.body.totalAmount } }
                )

                var fTransUpdate = await Transaction.findOneAndUpdate(
                    { _id: fTransResult._id },
                    {
                        relatedTransaction: secTransResult._id
                    },
                    { new: true }
                )

                const ARUpdate = await AdvanceRecords.findOneAndUpdate(
                    { _id: req.body.advanceID },
                    { amount: req.body.cashBackAmount },
                    { new: true }
                )

            } else if (req.body.deferAmount === 0 && req.boy.paidAmount === 0 && req.body.cashBackAmount === 0) {
                var fTransResult = await Transaction.create({
                    "amount": req.body.totalAmount,
                    "date": Date.now(),
                    "remark": null,
                    "relatedAccounting": treatmentResult[0].relatedAccount,
                    "type": "Credit",

                    "createdBy": createdBy
                });

                var amountUpdate = await Accounting.findOneAndUpdate(
                    { _id: treatmentResult[0].relatedAccount },
                    { $inc: { amount: req.body.totalAmount } }
                )
                var secTransResult = await Transaction.create({
                    "amount": req.body.totalAmount,
                    "date": Date.now(),
                    "remark": null,
                    "relatedAccounting": "6467379159a9bc811d97f4d2", //Advance received from customer
                    "type": "Debit",
                    "relatedTransaction": fTransResult._id,
                    "createdBy": createdBy
                })

                var amountUpdate = await Accounting.findOneAndUpdate(
                    { _id: "6467379159a9bc811d97f4d2" },
                    { $inc: { amount: -req.body.totalAmount } }
                )

                var fTransUpdate = await Transaction.findOneAndUpdate(
                    { _id: fTransResult._id },
                    {
                        relatedTransaction: secTransResult._id
                    },
                    { new: true }
                )

                const ARUpdate = await AdvanceRecords.findOneAndUpdate(
                    { _id: req.body.advanceID },
                    { amount: 0 },
                    { new: true }
                )
            }
            if (req.body.secondAmount) {
                var fTransResult = await Transaction.create({
                    "amount": req.body.secondAmount,
                    "relatedBranch": req.body.relatedBranch,
                    "date": Date.now(),
                    "remark": null,
                    "relatedAccounting": req.body.secondAccount,
                    "type": "Credit",
                    "createdBy": createdBy,
                    "relatedBranch": req.mongoQuery.relatedBranch
                })
                const amountUpdates = await Accounting.findOneAndUpdate(
                    { _id: req.body.secondAccount },
                    { $inc: { amount: req.body.secondAmount } }
                )

            }
            let dataTVC = {
                "secondAmount": req.body.secondAmount,
                "secondAccount": req.body.secondAccount,
                "isDouble": req.body.isDouble,
                "relatedDentalTreatmentSelection": result._id,
                "relatedDentalTreatment": req.body.relatedDentalTreatment,
                "relatedAppointment": req.body.relatedAppointment,
                "relatedPatient": req.body.relatedPatient,
                "paymentMethod": "pAdvance", //enum: ['by Appointment','Lapsum','Total','Advanced']
                "createdAt": req.body.createdAt,
                "relatedBank": req.body.relatedBank,
                "bankType": req.body.bankType,//must be bank acc from accounting accs
                "paymentType": req.body.paymentType, //enum: ['Bank','Cash']
                "relatedCash": req.body.relatedCash, //must be cash acc from accounting accs
                "createdBy": createdBy,
                "relatedBranch": req.body.relatedBranch,
                "remark": req.body.remark,
                "payment": attachID,
                "relatedDiscount": req.body.relatedDiscount,
                "relatedDoctor": req.body.relatedDoctor,
                "amount": req.body.totalAmount,
                "paidAmount": req.body.paidAmount,
                "balance": req.body.balance
            }
            let today = new Date().toISOString()
            const latestDocument = await TreatmentVoucher.find({}, { seq: 1 }).sort({ _id: -1 }).limit(1).exec();
            if (latestDocument.length === 0) dataTVC = { ...dataTVC, seq: 1, code: "TVC-" + today.split('T')[0].replace(/-/g, '') + "-1" } // if seq is undefined set initial patientID and seq
            if (latestDocument.length > 0) {
                const increment = latestDocument[0].seq + 1
                dataTVC = { ...dataTVC, code: "TVC-" + today.split('T')[0].replace(/-/g, '') + "-" + increment, seq: increment }
            }
            var treatmentVoucherResult = await TreatmentVoucher.create(dataTVC)
        }
        if (req.body.secondAmount) {
            var fTransResult = await Transaction.create({
                "amount": req.body.secondAmount,
                "relatedBranch": req.body.relatedBranch,
                "date": Date.now(),
                "remark": null,
                "relatedAccounting": req.body.secondAccount,
                "type": "Credit",
                "createdBy": createdBy,
                "relatedBranch": req.mongoQuery.relatedBranch
            })
            const amountUpdates = await Accounting.findOneAndUpdate(
                { _id: req.body.secondAccount },
                { $inc: { amount: req.body.secondAmount } }
            )

        }

        if (req.body.paymentMethod === 'FOC') {
            let dataTVC = {
                "secondAmount": req.body.secondAmount,
                "secondAccount": req.body.secondAccount,
                "isDouble": req.body.isDouble,
                "relatedDentalTreatmentSelection": result._id,
                "relatedDentalTreatment": req.body.relatedDentalTreatment,
                "relatedAppointment": req.body.relatedAppointment,
                "relatedPatient": req.body.relatedPatient,
                "paymentMethod": "FOC", //enum: ['by Appointment','Lapsum','Total','Advanced']
                "amount": 0,
                "relatedBank": req.body.relatedBank,
                "bankType": req.body.bankType,//must be bank acc from accounting accs
                "paymentType": req.body.paymentType, //enum: ['Bank','Cash']
                "relatedCash": req.body.relatedCash, //must be cash acc from accounting accs
                "createdBy": createdBy,
                "relatedBranch": req.body.relatedBranch,
                "remark": req.body.remark,
                "payment": attachID,
                "relatedDiscount": req.body.relatedDiscount,
                "relatedDoctor": req.body.relatedDoctor
            }
            let today = new Date().toISOString()
            const latestDocument = await TreatmentVoucher.find({}, { seq: 1 }).sort({ _id: -1 }).limit(1).exec();
            if (latestDocument.length === 0) dataTVC = { ...dataTVC, seq: 1, code: "TVC-" + today.split('T')[0].replace(/-/g, '') + "-1" } // if seq is undefined set initial patientID and seq
            if (latestDocument.length > 0) {
                const increment = latestDocument[0].seq + 1
                dataTVC = { ...dataTVC, code: "TVC-" + today.split('T')[0].replace(/-/g, '') + "-" + increment, seq: increment }
            }
            var treatmentVoucherResult = await TreatmentVoucher.create(dataTVC)
        }
        if (req.body.secondAmount) {
            var fTransResult = await Transaction.create({
                "amount": req.body.secondAmount,
                "relatedBranch": req.body.relatedBranch,
                "date": Date.now(),
                "remark": null,
                "relatedAccounting": req.body.secondAccount,
                "type": "Credit",
                "createdBy": createdBy,
                "relatedBranch": req.mongoQuery.relatedBranch
            })
            const amountUpdates = await Accounting.findOneAndUpdate(
                { _id: req.body.secondAccount },
                { $inc: { amount: req.body.secondAmount } }
            )

        }
        if (tvcCreate === true) {
            //--> treatment voucher create
            let dataTVC = {
                "secondAmount": req.body.secondAmount,
                "secondAccount": req.body.secondAccount,
                "isDouble": req.body.isDouble,
                "relatedDentalTreatmentSelection": result._id,
                "relatedDentalTreatment": req.body.relatedDentalTreatment,
                "relatedAppointment": req.body.relatedAppointment,
                "relatedPatient": req.body.relatedPatient,
                "paymentMethod": "Advanced", //enum: ['by Appointment','Lapsum','Total','Advanced']
                "amount": req.body.totalAmount,
                "paidAmount": req.body.paidAmount,
                "balance": req.body.balance,
                "relatedBank": req.body.relatedBank,
                "bankType": req.body.bankType,//must be bank acc from accounting accs
                "paymentType": req.body.paymentType, //enum: ['Bank','Cash']
                "relatedCash": req.body.relatedCash, //must be cash acc from accounting accs
                "createdBy": createdBy,
                "relatedBranch": req.body.relatedBranch,
                "remark": req.body.remark,
                "payment": attachID,
                "relatedDiscount": req.body.relatedDiscount,
                "relatedDoctor": req.body.relatedDoctor
            }
            let today = new Date().toISOString()
            const latestDocument = await TreatmentVoucher.find({}, { seq: 1 }).sort({ _id: -1 }).limit(1).exec();
            if (latestDocument.length === 0) dataTVC = { ...dataTVC, seq: 1, code: "TVC-" + today.split('T')[0].replace(/-/g, '') + "-1" } // if seq is undefined set initial patientID and seq
            if (latestDocument.length > 0) {
                const increment = latestDocument[0].seq + 1
                dataTVC = { ...dataTVC, code: "TVC-" + today.split('T')[0].replace(/-/g, '') + "-" + increment, seq: increment }
            }
            var treatmentVoucherResult = await TreatmentVoucher.create(dataTVC)
        }
        let advanceQuery = { $inc: { amount: -req.body.totalAmount } }
        if (req.body.recievedPatient) advanceQuery.recievedPatient = req.body.recievedPatient
        //freq Update Start
        const advanceResult = await AdvanceRecords.findOneAndUpdate(
            { relatedPatient: req.body.relatedPatient },
            advanceQuery,
            { new: true }
        )
        const freqUpdate = await Patient.findOneAndUpdate(
            { _id: req.body.relatedPatient },
            { $inc: { treatmentPackageQty: 1, totalAmount: req.body.totalAmount, totalAppointments: req.body.dentalTreatmentTimes, unfinishedAppointments: req.body.dentalTreatmentTimes } },
            { new: true }
        )
        var freqfTransResult = await Transaction.create({
            "amount": req.body.paidAmount,
            "date": Date.now(),
            "remark": null,
            "relatedAccounting": "6467379159a9bc811d97f4d2", //Advance received from customer
            "type": "Credit",
            "createdBy": createdBy
        })
        var freqamountUpdate = await Accounting.findOneAndUpdate(
            { _id: "6467379159a9bc811d97f4d2" },
            { $inc: { amount: -req.body.paidAmount } }
        )
        //sec transaction
        var freqSecTransResult = await Transaction.create({
            "amount": req.body.paidAmount,
            "date": Date.now(),
            "remark": null,
            "relatedBank": req.body.relatedBank,
            "relatedCash": req.body.relatedCash,
            "type": "Debit",
            "relatedTransaction": freqfTransResult._id,
            "createdBy": createdBy
        });
        var freqfTransUpdate = await Transaction.findOneAndUpdate(
            { _id: freqfTransResult._id },
            {
                relatedTransaction: freqSecTransResult._id
            },
            { new: true }
        )
        if (req.body.relatedBank) {
            var freqSecamountUpdate = await Accounting.findOneAndUpdate(
                { _id: req.body.relatedBank },
                { $inc: { amount: req.body.paidAmount } }
            )
        } else if (req.body.relatedCash) {
            var freqSecamountUpdate = await Accounting.findOneAndUpdate(
                { _id: req.body.relatedCash },
                { $inc: { amount: req.body.paidAmount } }
            )
        }
        //Freq Update end
        const populatedResult = await dentalTreatmentSelection.find({ _id: result._id }).populate('createdBy relatedAppointments remainingAppointments relatedTransaction relatedPatient relatedDentalTreatmentList').populate({
            path: 'relatedDentalTreatment',
            model: 'Treatments',
            populate: {
                path: 'relatedDoctor',
                model: 'Doctors'
            }
        })
            .populate({
                path: 'relatedAppointments',
                model: 'Appointments',
                populate: {
                    path: 'relatedDoctor',
                    model: 'Doctors'
                }
            })

        //let appointmentcount = populatedResult.relatedAppointments;
        let appointmentcount = populatedResult[0].relatedAppointments.length;
        let perAppointmentPrices = (req.body.totalAmount / appointmentcount).toFixed(2);
        // let deferRevenues = req.body.totalAmount - perAppointmentPrices;
        let deferRevenues = req.body.totalAmount;
        let updatedata = {
            perAppointmentPrice:perAppointmentPrices,
            deferRevenue:deferRevenues
        };

        const accResult = await Appointment.findOneAndUpdate(
            { _id: req.body.appointment },
            { $addToSet: { relatedDentalTreatmentSelection: result._id } },
            { new: true },
        )
        if (data.relatedPatient) {
            const patientResult = await Patient.findOneAndUpdate(
                { _id: req.body.relatedPatient },
                { $addToSet: { relatedDentalTreatmentSelection: result._id } },
                { new: true }
            )
        }
        if (treatmentVoucherResult) {
            var populatedTV = await TreatmentVoucher.find({ _id: treatmentVoucherResult._id }).populate('relatedDiscount')
        }

        if (req.body.balance > 0) {
            const debtCreate = await Debt.create({
                "balance": req.body.balance,
                "relatedPatient": data.relatedPatient,
                "relatedTreatmentVoucher": treatmentVoucherResult._id
            })
            const fTransaction = new Transaction({
                "amount": req.body.balance,
                "date": Date.now(),
                "remark": remark,
                "relatedAccounting": "6505692e8a572e8de464c0ea", //Account Receivable from Customer
                "type": "Debit",
                "createdBy": createdBy
            })
            const fTransResult = await fTransaction.save()
            var amountUpdate = await Accounting.findOneAndUpdate(
                { _id: "6505692e8a572e8de464c0ea" },  //Account Receivable from Customer
                { $inc: { amount: req.body.balance } }
            )

            const secTransaction = new Transaction(
                {
                    "amount": data.totalPaidAmount,
                    "date": Date.now(),
                    "remark": remark,
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
                    { $inc: { amount: req.body.totalPaidAmount } }
                )
            } else if (relatedCash) {
                var amountUpdate = await Accounting.findOneAndUpdate(
                    { _id: relatedCash },
                    { $inc: { amount: req.body.totalPaidAmount } }
                )
            }
        }

        

        let response = {
            message: 'Dental Treatment Selection create success',
            success: true,
            data: populatedResult,
            appointmentAutoGenerate: appointmentResult,
            patientFreqUpdate: freqUpdate
            // fTransResult: fTransResult,
            // secTransResult: secTransResult,
            // treatmentVoucherResult:treatmentVoucherResult
        }
        if (populatedTV) response.treatmentVoucherResult = populatedTV
        // if (fTransUpdate) response.fTransResult = fTransUpdate
        // if (fTransResult) response.secTransResult = secTransResult
        res.status(200).send(response);
    } catch (error) {
        console.log(error)
        return res.status(500).send({ "error": true, message: error.message })
    }
};

exports.updateDentalTreatmentSelection = async (req, res, next) => {
    try {
        req.body.editTime = moment().format('MMMM Do YYYY, h:mm:ss a')
        req.body.editPerson = req.credentials.id
        req.body.editEmail =  req.credentials.email
        let data = req.body;
        if (data.paidAmount) {
            data = { ...data, leftOverAmount: data.totalAmount - data.paidAmount } // leftOverAmount Calculation
        }
        if (data.paidAmount === 0) data = { ...data, leftOverAmount: data.totalAmount }
        const result = await dentalTreatmentSelection.findOneAndUpdate(
            { _id: req.body.id },
            data,
            { new: true },
        ).populate('relatedDentalTreatment');
        return res.status(200).send({ success: true, data: result });
    } catch (error) {
        return res.status(500).send({ "error": true, "message": error.message })
    }
};

exports.dentalTreatmentPayment = async (req, res, next) => {
    let data = req.body;
    let createdBy = req.credentials.id;
    let files = req.files;
    try {
        let { paidAmount } = data;
        const treatmentSelectionQuery = await dentalTreatmentSelection.find({ _id: req.body.id, isDeleted: false }).populate('relatedDentalTreatment').populate('relatedAppointments');
        const result = await dentalTreatmentSelection.findOneAndUpdate(
            { _id: req.body.id },
            { $inc: { leftOverAmount: -paidAmount }, paidAmount: paidAmount },
            { new: true },
        ).populate('relatedDentalTreatment');
        if (files.payment) {
            for (const element of files.payment) {
                let imgPath = element.path.split('cherry-k')[1];
                const attachData = {
                    fileName: element.originalname,
                    imgUrl: imgPath,
                    image: imgPath.split('\\')[2]
                };
                const attachResult = await Attachment.create(attachData);
                var attachID = attachResult._id.toString()
            }
        }
        if (req.body.secondAmount) {
            var fTransResult = await Transaction.create({
                "amount": req.body.secondAmount,
                "relatedBranch": req.body.relatedBranch,
                "date": Date.now(),
                "remark": null,
                "relatedAccounting": req.body.secondAccount,
                "type": "Credit",
                "createdBy": createdBy,
                "relatedBranch": req.mongoQuery.relatedBranch
            })
            const amountUpdates = await Accounting.findOneAndUpdate(
                { _id: req.body.secondAccount },
                { $inc: { amount: req.body.secondAmount } }
            )

        }
        if (result.paymentMethod === 'Credit') { //
            let dataTVC = {
                "secondAmount": req.body.secondAmount,
                "secondAccount": req.body.secondAccount,
                "isDouble": req.body.isDouble,
                "relatedDentalTreatmentSelection": result._id,
                "relatedDentalTreatment": req.body.relatedDentalTreatment,
                "relatedAppointment": req.body.relatedAppointment,
                "relatedPatient": req.body.relatedPatient,
                "paymentMethod": 'by Appointment', //enum: ['by Appointment','Lapsum','Total','Advanced']
                "amount": paidAmount,
                "relatedBank": req.body.relatedBank, //must be bank acc from accounting accs
                "bankType": req.body.bankType,
                "paymentType": req.body.paymentType, //enum: ['Bank','Cash']
                "relatedCash": req.body.relatedCash,
                "createdBy": createdBy, //must be cash acc from accounting accs
                "relatedBranch": req.body.relatedBranch,
                "remark": req.body.remark,
                "payment": attachID,
                "relatedDiscount": req.body.relatedDiscount,
                "relatedDoctor": req.body.relatedDoctor

            }
            let today = new Date().toISOString()
            const latestDocument = await TreatmentVoucher.find({}, { seq: 1 }).sort({ _id: -1 }).limit(1).exec();
            if (latestDocument.length === 0) dataTVC = { ...dataTVC, seq: 1, code: "TVC-" + today.split('T')[0].replace(/-/g, '') + "-1" } // if seq is undefined set initial patientID and seq
            if (latestDocument.length > 0) {
                const increment = latestDocument[0].seq + 1
                dataTVC = { ...dataTVC, code: "TVC-" + today.split('T')[0].replace(/-/g, '') + "-" + increment, seq: increment }
            }
            var treatmentVoucherResult = await TreatmentVoucher.create(dataTVC)
            //transaction
            var fTransResult = await Transaction.create({
                "amount": req.body.paidAmount,
                "relatedBranch": req.body.relatedBranch,
                "date": Date.now(),
                "remark": null,
                "relatedAccounting": result.relatedDentalTreatment.relatedAccount,
                "type": "Credit",
                "createdBy": createdBy,
                "relatedBranch": req.mongoQuery.relatedBranch
            })
            if (result.relatedDentalTreatment.relatedAccount) {
                var amountUpdate = await Accounting.findOneAndUpdate(
                    { _id: result.relatedDentalTreatment.relatedAccount },
                    { $inc: { amount: req.body.paidAmount } }
                )
            }
            //sec transaction
            var secTransResult = await Transaction.create({
                "amount": req.body.paidAmount,
                "relatedBranch": req.body.relatedBranch,
                "date": Date.now(),
                "remark": null,
                "relatedBank": req.body.relatedBank,
                "relatedCash": req.body.relatedCash,
                "type": "Debit",
                "relatedTransaction": fTransResult._id,
                "createdBy": createdBy,
                "relatedBranch": req.mongoQuery.relatedBranch
            });
            var fTransUpdate = await Transaction.findOneAndUpdate(
                { _id: fTransResult._id },
                {
                    relatedTransaction: secTransResult._id
                },
                { new: true }
            )
            if (req.body.relatedBank) {
                var amountUpdate = await Accounting.findOneAndUpdate(
                    { _id: req.body.relatedBank },
                    { $inc: { amount: req.body.paidAmount } }
                )
            } else if (req.body.relatedCash) {
                var amountUpdate = await Accounting.findOneAndUpdate(
                    { _id: req.body.relatedCash },
                    { $inc: { amount: req.body.paidAmount } }
                )
            }
        } else if (result.paymentMethod === 'Cash Down') { //byAppointment
            // const treatmentVoucherResult = await TreatmentVoucher.create(
            //     {
            //         "relatedTreatment": req.body.relatedTreatment,
            //         "relatedAppointment": req.body.relatedAppointment,
            //         "relatedPatient": req.body.relatedPatient,
            //         "paymentMethod": 'by Appointment', //enum: ['by Appointment','Lapsum','Total','Advanced']
            //         "amount": paidAmount,
            //     }
            // )

            var repayRecord = await Repay.create({
                relatedAppointment: req.body.relatedAppointment,
                relatedTreatmentSelection: req.body.id,
                paidAmount: req.body.paidAmount,
                relatedBranch: req.body.relatedBranch
            })
            var rpRecordPopulated = await Repay.find({ _id: repayRecord._id }).populate('relatedAppointment')
            //transaction
            var fTransResult = await Transaction.create({
                "amount": req.body.paidAmount,
                "date": Date.now(),
                "remark": null,
                "relatedBranch": req.body.relatedBranch,
                "relatedAccounting": "6467379159a9bc811d97f4d2", //Advance received from customer
                "type": "Debit", //minus
                "createdBy": createdBy,
                "relatedBranch": req.mongoQuery.relatedBranch
            })
            //sec transaction
            var secTransResult = await Transaction.create({
                "amount": req.body.paidAmount,
                "date": Date.now(),
                "remark": null,
                "relatedBranch": req.body.relatedBranch,
                "relatedAccounting": result.relatedTreatment.relatedAccount,
                "type": "Credit", //plus
                "relatedTransaction": fTransResult._id,
                "createdBy": createdBy,
                "relatedBranch": req.mongoQuery.relatedBranch
            })
            var fTransUpdate = await Transaction.findOneAndUpdate(
                { _id: fTransResult._id },
                {
                    relatedTransaction: secTransResult._id
                },
                { new: true }
            )
            var amountUpdate = await Accounting.findOneAndUpdate(
                { _id: result.relatedDentalTreatment.relatedAccount },
                { $inc: { amount: req.body.paidAmount } }
            )

            var amountUpdate2 = await Accounting.findOneAndUpdate(
                { _id: "6467379159a9bc811d97f4d2" },
                { $inc: { amount: -req.body.paidAmount } }
            )
        }
        let response = {
            success: true,
            data: result,
            //appointmentAutoGenerate: appointmentResult,
            fTransResult: fTransUpdate,
            // secTransResult: secTransResult,
            // treatmentVoucherResult:treatmentVoucherResult
        }
        if (treatmentVoucherResult) response.treatmentVoucherResult = treatmentVoucherResult;
        if (rpRecordPopulated) response.rpRecordPopulated = rpRecordPopulated
        return res.status(200).send(response);
    } catch (error) {
        console.log(error)
        return res.status(500).send({ "error": true, "message": error.message })
    }
};

exports.deleteDentalTreatmentSelection = async (req, res, next) => {
    try {
        req.body.deleteTime = moment().format('MMMM Do YYYY, h:mm:ss a')
        req.body.deletePerson = req.credentials.id
        req.body.deleteEmail =  req.credentials.email
        const result = await dentalTreatmentSelection.findOneAndUpdate(
            { _id: req.params.id },
            { isDeleted: true, ...req.body },
            { new: true },
        );
        return res.status(200).send({ success: true, data: { isDeleted: result.isDeleted } });
    } catch (error) {
        return res.status(500).send({ "error": true, "message": error.message })

    }
};

exports.activateDentalTreatmentSelection = async (req, res, next) => {
    try {
        const result = await dentalTreatmentSelection.findOneAndUpdate(
            { _id: req.params.id },
            { isDeleted: false },
            { new: true },
        );
        return res.status(200).send({ success: true, data: { isDeleted: result.isDeleted } });
    } catch (error) {
        return res.status(500).send({ "error": true, "message": error.message })
    }
};

exports.createDentalTreatmentTransaction = async (req, res) => {
    try {
        //first transaction 
        const fTransaction = new Transaction({
            "amount": req.body.amount,
            "date": req.body.date,
            "relatedBranch": req.body.relatedBranch,
            "remark": req.body.remark,
            "relatedAccounting": req.body.firstAccount,
            "type": "Credit",
            "createdBy": createdBy,
            "relatedBranch": req.mongoQuery.relatedBranch
        })
        const fTransResult = await fTransaction.save()
        const secTransaction = new Transaction(
            {
                "amount": req.body.amount,
                "date": req.body.date,
                "relatedBranch": req.body.relatedBranch,
                "remark": req.body.remark,
                "relatedAccounting": req.body.secondAccount,
                "type": "Debit",
                "relatedTransaction": fTransResult._id,
                "createdBy": createdBy,
                "relatedBranch": req.mongoQuery.relatedBranch
            }
        )
        var fTransUpdate = await Transaction.findOneAndUpdate(
            { _id: fTransResult._id },
            {
                relatedTransaction: secTransResult._id
            },
            { new: true }
        )
        const secTransResult = await secTransaction.save()
        res.status(200).send({
            message: 'MedicineSale Transaction success',
            success: true,
            fTrans: fTransUpdate,
            sTrans: secTransResult
        });
    } catch (error) {
        return res.status(500).send({ "error": true, "message": error.message })
    }
}

exports.getRelatedDentalTreatmentSelections = async (req, res) => {
    try {
        let query = req.mongoQuery;
        let { relatedPatient, start, end, relatedAppointments } = req.body
        if (start && end) query.createdAt = { $gte: start, $lte: end }
        if (relatedPatient) query.relatedPatient = relatedPatient
        if (relatedAppointments) query.relatedAppointments = { $in: relatedAppointments }
        const result = await dentalTreatmentSelection.find(query).populate('createdBy relatedAppointments remainingAppointments relatedTransaction relatedPatient relatedDentalTreatmentList').populate({
            path: 'relatedDentalTreatment',
            populate: {
                path: 'relatedDoctor',
                model: 'Doctors'
            }
        })
        if (result.length === 0)
            return res.status(404).json({ error: true, message: 'No Record Found' });
        return res.status(200).send({ success: true, data: result });
    } catch (error) {

        return res.status(500).send({ error: true, message: 'An Error Occured While Fetching Related Dental Treatment Selections' })
    }
};


exports.searchDentalTreatmentSelections = async (req, res, next) => {
    try {
        let query = req.mongoQuery
        let { search, relatedPatient } = req.body
        if (relatedPatient) query.relatedPatient = relatedPatient
        if (search) query.$text = { $search: search }
        const result = await dentalTreatmentSelection.find(query).populate('createdBy relatedAppointments remainingAppointments relatedTransaction relatedPatient relatedDentalTreatmentList').populate({
            path: 'relatedDentalTreatment',
            populate: {
                path: 'relatedDoctor',
                model: 'Doctors'
            }
        })
        if (result.length === 0) return res.status(404).send({ error: true, message: 'No Record Found!' })
        return res.status(200).send({ success: true, data: result })
    } catch (err) {
        return res.status(500).send({ error: true, message: err.message })
    }
}

exports.TopTenFilter = async (req, res) => {
    try {
        let query = req.mongoQuery;
        let { start, end, purchaseType } = req.query;
        if (start, end) query.createdAt = { $gte: start, $lte: end };
        if (purchaseType) query.purchaseType = purchaseType;

        const TreatmentResult = await dentalTreatmentSelection.find(query)
            .populate('relatedDentalTreatment')
            .populate('multiDentalTreatment.item_id')
            .populate({
                path: 'relatedDentalTreatment',
                populate: {
                    path: 'dentalTreatmentName',
                }
            });

        const treatmentNameMap = TreatmentResult.reduce((result, { relatedDentalTreatment, multiDentalTreatment, purchaseType }) => {
            if (relatedDentalTreatment) {
                const { name, dentalTreatmentName, sellingPrice } = relatedDentalTreatment;
                const dentalTreatmentUnit = name;
                const dentalTreatment = dentalTreatmentName.name;

                if (result.hasOwnProperty(dentalTreatmentUnit)) {
                    result[dentalTreatmentUnit].qty++;
                } else {
                    result[dentalTreatmentUnit] = { dentalTreatmentUnit, dentalTreatment, qty: 1, purchaseType: purchaseType, sellingPrice: sellingPrice };
                }
            } else if (multiDentalTreatment) {
                for (const item of multiDentalTreatment) {
                    const { name, treatmentName, sellingPrice } = item;
                    const dentalTreatmentUnit = name;
                    const dentalTreatment = dentalTreatmentName.name;

                    if (result.hasOwnProperty(dentalTreatmentUnit)) {
                        result[dentalTreatmentUnit].qty++;
                    } else {
                        result[dentalTreatmentUnit] = { dentalTreatmentUnit, dentalTreatment, qty: 1, purchaseType: purchaseType, sellingPrice: sellingPrice };
                    }
                }
            }

            return result; // Moved the return statement outside the if/else block
        }, {});

        const reducedTreatmentNames = Object.values(treatmentNameMap);

        const sortedTreatmentNames = reducedTreatmentNames.sort((a, b) => b.qty - a.qty); // Descending

        return res.status(200).send({ success: true, data: sortedTreatmentNames, list: TreatmentResult });
    } catch (error) {
        return res.status(500).send({ error: true, message: error.message });
    }
};
