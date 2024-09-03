# build.py
from PyPDF2 import PdfWriter, PdfReader
import os
from io import StringIO
from typing import Optional, Any
from pydantic import BaseModel
from buildpdf.convert_docx import convert_docx_template_to_pdf


def get_pdf_and_page_count(file_path):
    pdf = PdfReader(file_path)
    return pdf, len(pdf.pages)


def vars_to_mapping(variables):
    return {var["template_text"]: var["constant_value"] for var in variables}


def section_has_files(section):
    for child in section["children"]:
        if child["type"] == "docxTemplate":
            if child["exists"]:
                return True
        if child["type"] == "FileType":
            if len(child["files"]) > 0:
                return True
        if child["type"] == "Section":
            if section_has_files(child):
                return True
    return False


class BookmarkItem(BaseModel):
    title: str
    page: int
    parent: Optional["BookmarkItem"] = None
    outline_element: Optional[Any] = (
        None  # This is a placeholder for the outline element that will be created in the second pass
    )


def generate_pdf_pass_one(report: dict):

    writer_data = []
    bookmark_data = []
    current_page = 0

    def build_pdf_data(section, base_directory="./", root_bookmark=None):
        nonlocal current_page
        nonlocal writer_data
        nonlocal bookmark_data
        base_directory = os.path.join(base_directory, section["base_directory"])
        base_directory = os.path.normpath(base_directory)
        if section.get("bookmark_name") and section_has_files(section):
            root_bookmark = BookmarkItem(
                title=section["bookmark_name"], page=current_page, parent=root_bookmark
            )
            bookmark_data.append(root_bookmark)

        for child in section["children"]:
            if child["type"] == "DocxTemplate":
                if child["bookmark_name"] and child["exists"]:
                    bookmark_data.append(
                        BookmarkItem(
                            title=child["bookmark_name"],
                            page=current_page,
                            parent=root_bookmark,
                        )
                    )

                if child["exists"]:
                    docx_path = os.path.normpath(
                        os.path.join(base_directory, child["docx_path"])
                    )
                    _, num_pages = convert_docx_template_to_pdf(docx_path)
                    docx = {
                        "type": "docxTemplate",
                        "id": child["id"],
                        "path": docx_path,
                        "replacements": vars_to_mapping(section["variables"]),
                        "num_pages": num_pages,
                        "table_entries": child.get(
                            "table_entries"
                        ),  # or []?. Copilot suggested so maybe it's better.
                        "page_start": current_page,
                        "page_start_col": child.get("page_start_col"),
                        "page_end_col": child.get("page_end_col"),
                    }
                    writer_data.append(docx)
                    current_page += num_pages

            if child["type"] == "FileType":
                if child["bookmark_name"] and child["files"]:
                    file_type_bookmark = BookmarkItem(
                        title=child["bookmark_name"],
                        page=current_page,
                        parent=root_bookmark,
                    )
                    bookmark_data.append(file_type_bookmark)

                directory_source = os.path.normpath(
                    os.path.join(base_directory, child["directory_source"])
                )
                file_type_data = {
                    "type": "FileType",
                    "id": child["id"],
                    "directory_source": directory_source,
                    "page_start": current_page,
                }
                writer_data.append(file_type_data)
                for file in child["files"]:
                    file_path = os.path.normpath(
                        os.path.join(directory_source, file["file_path"])
                    )
                    pdf, num_pages = get_pdf_and_page_count(file_path)
                    file_data = {
                        "type": "FileData",
                        "id": file["id"],
                        "path": file_path,
                        "num_pages": num_pages,
                        "pdf": pdf,
                        "page_start": current_page,
                    }
                    writer_data.append(file_data)
                    current_page += num_pages

            if child["type"] == "Section":
                section_data = {
                    "type": "Section",
                    "id": child["id"],
                    "page_start": current_page,
                }
                writer_data.append(section_data)
                build_pdf_data(child, base_directory, root_bookmark)

    build_pdf_data(report)
    return writer_data, bookmark_data


def compose_pdf(writer_data: dict) -> PdfWriter:
    writer = PdfWriter()
    id_to_page_start = {
        data["id"]: data["page_start"] + 1 for data in writer_data
    }  # sections are not included in this mapping

    def compose_pdf_inner(writer_data):
        nonlocal writer
        nonlocal id_to_page_start
        for data in writer_data:
            if data["type"] == "docxTemplate":
                table_entries = {}
                for entry_name, entry_id in data["table_entries"]:
                    table_entries[entry_name] = id_to_page_start.get(entry_id)
                pdf, _ = convert_docx_template_to_pdf(
                    data["path"],
                    replacements=data["replacements"],
                    table_entries=table_entries,
                    page_start_col=data["page_start_col"],
                    page_end_col=data["page_end_col"],
                )
                writer.append(pdf, import_outline=False)
            if data["type"] == "FileData":
                writer.append(data["pdf"], import_outline=False)
            # if data["type"] == "Section":
            #     compose_pdf_inner(data)

    compose_pdf_inner(writer_data)
    return writer


def add_bookmarks(writer: PdfWriter, bookmarks: list):
    for bookmark in bookmarks:
        if bookmark.parent:
            parent = bookmark.parent.outline_element
        else:
            parent = None
        bookmark.outline_element = writer.add_outline_item(
            bookmark.title, bookmark.page, parent
        )
    return writer


def generate_pdf(report: dict, output_path: str):
    writer_data, bookmark_data = generate_pdf_pass_one(report)
    writer = compose_pdf(writer_data)
    writer = add_bookmarks(writer, bookmark_data)
    writer.write(output_path)
    return True
