import React, { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { MdOutlineToc } from 'react-icons/md';

export default function Outline({ report }) {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

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
    return {
      bookmarkName: report.bookmark_name
        ? report.bookmark_name
        : '(No bookmark name)',
      type: report.type,
      exists: exists,
      children: report.children?.map((child) => {
        return convertToOutlineData(child);
      }),
    };
  };

  const outlineData = convertToOutlineData(report);

  const convertToOutlineElement = (outlineData, depth = 1) => {
    return (
      <div key={outlineData.bookmarkName}>
        <div className={outlineData.exists ? 'green' : 'red'}>
          {outlineData.bookmarkName}
        </div>
        {outlineData.children?.map((child) => {
          return (
            <div
              key={child.bookmarkName}
              style={{ marginLeft: `${10 * depth}px` }}
            >
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
        <MdOutlineToc /> Outline
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
