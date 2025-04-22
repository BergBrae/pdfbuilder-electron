// FileData.js
import React from 'react';
import { Form } from 'react-bootstrap';
import BookmarkIcon from './BookmarkIcon';
import { FaFilePdf, FaFileWord } from 'react-icons/fa';
const path = require('path');

export default function FileData({
  fileData,
  index,
  onChange,
  directorySource,
}) {
  const { file_path, num_pages } = fileData;
  // Extract the filename without extension
  const fileName = path.basename(file_path, path.extname(file_path));
  const isDocx = file_path.toLowerCase().endsWith('.docx');

  const handleBookmarkChange = (newBookmarkName) => {
    onChange({ ...fileData, bookmark_name: newBookmarkName || null });
  };

  const handleFileClick = async () => {
    try {
      // Resolve the full path by combining the directory source with the relative file path
      const fullPath = await window.electron.resolvePath({
        base: directorySource,
        relative: file_path,
      });

      // Open the file with the system's default application
      window.electron.openFile(fullPath);
    } catch (error) {
      console.error('Error opening file:', error);
    }
  };

  return (
    <tr>
      <td>{index + 1}</td>
      <td
        onClick={handleFileClick}
        style={{ cursor: 'pointer' }}
        title={`Click to open ${file_path}`}
      >
        <span className="d-flex align-items-center">
          {isDocx ? (
            <FaFileWord size={18} className="me-2 text-primary" />
          ) : (
            <FaFilePdf size={18} className="me-2 text-danger" />
          )}
          {fileName}
        </span>
      </td>
      <td>
        {!isDocx ? (
          <>
            {num_pages}
            {num_pages > 1 ? ' Pages' : ' Page'}
          </>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      <td>
        <BookmarkIcon
          isBookmarked={!!fileData.bookmark_name}
          bookmarkName={fileData.bookmark_name}
          onBookmarkChange={handleBookmarkChange}
        />
      </td>
    </tr>
  );
}
