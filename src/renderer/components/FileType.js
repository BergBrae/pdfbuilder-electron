// FileType.js
import React, { useState, useEffect } from 'react';
import BookmarkIcon from './BookmarkIcon';
import BookmarkRules from './BookmarkRules';
import { FaFilePdf } from 'react-icons/fa';
import { Form, Container, Button, Row, Table } from 'react-bootstrap';
import CustomAccordion from './CustomAccordion';
import FileData from './FileData';
import { handleAPIUpdate } from './utils';
import { useLoading } from '../contexts/LoadingContext';
const path = require('path');

const FileIcon = (
  <span className="pdf-icon">
    <span className="pdf-icon-content">
      <FaFilePdf size={25} className="me-2" />
      PDF File
    </span>
  </span>
);

function FileType({ file, onFileChange, onDelete, parentDirectorySource }) {
  const { incrementLoading, decrementLoading } = useLoading();
  const [directorySource, setDirectorySource] = useState(file.directory_source);
  const [filenameText, setFilenameText] = useState(file.filename_text_to_match);
  const [reorderPagesMetals, setReorderPagesMetals] = useState(
    file.reorder_pages_metals,
  );
  const [reorderPagesDatetime, setReorderPagesDatetime] = useState(
    file.reorder_pages_datetime,
  );
  const [keepExistingBookmarks, setKeepExistingBookmarks] = useState(
    file.keep_existing_bookmarks || true,
  );

  const handleDirectoryChange = (e) => {
    const newDirectorySource = e.target.value;
    setDirectorySource(newDirectorySource);

    const timeoutId = setTimeout(async () => {
      try {
        incrementLoading();
        const updatedFile = await updateFile({
          ...file,
          directory_source: newDirectorySource,
          filename_text_to_match: filenameText,
          reorder_pages_metals: reorderPagesMetals,
          reorder_pages_datetime: reorderPagesDatetime,
        });
        if (updatedFile) {
          onFileChange(updatedFile);
        }
      } finally {
        decrementLoading();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleFilenameChange = (e) => {
    const newFilenameText = e.target.value;
    setFilenameText(newFilenameText);

    const timeoutId = setTimeout(async () => {
      try {
        incrementLoading();
        const updatedFile = await updateFile({
          ...file,
          directory_source: directorySource,
          filename_text_to_match: newFilenameText,
          reorder_pages_metals: reorderPagesMetals,
          reorder_pages_datetime: reorderPagesDatetime,
        });
        if (updatedFile) {
          onFileChange(updatedFile);
        }
      } finally {
        decrementLoading();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleBookmarkChange = (newBookmarkName) => {
    updateFile({ ...file, bookmark_name: newBookmarkName || null });
    onFileChange({ ...file, bookmark_name: newBookmarkName || null });
  };

  const handleDelete = () => {
    onDelete(file.id);
  };

  const handleFileDataChange = (updatedFileData) => {
    const updatedFiles = file.files.map((fileData) =>
      fileData.id === updatedFileData.id ? updatedFileData : fileData,
    );
    onFileChange({ ...file, files: updatedFiles });
  };

  const handleBookmarkFilesWithFilename = () => {
    const updatedFiles = file.files.map((fileData) => ({
      ...fileData,
      bookmark_name: path
        .basename(fileData.file_path)
        .replace(/\.pdf$/i, '')
        .replace(/[-_.]/g, ' '),
    }));
    onFileChange({ ...file, files: updatedFiles });
  };

  const handleReorderPagesMetalsChange = () => {
    const newReorderPagesMetals = !reorderPagesMetals;
    setReorderPagesMetals(newReorderPagesMetals);

    if (newReorderPagesMetals) {
      setReorderPagesDatetime(false);
      setKeepExistingBookmarks(false);
    }

    onFileChange({
      ...file,
      reorder_pages_metals: newReorderPagesMetals,
      reorder_pages_datetime: false,
      keep_existing_bookmarks: false,
    });
  };

  const handleReorderPagesDatetimeChange = () => {
    const newReorderPagesDatetime = !reorderPagesDatetime;
    setReorderPagesDatetime(newReorderPagesDatetime);

    if (newReorderPagesDatetime) {
      setReorderPagesMetals(false);
      setKeepExistingBookmarks(false);
    }

    onFileChange({
      ...file,
      reorder_pages_metals: false,
      reorder_pages_datetime: newReorderPagesDatetime,
      keep_existing_bookmarks: keepExistingBookmarks,
    });
  };

  const handleKeepExistingBookmarksChange = () => {
    const newKeepExistingBookmarks = !keepExistingBookmarks;
    setKeepExistingBookmarks(newKeepExistingBookmarks);

    onFileChange({
      ...file,
      keep_existing_bookmarks: newKeepExistingBookmarks,
    });
  };

  const updateFile = async (updatedFile) => {
    return handleAPIUpdate(
      `http://localhost:8000/filetype?parent_directory_source=${parentDirectorySource}`,
      updatedFile,
      null,
      (error) =>
        console.error('Failed to update file type with the API', error),
    );
  };

  return (
    <CustomAccordion
      className={file.files.length ? 'file-found' : 'file-not-found'}
      eventKey={file.id}
    >
      <div>
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <BookmarkIcon
              isBookmarked={!!file.bookmark_name}
              bookmarkName={file.bookmark_name}
              onBookmarkChange={handleBookmarkChange}
            />
            <span
              className={`${
                file.files.length > 0 ? 'text-success' : 'text-danger'
              }`}
            >
              {file.files.length > 0
                ? `(${file.files.length} files found)`
                : '(No files found)'}
            </span>
            <Button
              className="x"
              variant="danger"
              size="sm"
              onClick={handleDelete}
            >
              X
            </Button>
          </div>
          <div className="d-flex align-items-center">
            {FileIcon}
            <span className="ms-3">
              A PDF in{' '}
              <input
                className="narrow-input"
                value={directorySource}
                onChange={handleDirectoryChange}
              />{' '}
              containing{' '}
              <input
                className="wide-input"
                value={filenameText}
                onChange={handleFilenameChange}
              />{' '}
              in the filename.
            </span>
          </div>
        </Container>
      </div>
      <div>
        <Container className="table-container">
          <Table className="custom-table">
            <tbody>
              <tr>
                <td className="left-align">
                  <BookmarkRules fileType={file} onChange={onFileChange} />
                </td>
                <td className="left-align">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mb-2"
                    onClick={handleBookmarkFilesWithFilename}
                    disabled={reorderPagesMetals || reorderPagesDatetime}
                  >
                    Bookmark Files with Filenames
                  </Button>
                </td>
              </tr>
              <tr>
                <td className="left-align">
                  <Form.Check
                    inline
                    type="switch"
                    id="reorder-pages-metals-switch"
                    label="Reorder Pages (Metals)"
                    checked={reorderPagesMetals}
                    onChange={handleReorderPagesMetalsChange}
                    disabled={reorderPagesDatetime || keepExistingBookmarks}
                  />
                </td>
                <td className="left-align">
                  <Form.Check
                    inline
                    type="switch"
                    id="reorder-pages-datetime-switch"
                    label="Reorder Pages (IC Datetime)"
                    checked={reorderPagesDatetime}
                    onChange={handleReorderPagesDatetimeChange}
                    disabled={reorderPagesMetals || keepExistingBookmarks}
                  />
                </td>
              </tr>
              <tr>
                <td className="left-align">
                  <Form.Check
                    inline
                    type="switch"
                    id="keep-existing-bookmarks-switch"
                    label="Keep Existing Bookmarks"
                    checked={keepExistingBookmarks}
                    onChange={handleKeepExistingBookmarksChange}
                    disabled={reorderPagesDatetime || reorderPagesMetals}
                  />
                </td>
              </tr>
            </tbody>
          </Table>
        </Container>
        {file.files.length > 0 && (
          <Row>
            {file.files.map((fileData) => (
              <FileData
                key={fileData.id}
                fileData={fileData}
                onFileDataChange={handleFileDataChange}
                showBookmark={!reorderPagesMetals && !reorderPagesDatetime}
              />
            ))}
          </Row>
        )}
        <small className="text-muted">Double click on a file to open</small>
      </div>
    </CustomAccordion>
  );
}

export default FileType;
