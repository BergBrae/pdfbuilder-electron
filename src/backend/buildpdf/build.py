# build.py
from PyPDF2 import PdfWriter, PdfReader
import os
from io import StringIO
from typing import Optional, Any
from pydantic import BaseModel
from buildpdf.convert_docx import convert_docx_template_to_pdf
from buildpdf.page_level_bookmarks import get_page_level_bookmarks
from schema import BookmarkItem
from utils.reorder_metals_form1 import reorder_metals_form1


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


def process_file_type_without_reorder(
    child, base_directory, root_bookmark, current_page, writer_data, bookmark_data
):
    if child["bookmark_name"] and child["files"]:
        file_type_bookmark = BookmarkItem(
            title=child["bookmark_name"],
            page=current_page,
            parent=root_bookmark,
            id=child["id"],
        )
        bookmark_data.append(file_type_bookmark)
    else:
        file_type_bookmark = root_bookmark

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
        file_path = os.path.normpath(os.path.join(directory_source, file["file_path"]))

        if file.get("bookmark_name"):
            file_bookmark = BookmarkItem(
                title=file["bookmark_name"],
                page=current_page,
                parent=file_type_bookmark,
                id=file["id"],
            )
            bookmark_data.append(file_bookmark)
        else:
            file_bookmark = file_type_bookmark

        pdf, num_pages = get_pdf_and_page_count(file_path)

        page_level_bookmarks = get_page_level_bookmarks(
            pdf=pdf,
            rules=child["bookmark_rules"],
            parent_bookmark=file_bookmark,
            parent_page_num=current_page,
            reorder_pages=child.get("reorder_pages", False),
        )
        bookmark_data.extend(page_level_bookmarks)

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

    return current_page, writer_data, bookmark_data


def process_file_type_with_reorder(
    child, base_directory, root_bookmark, current_page, writer_data, bookmark_data
):
    if child["bookmark_name"] and child["files"]:
        file_type_bookmark = BookmarkItem(
            title=child["bookmark_name"],
            page=current_page,
            parent=root_bookmark,
            id=child["id"],
        )
        bookmark_data.append(file_type_bookmark)
    else:
        file_type_bookmark = root_bookmark

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

    pdf, num_pages = reorder_metals_form1(child["files"])

    page_level_bookmarks = get_page_level_bookmarks(
        pdf=pdf,
        rules=child["bookmark_rules"],
        parent_bookmark=file_type_bookmark,
        parent_page_num=current_page,
    )
    bookmark_data.extend(page_level_bookmarks)

    file_data = {
        "type": "FileData",
        "id": child["id"],
        "path": "None - Reordered",
        "num_pages": num_pages,
        "pdf": pdf,
        "page_start": current_page,
    }
    writer_data.append(file_data)
    current_page += num_pages

    return current_page, writer_data, bookmark_data


def generate_pdf_pass_one(report: dict):

    writer_data = []
    bookmark_data = []
    current_page = 1

    def build_pdf_data(section, base_directory="./", root_bookmark=None):
        nonlocal current_page
        nonlocal writer_data
        nonlocal bookmark_data
        base_directory = os.path.join(base_directory, section["base_directory"])
        base_directory = os.path.normpath(base_directory)

        # Add a check to see if the base_directory exists
        if not os.path.exists(base_directory):
            print(
                f"Directory {base_directory} does not exist. Skipping section {section.get('id', '')}"
            )
            return  # Skip this section if the directory does not exist

        if section.get("bookmark_name") and section_has_files(section):
            root_bookmark = BookmarkItem(
                title=section["bookmark_name"],
                page=current_page,
                parent=root_bookmark,
                id=section["id"] if section.get("id") else "root",
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
                            id=child["id"],
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
                # here we need to reorder the pages if child["reorder_pages"] is true
                if not child["reorder_pages"]:
                    current_page, writer_data, bookmark_data = (
                        process_file_type_without_reorder(
                            child,
                            base_directory,
                            root_bookmark,
                            current_page,
                            writer_data,
                            bookmark_data,
                        )
                    )
                else:
                    current_page, writer_data, bookmark_data = (
                        process_file_type_with_reorder(
                            child,
                            base_directory,
                            root_bookmark,
                            current_page,
                            writer_data,
                            bookmark_data,
                        )
                    )

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


def compose_pdf(writer_data: dict, bookmark_data: list[BookmarkItem]) -> PdfWriter:
    writer = PdfWriter()
    id_to_page_start_and_end = {
        bookmark.id: (bookmark.page, bookmark.page_end) for bookmark in bookmark_data
    }  # sections are not included in this mapping
    total_pages = sum([d.get("num_pages", 0) for d in writer_data])

    def compose_pdf_inner(writer_data):
        nonlocal writer
        nonlocal id_to_page_start_and_end
        nonlocal total_pages
        for data in writer_data:
            if data["type"] == "docxTemplate":
                table_entries = {}
                if data["table_entries"]:
                    for entry_name, entry_id in data["table_entries"]:
                        table_entries[entry_name] = id_to_page_start_and_end.get(
                            entry_id, ("", "")
                        )
                else:
                    table_entries = {}
                pdf, _ = convert_docx_template_to_pdf(
                    data["path"],
                    replacements=data["replacements"],
                    table_entries=table_entries,
                    page_start_col=data["page_start_col"],
                    page_end_col=data["page_end_col"],
                    total_pages=total_pages,
                )
                writer.append(pdf, import_outline=False)
            if data["type"] == "FileData":
                writer.append(data["pdf"], import_outline=False)
            # if data["type"] == "Section":
            #     compose_pdf_inner(data)

    compose_pdf_inner(writer_data)
    return writer


def add_bookmarks(writer: PdfWriter, bookmarks: list[BookmarkItem]):
    for bookmark in bookmarks:
        if bookmark.parent:
            parent = bookmark.parent.outline_element
        else:
            parent = None
        bookmark.outline_element = writer.add_outline_item(
            bookmark.title, bookmark.page - 1, parent  # -1 because PyPDF2 is 0-indexed
        )
    return writer


def add_page_end_to_bookmarks(bookmark_data: list[BookmarkItem]):
    for i in range(len(bookmark_data)):
        for j in range(i + 1, len(bookmark_data)):
            if bookmark_data[i].parent == bookmark_data[j].parent:
                bookmark_data[i].page_end = bookmark_data[j].page - 1
                break

            bookmark_data[i].page_end = (
                -1
            )  # signifies that the bookmark goes to the end of the document
    return bookmark_data


def generate_pdf(report: dict, output_path: str):
    writer_data, bookmark_data = generate_pdf_pass_one(report)
    bookmark_data = add_page_end_to_bookmarks(bookmark_data)
    print("Pass one complete. Files are staged for processing. Processing files...")
    writer = compose_pdf(writer_data, bookmark_data)
    print("Pass two complete. Adding bookmarks...")
    writer = add_bookmarks(writer, bookmark_data)
    print("Bookmarks added. Saving PDF...")
    writer.write(output_path)
    return True
