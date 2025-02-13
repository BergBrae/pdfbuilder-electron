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
import path from 'path';

function Section({
  section,
  isRoot = false,
  onSectionChange,
  onDelete,
  parentDirectory,
  report,
}) {
  const { incrementLoading, decrementLoading } = useLoading();

  const directorySource = parentDirectory
    ? path.join(parentDirectory, section.base_directory)
    : section.base_directory;

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

  const handleChildChange = (index, newChild) => {
    const updatedChildren = section.children.map((child, i) =>
      i === index ? newChild : child,
    );
    const updatedVariables = getUpdatedVariables({
      ...section,
      children: updatedChildren,
    });
    onSectionChange({
      ...section,
      children: updatedChildren,
      variables: updatedVariables,
    });
  };

  const handleVariableChange = (index, newVariable) => {
    const updatedVariables = section.variables.map((variable, i) =>
      i === index ? newVariable : variable,
    );
    onSectionChange({ ...section, variables: updatedVariables });
  };

  const handleBaseDirectoryChange = async (currentDirectory) => {
    const relativePath = await window.electron.directoryDialog(
      currentDirectory || section.base_directory,
    );
    let pathToBaseDirectory = null;
    if (!currentDirectory) {
      // relativePath is relative to section.base_directory
      pathToBaseDirectory = await window.electron.resolvePath({
        base: section.base_directory,
        relative: relativePath,
      });
    } else {
      pathToBaseDirectory = relativePath;
    }
    if (pathToBaseDirectory) {
      section = setFlags(section);
      onSectionChange({ ...section, base_directory: pathToBaseDirectory });
    }
  };

  const handleBookmarkChange = (newBookmarkName) => {
    onSectionChange({ ...section, bookmark_name: newBookmarkName || null });
  };

  const handleAddChild = (index, type) => {
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
    onSectionChange({ ...section, children: updatedChildren });
  };

  const handleDelete = (id) => {
    const updatedChildren = section.children.filter((child) => child.id !== id);
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
    onSectionChange({
      ...section,
      children: updatedChildren,
      variables: updatedVariables,
    });
  };

  const handleVariablesUpdate = (variables) => {
    const updatedVariables = variables.map((variable) => ({
      template_text: variable,
      is_constant: true,
      constant_value: '',
    }));
    onSectionChange({ ...section, variables: updatedVariables });
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
        try {
          incrementLoading();
          const updatedSection = await updateChildrenWithAPI(
            section,
            directorySource,
          );
          updatedSection.variables = getUpdatedVariables(updatedSection);
          updatedSection.needs_update = false;
          onSectionChange(updatedSection);
        } catch (error) {
          console.error('Error updating section:', error);
        } finally {
          decrementLoading();
        }
      };

      updateSection();
    }
  }, [section.needs_update, directorySource]);

  return (
    <CustomAccordion
      className="section"
      defaultActiveKey={isRoot ? '0' : ''}
      eventKey={section.id}
    >
      <div className="section-header">
        <div className="header-top">
          <BookmarkIcon
            isBookmarked={!!section.bookmark_name}
            bookmarkName={section.bookmark_name}
            onBookmarkChange={handleBookmarkChange}
            includeIcon={!isRoot}
          />
          {!isRoot && (
            <Button
              className="x"
              variant="danger"
              size="sm"
              onClick={() => onDelete(section.id)}
            >
              X
            </Button>
          )}
        </div>
        <div className="base-directory">
          <p>Base Directory: {section.base_directory}</p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleBaseDirectoryChange(parentDirectory)}
          >
            Change Base Directory
          </Button>
        </div>
      </div>

      <div>
        {!!section.variables.length && (
          <Row>
            {section.variables.map((variable, index) => (
              <Col xl={3} key={variable.id}>
                <TemplateVariable
                  key={variable.id}
                  variable={variable}
                  onChange={(newVariable) =>
                    handleVariableChange(index, newVariable)
                  }
                />
              </Col>
            ))}
          </Row>
        )}
        {section.children.map((child, index) => (
          <Accordion key={child.id}>
            <div className="parent-element">
              <AddComponent onAdd={(type) => handleAddChild(index, type)} />
            </div>
            {(() => {
              switch (child.type) {
                case 'DocxTemplate':
                  return (
                    <DocxTemplate
                      key={child.id}
                      docxTemplate={child}
                      onTemplateChange={(newTemplate, variables) =>
                        handleChildChange(index, newTemplate, variables)
                      }
                      onDelete={handleDelete}
                      onVariablesUpdate={handleVariablesUpdate}
                      parentDirectorySource={directorySource}
                      report={report}
                    />
                  );
                case 'FileType':
                  return (
                    <FileType
                      key={child.id}
                      file={child}
                      onFileChange={(newFile) =>
                        handleChildChange(index, newFile)
                      }
                      onDelete={handleDelete}
                      parentDirectorySource={directorySource}
                    />
                  );
                case 'Section':
                  return (
                    <Section
                      key={child.id}
                      section={child}
                      isRoot={false}
                      onSectionChange={(newSection) =>
                        handleChildChange(index, newSection)
                      }
                      onDelete={handleDelete}
                      parentDirectory={directorySource}
                      report={report}
                    />
                  );
                default:
                  return <p key={index}>Nothing Here</p>;
              }
            })()}
          </Accordion>
        ))}
        <div className="parent-element">
          <AddComponent
            onAdd={(type) => handleAddChild(section.children.length, type)}
          />
        </div>
      </div>
    </CustomAccordion>
  );
}

export default Section;
