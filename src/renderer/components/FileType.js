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
  <span className="pdf-icon align-content-center">
    <FaFilePdf className="mb-2 ms-1 mt-1" />
    <span className="m-2">PDF File</span>
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
        .basename(fileData.file_path.replaceAll('\\', '/'))
        .replaceAll('.pdf', '')
        .replaceAll('.PDF', '')
        .replaceAll('-', ' ')
        .replaceAll('.', ' ')
        .replaceAll('_', ' '),
    }));
    onFileChange({ ...file, files: updatedFiles });
  };

  const handleReorderPagesMetalsChange = () => {
    const newReorderPagesMetals = !reorderPagesMetals;
    setReorderPagesMetals(newReorderPagesMetals);

    if (newReorderPagesMetals) {
      setReorderPagesDatetime(false);
    }

    onFileChange({
      ...file,
      reorder_pages_metals: newReorderPagesMetals,
      reorder_pages_datetime: false,
    });
  };

  const handleReorderPagesDatetimeChange = () => {
    const newReorderPagesDatetime = !reorderPagesDatetime;
    setReorderPagesDatetime(newReorderPagesDatetime);

    if (newReorderPagesDatetime) {
      setReorderPagesMetals(false);
    }

    onFileChange({
      ...file,
      reorder_pages_metals: false,
      reorder_pages_datetime: newReorderPagesDatetime,
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
          <div className="d-flex justify-content-between">
            <BookmarkIcon
              isBookmarked={!!file.bookmark_name}
              bookmarkName={file.bookmark_name}
              onBookmarkChange={handleBookmarkChange}
            />
            <Button
              className="x"
              variant="danger"
              size="sm"
              onClick={handleDelete}
            >
              X
            </Button>
          </div>
          <br />
          {FileIcon}
          <span className="ms-5">
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
        </Container>
      </div>
      <div>
        <Container className="table-container">
          <Table className="custom-table">
            <tbody>
              <tr>
                <td className="left-align">
                  <Form.Check
                    inline
                    type="switch"
                    id="page-numbers-switch"
                    label="Add Page Numbers"
                    checked={false} // file.will_have_page_numbers
                    disabled
                    onChange={() =>
                      updateFile({
                        ...file,
                        will_have_page_numbers: !file.will_have_page_numbers,
                      })
                    }
                  />
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
                    disabled={reorderPagesDatetime}
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
                    disabled={reorderPagesMetals}
                  />
                </td>
              </tr>
              <tr>
                <td className="left-align" colSpan="2">
                  <BookmarkRules fileType={file} onChange={onFileChange} />
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
      </div>
    </CustomAccordion>
  );
}

export default FileType;
