import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import BookmarkIcon from './BookmarkIcon';
import { FaFileWord } from 'react-icons/fa6';
import { FaCheck } from 'react-icons/fa';
import { Row, Col, Form, Container, Button } from 'react-bootstrap';
import CustomAccordion from './CustomAccordion';
import { handleAPIUpdate } from './utils';
import { useLoading } from '../contexts/LoadingContext';
import { useReport } from '../contexts/ReportContext';

const docxIcon = (
  <span className="docx-icon content-align-center mt-2 mb-2">
    <FaFileWord className="m-2" />
    <span className="">Docx Template</span>
  </span>
);

function DocxTemplate({ template: docxTemplate, parentDirectory }) {
  const { state, dispatch } = useReport();
  const { incrementLoading, decrementLoading } = useLoading();
  const [docxPath, setDocxPath] = useState(docxTemplate.docx_path);

  useEffect(() => {
    setDocxPath(docxTemplate.docx_path);
  }, [docxTemplate]);

  const findDocxTemplatePath = (
    targetTemplate,
    currentSection = state.report,
    currentPath = [],
  ) => {
    for (let i = 0; i < currentSection.children.length; i++) {
      const child = currentSection.children[i];
      if (child.id === targetTemplate.id) {
        return [...currentPath, i];
      }
      if (child.type === 'Section') {
        const path = findDocxTemplatePath(targetTemplate, child, [
          ...currentPath,
          i,
        ]);
        if (path) return path;
      }
    }
    return null;
  };

  const updateTemplateInState = (updatedTemplate) => {
    const path = findDocxTemplatePath(docxTemplate);
    if (!path) return;

    dispatch({
      type: 'UPDATE_SECTION',
      payload: {
        path: path.slice(0, -1),
        section: {
          ...state.report,
          children: state.report.children.map((child, index) =>
            index === path[path.length - 1] ? updatedTemplate : child,
          ),
        },
      },
    });
  };

  const handleBookmarkChange = (newBookmarkName) => {
    updateTemplateInState({
      ...docxTemplate,
      bookmark_name: newBookmarkName || null,
    });
  };

  const handleDelete = () => {
    const path = findDocxTemplatePath(docxTemplate);
    if (!path) return;

    dispatch({
      type: 'DELETE_CHILD',
      payload: { path },
    });
  };

  const handleDocxPathChange = async (event) => {
    const newDocxPath = event.target.value;
    setDocxPath(newDocxPath);

    // Debounce the API call
    const timeoutId = setTimeout(async () => {
      try {
        incrementLoading();
        const updatedTemplate = await handleAPIUpdate(
          `http://localhost:8000/docxtemplate?parent_directory_source=${parentDirectory}`,
          { ...docxTemplate, docx_path: newDocxPath },
          null,
          (error) => console.log(error),
        );
        if (updatedTemplate) {
          updateTemplateInState(updatedTemplate);
        }
      } finally {
        decrementLoading();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  };

  const handlePageStartColChange = (event) => {
    const newPageStartCol = parseInt(event.target.value, 10) || 0;
    updateTemplateInState({
      ...docxTemplate,
      page_start_col: newPageStartCol,
    });
  };

  const handlePageEndColChange = (event) => {
    const newPageEndCol =
      event.target.value === '' ? null : parseInt(event.target.value, 10) || 0;
    updateTemplateInState({
      ...docxTemplate,
      page_end_col: newPageEndCol,
    });
  };

  const handleTableOfContentsToggle = () => {
    updateTemplateInState({
      ...docxTemplate,
      is_table_of_contents: !docxTemplate.is_table_of_contents,
    });
  };

  const handlePageNumberOffsetChange = (event) => {
    const newPageNumberOffset =
      event.target.value === '' ? null : parseInt(event.target.value, 10) || 0;
    updateTemplateInState({
      ...docxTemplate,
      page_number_offset: newPageNumberOffset,
    });
  };

  return (
    <CustomAccordion
      defaultExpanded={false}
      header={
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <BookmarkIcon
              bookmark_name={docxTemplate.bookmark_name}
              onBookmarkChange={handleBookmarkChange}
            />
            <span className="ms-2">
              {docxTemplate.bookmark_name || 'Docx Template'}{' '}
              {docxTemplate.exists ? (
                <FaCheck className="text-success" />
              ) : (
                <span className="text-danger">(Not Found)</span>
              )}
            </span>
          </div>
          <Button variant="outline-danger" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      }
    >
      <Container>
        <div className="d-flex align-items-center mb-3">
          {docxIcon}
          <Form.Control
            className="ms-3"
            type="text"
            value={docxPath}
            onChange={handleDocxPathChange}
            placeholder="Enter docx path"
          />
        </div>

        <Form>
          <Form.Check
            type="switch"
            id="page-numbers-switch"
            label="Add Page Numbers"
            checked={docxTemplate.will_have_page_numbers}
            disabled
            onChange={() =>
              updateTemplateInState({
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
            <>
              <Form.Group as={Row} className="mb-3 mt-3">
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

              <Form.Group as={Row} className="mb-3">
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
            </>
          )}
        </Form>
      </Container>
    </CustomAccordion>
  );
}

export default DocxTemplate;
