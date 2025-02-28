import React, { useState, useEffect } from 'react';
import Section from './components/Section';
import Help from './components/help';
import Zoom from './components/Zoom';
import Outline from './components/Outline';
import {
  Container,
  Spinner,
  Modal,
  Button,
  Row,
  Col,
  Badge,
  Dropdown,
  ButtonGroup,
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { setFlags } from './components/utils';
import {
  IoIosHelpCircleOutline,
  IoIosSave,
  IoIosCreate,
  IoIosHelpCircle,
} from 'react-icons/io';
import { IoHammer, IoAnalytics } from 'react-icons/io5';
import { FaBoxOpen } from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import { useLoading } from './contexts/LoadingContext';
import ChangeLog from './components/ChangeLog';
import { ReportProvider, useReport } from './contexts/ReportContext';
import meritLogo from '../../assets/merit-logo.jpeg';
import path from 'path';
import CreateFromReportModal from './components/CreateFromReportModal';

// Types
interface ProblemFile {
  path: string;
  count: number;
}

interface APIError {
  detail: string;
  problematic_files?: ProblemFile[];
}

interface BuildResponse {
  success: boolean;
  output_path: string;
  problematic_files: ProblemFile[];
}

interface BuildError extends Error {
  message: string;
  problematicFiles: ProblemFile[];
}

// Add this type declaration before the AppContent function
interface SectionProps {
  section: any;
  isRoot?: boolean;
  parentDirectory: any;
  filename?: string;
}

function AppContent() {
  const { state, dispatch } = useReport();
  const [builtPDF, setBuiltPDF] = useState<BuildResponse | null>(null);
  const [savePath, setSavePath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showAnalyticalReportModal, setShowAnalyticalReportModal] =
    useState(false);
  const [buildStatus, setBuildStatus] = useState('');
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<BuildError | null>(null);
  const [apiStatus, setApiStatus] = useState('');
  const [showApiErrorModal, setShowApiErrorModal] = useState(false);
  const { loadingCount } = useLoading();
  const [version, setVersion] = useState('');
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showCloseConfirmModal, setShowCloseConfirmModal] = useState(false);

  const handleSave = async () => {
    try {
      const result = await window.electron.saveReport(
        state.report,
        state.filePath || undefined,
      );
      if (result && result.filePath) {
        dispatch({ type: 'SET_FILE_PATH', payload: result.filePath });
        // Mark document as saved
        dispatch({ type: 'MARK_SAVED' });
      }
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const handleSaveAs = async () => {
    try {
      const result = await window.electron.saveReport(state.report, null);
      if (result && result.filePath) {
        dispatch({ type: 'SET_FILE_PATH', payload: result.filePath });
        // Mark document as saved
        dispatch({ type: 'MARK_SAVED' });
      }
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const handleLoad = async () => {
    try {
      const result = await window.electron.loadReport();
      if (result && result.report) {
        // First apply setFlags to update the report with needs_update flags
        const report = setFlags(result.report);

        // SET_REPORT will initialize originalReport with a deep copy
        dispatch({ type: 'SET_REPORT', payload: report });
        dispatch({ type: 'SET_FILE_PATH', payload: result.filePath });

        // Explicitly mark as saved to ensure the originalReport is properly set
        // This ensures that any technical fields added by setFlags don't cause false unsaved changes
        dispatch({ type: 'MARK_SAVED' });
      }
    } catch (error) {
      console.error('Error loading report:', error);
    }
  };

  const handleRefresh = () => {
    // Apply setFlags to update the report with needs_update flags
    const unrefreshedReport = setFlags(state.report);

    // We need to preserve the unsaved changes state when refreshing
    const wasUnsaved = state.hasUnsavedChanges;

    // First update the report
    dispatch({ type: 'SET_REPORT', payload: unrefreshedReport });

    // If there were unsaved changes before, restore that state
    if (wasUnsaved) {
      dispatch({ type: 'SET_SAVED', payload: true });
    } else {
      // If there were no unsaved changes, ensure the originalReport is updated
      // to match the refreshed report to prevent false unsaved changes
      dispatch({ type: 'MARK_SAVED' });
    }
  };

  const handleBuildPDF = async () => {
    const chosenPath = await window.electron.buildPathDialog(savePath);
    if (chosenPath) {
      setSavePath(chosenPath);
      setIsLoading(true);
      setShowBuildModal(true);
      setBuildStatus('building');
      try {
        const response = await fetch(
          `http://localhost:8000/buildpdf?output_path=${encodeURIComponent(
            chosenPath,
          )}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state.report),
          },
        );

        if (!response.ok) {
          throw data;
        }

        // Ensure we have the correct structure
        const responseData: BuildResponse = {
          success: true,
          output_path: data.output_path,
          problematic_files: Array.isArray(data.problematic_files)
            ? data.problematic_files
            : [],
        };

        setBuiltPDF(responseData);
        setBuildStatus('success');

        // Create notification message
        let notificationMessage = 'PDF built successfully!';

        new Notification('Complete', {
          body: notificationMessage,
        });
      } catch (err) {
        const apiError = err as APIError;
        const buildError: BuildError = {
          name: 'BuildError',
          message: apiError.detail || 'Unknown error occurred',
          problematicFiles: Array.isArray(apiError.problematic_files)
            ? apiError.problematic_files
            : [],
        };
        setError(buildError);
        setBuildStatus('failure');

        let errorMessage = `Failed to build PDF: ${buildError.message}`;

        new Notification('Error', {
          body: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleNew = () => {
    if (state.hasUnsavedChanges) {
      setShowModal(true);
    } else {
      confirmNew();
    }
  };

  const confirmNew = () => {
    // SET_REPORT will initialize originalReport with a deep copy
    dispatch({
      type: 'SET_REPORT',
      payload: {
        type: 'Section',
        bookmark_name: 'Quality Control Report',
        base_directory: '',
        variables: [],
        children: [],
      },
    });
    dispatch({ type: 'SET_FILE_PATH', payload: null });
    setShowModal(false);
  };

  const handleHelp = () => {
    setShowHelpModal(true);
  };

  const closeHelpModal = () => {
    setShowHelpModal(false);
  };

  const closeBuildModal = () => {
    setShowBuildModal(false);
    setBuildStatus('');
  };

  const handleZoomIn = () => {
    setZoom((prevZoom) => Math.min(prevZoom * 1.1, 1.1));
  };

  const handleZoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom * 0.9, 0.3));
  };

  const checkApiConnection = async () => {
    try {
      const response = await fetch('http://localhost:8000/');
      if (!response.ok) {
        setShowApiErrorModal(true);
      }
    } catch (error) {
      setShowApiErrorModal(true);
    }
  };

  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission().then((permission) => {
        console.log('Notification permission:', permission);
      });
    }
    setTimeout(checkApiConnection, 10000);
  }, []);

  useEffect(() => {
    window.electron
      .getVersion()
      .then((version) => {
        setVersion(version);
      })
      .catch((error) => {
        console.error('Error getting version:', error);
      });
  }, []);

  const moveItem = (
    dragIndex: number,
    hoverIndex: number,
    parentPath: number[] = [],
  ) => {
    dispatch({
      type: 'MOVE_ITEM',
      payload: { parentPath, dragIndex, hoverIndex },
    });
  };

  const handleLogoDoubleClick = () => {
    setShowJsonModal(true);
  };

  // Get filename from path without extension
  const getFilename = (filePath: string | null): string => {
    if (!filePath) return '';
    const basename = path.basename(filePath);
    return basename.replace(/\.[^/.]+$/, ''); // Remove file extension
  };

  // Add window title update based on file state
  useEffect(() => {
    const filename = getFilename(state.filePath);
    const unsavedIndicator = state.hasUnsavedChanges ? '* ' : '';
    document.title = filename
      ? `${unsavedIndicator}${filename} - PDF Builder`
      : `${unsavedIndicator}PDF Builder`;
  }, [state.filePath, state.hasUnsavedChanges]);

  // Add window close handler
  useEffect(() => {
    // Set up listener for close requests
    const removeListener = window.electron.onCloseRequested(() => {
      if (state.hasUnsavedChanges) {
        setShowCloseConfirmModal(true);
      } else {
        // No unsaved changes, confirm close immediately
        window.electron.confirmCloseApp(true);
      }
    });

    // Clean up listener on component unmount
    return () => {
      removeListener();
    };
  }, [state.hasUnsavedChanges]);

  const handleConfirmClose = () => {
    setShowCloseConfirmModal(false);
    window.electron.confirmCloseApp(true);
  };

  const handleCancelClose = () => {
    setShowCloseConfirmModal(false);
    window.electron.confirmCloseApp(false);
  };

  const handleCreateFromAnalyticalReport = () => {
    setShowAnalyticalReportModal(true);
  };

  return (
    <Container fluid className="App">
      {loadingCount > 0 && (
        <div className="loading-overlay">
          <Spinner animation="border" className="loading-spinner" />
        </div>
      )}

      {/* Create from Analytical Report Modal */}
      <CreateFromReportModal
        show={showAnalyticalReportModal}
        onHide={() => setShowAnalyticalReportModal(false)}
      />

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm New Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to create a new report? Unsaved changes will be
          lost.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmNew}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showCloseConfirmModal} onHide={handleCancelClose}>
        <Modal.Header closeButton>
          <Modal.Title>Unsaved Changes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          You have unsaved changes. Do you want to save before closing?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmClose}>
            Discard Changes
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              // For new files without a path, we need to handle the save dialog
              if (!state.filePath) {
                try {
                  const result = await window.electron.saveReport(
                    state.report,
                    null,
                  );
                  if (result && result.filePath) {
                    dispatch({
                      type: 'SET_FILE_PATH',
                      payload: result.filePath,
                    });
                    dispatch({ type: 'MARK_SAVED' });
                    // Only close after successful save
                    window.electron.confirmCloseApp(true);
                  } else {
                    // User cancelled the save dialog, don't close
                    setShowCloseConfirmModal(false);
                  }
                } catch (error) {
                  console.error('Error saving report:', error);
                  setShowCloseConfirmModal(false);
                }
              } else {
                // For existing files, use the regular save
                try {
                  await handleSave();
                  handleConfirmClose();
                } catch (error) {
                  console.error('Error saving report:', error);
                  setShowCloseConfirmModal(false);
                }
              }
            }}
          >
            Save and Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal size="xl" show={showHelpModal} onHide={closeHelpModal}>
        <Modal.Header closeButton>
          <Modal.Title>Help</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Help />
        </Modal.Body>
        <Modal.Footer>
          <p>Contact Brady for further help</p>
          <Button variant="primary" onClick={closeHelpModal}>
            Dismiss
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showBuildModal} onHide={closeBuildModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Building PDF</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isLoading ? (
            <div className="d-flex justify-content-center">
              <Spinner animation="border" />
            </div>
          ) : buildStatus === 'success' && builtPDF ? (
            <div>
              <p>PDF built successfully!</p>
            </div>
          ) : buildStatus === 'failure' && error ? (
            <div>
              <p>{error.message}</p>
            </div>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          {!isLoading && (
            <Button variant="primary" onClick={closeBuildModal}>
              Close
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      <Modal
        show={showApiErrorModal}
        onHide={() => setShowApiErrorModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>API Connection Error</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            There was an error starting the app. Please try restarting the app.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowApiErrorModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showWhatsNew} onHide={() => setShowWhatsNew(false)}>
        <Modal.Header closeButton>
          <Modal.Title>What's New</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ChangeLog />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowWhatsNew(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showJsonModal}
        onHide={() => setShowJsonModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Report Data (JSON)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <pre style={{ maxHeight: '70vh', overflow: 'auto' }}>
            {JSON.stringify(state.report, null, 2)}
          </pre>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowJsonModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <div className="floating-buttons">
        <img
          src={meritLogo}
          alt="Merit Logo"
          className="merit-logo"
          onDoubleClick={handleLogoDoubleClick}
          style={{ cursor: 'pointer' }}
        />
        <div className="buttons-container">
          <Button variant="secondary" onClick={handleRefresh}>
            <FiRefreshCw /> Refresh
          </Button>
          <Button variant="secondary" onClick={handleHelp}>
            <IoIosHelpCircle /> Help
          </Button>
        </div>
        <div className="buttons-container">
          <Button variant="primary" onClick={handleNew}>
            <IoIosCreate /> New
          </Button>
          <Button variant="primary" onClick={handleCreateFromAnalyticalReport}>
            <IoAnalytics /> Create from Analytical Report
          </Button>

          <Dropdown as={ButtonGroup}>
            <Button
              variant="primary"
              onClick={handleSave}
              className="save-main-button"
            >
              <IoIosSave /> Save
            </Button>
            <Dropdown.Toggle
              split
              variant="primary"
              id="save-dropdown"
              className="save-dropdown-button"
            />
            <Dropdown.Menu>
              <Dropdown.Item onClick={handleSaveAs}>Save As...</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <Button variant="primary" onClick={handleLoad}>
            <FaBoxOpen /> Open
          </Button>
          <Outline report={state.report} moveItem={moveItem} />
        </div>
        <div className="buttons-container">
          <Button variant="primary" onClick={handleBuildPDF}>
            <IoHammer /> Build PDF
          </Button>
        </div>
        <div className="text-center text-muted mt-3">
          {version && <p className="mb-0">Version: {version}</p>}
          <div>
            <a
              href="#"
              className="text-primary"
              onClick={(e) => {
                e.preventDefault();
                setShowWhatsNew(true);
              }}
            >
              What's New?
            </a>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="zoom-wrapper" style={{ transform: `scale(${zoom})` }}>
          <Section
            section={state.report}
            isRoot={true}
            parentDirectory={null}
            filename={getFilename(state.filePath)}
          />
        </div>
      </div>

      <div className="api-status d-flex justify-content-center">
        <p>{apiStatus}</p>
      </div>
    </Container>
  );
}

function App() {
  return (
    <ReportProvider>
      <AppContent />
    </ReportProvider>
  );
}

export default App;
