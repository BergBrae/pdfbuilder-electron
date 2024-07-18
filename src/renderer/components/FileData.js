// FileData.js
import React from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'

export default function FileData ({ fileData }) {
  const { file_path, num_pages } = fileData
  const fileName = file_path.split('\\').pop()

  return (
    <Container>
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <p>{fileName}</p>
              <p>{num_pages}</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
