from pydantic import BaseModel
from docx import Document
from docx2pdf import convert
from PyPDF2 import PdfReader, PdfWriter
import os


class TableEntry(BaseModel):
    title: str
    page_start: int
    page_end: int
    level: int  # 0-indexed depth of the bookmark


class TableDocument:
    def __init__(
        self,
        docx_path: str,
        page_start_col: int,
        level_delimiter: str = "   ",
        page_end_col: int | None = None,
        skiprows: int = 2,
    ):
        self.docx_path = docx_path
        self.doc = Document(docx_path)
        self.table = self.doc.tables[0]
        self.table_entries: list[TableEntry] = []
        self.set_page_start_col(page_start_col)
        self.set_page_end_col(page_end_col)
        self.level_delimiter = level_delimiter
        self.skiprows = skiprows

    def delete_row(self, row_index: int):
        tbl = self.table._tbl
        tr = self.table.rows[row_index]._tr
        tbl.remove(tr)

    def set_table_entries(self, table_entries: list[TableEntry]):
        self.table_entries = table_entries
        self.adjust_num_rows()
        self.update_cells()

    def adjust_num_rows(self):
        num_rows = len(self.table_entries)
        additional_rows = sum(
            1
            for i in range(num_rows - 1)
            if self.table_entries[i].level > self.table_entries[i + 1].level
        )
        total_rows_needed = num_rows + additional_rows
        num_rows_to_add = total_rows_needed - len(self.table.rows) + self.skiprows
        if num_rows_to_add > 0:
            for _ in range(num_rows_to_add):
                row = self.table.add_row()
                for cell in row.cells:
                    cell.text = ""  # Clear text in the newly added row
        elif num_rows_to_add < 0:
            for _ in range(-1 * num_rows_to_add):
                self.delete_row(-1)

    def set_page_start_col(self, page_start_col: int):
        self.page_start_col = (
            page_start_col - 1
        )  # user-specified starts at 1, but we need to adjust for 0-indexing

    def set_page_end_col(self, page_end_col: int | None):
        if page_end_col is not None:
            self.page_end_col = page_end_col - 1
        else:
            self.page_end_col = None

    def update_cells(self):
        row_idx_to_clear = []
        row_index = self.skiprows
        for i, entry in enumerate(self.table_entries):
            row = self.table.rows[row_index]
            row.cells[0].text = self.level_delimiter * entry.level + entry.title
            row.cells[self.page_start_col].text = str(entry.page_start)
            if self.page_end_col is not None:
                row.cells[self.page_end_col].text = str(entry.page_end)
            row_index += 1
            # Add a blank row if the current level is greater than the next level
            if (
                i < len(self.table_entries) - 1
                and entry.level > self.table_entries[i + 1].level
            ):
                row_idx_to_clear.append(row_index)
                row_index += 1
        for row_idx in row_idx_to_clear:
            for cell in self.table.rows[row_idx].cells:
                cell.text = ""

    def to_pdf(self) -> PdfReader:
        temp_path_docx = "intermediate.docx"
        temp_path_pdf = "intermediate.pdf"
        self.doc.save(temp_path_docx)
        convert(temp_path_docx, temp_path_pdf)
        reader = PdfReader(temp_path_pdf)
        os.remove(temp_path_docx)
        os.remove(temp_path_pdf)
        return reader

    def save(self):
        path = "output.docx"
        self.doc.save(path)
        return path


if __name__ == "__main__":
    # example data
    num_chapters = 30
    num_levels = 3

    docx_path = r"E:\Merit\pdfbuilder\Inventory Sheet Template.docx"

    bookmarks = []
    for chapter in range(1, num_chapters + 1):
        bookmarks.append(
            TableEntry(
                title=f"Chapter {chapter}",
                page_start=(chapter - 1) * 20 + 1,
                page_end=chapter * 20,
                level=0,
            )
        )
        for section in range(1, num_chapters + 1):
            bookmarks.append(
                TableEntry(
                    title=f"Section {chapter}.{section}",
                    page_start=(chapter - 1) * 20 + (section - 1) * 4 + 1,
                    page_end=(chapter - 1) * 20 + section * 4,
                    level=1,
                )
            )

    td = TableDocument(
        docx_path=docx_path,
        page_start_col=2,
        level_delimiter="   ",
        page_end_col=3,
        skiprows=2,
    )
    td.set_table_entries(bookmarks)
    pdf_reader = td.to_pdf()

    writer = PdfWriter()
    for page in pdf_reader.pages:
        writer.add_page(page)

    with open("output.pdf", "wb") as f:
        writer.write(f)
