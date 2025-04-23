import React, { useState, useRef } from 'react';
import { Button, Modal } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { MdOutlineToc } from 'react-icons/md';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FaCheck, FaTimes } from 'react-icons/fa';

const OutlineItem = ({ item, index, parentPath = [], moveItem, depth = 1 }) => {
  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'OUTLINE_ITEM',
    item: { index, parentPath },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'OUTLINE_ITEM',
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }

      const dragIndex = item.index;
      const hoverIndex = index;
      const dragParentPath = item.parentPath;
      const hoverParentPath = parentPath;

      // Don't replace items with themselves
      if (
        dragIndex === hoverIndex &&
        JSON.stringify(dragParentPath) === JSON.stringify(hoverParentPath)
      ) {
        return;
      }

      // Only move within the same parent
      if (JSON.stringify(dragParentPath) !== JSON.stringify(hoverParentPath)) {
        return;
      }

      moveItem(dragIndex, hoverIndex, parentPath);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  // Render the appropriate status based on item type and exists property
  const renderStatus = () => {
    if (item.type === 'DocxTemplate') {
      if (item.exists) {
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
    } else {
      // For other types (FileType, Section), show files count
      return (
        <span
          className={`${
            item.totalFiles > 0 ? 'text-success' : 'text-danger'
          } ms-2`}
        >
          {item.totalFiles > 0
            ? `(${item.totalFiles} ${
                item.totalFiles === 1 ? 'file' : 'files'
              } found)`
            : '(No files found)'}
        </span>
      );
    }
  };

  return (
    <div
      ref={ref}
      style={{
        marginLeft: `${10 * depth}px`,
      }}
      className={`outline-item ${item.exists ? 'green' : 'red'} ${
        isDragging ? 'dragging' : ''
      }`}
    >
      <div className="d-flex justify-content-between align-items-center">
        <span>{item.bookmarkName}</span>
        {renderStatus()}
      </div>
      {item.children?.map((child, childIndex) => (
        <OutlineItem
          key={child.id || `${child.type}-${childIndex}`}
          item={child}
          index={childIndex}
          parentPath={[...parentPath, index]}
          moveItem={moveItem}
          depth={depth + 1}
        />
      ))}
    </div>
  );
};

export default function Outline({ report, moveItem }) {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const calculateTotalFiles = (report) => {
    let total = 0;

    // Count files in FileType components
    if (report.type === 'FileType' && report.files) {
      total += report.files.length;
    }

    // Count DocxTemplate files that exist
    if (report.type === 'DocxTemplate' && report.exists === true) {
      total += 1;
    }

    // Recursively count files in children
    if (report.children) {
      for (const child of report.children) {
        total += calculateTotalFiles(child);
      }
    }

    return total;
  };

  const convertToOutlineData = (report) => {
    // Set exists property based on the item type
    let exists = false;

    if (report.type === 'DocxTemplate') {
      // For DocxTemplates, use the exists flag directly
      exists = report.exists || false;
    } else if (report.type === 'FileType') {
      // For FileTypes, check if files exist
      exists = report.files && report.files.length > 0;
    } else if (report.type === 'Section') {
      // For Sections, check if any children exist
      exists =
        report.children &&
        report.children.some((child) => {
          if (child.type === 'DocxTemplate') {
            return child.exists;
          } else if (child.type === 'FileType') {
            return child.files && child.files.length > 0;
          } else if (child.type === 'Section') {
            // Recursive check for nested sections
            const childData = convertToOutlineData(child);
            return childData.exists;
          }
          return false;
        });
    }

    const totalFiles = calculateTotalFiles(report);

    return {
      bookmarkName: report.bookmark_name
        ? report.bookmark_name
        : '(No bookmark name)',
      type: report.type,
      exists: exists,
      totalFiles: totalFiles,
      id: report.id, // Include the ID for unique keys
      children: report.children?.map((child) => {
        return convertToOutlineData(child);
      }),
    };
  };

  const outlineData = convertToOutlineData(report);

  // Root level status renderer
  const renderRootStatus = () => {
    return (
      <span
        className={`${
          outlineData.totalFiles > 0 ? 'text-success' : 'text-danger'
        } ms-2`}
      >
        {outlineData.totalFiles > 0
          ? `(${outlineData.totalFiles} ${
              outlineData.totalFiles === 1 ? 'file' : 'files'
            } found)`
          : '(No files found)'}
      </span>
    );
  };

  return (
    <>
      <Button variant="primary" onClick={handleShow}>
        <MdOutlineToc /> Outline
      </Button>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Outline</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small">Drag to reorder</p>
          <DndProvider backend={HTML5Backend}>
            <div
              className={`outline-item ${outlineData.exists ? 'green' : 'red'}`}
            >
              <div className="d-flex justify-content-between align-items-center">
                <span>{outlineData.bookmarkName}</span>
                {renderRootStatus()}
              </div>
              <div style={{ marginLeft: '10px' }}>
                {outlineData.children?.map((child, index) => (
                  <OutlineItem
                    key={child.id || `${child.type}-${index}`}
                    item={child}
                    index={index}
                    parentPath={[]}
                    moveItem={moveItem}
                    depth={1}
                  />
                ))}
              </div>
            </div>
          </DndProvider>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
