import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to get conditional headers and data
function getConditionalColumns(employee, selectedStatus, selectedPaymentMethod) {
    const conditionalHeaders = [];
    const conditionalData = [];

    // Rule 1: mobileNumber for 'processed' status AND 'cash' payment method
    if (selectedStatus === 'processed' && selectedPaymentMethod === 'cash') {
        conditionalHeaders.push('Mobile No.');
        conditionalData.push(employee.mobileNumber || ''); // Assuming 'phoneNumber' is in a 'contact' object
    }

    // Rule 2: Bank details for 'processed' status AND 'bank/cheque' payment method
    if (selectedStatus === 'processed' && (selectedPaymentMethod === 'bank' || selectedPaymentMethod === 'cheque')) {
        conditionalHeaders.push('Acc. Name');
        conditionalHeaders.push('Acc. No.');
        conditionalHeaders.push('Bank Name');
        conditionalHeaders.push('Bank Code');
        conditionalHeaders.push('Branch Name');
        conditionalHeaders.push('Branch Code');

        conditionalData.push(employee.accountName || '');
        conditionalData.push(employee.accountNumber || '');
        conditionalData.push(employee.bankName || '');
        conditionalData.push(employee.bankCode || '');
        conditionalData.push(employee.branchName || '');
        conditionalData.push(employee.branchCode || '');
    }

    return { conditionalHeaders, conditionalData };
}

export function exportPayrollToCSV(data, visibleColumns, earningsTypes, deductionsTypes, selectedStatus, selectedPaymentMethod) {
  const headers = [];
  const rows = [];

  // Base Headers
  if (visibleColumns.staffId) headers.push('Staff ID');
  if (visibleColumns.fullName) headers.push('Employee Name'); // Changed from employeeName to fullName as per your table code
  if (visibleColumns.basicSalary) headers.push('Basic Salary');

  earningsTypes.forEach(type => {
    const key = `earning_${type}`;
    if (visibleColumns[key]) headers.push(type);
  });

  deductionsTypes.forEach(type => {
    const key = `deduction_${type}`;
    if (visibleColumns[key]) headers.push(type);
  });

  if (visibleColumns.totalEarnings) headers.push('Total Earnings');
  if (visibleColumns.totalDeductions) headers.push('Total Deductions');
  if (visibleColumns.grossPay) headers.push('Gross Pay');
  if (visibleColumns.nssf) headers.push('NSSF');
  if (visibleColumns.shif) headers.push('SHIF');
  if (visibleColumns.housingLevy) headers.push('Housing Levy');
  if (visibleColumns.paye) headers.push('PAYE');
  if (visibleColumns.totalStatutory) headers.push('Total Statutory');
  if (visibleColumns.netPay) headers.push('Net Pay');
  if (visibleColumns.status) headers.push('Status');

  // Conditional Headers
  const { conditionalHeaders: headerAdditions } = getConditionalColumns({}, selectedStatus, selectedPaymentMethod);
  headers.push(...headerAdditions);


  data.forEach(emp => {
    const row = [];

    // Base Data
    if (visibleColumns.staffId) row.push(emp.staffId);
    if (visibleColumns.fullName) row.push(emp.fullName); // Changed from employeeName to fullName
    if (visibleColumns.basicSalary) row.push(emp.basicSalary);

    earningsTypes.forEach(type => {
      const key = `earning_${type}`;
      if (visibleColumns[key]) {
        const found = emp.earnings.find(e => e.type === type);
        row.push(found ? found.amount : 0);
      }
    });

    deductionsTypes.forEach(type => {
      const key = `deduction_${type}`;
      if (visibleColumns[key]) {
        const found = emp.deductions.find(d => d.type === type);
        row.push(found ? found.amount : 0);
      }
    });

    if (visibleColumns.totalEarnings) row.push(emp.totalEarnings);
    if (visibleColumns.totalDeductions) row.push(emp.totalDeductions);
    if (visibleColumns.grossPay) row.push(emp.grossPay);
    if (visibleColumns.nssf) row.push(emp.statutory.nssf);
    if (visibleColumns.shif) row.push(emp.statutory.shif);
    if (visibleColumns.housingLevy) row.push(emp.statutory.housingLevy);
    if (visibleColumns.paye) row.push(emp.statutory.paye);
    if (visibleColumns.totalStatutory) row.push(emp.statutory.total);
    if (visibleColumns.netPay) row.push(emp.netPay);
    if (visibleColumns.status) row.push(emp.status);

    // Conditional Data
    const { conditionalData: dataAdditions } = getConditionalColumns(emp, selectedStatus, selectedPaymentMethod);
    row.push(...dataAdditions);

    rows.push(row);
  });

  const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'payroll_export.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportPayrollToPDF(data, visibleColumns, earningsTypes, deductionsTypes, selectedStatus, selectedPaymentMethod) {
  const doc = new jsPDF('l', 'pt', 'a4');
  const headers = [];

  // Base Headers
  if (visibleColumns.staffId) headers.push('Staff ID');
  if (visibleColumns.fullName) headers.push('Employee Name');
  if (visibleColumns.basicSalary) headers.push('Basic Salary');

  earningsTypes.forEach(type => {
    const key = `earning_${type}`;
    if (visibleColumns[key]) headers.push(type);
  });

  deductionsTypes.forEach(type => {
    const key = `deduction_${type}`;
    if (visibleColumns[key]) headers.push(type);
  });

  if (visibleColumns.totalEarnings) headers.push('Total Earnings');
  if (visibleColumns.totalDeductions) headers.push('Total Deductions');
  if (visibleColumns.grossPay) headers.push('Gross Pay');
  if (visibleColumns.nssf) headers.push('NSSF');
  if (visibleColumns.shif) headers.push('SHIF');
  if (visibleColumns.housingLevy) headers.push('Housing Levy');
  if (visibleColumns.paye) headers.push('PAYE');
  if (visibleColumns.totalStatutory) headers.push('Total Statutory');
  if (visibleColumns.netPay) headers.push('Net Pay');
  if (visibleColumns.status) headers.push('Status');

  // Conditional Headers
  const { conditionalHeaders: headerAdditions } = getConditionalColumns({}, selectedStatus, selectedPaymentMethod);
  headers.push(...headerAdditions);

  const rows = data.map(emp => {
    const row = [];

    // Base Data
    if (visibleColumns.staffId) row.push(emp.staffId);
    if (visibleColumns.fullName) row.push(emp.fullName);
    if (visibleColumns.basicSalary) row.push(emp.basicSalary);

    earningsTypes.forEach(type => {
      const key = `earning_${type}`;
      if (visibleColumns[key]) {
        const found = emp.earnings.find(e => e.type === type);
        row.push(found ? found.amount : 0);
      }
    });

    deductionsTypes.forEach(type => {
      const key = `deduction_${type}`;
      if (visibleColumns[key]) {
        const found = emp.deductions.find(d => d.type === type);
        row.push(found ? found.amount : 0);
      }
    });

    if (visibleColumns.totalEarnings) row.push(emp.totalEarnings);
    if (visibleColumns.totalDeductions) row.push(emp.totalDeductions);
    if (visibleColumns.grossPay) row.push(emp.grossPay);
    if (visibleColumns.nssf) row.push(emp.statutory.nssf);
    if (visibleColumns.shif) row.push(emp.statutory.shif);
    if (visibleColumns.housingLevy) row.push(emp.statutory.housingLevy);
    if (visibleColumns.paye) row.push(emp.statutory.paye);
    if (visibleColumns.totalStatutory) row.push(emp.statutory.total);
    if (visibleColumns.netPay) row.push(emp.netPay);
    if (visibleColumns.status) row.push(emp.status);

    // Conditional Data
    const { conditionalData: dataAdditions } = getConditionalColumns(emp, selectedStatus, selectedPaymentMethod);
    row.push(...dataAdditions);

    return row;
  });

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 60, // Start table lower to make space for title and other header info
    margin: { top: 50, right: 30, bottom: 50, left: 30 }, // Increased top/bottom margin for header/footer

    // --- Styling for Appearance and Fit ---
    columnWidth: 'wrap', // Still good for ensuring text wraps if needed
    
    styles: {
        fontSize: 9, // Slightly larger base font size
        lineColor: [180, 180, 180], // Lighter border color for lines
        lineWidth: 0.5, // Thinner lines
        cellPadding: 3, // Default cell padding
    },

    headStyles: {
        fillColor: [230, 230, 230], // Light grey background
        textColor: 20, // Dark text
        fontStyle: 'bold',
        halign: 'center', // Center align headers
        valign: 'middle',
        fontSize: 10, // Slightly larger font for headers
        cellPadding: 4, // Padding around header text
        minCellHeight: 20, // Ensure header row has enough height if text wraps
    },

    bodyStyles: {
        fontSize: 9, // Matching the general font size for body
        textColor: 50,
        valign: 'top', // Align text to the top if cells have varying heights
        cellPadding: 3, // Standard padding
    },

    // Hook to adjust cell styling (e.g., text wrapping, alignment)
    didParseCell: function(data) {
      if (typeof data.cell.raw === 'string' && data.cell.text.length > 1) {
        data.cell.styles.overflow = 'linebreak';
        data.cell.styles.halign = 'left'; // Default to left align for text
      } else if (typeof data.cell.raw === 'number') {
        data.cell.styles.halign = 'right'; // Right align numbers
      }
    },
    
    // --- Page Count and Total Rows in Footer ---
    didDrawPage: function (data) {
        // Header
        doc.setFontSize(14);
        doc.text("Payroll Export Report", data.settings.margin.left, 30);
        
        // Date of export
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.width - data.settings.margin.right, 30, { align: 'right' });

        // Footer
        const pageCount = doc.internal.pages.length; // Correct way to get total pages
        doc.setFontSize(10);
        doc.setTextColor(100); // Grey text for footer

        const totalRowsText = `Total Records: ${data.table.body.length}`;
        const pageNumberText = `Page ${data.pageNumber} of ${pageCount}`; // data.pageNumber gives current page

        // Position for total records (e.g., left aligned in footer)
        doc.text(totalRowsText, data.settings.margin.left, doc.internal.pageSize.height - 20);

        // Position for page number (e.g., right aligned in footer)
        doc.text(pageNumberText, doc.internal.pageSize.width - data.settings.margin.right, doc.internal.pageSize.height - 20, { align: 'right' });
    },
  });

  doc.save('payroll_export.pdf');
}