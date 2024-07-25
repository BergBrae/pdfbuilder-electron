import React, { useEffect } from 'react'
import DocxTemplate from './DocxTemplate'
import FileType from './FileType'
import TemplateVariable from './TemplateVariable'
import BookmarkIcon from './BookmarkIcon'
import AddComponent from './AddComponent'
import { Row, Col, Accordion, Container, Button } from 'react-bootstrap'
import { v4 as uuidv4 } from 'uuid'
import { handleAPIUpdate, setFlags } from './utils'

function Section ({ section, isRoot = false, onSectionChange, onDelete, parentDirectory }) {
  const directorySource = parentDirectory ? `${parentDirectory}\\${section.base_directory}` : section.base_directory

  const getUpdatedVariables = (section) => {
    const currentTemplateTexts = section.variables.map(variable => variable.template_text)
    const updatedVariables = []

    for (const child of section.children) {
      if (child.variables_in_doc) {
        for (const templateText of child.variables_in_doc) {
          if (!currentTemplateTexts.includes(templateText) && !updatedVariables.map(variable => variable.template_text).includes(templateText)) { // Then it is a new variable
            updatedVariables.push({ template_text: templateText, is_constant: true, constant_value: '', id: uuidv4() })
          } else if (!updatedVariables.map(variable => variable.template_text).includes(templateText)) { // existing variable
            updatedVariables.push(section.variables.find(variable => variable.template_text === templateText))
          }
        }
      }
    }
    return updatedVariables
  }

  const handleChildChange = (index, newChild) => {
    const updatedChildren = section.children.map((child, i) =>
      i === index ? newChild : child
    )
    const updatedVariables = getUpdatedVariables({ ...section, children: updatedChildren })
    onSectionChange({ ...section, children: updatedChildren, variables: updatedVariables })
  }

  const handleVariableChange = (index, newVariable) => {
    const updatedVariables = section.variables.map((variable, i) =>
      i === index ? newVariable : variable
    )
    onSectionChange({ ...section, variables: updatedVariables })
  }

  const handleBaseDirectoryChange = async (currentDirectory) => {
    const relativePath = await window.electron.directoryDialog(currentDirectory)
    if (relativePath) {
      section = setFlags(section)
      onSectionChange({ ...section, base_directory: relativePath })
    }
  }

  const handleBookmarkChange = (newBookmarkName) => {
    onSectionChange({ ...section, bookmark_name: newBookmarkName || null })
  }

  const handleAddChild = (index, type) => {
    let newChild = null

    switch (type) {
      case 'DocxTemplate':
        newChild = {
          type: 'DocxTemplate',
          id: uuidv4(),
          docx_path: '',
          will_have_page_numbers: false,
          variables_in_doc: [],
          bookmark_name: ''
        }
        break
      case 'FileType':
        newChild = {
          type: 'FileType',
          id: uuidv4(),
          directory_source: './',
          filename_text_to_match: '',
          will_have_page_numbers: true,
          bookmark_name: '',
          files: []
        }
        break
      case 'Section':
        newChild = {
          type: 'Section',
          id: uuidv4(),
          base_directory: './',
          variables: [],
          children: []
        }
        break
      default:
        return
    }

    const updatedChildren = [
      ...section.children.slice(0, index),
      newChild,
      ...section.children.slice(index)
    ]
    onSectionChange({ ...section, children: updatedChildren })
  }

  const handleDelete = (id) => {
    const updatedChildren = section.children.filter(child => child.id !== id)
    const updatedVariables = []
    for (const child of updatedChildren) {
      if (child.variables_in_doc) {
        updatedVariables.push(...child.variables_in_doc.map(variable => ({ template_text: variable, is_constant: true, constant_value: '' })))
      }
    }
    onSectionChange({ ...section, children: updatedChildren, variables: updatedVariables })
  }

  const handleVariablesUpdate = (variables) => {
    const updatedVariables = variables.map(variable => ({ template_text: variable, is_constant: true, constant_value: '' }))
    onSectionChange({ ...section, variables: updatedVariables })
  }

  const updateChildWithAPI = async (child, directorySource) => {
    if (child.needs_update && child.type !== 'Section') {
      const updatedChild = await handleAPIUpdate(
        `http://localhost:8000/${child.type.toLowerCase()}?parent_directory_source=${directorySource}`,
        child,
        null,
        console.log
      )
      return updatedChild
    } else {
      return child
    }
  }

  const updateChildrenWithAPI = async (section, directorySource) => {
    const updatedChildren = await Promise.all(
      section.children.map(async (child) => {
        if (child.type === 'Section') {
          const updatedChild = await updateChildrenWithAPI(child, `${directorySource}\\${child.base_directory}`)
          return { ...child, children: updatedChild.children }
        } else {
          return updateChildWithAPI(child, directorySource)
        }
      })
    )
    return { ...section, children: updatedChildren }
  }

  useEffect(() => {
    if (section.needs_update) {
      section.needs_update = false
      updateChildrenWithAPI(section, directorySource).then(updatedSection => {
        updatedSection.variables = getUpdatedVariables(updatedSection)
        onSectionChange(updatedSection)
      })
    }
  }, [section, directorySource, onSectionChange])

  return (
    <Accordion className='mb-3 section' defaultActiveKey={isRoot ? '0' : ''}>
      <Accordion.Item eventKey='0'>
        <Accordion.Header>
          <div className='section-header'>
            <div className='header-top'>
              <BookmarkIcon
                isBookmarked={!!section.bookmark_name}
                bookmarkName={section.bookmark_name}
                onBookmarkChange={handleBookmarkChange}
                includeIcon={!isRoot}
              />
              {!isRoot && <Button className='x' variant='danger' size='sm' onClick={() => onDelete(section.id)}>X</Button>}
            </div>
            <div className='base-directory'>
              <p>Base Directory: {section.base_directory}</p>
              <Button size='sm' onClick={() => handleBaseDirectoryChange(parentDirectory)}>Change Base Directory</Button>
            </div>
          </div>
        </Accordion.Header>

        <Accordion.Body>
          {!!section.variables.length &&
            <Row>
              {section.variables.map((variable, index) => (
                <Col xl={3} key={variable.id}>
                  <TemplateVariable
                    key={variable.id}
                    variable={variable}
                    onChange={(newVariable) => handleVariableChange(index, newVariable)}
                  />
                </Col>
              ))}
            </Row>}
          {section.children.map((child, index) => (
            <Container key={child.id}>
              <div className='parent-element'>
                <AddComponent onAdd={(type) => handleAddChild(index, type)} />
              </div>
              {(() => {
                switch (child.type) {
                  case 'DocxTemplate':
                    return (
                      <DocxTemplate
                        key={child.id}
                        docxTemplate={child}
                        onTemplateChange={(newTemplate, variables) => handleChildChange(index, newTemplate, variables)}
                        onDelete={handleDelete}
                        onVariablesUpdate={handleVariablesUpdate}
                        parentDirectorySource={directorySource}
                      />
                    )
                  case 'FileType':
                    return (
                      <FileType
                        key={child.id}
                        file={child}
                        onFileChange={(newFile) => handleChildChange(index, newFile)}
                        onDelete={handleDelete}
                        parentDirectorySource={directorySource}
                      />
                    )
                  case 'Section':
                    return (
                      <Section
                        key={child.id}
                        section={child}
                        isRoot={false}
                        onSectionChange={(newSection) => handleChildChange(index, newSection)}
                        onDelete={handleDelete}
                        parentDirectory={directorySource}
                      />
                    )
                  default:
                    return <p key={index}>Nothing Here</p>
                }
              })()}
            </Container>
          ))}
          <div className='parent-element'>
            <AddComponent onAdd={(type) => handleAddChild(section.children.length, type)} />
          </div>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  )
}

export default Section
