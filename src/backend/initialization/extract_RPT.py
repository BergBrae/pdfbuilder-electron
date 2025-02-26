import os
import re
import json
from PyPDF2 import PdfReader
from typing import Dict, List, Any, Optional, Tuple


class RPTExtractor:
    """
    A class to extract data from RPT PDF files using PyPDF2 and regex patterns.
    """

    def __init__(self, pdf_path: str):
        """
        Initialize the extractor with the path to the PDF file.

        Args:
            pdf_path: Path to the PDF file to extract data from
        """
        self.pdf_path = pdf_path
        self.extracted_text = ""
        self.extracted_data = {}

    def extract_text(self) -> str:
        """
        Extract text from the PDF file.

        Returns:
            The extracted text as a string
        """
        try:
            reader = PdfReader(self.pdf_path)
            text = ""

            # Extract text from all pages
            for page in reader.pages:
                text += page.extract_text() + "\n\n"

            self.extracted_text = text
            return text
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")
            return ""

    def extract_data(self) -> Dict[str, Any]:
        """
        Extract structured data from the PDF text using regex patterns.

        Returns:
            A dictionary containing the extracted data
        """
        if not self.extracted_text:
            self.extract_text()

        data = {}

        # Extract basic information
        data.update(self._extract_client())
        data.update(self._extract_report_attention())
        data.update(self._extract_project_name())
        data.update(self._extract_merit_ids())
        data.update(self._extract_sampled_by())
        data.update(self._extract_submitted_datetime())
        data.update(self._extract_methods())

        self.extracted_data = data
        return data

    def _extract_client(self) -> Dict[str, Any]:
        """Extract client name from the report."""
        data = {}

        # New pattern to capture the client name (typically on the line after "Attention:")
        client_pattern = r"Attention:.+\n(.*?)(?=\d|\n\d)"
        client_match = re.search(client_pattern, self.extracted_text)
        if client_match:
            data["client"] = client_match.group(1).strip()

        return data

    def _extract_report_attention(self) -> Dict[str, Any]:
        """Extract report attention from the report."""
        data = {}

        # Extract report attention
        report_attention_pattern = r"Attention:\s*(.+?)(?=\s+Merit)"
        report_attention_match = re.search(
            report_attention_pattern, self.extracted_text
        )
        if report_attention_match:
            data["report_attention"] = report_attention_match.group(1).strip()

        return data

    def _extract_project_name(self) -> Dict[str, Any]:
        """Extract project name from the report."""
        data = {}

        # Extract project name
        project_name_pattern = r"Project:\s*(.+?)(?=\n|Collected|Page)"
        project_name_match = re.search(project_name_pattern, self.extracted_text)
        if project_name_match:
            data["project_name"] = project_name_match.group(1).strip()

        return data

    def _extract_merit_ids(self) -> Dict[str, Any]:
        """
        Extract Merit set ID and sample IDs from the report.

        A Merit set ID has the format "S\d{5}" (e.g., S69721)
        A sample ID has the format "S\d{5}\.\d{2}" (e.g., S69721.01)

        Returns:
            Dictionary containing merit_set_id (str) and merit_sample_ids (list)
        """
        data = {}

        # Find all sample IDs in the format S\d{5}\.\d{2}
        sample_id_pattern = r"S\d{5}\.\d{2}"
        sample_ids = re.findall(sample_id_pattern, self.extracted_text)

        if sample_ids:
            # Remove duplicates and sort
            sample_ids = sorted(list(set(sample_ids)))
            data["merit_sample_ids"] = sample_ids

            # Extract the set ID from the first sample ID
            set_id_match = re.match(r"(S\d{5})", sample_ids[0])
            if set_id_match:
                set_id = set_id_match.group(1)
                data["merit_set_id"] = set_id

                # Verify all sample IDs belong to the same set
                for sample_id in sample_ids:
                    if not sample_id.startswith(set_id):
                        print(
                            f"Warning: Sample ID {sample_id} does not belong to set {set_id}"
                        )

        return data

    def _extract_sampled_by(self) -> Dict[str, Any]:
        """
        Extract the name of the person who sampled from the report.

        Looks for text after "Sampled by: " and stops at a newline or "P.O."

        Returns:
            Dictionary containing sampled_by (str)
        """
        data = {}

        # Extract sampled by information
        sampled_by_pattern = r"Sampled by:\s*(.+?)(?=\n|P\.O\.)"
        sampled_by_match = re.search(sampled_by_pattern, self.extracted_text)
        if sampled_by_match:
            data["sampled_by"] = sampled_by_match.group(1).strip()

        return data

    def _extract_submitted_datetime(self) -> Dict[str, Any]:
        """
        Extract the submitted date and time from the report.

        Looks for text after "Submitted Date/Time: " and stops at a newline or "Sampled by:"

        Returns:
            Dictionary containing submitted_datetime (str)
        """
        data = {}

        # Extract submitted date and time information
        submitted_datetime_pattern = r"Submitted Date/Time:\s*(.+?)(?=\n|Sampled by:)"
        submitted_datetime_match = re.search(
            submitted_datetime_pattern, self.extracted_text
        )
        if submitted_datetime_match:
            data["submitted_datetime"] = submitted_datetime_match.group(1).strip()

        return data

    def _extract_methods(self) -> Dict[str, Any]:
        """
        Extract method codes used in the report.

        Reads method codes from all_methods.txt and checks if each method
        is mentioned in the extracted text. Handles cases where method codes
        might be attached to other text without spaces.

        Returns:
            Dictionary containing methods (list of str)
        """
        data = {}
        methods_found = []

        try:
            # Get the directory of the current script
            current_dir = os.path.dirname(os.path.abspath(__file__))

            # Path to the methods file
            methods_file_path = os.path.join(current_dir, "all_methods.txt")

            # Read all method codes from the file
            with open(methods_file_path, "r") as f:
                method_codes = [
                    line.strip()
                    for line in f
                    if line.strip() and line.strip().lower() != "nan"
                ]

            # Check each method code against the extracted text
            for method_code in method_codes:
                # Use a simple string search instead of regex with word boundaries
                # This will find the method code even if it's attached to other text
                if method_code in self.extracted_text:
                    methods_found.append(method_code)

            if methods_found:
                data["methods"] = methods_found

        except Exception as e:
            print(f"Error extracting methods: {e}")

        return data

    def save_to_json(self, output_path: str) -> None:
        """
        Save the extracted data to a JSON file.

        Args:
            output_path: Path where the JSON file will be saved
        """
        if not self.extracted_data:
            self.extract_data()

        try:
            with open(output_path, "w") as f:
                json.dump(self.extracted_data, f, indent=4)
            print(f"Data successfully saved to {output_path}")
        except Exception as e:
            print(f"Error saving data to JSON: {e}")


def extract_rpt_data(
    pdf_path: str, output_json_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Extract data from an RPT PDF file and optionally save to JSON.

    Args:
        pdf_path: Path to the RPT PDF file
        output_json_path: Optional path to save the extracted data as JSON

    Returns:
        Dictionary containing the extracted data
    """
    # Create an instance of RPTExtractor
    extractor = RPTExtractor(pdf_path)

    # Extract text and data
    extractor.extract_text()
    data = extractor.extract_data()

    # Save to JSON if output path is provided
    if output_json_path:
        extractor.save_to_json(output_json_path)

    return data


def save_example_text(pdf_path: str, output_txt_path: str) -> None:
    """
    Extract text from an RPT PDF file and save it to a text file.
    Useful for debugging and development.

    Args:
        pdf_path: Path to the RPT PDF file
        output_txt_path: Path to save the extracted text
    """
    text = RPTExtractor(pdf_path).extract_text()
    with open(output_txt_path, "w") as file:
        file.write(text)


if __name__ == "__main__":
    # Example usage
    import argparse

    parser = argparse.ArgumentParser(description="Extract data from RPT PDF files")
    parser.add_argument("pdf_path", help="Path to the RPT PDF file")
    parser.add_argument(
        "--output", "-o", help="Path to save the extracted data as JSON"
    )
    parser.add_argument(
        "--save-text", "-t", help="Path to save the extracted text (for debugging)"
    )

    args = parser.parse_args()

    # Extract data and save to JSON if output path is provided
    data = extract_rpt_data(args.pdf_path, args.output)

    # Save extracted text if requested
    if args.save_text:
        save_example_text(args.pdf_path, args.save_text)

    # Print a sample of the extracted data
    print("\nExtracted data:")
    for key, value in list(data.items()):
        print(f"{key}: {value}")
