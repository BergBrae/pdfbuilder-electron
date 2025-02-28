"""
Pydantic models for data validation and serialization.
"""

from pydantic import BaseModel, Field
from typing import Optional, Union, ClassVar, Any, List


class TemplateVariable(BaseModel):
    """Model for template variables in documents."""

    type: str = Field("TemplateVariable", Literal=True)
    id: str
    template_text: str
    # If yes, the user can type in a value to replace the template text
    is_constant: bool
    # Value to replace the template text if is_constant is True
    constant_value: Optional[str] = None
    # will get the page number of this bookmark
    bookmark_for_page_number: Optional[str] = None
    # will get the page number of the beginning of the bookmark if true, else the end
    use_beginning_of_bookmark: bool = True


class DocxTemplate(BaseModel):
    """Model for DOCX templates."""

    type: str = Field("DocxTemplate", Literal=True)
    id: str
    bookmark_name: Optional[str] = None
    docx_path: str  # relevant to the parent document
    exists: bool = False
    will_have_page_numbers: bool = True
    # Variables in the docx file. Determined by backend, not user.
    variables_in_doc: List[str] = []
    is_table_of_contents: bool = (
        False  # Used to flag the docx file as a table of contents
    )
    page_number_offset: Optional[int] = (
        0  # For when there will be additional pages prepended to the built pdf
    )
    needs_update: bool = False
    page_start_col: int = (
        3  # the col num of the start page number in the table. 0-indexed
    )
    page_end_col: Optional[int] = None


class FileData(BaseModel):
    """Model for file data."""

    type: str = Field("FileData", Literal=True)
    id: str
    file_path: str
    num_pages: Optional[int] = None  # in this document
    current_page_num: Optional[int] = None  # in the parent document
    bookmark_name: Optional[str] = None


class BookmarkRule(BaseModel):
    """Model for bookmark rules."""

    bookmark_name: str
    rule: str  # same logic as FileType.filename_text_to_match except on a pdf's text rather than filename
    # NOTE: if bookmark_name and rule are "SAMPLEID", then Merit Sample IDs are found and bookmarked


class FileType(BaseModel):
    """Model for file types."""

    type: str = Field("FileType", Literal=True)
    id: str
    bookmark_name: Optional[str] = None
    directory_source: str  # relevant to the parent section's base_directory
    filename_text_to_match: str  # In this document
    will_have_page_numbers: bool = True
    # if is_found, at least one file has been found. These are/is the file(s)
    files: List[FileData] = []
    needs_update: bool = False
    bookmark_rules: List[BookmarkRule] = []
    reorder_pages_metals: bool = False
    reorder_pages_datetime: bool = False
    keep_existing_bookmarks: bool = True


class Section(BaseModel):
    """Model for sections."""

    type: str = Field("Section", Literal=True)
    id: str
    bookmark_name: Optional[str] = None
    base_directory: str  # relevant to the parent document
    variables: List[TemplateVariable] = []
    method_codes: List[str] = []  # List of method codes associated with this section
    # At the end so the json file it formated easier to read
    children: List[Union[FileType, DocxTemplate, "Section"]] = []


## For Build Process


class BookmarkItem(BaseModel):
    """Model for bookmark items."""

    title: str
    page: int
    id: str
    page_end: Optional[int] = None
    is_table_of_contents: bool = False
    include_in_table_of_contents: bool = True
    parent: Optional["BookmarkItem"] = None
    outline_element: Optional[Any] = (
        None  # This is a placeholder for the outline element that will be created in the second pass
    )


# Request/Response models for API endpoints


class RPTExtractionRequest(BaseModel):
    """Request model for RPT extraction."""

    pdf_path: str
    output_json_path: str = None


class CreateDirectoryRequest(BaseModel):
    """Request model for creating directory structure from report."""

    base_path: str  # Where to create the directory structure
    report: dict  # The report structure
    analytical_report_path: str = None  # Path to the analytical report PDF (optional)
    extracted_data: dict = None  # Extracted data from the analytical report (optional)


class FilterTemplateRequest(BaseModel):
    """Request model for filtering a template based on method codes."""

    template_path: str  # Path to the template JSON file
    extracted_data: dict  # Data extracted from RPT
    output_path: str = None  # Optional path to save the filtered template
