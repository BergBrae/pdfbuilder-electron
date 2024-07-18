// TemplateVariable.js
import React, { useState } from 'react'
import { Card, Form } from 'react-bootstrap'

function TemplateVariable ({ variable, onChange }) {
  const {
    template_text: templateText,
    is_constant: isConstant,
    constant_value: constantValue,
    bookmark_for_page_number: bookmarkForPageNumber,
    use_beginning_of_bookmark: useBeginningOfBookmark
  } = variable

  const [value, setValue] = useState(constantValue)
  const [bookmarkValue, setBookmarkValue] = useState(bookmarkForPageNumber)

  const handleInputChange = (e) => {
    setValue(e.target.value)
    onChange({ ...variable, constant_value: e.target.value })
  }

  const handleBookmarkChange = (e) => {
    setBookmarkValue(e.target.value)
    onChange({ ...variable, bookmark_for_page_number: e.target.value })
  }

  const radioButtonName = 'bookmarkPosition'

  return (
    <Card className='mb-3 template-variable'>
      <Card.Body>
        <Form.Switch
          label='Page Number'
          checked={!isConstant}
          onChange={() => onChange({ ...variable, is_constant: !isConstant })}
        />
        <h5>{templateText}</h5>
        {isConstant
          ? (
            <Form.Control type='text' value={value} onChange={handleInputChange} />
            )
          : (
            <>
              <h6>Page Number Setting:</h6>
              <Form>
                <Form.Check
                  inline
                  type='radio'
                  label='Beginning'
                  name={radioButtonName}
                  id={`${radioButtonName}-beginning`}
                  checked={useBeginningOfBookmark}
                  onChange={() => onChange({ ...variable, use_beginning_of_bookmark: true })}
                />
                <Form.Check
                  inline
                  type='radio'
                  label='End'
                  name={radioButtonName}
                  id={`${radioButtonName}-end`}
                  checked={!useBeginningOfBookmark}
                  onChange={() => onChange({ ...variable, use_beginning_of_bookmark: false })}
                />
              </Form>
              <p>
                of Bookmark: <input value={bookmarkValue} onChange={handleBookmarkChange} />
              </p>
            </>
            )}
      </Card.Body>
    </Card>
  )
}

export default TemplateVariable
