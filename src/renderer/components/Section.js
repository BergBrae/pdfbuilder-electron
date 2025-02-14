import React, { useEffect } from 'react';
import DocxTemplate from './DocxTemplate';
import FileType from './FileType';
import TemplateVariable from './TemplateVariable';
import BookmarkIcon from './BookmarkIcon';
import AddComponent from './AddComponent';
import { Row, Col, Container, Accordion, Button } from 'react-bootstrap';
import CustomAccordion from './CustomAccordion';
import { v4 as uuidv4 } from 'uuid';
import { handleAPIUpdate, setFlags } from './utils';
import { useLoading } from '../contexts/LoadingContext';
import { useReport } from '../contexts/ReportContext';
import path from 'path';

function Section({ section, isRoot = false, parentDirectory }) {
  const { state, dispatch } = useReport();
  const { incrementLoading, decrementLoading } = useLoading();

  const directorySource = parentDirectory
    ? path.join(parentDirectory, section.base_directory)
    : section.base_directory;

  const calculateTotalFiles = (section) => {
    let total = 0;
    for (const child of section.children) {
      if (child.type === 'FileType') {
        total += child.files.length;
      } else if (child.type === 'Section') {
        total += calculateTotalFiles(child);
      }
    }
    return total;
  };

  const totalFiles = calculateTotalFiles(section);

  const getUpdatedVariables = (section) => {
    const currentTemplateTexts = section.variables.map(
      (variable) => variable.template_text,
    );
    const updatedVariables = [];

    for (const child of section.children) {
      if (child.variables_in_doc) {
        for (const templateText of child.variables_in_doc) {
          if (
            !currentTemplateTexts.includes(templateText) &&
            !updatedVariables
              .map((variable) => variable.template_text)
              .includes(templateText)
          ) {
            // Then it is a new variable
            updatedVariables.push({
              template_text: templateText,
              is_constant: true,
              constant_value: '',
              id: uuidv4(),
            });
          } else if (
            !updatedVariables
              .map((variable) => variable.template_text)
              .includes(templateText)
          ) {
            // existing variable
            updatedVariables.push(
              section.variables.find(
                (variable) => variable.template_text === templateText,
              ),
            );
          }
        }
      }
    }
    return updatedVariables;
  };

  const findSectionPath = (
    targetSection,
    currentSection = state.report,
    currentPath = [],
  ) => {
    if (currentSection.id === targetSection.id) {
      return currentPath;
    }

    for (let i = 0; i < currentSection.children.length; i++) {
      const child = currentSection.children[i];
      if (child.type === 'Section') {
        const path = findSectionPath(targetSection, child, [...currentPath, i]);
        if (path) return path;
      }
    }

    return null;
  };

  const handleChildChange = (index, newChild) => {
    const path = findSectionPath(section);
    if (!path) return;

    const updatedChildren = section.children.map((child, i) =>
      i === index ? newChild : child,
    );
    const updatedVariables = getUpdatedVariables({
      ...section,
      children: updatedChildren,
    });

    dispatch({
      type: 'UPDATE_SECTION',
      payload: {
        path,
        section: {
          ...section,
          children: updatedChildren,
          variables: updatedVariables,
        },
      },
    });
  };

  const handleVariableChange = (index, newVariable) => {
    const path = findSectionPath(section);
    if (!path) return;

    const updatedVariables = section.variables.map((variable, i) =>
      i === index ? newVariable : variable,
    );

    dispatch({
      type: 'UPDATE_SECTION',
      payload: {
        path,
        section: { ...section, variables: updatedVariables },
      },
    });
  };

  const handleBaseDirectoryChange = async (currentDirectory) => {
    const path = findSectionPath(section);
    if (!path) return;

    const newPath = await window.electron.directoryDialog(
      parentDirectory || currentDirectory || section.base_directory,
      isRoot,
    );

    if (newPath) {
      const updatedSection = setFlags(section);
      dispatch({
        type: 'UPDATE_SECTION',
        payload: {
          path,
          section: { ...updatedSection, base_directory: newPath },
        },
      });
    }
  };

  const handleBookmarkChange = (newBookmarkName) => {
    const path = findSectionPath(section);
    if (!path) return;

    dispatch({
      type: 'UPDATE_SECTION',
      payload: {
        path,
        section: { ...section, bookmark_name: newBookmarkName || null },
      },
    });
  };

  const handleAddChild = (index, type) => {
    const path = findSectionPath(section);
    if (!path) return;

    let newChild = null;

    switch (type) {
      case 'DocxTemplate':
        newChild = {
          type: 'DocxTemplate',
          id: uuidv4(),
          docx_path: '',
          will_have_page_numbers: false,
          variables_in_doc: [],
          bookmark_name: '',
        };
        break;
      case 'FileType':
        newChild = {
          type: 'FileType',
          id: uuidv4(),
          directory_source: './',
          filename_text_to_match: '',
          will_have_page_numbers: true,
          bookmark_name: '',
          files: [],
        };
        break;
      case 'Section':
        newChild = {
          type: 'Section',
          id: uuidv4(),
          base_directory: './',
          variables: [],
          children: [],
        };
        break;
      default:
        return;
    }

    const updatedChildren = [
      ...section.children.slice(0, index),
      newChild,
      ...section.children.slice(index),
    ];

    dispatch({
      type: 'UPDATE_SECTION',
      payload: {
        path,
        section: { ...section, children: updatedChildren },
      },
    });
  };

  const handleDelete = (id) => {
    const path = findSectionPath(section);
    if (!path) return;

    if (id) {
      // Deleting a child component
      const updatedChildren = section.children.filter(
        (child) => child.id !== id,
      );
      const updatedVariables = [];
      for (const child of updatedChildren) {
        if (child.variables_in_doc) {
          updatedVariables.push(
            ...child.variables_in_doc.map((variable) => ({
              template_text: variable,
              is_constant: true,
              constant_value: '',
            })),
          );
        }
      }

      dispatch({
        type: 'UPDATE_SECTION',
        payload: {
          path,
          section: {
            ...section,
            children: updatedChildren,
            variables: updatedVariables,
          },
        },
      });
    } else {
      // Deleting the section itself
      dispatch({
        type: 'DELETE_CHILD',
        payload: {
          path,
        },
      });
    }
  };

  const handleVariablesUpdate = (variables) => {
    const path = findSectionPath(section);
    if (!path) return;

    const updatedVariables = variables.map((variable) => ({
      template_text: variable,
      is_constant: true,
      constant_value: '',
    }));

    dispatch({
      type: 'UPDATE_SECTION',
      payload: {
        path,
        section: { ...section, variables: updatedVariables },
      },
    });
  };

  const updateChildWithAPI = async (child, directorySource) => {
    if (child.needs_update && child.type !== 'Section') {
      const updatedChild = await handleAPIUpdate(
        `http://localhost:8000/${child.type.toLowerCase()}?parent_directory_source=${directorySource}`,
        child,
        null,
        console.log,
      );
      return updatedChild;
    } else {
      return child;
    }
  };

  const updateChildrenWithAPI = async (section, directorySource) => {
    const updatedChildren = await Promise.all(
      section.children.map(async (child) => {
        if (child.type === 'Section') {
          const updatedChild = await updateChildrenWithAPI(
            child,
            path.join(directorySource, child.base_directory),
          );
          return { ...child, children: updatedChild.children };
        } else {
          return updateChildWithAPI(child, directorySource);
        }
      }),
    );
    return { ...section, children: updatedChildren };
  };

  useEffect(() => {
    if (section.needs_update) {
      const updateSection = async () => {
        const path = findSectionPath(section);
        if (!path) return;

        try {
          incrementLoading();
          const updatedSection = await updateChildrenWithAPI(
            section,
            directorySource,
          );
          updatedSection.variables = getUpdatedVariables(updatedSection);
          updatedSection.needs_update = false;

          dispatch({
            type: 'UPDATE_SECTION',
            payload: {
              path,
              section: updatedSection,
            },
          });
        } catch (error) {
          console.error('Error updating section:', error);
        } finally {
          decrementLoading();
        }
      };
      updateSection();
    }
  }, [section.needs_update]);

  return (
    <CustomAccordion
      defaultExpanded={isRoot}
      className={`section ${isRoot ? 'root-section' : ''}`}
      eventKey={section.id}
      header={
        <div style={{ flex: 'initial', width: '100%' }}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex align-items-center flex-grow-1">
              <BookmarkIcon
                isBookmarked={!!section.bookmark_name}
                bookmarkName={section.bookmark_name}
                onBookmarkChange={handleBookmarkChange}
              />
              <span
                className={`ms-2 ${totalFiles > 0 ? 'text-success' : 'text-danger'}`}
              >
                {totalFiles > 0
                  ? ` (${totalFiles} ${totalFiles === 1 ? 'file' : 'files'} found)`
                  : ' (No files found in this section)'}
              </span>
            </div>
            {!isRoot && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="ms-auto"
              >
                Delete
              </Button>
            )}
          </div>
          <div className="d-flex align-items-center">
            <small className="text-muted me-2">Base Directory:</small>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleBaseDirectoryChange(section.base_directory);
              }}
            >
              {section.base_directory || 'Select Directory'}
            </Button>
          </div>
        </div>
      }
    >
      {section.variables.length > 0 && (
        <div className="mb-4">
          <h6 className="mb-3 text-muted">Variables</h6>
          <Row>
            {section.variables.map((variable, index) => (
              <Col xl={3} key={variable.id || index}>
                <TemplateVariable
                  variable={variable}
                  onChange={(newVariable) =>
                    handleVariableChange(index, newVariable)
                  }
                />
              </Col>
            ))}
          </Row>
        </div>
      )}

      <div>
        {section.children.map((child, index) => (
          <React.Fragment key={child.id}>
            {index === 0 && (
              <AddComponent path={findSectionPath(section)} index={0} />
            )}
            <div className="component-wrapper">
              {(() => {
                switch (child.type) {
                  case 'DocxTemplate':
                    return (
                      <DocxTemplate
                        template={child}
                        onTemplateChange={(newTemplate) =>
                          handleChildChange(index, newTemplate)
                        }
                        onDelete={() => handleDelete(child.id)}
                        parentDirectory={directorySource}
                        onVariablesUpdate={handleVariablesUpdate}
                      />
                    );
                  case 'FileType':
                    return (
                      <FileType
                        fileType={child}
                        onFileChange={(newFileType) =>
                          handleChildChange(index, newFileType)
                        }
                        onDelete={() => handleDelete(child.id)}
                        parentDirectory={directorySource}
                      />
                    );
                  case 'Section':
                    return (
                      <Section
                        section={child}
                        parentDirectory={directorySource}
                      />
                    );
                  default:
                    return null;
                }
              })()}
            </div>
            <AddComponent path={findSectionPath(section)} index={index + 1} />
          </React.Fragment>
        ))}
        {section.children.length === 0 && (
          <AddComponent path={findSectionPath(section)} index={0} />
        )}
      </div>
    </CustomAccordion>
  );
}

export default Section;
