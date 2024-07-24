import React, { useState } from 'react'
import Section from './components/Section' // Correct path to Section
import { Container, Spinner, Modal, Button, Row, Col } from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import { setFlags } from './components/utils'

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
      console.log(report)
    }
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

      <Modal show={showHelpModal} onHide={closeHelpModal}>
        <Modal.Header closeButton>
          <Modal.Title>Help</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>This is the help information for the app. Use the buttons to create, save, load, and build PDF reports.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant='primary' onClick={closeHelpModal}>
            Dismiss
          </Button>
        </Modal.Footer>
      </Modal>

      <div className="floating-buttons">
        <Button className='mb-2' variant='secondary' onClick={handleNew}>New</Button>
        <Button className='mb-2' variant='secondary' onClick={handleSave}>Save</Button>
        <Button className='mb-2' variant='secondary' onClick={handleLoad}>Open</Button>
        <Button className='mb-2' variant='secondary' onClick={handleBuildPDF}>Build PDF</Button>
        <Button className='mb-2' variant='secondary' onClick={handleHelp}>Help</Button>
      </div>

      <Row className="justify-content-center">
        <Col md={8}>
          <div className='mt-3'></div>
          {isLoading ? <Spinner animation='border' /> : <p>{builtPDF ? JSON.stringify(builtPDF) : null}</p>}
          <Section section={report} isRoot onSectionChange={handleSectionChange} onDelete={null} parentDirectory={null} />
        </Col>
      </Row>
    </Container>
  )
}

export default App
