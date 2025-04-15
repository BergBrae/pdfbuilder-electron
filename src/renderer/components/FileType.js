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
import { useReport } from '../contexts/ReportContext';
const path = require('path');

const FileIcon = (
  <span className="pdf-icon">
    <span className="pdf-icon-content">
      <FaFilePdf size={25} className="me-2" />
      PDF File
    </span>
  </span>
);

function FileType({ fileType: file, parentDirectory }) {
  const { state, dispatch } = useReport();
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
    file.keep_existing_bookmarks !== undefined
      ? file.keep_existing_bookmarks
      : true,
  );

  const findFileTypePath = (
    targetFile,
    currentSection = state.report,
    currentPath = [],
  ) => {
    for (let i = 0; i < currentSection.children.length; i++) {
      const child = currentSection.children[i];
      if (child.id === targetFile.id) {
        return [...currentPath, i];
      }
      if (child.type === 'Section') {
        const path = findFileTypePath(targetFile, child, [...currentPath, i]);
        if (path) return path;
      }
    }
    return null;
  };

  const updateFileInState = (updatedFile) => {
    const path = findFileTypePath(file);
    if (!path) return;

    // Navigate to the parent section to get its children
    let currentLevel = state.report;
    for (let i = 0; i < path.length - 1; i++) {
      currentLevel = currentLevel.children[path[i]];
    }

    const lastIndex = path[path.length - 1];
    dispatch({
      type: 'UPDATE_SECTION',
      payload: {
        path: path.slice(0, -1),
        section: {
          children: currentLevel.children.map((child, index) =>
            index === lastIndex ? updatedFile : child,
          ),
        },
      },
    });
  };

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
          updateFileInState(updatedFile);
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
          updateFileInState(updatedFile);
        }
      } finally {
        decrementLoading();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleBookmarkChange = (newBookmarkName) => {
    const updatedFile = { ...file, bookmark_name: newBookmarkName || null };
    updateFile(updatedFile);
    updateFileInState(updatedFile);
  };

  const handleDelete = () => {
    const path = findFileTypePath(file);
    if (!path) return;

    dispatch({
      type: 'DELETE_CHILD',
      payload: { path },
    });
  };

  const handleFileDataChange = (updatedFileData) => {
    const updatedFiles = file.files.map((fileData) =>
      fileData.id === updatedFileData.id ? updatedFileData : fileData,
    );
    updateFileInState({ ...file, files: updatedFiles });
  };

  const handleBookmarkFilesWithFilename = () => {
    const updatedFiles = file.files.map((fileData) => ({
      ...fileData,
      bookmark_name: path
        .basename(fileData.file_path)
        .replace(/\.pdf$/i, '')
        .replace(/[-_.]/g, ' '),
    }));
    updateFileInState({ ...file, files: updatedFiles });
  };

  const handleReorderPagesMetalsChange = () => {
    const newReorderPagesMetals = !reorderPagesMetals;
    setReorderPagesMetals(newReorderPagesMetals);

    if (newReorderPagesMetals) {
      setReorderPagesDatetime(false);
      setKeepExistingBookmarks(false);
    }

    updateFileInState({
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

    updateFileInState({
      ...file,
      reorder_pages_metals: false,
      reorder_pages_datetime: newReorderPagesDatetime,
      keep_existing_bookmarks: keepExistingBookmarks,
    });
  };

  const handleKeepExistingBookmarksChange = () => {
    const newKeepExistingBookmarks = !keepExistingBookmarks;
    setKeepExistingBookmarks(newKeepExistingBookmarks);

    updateFileInState({
      ...file,
      keep_existing_bookmarks: newKeepExistingBookmarks,
    });
  };

  const updateFile = async (updatedFile) => {
    return handleAPIUpdate(
      `http://localhost:8000/filetype?parent_directory_source=${parentDirectory}`,
      updatedFile,
      null,
      (error) =>
        console.error('Failed to update file type with the API', error),
    );
  };

  return (
    <CustomAccordion
      defaultExpanded={false}
      header={
        <div style={{ flex: 'initial', width: '100%' }}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex align-items-center">
              <BookmarkIcon
                isBookmarked={!!file.bookmark_name}
                bookmarkName={file.bookmark_name}
                onBookmarkChange={handleBookmarkChange}
              />
            </div>
            <div className="d-flex align-items-center">
              <span
                className={`me-3 ${
                  file.files.length > 0 ? 'text-success' : 'text-danger'
                }`}
              >
                {file.files.length > 0
                  ? `${file.files.length} ${
                      file.files.length === 1 ? 'file' : 'files'
                    } found`
                  : 'No files found'}
              </span>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
              >
                Delete
              </Button>
            </div>
          </div>
          <div className="d-flex align-items-center">
            {FileIcon}
            <div
              className="d-flex flex-wrap align-items-center ms-3"
              style={{ gap: '0.5rem' }}
            >
              A PDF in
              <Form.Control
                size="sm"
                style={{ width: '150px' }}
                value={directorySource}
                onChange={handleDirectoryChange}
                onClick={(e) => e.stopPropagation()}
              />
              containing
              <Form.Control
                size="sm"
                style={{ width: '250px' }}
                value={filenameText}
                onChange={handleFilenameChange}
                onClick={(e) => e.stopPropagation()}
              />
              in the filename.
            </div>
          </div>
        </div>
      }
    >
      <Container>
        <div className="d-flex align-items-start mb-3">
          <div>
            <div className="mb-3">
              <BookmarkRules fileType={file} onChange={updateFileInState} />
            </div>
            {/* <Button
              variant="secondary"
              size="sm"
              onClick={handleBookmarkFilesWithFilename}
              disabled={reorderPagesMetals || reorderPagesDatetime}
            >
              Bookmark Files with Filenames
            </Button> */}
          </div>

          <Form className="ms-3">
            <Form.Check
              type="switch"
              id="reorder-pages-metals-switch"
              label="Reorder Pages by Metal Content"
              checked={reorderPagesMetals}
              onChange={handleReorderPagesMetalsChange}
              className="mb-2"
            />
            <Form.Check
              type="switch"
              id="reorder-pages-datetime-switch"
              label="Reorder Pages by Date/Time"
              checked={reorderPagesDatetime}
              onChange={handleReorderPagesDatetimeChange}
              className="mb-2"
            />
            <Form.Check
              type="switch"
              id="keep-existing-bookmarks-switch"
              label="Keep Existing Bookmarks"
              checked={keepExistingBookmarks}
              onChange={handleKeepExistingBookmarksChange}
              className="mb-2"
              disabled={reorderPagesMetals || reorderPagesDatetime}
            />
          </Form>
        </div>

        {file.files.length > 0 && (
          <div className="mt-3">
            <h6>Found Files:</h6>
            <div className="file-data-container">
              {file.files.map((fileData, index) => (
                <FileData
                  key={fileData.id || index}
                  fileData={fileData}
                  onFileDataChange={handleFileDataChange}
                  showBookmark={true}
                />
              ))}
            </div>
          </div>
        )}
      </Container>
    </CustomAccordion>
  );
}

export default FileType;
