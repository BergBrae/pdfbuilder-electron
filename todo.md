- Add option in PDFType to set subbookmarks for each file in the FileType. Default filename - .pdf but allow changing
- Add allow specifiying page-level bookmarking rules. Rules are specified on FileType level. Consecutive pages with the same bookmark have [1:] removed.

  - if bookmarking rules are specified but File-level bookmarks are turned off, the page-level bookmarks' parent should be that of the FileType.

- Auto-fill docx-templates with data from analytical report

  - Remove page number toggle and update schema to not use page nums in variables. Use table method instead.

-
- Write validate_table_entries()
- Show failure detail in front end when building fails.
- Create custom accordion that can hold buttons in the header properly.
