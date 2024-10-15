import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import BookmarkIcon from './BookmarkIcon';
import { FaFileWord } from 'react-icons/fa6';
import { FaCheck } from 'react-icons/fa';
import { Row, Col, Form, Container, Button, Table } from 'react-bootstrap';
import CustomAccordion from './CustomAccordion';
import { handleAPIUpdate } from './utils';

const docxIcon = (
  <span className="docx-icon content-align-center mt-2 mb-2">
    <FaFileWord className="m-2" />
    <span className="">Docx Template</span>
  </span>
);

function DocxTemplate({
  docxTemplate,
  onTemplateChange,
  onDelete,
  parentDirectorySource,
  report,
}) {
  const [docxPath, setDocxPath] = useState(docxTemplate.docx_path);

  useEffect(() => {
    setDocxPath(docxTemplate.docx_path);
  }, [docxTemplate]);

  const handleBookmarkChange = (newBookmarkName) => {
    onTemplateChange({
      ...docxTemplate,
      bookmark_name: newBookmarkName || null,
    });
  };

  const handleDelete = () => {
    onDelete(docxTemplate.id);
  };

  const handleDocxPathChange = (event) => {
    const newDocxPath = event.target.value;
    setDocxPath(newDocxPath);

    handleAPIUpdate(
      `http://localhost:8000/docxtemplate?parent_directory_source=${parentDirectorySource}`,
      { ...docxTemplate, docx_path: newDocxPath },
      (data) => {
        onTemplateChange(data);
      },
      (error) => console.log(error),
    );
  };

  const handlePageStartColChange = (event) => {
    const newPageStartCol = parseInt(event.target.value, 10) || 0;
    onTemplateChange({
      ...docxTemplate,
      page_start_col: newPageStartCol,
    });
  };

  const handlePageEndColChange = (event) => {
    const newPageEndCol =
      event.target.value === '' ? null : parseInt(event.target.value, 10) || 0;
    onTemplateChange({
      ...docxTemplate,
      page_end_col: newPageEndCol,
    });
  };

  const handleTableOfContentsToggle = () => {
    onTemplateChange({
      ...docxTemplate,
      is_table_of_contents: !docxTemplate.is_table_of_contents,
    });
  };

  const handlePageNumberOffsetChange = (event) => {
    const newPageNumberOffset =
      event.target.value === '' ? null : parseInt(event.target.value, 10) || 0;
    onTemplateChange({
      ...docxTemplate,
      page_number_offset: newPageNumberOffset,
    });
  };

  return (
    <CustomAccordion
      className={
        docxTemplate.exists
          ? 'docx-template file-found'
          : 'docx-template file-not-found'
      }
      eventKey={docxTemplate.id}
    >
      <div>
        <Container>
          <div className="d-flex justify-content-between">
            <BookmarkIcon
              isBookmarked={!!docxTemplate.bookmark_name}
              bookmarkName={docxTemplate.bookmark_name}
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
          <div className="d-flex justify-content-between">
            {docxIcon}
            <Form.Control
              className="m-2"
              type="text"
              value={docxPath}
              onChange={handleDocxPathChange}
              placeholder="Enter docx path"
            />
            <div className="m-2 align-items-center justify-content-center">
              <p>{docxTemplate.exists ? <FaCheck /> : 'Does not exist'}</p>
            </div>
          </div>
        </Container>
      </div>
      <div>
        <Container className="table-container p-3">
          <Form.Check
            type="switch"
            id="page-numbers-switch"
            label="Add Page Numbers"
            checked={docxTemplate.will_have_page_numbers}
            disabled
            onChange={() =>
              onTemplateChange({
                ...docxTemplate,
                will_have_page_numbers: !docxTemplate.will_have_page_numbers,
              })
            }
          />
          <Form.Check
            type="switch"
            id="table-of-contents-switch"
            label="Has Table of Contents"
            checked={docxTemplate.is_table_of_contents}
            onChange={handleTableOfContentsToggle}
          />
          {docxTemplate.is_table_of_contents && (
            <Form.Group as={Row} className="mb-3 mt-1 form-group">
              <Form.Label column sm="4">
                Page Number Offset:
              </Form.Label>
              <Col sm="8">
                <Form.Control
                  type="number"
                  style={{ maxWidth: '300px' }}
                  value={docxTemplate.page_number_offset || ''}
                  onChange={handlePageNumberOffsetChange}
                  placeholder="Enter page number offset"
                />
              </Col>
            </Form.Group>
          )}
          {docxTemplate.is_table_of_contents && (
            <Form.Group as={Row} className="mb-3 mt-1 form-group">
              <Form.Label column sm="4">
                Page Start Column:
              </Form.Label>
              <Col sm="8">
                <Form.Control
                  type="number"
                  style={{ maxWidth: '300px' }}
                  value={docxTemplate.page_start_col || ''} // Backend is 0-indexed. User Interface is 1-indexed.
                  onChange={handlePageStartColChange}
                  placeholder="Enter start column"
                />
              </Col>
            </Form.Group>
          )}
          {docxTemplate.is_table_of_contents && (
            <Form.Group as={Row} className="mb-3 mt-1 form-group">
              <Form.Label column sm="4">
                Page End Column:
              </Form.Label>
              <Col sm="8">
                <Form.Control
                  type="number"
                  style={{ maxWidth: '300px' }}
                  value={docxTemplate.page_end_col || ''} // Backend is 0-indexed. User Interface is 1-indexed.
                  onChange={handlePageEndColChange}
                  placeholder="Enter end column (or leave blank)"
                />
              </Col>
            </Form.Group>
          )}
        </Container>
      </div>
    </CustomAccordion>
  );
}

export default DocxTemplate;
