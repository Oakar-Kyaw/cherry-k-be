const { catchError } = require("../lib/errorHandler");
const {
  dashBoardListAllBranches,
  getTop20MeidcineByBranchDashboard,
  getTop20TreatmentByBranchDashboard,
  getTop20CustomersByBranchDashboard,
  getDashboardIncomeExpenseByBranchDashboard,
  getDashboardExpenseByBranchDashboard,
} = require("../controllers/dashboardController");
const verifyToken = require("../lib/verifyToken");

module.exports = (app) => {
  app
    .route("/api/dashboard/branches")
    .get(verifyToken, catchError(dashBoardListAllBranches));

  app
    .route("/api/dashboard/top-twenty-medicine-by-branch")
    .get(verifyToken, catchError(getTop20MeidcineByBranchDashboard));

  app
    .route("/api/dashboard/top-twenty-treatment-by-branch")
    .get(verifyToken, catchError(getTop20TreatmentByBranchDashboard));

  app
    .route("/api/dashboard/top-twenty-customer-by-branch")
    .get(verifyToken, catchError(getTop20CustomersByBranchDashboard));

  app
    .route("/api/dashboard/income-expense-by-branch")
    .get(verifyToken, catchError(getDashboardIncomeExpenseByBranchDashboard));

  app
    .route("/api/dashboard/expense-by-branch")
    .get(verifyToken, catchError(getDashboardExpenseByBranchDashboard));
};
