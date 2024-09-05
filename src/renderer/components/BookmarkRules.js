import React, { useState } from 'react';
import { Button, Modal, Form, Row, Col } from 'react-bootstrap';

export default function BookmarkRules({ fileType, onChange }) {
  const [show, setShow] = useState(false);
  const [rules, setRules] = useState(fileType.bookmark_rules || []);

  const handleClose = () => {
    // Update the fileType object with the new rules and call onChange
    const updatedFileType = { ...fileType, bookmark_rules: rules };
    onChange(updatedFileType);
    setShow(false);
  };

  const handleShow = () => setShow(true);

  const handleRuleChange = (index, field, value) => {
    const newRules = [...rules];
    newRules[index][field] = value;
    setRules(newRules);
  };

  const addRule = () => {
    const newRules = [...rules, { bookmark_name: '', rule: '' }];
    setRules(newRules);
  };

  const deleteRule = (index) => {
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules);
  };

  const numRules = rules.length;

  return (
    <>
      <Button variant="secondary" size='sm' className='mb-2 ms-1' onClick={handleShow}>
        Set Bookmark Rules ({numRules})
      </Button>

      <Modal show={show} size='lg' onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Bookmark Rules: {fileType.bookmark_name ? fileType.bookmark_name : ''}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>These rules are used to set bookmarks on a page level. Consecutive pages with the same bookmark will be ignored. These bookmarks will be children of the closest parent.</p>

          {rules.map((rule, index) => (
            <Row key={index} className="mb-3">
              <Col>
                <Form.Control
                  type="text"
                  placeholder="If page includes..."
                  value={rule.rule}
                  onChange={(e) => handleRuleChange(index, 'rule', e.target.value)}
                />
              </Col>
              <Col>
                <Form.Control
                  type="text"
                  placeholder="Bookmark as..."
                  value={rule.bookmark_name}
                  onChange={(e) => handleRuleChange(index, 'bookmark_name', e.target.value)}
                />
              </Col>
              <Col xs="auto">
                <Button variant="danger" onClick={() => deleteRule(index)}>
                  Delete
                </Button>
              </Col>
            </Row>
          ))}

          <Button variant="success" onClick={addRule}>
            Add Rule
          </Button>
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
