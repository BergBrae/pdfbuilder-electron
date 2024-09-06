# convert_docx.py
import os
from docx import Document
from python_docx_replace import docx_replace, docx_get_keys
from docx2pdf import convert
from PyPDF2 import PdfReader
from buildpdf.table_entries import TableEntry, TableEntryData


def get_variables_in_docx(docx_path):
    # Create an object of the Document class
    document = Document(docx_path)

    # Get the keys in the DOCX file
    try:
        keys = docx_get_keys(document)
    except Exception as e:
        keys = [f"Error: {e}"]
    return keys


def replace_text_in_docx(docx_path, replacements):
    # Create an object of the Document class
    document = Document(docx_path)

    # Replace the text in the DOCX file
    docx_replace(document, **replacements)

    # Save the modified DOCX file
    modified_docx_path = docx_path.replace(".docx", "_modified.docx")
    document.save(modified_docx_path)
    return modified_docx_path


def convert_docx_to_pdf(docx_path):
    pdf_path = docx_path.replace(".docx", ".pdf")

    convert(docx_path, pdf_path)
    return pdf_path


def update_table_of_contents(
    docx_path, table_entries, page_start_col, page_end_col, total_pages
):
    doc = Document(docx_path)
    table = doc.tables[0]
    num_rows = len(table.rows)
    for i in range(num_rows):
        entry = TableEntry(table, i, page_start_col, page_end_col)
        if entry.name in table_entries:
            page_start = table_entries[entry.name][0]
            page_end = table_entries[entry.name][1]
            if page_end == -1:
                page_end = total_pages
            entry.set_page_start(page_start)
            entry.set_page_end(page_end)
    new_docx_path = docx_path.replace(".docx", "_updated_toc.docx")
    doc.save(new_docx_path)
    return new_docx_path


def convert_docx_template_to_pdf(
    docx_path,
    replacements=None,
    table_entries=None,
    page_start_col=None,
    page_end_col=None,
    total_pages=None,
):
    intermediate_files = []

    # If there are replacements to be made, do them in the DOCX file
    if replacements:
        modified_docx_path = replace_text_in_docx(docx_path, replacements)
        intermediate_files.append(modified_docx_path)
    else:
        modified_docx_path = None

    if table_entries:
        modified_docx_path = update_table_of_contents(
            modified_docx_path if modified_docx_path else docx_path,
            table_entries,
            page_start_col,
            page_end_col,
            total_pages,
        )

    # Convert the modified DOCX file to PDF
    pdf_path = convert_docx_to_pdf(
        modified_docx_path if modified_docx_path else docx_path
    )

    (os.remove(modified_docx_path) if modified_docx_path else None)

    # Cleanup intermediate files
    for file_path in intermediate_files:
        if os.path.exists(file_path):
            os.remove(file_path)

    pdf_reader = PdfReader(pdf_path)
    pdf_reader_file_path = pdf_path

    # Cleanup the resulting PDF file
    if os.path.exists(pdf_reader_file_path):
        os.remove(pdf_reader_file_path)

    return (pdf_reader, len(pdf_reader.pages))
