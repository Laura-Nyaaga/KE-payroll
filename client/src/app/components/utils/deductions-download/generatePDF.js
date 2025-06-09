import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generatePDF(data, filename) {
  const doc = new jsPDF();
  autoTable(doc, {
    head: [data[0]],
    body: data.slice(1),
  });

  doc.save(`${filename}.pdf`);
}
