import React, { useState } from 'react';
import { Accordion, Card, useAccordionButton } from 'react-bootstrap';

const CustomAccordion = ({ children, eventKey }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = useAccordionButton(eventKey, () => {
    setIsExpanded(!isExpanded);
  });

  return (
    <Card>
      <Card.Header>
        <div className="d-flex justify-content-between">
          <div style={{ flex: 1 }}>
            {/* Header content */}
            {children[0]}
          </div>
          {children[1] && (
            <div style={{ cursor: 'pointer' }}>
              <span onClick={handleToggle}>{isExpanded ? '▲' : '▼'}</span>
            </div>
          )}
        </div>
      </Card.Header>
      {children[1] && (
        <Accordion.Collapse eventKey={eventKey}>
          <Card.Body>{children[1]}</Card.Body>
        </Accordion.Collapse>
      )}
    </Card>
  );
};

export default CustomAccordion;
