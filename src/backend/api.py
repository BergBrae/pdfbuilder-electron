from fastapi import FastAPI
import os
import re
import glob
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import uuid
import json
from buildpdf.build import PDFBuilder
from buildpdf.convert_docx import get_variables_in_docx
from utils.qualify_filename import qualify_filename
import platform
from initialization.extract_RPT import extract_rpt_data
from pydantic import BaseModel
import shutil

from schema import DocxTemplate, FileType, FileData, Section
from validate import validate_report
from fastapi import HTTPException

# Conditionally import pythoncom on Windows
if platform.system() == "Windows":
    import pythoncom
else:
    pythoncom = None


def createUUID():
    return str(uuid.uuid4())


app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:1212",
        "*",
    ],  # List of origins allowed to make requests
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)


@app.get("/")
async def root():
    return {"message": "API is running"}


@app.post("/docxtemplate")
def validate_docx_template(
    doc: DocxTemplate, parent_directory_source: str
) -> DocxTemplate:
    docx_path = os.path.join(parent_directory_source, doc.docx_path)
    docx_path = os.path.normpath(docx_path)
    doc.variables_in_doc = []

    # check if it is a directory
    if os.path.isdir(docx_path):
        doc.exists = False
        doc.variables_in_doc = []
        return doc

    doc.exists = os.path.exists(docx_path)
    if doc.exists:
        if docx_path.lower().endswith(".doc"):
            doc.variables_in_doc = [
                "Please convert this file to .docx format from within Word."
            ]
            return doc
        doc.variables_in_doc = get_variables_in_docx(docx_path)
    else:
        doc.variables_in_doc = []

    doc.needs_update = False

    return doc


@app.post("/filetype")
def validate_file_type(file: FileType, parent_directory_source: str) -> FileType:
    if not file.filename_text_to_match:
        file.files = []
        return file
    directory_source = os.path.normpath(
        os.path.join(parent_directory_source, file.directory_source)
    )

    previous_files = {
        f.file_path: f for f in file.files
    }  # use existing files if they are already in file.files
    file.files = []
    if os.path.isdir(directory_source):
        # Search for both .pdf and .PDF files
        pdf_paths = []
        for ext in ["*.pdf", "*.PDF"]:
            pdf_paths.extend(glob.glob(os.path.join(directory_source, ext)))

        pdf_paths = list(set(pdf_paths))

        for path in pdf_paths:
            filename = os.path.basename(path)
            if not os.path.isdir(
                path
            ):  # No need to check extension again since we filtered in glob
                if qualify_filename(file.filename_text_to_match, filename):
                    if path in previous_files:
                        file.files.append(previous_files[path])
                    else:
                        file.files.append(FileData(file_path=path, id=createUUID()))

    # sort files by filename
    file.files = sorted(file.files, key=lambda x: os.path.basename(x.file_path))

    # Set num pages
    for file_data in file.files:
        try:
            with open(file_data.file_path, "rb") as f:
                pdf = PyPDF2.PdfReader(f)
                file_data.num_pages = len(pdf.pages)
        except Exception as e:
            print(f"Error: {e}")
            file_data.num_pages = -1

    file.needs_update = False

    return file


@app.post("/loadfile")
def load_file(path) -> Section:
    try:
        with open(path, "r") as f:
            data = json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File {path} not found.")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Error decoding JSON file.")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {e}"
        )

    try:
        return Section(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error constructing report: {e}")


@app.post("/savefile")
def save_file(path, data: Section):
    with open(path, "w") as f:
        json.dump(data.model_dump(), f, indent=4)


@app.post("/buildpdf")
def build_pdf(data: dict, output_path: str):
    if platform.system() == "Windows":
        pythoncom.CoInitialize()  # Initialize COM library only on Windows
    try:
        problem = validate_report(data)
        if isinstance(problem, str):
            raise HTTPException(status_code=400, detail=problem)

        builder = PDFBuilder()  # Instantiate the PDFBuilder
        result = builder.generate_pdf(data, output_path)  # Generate the PDF

        return result  # Return the complete result including problematic_files

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if platform.system() == "Windows":
            pythoncom.CoUninitialize()  # Uninitialize COM library only on Windows


class RPTExtractionRequest(BaseModel):
    pdf_path: str
    output_json_path: str = None


@app.post("/extract_rpt")
def extract_rpt(request: RPTExtractionRequest):
    """
    Extract data from an RPT PDF file.

    Args:
        request: RPTExtractionRequest containing:
            - pdf_path: Path to the RPT PDF file
            - output_json_path: Optional path to save the extracted data as JSON

    Returns:
        Dictionary containing the extracted data
    """
    try:
        # Validate that the file exists
        if not os.path.exists(request.pdf_path):
            raise HTTPException(
                status_code=404, detail=f"File not found: {request.pdf_path}"
            )

        # Validate that the file is a PDF
        if not request.pdf_path.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400, detail=f"File is not a PDF: {request.pdf_path}"
            )

        # Extract data from the RPT PDF
        data = extract_rpt_data(request.pdf_path, request.output_json_path)

        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class CreateDirectoryRequest(BaseModel):
    """Request model for creating directory structure from report."""

    base_path: str  # Where to create the directory structure
    report: dict  # The report structure
    analytical_report_path: str = None  # Path to the analytical report PDF (optional)
    extracted_data: dict = None  # Extracted data from the analytical report (optional)


@app.post("/create_directory_structure")
def create_directory_structure(request: CreateDirectoryRequest):
    """
    Create directory structure for a report.

    Args:
        request: CreateDirectoryRequest containing:
            - base_path: Base path where to create the directory structure
            - report: Report structure
            - analytical_report_path: Optional path to the analytical report PDF
            - extracted_data: Optional extracted data from the analytical report

    Returns:
        Dictionary with success status and created directories
    """
    try:
        # Validate base path exists
        if not os.path.exists(request.base_path):
            raise HTTPException(
                status_code=404, detail=f"Base path not found: {request.base_path}"
            )

        # Get the extracted data from the report
        report = request.report
        created_dirs = []

        # First check for merit_set_id in the extracted_data (highest priority)
        merit_set_id = None
        if request.extracted_data and "merit_set_id" in request.extracted_data:
            merit_set_id = request.extracted_data["merit_set_id"]
            print(f"Using merit_set_id from extracted data: {merit_set_id}")

        # If not found in extracted data, check in the report data
        if not merit_set_id and "merit_set_id" in report:
            merit_set_id = report["merit_set_id"]
            print(f"Using merit_set_id from report data: {merit_set_id}")

        # Look for merit_set_id in the variables of the report
        if not merit_set_id:
            variables = report.get("variables", [])
            for var in variables:
                if var.get("id") == "merit_set_id" and var.get("constant_value"):
                    merit_set_id = var.get("constant_value")
                    print(f"Using merit_set_id from report variables: {merit_set_id}")
                    break

        # If we couldn't find a Merit set ID, generate a UUID instead of using "Report"
        if not merit_set_id:
            merit_set_id = f"ID{str(uuid.uuid4())[:8]}"
            print(f"No Merit set ID found, using generated ID: {merit_set_id}")

        # Clean the Merit set ID to create a safe directory name
        # If it starts with 'S', remove it for the directory name
        if merit_set_id.startswith("S") and len(merit_set_id) > 1:
            safe_dir_name = merit_set_id[1:]  # Use the numeric part only
        else:
            safe_dir_name = merit_set_id

        # Replace any slashes or other illegal characters
        safe_dir_name = str(safe_dir_name).replace("/", "_").replace("\\", "_")

        # Create the root directory using the Merit set ID directly in the base path
        root_dir = os.path.join(request.base_path, safe_dir_name)

        # Normalize the path to resolve any issues with slashes
        root_dir = os.path.normpath(root_dir)

        print(f"Creating root directory: {root_dir}")
        os.makedirs(root_dir, exist_ok=True)
        created_dirs.append(root_dir)

        # Update the report's base_directory to just the Merit ID, not the full path
        # This prevents creating a duplicate directory level
        report["base_directory"] = safe_dir_name
        print(f"Setting report base_directory to: {safe_dir_name}")

        # Save the report.json in the root directory with Merit set ID in the filename
        report_json_filename = f"report_{safe_dir_name}.json"
        report_path = os.path.join(root_dir, report_json_filename)
        with open(report_path, "w") as f:
            json.dump(report, f, indent=4)

        # Copy the analytical report PDF to the root directory if provided
        analytical_report_path = None
        if request.analytical_report_path and os.path.exists(
            request.analytical_report_path
        ):
            try:
                # Get the filename from the original path
                pdf_filename = os.path.basename(request.analytical_report_path)
                # Create the destination path
                dest_pdf_path = os.path.join(root_dir, pdf_filename)
                # Copy the file
                shutil.copy2(request.analytical_report_path, dest_pdf_path)
                analytical_report_path = dest_pdf_path
                print(f"Copied analytical report to: {dest_pdf_path}")
            except Exception as e:
                print(f"Error copying analytical report: {str(e)}")

        # Create directories recursively
        _create_section_directories(report, root_dir, created_dirs)

        # Filter out duplicates and normalize paths
        unique_dirs = []
        for dir_path in created_dirs:
            # Normalize path to remove trailing slashes and resolve .. references
            normalized_path = os.path.normpath(dir_path)
            if normalized_path not in unique_dirs:
                unique_dirs.append(normalized_path)

        response_data = {
            "success": True,
            "created_directories": unique_dirs,
            "report_path": report_path,
            "updated_report": report,  # Return the updated report
        }

        # Add analytical report path to response if available
        if analytical_report_path:
            response_data["analytical_report_path"] = analytical_report_path

        return response_data

    except Exception as e:
        # Add more detailed error information
        error_msg = f"Error creating directory structure: {str(e)}"
        print(error_msg)  # Log the error for server-side debugging
        raise HTTPException(status_code=500, detail=error_msg)


def _create_section_directories(section, parent_path, created_dirs):
    """
    Recursively create directories for a section.

    Args:
        section: Section data
        parent_path: Parent path
        created_dirs: List to collect created directories
    """
    try:
        # Create directory for this section if it has a base_directory
        base_directory = section.get("base_directory")
        if (
            base_directory
            and isinstance(base_directory, str)
            and base_directory.strip()
        ):
            # Extract just the directory name, not the full path
            # First clean the directory name to ensure it's valid
            safe_dir_name = base_directory.strip()

            # Strip any trailing slashes which could cause duplicate directory entries
            while safe_dir_name.endswith("/") or safe_dir_name.endswith("\\"):
                safe_dir_name = safe_dir_name[:-1]

            # Log original base_directory for debugging
            print(
                f"Original base_directory: {base_directory} (cleaned: {safe_dir_name})"
            )

            # If it's a full path, extract just the last directory name
            if "/" in safe_dir_name or "\\" in safe_dir_name:
                # Replace both slashes with the system separator
                safe_dir_name = safe_dir_name.replace("\\", os.sep).replace("/", os.sep)
                # Get the last component (the actual directory name)
                safe_dir_name = os.path.basename(safe_dir_name)
                print(f"Extracted directory name: {safe_dir_name}")

            # Further clean the name for filesystem safety
            safe_dir_name = safe_dir_name.replace("/", "_").replace("\\", "_")
            print(f"Final safe directory name: {safe_dir_name}")

            # Check if this directory would create a duplicate of the parent directory name
            parent_dir_name = os.path.basename(parent_path)

            # Skip creating this directory if it would create a duplicate level with the same name
            if safe_dir_name == parent_dir_name:
                print(f"Skipping duplicate directory level: {safe_dir_name}")
                # Don't create a new directory, but still process children with the same parent_path
            else:
                # Use section's base_directory relative to parent
                section_dir = os.path.join(parent_path, safe_dir_name)

                # Normalize the path to avoid issues with slashes
                section_dir = os.path.normpath(section_dir)

                print(f"Creating directory: {section_dir}")

                if not os.path.exists(section_dir):
                    os.makedirs(section_dir, exist_ok=True)

                # Only add to created_dirs if it's not already in the list
                # Check using normalized paths
                if section_dir not in [os.path.normpath(d) for d in created_dirs]:
                    created_dirs.append(section_dir)
                    print(f"Added to created_dirs: {section_dir}")
                else:
                    print(f"Directory already in created_dirs: {section_dir}")

                # Update the parent path for children
                parent_path = section_dir

        # Process children recursively
        children = section.get("children", [])
        if children and isinstance(children, list):
            for child in children:
                if child and isinstance(child, dict) and child.get("type") == "Section":
                    _create_section_directories(child, parent_path, created_dirs)
    except Exception as e:
        # Log the error but continue processing other sections
        print(f"Error creating directory for section: {str(e)}")


class FilterTemplateRequest(BaseModel):
    """Request model for filtering a template based on method codes."""

    template_path: str  # Path to the template JSON file
    extracted_data: dict  # Data extracted from RPT
    output_path: str = None  # Optional path to save the filtered template


@app.post("/filter_template")
def filter_template(request: FilterTemplateRequest):
    """
    Filter a template based on method codes and fill variables.

    Args:
        request: FilterTemplateRequest containing:
            - template_path: Path to the template JSON file
            - extracted_data: Data extracted from RPT
            - output_path: Optional path to save the filtered template

    Returns:
        Filtered report
    """
    try:
        # Validate template exists
        if not os.path.exists(request.template_path):
            raise HTTPException(
                status_code=404, detail=f"Template not found: {request.template_path}"
            )

        # Load template
        with open(request.template_path, "r") as f:
            template = json.load(f)

        # Get method codes from extracted data
        method_codes = request.extracted_data.get("methods", [])

        # Filter template based on method codes
        filtered_template = _filter_sections_by_method_codes(template, method_codes)

        # Fill variables with extracted data
        _fill_variables(filtered_template, request.extracted_data)

        # Save to output path if provided
        if request.output_path:
            os.makedirs(os.path.dirname(request.output_path), exist_ok=True)
            with open(request.output_path, "w") as f:
                json.dump(filtered_template, f, indent=4)

        return filtered_template

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _filter_sections_by_method_codes(section, available_method_codes):
    """
    Recursively filter sections based on method codes.

    Args:
        section: Section data
        available_method_codes: List of available method codes

    Returns:
        Filtered section
    """
    try:
        # Validate inputs
        if not section or not isinstance(section, dict):
            return None

        if not available_method_codes:
            available_method_codes = []

        # If this is not a section, return as is
        if section.get("type") != "Section":
            return section

        # Check if this section has method codes
        section_method_codes = section.get("method_codes", [])

        # If the section has method codes but none match available codes, return None
        if (
            section_method_codes
            and isinstance(section_method_codes, list)
            and len(section_method_codes) > 0
        ):
            # Check if any method code matches
            has_matching_code = False
            for code in section_method_codes:
                if code in available_method_codes:
                    has_matching_code = True
                    break

            if not has_matching_code:
                return None

        # Process children
        filtered_children = []
        children = section.get("children", [])

        if children and isinstance(children, list):
            for child in children:
                if not child or not isinstance(child, dict):
                    continue

                if child.get("type") == "Section":
                    filtered_child = _filter_sections_by_method_codes(
                        child, available_method_codes
                    )
                    if filtered_child is not None:
                        filtered_children.append(filtered_child)
                else:
                    # Non-section children are kept
                    filtered_children.append(child)

        # Update children
        section["children"] = filtered_children

        return section
    except Exception as e:
        print(f"Error filtering sections by method codes: {str(e)}")
        return section  # Return the original section in case of error


def _fill_variables(section, data):
    """
    Fill variables in a section with data.

    Args:
        section: Section data
        data: Data to fill variables with
    """
    try:
        # Check if section and data are valid
        if not section or not isinstance(section, dict) or not data:
            return

        # Fill variables at root level
        variables = section.get("variables", [])
        if not variables or not isinstance(variables, list):
            return

        for variable in variables:
            if not variable or not isinstance(variable, dict):
                continue

            if variable.get("is_constant"):
                # Try to find a matching variable in the data
                var_id = variable.get("id")
                if var_id and var_id in data:
                    variable["constant_value"] = str(data[var_id])

        # Process children recursively
        children = section.get("children", [])
        if not children or not isinstance(children, list):
            return

        for child in children:
            if child and isinstance(child, dict) and child.get("type") == "Section":
                _fill_variables(child, data)
    except Exception as e:
        # Log error but continue processing
        print(f"Error filling variables: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
