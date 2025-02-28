"""
API endpoints for file operations.
"""

from fastapi import APIRouter, HTTPException
import os
import glob
import re

from app.models.schemas import FileType, FileData
from app.utils.file_helpers import create_uuid, normalize_path


router = APIRouter()


@router.post("/filetype")
def validate_file_type(file: FileType, parent_directory_source: str) -> FileType:
    """
    Validate a file type and find matching files.

    Args:
        file: The file type to validate
        parent_directory_source: The parent directory source

    Returns:
        FileType: The validated file type with matching files
    """
    directory_source = os.path.join(parent_directory_source, file.directory_source)
    directory_source = normalize_path(directory_source)

    if not os.path.exists(directory_source):
        raise HTTPException(
            status_code=404, detail=f"Directory not found: {directory_source}"
        )

    if not os.path.isdir(directory_source):
        raise HTTPException(
            status_code=400, detail=f"Not a directory: {directory_source}"
        )

    # Find matching files
    file.files = []

    # Get all PDF files in the directory
    pdf_files = glob.glob(os.path.join(directory_source, "**", "*.pdf"), recursive=True)

    # Filter files based on the filename_text_to_match pattern
    pattern = re.compile(file.filename_text_to_match, re.IGNORECASE)

    for pdf_path in pdf_files:
        filename = os.path.basename(pdf_path)
        if pattern.search(filename):
            # Create a FileData object for the matching file
            relative_path = os.path.relpath(pdf_path, directory_source)
            file_data = FileData(
                type="FileData",
                id=create_uuid(),
                file_path=relative_path,
                bookmark_name=file.bookmark_name,
            )
            file.files.append(file_data)

    return file


@router.post("/directory")
def create_directory(path: str):
    """
    Create a directory if it doesn't exist.

    Args:
        path: The path to create

    Returns:
        dict: A success message
    """
    try:
        os.makedirs(path, exist_ok=True)
        return {"message": f"Directory created: {path}"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error creating directory: {str(e)}"
        )
