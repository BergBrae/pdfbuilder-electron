// AddComponent.js
import React from 'react'
import { Container, Row, Col, Button } from 'react-bootstrap'

export default function AddComponent ({ onAdd }) {
  const labelToType = {
    'Docx Template': 'DocxTemplate',
    'PDF Type': 'FileType',
    Section: 'Section'
  }
  const handleAdd = (type) => () => {
    onAdd(labelToType[type])
  }

  return (
    <Container className='add-elmnt'>
      <Row>
        <Col className='text-center'>
          {['Docx Template', 'PDF Type', 'Section'].map((type) => (
            <Button
              key={type}
              className='add-elmnt-btn'
              variant='secondary'
              onClick={handleAdd(type)}
            >
              Add {type}
            </Button>
          ))}
        </Col>
      </Row>
    </Container>
  )
}
