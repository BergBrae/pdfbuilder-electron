# convert_docx.py
import os
from docx import Document
from python_docx_replace import docx_replace, docx_get_keys
from docx2pdf import convert
from PyPDF2 import PdfReader

# from buildpdf.table_entries.table_entries import TableEntry, TableEntryData
from buildpdf.table_entries.table_document import TableDocument, TableEntry
from schema import BookmarkItem


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


def convert_bookmark_data_to_table_entries(
    bookmark_data: list[BookmarkItem],
) -> list[TableEntry]:
    def get_level(bookmark: BookmarkItem, level: int = 0) -> int:
        if bookmark.parent is None:
            return level
        return get_level(bookmark.parent, level + 1)

    table_entries = []
    for bookmark in bookmark_data:
        if bookmark.include_in_table_of_contents:
            level = get_level(bookmark)
            table_entry = TableEntry(
                title=bookmark.title,
                page_start=bookmark.page,
                page_end=(
                    bookmark.page_end
                    if bookmark.page_end is not None
                    else bookmark.page
                ),
                level=level,
            )
            table_entries.append(table_entry)
    return table_entries


def convert_docx_template_to_pdf(
    docx_path,
    replacements=None,
    page_start_col=None,
    page_end_col=None,
    page_number_offset=0,
    total_pages=None,
    is_table_of_contents=False,
    bookmark_data=None,
):
    intermediate_files = []

    # If there are replacements to be made, do them in the DOCX file
    if replacements:
        try:
            modified_docx_path = replace_text_in_docx(docx_path, replacements)
            intermediate_files.append(modified_docx_path)
        except Exception as e:
            print(f"Error replacing text in DOCX: {str(e)}")
            # Proceed with the original file if text replacement fails
            modified_docx_path = None
    else:
        modified_docx_path = None

    if is_table_of_contents:
        try:
            table_doc = TableDocument(
                docx_path=modified_docx_path if modified_docx_path else docx_path,
                page_start_col=page_start_col,
                page_end_col=page_end_col,
                skiprows=2,
                page_number_offset=page_number_offset,
            )
            if bookmark_data:
                table_entries = convert_bookmark_data_to_table_entries(bookmark_data)
                table_doc.set_table_entries(table_entries)
                table_doc.adjust_num_rows()

            modified_docx_path = table_doc.save()
        except Exception as e:
            print(f"Error updating table of contents: {str(e)}")

    # Convert the modified DOCX file to PDF
    try:
        pdf_path = convert_docx_to_pdf(
            modified_docx_path if modified_docx_path else docx_path
        )

        if is_table_of_contents:
            # Load the modified docx so it can be exported alongside the PDF
            modified_docx_reader = Document(modified_docx_path)
        else:
            modified_docx_reader = None

        # Clean up intermediate files
        if modified_docx_path:
            try:
                os.remove(modified_docx_path)
            except Exception as e:
                print(
                    f"Error removing intermediate file {modified_docx_path}: {str(e)}"
                )

        # Clean up other intermediate files
        for file_path in intermediate_files:
            if file_path != modified_docx_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception as e:
                    print(f"Error removing intermediate file {file_path}: {str(e)}")

        # Read the PDF file
        try:
            pdf_reader = PdfReader(pdf_path)
            num_pages = len(pdf_reader.pages)

            # Cleanup the resulting PDF file ONLY if we successfully read it
            try:
                os.remove(pdf_path)
            except Exception as e:
                print(f"Error removing PDF file {pdf_path}: {str(e)}")

            return (pdf_reader, num_pages, modified_docx_reader)
        except Exception as e:
            print(f"Error reading PDF file {pdf_path}: {str(e)}")
            raise

    except Exception as e:
        print(f"Error converting DOCX to PDF: {str(e)}")
