// FileData.js
import React from 'react';
import { Col, Card } from 'react-bootstrap';
import { Form } from 'react-bootstrap';
import BookmarkIcon from './BookmarkIcon';

export default function FileData({ fileData, onFileDataChange, showBookmark }) {
  const { file_path, num_pages } = fileData;
  const fileName = file_path.split('\\').pop();

  const handleBookmarkChange = (newBookmarkName) => {
    onFileDataChange({ ...fileData, bookmark_name: newBookmarkName || null });
  };

  return (
    <Col xs={12} sm={12} md={4} lg={4}>
      <Card
        className="mb-4"
        onDoubleClick={() => window.electron.openFile(file_path)}
      >
        <Card.Body>
          {showBookmark && (
            <BookmarkIcon
              isBookmarked={!!fileData.bookmark_name}
              bookmarkName={fileData.bookmark_name}
              onBookmarkChange={handleBookmarkChange}
            />
          )}
          <p className="filename m-2">
            {fileName}
            <br />
            <br />
            {num_pages}
            {num_pages > 1 ? ' Pages' : ' Page'}
            <br />
            <small style={{ color: '#6c757d' }}>Double click to open</small>
          </p>
        </Card.Body>
      </Card>
    </Col>
  );
}
