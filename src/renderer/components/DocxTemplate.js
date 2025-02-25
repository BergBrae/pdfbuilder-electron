import React, { useEffect, useState, useRef } from 'react';
import Select from 'react-select';
import BookmarkIcon from './BookmarkIcon';
import { FaFileWord } from 'react-icons/fa6';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { Row, Col, Form, Container, Button, Spinner } from 'react-bootstrap';
import CustomAccordion from './CustomAccordion';
import { handleAPIUpdate } from './utils';
import { useLoading } from '../contexts/LoadingContext';
import { useReport } from '../contexts/ReportContext';
import { v4 as uuidv4 } from 'uuid';

const docxIcon = (
  <span className="docx-icon">
    <span className="docx-icon-content">
      <FaFileWord size={25} className="ms-2" />
      Docx Template
    </span>
  </span>
);

function DocxTemplate({ template: docxTemplate, parentDirectory }) {
  const { state, dispatch } = useReport();
  const { incrementLoading, decrementLoading } = useLoading();
  const [docxPath, setDocxPath] = useState(docxTemplate.docx_path);
  const latestInputValueRef = useRef(docxTemplate.docx_path);
  const [fileExists, setFileExists] = useState(docxTemplate.exists || false);
  const [isCheckingPath, setIsCheckingPath] = useState(false);
  const [bookmarkName, setBookmarkName] = useState(
    docxTemplate.bookmark_name || '',
  );

  // Log the current bookmark name for debugging
  useEffect(() => {
    setBookmarkName(docxTemplate.bookmark_name || '');
  }, [docxTemplate.bookmark_name]);

  useEffect(() => {
    setDocxPath(docxTemplate.docx_path);
    latestInputValueRef.current = docxTemplate.docx_path;
    setFileExists(docxTemplate.exists || false);
    setBookmarkName(docxTemplate.bookmark_name || '');
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

  const findParentSection = (
    templatePath,
    currentSection = state.report,
    currentPath = [],
  ) => {
    for (let i = 0; i < currentSection.children.length; i++) {
      const child = currentSection.children[i];
      if (child.id === docxTemplate.id) {
        return { section: currentSection, path: currentPath };
      }
    }

    for (let i = 0; i < currentSection.children.length; i++) {
      const child = currentSection.children[i];
      if (child.type === 'Section') {
        const result = findParentSection(templatePath, child, [
          ...currentPath,
          i,
        ]);
        if (result) return result;
      }
    }

    return null;
  };

  const getUpdatedVariables = (section, variablesInDoc) => {
    // If variablesInDoc is empty or undefined, we may need to remove variables
    // that came from this template
    if (!variablesInDoc || variablesInDoc.length === 0) {
      // Get variables from all other DocxTemplate children in this section
      const otherTemplateVariables = [];

      // Collect variables from all other docx templates in this section
      for (const child of section.children) {
        if (
          child.type === 'DocxTemplate' &&
          child.id !== docxTemplate.id &&
          child.variables_in_doc &&
          child.variables_in_doc.length > 0
        ) {
          otherTemplateVariables.push(...child.variables_in_doc);
        }
      }

      // Keep variables that are in other templates or manually added variables
      // that don't match any template
      return section.variables.filter((variable) => {
        return (
          otherTemplateVariables.includes(variable.template_text) ||
          !docxTemplate.variables_in_doc?.includes(variable.template_text)
        );
      });
    }

    // Store the existing variables for reference
    const existingVariables = [...section.variables];
    const existingVariableMap = {};

    // Create a map of existing variables by template_text for quick lookup
    existingVariables.forEach((variable) => {
      existingVariableMap[variable.template_text] = variable;
    });

    // Create the updated variables array
    const updatedVariables = [];

    // First, add all variables that aren't from this template
    section.variables.forEach((variable) => {
      if (!variablesInDoc.includes(variable.template_text)) {
        updatedVariables.push(variable);
      }
    });

    // Then add all variables from this template, preserving existing ones
    variablesInDoc.forEach((templateText) => {
      if (existingVariableMap[templateText]) {
        // If the variable already exists, preserve it with its ID and values
        updatedVariables.push(existingVariableMap[templateText]);
      } else {
        // If it's a new variable, create a new one
        updatedVariables.push({
          template_text: templateText,
          is_constant: true,
          constant_value: '',
          id: uuidv4(),
        });
      }
    });

    return updatedVariables;
  };

  const updateTemplateInState = (updatedTemplate) => {
    const path = findDocxTemplatePath(docxTemplate);
    if (!path) return;

    // Get the parent section's path
    const parentPath = path.slice(0, -1);
    const childIndex = path[path.length - 1];

    // Get the parent section from the state
    let parentSection = state.report;
    if (parentPath.length > 0) {
      let currentSection = state.report;
      for (const index of parentPath) {
        currentSection = currentSection.children[index];
      }
      parentSection = currentSection;
    }

    // Create a new children array with the updated template
    const updatedChildren = [...parentSection.children];
    updatedChildren[childIndex] = updatedTemplate;

    // Update the variables in the parent section based on the new template state
    const updatedVariables = getUpdatedVariables(
      parentSection,
      updatedTemplate.variables_in_doc || [], // Ensure we pass an empty array if variables_in_doc is undefined
    );

    // Create the updated section with both new children and variables
    const updatedSection = {
      ...parentSection,
      children: updatedChildren,
      variables: updatedVariables,
    };

    // Update the parent section
    dispatch({
      type: 'UPDATE_SECTION',
      payload: {
        path: parentPath,
        section: updatedSection,
      },
    });
  };

  const handleBookmarkChange = (newBookmarkName) => {
    // Update local state immediately
    setBookmarkName(newBookmarkName || '');

    // Ensure we update our local knowledge of the bookmark name
    const updatedTemplate = {
      ...docxTemplate,
      bookmark_name: newBookmarkName || null,
    };

    // Update the template in the global state
    updateTemplateInState(updatedTemplate);
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
    // Update the ref with the latest value
    latestInputValueRef.current = newDocxPath;

    // Immediately set to loading status
    setIsCheckingPath(true);

    const requestPathValue = newDocxPath; // Capture the value at this point in time

    // Store the original path for comparison
    const originalPath = docxTemplate.docx_path;
    const isRestoringPath = originalPath === requestPathValue;

    // Immediately update the template with the new path, marking it as checking
    updateTemplateInState({
      ...docxTemplate,
      docx_path: requestPathValue,
      checking: true,
    });

    // Store this timeoutId so we can cancel it if needed
    const timeoutId = setTimeout(async () => {
      try {
        incrementLoading();
        const updatedTemplate = await handleAPIUpdate(
          `http://localhost:8000/docxtemplate?parent_directory_source=${parentDirectory}`,
          { ...docxTemplate, docx_path: requestPathValue },
          null,
          (error) => {
            // On error, mark as not found
            if (requestPathValue === latestInputValueRef.current) {
              setFileExists(false);
              setIsCheckingPath(false);

              // Update the global state to reflect that the file doesn't exist
              updateTemplateInState({
                ...docxTemplate,
                docx_path: requestPathValue,
                exists: false,
                variables_in_doc: [], // Clear variables when file doesn't exist
                checking: false,
              });

              // If we're not restoring to the original path, we need to mark as unsaved
              if (!isRestoringPath) {
                dispatch({ type: 'SET_SAVED', payload: true });
              }
            }
          },
        );

        if (updatedTemplate) {
          // Only update if the input hasn't changed since we started this request
          if (requestPathValue === latestInputValueRef.current) {
            // Immediately update local state to show correct exists status
            setFileExists(updatedTemplate.exists || false);
            setIsCheckingPath(false);

            // Update the global state with the updated template
            // This will include the correct variables_in_doc from the API
            updateTemplateInState({
              ...updatedTemplate,
              checking: false,
            });

            // If we're restoring to the original path, we should check if we need to mark as saved
            if (isRestoringPath && updatedTemplate.exists) {
              // We need to wait for the state to update before checking
              setTimeout(() => {
                // Check if the reports are now equal after the update
                if (areReportsEqual(state.report, state.originalReport)) {
                  dispatch({ type: 'SET_SAVED', payload: false });
                }
              }, 0);
            }
          }
        } else {
          // If API call fails, revert to the original path value in the template
          // Only do this if the current input value still matches what we sent to the API
          if (requestPathValue === latestInputValueRef.current) {
            setDocxPath(docxTemplate.docx_path);
            latestInputValueRef.current = docxTemplate.docx_path;
            setFileExists(docxTemplate.exists || false);
            setIsCheckingPath(false);

            // Update the template to show it as not found
            updateTemplateInState({
              ...docxTemplate,
              exists: false,
              variables_in_doc: [], // Clear variables when file doesn't exist
              checking: false,
            });
          }
        }
      } finally {
        decrementLoading();
        // Ensure we always clear the checking state
        if (requestPathValue === latestInputValueRef.current) {
          setIsCheckingPath(false);
        }
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      // If unmounting while checking, clear the state
      setIsCheckingPath(false);
    };
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

  // Status display logic
  const renderStatus = () => {
    if (isCheckingPath) {
      return (
        <span className="text-secondary">
          Checking <Spinner animation="border" size="sm" />
        </span>
      );
    } else if (fileExists) {
      return (
        <span className="text-success">
          Found <FaCheck />
        </span>
      );
    } else {
      return (
        <span className="text-danger">
          Not Found <FaTimes />
        </span>
      );
    }
  };

  return (
    <CustomAccordion
      defaultExpanded={false}
      header={
        <div style={{ flex: 'initial', width: '100%' }}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex align-items-center">
              <BookmarkIcon
                isBookmarked={!!bookmarkName}
                bookmarkName={bookmarkName}
                onBookmarkChange={handleBookmarkChange}
                includeIcon={true}
              />
            </div>
            <div className="d-flex align-items-center">
              <span className="me-3">{renderStatus()}</span>
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
            {docxIcon}
            <Form.Control
              className="ms-3"
              type="text"
              value={docxPath}
              onChange={handleDocxPathChange}
              placeholder="Enter docx path"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      }
    >
      <Container>
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
