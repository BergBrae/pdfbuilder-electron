import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Row, Col, Alert } from 'react-bootstrap';

export default function BookmarkRules({ fileType, onUpdate }) {
  const [show, setShow] = useState(false);
  const [rules, setRules] = useState(fileType.bookmark_rules || []);
  const [error, setError] = useState(''); // State for handling error messages

  // Add effect to sync rules with fileType changes
  useEffect(() => {
    setRules(
      Array.isArray(fileType.bookmark_rules) ? fileType.bookmark_rules : [],
    );
  }, [fileType.bookmark_rules]);

  const validateRules = () => {
    for (const rule of rules) {
      const isSpecial =
        rule.isSpecial ||
        (rule.bookmark_name === 'SAMPLEID' && rule.rule === 'SAMPLEID');

      // If it's a special rule, it's always valid in terms of field completion
      if (isSpecial) continue;

      const ruleIsEmpty = !rule.rule || rule.rule.trim() === '';
      const bookmarkNameIsEmpty =
        !rule.bookmark_name || rule.bookmark_name.trim() === '';

      // If one is filled and the other is not (and it's not a completely blank rule that will be removed)
      if (
        (ruleIsEmpty && !bookmarkNameIsEmpty) ||
        (!ruleIsEmpty && bookmarkNameIsEmpty)
      ) {
        setError(
          'One of the fields is blank. Please fill both or clear both to remove the rule.',
        );
        return false; // Validation failed
      }
    }
    setError(''); // Reset error message if validation passes
    return true;
  };

  const handleClose = () => {
    if (validateRules()) {
      // Filter out rules where both fields are empty (unless it's a special rule)
      const cleanedRules = rules.filter((rule) => {
        const isSpecial =
          rule.isSpecial ||
          (rule.bookmark_name === 'SAMPLEID' && rule.rule === 'SAMPLEID');
        if (isSpecial) return true; // Keep special rules

        const ruleIsEmpty = !rule.rule || rule.rule.trim() === '';
        const bookmarkNameIsEmpty =
          !rule.bookmark_name || rule.bookmark_name.trim() === '';

        // Keep rules that are not completely empty
        return !(ruleIsEmpty && bookmarkNameIsEmpty);
      });

      const updatedFileType = { ...fileType, bookmark_rules: cleanedRules };
      onUpdate(updatedFileType);
      setShow(false);
    }
  };

  const handleShow = () => {
    setError(''); // Reset any previous error messages when showing the modal
    setRules(
      Array.isArray(fileType.bookmark_rules) ? fileType.bookmark_rules : [],
    );
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
      <Button variant="secondary" size="sm" onClick={handleShow}>
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
