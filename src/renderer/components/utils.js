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

// Compare two reports while ignoring fields that are changed by setFlags
export const areReportsEqual = (reportA, reportB) => {
  if (!reportA || !reportB) return false;

  // Create clean versions of the reports without the fields that change during refresh
  const cleanReportA = cleanReport(reportA);
  const cleanReportB = cleanReport(reportB);

  // Convert to strings for comparison
  const strA = JSON.stringify(cleanReportA);
  const strB = JSON.stringify(cleanReportB);

  // Compare the cleaned reports
  return strA === strB;
};

// Remove fields that are changed by setFlags from a report
const cleanReport = (report) => {
  if (!report) return null;

  // Create a copy without the fields that change during refresh
  const { needs_update, ...cleanedReport } = report;

  // Normalize variables by removing IDs (which change when variables are recreated)
  if (cleanedReport.variables && Array.isArray(cleanedReport.variables)) {
    cleanedReport.variables = cleanedReport.variables.map((variable) => {
      // Create a copy without the id field
      const { id, ...cleanedVariable } = variable;
      return cleanedVariable;
    });
  }

  // Clean the children recursively
  if (cleanedReport.children && Array.isArray(cleanedReport.children)) {
    cleanedReport.children = cleanedReport.children.map((child) => {
      if (child.type === 'Section') {
        return cleanReport(child);
      } else if (child.type === 'DocxTemplate') {
        // For DocxTemplate, we need to normalize the object for comparison
        // Remove all technical fields that can change during refresh or API calls
        const {
          needs_update,
          exists,
          variables_in_doc,
          checking,
          ...cleanedChild
        } = child;

        // Return a clean version of the DocxTemplate
        return cleanedChild;
      } else if (child.type === 'FileType') {
        // For FileType, remove files array and other technical fields
        const { needs_update, exists, files, ...cleanedChild } = child;
        return cleanedChild;
      } else {
        // For other non-section children, remove standard fields
        const { needs_update, exists, ...cleanedChild } = child;
        return cleanedChild;
      }
    });
  }

  return cleanedReport;
};
