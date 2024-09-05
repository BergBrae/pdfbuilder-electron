import React, { useState } from 'react';
import { Button, Modal, Form, Row, Col, Alert } from 'react-bootstrap';

export default function BookmarkRules({ fileType, onChange }) {
  const [show, setShow] = useState(false);
  const [rules, setRules] = useState(fileType.bookmark_rules || []);
  const [error, setError] = useState(''); // State for handling error messages

  const validateRules = () => {
    // Validate all rules before allowing the modal to close
    for (const rule of rules) {
      if (!rule.isSpecial && (!rule.rule || !rule.bookmark_name)) {
        setError('All fields must be filled out.');
        return false; // Validation failed
      }
    }
    setError(''); // Reset error message if validation passes
    return true;
  };

  const handleClose = () => {
    // If validation passes, close the modal
    if (validateRules()) {
      const updatedFileType = { ...fileType, bookmark_rules: rules };
      onChange(updatedFileType);
      setShow(false);
    }
  };

  const handleShow = () => {
    setError(''); // Reset any previous error messages when showing the modal
    setShow(true);
  };

  const handleRuleChange = (index, field, value) => {
    const newRules = [...rules];
    newRules[index][field] = value;
    setRules(newRules);
  };

  const addRule = () => {
    const newRules = [...rules, { bookmark_name: '', rule: '' }];
    setRules(newRules);
  };

  const addSpecialRule = () => {
    // Add the special rule with static values
    const specialRule = {
      bookmark_name: 'SAMPLEID',
      rule: 'SAMPLEID',
      isSpecial: true,
    };
    setRules([...rules, specialRule]);
  };

  const deleteRule = (index) => {
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules);
  };

  // Check if the special rule is already present
  const specialRuleExists = rules.some((rule) => rule.isSpecial);

  const numRules = rules.length;

  // Separate normal rules and special rule
  const normalRules = rules.filter((rule) => !rule.isSpecial);
  const specialRule = rules.find((rule) => rule.isSpecial);

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="mb-2 ms-1"
        onClick={handleShow}
      >
        Set Bookmark Rules ({numRules})
      </Button>

      <Modal show={show} size="lg" onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
            Page-Level Bookmark Rules:{' '}
            {fileType.bookmark_name ? fileType.bookmark_name : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            These rules are used to set bookmarks on a page level. Consecutive
            pages with the same bookmark will be ignored. These bookmarks will
            be children of the closest parent.
          </p>
          {error && <Alert variant="danger">{error}</Alert>}

          {normalRules.map((rule, index) => (
            <Row key={index} className="mb-3">
              <Col>
                <Form.Control
                  type="text"
                  placeholder="If page includes..."
                  value={rule.rule}
                  onChange={(e) =>
                    handleRuleChange(index, 'rule', e.target.value)
                  }
                />
              </Col>
              <Col>
                <Form.Control
                  type="text"
                  placeholder="Bookmark as..."
                  value={rule.bookmark_name}
                  onChange={(e) =>
                    handleRuleChange(index, 'bookmark_name', e.target.value)
                  }
                />
              </Col>
              <Col xs="auto">
                <Button variant="danger" onClick={() => deleteRule(index)}>
                  Delete
                </Button>
              </Col>
            </Row>
          ))}

          {/* Display special rule last, if it exists */}
          {specialRule && (
            <Row key="special-rule" className="mb-3">
              <Col>
                <Form.Control
                  plaintext
                  readOnly
                  defaultValue="When a page includes a Merit Sample ID, bookmark as the Sample ID"
                />
              </Col>
              <Col xs="auto">
                <Button
                  variant="danger"
                  onClick={() => deleteRule(rules.indexOf(specialRule))}
                >
                  Delete
                </Button>
              </Col>
            </Row>
          )}

          <Button variant="success" onClick={addRule}>
            Add Rule
          </Button>
          <Button
            variant="info"
            className="ms-2"
            onClick={addSpecialRule}
            disabled={specialRuleExists} // Disable if special rule already exists
          >
            Add Merit Sample ID Bookmarks
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
