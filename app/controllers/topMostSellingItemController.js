const { default: mongoose} = require("mongoose")
const TopMostSellingItems = require("../models/topMostSellingITems")

exports.createTopMostSellingItems = async(req,res) => {
    let {
        accessoryItems,
        medicineItems,
        procedureItems,
        generalItems,
        ...data
    } = req.body
    try {
        if( accessoryItems && accessoryItems.length != 0){
            accessoryItems.map( async(item) =>{
                let datas = {
                    accessoryItem: item.id,
                    total_amount: item.total_amount,
                    quantity: item.quantity,
                    ...data
                }
                let createItems = await TopMostSellingItems.create(datas)
            })
        }
        if( medicineItems && medicineItems.length != 0){
            medicineItems.map( async(item) =>{
                let datas = {
                    medicineItem: item.id,
                    total_amount: item.total_amount,
                    quantity: item.quantity,
                    ...data
                }
                let createItems = await TopMostSellingItems.create(datas)
            })
        }
        if( procedureItems && procedureItems.length != 0){
            procedureItems.map( async(item) =>{
                let datas = {
                    procedureItem: item.id,
                    total_amount: item.total_amount,
                    quantity: item.quantity,
                    ...data
                }
                let createItems = await TopMostSellingItems.create(datas)
            })
        }
        if( generalItems && generalItems.length != 0){
            generalItems.map( async(item) =>{
                let datas = {
                    generalItem: item.id,
                    total_amount: item.total_amount,
                    quantity: item.quantity,
                    ...data
                }
                let createItems = await TopMostSellingItems.create(datas)
            })
        }
        res.status(200).send({
            success: true,
            message: "Created Successfully"
        })
    } catch (error) {
        res.status(500).send({
            error: true,
            message: error.message
        })
    }
}

exports.listAllAccessory = async (req,res) =>{
    let query = {
        isDeleted: false
    }
    let {relatedBranch, fromDate, toDate} =req.query
    try {
        let dateFilter
        fromDate && toDate ? dateFilter =  {$gte: new Date(fromDate), $lte: new Date(toDate)} 
        : fromDate ? dateFilter = {$gte: new Date(fromDate)}
        : toDate ? dateFilter = {$lte: new Date(toDate)}
        : dateFilter = {$exists: true}
        console.log("form",dateFilter)
        let data = await TopMostSellingItems.aggregate([
            {
              $match: {
                relatedBranch: new mongoose.Types.ObjectId(relatedBranch),
                date: dateFilter,
                accessoryItem: { $exists: true, $ne: null }
              }
            },
            {
              $group: {
                _id: "$accessoryItem",
                quantity: { $sum: "$quantity" },
                total_amount: { $sum: "$total_amount" },
              }
            },
            {
              $project: {
                accessoryItem: "$_id",
                relatedBranch: relatedBranch,
                quantity: 1,
                total_amount: 1
                // _id: 0
              }
            },
            { 
                $sort: { "quantity": -1 } 
              },
          ]);
        await TopMostSellingItems.populate(data,[{path:"accessoryItem"},{path:"relatedBranch"}])
        res.status(200).send({
            success: true,
            data: data
        })
    } catch (error) {
        res.status(500).send({
            error: true,
            message: error.message
        })
    }
}

exports.listAllProcedure = async (req,res) =>{
    let query = {
        isDeleted: false
    }
    let {relatedBranch, fromDate, toDate} =req.query
    try {
        let dateFilter
        fromDate && toDate ? dateFilter =  {$gte: new Date(fromDate), $lte: new Date(toDate)} 
        : fromDate ? dateFilter = {$gte: new Date(fromDate)}
        : toDate ? dateFilter = {$lte: new Date(toDate)}
        : dateFilter = {$exists: true}
        console.log("form",dateFilter)
        let data = await TopMostSellingItems.aggregate([
            {
              $match: {
                relatedBranch: new mongoose.Types.ObjectId(relatedBranch),
                date: dateFilter,
                procedureItem: { $exists: true, $ne: null }
              }
            },
            {
              $group: {
                _id: "$procedureItem",
                quantity: { $sum: "$quantity" },
                total_amount: { $sum: "$total_amount" },
                
              }
            },
            {
              $project: {
                procedureItem: "$_id",
                relatedBranch: relatedBranch,
                quantity: 1,
                total_amount: 1,
                date: 1 
                // _id: 0
              }
            },
            { 
                $sort: { "quantity": -1 } 
              },
          ]);
        await TopMostSellingItems.populate(data,[{path:"procedureItem"},{path:"relatedBranch"}])
        res.status(200).send({
            success: true,
            data: data
        })
    } catch (error) {
        res.status(500).send({
            error: true,
            message: error.message
        })
    }
}

exports.listAllMedicine = async (req,res) =>{
    let query = {
        isDeleted: false
    }
    let {relatedBranch, fromDate, toDate} =req.query
    try {
        let dateFilter
        fromDate && toDate ? dateFilter =  {$gte: new Date(fromDate), $lte: new Date(toDate)} 
        : fromDate ? dateFilter = {$gte: new Date(fromDate)}
        : toDate ? dateFilter = {$lte: new Date(toDate)}
        : dateFilter = {$exists: true}
        console.log("form",dateFilter)
        let data = await TopMostSellingItems.aggregate([
            {
              $match: {
                relatedBranch: new mongoose.Types.ObjectId(relatedBranch),
                date: dateFilter,
                medicineItem: { $exists: true, $ne: null }
              }
            },
            {
              $group: {
                _id: "$medicineItem",
                quantity: { $sum: "$quantity" },
                total_amount: { $sum: "$total_amount" },
                
              }
            },
            {
              $project: {
                medicineItem: "$_id",
                relatedBranch: relatedBranch,
                quantity: 1,
                total_amount: 1,
                date: 1 
                // _id: 0
              }
            },
            { 
                $sort: { "quantity": -1 } 
              },
          ]);
        await TopMostSellingItems.populate(data,[{path:"medicineItem"},{path:"relatedBranch"}])
        res.status(200).send({
            success: true,
            data: data
        })
    } catch (error) {
        res.status(500).send({
            error: true,
            message: error.message
        })
    }
}

exports.listAllGeneral = async (req,res) =>{
    let query = {
        isDeleted: false
    }
    let {relatedBranch, fromDate, toDate} =req.query
    try {
        let dateFilter
        fromDate && toDate ? dateFilter =  {$gte: new Date(fromDate), $lte: new Date(toDate)} 
        : fromDate ? dateFilter = {$gte: new Date(fromDate)}
        : toDate ? dateFilter = {$lte: new Date(toDate)}
        : dateFilter = {$exists: true}
        console.log("form",dateFilter)
        let data = await TopMostSellingItems.aggregate([
            {
              $match: {
                relatedBranch: new mongoose.Types.ObjectId(relatedBranch),
                date: dateFilter,
                generalItem: { $exists: true, $ne: null }
              }
            },
            {
              $group: {
                _id: "$generalItem",
                quantity: { $sum: "$quantity" },
                total_amount: { $sum: "$total_amount" },
                
              }
            },
            {
              $project: {
                generalItem: "$_id",
                relatedBranch: relatedBranch,
                quantity: 1,
                total_amount: 1,
                date: 1 
                // _id: 0
              }
            },
            { 
                $sort: { "quantity": -1 } 
              },
          ]);
        await TopMostSellingItems.populate(data,[{path:"generalItem"},{path:"relatedBranch"}])
        res.status(200).send({
            success: true,
            data: data
        })
    } catch (error) {
        res.status(500).send({
            error: true,
            message: error.message
        })
    }
}