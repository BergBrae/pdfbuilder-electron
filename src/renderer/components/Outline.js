import React, { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Outline({ report }) {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const convertToOutlineData = (report) => {
    return {
      bookmarkName: report.bookmark_name,
      type: report.type,
      children: report.children?.map((child) => {
        return convertToOutlineData(child);
      }),
    };
  };

  const outlineData = convertToOutlineData(report);
  console.log(outlineData);

  const convertToOutlineElement = (outlineData, depth = 1) => {
    return (
      <div key={outlineData.bookmarkName}>
        <div>{outlineData.bookmarkName}</div>
        {outlineData.children?.map((child) => {
          return (
            <div key={child.bookmarkName} style={{ marginLeft: `${10 * depth}px` }}>
              {convertToOutlineElement(child, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  const outlineElement = convertToOutlineElement(outlineData);

  return (
    <>
      <Button variant="primary" onClick={handleShow}>
        Outline
      </Button>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Outline</Modal.Title>
        </Modal.Header>
        <Modal.Body>{outlineElement}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
