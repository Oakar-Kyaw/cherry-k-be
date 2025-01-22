const branchModel = require("../models/branch");
const { getTop20Medicines } = require("../dashboard/top20Medicine");
const { getTop20Treatment } = require("../dashboard/top20Treatment");
const { getTop20Customers } = require("../dashboard/top20Customer");
const { getIncomeExpenseReports } = require("../dashboard/dashboardIncome");
const { dashboardExpense } = require("../dashboard/dashboardExpense");

exports.dashBoardListAllBranches = async (req, res) => {
  try {
    const branchDocs = await branchModel.find();

    if (!branchDocs) {
      return res.status(404).json({
        success: false,
        message: "No Docs Found In Branch Model",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Here's Branch Docs",
      data: branchDocs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error On Retrieving Branches",
      data: error,
    });
  }
};

exports.getTop20MeidcineByBranchDashboard = async (req, res) => {
  try {
    const { startDate, endDate, relatedBranch, category, subCategory } =
      req.query;

    const topMedicine = await getTop20Medicines(
      startDate,
      endDate,
      relatedBranch,
      category,
      subCategory
    );

    return res.status(200).json({
      success: true,
      message: "Top 20 Medicine",
      data: topMedicine,
    });
  } catch (error) {
    console.error("Error on getTopTwentyMeidcineByBranchDashboard", error);
    return res.status(500).json({
      success: false,
      message: "Error on getTopTwentyMeidcineByBranchDashboard",
      data: error,
    });
  }
};

exports.getTop20TreatmentByBranchDashboard = async (req, res) => {
  try {
    const { startDate, endDate, relatedBranch, treatmentType } = req.query;

    const topTreatment = await getTop20Treatment(
      startDate,
      endDate,
      relatedBranch,
      treatmentType
    );

    return res.status(200).json({
      success: true,
      message: "Top 20 Treatment",
      data: topTreatment,
    });
  } catch (error) {
    console.error("Error on getTopTwentyTreatmentByBranchDashboard", error);
    return res.status(500).json({
      success: false,
      message: "Error on getTopTwentyTreatmentByBranchDashboard",
      data: error,
    });
  }
};

exports.getTop20CustomersByBranchDashboard = async (req, res) => {
  try {
    const { startDate, endDate, relatedBranch, treatmentType } = req.query;

    const topCustomers = await getTop20Customers(
      startDate,
      endDate,
      relatedBranch,
      treatmentType
    );

    return res.status(200).json({
      success: true,
      message: "Top 20 Customers",
      data: topCustomers,
    });
  } catch (error) {
    console.error("Error on getTopTwentyCustomersByBranchDashboard", error);
    return res.status(500).json({
      success: false,
      message: "Error on getTopTwentyCustomersByBranchDashboard",
      data: error,
    });
  }
};

exports.getDashboardIncomeExpenseByBranchDashboard = async (req, res) => {
  try {
    const { relatedBranch, year } = req.query;

    const income = await getIncomeExpenseReports(relatedBranch, year);

    return res.status(200).json({
      success: true,
      message: `Expense-Income for ${year}`,
      data: income,
    });
  } catch (error) {
    console.error("Error on getDashboardIncomeByBranchDashboard", error);
    return res.status(500).json({
      success: false,
      message: "Error on getDashboardIncomeByBranchDashboard",
      data: error,
    });
  }
};

exports.getDashboardExpenseByBranchDashboard = async (req, res) => {
  try {
    const { startDate, endDate, relatedBranch } = req.query;

    const expense = await dashboardExpense(startDate, endDate, relatedBranch);

    return res.status(200).json({
      success: true,
      message: "Dashboard Expense",
      data: expense,
    });
  } catch (error) {
    console.error("Error on getDashboardExpenseByBranchDashboard", error);
    return res.status(500).json({
      success: false,
      message: "Error on getDashboardExpenseByBranchDashboard",
      data: error,
    });
  }
};
