import re

def validate_email(email: str) -> bool:
    email_regex = re.compile(
        r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)"
    )
    return bool(email_regex.match(email))

def validate_password_strength(password: str) -> bool:
    # At least 6 characters
    return len(password) >= 6
