# PDFBuilder

PDFBuilder is a tool designed to automate the creation of PDF reports from various document templates and data sources. It leverages Electron for the frontend and Python for backend processing, allowing for a seamless integration of document processing and user interface.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Installation

To set up the project locally, follow these steps:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/pdfbuilder.git
   cd pdfbuilder
   ```
2. **Install dependencies:**

   - For the backend, ensure you have Python installed and run:

     ```bash
     python -m venv .venv
     source .venv/bin/activate  # On Windows use `.venv\Scripts\activate`
     pip install -r requirements.txt
     ```
   - For the frontend, ensure you have Node.js installed and run:

     ```bash
     npm install
     ```
3. **Build the backend:**

   Run the build script to set up the backend environment and compile the necessary files:

   ```bash
   node src/backend/build-backend.js
   ```

## Usage

To start the application, use the following command:

```bash
npm start
```

This will launch the Electron application, which will handle the frontend and communicate with the backend to process documents and generate PDFs.

## Project Structure

- **src/backend/**: Contains the backend logic, primarily written in Python. It handles document processing and PDF generation.

  - `build-backend.js`: Script to set up the Python environment and compile the backend.
  - `build.ipynb`: Jupyter notebook for building and testing backend functionalities.
  - `report.json`: Sample report data used for generating PDFs.
- **src/main/**: Contains the main Electron process scripts.

  - `main.ts`: Main entry point for the Electron application.
  - `menu.ts`: Defines the application menu.
- **src/renderer/**: Contains the React components for the frontend.

  - `App.tsx`: Main React component for the application.
  - `components/`: Directory containing various React components used in the application.
- **assets/**: Contains static assets like images and icons.
