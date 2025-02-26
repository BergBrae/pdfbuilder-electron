"""
Example script demonstrating how to use the RPT extraction module.

This script shows how to extract data from an RPT PDF file and save it to a JSON file.
"""

import os
import json
from initialization.extract_RPT import RPTExtractor, extract_rpt_data, save_example_text


def main():
    """
    Main function demonstrating the usage of the RPT extraction module.
    """
    # Example PDF path - replace with your actual PDF path
    pdf_path = input("Enter the path to the RPT PDF file: ")

    if not os.path.exists(pdf_path):
        print(f"Error: File not found: {pdf_path}")
        return

    if not pdf_path.lower().endswith(".pdf"):
        print(f"Error: File is not a PDF: {pdf_path}")
        return

    # Method 1: Using the extract_rpt_data function
    print("\nMethod 1: Using extract_rpt_data function")
    print("----------------------------------------")

    # Output JSON path
    output_dir = os.path.dirname(pdf_path)
    output_json_path = os.path.join(output_dir, "extracted_data.json")

    # Extract data and save to JSON
    data = extract_rpt_data(pdf_path, output_json_path)

    # Print the extracted data
    print(f"\nExtracted data saved to: {output_json_path}")
    print("\nExtracted data:")
    for key, value in data.items():
        print(f"{key}: {value}")

    # Method 2: Using the RPTExtractor class directly
    print("\nMethod 2: Using RPTExtractor class directly")
    print("------------------------------------------")

    # Create an instance of RPTExtractor
    extractor = RPTExtractor(pdf_path)

    # Extract text from the PDF
    text = extractor.extract_text()
    print(f"Extracted {len(text)} characters of text.")

    # Extract structured data using regex patterns
    data = extractor.extract_data()
    print(f"Extracted {len(data)} data fields.")

    # Save extracted text for debugging
    text_output_path = os.path.join(output_dir, "extracted_text.txt")
    save_example_text(pdf_path, text_output_path)
    print(f"Extracted text saved to: {text_output_path}")


if __name__ == "__main__":
    main()
