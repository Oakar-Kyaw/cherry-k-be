const { catchError } = require("../lib/errorHandler");
const {
  dashBoardListAllBranches,
  getTop20MeidcineByBranchDashboard,
  getTop20TreatmentByBranchDashboard,
  getTop20CustomersByBranchDashboard,
  getDashboardIncomeByBranchDashboard,
  getDashboardExpenseByBranchDashboard,
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

  app
    .route("/api/dashboard/top-twenty-customer-by-branch")
    .get(catchError(getTop20CustomersByBranchDashboard));

  app
    .route("/api/dashboard/income-by-branch")
    .get(catchError(getDashboardIncomeByBranchDashboard));

  app
    .route("/api/dashboard/expense-by-branch")
    .get(catchError(getDashboardExpenseByBranchDashboard));
};
