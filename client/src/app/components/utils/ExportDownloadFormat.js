import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const downloadCSV = (data) => {
  const replacer = (_, value) => (value === null ? '' : value);
  const headers = Object.keys(data[0] || {});
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((fieldName) => JSON.stringify(row[fieldName], replacer)).join(',')
    ),
  ].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', 'earnings.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadPDF = (data) => {
  const doc = new jsPDF();
  const headers = [Object.keys(data[0] || {})];
  const rows = data.map((row) => Object.values(row));

  autoTable(doc, {
    head: headers,
    body: rows,
    styles: { fontSize: 8 },
  });

  doc.save('earnings.pdf');
};
