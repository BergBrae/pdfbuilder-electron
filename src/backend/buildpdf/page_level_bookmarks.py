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
    pattern = r"\d{7}\.d"
    matches = re.findall(pattern, text)
    for match in matches:
        text = text.replace(match, f"S{match[:5]}.{match[5:7]}")
    return text


def get_page_level_bookmarks(pdf, rules, parent_bookmark, parent_page_num):
    bookmarks = []
    for page in range(len(pdf.pages)):
        text = pdf.pages[page].extract_text()
        text = convert_sample_id_forms(text)
        for rule in rules:
            if (rule["rule"] == "SAMPLEID") and (rule["bookmark_name"] == "SAMPLEID"):
                expression = re.compile(r"S\d{5}\.\d{2}")
                match = expression.search(text)
                if match:
                    bookmark = BookmarkItem(
                        title=match.group(),
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
