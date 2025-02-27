import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, ListGroup, Badge } from 'react-bootstrap';
import { FaTimes } from 'react-icons/fa';

function MethodCodesModal({ show, onHide, methodCodes, onSave }) {
  const [codes, setCodes] = useState([]);
  const [newCode, setNewCode] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setCodes(methodCodes || []);
  }, [methodCodes, show]);

  useEffect(() => {
    if (show && inputRef.current) {
      // Short timeout to ensure the modal is fully rendered
      setTimeout(() => {
        inputRef.current.focus();
      }, 50);
    }
  }, [show]);

  const handleAddCode = () => {
    if (newCode.trim() && !codes.includes(newCode.trim())) {
      setCodes([...codes, newCode.trim()]);
      setNewCode('');
      // Refocus input after adding
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleRemoveCode = (index) => {
    const updatedCodes = [...codes];
    updatedCodes.splice(index, 1);
    setCodes(updatedCodes);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCode();
    }
  };

  const handleSave = () => {
    onSave(codes);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Method Codes</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Add Method Code</Form.Label>
            <div className="d-flex">
              <Form.Control
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter method code"
                ref={inputRef}
              />
              <Button
                variant="outline-primary"
                className="ms-2"
                onClick={handleAddCode}
              >
                Add
              </Button>
            </div>
          </Form.Group>
        </Form>

        <div className="mt-3">
          <h6>Method Codes:</h6>
          {codes.length === 0 ? (
            <p className="text-muted">No method codes added</p>
          ) : (
            <ListGroup>
              {codes.map((code, index) => (
                <ListGroup.Item
                  key={index}
                  className="d-flex justify-content-between align-items-center"
                >
                  {code}
                  <Button
                    variant="link"
                    className="text-danger p-0"
                    onClick={() => handleRemoveCode(index)}
                  >
                    <FaTimes />
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default MethodCodesModal;
