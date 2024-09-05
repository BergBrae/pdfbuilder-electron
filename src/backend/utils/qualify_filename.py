import re


def qualify_filename(user_input: str, filename: str) -> bool:
    user_input = user_input.strip()
    if "'" in user_input or '"' in user_input:
        expression = create_expression(user_input, filename)
        # print(expression)
        try:
            return eval(expression)
        except Exception as e:
            print(f"Error evaluating expression: {e}")
            return False
    else:
        return user_input in filename


def create_expression(input_string, filename):
    # Regex pattern to match all single or double quoted strings
    pattern = re.compile(r'(["\'])(.*?)(\1)')

    # Function to replace matches with filename.contains(...)
    def replacer(match):
        quote, content, _ = match.groups()
        return f'{quote}{content}{quote} in r"""{filename}"""'

    # Replace all occurrences using the replacer function
    output_string = pattern.sub(replacer, input_string)

    return output_string


if __name__ == "__main__":
    test_filename = "QC.S58313.01(01)_ERICKSON_SEMI_ANNUAL_16A-16D.PDF"
    test_input = " 'QC.S5' and 'brady'  "
    print(
        qualify_filename(test_input, test_filename)
    )  # filename.contains('QC') and filename.contains('.S')
    # print(qualify_filename(test_input, test_filename))  # True
