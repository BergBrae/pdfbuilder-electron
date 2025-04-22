// AddComponent.js
import React, { useState } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useReport } from '../contexts/ReportContext';
import { v4 as uuidv4 } from 'uuid';

export default function AddComponent({ path, index }) {
  const { dispatch } = useReport();
  const [isHovered, setIsHovered] = useState(false);

  const labelToType = {
    'File Type': 'FileType',
    Section: 'Section',
  };

  const createNewComponent = (type) => {
    const baseComponent = {
      id: uuidv4(),
      type: type,
      base_directory: '',
      children: [],
    };

    switch (type) {
      case 'FileType':
        return {
          ...baseComponent,
          directory_source: './',
          filename_text_to_match: '',
          will_have_page_numbers: true,
          bookmark_name: '',
          files: [],
          variables_in_doc: [],
        };
      case 'Section':
        return {
          ...baseComponent,
          bookmark_name: '',
          method_codes: [],
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
        {['File Type', 'Section'].map((type) => (
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
