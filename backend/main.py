from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
import os
from supabase import create_client
from typing import Optional, List, Dict, Any
import random
import string
import re
from math import log2

app = FastAPI()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase configuration")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

class CodeShare(BaseModel):
    content: str
    title: Optional[str] = "Untitled Snippet"
    language: Optional[str] = "text"

def calculate_entropy(text: str) -> float:
    """Calculate Shannon entropy of a string."""
    if not text:
        return 0
        
    frequencies = {}
    for char in text:
        frequencies[char] = frequencies.get(char, 0) + 1
        
    length = len(text)
    return -sum(count/length * log2(count/length) 
               for count in frequencies.values())

def is_likely_secret(value: str) -> bool:
    """Check if a string looks like a secret based on its characteristics."""
    if len(value) < 16:
        return False
        
    if re.match(r'^[\da-f]{32}$', value, re.I):  # MD5-like hash
        return True
    if re.match(r'^[\w-]+\.[\w-]+\.[\w-]+$', value):  # JWT-like token
        return True
    if re.match(r'^[A-Za-z0-9+/=]+$', value):  # Base64-like string
        return True
        
    # Hex-encoded values
    if re.match(r'^[\da-f]+$', value, re.I) and len(value) >= 16:
        return True
 
    entropy = calculate_entropy(value)
    if entropy > 4.0: 
        return True
   
    has_upper = bool(re.search(r'[A-Z]', value))
    has_lower = bool(re.search(r'[a-z]', value))
    has_digit = bool(re.search(r'\d', value))
    has_special = bool(re.search(r'[^A-Za-z0-9]', value))
    complexity_score = sum([has_upper, has_lower, has_digit, has_special])
    
    return complexity_score >= 3 and len(value) >= 24

def detect_secrets(code: str) -> List[Dict[str, Any]]:
    secrets = []
    patterns = {
        'API_KEY': r'(?:api[_-]?key|apikey|key|api)[\'"]?\s*(?::|=)\s*[\'"]?([a-zA-Z0-9_\-]{8,})[\'"]?',
        'PASSWORD': r'(?:password|passwd|pwd|psw|psswd|pass)[\'"]?\s*(?::|=)\s*[\'"]?([^\'"\s]+)[\'"]?',
        'TOKEN': r'(?:token|jwt|bearer|auth)[\'"]?\s*(?::|=)\s*[\'"]?([a-zA-Z0-9_\-\.]+)[\'"]?',
        'SECRET_KEY': r'(?:secret[_-]?key|secretkey|secret)[\'"]?\s*(?::|=)\s*[\'"]?([a-zA-Z0-9_\-]{8,})[\'"]?',
        'ACCESS_KEY': r'(?:access[_-]?key|access)[\'"]?\s*(?::|=)\s*[\'"]?([a-zA-Z0-9_\-]{8,})[\'"]?',
        'PRIVATE_KEY': r'(?:private[_-]?key|private)[\'"]?\s*(?::|=)\s*[\'"]?([a-zA-Z0-9_\-\/+]{20,}={0,2})[\'"]?',
        'JWT': r'(?:eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})',
        'HASH_PATTERN': r'(?:const|let|var)?\s*\w+\s*=\s*[\'"]?([\da-f]{32}|[\dA-F]{32})[\'"]?',
        'GENERIC_SECRET': r'(?:const|let|var)?\s*\w+\s*=\s*[\'"]?([a-zA-Z0-9_\-\.]{32,})[\'"]?',
        'INLINE_API_KEY': r'(?:[\?&](?:api[_-]?key|key|apikey|token)=)([a-zA-Z0-9_\-]{8,})',
        'SUSPICIOUS_VALUE': r'(?:const|let|var)?\s*\w+\s*=\s*[\'"]?([a-zA-Z0-9_\-\.]{16,})[\'"]?'
    }
    
    def is_pattern_definition(line: str) -> bool:
        return any(
            f"'{pattern_name}'" in line and "'(?:" in line
            for pattern_name in patterns.keys()
        )
    
    for line_num, line in enumerate(code.split('\n'), 1):
        if is_pattern_definition(line):
            continue
            
        # URLs with embedded credentials
        if re.search(r'https?:\/\/[^:]+:[^@]+@', line) or \
           re.search(r'[?&](key|token|secret|password|apikey)=', line):
            match = re.search(r'(https?:\/\/[^\s\'"]+)', line)
            if match:
                secrets.append({
                    'type': 'INLINE_API_KEY',
                    'line': line_num,
                    'value': match.group(1)
                })
        
        # All patterns
        for secret_type, pattern in patterns.items():
            for match in re.finditer(pattern, line, re.IGNORECASE):
                value = match.group(1) if match.groups() else match.group(0)
                if value and (
                    secret_type == 'JWT' or
                    secret_type == 'PASSWORD' or
                    secret_type == 'HASH_PATTERN' or
                    'API_KEY' in secret_type or
                    is_likely_secret(value)
                ):
                    secrets.append({
                        'type': secret_type,
                        'line': line_num,
                        'value': value
                    })
    
    # Remove duplicates
    unique_secrets = []
    seen = set()
    for secret in secrets:
        key = (secret['line'], secret['value'])
        if key not in seen:
            seen.add(key)
            unique_secrets.append(secret)
    
    return unique_secrets

def redact_secrets(code: str, secrets: List[Dict[str, Any]]) -> str:
    lines = code.split('\n')
    for secret in secrets:
        line = lines[secret['line'] - 1]
        if line and not any(f"'{pattern}'" in line and "'(?:" in line 
                          for pattern in ['API_KEY', 'PASSWORD', 'TOKEN']):
            lines[secret['line'] - 1] = line.replace(secret['value'], '[REDACTED]')
    return '\n'.join(lines)

@app.post("/share", status_code=201)
async def share_code(code_share: CodeShare):
    try:
        # Detect and redact secrets
        secrets = detect_secrets(code_share.content)
        redacted_code = redact_secrets(code_share.content, secrets)
        
        share_id = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        data = {
            "share_id": share_id,
            "original_content": code_share.content,
            "redacted_content": redacted_code,
            "title": code_share.title,
            "language": code_share.language,
            "expires_at": expires_at.isoformat()
        }
        
        result = supabase.table("code_snippets").insert(data).execute()
        
        if result.data:
            response = {
                "share_url": f"https://secureshare-site.vercel.app/share/{share_id}",
                "secrets_found": len(secrets),
                "secret_types": [s['type'] for s in secrets]
            }
            return response
        else:
            raise HTTPException(status_code=500, detail="Failed to store code snippet")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
