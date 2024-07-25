import React, { useState } from 'react'
import Section from './components/Section'
import Help from './components/Help'
import Zoom from './components/Zoom'
import { Container, Spinner, Modal, Button, Row, Col } from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import { setFlags } from './components/utils'
import { IoIosHelpCircleOutline, IoIosSave, IoIosCreate, IoIosHelpCircle } from 'react-icons/io'
import { IoHammer } from 'react-icons/io5'
import { FaBoxOpen } from 'react-icons/fa'
import { FiRefreshCw } from "react-icons/fi";

function App () {
  const emptyReport = {
    type: 'Section',
    bookmark_name: 'Quality Control Report',
    base_directory: '',
    variables: [],
    children: []
  }

  const [report, setReport] = useState(emptyReport)
  const [builtPDF, setBuiltPDF] = useState(null)
  const [savePath, setSavePath] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [zoom, setZoom] = useState(1) // New state for zoom level

  const handleSectionChange = (newSection) => {
    setReport(newSection)
  }

  const handleSave = async () => {
    // clear report of data that may change
    report.variables = []

    const cleanReport = (report) => {
      for (const child of report.children) {
        switch (child.type) {
          case 'DocxTemplate':
            child.variables_in_doc = []
            child.exists = false
            break
          case 'FileType':
            child.files = []
            break
          case 'Section':
            cleanReport(child)
            break
        }
      }
    }

    cleanReport(report)

    await window.electron.saveReport(report)
  }

  const handleLoad = async () => {
    let report = await window.electron.loadReport()
    if (report) {
      report = setFlags(report)
      setReport(report)
    }
  }

  const handleRefresh = () => {
    const unrefreshedReport = setFlags(report)
    setReport(unrefreshedReport)
  }

  const handleBuildPDF = async () => {
    const chosenPath = await window.electron.buildPathDialog(savePath)
    if (chosenPath) {
      setSavePath(chosenPath)
      setIsLoading(true)
      const response = await fetch(`http://localhost:8000/buildpdf?output_path=${encodeURIComponent(chosenPath)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      })
      const data = await response.json()
      setBuiltPDF(data)
      setIsLoading(false)
    }
  }

  const handleNew = () => {
    setShowModal(true)
  }

  const confirmNew = () => {
    setReport(emptyReport)
    setShowModal(false)
  }

  const handleHelp = () => {
    setShowHelpModal(true)
  }

  const closeHelpModal = () => {
    setShowHelpModal(false)
  }

  const handleZoomIn = () => {
    setZoom(prevZoom => Math.min(prevZoom * 1.1, 1.1))
  }

  const handleZoomOut = () => {
    setZoom(prevZoom => Math.max(prevZoom * 0.9, 0.3))
  }

  return (
    <Container fluid className='App'>
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm New Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to create a new report? Unsaved changes will be lost.</Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant='primary' onClick={confirmNew}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal size='xl' show={showHelpModal} onHide={closeHelpModal}>
        <Modal.Header closeButton>
          <Modal.Title>Help</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Help />
        </Modal.Body>
        <Modal.Footer>
          <p>Contact Brady for further help</p>
          <Button variant='primary' onClick={closeHelpModal}>
            Dismiss
          </Button>
        </Modal.Footer>
      </Modal>

      <div className='floating-buttons'>
        <Zoom handleZoomIn={handleZoomIn} handleZoomOut={handleZoomOut} />
        <Button className='mb-2' variant='secondary' onClick={handleNew}><IoIosCreate /> New</Button>
        <Button className='mb-2' variant='secondary' onClick={handleSave}><IoIosSave /> Save</Button>
        <Button className='mb-2' variant='secondary' onClick={handleLoad}><FaBoxOpen />  Open</Button>
        <Button className='mb-2' variant='secondary' onClick={handleHelp}><IoIosHelpCircle />  Help</Button>
        <Button className='mb-2' variant='secondary' onClick={handleBuildPDF}><IoHammer />  Build PDF</Button>
        <Button className='mb-2' variant='secondary' onClick={handleRefresh}><FiRefreshCw /> Refresh</Button>
      </div>

      <Row className='justify-content-center'>
        <Col md={8}>
          <div className='mt-3' />
          {isLoading ? <Spinner animation='border' /> : <p>{builtPDF ? JSON.stringify(builtPDF) : null}</p>}
          <div className='zoom-wrapper' style={{ transform: `scale(${zoom})` }}>
            <Section section={report} isRoot onSectionChange={handleSectionChange} onDelete={null} parentDirectory={null} />
          </div>
        </Col>
      </Row>
    </Container>
  )
}

export default App
