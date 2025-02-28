"""
Validation service for report validation.
"""

import json
import os
import re
import glob
from fastapi import HTTPException


def validate_paths(report, cwd="/"):
    """
    Validate all paths in the report.

    Args:
        report: The report to validate
        cwd: The current working directory

    Returns:
        True if all paths are valid, otherwise an error message
    """
    base_directory = os.path.join(cwd, report["base_directory"])

    for child in report["children"]:
        if child["type"] == "DocxTemplate":
            docx_path = os.path.join(base_directory, child["docx_path"])
            docx_path = os.path.normpath(docx_path)
            if not os.path.exists(docx_path):
                return f"Error: docx_path ({docx_path}) does not exist for {child['bookmark_name']}"
            if not os.path.isfile(docx_path):
                return f"Error: docx_path ({docx_path}) is not a file for {child['bookmark_name']}"
            if not (
                docx_path.lower().endswith(".docx")
                or docx_path.lower().endswith(".doc")
            ):
                return f"Error: docx_path ({docx_path}) is not a docx file for {child['bookmark_name']}"

        if child["type"] == "FileType":
            directory_source = os.path.join(base_directory, child["directory_source"])
            directory_source = os.path.normpath(directory_source)
            if not os.path.exists(directory_source):
                return f"Error: directory_source ({directory_source}) does not exist for file {child['bookmark_name']}"
            if not os.path.isdir(directory_source):
                return f"Error: directory_source ({directory_source}) is not a directory for file {child['bookmark_name']}"

            for index, file in enumerate(child["files"]):
                file_path = os.path.join(directory_source, file["file_path"])
                file_path = os.path.normpath(file_path)
                if not os.path.exists(file_path):
                    return f"Error: file_path ({file_path}) does not exist for the {index+1}th file in FileType {child['bookmark_name']}"
                if not os.path.isfile(file_path):
                    return f"Error: file_path ({file_path}) is not a file for the {index+1}th file in FileType {child['bookmark_name']}"
                if not file_path.lower().endswith(".pdf"):
                    return f"Error: file_path ({file_path}) is not a pdf file for the {index+1}th file in FileType {child['bookmark_name']}"

        if child["type"] == "Section":
            result = validate_paths(child, base_directory)
            if result is not True:
                return result

    return True


def validate_page_numbers(report):
    """
    Validate page numbers in the report.

    Args:
        report: The report to validate

    Returns:
        True if page numbers are valid, otherwise an error message
    """

    def DFT(report):
        flattened = []
        for child in report["children"]:
            if child["type"] == "DocxTemplate":
                flattened.append(child)
            if child["type"] == "FileType":
                flattened.append(child)
            if child["type"] == "Section":
                flattened.extend(DFT(child))
        return flattened

    flattened = DFT(report)
    page_numbers_started = (
        False  # start without page numbers. Can only turn on and off once
    )
    page_numbers_ended = False
    for child in flattened:
        if child["will_have_page_numbers"]:
            if page_numbers_ended:
                return f"Error: page numbers ended before {child['bookmark_name']}"
            if not page_numbers_started:
                page_numbers_started = True
        else:
            if page_numbers_started:
                page_numbers_ended = True

    return True


def validate_table(report):
    """
    Validate table of contents in the report.

    Args:
        report: The report to validate

    Returns:
        True if table of contents is valid, otherwise an error message
    """
    # Make sure there is only one table of contents
    table_of_contents_count = 0
    for child in report["children"]:
        if child["type"] == "DocxTemplate" and child["is_table_of_contents"]:
            table_of_contents_count += 1
    if table_of_contents_count > 1:
        return "Error: There is more than one table of contents"
    return True


def validate_report(report):
    """
    Validate the entire report.

    Args:
        report: The report to validate

    Returns:
        True if the report is valid, otherwise an error message
    """
    result = validate_paths(report)
    if result is not True:
        return result
    result = validate_page_numbers(report)
    if result is not True:
        return result
    result = validate_table(report)
    if result is not True:
        return result
    return True


def validate_and_raise(report):
    """
    Validate the report and raise an HTTPException if invalid.

    Args:
        report: The report to validate

    Raises:
        HTTPException: If the report is invalid
    """
    result = validate_report(report)
    if result is not True:
        raise HTTPException(status_code=400, detail=result)
    return True
