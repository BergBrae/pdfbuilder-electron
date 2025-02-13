import React, { useState } from 'react';
import { Accordion, Card, useAccordionButton } from 'react-bootstrap';
import { MdExpandLess, MdExpandMore } from 'react-icons/md';

const CustomAccordion = ({
  children,
  eventKey,
  className,
  defaultActiveKey,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = useAccordionButton(eventKey, () => {
    setIsExpanded(!isExpanded);
  });

  return (
    <Card className={className}>
      <Card.Header>
        <div className="d-flex justify-content-between">
          <div style={{ flex: 1 }}>
            {/* Header content */}
            {children[0]}
          </div>
          {children[1] && defaultActiveKey != '0' && (
            <div style={{ cursor: 'pointer' }}>
              <span onClick={handleToggle}>
                {isExpanded ? (
                  <MdExpandLess size={40} />
                ) : (
                  <MdExpandMore size={40} />
                )}
              </span>
            </div>
          )}
        </div>
      </Card.Header>
      {children[1] && (
        <Accordion.Collapse eventKey={eventKey}>
          <Card.Body
            style={{ marginInlineStart: '15px', marginInlineEnd: '15px' }}
          >
            {children[1]}
          </Card.Body>
        </Accordion.Collapse>
      )}
    </Card>
  );
};

export default CustomAccordion;
