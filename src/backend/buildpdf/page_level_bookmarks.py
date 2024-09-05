from PyPDF2 import PdfReader
from schema import BookmarkItem
from utils.qualify_filename import qualify_filename


def get_page_level_bookmarks(pdf, rules, parent_bookmark, parent_page_num):
    bookmarks = []
    for page in range(len(pdf.pages)):
        text = pdf.pages[page].extract_text()
        for rule in rules:
            if qualify_filename(rule["rule"], text):
                bookmark = BookmarkItem(
                    title=rule["bookmark_name"],
                    page=parent_page_num + page,
                    parent=parent_bookmark,
                )
                bookmarks.append(bookmark)

    # idx_to_remove = (
    #     []
    # )  # Consecutive bookmarks with page numbers that are one apart should be removed
    # for i in range(len(bookmarks) - 1):
    #     j = i + 1
    #     if (bookmarks[i].page == bookmarks[j].page - 1) and (
    #         bookmarks[i].title == bookmarks[j].title
    #     ):
    #         idx_to_remove.append(j)

    # for idx in reversed(idx_to_remove):
    #     bookmarks.pop(idx)

    return bookmarks
