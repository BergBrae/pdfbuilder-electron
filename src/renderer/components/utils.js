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
  const newReport = {
    ...report,
    needs_update: true,
    children: report.children.map((child) => {
      if (child.type === 'Section') {
        return setFlags(child);
      } else {
        return {
          ...child,
          needs_update: true,
          exists: false,
          files: child.files ? [] : undefined,
        };
      }
    }),
  };
  return newReport;
};
