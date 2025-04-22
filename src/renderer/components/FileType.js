// FileType.js
import React, { useState, useEffect } from 'react';
import BookmarkIcon from './BookmarkIcon';
import BookmarkRules from './BookmarkRules';
import { FaFilePdf, FaFileWord } from 'react-icons/fa';
import { Form, Container, Button, Row, Col, Table } from 'react-bootstrap';
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
      <FaFileWord size={25} className="me-2" />
      Document Files
    </span>
  </span>
);

function FileType({ fileType: file, parentDirectory }) {
  const { state, dispatch } = useReport();
  const { incrementLoading, decrementLoading } = useLoading();
  const [directorySource, setDirectorySource] = useState(file.directory_source);
  const [filenameText, setFilenameText] = useState(file.filename_text_to_match);

  // DocxTemplate-like fields
  const [isTableOfContents, setIsTableOfContents] = useState(
    file.is_table_of_contents || false,
  );
  const [pageNumberOffset, setPageNumberOffset] = useState(
    file.page_number_offset || 0,
  );
  const [pageStartCol, setPageStartCol] = useState(file.page_start_col || 3);
  const [pageEndCol, setPageEndCol] = useState(file.page_end_col || null);

  // Original FileType fields
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

  // Helper function to determine if a file is a DOCX
  const isDocxFile = (filePath) => {
    return filePath.toLowerCase().endsWith('.docx');
  };

  // Helper to check if this is a former DocxTemplate
  const isFormerDocxTemplate = () => {
    return file.docx_path !== undefined || getDocxCount() > 0;
  };

  // Count different file types
  const getPdfCount = () =>
    file.files.filter((f) => !isDocxFile(f.file_path)).length;
  const getDocxCount = () =>
    file.files.filter((f) => isDocxFile(f.file_path)).length;

  // Generate status text
  const getStatusText = () => {
    if (file.files.length === 0) return 'No files found';

    const pdfCount = getPdfCount();
    const docxCount = getDocxCount();

    const parts = [];
    if (pdfCount > 0) {
      parts.push(`${pdfCount} PDF${pdfCount !== 1 ? 's' : ''}`);
    }
    if (docxCount > 0) {
      parts.push(`${docxCount} DOCX${docxCount !== 1 ? 's' : ''}`);
    }

    return parts.join(' and ');
  };

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
        .replace(/\.(pdf|docx)$/i, '')
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

  // DocxTemplate-like handlers
  const handleTableOfContentsToggle = () => {
    const newIsTableOfContents = !isTableOfContents;
    setIsTableOfContents(newIsTableOfContents);

    updateFileInState({
      ...file,
      is_table_of_contents: newIsTableOfContents,
    });
  };

  const handlePageNumberOffsetChange = (e) => {
    const newOffset =
      e.target.value === '' ? null : parseInt(e.target.value, 10) || 0;
    setPageNumberOffset(newOffset);

    updateFileInState({
      ...file,
      page_number_offset: newOffset,
    });
  };

  const handlePageStartColChange = (e) => {
    const newStartCol = parseInt(e.target.value, 10) || 0;
    setPageStartCol(newStartCol);

    updateFileInState({
      ...file,
      page_start_col: newStartCol,
    });
  };

  const handlePageEndColChange = (e) => {
    const newEndCol =
      e.target.value === '' ? null : parseInt(e.target.value, 10) || 0;
    setPageEndCol(newEndCol);

    updateFileInState({
      ...file,
      page_end_col: newEndCol,
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
                includeIcon={false}
              />
            </div>
            <div className="d-flex align-items-center">
              <span
                className={`me-3 ${
                  file.files.length > 0 ? 'text-success' : 'text-danger'
                }`}
              >
                {getStatusText()}
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
            <Form.Control
              className="ms-3"
              type="text"
              value={filenameText}
              onChange={handleFilenameChange}
              placeholder="Text to match in filename"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      }
    >
      <Container>
        {/* {isFormerDocxTemplate() && (
          <>
            <Row className="mb-3">
              <Col sm={6}>
                <Form.Check
                  type="switch"
                  id="table-of-contents-switch"
                  label="Has Table of Contents"
                  checked={isTableOfContents}
                  onChange={handleTableOfContentsToggle}
                />
              </Col>
            </Row>

            {isTableOfContents && (
              <>
                <Form.Group as={Row} className="mb-3">
                  <Form.Label column sm="4">
                    Page Start Column:
                  </Form.Label>
                  <Col sm="8">
                    <Form.Control
                      type="number"
                      style={{ maxWidth: '300px' }}
                      value={pageStartCol || ''}
                      onChange={handlePageStartColChange}
                      placeholder="Enter start column"
                    />
                  </Col>
                </Form.Group>

                <Form.Group as={Row} className="mb-3">
                  <Form.Label column sm="4">
                    Page End Column:
                  </Form.Label>
                  <Col sm="8">
                    <Form.Control
                      type="number"
                      style={{ maxWidth: '300px' }}
                      value={pageEndCol || ''}
                      onChange={handlePageEndColChange}
                      placeholder="Enter end column (or leave blank)"
                    />
                  </Col>
                </Form.Group>

                <Form.Group as={Row} className="mb-3">
                  <Form.Label column sm="4">
                    Page Number Offset:
                  </Form.Label>
                  <Col sm="8">
                    <Form.Control
                      type="number"
                      style={{ maxWidth: '300px' }}
                      value={pageNumberOffset || ''}
                      onChange={handlePageNumberOffsetChange}
                      placeholder="Enter page number offset"
                    />
                  </Col>
                </Form.Group>
              </>
            )} */}

        <Row className="mb-3">
          <Col sm={6} md={4}>
            <Form.Check
              type="switch"
              id="reorder-metals-switch"
              label="Reorder Pages by Metals"
              checked={reorderPagesMetals}
              onChange={handleReorderPagesMetalsChange}
              disabled={reorderPagesDatetime}
            />
          </Col>
          <Col sm={6} md={4}>
            <Form.Check
              type="switch"
              id="reorder-datetime-switch"
              label="Reorder Pages by Date/Time"
              checked={reorderPagesDatetime}
              onChange={handleReorderPagesDatetimeChange}
              disabled={reorderPagesMetals}
            />
          </Col>
          <Col sm={6} md={4}>
            <Form.Check
              type="switch"
              id="keep-bookmarks-switch"
              label="Keep Existing Bookmarks"
              checked={keepExistingBookmarks}
              onChange={handleKeepExistingBookmarksChange}
              disabled={reorderPagesMetals || reorderPagesDatetime}
            />
          </Col>
        </Row>

        <BookmarkRules
          fileType={file}
          onUpdate={(updatedRules) =>
            updateFileInState({ ...file, bookmark_rules: updatedRules })
          }
        />

        {file.files.length > 0 && (
          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5>Files</h5>
            </div>

            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>
                      Filename{' '}
                      <span
                        className="text-muted"
                        style={{ fontSize: '0.8em' }}
                      >
                        (Click to open)
                      </span>
                    </th>
                    <th>Pages</th>
                    <th>Bookmark</th>
                  </tr>
                </thead>
                <tbody>
                  {file.files.map((fileData, index) => (
                    <FileData
                      key={fileData.id}
                      fileData={fileData}
                      index={index}
                      onChange={handleFileDataChange}
                      directorySource={path.join(
                        parentDirectory,
                        directorySource,
                      )}
                    />
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        )}
      </Container>
    </CustomAccordion>
  );
}

export default FileType;
