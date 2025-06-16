export function exportData () {
  const data = localStorage.getItem('smokeEvents');
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'smoke-history.json';
  link.click();
  URL.revokeObjectURL(url);
}

export function importDataFromFile (file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject('No file selected');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        localStorage.setItem('smokeEvents', JSON.stringify(json));
        resolve(true);
      } catch (err) {
        reject('Invalid JSON file');
      }
    };
    reader.onerror = () => reject('File reading error');
    reader.readAsText(file);
  });
}
