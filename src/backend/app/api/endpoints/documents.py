"""
API endpoints for document operations.
"""

from fastapi import APIRouter, HTTPException, Depends
from buildpdf.convert_docx import get_variables_in_docx
import os

from app.models.schemas import DocxTemplate, Section
from app.services.validation import validate_and_raise


router = APIRouter()


@router.post("/docxtemplate")
def validate_docx_template(
    doc: DocxTemplate, parent_directory_source: str
) -> DocxTemplate:
    """
    Validate a DOCX template and extract variables.

    Args:
        doc: The DOCX template to validate
        parent_directory_source: The parent directory source

    Returns:
        DocxTemplate: The validated DOCX template with variables
    """
    docx_path = os.path.join(parent_directory_source, doc.docx_path)
    docx_path = os.path.normpath(docx_path)

    if not os.path.exists(docx_path):
        doc.exists = False
        return doc

    doc.exists = True

    # Get variables in the DOCX file
    try:
        variables = get_variables_in_docx(docx_path)
        doc.variables_in_doc = variables
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting variables: {str(e)}"
        )

    return doc


@router.post("/loadfile")
def load_file(path: str) -> Section:
    """
    Load a file and return its contents as a Section.

    Args:
        path: The path to the file

    Returns:
        Section: The file contents as a Section
    """
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"File not found: {path}")

    try:
        with open(path, "r") as f:
            data = f.read()
            return Section.parse_raw(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading file: {str(e)}")


@router.post("/savefile")
def save_file(path: str, data: Section):
    """
    Save a Section to a file.

    Args:
        path: The path to save the file to
        data: The Section to save

    Returns:
        dict: A success message
    """
    try:
        with open(path, "w") as f:
            f.write(data.json(indent=2))
        return {"message": "File saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
