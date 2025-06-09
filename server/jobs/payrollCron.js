const cron = require('node-cron');
const { PayrollItem } = require('../models/payrollModel');
const { Op } = require('sequelize');

// 1. Expire draft payroll items after 7 days
const expireDraftPayrollItems = async () => {
  try {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [count] = await PayrollItem.update(
      { payrollStatus: 'expired', expiresAt: new Date() }, // Mark as expired
      {
        where: {
          payrollStatus: 'draft',
          submittedAt: { [Op.lte]: cutoffDate }
        }
      }
    );

    console.log(`[Cron] Expired ${count} draft payroll items older than 7 days`);
  } catch (err) {
    console.error('[Cron] Failed to expire draft payroll items:', err);
  }
};

// 2. Reject pending approvals after 3 days
const autoRejectPendingPayrollItems = async () => {
  try {
    const cutoffDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const [count] = await PayrollItem.update(
      { payrollStatus: 'rejected', rejectedAt: new Date() }, // Mark as rejected
      {
        where: {
          payrollStatus: 'pending',
          approvalDate: { [Op.lte]: cutoffDate } // Use submittedAt instead of approvalDate
        }
      }
    );

    console.log(`[Cron] Auto-rejected ${count} payroll items pending for over 3 days`);
  } catch (err) {
    console.error('[Cron] Failed to auto-reject payroll items:', err);
  }
};

// Schedule the jobs to run daily at 1:00 AM
cron.schedule('0 1 * * *', async () => {
  console.log('[Cron] Running scheduled payroll item status checks...');
  await expireDraftPayrollItems();
  await autoRejectPendingPayrollItems();
});
