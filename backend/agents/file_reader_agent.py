"""
File Reader Agent — Reads and extracts content from uploaded files.
Supports PDF, images, and text files.
This agent completely reads the uploaded file and creates a comprehensive
summary that other agents can use.
"""

import io
import base64
from backend.state import AlfredState
from backend.llm import chat


def file_reader_agent_node(state: AlfredState) -> dict:
    """Read the uploaded file content and create a usable text summary."""
    file_context = state.get("file_context", "")
    
    if not file_context:
        return {"file_context": ""}
    
    # If the file_context is already processed (starts with [PROCESSED]), skip
    if file_context.startswith("[PROCESSED]"):
        return {"file_context": file_context}
    
    # Use LLM to create a structured summary of the file content
    summary = chat(
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a document analysis expert. Read the following file content carefully "
                    "and create a comprehensive, well-structured summary. Include:\n"
                    "1. Main topic/subject\n"
                    "2. Key points and important details\n"
                    "3. Any data, figures, or statistics mentioned\n"
                    "4. Important terms and definitions\n"
                    "5. Conclusions or main takeaways\n\n"
                    "Be thorough — capture ALL important information. The user will ask questions about this."
                ),
            },
            {
                "role": "user",
                "content": f"Here is the file content to analyze:\n\n{file_context[:6000]}",
            },
        ],
        temperature=0.3,
    )
    
    processed = f"[PROCESSED] File Summary:\n{summary}\n\nOriginal Content:\n{file_context[:3000]}"
    
    return {"file_context": processed}


def extract_file_content(file_bytes: bytes, filename: str) -> str:
    """Extract text content from various file types."""
    extracted_text = ""
    
    if filename.lower().endswith(".pdf"):
        try:
            import PyPDF2
            reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
            pages = []
            for page in reader.pages[:30]:  # Max 30 pages
                text = page.extract_text()
                if text:
                    pages.append(text.strip())
            extracted_text = "\n\n--- Page Break ---\n\n".join(pages)
        except ImportError:
            extracted_text = "[Error: PyPDF2 not installed. Run: pip install PyPDF2]"
        except Exception as e:
            extracted_text = f"[Error reading PDF: {str(e)}]"
    
    elif filename.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".webp")):
        extracted_text = f"[Image file: {filename} — Image was uploaded but text extraction requires OCR]"
    
    elif filename.lower().endswith((".txt", ".md", ".csv", ".json", ".py", ".js", ".ts", ".html", ".css", ".xml", ".yml", ".yaml")):
        try:
            extracted_text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            extracted_text = file_bytes.decode("latin-1")
    
    else:
        try:
            extracted_text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            extracted_text = f"[Binary file: {filename} — cannot extract text]"
    
    # Truncate very large files
    if len(extracted_text) > 8000:
        extracted_text = extracted_text[:8000] + "\n\n[... content truncated, showing first 8000 characters ...]"
    
    return extracted_text
