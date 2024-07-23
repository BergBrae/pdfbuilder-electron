// FileData.js
import React from 'react';
import { Col, Card } from 'react-bootstrap';

export default function FileData({ fileData }) {
  const { file_path, num_pages } = fileData;
  const fileName = file_path.split('\\').pop();

  return (
    <Col xs={12} sm={12} md={4} lg={4}>
      <Card>
        <Card.Body>
          <p className='filename'>{fileName}</p>
          <p>{num_pages}{num_pages > 1 ? " Pages" : " Page"}</p>
        </Card.Body>
      </Card>
    </Col>
  );
}
