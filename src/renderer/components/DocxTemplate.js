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
  const [tableEntries, setTableEntries] = useState(docxTemplate.table_entries);

  useEffect(() => {
    setDocxPath(docxTemplate.docx_path);
    setTableEntries(docxTemplate.table_entries);
  }, [docxTemplate]);

  const getTableOptions = (section, depth = 0, ignoreThisLevel = false) => {
    const spacer = '    ';
    const depthSpaces = spacer.repeat(depth);
    let bookmarkName = section.bookmark_name
      ? section.bookmark_name
      : '(No bookmark name)';
    bookmarkName = `${depthSpaces}${bookmarkName}`;
    let tableOptions = []; // {value: _, label: _}
    if (!ignoreThisLevel) {
      tableOptions.push({ value: section.id, label: bookmarkName });
    }

    for (const child of section.children) {
      if (child.type === 'Section') {
        // Increase depth when calling recursively
        tableOptions = tableOptions.concat(
          getTableOptions(child, depth + 1 - ignoreThisLevel),
        );
      } else {
        let childBookmarkName = child.bookmark_name
          ? child.bookmark_name
          : '(No bookmark name)';
        childBookmarkName = `${spacer.repeat(
          depth + 1 - ignoreThisLevel,
        )}${childBookmarkName}`;
        tableOptions.push({ value: child.id, label: childBookmarkName });
      }
    }

    return tableOptions;
  };

  const tableOptions = getTableOptions(report, 0, true);

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
    handleAPIUpdate(
      `http://localhost:8000/docxtemplate?parent_directory_source=${parentDirectorySource}`,
      { ...docxTemplate, page_start_col: newPageStartCol - 1 }, // Backend is 0-indexed. User Interface is 1-indexed.
      (data) => {
        onTemplateChange(data);
      },
      (error) => console.log(error),
    );
  };

  const handlePageEndColChange = (event) => {
    const newPageEndCol =
      event.target.value === '' ? null : parseInt(event.target.value, 10) || 0;
    onTemplateChange({
      ...docxTemplate,
      page_end_col: newPageEndCol - 1, // Backend is 0-indexed. User Interface is 1-indexed.
    });
  };

  const handleTableEntryChange = (index, selectedOption) => {
    const newTableEntries = [...tableEntries];
    newTableEntries[index][1] = selectedOption.value;
    setTableEntries(newTableEntries);

    // Update the docxTemplate with the new table entries
    onTemplateChange({
      ...docxTemplate,
      table_entries: newTableEntries,
    });
  };

  const hasTable = !!tableEntries;
  const hasTableEntries = tableEntries ? !!tableEntries[0]?.length : false;

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
        <Container className="table-container">
          <Form.Check
            type="switch"
            id="page-numbers-switch"
            label="Add Page Numbers"
            checked={false} // docxTemplate.will_have_page_numbers
            disabled
            onChange={() =>
              onTemplateChange({
                ...docxTemplate,
                will_have_page_numbers: !docxTemplate.will_have_page_numbers,
              })
            }
          />

        </Container>
          {hasTable && (
            <>
              <Form.Group as={Row} className="mb-3 mt-3">
                <Form.Label column sm="4">
                  Page Start Column:
                </Form.Label>
                <Col sm="8">
                  <Form.Control
                    type="number"
                    style={{ maxWidth: '300px' }}
                    value={docxTemplate.page_start_col + 1 || ''} // Backend is 0-indexed. User Interface is 1-indexed.
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
                    value={docxTemplate.page_end_col + 1 || ''} // Backend is 0-indexed. User Interface is 1-indexed.
                    onChange={handlePageEndColChange}
                    placeholder="Enter end column (or leave blank)"
                  />
                </Col>
              </Form.Group>
              {hasTableEntries && (
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Table Entry</th>
                      <th>Corresponding File/Section</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableEntries?.map((tableEntry, index) => (
                      <tr key={index}>
                        <td>{tableEntry[0]}</td>
                        <td>
                          <Select
                            options={tableOptions}
                            value={tableOptions.find(
                              (option) => option.value === tableEntry[1],
                            )}
                            onChange={(selectedOption) =>
                              handleTableEntryChange(index, selectedOption)
                            }
                            formatOptionLabel={(option) => (
                              <div style={{ whiteSpace: 'pre-wrap' }}>
                                {option.label}
                              </div>
                            )}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </>
          )}
      </div>
    </CustomAccordion>
  );
}

export default DocxTemplate;
