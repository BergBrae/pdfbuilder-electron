"""
API endpoints for PDF building operations.
"""

from fastapi import APIRouter, HTTPException
import os
import json
import platform

from app.models.schemas import FilterTemplateRequest
from buildpdf.build import PDFBuilder


router = APIRouter()


@router.post("/build")
def build_pdf(data: dict, output_path: str):
    """
    Build a PDF from a report.

    Args:
        data: The report data
        output_path: The path to save the PDF to

    Returns:
        dict: A success message with the output path
    """
    # Initialize pythoncom on Windows
    if platform.system() == "Windows":
        import pythoncom

        pythoncom.CoInitialize()

    try:
        # Create a PDFBuilder instance
        builder = PDFBuilder(data, output_path)

        # Build the PDF
        builder.build()

        return {"message": "PDF built successfully", "output_path": output_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error building PDF: {str(e)}")
    finally:
        # Uninitialize pythoncom on Windows
        if platform.system() == "Windows":
            import pythoncom

            pythoncom.CoUninitialize()


@router.post("/filter_template")
def filter_template(request: FilterTemplateRequest):
    """
    Filter a template based on method codes.

    Args:
        request: The filter template request

    Returns:
        dict: The filtered template
    """
    try:
        # Load the template
        with open(request.template_path, "r") as f:
            template = json.load(f)

        # Get available method codes from extracted data
        available_method_codes = set()
        if "method_codes" in request.extracted_data:
            available_method_codes = set(request.extracted_data["method_codes"])

        # Filter sections by method codes
        filtered_template = _filter_sections_by_method_codes(
            template, available_method_codes
        )

        # Save the filtered template if output_path is provided
        if request.output_path:
            with open(request.output_path, "w") as f:
                json.dump(filtered_template, f, indent=2)

        return filtered_template
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error filtering template: {str(e)}"
        )


def _filter_sections_by_method_codes(section, available_method_codes):
    """
    Filter sections by method codes.

    Args:
        section: The section to filter
        available_method_codes: The available method codes

    Returns:
        dict: The filtered section
    """
    # If the section has method codes, check if any of them are available
    if "method_codes" in section and section["method_codes"]:
        section_method_codes = set(section["method_codes"])
        if not section_method_codes.intersection(available_method_codes):
            # No matching method codes, remove this section
            return None

    # Filter children
    if "children" in section:
        filtered_children = []
        for child in section["children"]:
            if child["type"] == "Section":
                filtered_child = _filter_sections_by_method_codes(
                    child, available_method_codes
                )
                if filtered_child:
                    filtered_children.append(filtered_child)
            else:
                # Keep non-section children
                filtered_children.append(child)

        section["children"] = filtered_children

    return section
