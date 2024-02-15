const MobileWalletUser  = require("../controllers/mobileWalletUserController")

module.exports  = (app) => {
    //get all mobile user
    app.route("/api/mobile/users")
       .post(MobileWalletUser.createMobileWalletUser)
       .get(MobileWalletUser.getAllMobileWalletUser)

    //edit mobile user
    app.route("/api/mobile/user/:id")
       .put(MobileWalletUser.editMobileWalletUser)
}