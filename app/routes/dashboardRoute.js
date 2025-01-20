const { catchError } = require("../lib/errorHandler");
const {
  dashBoardListAllBranches,
  getTop20MeidcineByBranchDashboard,
  getTop20TreatmentByBranchDashboard,
} = require("../controllers/dashboardController");

module.exports = (app) => {
  app
    .route("/api/dashboard/branches")
    .get(catchError(dashBoardListAllBranches));

  app
    .route("/api/dashboard/top-twenty-medicine-by-branch")
    .get(catchError(getTop20MeidcineByBranchDashboard));

  app
    .route("/api/dashboard/top-twenty-treatment-by-branch")
    .get(catchError(getTop20TreatmentByBranchDashboard));
};
