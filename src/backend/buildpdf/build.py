import os
from typing import List, Dict, Any, Tuple, Union
from PyPDF2 import PdfWriter, PdfReader
from buildpdf.convert_docx import convert_docx_template_to_pdf
from buildpdf.page_level_bookmarks import get_page_level_bookmarks
from schema import BookmarkItem
from utils.reorder_metals_form1 import reorder_metals_form1
from utils.reorder_by_datetime_manually_integrated import reorder_pdfs_by_datetime
import uuid
from PyPDF2.generic import IndirectObject, Destination  # Import Destination


class PDFBuilder:
    def __init__(self):
        self.writer_data: List[Dict[str, Any]] = []
        self.bookmark_data: List[BookmarkItem] = []
        self.current_page: int = 1
        self.num_bookmarks: Union[int, None] = None
        self.table_of_contents_docx = None
        self.page_number_offset: int = (
            0  # used for table of contents. Adds a specified number to each page number
        )

    def generate_pdf(self, report: Dict[str, Any], output_path: str) -> bool:
        """
        Generates a PDF from the given report data and writes it to the output path.

        :param report: Dictionary containing report structure and data.
        :param output_path: Path where the generated PDF will be saved.
        :return: True if PDF generation is successful.
        """
        report["bookmark_name"] = None  # Remove top-level bookmark

        def toc_filename(pdf_path: str) -> str:
            return pdf_path.replace(".pdf", "_table_of_contents.docx")

        self.num_bookmarks = self._count_bookmarks(report)
        self._generate_pdf_pass_one(report)
        self._add_page_end_to_bookmarks()
        print("Pass one complete. Files are staged for processing. Processing files...")
        writer = self._compose_pdf()
        print("Pass two complete. Adding bookmarks...")
        self._add_bookmarks(writer)
        print("Bookmarks added. Saving PDF...")
        writer.write(output_path)
        if self.table_of_contents_docx:
            self.table_of_contents_docx.save(toc_filename(output_path))
        return True

    def _generate_pdf_pass_one(self, report: Dict[str, Any]) -> None:
        """
        First pass through the report data to process and collect writer and bookmark data.
        """
        self._build_pdf_data(report)

    def _count_bookmarks(self, report: Dict[str, Any]) -> int:
        """
        Counts the total number of bookmarks in the report.

        :param report: The report data dictionary.
        :return: The total number of bookmarks.
        """
        # Initialize num_bookmarks to 0 for each new count operation
        self.num_bookmarks = 0

        def count_recursive(section: Dict[str, Any]) -> int:
            count = 0
            for child in section.get("children", []):
                if child["type"] == "Section":
                    count += count_recursive(child)
                elif child["type"] == "FileType" and len(child["files"]) > 0:
                    if child["bookmark_name"] is not None:
                        count += 1
                    for file in child["files"]:
                        if file["bookmark_name"] is not None:
                            count += 1
                elif (
                    child["type"] == "DocxTemplate"
                    and child["exists"]
                    and child["bookmark_name"] is not None
                ):
                    count += 1
            return count

        self.num_bookmarks = count_recursive(report)
        return self.num_bookmarks

    def _build_pdf_data(
        self,
        section: Dict[str, Any],
        base_directory: str = "./",
        root_bookmark: BookmarkItem = None,
    ) -> None:
        """
        Recursively builds the PDF data from the report's sections and files.

        :param section: The current section of the report.
        :param base_directory: The base directory for resolving paths.
        :param root_bookmark: The parent bookmark for the current section.
        """
        base_directory = self._get_normalized_base_directory(base_directory, section)
        if not self._directory_exists(base_directory, section):
            return
        root_bookmark = self._create_root_bookmark_if_needed(section, root_bookmark)
        for child in section["children"]:
            self._process_child(child, base_directory, root_bookmark)

    def _process_child(
        self, child: Dict[str, Any], base_directory: str, root_bookmark: BookmarkItem
    ) -> None:
        """
        Processes individual children of a section, handling docxTemplates, FileTypes, and Sections.

        :param child: The child element to process.
        :param base_directory: The base directory for resolving paths.
        :param root_bookmark: The parent bookmark for the current section.
        """
        if child["type"] == "DocxTemplate":
            self._process_docx_template(child, base_directory, root_bookmark)
        elif child["type"] == "FileType":
            self._process_file_type(child, base_directory, root_bookmark)
        elif child["type"] == "Section":
            self._process_section(child, base_directory, root_bookmark)

    def _process_docx_template(
        self, child: Dict[str, Any], base_directory: str, root_bookmark: BookmarkItem
    ) -> None:
        """
        Processes a docxTemplate child, converting it to a PDF and adding the relevant metadata.

        :param child: The child element representing a docxTemplate.
        :param base_directory: The base directory for resolving paths.
        :param root_bookmark: The parent bookmark for the current section.
        """
        if child["exists"]:
            if child["bookmark_name"]:
                self.bookmark_data.append(
                    BookmarkItem(
                        title=child["bookmark_name"],
                        page=self.current_page,
                        parent=root_bookmark,
                        id=child["id"],
                    )
                )

            docx_path = os.path.normpath(
                os.path.join(base_directory, child["docx_path"])
            )
            _, num_pages, _ = convert_docx_template_to_pdf(
                docx_path,
                num_rows=self.num_bookmarks,
                is_table_of_contents=child.get("is_table_of_contents", False),
                page_start_col=child.get("page_start_col"),
                page_end_col=child.get("page_end_col"),
            )  # needs data to determine num_pages
            self.page_number_offset = child.get("page_number_offset", 0)
            docx_data = {
                "type": "docxTemplate",
                "id": child["id"],
                "path": docx_path,
                "replacements": self._map_template_variables(
                    child.get("variables", [])
                ),
                "num_pages": num_pages,
                "is_table_of_contents": child.get("is_table_of_contents", False),
                "page_start": self.current_page,
                "page_start_col": child.get("page_start_col"),
                "page_end_col": child.get("page_end_col"),
            }
            self.writer_data.append(docx_data)
            self.current_page += num_pages

    def _process_file_type(
        self, child: Dict[str, Any], base_directory: str, root_bookmark: BookmarkItem
    ) -> None:
        """
        Processes a FileType child, optionally reordering pages if required.

        :param child: The child element representing a FileType.
        :param base_directory: The base directory for resolving paths.
        :param root_bookmark: The parent bookmark for the current section.
        """
        keep_existing_bookmarks = child.get("keep_existing_bookmarks", False)
        if child.get("reorder_pages_metals"):
            self._process_file_type_with_reorder_metals(
                child, base_directory, root_bookmark, keep_existing_bookmarks
            )
        elif child.get("reorder_pages_datetime"):
            self._process_file_type_with_reorder_datetime(
                child, base_directory, root_bookmark, keep_existing_bookmarks
            )
        else:
            self._process_file_type_without_reorder(
                child, base_directory, root_bookmark, keep_existing_bookmarks
            )

    def _process_file_type_without_reorder(
        self,
        child: Dict[str, Any],
        base_directory: str,
        root_bookmark: BookmarkItem,
        keep_existing_bookmarks: bool,
    ) -> None:
        """
        Processes a FileType without reordering pages, adding metadata for the PDF.

        :param child: The child element representing a FileType.
        :param base_directory: The base directory for resolving paths.
        :param root_bookmark: The parent bookmark for the current section.
        :param keep_existing_bookmarks: Whether to keep existing bookmarks.
        """
        if not child["files"]:
            return  # Skip if there are no files

        file_type_bookmark = self._create_bookmark_if_needed(child, root_bookmark)
        directory_source = os.path.normpath(
            os.path.join(base_directory, child["directory_source"])
        )
        file_type_data = {
            "type": "FileType",
            "id": child["id"],
            "directory_source": directory_source,
            "page_start": self.current_page,
        }
        self.writer_data.append(file_type_data)

        for file in child["files"]:
            if not file.get("bookmark_rules"):
                file["bookmark_rules"] = child.get("bookmark_rules", [])
            self._process_file(
                file,
                directory_source,
                file_type_bookmark,
                keep_existing_bookmarks,
            )

    def _process_file_type_with_reorder_metals(
        self,
        child: Dict[str, Any],
        base_directory: str,
        root_bookmark: BookmarkItem,
        keep_existing_bookmarks: bool,
    ) -> None:
        """
        Processes a FileType with page reordering, using reorder_metals_form1.

        :param child: The child element representing a FileType.
        :param base_directory: The base directory for resolving paths.
        :param root_bookmark: The parent bookmark for the current section.
        :param keep_existing_bookmarks: Whether to keep existing bookmarks.
        """
        if not child["files"]:
            return  # Skip if there are no files

        if keep_existing_bookmarks:
            raise ValueError("keep_existing_bookmarks is not supported for reordering")

        file_type_bookmark = self._create_bookmark_if_needed(child, root_bookmark)
        pdf, num_pages = reorder_metals_form1(child["files"])

        page_level_bookmarks = get_page_level_bookmarks(
            pdf=pdf,
            rules=child["bookmark_rules"],
            parent_bookmark=file_type_bookmark,
            parent_page_num=self.current_page,
        )
        self.bookmark_data.extend(page_level_bookmarks)

        file_data = {
            "type": "FileData",
            "id": child["id"],
            "path": "None - Reordered",
            "num_pages": num_pages,
            "pdf": pdf,
            "page_start": self.current_page,
        }
        self.writer_data.append(file_data)
        self.current_page += num_pages

    def _process_file_type_with_reorder_datetime(
        self,
        child: Dict[str, Any],
        base_directory: str,
        root_bookmark: BookmarkItem,
        keep_existing_bookmarks: bool,
    ) -> None:
        """
        Processes a FileType with page reordering, using reorder_pdfs_by_datetime.

        :param child: The child element representing a FileType.
        :param base_directory: The base directory for resolving paths.
        :param root_bookmark: The parent bookmark for the current section.
        :param keep_existing_bookmarks: Whether to keep existing bookmarks.
        """
        if not child["files"]:
            return  # Skip if there are no files

        if keep_existing_bookmarks:
            raise ValueError("keep_existing_bookmarks is not supported for reordering")

        file_type_bookmark = self._create_bookmark_if_needed(child, root_bookmark)
        directory_source = os.path.normpath(
            os.path.join(base_directory, child["directory_source"])
        )
        file_paths = [
            os.path.join(directory_source, file["file_path"]) for file in child["files"]
        ]
        pdf, num_pages = reorder_pdfs_by_datetime(file_paths)

        page_level_bookmarks = get_page_level_bookmarks(
            pdf=pdf,
            rules=child["bookmark_rules"],
            parent_bookmark=file_type_bookmark,
            parent_page_num=self.current_page,
        )
        self.bookmark_data.extend(page_level_bookmarks)

        # Extract existing bookmarks from the PDF
        existing_bookmarks = self._extract_existing_bookmarks(pdf, file_type_bookmark)
        self.bookmark_data.extend(existing_bookmarks)

        file_data = {
            "type": "FileData",
            "id": child["id"],
            "path": "None - Reordered by datetime",
            "num_pages": num_pages,
            "pdf": pdf,
            "page_start": self.current_page,
        }
        self.writer_data.append(file_data)
        self.current_page += num_pages

    def _process_file(
        self,
        file: Dict[str, Any],
        directory_source: str,
        parent_bookmark: BookmarkItem,
        keep_existing_bookmarks: bool,
    ) -> None:
        """
        Processes an individual file within a FileType, adding its data to the writer.

        :param file: The file element to process.
        :param directory_source: The base directory for resolving the file path.
        :param parent_bookmark: The parent bookmark for the file.
        """
        file_path = os.path.normpath(os.path.join(directory_source, file["file_path"]))
        file_bookmark = self._create_bookmark_if_needed(file, parent_bookmark)
        pdf, num_pages = self._get_pdf_and_page_count(file_path)

        # Extract existing bookmarks from the PDF
        if keep_existing_bookmarks:
            existing_bookmarks = self._extract_existing_bookmarks(pdf, file_bookmark)
            # Add existing bookmarks to the bookmark data
            self.bookmark_data.extend(existing_bookmarks)

        page_level_bookmarks = get_page_level_bookmarks(
            pdf=pdf,
            rules=file.get("bookmark_rules", []),
            parent_bookmark=file_bookmark,
            parent_page_num=self.current_page,
        )
        self.bookmark_data.extend(page_level_bookmarks)

        file_data = {
            "type": "FileData",
            "id": file["id"],
            "path": file_path,
            "num_pages": num_pages,
            "pdf": pdf,
            "page_start": self.current_page,
        }
        self.writer_data.append(file_data)
        self.current_page += num_pages

    def _process_section(
        self, child: Dict[str, Any], base_directory: str, root_bookmark: BookmarkItem
    ) -> None:
        """
        Processes a Section child, building PDF data recursively.

        :param child: The child element representing a Section.
        :param base_directory: The base directory for resolving paths.
        :param root_bookmark: The parent bookmark for the current section.
        """
        section_data = {
            "type": "Section",
            "id": child["id"],
            "page_start": self.current_page,
        }
        self.writer_data.append(section_data)
        self._build_pdf_data(child, base_directory, root_bookmark)

    def _get_pdf_and_page_count(self, file_path: str) -> Tuple[PdfReader, int]:
        """
        Reads a PDF file and returns the PdfReader object and the number of pages.

        :param file_path: Path to the PDF file.
        :return: Tuple containing PdfReader object and number of pages.
        """
        pdf = PdfReader(file_path)
        return pdf, len(pdf.pages)

    def _map_template_variables(
        self, variables: List[Dict[str, Any]]
    ) -> Dict[str, str]:
        """
        Maps template variables to their replacement values.

        :param variables: List of variable dictionaries with template_text and constant_value.
        :return: Dictionary mapping template text to its constant value.
        """
        return {var["template_text"]: var["constant_value"] for var in variables}

    def _get_normalized_base_directory(
        self, base_directory: str, section: Dict[str, Any]
    ) -> str:
        """
        Normalizes the base directory path.

        :param base_directory: The base directory for resolving paths.
        :param section: The section containing a base_directory key.
        :return: Normalized base directory path.
        """
        return os.path.normpath(os.path.join(base_directory, section["base_directory"]))

    def _directory_exists(self, base_directory: str, section: Dict[str, Any]) -> bool:
        """
        Checks if a directory exists.

        :param base_directory: The directory to check.
        :param section: The section being processed.
        :return: True if the directory exists, False otherwise.
        """
        if not os.path.exists(base_directory):
            print(
                f"Directory {base_directory} does not exist. Skipping section {section.get('id', '')}"
            )
            return False
        return True

    def _create_root_bookmark_if_needed(
        self, section: Dict[str, Any], root_bookmark: BookmarkItem = None
    ) -> BookmarkItem:
        """
        Creates a root bookmark if the section has a bookmark_name and contains files.

        :param section: The section to create a bookmark for.
        :param root_bookmark: The parent bookmark, if any.
        :return: The newly created or existing root bookmark.
        """
        if section.get("bookmark_name") and self._section_has_files(section):
            new_bookmark = BookmarkItem(
                title=section["bookmark_name"],
                page=self.current_page,
                parent=root_bookmark,
                id=section["id"] if section.get("id") else "root",
            )
            self.bookmark_data.append(new_bookmark)
            return new_bookmark
        return root_bookmark

    def _section_has_files(self, section: Dict[str, Any]) -> bool:
        """
        Checks if a section contains files to process.

        :param section: The section to check.
        :return: True if the section contains files, False otherwise.
        """
        for child in section["children"]:
            if child["type"] == "docxTemplate" and child["exists"]:
                return True
            if child["type"] == "FileType" and len(child["files"]) > 0:
                return True
            if child["type"] == "Section" and self._section_has_files(child):
                return True
        return False

    def _create_bookmark_if_needed(
        self, item: Dict[str, Any], root_bookmark: BookmarkItem
    ) -> BookmarkItem:
        """
        Creates a bookmark if the item has a bookmark_name.

        :param item: The item to create a bookmark for.
        :param root_bookmark: The parent bookmark.
        :return: The newly created or existing root bookmark.
        """
        if item["bookmark_name"]:
            bookmark = BookmarkItem(
                title=item["bookmark_name"],
                page=self.current_page,
                parent=root_bookmark,
                id=item["id"],
            )
            self.bookmark_data.append(bookmark)
            return bookmark
        return root_bookmark

    def _compose_pdf(self) -> PdfWriter:
        """
        Composes the final PDF using the writer data and bookmark data.

        :return: PdfWriter object containing the composed PDF.
        """
        writer = PdfWriter()
        for data in self.writer_data:
            if data["type"] == "docxTemplate":
                pdf, _, modified_docx = convert_docx_template_to_pdf(
                    data["path"],
                    replacements=data["replacements"],
                    page_start_col=data.get("page_start_col"),
                    page_end_col=data.get("page_end_col"),
                    is_table_of_contents=data.get("is_table_of_contents", False),
                    bookmark_data=self.bookmark_data,
                    page_number_offset=self.page_number_offset,
                )
                if data.get("is_table_of_contents"):
                    self.table_of_contents_docx = modified_docx
                writer.append(pdf, import_outline=False)
            if data["type"] == "FileData":
                writer.append(data["pdf"], import_outline=False)
        return writer

    def _add_bookmarks(self, writer: PdfWriter) -> None:
        """
        Adds bookmarks to the PDF writer.

        :param writer: The PdfWriter object where the bookmarks will be added.
        """
        for bookmark in self.bookmark_data:
            parent = bookmark.parent.outline_element if bookmark.parent else None
            bookmark.outline_element = writer.add_outline_item(
                bookmark.title,
                bookmark.page - 1,
                parent,  # -1 because PyPDF2 is 0-indexed
            )

    def _add_page_end_to_bookmarks(self) -> None:
        """
        Adds the end page number to each bookmark.
        """
        total_pages = (
            self.current_page - 1
        )  # Assuming current_page is the next page after the last

        # Precompute levels for each bookmark
        bookmark_levels = []
        for bookmark in self.bookmark_data:
            level = 0
            parent = bookmark.parent
            while parent is not None:
                level += 1
                parent = parent.parent
            bookmark_levels.append(level)

        # Compute page_end for each bookmark
        for i in range(len(self.bookmark_data)):
            level_i = bookmark_levels[i]
            page_end = total_pages  # Default to the end of the document
            for j in range(i + 1, len(self.bookmark_data)):
                level_j = bookmark_levels[j]
                if level_j <= level_i:
                    page_end = self.bookmark_data[j].page - 1
                    break
            self.bookmark_data[i].page_end = page_end

    def _extract_existing_bookmarks(
        self, pdf: PdfReader, parent_bookmark: BookmarkItem
    ) -> List[BookmarkItem]:
        """
        Extracts existing bookmarks from a PDF and returns them as a list of BookmarkItems.

        :param pdf: The PdfReader object of the PDF.
        :param parent_bookmark: The parent bookmark for these bookmarks.
        :return: List of BookmarkItems representing the existing bookmarks.
        """
        existing_bookmarks = []

        def process_outline(outline, parent):
            if isinstance(outline, list):
                for item in outline:
                    process_outline(item, parent)
            elif isinstance(outline, Destination):
                # Convert the IndirectObject to an integer page number
                page_number = (
                    pdf.get_page_number(outline.page)
                    if isinstance(outline.page, IndirectObject)
                    else outline.page
                )
                bookmark = BookmarkItem(
                    title=outline.title,
                    page=page_number + self.current_page,  # Adjust page number
                    parent=parent,
                    id=str(uuid.uuid4()),
                    include_in_table_of_contents=False,
                )
                existing_bookmarks.append(bookmark)
                if hasattr(outline, "children"):
                    process_outline(outline.children, bookmark)

        process_outline(pdf.outline, parent_bookmark)
        return existing_bookmarks


# Usage
# report_data = {...}  # Report data dictionary
# builder = PDFBuilder()
# builder.generate_pdf(report_data, "output.pdf")
