import os
from spire.doc import Document, FileFormat
from PyPDF2 import PdfReader


def doc_to_docx(doc_path):
    # Create an object of the Document class
    document = Document()
    # Load a Word DOC file
    document.LoadFromFile(doc_path)

    # Save the DOC file to DOCX format
    docx_path = f"{doc_path}.docx"
    document.SaveToFile(docx_path, FileFormat.Docx)
    # Close the Document object
    document.Close()
    return docx_path


def replace_text_in_docx(doc_path, replacements):
    # Create an object of the Document class
    document = Document()
    # Load a Word DOCX file
    document.LoadFromFile(doc_path)

    # Replace text based on the replacements dictionary
    for key, value in replacements.items():
        document.Replace(key, value, True, True)

    # Save the modified DOCX file
    modified_docx_path = doc_path.replace(".docx", "_modified.docx")
    document.SaveToFile(modified_docx_path, FileFormat.Docx)
    # Close the Document object
    document.Close()
    return modified_docx_path


def convert_doc_to_pdf(doc_path, replacements=None):
    intermediate_files = []

    # If the input file is a DOC file, convert it to DOCX
    if doc_path.lower().endswith(".doc"):
        docx_path = doc_to_docx(doc_path)
        intermediate_files.append(docx_path)
    else:
        docx_path = doc_path

    # If there are replacements to be made, do them in the DOCX file
    if replacements:
        modified_docx_path = replace_text_in_docx(docx_path, replacements)
        intermediate_files.append(modified_docx_path)
    else:
        modified_docx_path = docx_path

    # Create an object of the Document class
    document = Document()
    # Load the modified DOCX file
    document.LoadFromFile(modified_docx_path)

    # Save the DOCX file to PDF format
    pdf_path = modified_docx_path.replace(".docx", ".pdf")
    document.SaveToFile(pdf_path, FileFormat.PDF)
    # Close the Document object
    document.Close()

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
    input_file = r"C:\Users\guest2\Documents\Level.III\BWL\58313\COVER.58313.doc"
    replacements_dict = {"{NAME}": "Brady"}
    pdf_reader = convert_doc_to_pdf(input_file, replacements_dict)
    print(f"PDF file content read successfully.")
