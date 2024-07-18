import React, { useState } from 'react'
import Section from './components/Section' // Correct path to Section
import { Container } from 'react-bootstrap'
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
    const response = await fetch(`http://localhost:8000/buildpdf?output_path=${encodeURIComponent(savePath)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    })
    const data = await response.json()
    setBuiltPDF(data)
  }

  return (
    <Container className='App'>
      <button onClick={() => setReport(emptyReport)}>New</button>
      <button onClick={handleSave}>Save</button>
      <button onClick={handleLoad}>Open</button>
      <button onClick={handleBuildPDF}>Build PDF</button>
      <input type='text' value={savePath} onChange={(e) => setSavePath(e.target.value)} />
      <p>{builtPDF ? JSON.stringify(builtPDF) : null}</p>
      <Section section={report} isRoot onSectionChange={handleSectionChange} onDelete={null} parentDirectory='./' />
      <button onClick={() => console.log(report)}>Log Data</button>
    </Container>
  )
}

export default App
