from fastapi import FastAPI
import os
import re
import glob
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import uuid
import json
from buildpdf.build import PDFBuilder
from buildpdf.convert_docx import get_variables_in_docx, convert_docx_template_to_pdf
from utils.qualify_filename import qualify_filename
import platform
from initialization.extract_RPT import extract_rpt_data
from pydantic import BaseModel
import shutil

from schema import FileType, FileData, Section
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
def validate_docx_template(doc: dict, parent_directory_source: str) -> dict:
    """
    For backwards compatibility, handle DocxTemplate requests but convert to FileType.
    """
    docx_path = os.path.join(parent_directory_source, doc["docx_path"])
    docx_path = os.path.normpath(docx_path)

    # Convert to FileType
    file_type = {
        "type": "FileType",
        "id": doc["id"],
        "bookmark_name": doc.get("bookmark_name"),
        "directory_source": os.path.dirname(doc["docx_path"]),
        "filename_text_to_match": os.path.basename(doc["docx_path"]),
        "will_have_page_numbers": doc.get("will_have_page_numbers", True),
        "files": [],
        "variables_in_doc": [],
        "is_table_of_contents": doc.get("is_table_of_contents", False),
        "page_number_offset": doc.get("page_number_offset", 0),
        "page_start_col": doc.get("page_start_col", 3),
        "page_end_col": doc.get("page_end_col"),
        "docx_path": doc["docx_path"],  # Keep original path for compatibility
        "needs_update": False,
    }

    # Check if it is a directory
    if os.path.isdir(docx_path):
        file_type["exists"] = False
        file_type["variables_in_doc"] = []
        return file_type

    file_type["exists"] = os.path.exists(docx_path)
    if file_type["exists"]:
        if docx_path.lower().endswith(".doc"):
            file_type["variables_in_doc"] = [
                "Please convert this file to .docx format from within Word."
            ]
            return file_type
        file_type["variables_in_doc"] = get_variables_in_docx(docx_path)

        # Add file to files list
        file_type["files"] = [
            {
                "type": "FileData",
                "id": createUUID(),
                "file_path": docx_path,
                "num_pages": -1,  # Unknown until converted
                "bookmark_name": file_type["bookmark_name"],
            }
        ]
    else:
        file_type["variables_in_doc"] = []

    return file_type


@app.post("/filetype")
def validate_file_type(file: FileType, parent_directory_source: str) -> FileType:
    # Handle DocxTemplate compatibility
    if hasattr(file, "docx_path") and file.docx_path:
        docx_path = os.path.join(parent_directory_source, file.docx_path)
        docx_path = os.path.normpath(docx_path)

        # For DocxTemplate-like FileType
        file.exists = os.path.exists(docx_path)
        file.files = []

        if file.exists:
            if docx_path.lower().endswith(".doc"):
                file.variables_in_doc = [
                    "Please convert this file to .docx format from within Word."
                ]
                return file
            file.variables_in_doc = get_variables_in_docx(docx_path)

            # Add file to files list
            file.files.append(
                FileData(
                    id=createUUID(),
                    file_path=docx_path,
                    num_pages=-1,
                    bookmark_name=file.bookmark_name,
                )
            )
        else:
            file.variables_in_doc = []

        # Page numbers aren't currently relevant
        file.will_have_page_numbers = False
        file.needs_update = False
        return file

    # Normal FileType processing
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
        # Search for both .pdf/.PDF and .docx/.DOCX files
        matched_paths = []
        for ext in ["*.pdf", "*.PDF", "*.docx", "*.DOCX"]:
            matched_paths.extend(glob.glob(os.path.join(directory_source, ext)))

        matched_paths = list(set(matched_paths))

        for path in matched_paths:
            filename = os.path.basename(path)
            if not os.path.isdir(path):
                if qualify_filename(file.filename_text_to_match, filename):
                    # Calculate relative path from the directory_source
                    relative_path = os.path.relpath(path, directory_source)
                    if path in previous_files:
                        # Ensure existing file data uses relative path too
                        previous_files[path].file_path = relative_path
                        file.files.append(previous_files[path])
                    else:
                        # Store the relative path
                        file.files.append(
                            FileData(file_path=relative_path, id=createUUID())
                        )

    # sort files by filename (using the original full path for sorting robustness if needed,
    # but the stored path remains relative/basename)
    # Sorting key might need adjustment if we want to sort strictly by basename
    file.files = sorted(file.files, key=lambda x: os.path.basename(x.file_path))

    # Set num pages for PDF files only
    for file_data in file.files:
        # Construct full path temporarily for reading
        full_path = os.path.join(directory_source, file_data.file_path)

        # Skip page count for DOCX files
        if full_path.lower().endswith((".docx")):
            file_data.num_pages = -1
            continue

        try:
            # Use the reconstructed full path to open the file
            with open(full_path, "rb") as f:
                pdf = PyPDF2.PdfReader(f)
                file_data.num_pages = len(pdf.pages)
        except Exception as e:
            # Add full_path to the error message for better debugging
            print(f"Error reading PDF {full_path}: {e}")
            file_data.num_pages = -1

    # Page numbers aren't currently relevant
    file.will_have_page_numbers = False
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

    # Convert DocxTemplate to FileType for backwards compatibility
    data = convert_docx_templates_to_file_types(data)

    try:
        return Section(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error constructing report: {e}")


def convert_docx_templates_to_file_types(data):
    """Recursively convert DocxTemplate objects to FileType objects."""
    if not isinstance(data, dict):
        return data

    if data.get("type") == "DocxTemplate":
        # Convert DocxTemplate to FileType
        file_type = {
            "type": "FileType",
            "id": data["id"],
            "bookmark_name": data.get("bookmark_name"),
            "directory_source": os.path.dirname(data["docx_path"]) or "./",
            "filename_text_to_match": os.path.basename(data["docx_path"]),
            "will_have_page_numbers": data.get("will_have_page_numbers", True),
            "files": [],
            "variables_in_doc": data.get("variables_in_doc", []),
            "is_table_of_contents": data.get("is_table_of_contents", False),
            "page_number_offset": data.get("page_number_offset", 0),
            "page_start_col": data.get("page_start_col", 3),
            "page_end_col": data.get("page_end_col"),
            "docx_path": data["docx_path"],  # Keep original path for compatibility
            "exists": data.get("exists", False),
            "needs_update": data.get("needs_update", False),
            "bookmark_rules": [],
        }

        return file_type

    # Process all values in the dict
    for key in list(data.keys()):
        if key == "children" and isinstance(data[key], list):
            # Process children array
            data[key] = [
                convert_docx_templates_to_file_types(child) for child in data[key]
            ]
        elif isinstance(data[key], dict):
            data[key] = convert_docx_templates_to_file_types(data[key])
        elif isinstance(data[key], list):
            # Process any list of dictionaries
            data[key] = [
                (
                    convert_docx_templates_to_file_types(item)
                    if isinstance(item, dict)
                    else item
                )
                for item in data[key]
            ]

    # For backward compatibility, ensure Section has empty variables array instead of removing it
    if data.get("type") == "Section" and "variables" not in data:
        data["variables"] = []

    return data


@app.post("/savefile")
def save_file(path, data: Section):
    with open(path, "w") as f:
        json.dump(data.model_dump(), f, indent=4)


@app.post("/buildpdf")
def build_pdf(data: dict, output_path: str):
    if platform.system() == "Windows":
        pythoncom.CoInitialize()  # Initialize COM library only on Windows
    try:
        # Convert any remaining DocxTemplate to FileType
        data = convert_docx_templates_to_file_types(data)

        # Convert DOCX files to PDF in all FileType objects
        temp_pdf_files = []  # Track temporary files for cleanup

        def process_docx_files(node, parent_directory="", parent_section=None):
            if isinstance(node, dict):
                if node.get("type") == "FileType":
                    # Get directory for this FileType
                    if parent_directory:
                        directory_source = os.path.join(
                            parent_directory, node.get("directory_source", "")
                        )
                    else:
                        directory_source = node.get("directory_source", "")

                    directory_source = os.path.normpath(directory_source)

                    # Prepare variable replacements
                    replacements = {}

                    # Get replacements from variable_replacements if available
                    if node.get("variable_replacements"):
                        replacements.update(node.get("variable_replacements"))

                    # Get replacements from parent section's variables if available
                    if parent_section and parent_section.get("variables"):
                        for var in parent_section.get("variables"):
                            if var.get("template_text") and var.get("constant_value"):
                                replacements[var.get("template_text")] = var.get(
                                    "constant_value"
                                )

                    # Check if this is a DocxTemplate-converted FileType
                    if "docx_path" in node:
                        docx_path = node["docx_path"]
                        if parent_directory:
                            docx_path = os.path.join(parent_directory, docx_path)
                        docx_path = os.path.normpath(docx_path)

                        if os.path.exists(docx_path) and docx_path.lower().endswith(
                            ".docx"
                        ):
                            try:
                                print(f"Converting docx_path to PDF: {docx_path}")
                                print(f"Using replacements: {replacements}")

                                # Use the existing conversion function
                                pdf_reader, num_pages, pdf_path, modified_docx = (
                                    convert_docx_template_to_pdf(
                                        docx_path=docx_path,
                                        replacements=replacements,
                                        is_table_of_contents=node.get(
                                            "is_table_of_contents", False
                                        ),
                                        page_start_col=node.get("page_start_col"),
                                        page_end_col=node.get("page_end_col"),
                                    )
                                )

                                if pdf_path and os.path.exists(pdf_path):
                                    # Create a new file entry for the PDF
                                    pdf_file_data = {
                                        "type": "FileData",
                                        "id": createUUID(),
                                        "file_path": pdf_path,
                                        "num_pages": num_pages,
                                        "bookmark_name": node.get("bookmark_name"),
                                    }

                                    # Add this file to the files list
                                    if "files" not in node:
                                        node["files"] = []
                                    node["files"].append(pdf_file_data)
                                    temp_pdf_files.append(pdf_path)  # Track for cleanup
                                    print(
                                        f"Successfully converted docx_path to: {pdf_path}"
                                    )
                            except Exception as e:
                                print(
                                    f"Error converting docx_path to PDF: {docx_path} - {str(e)}"
                                )

                    # Check all files in this FileType
                    updated_files = []
                    for file_data in node.get("files", []):
                        if isinstance(file_data, dict):
                            file_path = file_data.get("file_path", "")
                        else:
                            # Handle case where file_data might be a string
                            file_path = str(file_data)
                            file_data = {"file_path": file_path}

                        # If it's a DOCX file, convert it to PDF
                        if file_path.lower().endswith(".docx"):
                            try:
                                print(f"Converting DOCX to PDF: {file_path}")
                                print(f"Using replacements: {replacements}")

                                # Use the existing conversion function
                                pdf_reader, num_pages, pdf_path, docx_path = (
                                    convert_docx_template_to_pdf(
                                        docx_path=file_path, replacements=replacements
                                    )
                                )

                                if pdf_path and os.path.exists(pdf_path):
                                    # Create a new file entry for the PDF
                                    pdf_file_data = {
                                        "type": "FileData",
                                        "id": createUUID(),
                                        "file_path": pdf_path,
                                        "num_pages": num_pages,
                                        "bookmark_name": file_data.get("bookmark_name"),
                                    }

                                    # Copy any other important attributes from the original file_data
                                    for key in file_data:
                                        if (
                                            key
                                            not in [
                                                "type",
                                                "id",
                                                "file_path",
                                                "num_pages",
                                            ]
                                            and key not in pdf_file_data
                                        ):
                                            pdf_file_data[key] = file_data[key]

                                    updated_files.append(pdf_file_data)
                                    temp_pdf_files.append(pdf_path)  # Track for cleanup
                                    print(f"Successfully converted to: {pdf_path}")
                                else:
                                    # Keep the original DOCX if conversion failed
                                    updated_files.append(file_data)
                                    print(f"Failed to convert DOCX to PDF: {file_path}")
                            except Exception as e:
                                # Keep the original DOCX if conversion failed
                                updated_files.append(file_data)
                                print(
                                    f"Error converting DOCX to PDF: {file_path} - {str(e)}"
                                )
                        else:
                            # Keep non-DOCX files as they are
                            updated_files.append(file_data)

                    # Update the files list
                    node["files"] = updated_files

                # Process child nodes
                if node.get("type") == "Section":
                    # Get directory for child processing
                    if parent_directory:
                        section_directory = os.path.join(
                            parent_directory, node.get("base_directory", "")
                        )
                    else:
                        section_directory = node.get("base_directory", "")

                    # Process children
                    for child in node.get("children", []):
                        process_docx_files(child, section_directory, node)

                # Process other dictionary fields
                for key, value in node.items():
                    if key != "children" and isinstance(value, dict):
                        process_docx_files(value, parent_directory, parent_section)
                    elif key != "children" and isinstance(value, list):
                        for item in value:
                            if isinstance(item, dict):
                                process_docx_files(
                                    item, parent_directory, parent_section
                                )

        # Process the entire report structure
        process_docx_files(data, data.get("base_directory", ""))

        # Add empty variables array to all Section objects for backward compatibility
        def add_variables_to_sections(node):
            if isinstance(node, dict):
                # If this is a Section, ensure it has a variables field
                if node.get("type") == "Section" and "variables" not in node:
                    node["variables"] = []

                # If this is a FileType, set will_have_page_numbers to False
                if node.get("type") == "FileType":
                    node["will_have_page_numbers"] = False

                # Process all children recursively
                for key, value in node.items():
                    if isinstance(value, dict):
                        add_variables_to_sections(value)
                    elif isinstance(value, list):
                        for item in value:
                            if isinstance(item, dict):
                                add_variables_to_sections(item)

        add_variables_to_sections(data)

        problem = validate_report(data)
        if isinstance(problem, str):
            raise HTTPException(status_code=400, detail=problem)

        builder = PDFBuilder()  # Instantiate the PDFBuilder
        result = builder.generate_pdf(data, output_path)  # Generate the PDF

        # Clean up temporary PDF files
        for temp_file in temp_pdf_files:
            try:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
            except Exception as e:
                print(f"Error removing temporary file {temp_file}: {str(e)}")

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

        if not data:
            raise HTTPException(status_code=400, detail="No data extracted from RPT")
        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class CreateDirectoryRequest(BaseModel):
    """Request model for creating directory structure from report."""

    base_path: str  # Where to create the directory structure
    report: dict  # The report structure
    analytical_report_path: str = None  # Path to the analytical report PDF (optional)
    extracted_data: dict = None  # Extracted data from the analytical report (optional)
    cover_page_template_path: str = None  # Optional path to cover page template
    cover_pages_template_path: str = None  # Optional path to cover pages template
    case_narrative_template_path: str = None  # Optional path to case narrative template
    process_docx_templates: bool = False  # Optional flag to process DOCX templates
    add_coa_folder: bool = False  # Optional flag to add COA folder
    add_benchsheets_folder: bool = (
        False  # Optional flag to add Designated Benchsheets folder
    )


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
            - cover_page_template_path: Optional path to cover page template
            - cover_pages_template_path: Optional path to cover pages template
            - case_narrative_template_path: Optional path to case narrative template
            - process_docx_templates: Optional flag to process DOCX templates
            - add_coa_folder: Optional flag to add COA folder
            - add_benchsheets_folder: Optional flag to add Designated Benchsheets folder

    Returns:
        Dictionary with success status and created directories
    """
    created_dirs = []
    generated_documents = []
    report = None
    report_path = None
    analytical_report_path = None
    success = False

    try:
        # Validate base path exists
        if not os.path.exists(request.base_path):
            raise HTTPException(
                status_code=404, detail=f"Base path not found: {request.base_path}"
            )

        # Get the extracted data from the report
        report = request.report
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

        # Create COA folder if requested
        if request.add_coa_folder:
            coa_dir = os.path.join(root_dir, "COA")
            os.makedirs(coa_dir, exist_ok=True)
            created_dirs.append(coa_dir)
            print(f"Created COA directory: {coa_dir}")

        # Create Designated Benchsheets folder if requested
        if request.add_benchsheets_folder:
            benchsheets_dir = os.path.join(root_dir, "Designated Benchsheets")
            os.makedirs(benchsheets_dir, exist_ok=True)
            created_dirs.append(benchsheets_dir)
            print(f"Created Designated Benchsheets directory: {benchsheets_dir}")

        # Check if the base_path is already an absolute path
        if os.path.isabs(request.base_path):
            # Update the report's base_directory to the full path
            report["base_directory"] = root_dir
            print(f"Setting report base_directory to absolute path: {root_dir}")
        else:
            # For relative paths, we need to make sure it's properly handled
            # Get the absolute path
            abs_root_dir = os.path.abspath(root_dir)
            report["base_directory"] = abs_root_dir
            print(f"Setting report base_directory to absolute path: {abs_root_dir}")

        # Save the report.json in the root directory with Merit set ID in the filename
        try:
            report_json_filename = f"report_{safe_dir_name}.json"
            report_path = os.path.join(root_dir, report_json_filename)
            with open(report_path, "w") as f:
                json.dump(report, f, indent=4)
            print(f"Saved report JSON to: {report_path}")
        except Exception as e:
            print(f"Error saving report JSON: {str(e)}")
            # If we can't save the report JSON, still try to continue

        # Copy the analytical report PDF to the root directory if provided
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
                # Continue even if we couldn't copy the report

        # Process DOCX templates if requested
        processed_templates = False
        if request.process_docx_templates:
            processed_templates = True
            # Create a dictionary of replacements from extracted data
            replacements = {}
            if request.extracted_data:
                for key, value in request.extracted_data.items():
                    if isinstance(value, str):
                        replacements[key] = value
                    elif isinstance(value, list):
                        replacements[key] = ", ".join(value)

            # --- Define a helper to process each template ---
            def process_template(template_path, template_name):
                if template_path and os.path.exists(template_path):
                    try:
                        base_filename = os.path.splitext(
                            os.path.basename(template_path)
                        )[0]
                        modified_docx_path = os.path.join(
                            root_dir, f"{base_filename}_modified.docx"
                        )

                        pdf_reader, num_pages, created_pdf_path, created_docx_path = (
                            convert_docx_template_to_pdf(
                                docx_path=template_path,
                                replacements=replacements,
                                save_modified_to=modified_docx_path,
                            )
                        )

                        # Add successfully created files to the list
                        if created_docx_path and os.path.exists(created_docx_path):
                            generated_documents.append(created_docx_path)
                        if created_pdf_path and os.path.exists(created_pdf_path):
                            generated_documents.append(created_pdf_path)

                    except Exception as e:
                        # Log the error but continue processing other templates
                        print(
                            f"Error processing {template_name} template '{template_path}': {str(e)}"
                        )
                else:
                    if template_path:
                        print(
                            f"Skipping {template_name}: Template not found at {template_path}"
                        )

            # --- Process each template using the helper ---
            process_template(request.cover_page_template_path, "Cover Page")
            process_template(request.cover_pages_template_path, "Cover Pages")
            process_template(request.case_narrative_template_path, "Case Narrative")

        # Create directories recursively
        try:
            _create_section_directories(report, root_dir, created_dirs)
        except Exception as e:
            print(f"Error creating section directories: {str(e)}")
            # Continue even if we couldn't create all directories

        # Filter out duplicates and normalize paths for directories
        unique_dirs = []
        for dir_path in created_dirs:
            normalized_path = os.path.normpath(dir_path)
            if normalized_path not in unique_dirs:
                unique_dirs.append(normalized_path)

        # Filter out duplicates and non-existent files for documents
        unique_docs = []
        for doc_path in generated_documents:
            normalized_path = os.path.normpath(doc_path)
            if os.path.exists(normalized_path) and normalized_path not in unique_docs:
                unique_docs.append(normalized_path)

        success = True

        response_data = {
            "success": success,
            "created_directories": unique_dirs,
            "report_path": report_path,
            "updated_report": report,  # Return the updated report
            "generated_documents": unique_docs,  # Use the filtered list of existing documents
            "processed_templates": processed_templates,
        }

        # Add analytical report path to response if available
        if analytical_report_path:
            response_data["analytical_report_path"] = analytical_report_path

        return response_data

    except Exception as e:
        # Add more detailed error information
        error_msg = f"Error creating directory structure: {str(e)}"
        print(error_msg)  # Log the error for server-side debugging

        # Ensure generated_documents is filtered even in case of partial success
        unique_docs = []
        if generated_documents:
            for doc_path in generated_documents:
                normalized_path = os.path.normpath(doc_path)
                if (
                    os.path.exists(normalized_path)
                    and normalized_path not in unique_docs
                ):
                    unique_docs.append(normalized_path)

        # If we got far enough to create some directories and files, return what we have
        if len(created_dirs) > 0 or len(unique_docs) > 0:
            print("Returning partial results despite error")

            # Filter out duplicates and normalize paths for directories
            unique_dirs = []
            for dir_path in created_dirs:
                normalized_path = os.path.normpath(dir_path)
                if normalized_path not in unique_dirs:
                    unique_dirs.append(normalized_path)

            response_data = {
                "success": False,
                "error": error_msg,
                "created_directories": unique_dirs,
                "report_path": report_path,
                "updated_report": report,
                "generated_documents": unique_docs,  # Return filtered documents
                "partial_success": True,
            }

            # Add analytical report path to response if available
            if analytical_report_path:
                response_data["analytical_report_path"] = analytical_report_path

            return response_data
        else:
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
            # First clean the directory name to ensure it's valid
            safe_dir_name = base_directory.strip()

            # Strip any trailing slashes which could cause duplicate directory entries
            while safe_dir_name.endswith("/") or safe_dir_name.endswith("\\"):
                safe_dir_name = safe_dir_name[:-1]

            # Log original base_directory for debugging
            print(
                f"Original base_directory: {base_directory} (cleaned: {safe_dir_name})"
            )

            # Check if this is an absolute path (likely the root section)
            is_absolute_path = os.path.isabs(safe_dir_name)

            # Special handling for the root section (first level)
            # We can detect this by checking if parent_path is in safe_dir_name
            # or if safe_dir_name is an absolute path
            is_root_section = is_absolute_path or parent_path in safe_dir_name

            if is_root_section:
                # For the root section, use the directory as is
                section_dir = safe_dir_name
                print(f"Using root section path directly: {section_dir}")
            else:
                # For non-root sections, handle relative paths

                # If it contains slashes, extract just the last directory name
                if "/" in safe_dir_name or "\\" in safe_dir_name:
                    # Replace both slashes with the system separator
                    safe_dir_name = safe_dir_name.replace("\\", os.sep).replace(
                        "/", os.sep
                    )
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
                    section_dir = parent_path
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
    docx_variables: dict = None  # Optional variables extracted from DOCX templates
    cover_page_template_path: str = None  # Optional path to cover page template
    cover_pages_template_path: str = None  # Optional path to cover pages template
    case_narrative_template_path: str = None  # Optional path to case narrative template


@app.post("/filter_template")
def filter_template(request: FilterTemplateRequest):
    """
    Filter a template based on method codes and fill variables.

    Args:
        request: FilterTemplateRequest containing:
            - template_path: Path to the template JSON file
            - extracted_data: Data extracted from RPT
            - output_path: Optional path to save the filtered template
            - docx_variables: Optional variables extracted from DOCX templates

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
    Now works with FileType objects that have variables_in_doc field.

    Args:
        section: Section data
        data: Data to fill variables with
    """
    try:
        # Check if section and data are valid
        if not section or not isinstance(section, dict) or not data:
            print(f"Skipping variable filling: Invalid section or data")
            return

        print(
            f"Filling variables for section: {section.get('bookmark_name', 'Unnamed Section')}"
        )
        print(f"Available data keys: {list(data.keys())}")

        # Create a normalized version of the data keys for more flexible matching
        normalized_data = {}
        for key, value in data.items():
            # Convert to lowercase and remove spaces for more flexible matching
            normalized_key = key.lower().replace(" ", "_").replace("/", "_")
            normalized_data[normalized_key] = value
            # Also keep the original key
            normalized_data[key] = value

        print(f"Normalized data keys: {list(normalized_data.keys())}")

        # Ensure section has variables array for backward compatibility
        if "variables" not in section:
            section["variables"] = []

        # Process children recursively
        children = section.get("children", [])
        if not children or not isinstance(children, list):
            return

        for child in children:
            if not child or not isinstance(child, dict):
                continue

            child_type = child.get("type")

            # Process Section children recursively
            if child_type == "Section":
                _fill_variables(child, data)

            # Process FileType with variables_in_doc (former DocxTemplate)
            elif child_type == "FileType" and child.get("variables_in_doc"):
                variables_in_doc = child.get("variables_in_doc", [])
                if not variables_in_doc:
                    continue

                print(f"Processing FileType with {len(variables_in_doc)} variables")

                # Store the variable mappings directly in the file object
                # as a map of template_text -> replacement value
                if not child.get("variable_replacements"):
                    child["variable_replacements"] = {}

                # Process each variable in variables_in_doc
                for template_text in variables_in_doc:
                    variable_value = _find_matching_value(
                        template_text, data, normalized_data
                    )
                    if variable_value is not None:
                        # Store the replacement value
                        child["variable_replacements"][template_text] = variable_value

                        # For backward compatibility, add to section's variables array
                        # Check if this variable already exists
                        existing_var = next(
                            (
                                var
                                for var in section["variables"]
                                if var.get("template_text") == template_text
                            ),
                            None,
                        )
                        if existing_var:
                            # Update existing variable
                            existing_var["constant_value"] = variable_value
                        else:
                            # Create new TemplateVariable-like object
                            section["variables"].append(
                                {
                                    "template_text": template_text,
                                    "is_constant": True,
                                    "constant_value": variable_value,
                                    "id": str(uuid.uuid4()),
                                    "type": "TemplateVariable",
                                }
                            )
    except Exception as e:
        # Log error but continue processing
        print(f"Error filling variables: {str(e)}")


def _find_matching_value(template_text, data, normalized_data):
    """Find a matching value for the template text in the data."""
    if not template_text:
        return None

    print(f"Processing variable: {template_text}")

    # Try direct match first
    if template_text in data:
        print(f"  Direct match found for '{template_text}'")
        return str(data[template_text])

    # Try normalized version (lowercase, spaces replaced with underscores)
    normalized_template = template_text.lower().replace(" ", "_").replace("/", "_")
    print(f"  Trying normalized template: '{normalized_template}'")
    if normalized_template in normalized_data:
        print(
            f"  Normalized match found for '{template_text}' as '{normalized_template}'"
        )
        return str(normalized_data[normalized_template])

    # Handle date format patterns (e.g., "Report Date mm/dd/yyyy" -> "Report Date")
    # Common patterns in templates include date format indicators
    for pattern in [" mm/dd/yyyy", " MM/DD/YYYY", " dd/mm/yyyy", " DD/MM/YYYY"]:
        if pattern in template_text:
            base_name = template_text.replace(pattern, "")
            print(f"  Trying date pattern match: '{base_name}'")
            if base_name in data:
                print(
                    f"  Date pattern match found for '{template_text}' as '{base_name}'"
                )
                return str(data[base_name])
            # Also try normalized version
            normalized_base = base_name.lower().replace(" ", "_").replace("/", "_")
            if normalized_base in normalized_data:
                print(
                    f"  Date pattern match found for '{template_text}' as '{normalized_base}'"
                )
                return str(normalized_data[normalized_base])

    # Try matching by removing common prefixes/suffixes
    # For example, "merit_set_id" might match "Merit ID" in the template
    for data_key in data.keys():
        # Convert both to lowercase for comparison
        if data_key.lower().replace(
            "_", " "
        ) in template_text.lower() or template_text.lower() in data_key.lower().replace(
            "_", " "
        ):
            print(f"  Partial match found: '{template_text}' ~ '{data_key}'")
            return str(data[data_key])

    print(f"  No match found for '{template_text}'")
    return None


class DocxVariablesRequest(BaseModel):
    """Request model for getting variables from a DOCX file."""

    docx_path: str


@app.post("/get_docx_variables")
def get_docx_variables(request: DocxVariablesRequest):
    """
    Extract variables from a DOCX file.

    Args:
        request: DocxVariablesRequest containing:
            - docx_path: Path to the DOCX file

    Returns:
        Dictionary containing the extracted variables
    """
    try:
        # Validate that the file exists
        if not os.path.exists(request.docx_path):
            raise HTTPException(
                status_code=404, detail=f"File not found: {request.docx_path}"
            )

        # Validate that the file is a DOCX
        if not request.docx_path.lower().endswith(".docx"):
            raise HTTPException(
                status_code=400, detail=f"File is not a DOCX: {request.docx_path}"
            )

        # Extract variables from the DOCX
        variables = get_variables_in_docx(request.docx_path)

        return {"variables": variables}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
