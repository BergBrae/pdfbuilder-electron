import React, { useState } from 'react';
import { Accordion, Card, useAccordionButton } from 'react-bootstrap';
import { MdExpandLess, MdExpandMore } from 'react-icons/md';

const CustomAccordion = ({
  children,
  header,
  defaultExpanded = false,
  className,
  eventKey,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    if (!defaultExpanded) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <Card className={`${className} mb-3`}>
      <Card.Header
        className={`py-2 ${defaultExpanded ? 'non-collapsible' : ''}`}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div
            style={{ flex: 1 }}
            onClick={handleToggle}
            role={defaultExpanded ? undefined : 'button'}
            className="d-flex justify-content-between align-items-center"
          >
            {header}
          </div>
          {!defaultExpanded && (
            <div style={{ cursor: 'pointer', marginLeft: '1rem' }}>
              <span onClick={handleToggle}>
                {isExpanded ? (
                  <MdExpandLess size={24} />
                ) : (
                  <MdExpandMore size={24} />
                )}
              </span>
            </div>
          )}
        </div>
      </Card.Header>
      <div
        className={`collapse ${defaultExpanded || isExpanded ? 'show' : ''}`}
      >
        <Card.Body className="py-3">{children}</Card.Body>
      </div>
    </Card>
  );
};

export default CustomAccordion;
