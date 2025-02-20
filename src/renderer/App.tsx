import React, { useState, useEffect } from 'react';
import Section from './components/Section';
import Help from './components/help';
import Zoom from './components/Zoom';
import Outline from './components/Outline';
import { Container, Spinner, Modal, Button, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { setFlags } from './components/utils';
import {
  IoIosHelpCircleOutline,
  IoIosSave,
  IoIosCreate,
  IoIosHelpCircle,
} from 'react-icons/io';
import { IoHammer } from 'react-icons/io5';
import { FaBoxOpen } from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
// @ts-ignore
import logo from '../../assets/merit-logo.jpeg';
// @ts-ignore
import appIcon from '../../assets/icon.png';
import { useLoading } from './contexts/LoadingContext';
import ChangeLog from './components/ChangeLog';

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

function App() {
  const emptyReport = {
    type: 'Section',
    bookmark_name: 'Quality Control Report',
    base_directory: '',
    variables: [],
    children: [],
  };

  const [report, setReport] = useState(emptyReport);
  const [builtPDF, setBuiltPDF] = useState<BuildResponse | null>(null);
  const [savePath, setSavePath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [buildStatus, setBuildStatus] = useState('');
  const [error, setError] = useState<BuildError | null>(null);
  const [zoom, setZoom] = useState(1);
  const [apiStatus, setApiStatus] = useState('');
  const [showApiErrorModal, setShowApiErrorModal] = useState(false);
  const { loadingCount } = useLoading();
  const [version, setVersion] = useState('');
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  const handleSectionChange = (newSection: any) => {
    setReport(newSection);
  };

  const handleSave = async () => {
    await window.electron.saveReport(report);
  };

  const handleLoad = async () => {
    let report = await window.electron.loadReport();
    if (report) {
      report = setFlags(report);
      setReport(report);
    }
  };

  const handleRefresh = () => {
    const unrefreshedReport = setFlags(report);
    setReport(unrefreshedReport);
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
            body: JSON.stringify(report),
          },
        );

        if (!response.ok) {
          throw await response.json();
        }

        const data = await response.json();

        const responseData: BuildResponse = {
          success: true,
          output_path: data.output_path,
          problematic_files: Array.isArray(data.problematic_files)
            ? data.problematic_files
            : [],
        };

        setBuiltPDF(responseData);
        setBuildStatus('success');

        new Notification('Complete', {
          body: 'PDF built successfully!',
          icon: appIcon,
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

        new Notification('Error', {
          body: `Failed to build PDF: ${buildError.message}`,
          icon: appIcon,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleNew = () => {
    setShowModal(true);
  };

  const confirmNew = () => {
    setReport(emptyReport);
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
    setTimeout(checkApiConnection, 5000);
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
    setReport((prevReport) => {
      const newReport = { ...prevReport };
      let currentLevel = newReport;

      for (const index of parentPath) {
        currentLevel = currentLevel.children[index];
      }

      const dragItem = currentLevel.children[dragIndex];
      const newChildren = [...currentLevel.children];
      newChildren.splice(dragIndex, 1);
      newChildren.splice(hoverIndex, 0, dragItem);
      currentLevel.children = newChildren;

      return newReport;
    });
  };

  return (
    <Container fluid className="App">
      {loadingCount > 0 && (
        <div className="loading-overlay">
          <Spinner animation="border" className="loading-spinner" />
        </div>
      )}

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

      <Modal show={showBuildModal} onHide={closeBuildModal}>
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

      <div className="floating-buttons">
        <img
          src={logo}
          alt="Merit Logo"
          style={{ maxWidth: '15vw', marginBottom: '30px' }}
        />
        <Zoom handleZoomIn={handleZoomIn} handleZoomOut={handleZoomOut} />
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
            <IoIosCreate /> Clear
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <IoIosSave /> Save
          </Button>
          <Button variant="primary" onClick={handleLoad}>
            <FaBoxOpen /> Open
          </Button>
          <Outline report={report} moveItem={moveItem} />
        </div>
        <div className="buttons-container">
          <Button variant="primary" onClick={handleBuildPDF}>
            <IoHammer /> Build PDF
          </Button>
        </div>
        <div
          className="text-center text-muted mt-3"
          style={{ fontSize: '0.8rem', textAlign: 'center', margin: 'auto' }}
        >
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

      <div className="api-status d-flex justify-content-center">
        <p>{apiStatus}</p>
      </div>
      <Row className="justify-content-center">
        <Col md={8}>
          <div className="mt-3" />
          <div className="zoom-wrapper" style={{ transform: `scale(${zoom})` }}>
            <Section
              section={report}
              isRoot
              onSectionChange={handleSectionChange}
              onDelete={null}
              parentDirectory={null}
              report={report}
            />
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
