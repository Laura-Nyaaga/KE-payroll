// const { EmployeeEarnings } = require('../models/earningsModel'); 
const { EmployeeDeduction } = require('../models/deductionsModel');
const { sequelize } = require('../config/db'); // ensure DB connection is initialized
// const { calculateEarningsAmount } = require('../models/earningsModel'); // import your calculation function
const { calculateDeductionAmount } = require('../models/deductionsModel'); // import your calculation function

// async function backfillCalculatedAmounts() {
//   await sequelize.authenticate(); // make sure DB is connected

//   const allEntries = await EmployeeEarnings.findAll();

//   for (const entry of allEntries) {
//     try {
//       await calculateEarningsAmount(entry); // recalculate manually
//       await entry.save(); // save triggers DB update
//       console.log(`Updated entry ID: ${entry.id}`);
//     } catch (err) {
//       console.error(`Failed for entry ID ${entry.id}: ${err.message}`);
//     }
//   }

//   await sequelize.close(); // close DB when done
// }

// backfillCalculatedAmounts();



async function backfillCalculatedAmounts() {
  await sequelize.authenticate(); // make sure DB is connected

  const allEntries = await EmployeeDeduction.findAll();

  for (const entry of allEntries) {
    try {
      await calculateDeductionAmount(entry); // recalculate manually
      await entry.save(); // save triggers DB update
      console.log(`Updated entry ID: ${entry.id}`);
    } catch (err) {
      console.error(`Failed for entry ID ${entry.id}: ${err.message}`);
    }
  }

  await sequelize.close(); // close DB when done
}

backfillCalculatedAmounts();
