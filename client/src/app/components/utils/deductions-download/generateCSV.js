export function generateCSV(data, filename) {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      data.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  