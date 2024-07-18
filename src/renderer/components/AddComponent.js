// AddComponent.js
import React from 'react'
import { Container, Row, Col, Button } from 'react-bootstrap'

export default function AddComponent ({ onAdd }) {
  const handleAdd = (type) => () => onAdd(type)

  return (
    <Container className='add-elmnt'>
      <Row>
        <Col className='text-center'>
          {['DocxTemplate', 'FileType', 'Section'].map((type) => (
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
