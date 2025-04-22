from pydantic import BaseModel, Field
from typing import Optional, Union, ClassVar, Any


class BookmarkRule(BaseModel):
    bookmark_name: str
    rule: str  # same logic as FileType.filename_text_to_match except on a pdf's text rather than filename
    # NOTE: if bookmark_name and rule are "SAMPLEID", then Merit Sample IDs are found and bookmarked


class FileData(BaseModel):
    type: str = Field("FileData", Literal=True)
    id: str
    file_path: str
    num_pages: Optional[int] = None  # in this document
    current_page_num: Optional[int] = None  # in the parent document
    bookmark_name: Optional[str] = None


class BookmarkRule(BaseModel):
    bookmark_name: str
    rule: str  # same logic as FileType.filename_text_to_match except on a pdf's text rather than filename
    # NOTE: if bookmark_name and rule are "SAMPLEID", then Merit Sample IDs are found and bookmarked


class FileType(BaseModel):
    type: str = Field("FileType", Literal=True)
    id: str
    bookmark_name: Optional[str] = None
    directory_source: str  # relevant to the parent section's base_directory
    filename_text_to_match: str  # In this document
    will_have_page_numbers: bool = True
    # if is_found, at least one file has been found. These are/is the file(s)
    files: list[FileData] = []
    needs_update: bool = False
    bookmark_rules: list[BookmarkRule] = []
    reorder_pages_metals: bool = False
    reorder_pages_datetime: bool = False
    keep_existing_bookmarks: bool = True
    # DocxTemplate compatibility fields
    is_table_of_contents: bool = False
    page_number_offset: Optional[int] = 0
    page_start_col: int = 3
    page_end_col: Optional[int] = None
    variables_in_doc: list[str] = []


class Section(BaseModel):
    type: str = Field("Section", Literal=True)
    id: str
    bookmark_name: Optional[str] = None
    base_directory: str  # relevant to the parent document
    method_codes: list[str] = []  # List of method codes associated with this section
    # At the end so the json file it formated easier to read
    children: list[Union[FileType, "Section"]] = []


## For Build Process


class BookmarkItem(BaseModel):
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
