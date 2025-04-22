import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, InputGroup } from 'react-bootstrap';

const SettingsModal = ({ show, onHide }) => {
  // State for default paths
  const [defaultTemplatePath, setDefaultTemplatePath] = useState('');
  const [defaultCoverPageTemplatePath, setDefaultCoverPageTemplatePath] =
    useState('');
  const [defaultCoverPagesTemplatePath, setDefaultCoverPagesTemplatePath] =
    useState('');
  const [
    defaultCaseNarrativeTemplatePath,
    setDefaultCaseNarrativeTemplatePath,
  ] = useState('');

  // Load saved settings when modal opens
  useEffect(() => {
    if (show) {
      loadSettings();
    }
  }, [show]);

  // Load settings from localStorage
  const loadSettings = () => {
    const savedTemplatePath = localStorage.getItem('defaultTemplatePath');
    const savedCoverPagePath = localStorage.getItem(
      'defaultCoverPageTemplatePath',
    );
    const savedCoverPagesPath = localStorage.getItem(
      'defaultCoverPagesTemplatePath',
    );
    const savedCaseNarrativePath = localStorage.getItem(
      'defaultCaseNarrativeTemplatePath',
    );

    if (savedTemplatePath) setDefaultTemplatePath(savedTemplatePath);
    if (savedCoverPagePath) setDefaultCoverPageTemplatePath(savedCoverPagePath);
    if (savedCoverPagesPath)
      setDefaultCoverPagesTemplatePath(savedCoverPagesPath);
    if (savedCaseNarrativePath)
      setDefaultCaseNarrativeTemplatePath(savedCaseNarrativePath);
  };

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem('defaultTemplatePath', defaultTemplatePath);
    localStorage.setItem(
      'defaultCoverPageTemplatePath',
      defaultCoverPageTemplatePath,
    );
    localStorage.setItem(
      'defaultCoverPagesTemplatePath',
      defaultCoverPagesTemplatePath,
    );
    localStorage.setItem(
      'defaultCaseNarrativeTemplatePath',
      defaultCaseNarrativeTemplatePath,
    );
    onHide();
  };

  const handleSelectTemplate = async () => {
    try {
      const result = await window.electron.openFileDialog({
        title: 'Select Default Report Template',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile'],
        defaultPath: defaultTemplatePath,
      });

      if (result && result.filePaths && result.filePaths.length > 0) {
        setDefaultTemplatePath(result.filePaths[0]);
      }
    } catch (error) {
      console.error('Error selecting template:', error);
    }
  };

  const handleSelectCoverPageTemplate = async () => {
    try {
      const result = await window.electron.openFileDialog({
        title: 'Select Default Cover Page Template',
        filters: [{ name: 'Word Documents', extensions: ['docx'] }],
        properties: ['openFile'],
        defaultPath: defaultCoverPageTemplatePath,
      });

      if (result && result.filePaths && result.filePaths.length > 0) {
        setDefaultCoverPageTemplatePath(result.filePaths[0]);
      }
    } catch (error) {
      console.error('Error selecting cover page template:', error);
    }
  };

  const handleSelectCoverPagesTemplate = async () => {
    try {
      const result = await window.electron.openFileDialog({
        title: 'Select Default Cover Pages Template',
        filters: [{ name: 'Word Documents', extensions: ['docx'] }],
        properties: ['openFile'],
        defaultPath: defaultCoverPagesTemplatePath,
      });

      if (result && result.filePaths && result.filePaths.length > 0) {
        setDefaultCoverPagesTemplatePath(result.filePaths[0]);
      }
    } catch (error) {
      console.error('Error selecting cover pages template:', error);
    }
  };

  const handleSelectCaseNarrativeTemplate = async () => {
    try {
      const result = await window.electron.openFileDialog({
        title: 'Select Default Case Narrative Template',
        filters: [{ name: 'Word Documents', extensions: ['docx'] }],
        properties: ['openFile'],
        defaultPath: defaultCaseNarrativeTemplatePath,
      });

      if (result && result.filePaths && result.filePaths.length > 0) {
        setDefaultCaseNarrativeTemplatePath(result.filePaths[0]);
      }
    } catch (error) {
      console.error('Error selecting case narrative template:', error);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Configure default template paths used when creating new reports.</p>

        <Form.Group className="mb-3">
          <Form.Label>Default Report Template (JSON)</Form.Label>
          <InputGroup>
            <Form.Control
              type="text"
              value={defaultTemplatePath}
              onChange={(e) => setDefaultTemplatePath(e.target.value)}
              placeholder="Path to report template JSON"
              readOnly
            />
            <Button variant="outline-secondary" onClick={handleSelectTemplate}>
              Browse
            </Button>
          </InputGroup>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Default Cover Page Template (DOCX)</Form.Label>
          <InputGroup>
            <Form.Control
              type="text"
              value={defaultCoverPageTemplatePath}
              onChange={(e) => setDefaultCoverPageTemplatePath(e.target.value)}
              placeholder="Path to cover page template DOCX"
              readOnly
            />
            <Button
              variant="outline-secondary"
              onClick={handleSelectCoverPageTemplate}
            >
              Browse
            </Button>
          </InputGroup>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Default Cover Pages Template (DOCX)</Form.Label>
          <InputGroup>
            <Form.Control
              type="text"
              value={defaultCoverPagesTemplatePath}
              onChange={(e) => setDefaultCoverPagesTemplatePath(e.target.value)}
              placeholder="Path to cover pages template DOCX"
              readOnly
            />
            <Button
              variant="outline-secondary"
              onClick={handleSelectCoverPagesTemplate}
            >
              Browse
            </Button>
          </InputGroup>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Default Case Narrative Template (DOCX)</Form.Label>
          <InputGroup>
            <Form.Control
              type="text"
              value={defaultCaseNarrativeTemplatePath}
              onChange={(e) =>
                setDefaultCaseNarrativeTemplatePath(e.target.value)
              }
              placeholder="Path to case narrative template DOCX"
              readOnly
            />
            <Button
              variant="outline-secondary"
              onClick={handleSelectCaseNarrativeTemplate}
            >
              Browse
            </Button>
          </InputGroup>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={saveSettings}>
          Save Settings
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SettingsModal;
