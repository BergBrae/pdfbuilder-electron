from PyPDF2 import PdfReader
from schema import BookmarkItem
from utils.qualify_filename import qualify_filename
import re


def remove_consecutive_bookmarks(bookmarks):
    new_bookmarks = []
    for i, bookmark in enumerate(bookmarks):
        if i == 0:
            new_bookmarks.append(bookmark)
        elif bookmark.title != bookmarks[i - 1].title:
            new_bookmarks.append(bookmark)
    return new_bookmarks


def get_page_level_bookmarks(pdf, rules, parent_bookmark, parent_page_num):
    bookmarks = []
    for page in range(len(pdf.pages)):
        text = pdf.pages[page].extract_text()
        for rule in rules:
            if rule["rule"] == "SAMPLEID" == rule["bookmark_name"]:
                expression = re.compile(r"S\d{5}\.\d{2}")
                match = expression.search(text)
                if match:
                    bookmark = BookmarkItem(
                        title=match.group(),
                        page=parent_page_num + page,
                        parent=parent_bookmark,
                    )
                    bookmarks.append(bookmark)
            elif qualify_filename(rule["rule"], text):
                bookmark = BookmarkItem(
                    title=rule["bookmark_name"],
                    page=parent_page_num + page,
                    parent=parent_bookmark,
                )
                bookmarks.append(bookmark)

    bookmarks = remove_consecutive_bookmarks(bookmarks)

    return bookmarks
