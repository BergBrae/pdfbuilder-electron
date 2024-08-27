// DocxTemplate.js
import React, { useState } from 'react';
import BookmarkIcon from './BookmarkIcon';
import { FaFileWord } from 'react-icons/fa6';
import { FaCheck } from 'react-icons/fa';
import { Row, Col, Form, Card, Container, Button } from 'react-bootstrap';
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
}) {
  const [docxPath, setDocxPath] = useState(docxTemplate.docx_path);

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

  return (
    <Card
      className={
        docxTemplate.exists
          ? 'docx-template file-found'
          : 'docx-template file-not-found'
      }
    >
      <Card.Header>
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
          <Form.Check
            type="switch"
            id="page-numbers-switch"
            label="Add Page Numbers"
            checked={docxTemplate.will_have_page_numbers}
            onChange={() =>
              onTemplateChange({
                ...docxTemplate,
                will_have_page_numbers: !docxTemplate.will_have_page_numbers,
              })
            }
          />
        </Container>
      </Card.Header>
      <Card.Body>
        {docxTemplate.table_entries?.map((tableEntry, index) => (
          <p key={index}>{tableEntry}</p>
        ))}
      </Card.Body>
    </Card>
  );
}

export default DocxTemplate;
