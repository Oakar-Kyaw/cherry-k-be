const ApiKey = require("../models/apiKey")
require('dotenv').config()

const randomGenerate = () => {
    let today = new Date()
    let text = process.env.RAMDOM_KEY
    const randomText = () => {
     let value = `${text[ Math.floor(Math.random()* 51) - 1 ]}` +  `${text[ Math.floor(Math.random()* 51) - 1 ]}`
                 +`${text[ Math.floor(Math.random()* 51) - 1 ]}` +  `${text[ Math.floor(Math.random()* 51) - 1 ]}`
                 +`${text[ Math.floor(Math.random()* 51) - 1 ]}` +  `${text[ Math.floor(Math.random()* 51) - 1 ]}`
                 +`${text[ Math.floor(Math.random()* 51) - 1 ]}` +  `${text[ Math.floor(Math.random()* 51) - 1 ]}`
                 +`${text[ Math.floor(Math.random()* 51) - 1 ]}` +  `${text[ Math.floor(Math.random()* 51) - 1 ]}`
                 +`${text[ Math.floor(Math.random()* 51) - 1 ]}` +  `${text[ Math.floor(Math.random()* 51) - 1 ]}`
    return value
    
} 
    console.log("random text is ", randomText(), Math.floor(Math.random()* 51))
    return (today.getFullYear() 
           + randomText() 
           + today.getMonth() 
           + randomText()
           + today.getDate() 
           + randomText()
           + today.getHours()
           + randomText()
           + today.getMinutes()
           + randomText()
           + today.getMilliseconds()
           + randomText());
}

exports.createApiKey = async (req,res) => {
   let data = randomGenerate()
   try {
     let result = await ApiKey.create({apiKey: data})
     res.status(200).send({
        success:true,
        data: result,
        message: "Created Api Key Successfully"
     })
   }catch(error){
       res.status(500).send({
         error: true,
         message: error.message
       })
   }
}

exports.getApiKey = async (req,res) => {
   try {
     let result = await ApiKey.find({})
     res.status(200).send({
        success:true,
        data: result,
        message: "Created Api Key Successfully"
     })
   }catch(error){
       res.status(500).send({
         error: true,
         message: error.message
       })
   }
}