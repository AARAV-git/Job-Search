import json
from typing import Any, List

def parse_comma_separated(val: Any) -> List[str]:
    if not val:
        return []
    if isinstance(val, list):
        return [str(v).strip() for v in val if str(v).strip()]
    if isinstance(val, str):
        # Could be JSON string or simple comma-separated string
        val = val.strip()
        if val.startswith("[") and val.endswith("]"):
            try:
                parsed = json.loads(val)
                if isinstance(parsed, list):
                    return [str(v).strip() for v in parsed if str(v).strip()]
            except Exception:
                pass
        return [item.strip() for item in val.split(",") if item.strip()]
    return [str(val).strip()]

def format_as_json_string(val: Any) -> str:
    if val is None:
        return "[]"
    if isinstance(val, str):
        # check if already JSON
        try:
            json.loads(val)
            return val
        except ValueError:
            return json.dumps(parse_comma_separated(val))
    return json.dumps(val)
