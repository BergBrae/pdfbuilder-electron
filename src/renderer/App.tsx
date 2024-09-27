import React, { useState, useEffect } from 'react';
import Section from './components/Section';
import Help from './components/Help';
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
import logo from '../../assets/merit-logo.jpeg';
import appIcon from '../../assets/icon.png';

function App() {
  const emptyReport = {
    type: 'Section',
    bookmark_name: 'Quality Control Report',
    base_directory: '',
    variables: [],
    children: [],
  };

  const [report, setReport] = useState(emptyReport);
  const [builtPDF, setBuiltPDF] = useState(null);
  const [savePath, setSavePath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showBuildModal, setShowBuildModal] = useState(false); // New state for build modal
  const [buildStatus, setBuildStatus] = useState(''); // New state for build status
  const [zoom, setZoom] = useState(1); // New state for zoom level
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState(''); // New state for API status
  const [showApiErrorModal, setShowApiErrorModal] = useState(false); // New state for API error modal

  const isCurrentlyLoading = (report: any) => {
    for (const child of report.children) {
      if (child.type === 'FileType' || child.type === 'DocxTemplate') {
        if (child.needs_update) {
          return true;
        }
      }
      if (child.type === 'Section') {
        return isCurrentlyLoading(child);
      }
    }
    return false;
  };

  const handleSectionChange = (newSection) => {
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
      setShowBuildModal(true); // Show build modal
      setBuildStatus('building'); // Set status to building
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
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setBuiltPDF(data);
        setBuildStatus('success'); // Set status to success

        // Send notification
        console.log('Sending notification...');
        new Notification('Complete', {
          body: 'PDF built successfully!',
          icon: appIcon,
        });
      } catch (error_object) {
        console.error(error_object);
        setError(error_object);
        setBuildStatus('failure'); // Set status to failure

        // Send error notification
        new Notification('Error', {
          body: `Failed to build PDF: ${error_object.message}`,
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
    setBuildStatus(''); // Reset status
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
        setShowApiErrorModal(true); // Show modal if API connection fails
      }
    } catch (error) {
      setShowApiErrorModal(true); // Show modal if API connection fails
    }
  };

  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission().then((permission) => {
        console.log('Notification permission:', permission);
      });
    }
    checkApiConnection(); // Check API connection when component mounts
  }, []);

  return (
    <Container fluid className="App">
      {isCurrentlyLoading(report) && (
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
          ) : buildStatus === 'success' ? (
            <p>PDF built successfully!</p>
          ) : buildStatus === 'failure' ? (
            <p>{error.message}</p>
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
          <Outline report={report} />
        </div>
        <div className="buttons-container">
          <Button variant="primary" onClick={handleBuildPDF}>
            <IoHammer /> Build PDF
          </Button>
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
          {/* <pre>{JSON.stringify(report, null, 2)}</pre> */}
        </Col>
      </Row>
    </Container>
  );
}

export default App;
