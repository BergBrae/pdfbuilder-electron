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
    directory_source = os.path.join(parent_directory_source, file.directory_source)
    directory_source = os.path.normpath(directory_source)

    previous_files = {
        f.file_path: f for f in file.files
    }  # use existing files if they are already in file.files
    file.files = []
    if os.path.isdir(directory_source):
        for path in glob.glob(directory_source + "/*"):
            filename = os.path.basename(path)
            if not os.path.isdir(path) and filename.lower().endswith(".pdf"):
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
        builder.generate_pdf(data, output_path)  # Generate the PDF

        return {"success": True, "output_path": output_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if platform.system() == "Windows":
            pythoncom.CoUninitialize()  # Uninitialize COM library only on Windows


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
