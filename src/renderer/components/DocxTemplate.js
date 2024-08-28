import React, { useState } from 'react';
import BookmarkIcon from './BookmarkIcon';
import { FaFileWord } from 'react-icons/fa6';
import { FaCheck } from 'react-icons/fa';
import {
  Row,
  Col,
  Form,
  Accordion,
  Container,
  Button,
  Table,
} from 'react-bootstrap';
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

  const getTableOptions = (section, depth = 0) => {
    const depthSpaces = '  '.repeat(depth);
    let bookmarkName = section.bookmark_name
      ? section.bookmark_name
      : '(No bookmark name)';
    bookmarkName = `${depthSpaces}${bookmarkName}`;
    let tableOptions = []; // {value: _, label: _}
    tableOptions.push({ value: section.id, label: bookmarkName });

    for (const child of section.children) {
      if (child.type === 'Section') {
        // Increase depth when calling recursively
        tableOptions = tableOptions.concat(getTableOptions(child, depth + 1));
      } else {
        let childBookmarkName = child.bookmark_name
          ? child.bookmark_name
          : '(No bookmark name)';
        childBookmarkName = `${'   '.repeat(depth + 1)}${childBookmarkName}`;
        tableOptions.push({ value: child.id, label: childBookmarkName });
      }
    }

    return tableOptions;
  };

  console.log('report: ', JSON.stringify(report));
  console.log('Table Options: ', getTableOptions(report));

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

  return (
    <Accordion
      className={
        docxTemplate.exists
          ? 'docx-template file-found'
          : 'docx-template file-not-found'
      }
    >
      <Accordion.Header>
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
      </Accordion.Header>
      <Accordion.Body>
        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="4">
            Page Start Column:
          </Form.Label>
          <Col sm="8">
            <Form.Control
              type="number"
              style={{ maxWidth: '300px' }}
              value={docxTemplate.page_start_col || ''}
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
              value={docxTemplate.page_end_col || ''}
              onChange={handlePageEndColChange}
              placeholder="Enter end column (or leave blank)"
            />
          </Col>
        </Form.Group>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Table Entry</th>
              <th>Corresponding File/Section</th>
            </tr>
          </thead>
          <tbody>
            {docxTemplate.table_entries?.map((tableEntry, index) => (
              <tr key={index}>
                <td>{tableEntry[0]}</td>
                <td>{tableEntry[1]}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        {/* {JSON.stringify(docxTemplate)} */}
      </Accordion.Body>
    </Accordion>
  );
}

export default DocxTemplate;
