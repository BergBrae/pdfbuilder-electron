import React, { useState } from 'react'
import Section from './components/Section' // Correct path to Section
import { Container, Spinner, Modal, Button } from 'react-bootstrap'
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
    report = setFlags(report)
    setReport(report)
    console.log(report)
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

  return (
    <Container className='App'>
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

      <Button className='mr-2' variant='secondary' onClick={handleNew}>New</Button>
      <Button className='ms-2' variant='secondary' onClick={handleSave}>Save</Button>
      <Button className='ms-2' variant='secondary' onClick={handleLoad}>Open</Button>
      <Button className='ms-2' variant='secondary' onClick={handleBuildPDF}>Build PDF</Button>
      {/* <div>
        <label htmlFor='savePath'>Save Path:</label>
        <input id='savePath' type='text' value={savePath} onChange={(e) => setSavePath(e.target.value)} />
      </div> */}
      {isLoading ? <Spinner animation='border' /> : <p>{builtPDF ? JSON.stringify(builtPDF) : null}</p>}
      <Section section={report} isRoot onSectionChange={handleSectionChange} onDelete={null} parentDirectory='./' />
      <button onClick={() => console.log(report)}>Log Data</button>
    </Container>
  )
}

export default App
