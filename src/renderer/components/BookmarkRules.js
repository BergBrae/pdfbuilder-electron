import React, { useState } from 'react';
import { Button, Modal, Form, Row, Col, Alert } from 'react-bootstrap';

export default function BookmarkRules({ fileType, onChange }) {
  const [show, setShow] = useState(false);
  const [rules, setRules] = useState(fileType.bookmark_rules || []);
  const [error, setError] = useState(''); // State for handling error messages

  const validateRules = () => {
    // Validate all rules before allowing the modal to close
    for (const rule of rules) {
      const isSpecial =
        rule.isSpecial ||
        (rule.bookmark_name === 'SAMPLEID' && rule.rule === 'SAMPLEID');
      if (!isSpecial && (!rule.rule || !rule.bookmark_name)) {
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
    setRules(fileType.bookmark_rules || []);
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
  const specialRuleExists = rules.some(
    (rule) =>
      rule.isSpecial ||
      (rule.bookmark_name === 'SAMPLEID' && rule.rule === 'SAMPLEID'),
  );

  const numRules = rules.length;

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
            Bookmark Rules:{' '}
            {fileType.bookmark_name ? fileType.bookmark_name : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            These rules are used to set bookmarks on a page level. Consecutive
            pages with the same bookmark will be ignored. These bookmarks will
            be children of their closest parent.
          </p>
          <hr />
          {error && <Alert variant="danger">{error}</Alert>}

          {rules.map((rule, index) => {
            const isSpecial =
              rule.isSpecial ||
              (rule.bookmark_name === 'SAMPLEID' && rule.rule === 'SAMPLEID');
            return (
              <Row key={index} className="mb-3">
                {isSpecial ? (
                  <Col>
                    <Form.Control
                      plaintext
                      readOnly
                      defaultValue="When a page includes a Merit Sample ID, bookmark as the Sample ID"
                    />
                  </Col>
                ) : (
                  <>
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
                          handleRuleChange(
                            index,
                            'bookmark_name',
                            e.target.value,
                          )
                        }
                      />
                    </Col>
                  </>
                )}
                <Col xs="auto">
                  <Button variant="danger" onClick={() => deleteRule(index)}>
                    Delete
                  </Button>
                </Col>
              </Row>
            );
          })}

          <Button variant="success" onClick={addRule}>
            Add Rule
          </Button>
          <Button
            variant="info"
            className="ms-2"
            onClick={addSpecialRule}
            disabled={specialRuleExists} // Disable if special rule already exists
          >
            Add Merit Sample ID Rule
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
