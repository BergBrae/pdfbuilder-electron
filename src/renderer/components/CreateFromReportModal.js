import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Form,
  Spinner,
  Alert,
  ListGroup,
  Badge,
  Container,
  Row,
  Col,
  InputGroup,
} from 'react-bootstrap';
import { useReport } from '../contexts/ReportContext';
import { setFlags } from './utils';

const CreateFromReportModal = ({ show, onHide }) => {
  // State for file selection
  const [analyticalReportPath, setAnalyticalReportPath] = useState('');
  const [templatePath, setTemplatePath] = useState('');
  const [coverPageTemplatePath, setCoverPageTemplatePath] = useState('');
  const [coverPagesTemplatePath, setCoverPagesTemplatePath] = useState('');
  const [caseNarrativeTemplatePath, setCaseNarrativeTemplatePath] =
    useState('');
  const [outputDirectory, setOutputDirectory] = useState('');

  // Load default paths from localStorage on initial render
  useEffect(() => {
    if (show) {
      // Set defaults from localStorage or use hardcoded values as fallback
      const defaultTemplatePath =
        localStorage.getItem('defaultTemplatePath') ||
        'G:\\data\\PDFBuilder\\Master Templates\\Master Template.json';
      const defaultCoverPagePath =
        localStorage.getItem('defaultCoverPageTemplatePath') ||
        'G:\\data\\PDFBuilder\\Master Templates\\Master Cover Page Template.docx';
      const defaultCoverPagesPath =
        localStorage.getItem('defaultCoverPagesTemplatePath') ||
        'G:\\data\\PDFBuilder\\Master Templates\\Master Cover Pages Template.docx';
      const defaultCaseNarrativePath =
        localStorage.getItem('defaultCaseNarrativeTemplatePath') ||
        'G:\\data\\PDFBuilder\\Master Templates\\Master Case Narrative Template.docx';

      setTemplatePath(defaultTemplatePath);
      setCoverPageTemplatePath(defaultCoverPagePath);
      setCoverPagesTemplatePath(defaultCoverPagesPath);
      setCaseNarrativeTemplatePath(defaultCaseNarrativePath);
    }
  }, [show]);

  // State for backend processing
  const [extractedData, setExtractedData] = useState(null);
  const [editedData, setEditedData] = useState(null);
  const [filteredTemplate, setFilteredTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Current step in the wizard
  const [currentStep, setCurrentStep] = useState(1);

  // Add state for new checkboxes
  const [addCOAFolder, setAddCOAFolder] = useState(true);
  const [addBenchsheetsFolder, setAddBenchsheetsFolder] = useState(true);

  // Report context
  const { dispatch } = useReport();

  // Reset state when modal is closed
  useEffect(() => {
    if (!show) {
      resetForm();
    }
  }, [show]);

  useEffect(() => {
    if (extractedData && !editedData) {
      setEditedData({ ...extractedData });
    }
  }, [extractedData]);

  const resetForm = () => {
    setAnalyticalReportPath('');

    // Get default values from localStorage or use fallbacks
    const defaultTemplatePath =
      localStorage.getItem('defaultTemplatePath') ||
      'G:\\data\\PDFBuilder\\Master Templates\\Master Template.json';
    const defaultCoverPagePath =
      localStorage.getItem('defaultCoverPageTemplatePath') ||
      'G:\\data\\PDFBuilder\\Master Templates\\Master Cover Page Template.docx';
    const defaultCoverPagesPath =
      localStorage.getItem('defaultCoverPagesTemplatePath') ||
      'G:\\data\\PDFBuilder\\Master Templates\\Master Cover Pages Template.docx';
    const defaultCaseNarrativePath =
      localStorage.getItem('defaultCaseNarrativeTemplatePath') ||
      'G:\\data\\PDFBuilder\\Master Templates\\Master Case Narrative Template.docx';

    setTemplatePath(defaultTemplatePath);
    setCoverPageTemplatePath(defaultCoverPagePath);
    setCoverPagesTemplatePath(defaultCoverPagesPath);
    setCaseNarrativeTemplatePath(defaultCaseNarrativePath);

    setOutputDirectory('');
    setExtractedData(null);
    setEditedData(null);
    setFilteredTemplate(null);
    setIsLoading(false);
    setError(null);
    setSuccess(null);
    setEditMode(false);
    setCurrentStep(1);
    setAddCOAFolder(true);
    setAddBenchsheetsFolder(true);
  };

  const handleSelectAnalyticalReport = async () => {
    try {
      const result = await window.electron.openFileDialog({
        title: 'Select Analytical Report',
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
        properties: ['openFile'],
        defaultPath: 'C:\\vlims.rpt\\reports',
      });

      if (result && result.filePaths && result.filePaths.length > 0) {
        setAnalyticalReportPath(result.filePaths[0]);
      }
    } catch (error) {
      console.error('Error selecting analytical report:', error);
      setError('Error selecting analytical report: ' + error.message);
    }
  };

  const handleSelectTemplate = async () => {
    try {
      const result = await window.electron.openFileDialog({
        title: 'Select Report Template',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile'],
        defaultPath:
          'G:\\data\\PDFBuilder\\Master Templates\\Master Template.json',
      });

      if (result && result.filePaths && result.filePaths.length > 0) {
        setTemplatePath(result.filePaths[0]);
      }
    } catch (error) {
      console.error('Error selecting template:', error);
      setError('Error selecting template: ' + error.message);
    }
  };

  const handleSelectCoverPageTemplate = async () => {
    try {
      const result = await window.electron.openFileDialog({
        title: 'Select Cover Page Template',
        filters: [{ name: 'Word Documents', extensions: ['docx'] }],
        properties: ['openFile'],
        defaultPath:
          'G:\\data\\PDFBuilder\\Master Templates\\Master Cover Page Template.docx',
      });

      if (result && result.filePaths && result.filePaths.length > 0) {
        setCoverPageTemplatePath(result.filePaths[0]);
      }
    } catch (error) {
      console.error('Error selecting cover page template:', error);
      setError('Error selecting cover page template: ' + error.message);
    }
  };

  const handleSelectCoverPagesTemplate = async () => {
    try {
      const result = await window.electron.openFileDialog({
        title: 'Select Cover Pages Template',
        filters: [{ name: 'Word Documents', extensions: ['docx'] }],
        properties: ['openFile'],
        defaultPath:
          'G:\\data\\PDFBuilder\\Master Templates\\Master Cover Pages Template.docx',
      });

      if (result && result.filePaths && result.filePaths.length > 0) {
        setCoverPagesTemplatePath(result.filePaths[0]);
      }
    } catch (error) {
      console.error('Error selecting cover pages template:', error);
      setError('Error selecting cover pages template: ' + error.message);
    }
  };

  const handleSelectCaseNarrativeTemplate = async () => {
    try {
      const result = await window.electron.openFileDialog({
        title: 'Select Case Narrative Template',
        filters: [{ name: 'Word Documents', extensions: ['docx'] }],
        properties: ['openFile'],
        defaultPath:
          'G:\\data\\PDFBuilder\\Master Templates\\Master Case Narrative Template.docx',
      });

      if (result && result.filePaths && result.filePaths.length > 0) {
        setCaseNarrativeTemplatePath(result.filePaths[0]);
      }
    } catch (error) {
      console.error('Error selecting case narrative template:', error);
      setError('Error selecting case narrative template: ' + error.message);
    }
  };

  const handleSelectOutputDirectory = async () => {
    try {
      // Default to a standard location similar to the other template paths
      const defaultPath = 'G:\\data\\PDFBuilder\\Reports';

      const result = await window.electron.openDirectoryDialog({
        title: 'Select Output Directory',
        properties: ['openDirectory', 'createDirectory'],
        defaultPath: defaultPath,
      });

      if (result && result.filePaths && result.filePaths.length > 0) {
        setOutputDirectory(result.filePaths[0]);
      }
    } catch (error) {
      console.error('Error selecting output directory:', error);
      setError('Error selecting output directory: ' + error.message);
    }
  };

  const handleExtractData = async () => {
    if (!analyticalReportPath) {
      setError('Please select an analytical report PDF file.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Extract data from the analytical report
      const response = await fetch('http://localhost:8000/extract_rpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdf_path: analyticalReportPath,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to extract data from PDF');
      }

      const data = await response.json();
      let extractedVariables = { ...data };

      // Extract variables from DOCX templates and merge them
      const docxVariables = {};
      let hasDocxTemplates = false;

      // Process Cover Page Template if selected
      if (coverPageTemplatePath) {
        hasDocxTemplates = true;
        try {
          const coverPageResponse = await fetch(
            'http://localhost:8000/get_docx_variables',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                docx_path: coverPageTemplatePath,
              }),
            },
          );

          if (coverPageResponse.ok) {
            const variables = await coverPageResponse.json();
            docxVariables.coverPage = variables.variables;

            // Add to extracted data without prefix
            variables.variables.forEach((variable) => {
              if (!extractedVariables[variable]) {
                extractedVariables[variable] = '';
              }
            });
          }
        } catch (error) {
          console.error('Error extracting Cover Page variables:', error);
        }
      }

      // Process Cover Pages Template if selected
      if (coverPagesTemplatePath) {
        hasDocxTemplates = true;
        try {
          const coverPagesResponse = await fetch(
            'http://localhost:8000/get_docx_variables',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                docx_path: coverPagesTemplatePath,
              }),
            },
          );

          if (coverPagesResponse.ok) {
            const variables = await coverPagesResponse.json();
            docxVariables.coverPages = variables.variables;

            // Add to extracted data without prefix
            variables.variables.forEach((variable) => {
              if (!extractedVariables[variable]) {
                extractedVariables[variable] = '';
              }
            });
          }
        } catch (error) {
          console.error('Error extracting Cover Pages variables:', error);
        }
      }

      // Process Case Narrative Template if selected
      if (caseNarrativeTemplatePath) {
        hasDocxTemplates = true;
        try {
          const caseNarrativeResponse = await fetch(
            'http://localhost:8000/get_docx_variables',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                docx_path: caseNarrativeTemplatePath,
              }),
            },
          );

          if (caseNarrativeResponse.ok) {
            const variables = await caseNarrativeResponse.json();
            docxVariables.caseNarrative = variables.variables;

            // Add to extracted data without prefix
            variables.variables.forEach((variable) => {
              if (!extractedVariables[variable]) {
                extractedVariables[variable] = '';
              }
            });
          }
        } catch (error) {
          console.error('Error extracting Case Narrative variables:', error);
        }
      }

      setExtractedData(extractedVariables);
      setCurrentStep(2);
    } catch (error) {
      console.error('Error extracting data:', error);
      setError('Error extracting data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterTemplate = async () => {
    if (!templatePath || !editedData) {
      setError(
        'Please select a template and extract data from analytical report.',
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Now filter the template using the already extracted and potentially edited data
      const response = await fetch('http://localhost:8000/filter_template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_path: templatePath,
          cover_page_template_path: coverPageTemplatePath,
          cover_pages_template_path: coverPagesTemplatePath,
          case_narrative_template_path: caseNarrativeTemplatePath,
          extracted_data: editedData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to filter template');
      }

      const data = await response.json();
      setFilteredTemplate(data);
      setCurrentStep(3);
    } catch (error) {
      console.error('Error filtering template:', error);
      setError('Error filtering template: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDirectories = async () => {
    if (!outputDirectory || !filteredTemplate) {
      setError('Please select an output directory and filter a template.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if the filteredTemplate is valid
      if (!filteredTemplate.type) {
        throw new Error('Invalid template format: missing type property');
      }

      console.log('Creating directory structure with:', {
        base_path: outputDirectory,
        report: filteredTemplate,
        analytical_report_path: analyticalReportPath,
        extracted_data: editedData,
        cover_page_template_path: coverPageTemplatePath,
        cover_pages_template_path: coverPagesTemplatePath,
        case_narrative_template_path: caseNarrativeTemplatePath,
        add_coa_folder: addCOAFolder,
        add_benchsheets_folder: addBenchsheetsFolder,
      });

      const response = await fetch(
        'http://localhost:8000/create_directory_structure',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            base_path: outputDirectory,
            report: filteredTemplate,
            analytical_report_path: analyticalReportPath,
            extracted_data: editedData,
            cover_page_template_path: coverPageTemplatePath,
            cover_pages_template_path: coverPagesTemplatePath,
            case_narrative_template_path: caseNarrativeTemplatePath,
            process_docx_templates: true, // Flag to process DOCX templates
            add_coa_folder: addCOAFolder,
            add_benchsheets_folder: addBenchsheetsFolder,
          }),
        },
      );

      let errorDetail;
      const responseData = await response.json();

      if (!response.ok) {
        errorDetail = responseData.detail || 'Unknown server error';
        console.error('Server error:', responseData);
        throw new Error(errorDetail);
      }

      console.log('Server response:', responseData);

      // Make sure generated_documents exists in the success state
      const generatedDocuments = responseData.generated_documents || [];
      console.log('Generated documents:', generatedDocuments);

      setSuccess({
        message: 'Directory structure and documents created successfully!',
        reportPath: responseData.report_path,
        directories: responseData.created_directories,
        analyticalReportPath: responseData.analytical_report_path,
        generatedDocuments: generatedDocuments,
      });
      setCurrentStep(4);

      // Use the updated report from the response if available
      const reportToLoad = responseData.updated_report || filteredTemplate;

      // Create FileType components for the DOCX templates
      // Check if templates were chosen and prepend them to the report
      const { v4: uuidv4 } = require('uuid');

      // Helper function to create FileType for DOCX template
      const createDocxFileType = (templatePath, bookmarkName) => {
        if (!templatePath) return null;

        const filename = templatePath.split(/[/\\]/).pop();
        // Remove file extension
        const filenameWithoutExt = filename.replace(/\.[^.]+$/, '');

        return {
          id: uuidv4(),
          type: 'FileType',
          bookmark_name: bookmarkName,
          directory_source: './',
          filename_text_to_match: filenameWithoutExt,
          will_have_page_numbers: true,
          files: [],
          variables_in_doc: [],
          base_directory: '',
          children: [],
        };
      };

      // Check if we need to add any templates
      const templatesAdded = [];

      // Check if templates already exist in the report
      const templateFilenames = [
        coverPageTemplatePath &&
          coverPageTemplatePath
            .split(/[/\\]/)
            .pop()
            .replace(/\.[^.]+$/, ''),
        coverPagesTemplatePath &&
          coverPagesTemplatePath
            .split(/[/\\]/)
            .pop()
            .replace(/\.[^.]+$/, ''),
        caseNarrativeTemplatePath &&
          caseNarrativeTemplatePath
            .split(/[/\\]/)
            .pop()
            .replace(/\.[^.]+$/, ''),
      ].filter(Boolean);

      // Check if any of these templates already exist in the report
      const existingFileTypes = reportToLoad.children.filter(
        (child) =>
          child.type === 'FileType' &&
          templateFilenames.some((filename) =>
            child.filename_text_to_match.includes(filename),
          ),
      );

      const existingFilenames = existingFileTypes.map(
        (ft) => ft.filename_text_to_match,
      );

      // Create array of templates to add in correct order
      const templatesToAdd = [];

      // Add Cover Page Template
      if (
        coverPageTemplatePath &&
        !existingFilenames.some((name) =>
          name.includes(
            coverPageTemplatePath
              .split(/[/\\]/)
              .pop()
              .replace(/\.[^.]+$/, ''),
          ),
        )
      ) {
        const coverPageFileType = createDocxFileType(
          coverPageTemplatePath,
          'Cover Page',
        );
        if (coverPageFileType) {
          templatesToAdd.push(coverPageFileType);
          templatesAdded.push('Cover Page');
        }
      }

      // Add Cover Pages Template
      if (
        coverPagesTemplatePath &&
        !existingFilenames.some((name) =>
          name.includes(
            coverPagesTemplatePath
              .split(/[/\\]/)
              .pop()
              .replace(/\.[^.]+$/, ''),
          ),
        )
      ) {
        const coverPagesFileType = createDocxFileType(
          coverPagesTemplatePath,
          'Cover Pages',
        );
        if (coverPagesFileType) {
          templatesToAdd.push(coverPagesFileType);
          templatesAdded.push('Cover Pages');
        }
      }

      // Add Case Narrative Template
      if (
        caseNarrativeTemplatePath &&
        !existingFilenames.some((name) =>
          name.includes(
            caseNarrativeTemplatePath
              .split(/[/\\]/)
              .pop()
              .replace(/\.[^.]+$/, ''),
          ),
        )
      ) {
        const caseNarrativeFileType = createDocxFileType(
          caseNarrativeTemplatePath,
          'Case Narrative',
        );
        if (caseNarrativeFileType) {
          templatesToAdd.push(caseNarrativeFileType);
          templatesAdded.push('Case Narrative');
        }
      }

      // Prepend all templates at once in correct order
      if (templatesToAdd.length > 0) {
        reportToLoad.children = [...templatesToAdd, ...reportToLoad.children];
        console.log(`Added templates to report: ${templatesAdded.join(', ')}`);
      }

      // Load the report into the app
      const reportWithFlags = setFlags(reportToLoad);
      dispatch({ type: 'SET_REPORT', payload: reportWithFlags });
      dispatch({ type: 'SET_FILE_PATH', payload: responseData.report_path });
      dispatch({ type: 'MARK_SAVED' });
    } catch (error) {
      console.error('Error creating directory structure:', error);
      setError(`Error creating directory structure: ${error.message}`);

      // Display more detailed information if available
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle editing data fields
  const handleDataEdit = (key, value) => {
    if (!editedData) return;

    const newData = { ...editedData };
    newData[key] = value;
    setEditedData(newData);
  };

  // Function to toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const renderStep1 = () => (
    <>
      <Modal.Body>
        <p>
          This wizard will guide you through creating a new report project from
          an analytical report. First, select an analytical report (PDF) to
          extract data from, and template files for various report components.
        </p>

        <Form.Group className="mb-3">
          <Form.Label>Analytical Report (PDF)</Form.Label>
          <InputGroup>
            <Form.Control
              type="text"
              value={analyticalReportPath}
              onChange={(e) => setAnalyticalReportPath(e.target.value)}
              placeholder="Path to analytical report PDF"
              readOnly
            />
            <Button
              variant="outline-secondary"
              onClick={handleSelectAnalyticalReport}
            >
              Browse
            </Button>
          </InputGroup>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Report Template (JSON)</Form.Label>
          <InputGroup>
            <Form.Control
              type="text"
              value={templatePath}
              onChange={(e) => setTemplatePath(e.target.value)}
              placeholder="Path to report template JSON"
              readOnly
            />
            <Button variant="outline-secondary" onClick={handleSelectTemplate}>
              Browse
            </Button>
          </InputGroup>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Cover Page Template (DOCX)</Form.Label>
          <InputGroup>
            <Form.Control
              type="text"
              value={coverPageTemplatePath}
              onChange={(e) => setCoverPageTemplatePath(e.target.value)}
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
          <Form.Label>Cover Pages Template (DOCX)</Form.Label>
          <InputGroup>
            <Form.Control
              type="text"
              value={coverPagesTemplatePath}
              onChange={(e) => setCoverPagesTemplatePath(e.target.value)}
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
          <Form.Label>Case Narrative Template (DOCX)</Form.Label>
          <InputGroup>
            <Form.Control
              type="text"
              value={caseNarrativeTemplatePath}
              onChange={(e) => setCaseNarrativeTemplatePath(e.target.value)}
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

        {error && <Alert variant="danger">{error}</Alert>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleExtractData}
          disabled={!analyticalReportPath || isLoading}
        >
          {isLoading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />{' '}
              Processing...
            </>
          ) : (
            'Extract Data & Variables'
          )}
        </Button>
      </Modal.Footer>
    </>
  );

  const renderStep2 = () => (
    <>
      <Modal.Body>
        <p>
          Data extracted successfully! Please review the extracted data below.
        </p>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5>Extracted Data & Template Variables</h5>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={toggleEditMode}
          >
            {editMode ? 'Done Editing' : 'Edit Data'}
          </Button>
        </div>

        {editedData && (
          <ListGroup className="mb-3">
            {Object.entries(editedData).map(([key, value]) => (
              <ListGroup.Item key={key}>
                <Row className="align-items-center">
                  <Col xs={3}>
                    <strong>{key}:</strong>
                  </Col>
                  <Col xs={9}>
                    {editMode ? (
                      Array.isArray(value) ? (
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={value.join(', ')}
                          onChange={(e) =>
                            handleDataEdit(
                              key,
                              e.target.value
                                .split(',')
                                .map((item) => item.trim()),
                            )
                          }
                        />
                      ) : (
                        <Form.Control
                          type="text"
                          value={value || ''}
                          onChange={(e) => handleDataEdit(key, e.target.value)}
                        />
                      )
                    ) : Array.isArray(value) ? (
                      value.map((v, i) => (
                        <Badge bg="info" className="me-1" key={i}>
                          {v}
                        </Badge>
                      ))
                    ) : (
                      value
                    )}
                  </Col>
                </Row>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}

        {error && <Alert variant="danger">{error}</Alert>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setCurrentStep(1)}>
          Back
        </Button>
        <Button
          variant="primary"
          onClick={handleFilterTemplate}
          disabled={!templatePath || isLoading}
        >
          {isLoading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />{' '}
              Processing...
            </>
          ) : (
            'Filter Template'
          )}
        </Button>
      </Modal.Footer>
    </>
  );

  const renderStep3 = () => (
    <>
      <Modal.Body>
        <p>
          Template filtered based on method codes! The sections that don't match
          any of the extracted method codes have been removed. Now, select an
          output directory where the report files will be created.
        </p>

        <h5>Method Codes</h5>
        <div className="mb-3">
          {extractedData?.methods?.map((method, i) => (
            <Badge bg="success" className="me-1" key={i}>
              {method}
            </Badge>
          )) || <p>No method codes found</p>}
        </div>

        <Form.Group className="mb-3">
          <Form.Label>Output Directory</Form.Label>
          <InputGroup>
            <Form.Control
              type="text"
              value={outputDirectory}
              onChange={(e) => setOutputDirectory(e.target.value)}
              placeholder="Path to output directory"
              readOnly
            />
            <Button
              variant="outline-secondary"
              onClick={handleSelectOutputDirectory}
            >
              Browse
            </Button>
          </InputGroup>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            id="add-coa-folder"
            label="Add COA Folder"
            checked={addCOAFolder}
            onChange={(e) => setAddCOAFolder(e.target.checked)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            id="add-benchsheets-folder"
            label="Add Designated Benchsheets Folder"
            checked={addBenchsheetsFolder}
            onChange={(e) => setAddBenchsheetsFolder(e.target.checked)}
          />
        </Form.Group>

        {error && <Alert variant="danger">{error}</Alert>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setCurrentStep(2)}>
          Back
        </Button>
        <Button
          variant="primary"
          onClick={handleCreateDirectories}
          disabled={!outputDirectory || isLoading}
        >
          {isLoading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />{' '}
              Processing...
            </>
          ) : (
            'Create Directories'
          )}
        </Button>
      </Modal.Footer>
    </>
  );

  const renderStep4 = () => (
    <>
      <Modal.Body>
        {success && (
          <Alert variant="success">
            <p>{success.message}</p>

            <h6>Report Files:</h6>
            <ListGroup className="mb-3">
              {success.reportPath && (
                <ListGroup.Item className="text-primary">
                  📋 {success.reportPath.split(/[/\\]/).pop()}{' '}
                  <Badge bg="primary" size="sm">
                    JSON
                  </Badge>
                </ListGroup.Item>
              )}
              {success.analyticalReportPath && (
                <ListGroup.Item className="text-secondary">
                  🔬 {success.analyticalReportPath.split(/[/\\]/).pop()}{' '}
                  <Badge bg="secondary" size="sm">
                    PDF
                  </Badge>
                </ListGroup.Item>
              )}
            </ListGroup>

            <h6>Created Directories:</h6>
            <ListGroup className="mb-3">
              {success.directories
                .sort((a, b) => a.localeCompare(b))
                .map((dir, i) => {
                  // Extract just the last part after the selected output directory
                  const relativePath = dir
                    .replace(outputDirectory, '')
                    .replace(/^\/|\\/, '');
                  return (
                    <ListGroup.Item key={i}>
                      📁 {relativePath || dir}
                    </ListGroup.Item>
                  );
                })}
            </ListGroup>

            {success.generatedDocuments &&
              success.generatedDocuments.length > 0 && (
                <>
                  <h6>Generated Documents:</h6>
                  <ListGroup>
                    {success.generatedDocuments.map((doc, i) => {
                      // Extract just the filename
                      const filename = doc.split(/[/\\]/).pop();
                      // Determine file type for icon and styling
                      const isDocx = filename.toLowerCase().endsWith('.docx');
                      const isPdf = filename.toLowerCase().endsWith('.pdf');

                      let fileIcon = '📄';
                      let fileClass = 'text-secondary';

                      if (isDocx) {
                        fileIcon = '📝';
                        fileClass = 'text-success';
                      } else if (isPdf) {
                        fileIcon = '📊';
                        fileClass = 'text-danger';
                      }

                      return (
                        <ListGroup.Item key={`doc-${i}`} className={fileClass}>
                          {fileIcon} {filename}{' '}
                          {isDocx && (
                            <Badge bg="success" size="sm">
                              DOCX
                            </Badge>
                          )}
                          {isPdf && (
                            <Badge bg="danger" size="sm">
                              PDF
                            </Badge>
                          )}
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                </>
              )}
          </Alert>
        )}

        <p className="mt-3">
          The report has been loaded into the editor. You can now edit it and
          save your changes.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          Create from Analytical Report - Step {currentStep} of 4
        </Modal.Title>
      </Modal.Header>
      {renderCurrentStep()}
    </Modal>
  );
};

export default CreateFromReportModal;
