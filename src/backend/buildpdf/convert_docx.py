import os
from docx import Document
from docx2pdf import convert
from PyPDF2 import PdfReader


def replace_text_in_docx(docx_path, replacements):
    # Create an object of the Document class
    document = Document(docx_path)

    # Replace text based on the replacements dictionary
    for key, value in replacements.items():
        for p in document.paragraphs:  # also try p.runs
            if p.text.find(key) >= 0:
                p.text = p.text.replace(key, value)

    # Save the modified DOCX file
    modified_docx_path = docx_path.replace(".docx", "_modified.docx")
    document.save(modified_docx_path)
    return modified_docx_path


def convert_docx_to_pdf(docx_path):
    pdf_path = docx_path.replace(".docx", ".pdf")

    convert(docx_path, pdf_path)
    return pdf_path


def convert_docx_template_to_pdf(docx_path, replacements=None):
    intermediate_files = []

    # If there are replacements to be made, do them in the DOCX file
    if replacements:
        modified_docx_path = replace_text_in_docx(docx_path, replacements)
        intermediate_files.append(modified_docx_path)
    else:
        modified_docx_path = docx_path

    # Convert the modified DOCX file to PDF
    pdf_path = convert_docx_to_pdf(modified_docx_path)

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


# Example usage
if __name__ == "__main__":
    input_file = r"C:\Users\guest2\Documents\DocxTemplate-testing\testing-template.docx"
    replacements_dict = {
        "{VAR1}": "Variable One",
        "{VAR2}": "Variable Two",
        "{VAR3}": "Variable Three",
        "{VAR4}": "Variable Four",
    }
    pdf_reader = convert_docx_template_to_pdf(input_file, replacements_dict)
    print(f"PDF file content read successfully.")
