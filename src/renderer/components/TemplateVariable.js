// TemplateVariable.js
import React, { useState } from 'react';
import { Card, Form } from 'react-bootstrap';

function TemplateVariable({ variable, onChange }) {
  const { template_text: templateText, constant_value: constantValue } =
    variable;

  const [value, setValue] = useState(constantValue);

  const handleInputChange = (e) => {
    setValue(e.target.value);
    onChange({ ...variable, constant_value: e.target.value });
  };

  return (
    <Card className="mb-3 template-variable">
      <Card.Body>
        <h5>{templateText}</h5>
        <Form.Control type="text" value={value} onChange={handleInputChange} />
      </Card.Body>
    </Card>
  );
}

export default TemplateVariable;
