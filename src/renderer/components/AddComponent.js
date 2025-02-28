// AddComponent.js
import React, { useState } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useReport } from '../contexts/ReportContext';
import { v4 as uuidv4 } from 'uuid';

export default function AddComponent({ path, index }) {
  const { dispatch } = useReport();
  const [isHovered, setIsHovered] = useState(false);

  const labelToType = {
    'Docx Template': 'DocxTemplate',
    'PDF Type': 'FileType',
    Section: 'Section',
  };

  const createNewComponent = (type) => {
    const baseComponent = {
      id: uuidv4(),
      type: type,
      variables: [],
      variables_in_doc: [],
      base_directory: '',
      children: [],
    };

    switch (type) {
      case 'DocxTemplate':
        return {
          ...baseComponent,
          docx_path: '',
          will_have_page_numbers: false,
          bookmark_name: '',
          exists: false,
        };
      case 'FileType':
        return {
          ...baseComponent,
          directory_source: './',
          filename_text_to_match: '',
          will_have_page_numbers: true,
          bookmark_name: '',
          files: [],
          exists: false,
        };
      case 'Section':
        return {
          ...baseComponent,
          bookmark_name: '',
        };
      default:
        return baseComponent;
    }
  };

  const handleAdd = (type) => () => {
    const newComponent = createNewComponent(labelToType[type]);
    const insertPath = path || [];
    dispatch({
      type: 'ADD_CHILD',
      payload: {
        path: insertPath,
        index: typeof index === 'number' ? index : undefined,
        child: newComponent,
      },
    });
  };

  return (
    <div
      className={`add-component-wrapper ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="add-component-buttons">
        {['Docx Template', 'PDF Type', 'Section'].map((type) => (
          <Button
            key={type}
            className="add-component-btn"
            variant="secondary"
            size="sm"
            onClick={handleAdd(type)}
          >
            Add {type}
          </Button>
        ))}
      </div>
    </div>
  );
}
