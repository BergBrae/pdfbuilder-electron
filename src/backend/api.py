from fastapi import FastAPI
import os
from spire.doc import Document
import re
import glob
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import uuid
import json

from schema import DocxTemplate, FileType, FileData, Section
from validate import validate_report
from buildpdf.build import generate_pdf


def getText(filename):
    doc = Document()
    doc.LoadFromFile(filename)
    return doc.GetText()


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
        variable_pattern = re.compile(r"\{(.+)\}")
        try:
            text = getText(docx_path)
        except Exception as e:
            doc.variables_in_doc = [f"Error: {e}"]
            return doc
        doc.variables_in_doc = variable_pattern.findall(text)

    doc.needs_update = False

    return doc


@app.post("/filetype")
def validate_file_type(
    file: FileType, parent_directory_source: str, use_regex=False
) -> FileType:
    if not file.filename_text_to_match:
        file.files = []
        return file
    directory_source = os.path.join(parent_directory_source, file.directory_source)
    directory_source = os.path.normpath(directory_source)

    file.files = []
    if os.path.exists(directory_source):
        if use_regex:
            pattern = re.compile(f".*{file.filename_text_to_match}.*")
            for filename in glob.glob(directory_source + "/*") and not os.path.isdir(
                filename
            ):
                if pattern.match(filename) and filename.lower().endswith(".pdf"):
                    file.files.append(FileData(file_path=filename, id=createUUID()))
        else:
            for filename in glob.glob(directory_source + "/*"):
                if (
                    file.filename_text_to_match in os.path.basename(filename)
                    and not os.path.isdir(filename)
                    and filename.lower().endswith(".pdf")
                ):
                    file.files.append(FileData(file_path=filename, id=createUUID()))

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
    with open(path, "r") as f:
        data = json.load(f)
        return Section(**data)


@app.post("/savefile")
def save_file(path, data: Section):
    with open(path, "w") as f:
        json.dump(data.dict(), f, indent=4)


@app.post("/buildpdf")
def build_pdf(data: dict, output_path: str):
    problem = validate_report(data)
    if isinstance(problem, str):
        return {"error": problem}

    generate_pdf(data, output_path)

    return {'success': True, 'output_path': output_path}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
