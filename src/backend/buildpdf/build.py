from PyPDF2 import PdfWriter, PdfReader
import os
from io import StringIO
from buildpdf.convert_docx import convert_docx_template_to_pdf


def get_pdf_and_page_count(file_path):
    pdf = PdfReader(file_path)
    return pdf, len(pdf.pages)


def vars_to_mapping(variables):
    return {var['template_text']: var['constant_value'] for var in variables}


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


def generate_pdf(report: dict, output_path: str):
    if os.path.isdir(output_path):
        output_path = os.path.join(output_path, "output.pdf")

    writer = PdfWriter()
    current_page = 0

    def build_pdf(section, base_directory="./", root_bookmark=None):
        nonlocal current_page
        base_directory = os.path.join(base_directory, section["base_directory"])
        base_directory = os.path.normpath(base_directory)
        if section.get("bookmark_name") and section_has_files(section):
            root_bookmark = writer.add_outline_item(
                section["bookmark_name"], current_page, root_bookmark
            )

        for child in section["children"]:
            if child["type"] == "DocxTemplate":
                if child["bookmark_name"] and child["exists"]:
                    writer.add_outline_item(
                        child["bookmark_name"], current_page, root_bookmark
                    )

                if child["exists"]:
                    docx_path = os.path.normpath(
                        os.path.join(base_directory, child["docx_path"])
                    )
                    pdf, num_pages = convert_docx_template_to_pdf(
                        docx_path, replacements=vars_to_mapping(section["variables"])
                    )
                    writer.append(pdf, import_outline=False)
                    current_page += num_pages

            if child["type"] == "FileType":
                if child["bookmark_name"] and child["files"]:
                    writer.add_outline_item(
                        child["bookmark_name"], current_page, root_bookmark
                    )

                directory_source = os.path.normpath(
                    os.path.join(base_directory, child["directory_source"])
                )
                for file in child["files"]:
                    file_path = os.path.normpath(
                        os.path.join(directory_source, file["file_path"])
                    )
                    pdf, num_pages = get_pdf_and_page_count(file_path)
                    writer.append(pdf, import_outline=False)
                    current_page += num_pages

            if child["type"] == "Section":
                build_pdf(child, base_directory, root_bookmark)

    build_pdf(report)
    writer.write(output_path)
    return current_page
