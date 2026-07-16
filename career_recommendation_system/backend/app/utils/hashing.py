import bcrypt

class Hash:
    @staticmethod
    def bcrypt(password: str) -> str:
        """
        Hashes a password string using raw bcrypt directly.
        Avoids passlib Python 3.11/3.12 compatibility bugs.
        """
        # Encode string to bytes
        pwd_bytes = password.encode('utf-8')
        # Generate salt
        salt = bcrypt.gensalt()
        # Hash password
        hashed_bytes = bcrypt.hashpw(pwd_bytes, salt)
        # Convert back to string for storage in SQLite
        return hashed_bytes.decode('utf-8')

    @staticmethod
    def verify(hashed_password: str, plain_password: str) -> bool:
        """
        Verifies a plain password string against a hashed password string.
        """
        try:
            pwd_bytes = plain_password.encode('utf-8')
            hashed_bytes = hashed_password.encode('utf-8')
            return bcrypt.checkpw(pwd_bytes, hashed_bytes)
        except Exception:
            return False
