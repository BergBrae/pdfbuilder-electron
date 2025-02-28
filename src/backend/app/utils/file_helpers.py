"""
File helper utilities.
"""

import os
import uuid
import platform
import shutil
import glob
import re


def create_uuid():
    """
    Create a new UUID.

    Returns:
        str: A new UUID as a string
    """
    return str(uuid.uuid4())


def qualify_filename(filename):
    """
    Qualify a filename by removing invalid characters.

    Args:
        filename: The filename to qualify

    Returns:
        str: The qualified filename
    """
    # Import the original function from the utils module
    from utils.qualify_filename import qualify_filename as original_qualify_filename

    return original_qualify_filename(filename)


def is_windows():
    """
    Check if the current platform is Windows.

    Returns:
        bool: True if the current platform is Windows, False otherwise
    """
    return platform.system() == "Windows"


def ensure_directory_exists(directory_path):
    """
    Ensure that a directory exists, creating it if necessary.

    Args:
        directory_path: The path to the directory

    Returns:
        str: The path to the directory
    """
    os.makedirs(directory_path, exist_ok=True)
    return directory_path


def copy_file(source_path, destination_path):
    """
    Copy a file from source to destination.

    Args:
        source_path: The path to the source file
        destination_path: The path to the destination file

    Returns:
        str: The path to the destination file
    """
    shutil.copy2(source_path, destination_path)
    return destination_path


def find_files(directory, pattern):
    """
    Find files in a directory that match a pattern.

    Args:
        directory: The directory to search in
        pattern: The pattern to match

    Returns:
        list: A list of file paths that match the pattern
    """
    return glob.glob(os.path.join(directory, pattern))


def normalize_path(path):
    """
    Normalize a path.

    Args:
        path: The path to normalize

    Returns:
        str: The normalized path
    """
    return os.path.normpath(path)
