import React, { useState, useRef } from 'react';
import { Button, Modal } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { MdOutlineToc } from 'react-icons/md';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

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
        <span
          className={`${item.totalFiles > 0 ? 'text-success' : 'text-danger'} ms-2`}
        >
          {item.totalFiles > 0
            ? `(${item.totalFiles} ${item.totalFiles === 1 ? 'file' : 'files'} found)`
            : '(No files found)'}
        </span>
      </div>
      {item.children?.map((child, childIndex) => (
        <OutlineItem
          key={child.bookmarkName}
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

    // Recursively count files in children
    if (report.children) {
      for (const child of report.children) {
        total += calculateTotalFiles(child);
      }
    }

    return total;
  };

  const convertToOutlineData = (report) => {
    let exists = report.exists
      ? report.exists
      : report.files && report.files.length > 0;
    if (report.children) {
      for (const child of report.children) {
        if (child.exists || (child.files && child.files.length > 0)) {
          exists = true;
        }
      }
    }

    const totalFiles = calculateTotalFiles(report);

    return {
      bookmarkName: report.bookmark_name
        ? report.bookmark_name
        : '(No bookmark name)',
      type: report.type,
      exists: exists,
      totalFiles: totalFiles,
      children: report.children?.map((child) => {
        return convertToOutlineData(child);
      }),
    };
  };

  const outlineData = convertToOutlineData(report);

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
          <DndProvider backend={HTML5Backend}>
            <div
              className={`outline-item ${outlineData.exists ? 'green' : 'red'}`}
            >
              <div className="d-flex justify-content-between align-items-center">
                <span>{outlineData.bookmarkName}</span>
                <span
                  className={`${outlineData.totalFiles > 0 ? 'text-success' : 'text-danger'} ms-2`}
                >
                  {outlineData.totalFiles > 0
                    ? `(${outlineData.totalFiles} ${outlineData.totalFiles === 1 ? 'file' : 'files'} found)`
                    : '(No files found)'}
                </span>
              </div>
              <div style={{ marginLeft: '10px' }}>
                {outlineData.children?.map((child, index) => (
                  <OutlineItem
                    key={child.bookmarkName}
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
