// utils.js

export const handleAPIUpdate = async (url, data, onSuccess, onError) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const result = await response.json();
      if (onSuccess) onSuccess(result);
      else return result;
    } else {
      if (onError) onError(response.statusText);
      else console.error(response.statusText);
    }
  } catch (error) {
    console.error(error);
    if (onError) onError(error);
  }
};

export const setFlags = (report) => {
  // Tested working
  const newReport = { ...report, needs_update: true };
  for (let i = 0; i < newReport.children.length; i++) {
    newReport.children[i].needs_update = true;
    if (newReport.children[i].files) {
      newReport.children[i].files = [];
    }
    if (newReport.children[i].type === 'Section') {
      newReport.children[i] = setFlags(newReport.children[i]);
    } else {
      newReport.children[i].exists = false;
    }
  }
  return newReport;
};
