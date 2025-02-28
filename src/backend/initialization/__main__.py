"""
Main entry point for the initialization package.

This allows the package to be run directly from the command line:
python -m initialization.extract_RPT [args]
"""

import sys
import os

if __name__ == "__main__":
    # Check if a module name was provided
    if len(sys.argv) > 1:
        module_name = sys.argv[1]

        # Remove the module name from sys.argv
        sys.argv.pop(1)

        # Import and run the specified module
        if module_name == "extract_RPT":
            from .extract_RPT import extract_rpt_data, save_example_text

            # Parse command line arguments
            import argparse

            parser = argparse.ArgumentParser(
                description="Extract data from RPT PDF files"
            )
            parser.add_argument("pdf_path", help="Path to the RPT PDF file")
            parser.add_argument(
                "--output", "-o", help="Path to save the extracted data as JSON"
            )
            parser.add_argument(
                "--save-text",
                "-t",
                help="Path to save the extracted text (for debugging)",
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
        else:
            print(f"Unknown module: {module_name}")
            print("Available modules: extract_RPT")
            sys.exit(1)
    else:
        print("Usage: python -m initialization <module_name> [args]")
        print("Available modules: extract_RPT")
        sys.exit(1)
