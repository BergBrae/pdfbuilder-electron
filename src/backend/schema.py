from pydantic import BaseModel, Field
from typing import Optional, Union, ClassVar, Any


class TemplateVariable(BaseModel):
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
    type: str = Field("DocxTemplate", Literal=True)
    id: str
    bookmark_name: Optional[str] = None
    docx_path: str  # relevant to the parent document
    exists: bool = False
    will_have_page_numbers: bool = True
    # Variables in the docx file. Determined by backend, not user.
    variables_in_doc: list[str] = []
    is_table_of_contents: bool = (
        False  # Used to flag the docx file as a table of contents
    )
    page_number_offset: Optional[int] = 0  # For when there will be additional pages prepended to the built pdf
    needs_update: bool = False
    page_start_col: int = (
        3  # the col num of the start page number in the table. 0-indexed
    )
    page_end_col: Optional[int] = None


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


class Section(BaseModel):
    type: str = Field("Section", Literal=True)
    id: str
    bookmark_name: Optional[str] = None
    base_directory: str  # relevant to the parent document
    variables: list[TemplateVariable] = []
    # At the end so the json file it formated easier to read
    children: list[Union[FileType, DocxTemplate, "Section"]] = []


## For Build Process


class BookmarkItem(BaseModel):
    title: str
    page: int
    id: str
    page_end: Optional[int] = None
    include_in_table_of_contents: bool = True
    parent: Optional["BookmarkItem"] = None
    outline_element: Optional[Any] = (
        None  # This is a placeholder for the outline element that will be created in the second pass
    )
