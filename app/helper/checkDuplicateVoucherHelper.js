const treatmentVoucher = require("../models/treatmentVoucher");
const { startDateEndDateHelper } = require("./dateHelper");
const {
  TreatmentVoucherFilter,
} = require("../controllers/treatmentVoucherController");
const moment = require("moment-timezone");

const now = moment.tz("Asia/Yangon");
const twentyFourHoursAgo = now.clone().subtract(24, "hours");

const dateRange = {
  startDate: twentyFourHoursAgo.toISOString(), // 24 hours ago
  endDate: now.toISOString(), // Current time
};

function compareTwoArray(real, compare) {
  switch (real.length === compare.length) {
    case true:
      let checkArray = false;
      compare.map((item) => {
        const checkItemFromArray = real.includes(item);
        if (!checkItemFromArray) {
          return false;
        } else {
          checkArray = true;
        }
      });
      return checkArray;
    case false:
      return false;
  }
}

// exports.checkDuplicateVoucher = async (data) => {
//   const {
//     tsType,
//     totalAmount,
//     msTotalAmount,
//     relatedPatient,
//     createdAt,
//     relatedBranch,
//     relatedDoctor,
//     multiTreatment,
//     medicineItems,
//     paymentType,
//     relatedBank,
//     relatedCash,
//   } = data;

//   // Convert to UTC and format as ISO 8601 string
//   const date = startDateEndDateHelper({ exact: createdAt, value: "add" });

//   console.log("j", createdAt, date);

//   const query = {
//     isDeleted: false,
//     Refund: false,
//   };

//   tsType ? (query.tsType = tsType) : "";
//   totalAmount ? (query.totalAmount = totalAmount) : "";
//   query.relatedPatient = relatedPatient;
//   relatedDoctor ? (query.relatedDoctor = relatedDoctor) : "";
//   msTotalAmount ? (query.msTotalAmount = msTotalAmount) : "";

//   createdAt
//     ? (query.createdAt = {
//         $gte: new Date(date.startDate.split("T")[0]),
//         $lt: new Date(date.endDate.split("T")[0]),
//       })
//     : "";

//   relatedBranch ? (query.relatedBranch = relatedBranch) : "";
//   let voucher = await treatmentVoucher.find(query);

//   if (voucher.length > 0) {
//     let voucherExist = TreatmentVoucherFilter;

//     voucher.some((v) => {
//       const realItemArrayId = [];
//       const array = tsType === "TSMulti" ? v.multiTreatment : v.medicineItems;
//       array.map((arr) => realItemArrayId.push(arr.item_id.toString()));

//       const compareArray =
//         tsType === "TSMulti"
//           ? JSON.parse(multiTreatment)
//           : JSON.parse(medicineItems);
//       const compareItemId = compareArray.map((arr) => arr.item_id);

//       console.log(compareTwoArray(realItemArrayId, compareItemId), "c");

//       if (compareTwoArray(realItemArrayId, compareItemId)) {
//         voucherExist = true;
//         return true;
//       } else {
//         voucherExist = false;
//       }
//     });

//     return voucherExist;
//   }

//   return false;
// };

// exports.checkDuplicateVoucher = async (data) => {
//   const {
//     tsType,
//     totalAmount,
//     msTotalAmount,
//     relatedPatient,
//     createdAt,
//     relatedBranch,
//     relatedDoctor,
//     multiTreatment,
//     medicineItems,
//     paymentMethod, // 'cash' or 'bank'
//     relatedBank,
//     relatedCash,
//   } = data;

//   // Convert to UTC and format as ISO 8601 string
//   const date = startDateEndDateHelper({ exact: createdAt, value: "add" });

//   console.log("Checking voucher for data:", data);

//   const query = {
//     isDeleted: false,
//     Refund: false,
//   };

//   tsType ? (query.tsType = tsType) : "";
//   totalAmount ? (query.totalAmount = totalAmount) : "";
//   query.relatedPatient = relatedPatient;
//   relatedDoctor ? (query.relatedDoctor = relatedDoctor) : "";
//   msTotalAmount ? (query.msTotalAmount = msTotalAmount) : "";

//   createdAt
//     ? (query.createdAt = {
//         $gte: new Date(date.startDate.split("T")[0]),
//         $lt: new Date(date.endDate.split("T")[0]),
//       })
//     : "";

//   relatedBranch ? (query.relatedBranch = relatedBranch) : "";

//   // Find the vouchers based on the query
//   let vouchers = await treatmentVoucher.find(query);

//   if (vouchers.length > 0) {
//     let voucherExists = false;

//     const shouldOpenVoucher = (
//       currentPaymentMethod, // 'cash' or 'bank'
//       currentRelatedCash,
//       currentRelatedBank,
//       newPaymentMethod, // 'cash' or 'bank'
//       newRelatedCash,
//       newRelatedBank
//     ) => {
//       // Log the comparison values
//       console.log(
//         "Comparing payment methods:",
//         currentPaymentMethod,
//         newPaymentMethod
//       );
//       console.log("Comparing relatedCash:", currentRelatedCash, newRelatedCash);
//       console.log("Comparing relatedBank:", currentRelatedBank, newRelatedBank);

//       // Case 1: If paymentMethod is different, allow opening the voucher
//       if (currentPaymentMethod !== newPaymentMethod) {
//         return true;
//       }

//       // Case 2: If paymentMethod is 'cash' but there's a new relatedBank
//       if (newPaymentMethod === "Cash" && newRelatedBank) {
//         return true;
//       }

//       if (newPaymentMethod === "Bank" && newRelatedCash) {
//         return true;
//       }

//       if (!currentRelatedCash && newRelatedBank) {
//         return true;
//       }

//       if (!currentRelatedBank && newRelatedCash) {
//         return true;
//       }

//       // Case 3: If relatedCash or relatedBank values are different
//       if (
//         currentPaymentMethod === newPaymentMethod &&
//         (currentRelatedCash !== newRelatedCash ||
//           currentRelatedBank !== newRelatedBank)
//       ) {
//         return true;
//       }

//       return false;
//     };

//     // Loop through vouchers and check if they are duplicates
//     vouchers.some((v) => {
//       const realItemArrayId = [];
//       const array = tsType === "TSMulti" ? v.multiTreatment : v.medicineItems;
//       array.map((arr) => realItemArrayId.push(arr.item_id.toString()));

//       const compareArray =
//         tsType === "TSMulti"
//           ? JSON.parse(multiTreatment)
//           : JSON.parse(medicineItems);
//       const compareItemId = compareArray.map((arr) => arr.item_id);

//       console.log("Comparing item arrays:", realItemArrayId, compareItemId);
//       console.log(
//         "Comparison result:",
//         compareTwoArray(realItemArrayId, compareItemId)
//       );

//       if (compareTwoArray(realItemArrayId, compareItemId)) {
//         // Use the shouldOpenVoucher function to determine if a duplicate voucher exists
//         if (
//           shouldOpenVoucher(
//             v.paymentMethod,
//             v.relatedCash,
//             v.relatedBank,
//             paymentMethod,
//             relatedCash,
//             relatedBank
//           )
//         ) {
//           console.log("Voucher duplicate found");
//           voucherExists = true;
//           return true; // Exit the loop if a duplicate is found
//         }
//       }
//     });

//     return voucherExists;
//   }

//   return false;
// };

exports.checkDuplicateVoucher = async (data) => {
  const {
    tsType,
    totalAmount,
    msTotalAmount,
    relatedPatient,
    createdAt,
    relatedBranch,
    relatedDoctor,
    multiTreatment,
    medicineItems,
    paymentMethod,
    relatedBank,
    relatedCash,
  } = data;

  console.log("Checking voucher for data:", data);

  // Prepare the date range
  const dateRange = createdAt
    ? startDateEndDateHelper({ exact: createdAt, value: "add" })
    : null;

  const query = {
    isDeleted: false,
    Refund: false,
    ...(tsType && { tsType }),
    ...(totalAmount && { totalAmount }),
    ...(msTotalAmount && { msTotalAmount }),
    ...(relatedPatient && { relatedPatient }),
    ...(relatedDoctor && { relatedDoctor }),
    ...(relatedBranch && { relatedBranch }),
    ...(dateRange && {
      createdAt: {
        $gte: new Date(dateRange.startDate),
        $lt: new Date(dateRange.endDate),
      },
    }),
  };

  console.log("Query:", query);

  const vouchers = await treatmentVoucher.find(query);

  console.log("Found vouchers:", vouchers);

  if (!vouchers.length) return false;

  const compareTwoArrays = (arr1, arr2) =>
    arr1.length === arr2.length && arr1.every((val, i) => val === arr2[i]);

  const shouldOpenVoucher = (
    v,
    newPaymentMethod,
    newRelatedCash,
    newRelatedBank
  ) => {
    if (v.paymentMethod !== newPaymentMethod) {
      return true;
    }

    if (v.paymentMethod === "Cash") {
      return (
        v.relatedCash &&
        v.relatedCash.toString() !==
          (newRelatedCash ? newRelatedCash.toString() : "")
      );
    }

    if (v.paymentMethod === "Bank") {
      return (
        v.relatedBank &&
        v.relatedBank.toString() !==
          (newRelatedBank ? newRelatedBank.toString() : "")
      );
    }

    return false;
  };

  for (const v of vouchers) {
    const storedItems =
      tsType === "TSMulti" ? v.multiTreatment : v.medicineItems;
    const newItems =
      tsType === "TSMulti"
        ? JSON.parse(multiTreatment)
        : JSON.parse(medicineItems);

    const storedItemIds = storedItems.map((item) => item.item_id.toString());
    const newItemIds = newItems.map((item) => item.item_id);

    if (
      compareTwoArrays(storedItemIds, newItemIds) &&
      shouldOpenVoucher(v, paymentMethod, relatedCash, relatedBank)
    ) {
      return true; // Voucher can be opened
    }
  }

  return false; // No voucher can be opened
};
