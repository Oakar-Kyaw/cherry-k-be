const path = require('path'),
  rootPath = path.normalize(__dirname + '/..'),
  env = process.env.NODE_ENV || 'production';
const config = {
  development: {
    root: rootPath,
    app: {
      name: 'Cherry-K',
    },
    //db: 'mongodb://127.0.0.1:3221', 
    //test url database
    db: "mongodb+srv://pyaephyokwintech:5NhJPFwcnWwhBh97@cluster0.r1la8.mongodb.net/Cherry-k-test",
    //production database
    // db: 'mongodb+srv://projectDev-01:O9YGEyPQvKyA3Q48@kwintechinstances.usgwoxy.mongodb.net/Cherry-k?retryWrites=true&w=majority', 
    uploadsURI: ['./uploads/cherry-k/img', './uploads/cherry-k/history', './uploads/cherry-k/phistory', './uploads/cherry-k/consent', './uploads/cherry-k/payment'],
    dbName: 'Cherry-k',
    maxLoginAttempts: 5,
    lockTime: 30 * 60 * 1000,
    jwtSecret: 'McQTEUrP=ut*Cr1e4trEDO$q796tEDHz+Sf9@0#YpKFMDZmHR@th5y=7VJtcXk3WU',
    jwtKey: 'm*qf63GOeu9*9oDetCb63Y',
    defaultPasswordExpire: 86400,
  },

  production: {
    root: rootPath,
    app: {
      name: 'Cherry-K',
    },
    //db: 'mongodb://127.0.0.1:3221', 
    //db: 'mongodb+srv://dbuser:P7qBNveg8bVO1d2z@cluster0.85ozwwv.mongodb.net/cherry-k?retryWrites=true&w=majority',
    //test url database
    db: "mongodb+srv://pyaephyokwintech:5NhJPFwcnWwhBh97@cluster0.r1la8.mongodb.net/Cherry-k-test",
    //production database
    // db: 'mongodb+srv://projectDev-01:O9YGEyPQvKyA3Q48@kwintechinstances.usgwoxy.mongodb.net/Cherry-k?retryWrites=true&w=majority',
    uploadsURI: ['./uploads/cherry-k/img', './uploads/cherry-k/history', './uploads/cherry-k/phistory', './uploads/cherry-k/consent', './uploads/cherry-k/payment'],
    dbName: 'Cherry-k',
    maxLoginAttempts: 5,
    lockTime: 30 * 60 * 1000,
    jwtSecret: 'McQTEUrP=ut*Cr1e4trEDO$q796tEDHz+Sf9@0#YpKFMDZmHR@th5y=7VJtcXk3WU',
    jwtKey: 'm*qf63GOeu9*9oDetCb63Y',
    defaultPasswordExpire: 86400,
  },
};


module.exports = config[env];
