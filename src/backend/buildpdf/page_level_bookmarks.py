from PyPDF2 import PdfReader
from schema import BookmarkItem
from utils.qualify_filename import qualify_filename
import re
import uuid


def remove_consecutive_bookmarks(bookmarks):
    new_bookmarks = []
    for i, bookmark in enumerate(bookmarks):
        if i == 0:
            new_bookmarks.append(bookmark)
        elif bookmark.title != bookmarks[i - 1].title:
            new_bookmarks.append(bookmark)
    return new_bookmarks


def convert_sample_id_forms(text):
    # In some of the socuments, the sample id is listed as 1234567.d instead of S12345.01
    # This function converts the sample id to the correct format
    pattern = r"\b\d{7}\.d\b"
    matches = re.findall(pattern, text)
    for match in matches:
        text = text.replace(match, f"S{match[:5]}.{match[5:7]}")
    return text


def get_page_level_bookmarks(
    pdf, rules, parent_bookmark, parent_page_num, reorder_pages=False
):
    bookmarks = []
    page_data = []

    for page in range(len(pdf.pages)):
        text = pdf.pages[page].extract_text()
        text = convert_sample_id_forms(text)
        lab_sample_id = re.search(r"Lab Sample ID: (\S+)", text)
        data_set_id = re.search(r"Data Set ID: (\S+)", text)
        page_data.append(
            (
                page,
                lab_sample_id.group(1) if lab_sample_id else "",
                data_set_id.group(1) if data_set_id else "",
                text,
            )
        )

    if reorder_pages:
        page_data.sort(key=lambda x: (x[1], x[2]))

    for page, lab_sample_id, data_set_id, text in page_data:
        for rule in rules:
            if (rule["rule"] == "SAMPLEID") and (rule["bookmark_name"] == "SAMPLEID"):
                expression = re.compile(
                    r"(?<!-)(?<!Report ID: )(S\d{5}\.\d{2})(?!-)"
                )  # Negative lookbehind to exclude "Report Id: S12345.67"
                matches = expression.findall(text)
                if (
                    matches and len(set(matches)) == 1
                ):  # Ensure all matches are the same
                    bookmark = BookmarkItem(
                        title=matches[0],
                        page=parent_page_num + page,
                        parent=parent_bookmark,
                        id=str(uuid.uuid4()),
                    )
                    bookmarks.append(bookmark)
            elif qualify_filename(rule["rule"], text):
                bookmark = BookmarkItem(
                    title=rule["bookmark_name"],
                    page=parent_page_num + page,
                    parent=parent_bookmark,
                    id=str(uuid.uuid4()),
                )
                bookmarks.append(bookmark)

    bookmarks = remove_consecutive_bookmarks(bookmarks)

    return bookmarks


if __name__ == "__main__":
    print(convert_sample_id_forms("Testing testing 1234567.d S12345.67"))
