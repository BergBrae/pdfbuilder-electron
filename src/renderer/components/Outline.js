import React from 'react';

export default function Outline({ report }) {
  const convertToOutlineData = (report) => {
    return {
      bookmarkName: report.bookmark_name,
      type: report.type,
      children: report.children?.map((child) => {
        return convertToOutlineData(child);
      }),
    };
  };
  const outlineData = convertToOutlineData(report);

  const convertToOutlineElement = (outlineData, depth = 1) => {
    return (
      <div>
        {outlineData.bookmarkName}
        {outlineData.children?.map((child) => {
          return (
            <div>
              <div style={{ marginLeft: `${20 * depth}px` }} />{' '}
              {convertToOutlineElement(child, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };
  const outlineElement = convertToOutlineElement(outlineData);

  return (
    <div>
      <h1>Outline</h1>
      {/* <pre>{JSON.stringify(outlineData, null, 2)}</pre> */}
      {outlineElement}
    </div>
  );
}
