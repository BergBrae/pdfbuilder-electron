from pydantic import BaseModel, Field
from typing import List, Optional, Union, ClassVar


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
    variables_in_doc: List[str] = []
    needs_update: bool = False


class FileData(BaseModel):
    type: str = Field("FileData", Literal=True)
    id: str
    file_path: str
    num_pages: Optional[int] = None  # in this document
    current_page_num: Optional[int] = None  # in the parent document


class FileType(BaseModel):
    type: str = Field("FileType", Literal=True)
    id: str
    bookmark_name: Optional[str] = None
    directory_source: str  # relevant to the parent section's base_directory
    filename_text_to_match: str  # In this document
    will_have_page_numbers: bool = True
    # if is_found, at least one file has been found. These are/is the file(s)
    files: List[FileData] = []
    needs_update: bool = False


class Section(BaseModel):
    type: str = Field("Section", Literal=True)
    id: str
    bookmark_name: Optional[str] = None
    base_directory: str  # relevant to the parent document
    variables: List[TemplateVariable] = []
    # At the end so the json file it formated easier to read
    children: List[Union[FileType, DocxTemplate, "Section"]] = []
