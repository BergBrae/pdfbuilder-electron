import io
from PyPDF2 import PdfReader, PdfWriter
import re


def reorder_metals_form1(files):
    # returns (combined_pdf, num_pages)
    pdfs = [PdfReader(file["file_path"]) for file in files]
    num_pages = sum([file["num_pages"] for file in files])

    page_data = []
    for pdf in pdfs:
        for page in range(len(pdf.pages)):
            text = pdf.pages[page].extract_text()
            lab_sample_id = re.search(r"Lab Sample ID: (\S+)", text)
            data_set_id = re.search(r"Data Set ID: (\S+)", text)
            page_data.append(
                (
                    pdf.pages[page],
                    lab_sample_id.group(1) if lab_sample_id else "",
                    data_set_id.group(1) if data_set_id else "",
                    text,
                )
            )

    page_data.sort(key=lambda x: (x[1], x[2]))

    result_pdf = PdfWriter()
    for page in page_data:
        result_pdf.add_page(page[0])

    # Write the PdfWriter content to a BytesIO object
    pdf_bytes = io.BytesIO()
    result_pdf.write(pdf_bytes)
    pdf_bytes.seek(0)

    # Convert to PdfReader
    result_pdf = PdfReader(pdf_bytes)

    return result_pdf, num_pages
