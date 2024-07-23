// DocxTemplate.js
import React, { useState } from 'react'
import BookmarkIcon from './BookmarkIcon'
import { FaFileWord } from 'react-icons/fa6'
import { Row, Col, Form, Card, Container, Button } from 'react-bootstrap'
import { handleAPIUpdate } from './utils'

const docxIcon = (
  <span className='docx-icon content-align-center'>
    <FaFileWord className='mb-2 ms-1 mt-1' />
    <span className='m-2'>Docx Template</span>
  </span>
)

function DocxTemplate ({ docxTemplate, onTemplateChange, onDelete, parentDirectorySource }) {
  const [docxPath, setDocxPath] = useState(docxTemplate.docx_path)

  const handleBookmarkChange = (newBookmarkName) => {
    onTemplateChange({ ...docxTemplate, bookmark_name: newBookmarkName || null })
  }

  const handleDelete = () => {
    onDelete(docxTemplate.id)
  }

  const handleDocxPathChange = (event) => {
    const newDocxPath = event.target.value
    setDocxPath(newDocxPath)

    handleAPIUpdate(
      `http://localhost:8000/docxtemplate?parent_directory_source=${parentDirectorySource}`,
      { ...docxTemplate, docx_path: newDocxPath },
      (data) => {
        onTemplateChange(data)
      },
      (error) => console.error('Failed to fetch variables from the API', error)
    )
  }

  return (
    <Card className='docx-template'>
      <Card.Header>
        <Container>
          <div className='d-flex justify-content-between'>
            <BookmarkIcon
              isBookmarked={!!docxTemplate.bookmark_name}
              bookmarkName={docxTemplate.bookmark_name}
              onBookmarkChange={handleBookmarkChange}
            />
            <Button variant='danger' size='sm' onClick={handleDelete}>
              x
            </Button>
          </div>
          <Row>
            {docxIcon}
            <Form.Control
              type='text'
              value={docxPath}
              onChange={handleDocxPathChange}
              placeholder='Enter docx path'
            />
            <span>{docxTemplate.exists ? 'Exists' : 'Does not exist'}</span>
          </Row>
        </Container>
      </Card.Header>
      <Card.Body>
        <Form.Check
          type='switch'
          id='page-numbers-switch'
          label='Add Page Numbers'
          checked={docxTemplate.will_have_page_numbers}
          onChange={() =>
            onTemplateChange({
              ...docxTemplate,
              will_have_page_numbers: !docxTemplate.will_have_page_numbers
            })}
        />
        {docxTemplate.variables_in_doc.map((variable, index) => (
          <Col xl={3} key={index}>
            <p>{variable}</p>
          </Col>
        ))}
      </Card.Body>
    </Card>
  )
}

export default DocxTemplate
