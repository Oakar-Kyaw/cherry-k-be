const bcrypt = require("bcryptjs")
require('dotenv').config()

exports.encryptPassword = async (givenPassword) => {
    let salt = process.env.SALT_KEY
    
    let saltRound = parseInt(process.env.SALT_ROUND)
    console.log(givenPassword)
    let bcryptHash = await bcrypt.hash( givenPassword, saltRound )
    return bcryptHash
}

exports.comparePassword = async (givenPassword, hashedPassword) => {
    let Password = "pass"
    const equalPassword = await bcrypt.compare(Password,hashedPassword)
    console.log("equal Password",equalPassword)
    if(equalPassword){
        return true
    }
}