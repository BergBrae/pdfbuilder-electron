from PyPDF2 import PdfWriter, PdfReader, PageObject
import re
import datetime as dt
from pydantic import BaseModel
from typing import Optional
import os


class PdfPage(BaseModel):
    pdf_pages: list[
        PageObject
    ]  # usually will only have one page. Has multiple when there are pages without datetime
    datetime: Optional[dt.datetime]
    is_manually_integrated: Optional[bool]
    original_pdf_path: str

    class Config:
        arbitrary_types_allowed = True


def pages_are_equal(page1: PdfPage, page2: PdfPage) -> bool:
    return (
        page1.datetime == page2.datetime
        and page1.is_manually_integrated == page2.is_manually_integrated
    )


def get_datetime_from_text(text: str) -> dt.datetime:
    pattern = r"\d{2}-\w{3}-\d{4}\s+/\s+\d{2}:\d{2}"
    matches = re.findall(pattern, text)
    if not matches:
        return None
    match = matches[0].replace(" ", "")
    return dt.datetime.strptime(match, "%d-%b-%Y/%H:%M")


def get_is_manually_integrated(text: str) -> bool:
    pattern = r"\d.+(BMB\s?\*|BM\s?\*|MB\s?\*)"  # matches a row with a BMB, BM or MB that has asterisk
    matches = re.findall(pattern, text)
    return bool(matches)


def reorder_pdfs_by_datetime(paths: list[str], return_path: bool = False) -> Optional[PdfReader, str]:
    """
    This reorder function is made for reordering the pages within pdfs based on datetime and if the page has been manually integrated.
    """
    all_pages = []
    for path in paths:
        pdf = PdfReader(path)
        for page in pdf.pages:
            text = page.extract_text()
            datetime = get_datetime_from_text(text)
            is_manually_integrated = get_is_manually_integrated(text)
            if not datetime:
                all_pages[-1].pdf_pages.append(page)
                all_pages[-1].is_manually_integrated = (
                    is_manually_integrated or all_pages[-1].is_manually_integrated
                )
            else:
                all_pages.append(
                    PdfPage(
                        pdf_pages=[page],
                        datetime=datetime,
                        is_manually_integrated=is_manually_integrated,
                        original_pdf_path=path,
                    )
                )

    all_pages = sorted(
        all_pages, key=lambda x: (x.datetime, int(x.is_manually_integrated) * -1)
    )

    to_remove = []
    for i in range(1, len(all_pages)):
        if pages_are_equal(all_pages[i], all_pages[i - 1]):
            to_remove.append(i)

    for i in sorted(to_remove, reverse=True):
        all_pages.pop(i)

    writer = PdfWriter()
    for page in all_pages:
        for pdf_page in page.pdf_pages:
            writer.add_page(pdf_page)
    output_path = "temp.pdf"
    writer.write(output_path)

    if return_path:
        return output_path

    pdf = PdfReader(output_path)
    os.remove(output_path)
    return pdf


if __name__ == "__main__":
    paths = [
        r"Z:\pdfbuilder\IC-A-241010-Pre-Man-Int.pdf",
        r"Z:\pdfbuilder\IC-A-241010.pdf",
    ]
    reordered_pdf = reorder_pdfs_by_datetime(paths)
