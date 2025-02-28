# Initialization Package

This package contains modules for initializing and extracting data from various file formats used in the PDF Builder application.

## RPT Extraction Module

The `extract_RPT.py` module provides functionality to extract structured data from RPT PDF files using regex patterns.

### Usage

#### From Python Code

```python
# Import the module
from initialization.extract_RPT import extract_rpt_data, RPTExtractor, save_example_text

# Method 1: Using the extract_rpt_data function
pdf_path = "path/to/your/rpt_file.pdf"
output_json_path = "path/to/save/extracted_data.json"  # Optional

# Extract data and optionally save to JSON
data = extract_rpt_data(pdf_path, output_json_path)

# Print the extracted data
for key, value in data.items():
    print(f"{key}: {value}")

# Method 2: Using the RPTExtractor class directly
extractor = RPTExtractor(pdf_path)

# Extract text from the PDF
text = extractor.extract_text()

# Extract structured data using regex patterns
data = extractor.extract_data()

# Save the extracted data to a JSON file
extractor.save_to_json(output_json_path)

# Save extracted text for debugging
save_example_text(pdf_path, "path/to/save/extracted_text.txt")
```

#### From Command Line

The module can also be run directly from the command line:

```bash
# Basic usage
python -m initialization extract_RPT "path/to/your/rpt_file.pdf"

# Save extracted data to JSON
python -m initialization extract_RPT "path/to/your/rpt_file.pdf" --output "path/to/save/extracted_data.json"

# Save extracted text for debugging
python -m initialization extract_RPT "path/to/your/rpt_file.pdf" --save-text "path/to/save/extracted_text.txt"
```

#### From API

The module is also exposed through the API:

```
POST /extract_rpt
```

Request body:

```json
{
  "pdf_path": "path/to/your/rpt_file.pdf",
  "output_json_path": "path/to/save/extracted_data.json" // Optional
}
```

Example:

```python
import requests

response = requests.post(
    "http://localhost:8000/extract_rpt",
    json={
        "pdf_path": "path/to/your/rpt_file.pdf",
        "output_json_path": "path/to/save/extracted_data.json"
    }
)

data = response.json()
print(data)
```

### Extracted Data

The module extracts the following data from RPT PDF files:

- `client`: The client name
- `report_attention`: The report attention
- `project_name`: The project name
- `merit_set_id`: The Merit set ID (format: S\d{5})
- `merit_sample_ids`: List of Merit sample IDs (format: S\d{5}.\d{2})
- `sampled_by`: The name of the person who sampled
- `submitted_datetime`: The submitted date and time
- `methods`: List of method codes used in the report

### Dependencies

- PyPDF2: For extracting text from PDF files
- re: For regex pattern matching
- json: For saving extracted data to JSON files
- os: For file path operations

### Files

- `extract_RPT.py`: The main module for extracting data from RPT PDF files
- `all_methods.txt`: A list of method codes to check against the extracted text
- `Example.RPT.txt`: An example of extracted text from an RPT PDF file (for reference)
- `Example.RPT.pdf`: An example RPT PDF file (for testing)
- `extracted_data.json`: An example of extracted data saved as JSON (for reference)

## Example Script

An example script demonstrating how to use the RPT extraction module is available at:

```
src/backend/examples/rpt_extraction_example.py
```

Run the example script to see the module in action:

```bash
python src/backend/examples/rpt_extraction_example.py
```
