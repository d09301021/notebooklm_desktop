from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from notebook_client import manager
from task_manager import task_manager
import os
import asyncio
import json
from pathlib import Path

app = FastAPI()

# Add CORS middleware
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NotebookCreate(BaseModel):
    title: str

class ContentRequest(BaseModel):
    content: str

class QuizRequest(BaseModel):
    difficulty: str = "medium"
    quantity: str = "standard"
    instructions: Optional[str] = None
    output_format: str = "json"

class SourceUrlResult(BaseModel):
    source_id: str
    notebook_id: str

@app.on_event("startup")
async def startup_event():
    print("Startup: Checking authentication...")
    # Optional: try to auto-connect here?
    await manager.try_auto_connect()

@app.get("/api/notebooks")
async def list_notebooks():
    try:
        notebooks = await manager.list_notebooks()
        # Serialize notebooks
        return [{"id": nb.id, "title": nb.title, "icon_url": None} for nb in notebooks]
    except Exception as e:
        # If authed failed, return 401 or empty list?
        print(f"List notebooks error: {e}")
        raise HTTPException(status_code=401, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok", "authenticated": manager.client is not None}

@app.post("/api/login")
async def login():
    try:
        success = await manager.login_with_playwright()
        if success:
            return {"status": "success"}
        else:
            raise HTTPException(status_code=401, detail="Login failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate_video")
async def create_video(req: ContentRequest):
    notebook_id = manager.current_notebook_id
    task_id = None
    
    try:
        if notebook_id:
            task_id = task_manager.create_task("generate_video", notebook_id)
            task_manager.update_status(task_id, "running")
            
        filename = await manager.generate_video(req.content)
        
        if task_id:
            task_manager.update_status(task_id, "completed")
            
        return {"status": "success", "filename": filename}
    except Exception as e:
        if task_id:
            task_manager.update_status(task_id, "error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/notebooks")
async def create_notebook(notebook: NotebookCreate):
    try:
        nb = await manager.create_notebook(notebook.title)
        return {"status": "success", "notebook": {"id": nb.id, "title": nb.title}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/notebooks/{notebook_id}/rename")
async def rename_notebook(notebook_id: str, req: NotebookCreate):
    try:
        await manager.rename_notebook(notebook_id, req.title)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/notebooks/{notebook_id}")
async def delete_notebook(notebook_id: str):
    try:
        await manager.delete_notebook(notebook_id)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/select_notebook")
async def select_notebook(req: dict):
    notebook_id = req.get("notebook_id")
    if not notebook_id:
        raise HTTPException(status_code=400, detail="notebook_id required")
    
    manager.set_notebook(notebook_id)
    
    # Pre-fetch sources
    try:
        sources = await manager.get_sources()
        return {"status": "success", "sources": sources}
    except Exception as e:
         print(f"Error fetching sources on select: {e}")
         return {"status": "success", "sources": []}

@app.get("/api/sources/{source_id}")
async def get_source(source_id: str):
    try:
        data = await manager.get_source_content(source_id)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/sources/{source_id}")
async def delete_source(source_id: str, notebook_id: str):
    try:
        await manager.delete_source(notebook_id, source_id)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/notebooks/{notebook_id}/sources/{source_id}/summary")
async def get_source_summary(notebook_id: str, source_id: str):
    try:
        summary = await manager.generate_source_summary(notebook_id, source_id)
        return {"summary": summary}
    except Exception as e:
        print(f"Error generating summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sources/url")
async def add_source_url(req: dict):
    url = req.get("url")
    notebook_id = req.get("notebook_id") or manager.current_notebook_id
    if not url or not notebook_id:
        raise HTTPException(status_code=400, detail="url and notebook_id required")
    try:
        source = await manager.add_source_url(notebook_id, url)
        return {"status": "success", "source_id": source.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sources/text")
async def add_source_text(req: dict):
    title = req.get("title")
    content = req.get("content")
    notebook_id = req.get("notebook_id") or manager.current_notebook_id
    
    if not title or not content or not notebook_id:
        raise HTTPException(status_code=400, detail="title, content and notebook_id required")
    
    try:
        source = await manager.add_source_text(notebook_id, title, content)
        return {"status": "success", "source_id": source.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sources/file")
async def add_source_file(
    file: UploadFile = File(...),
    notebook_id: str = Form(...)
):
    try:
        # Save uploaded file temporarily
        temp_dir = Path("temp_uploads")
        temp_dir.mkdir(exist_ok=True)
        temp_file_path = temp_dir / file.filename
        
        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
            
        print(f"Uploading file {temp_file_path} to notebook {notebook_id}")
        await manager.add_source_file(notebook_id, str(temp_file_path.absolute()))
        
        # Clean up
        try:
            temp_file_path.unlink()
        except:
            pass
        
        return {"status": "success", "message": f"File {file.filename} added"}
    except Exception as e:
        print(f"File upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/stream_query")
async def stream_query(req: dict):
    prompt = req.get("prompt")
    if not prompt: raise HTTPException(status_code=400, detail="prompt required")
    
    notebook_id = manager.current_notebook_id
    print(f"[DEBUG] stream_query: notebook_id={notebook_id}")
    task_id = None
    if notebook_id:
        task_id = task_manager.create_task("chat_query", notebook_id)
        print(f"[DEBUG] Created task {task_id} for notebook {notebook_id}")
        task_manager.update_status(task_id, "running")

    async def generate_with_tracking():
        try:
            async for chunk in manager.stream_query(prompt):
                yield chunk
            if task_id:
                task_manager.update_status(task_id, "completed")
        except Exception as e:
            if task_id:
                task_manager.update_status(task_id, "error", error=str(e))
            raise
    
    return StreamingResponse(generate_with_tracking(), media_type="text/plain")

@app.get("/api/history")
def get_history(notebook_id: str = None):
    if notebook_id:
        return manager.get_history(notebook_id)
    return []

@app.get("/api/notebook_suggestions/{notebook_id}")
async def get_suggestions(notebook_id: str):
    try:
        suggestions = await manager.get_suggested_questions(notebook_id)
        print(f"Suggestions for {notebook_id}: {suggestions}")  # Debug log
        return {"suggestions": suggestions}
    except Exception as e:
        print(f"Error getting suggestions: {e}")
        return {"suggestions": []}

@app.get("/api/notebooks/{notebook_id}/artifacts")
async def get_artifacts(notebook_id: str):
    artifacts = manager.get_artifacts(notebook_id)
    return {"artifacts": artifacts}

@app.get("/api/notebooks/{notebook_id}/artifacts/{artifact_id}/content")
async def get_artifact_content(notebook_id: str, artifact_id: str):
    content = manager.get_artifact_content(notebook_id, artifact_id)
    if content is None:
        raise HTTPException(status_code=404, detail="Artifact content not found")
    return {"content": content}

@app.post("/api/notebooks/{notebook_id}/artifacts/{artifact_id}/export/docx")
async def export_artifact_docx(notebook_id: str, artifact_id: str):
    content = manager.get_artifact_content(notebook_id, artifact_id)
    if content is None:
        raise HTTPException(status_code=404, detail="Artifact content not found")
    
    # Check if artifact is quiz type (rough check, or we assume frontend sends correct request)
    # We'll just try to convert. If it fails, error out.
    
    try:
        # Determine download path
        # User requested "DownLoads" folder. On Windows usually User Profile / Downloads
        downloads_path = Path.home() / "Downloads"
        
        # Get artifact details for filename
        artifacts = manager.get_artifacts(notebook_id)
        artifact = next((a for a in artifacts if a["id"] == artifact_id), None)
        title = artifact.get("title", "Quiz") if artifact else "Quiz"
        
        # Sanitize filename
        safe_title = "".join(x for x in title if x.isalnum() or x in " -_").strip()
        filename = downloads_path / f"{safe_title}.docx"
        
        # Generate
        saved_path = await manager.export_quiz_to_docx(content, str(filename))
        
        return {"status": "success", "path": saved_path}
    except Exception as e:
        print(f"Export error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Task Management Endpoints ---

@app.post("/api/tasks/source_summary")
async def start_source_summary_task(req: dict):
    """Start a background task for AI source summary generation"""
    notebook_id = req.get("notebook_id")
    source_id = req.get("source_id")
    
    if not notebook_id or not source_id:
        raise HTTPException(status_code=400, detail="notebook_id and source_id required")
    
    task_id = task_manager.create_task("source_summary", notebook_id)
    
    async def run_task():
        try:
            task_manager.update_status(task_id, "running")
            summary = await manager.generate_source_summary(notebook_id, source_id)
            task_manager.update_status(task_id, "completed", result={"summary": summary})
        except Exception as e:
            task_manager.update_status(task_id, "error", error=str(e))
    
    asyncio.create_task(run_task())
    
    return {"task_id": task_id, "status": "pending"}

@app.get("/api/tasks/active")
async def get_active_tasks():
    """Get all active tasks grouped by notebook ID"""
    tasks = task_manager.get_all_active_tasks_grouped()
    print(f"[DEBUG] get_active_tasks returning: {tasks}")
    return tasks

@app.get("/api/tasks/{task_id}")
async def get_task_status(task_id: str):
    """Get the status of a specific task"""
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

# --- Content Generation Endpoints ---

# --- Generators ---

@app.post("/api/generate_audio")
async def create_audio(req: ContentRequest):
    notebook_id = manager.current_notebook_id
    task_id = None
    
    try:
        if notebook_id:
            task_id = task_manager.create_task("generate_audio", notebook_id)
            task_manager.update_status(task_id, "running")
            
        filename = await manager.generate_audio(req.content)
        
        if task_id:
            task_manager.update_status(task_id, "completed")
            
        return {"status": "success", "filename": filename}
    except Exception as e:
        if task_id:
            task_manager.update_status(task_id, "error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate_video")
async def create_video(req: ContentRequest):
    notebook_id = manager.current_notebook_id
    task_id = None
    
    try:
        if notebook_id:
            task_id = task_manager.create_task("generate_video", notebook_id)
            task_manager.update_status(task_id, "running")
        
        filename = await manager.generate_video(req.content)
        
        if task_id:
            task_manager.update_status(task_id, "completed")
        
        return {"status": "success", "filename": filename}
    except Exception as e:
        if task_id:
            task_manager.update_status(task_id, "error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate_quiz")
async def create_quiz(req: QuizRequest):
    """Generate quiz with custom settings"""
    notebook_id = manager.current_notebook_id
    task_id = None
    
    try:
        if notebook_id:
            task_id = task_manager.create_task("generate_quiz", notebook_id)
            task_manager.update_status(task_id, "running")
            
        filename = await manager.generate_quiz(
            difficulty=req.difficulty,
            quantity=req.quantity,
            instructions=req.instructions,
            output_format=req.output_format
        )
        
        if task_id:
            task_manager.update_status(task_id, "completed")
            
        return {"status": "success", "filename": filename}
    except Exception as e:
        if task_id:
            task_manager.update_status(task_id, "error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate_mindmap")
async def create_mindmap(req: ContentRequest):
    notebook_id = manager.current_notebook_id
    task_id = None
    
    try:
        if notebook_id:
            task_id = task_manager.create_task("generate_mindmap", notebook_id)
            task_manager.update_status(task_id, "running")
        
        filename = await manager.generate_mindmap()
        print(f"[DEBUG] Mindmap generated at: {filename}")
        
        # Read the generated mindmap file to return its content
        mindmap_data = None
        if os.path.exists(filename):
            print(f"[DEBUG] Mindmap file exists. Size: {os.path.getsize(filename)} bytes")
            try:
                # Try UTF-8 first
                with open(filename, 'r', encoding='utf-8') as f:
                    content = f.read()
                    print(f"[DEBUG] Successfully read {len(content)} chars from file")
                    mindmap_data = json.loads(content)
                
                # ALSO: Add it to the chat history so it persists
                if notebook_id and mindmap_data:
                    mindmap_text = f"!!MINDMAP!!{json.dumps(mindmap_data)}"
                    manager.add_message(notebook_id, "ai", mindmap_text)
                    print(f"[DEBUG] Saved mindmap to history for notebook {notebook_id}")
            except Exception as read_err:
                print(f"[ERROR] Error reading mindmap file: {read_err}")
                try:
                    # Fallback for some Windows encodings
                    print("[DEBUG] Attempting fallback encoding (cp950)...")
                    with open(filename, 'r', encoding='cp950', errors='replace') as f:
                        mindmap_data = json.load(f)
                except Exception as fallback_err:
                    print(f"[ERROR] Fallback encoding also failed: {fallback_err}")
        else:
            print(f"[ERROR] Mindmap file not found at expected path: {filename}")
        
        if task_id:
            task_manager.update_status(task_id, "completed")
        
        return {
            "status": "success", 
            "filename": filename,
            "data": mindmap_data
        }
    except Exception as e:
        if task_id:
            task_manager.update_status(task_id, "error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate_slides")
async def create_slides(req: ContentRequest):
    notebook_id = manager.current_notebook_id
    task_id = None
    
    try:
        if notebook_id:
            task_id = task_manager.create_task("generate_slides", notebook_id)
            task_manager.update_status(task_id, "running")
        
        filename = await manager.generate_slide_deck()
        
        if task_id:
            task_manager.update_status(task_id, "completed")
        
        return {"status": "success", "filename": filename}
    except Exception as e:
        if task_id:
            task_manager.update_status(task_id, "error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate_flashcards")
async def create_flashcards(req: ContentRequest):
    """Generate flashcards - quantity can be 'less', 'normal', or 'more'"""
    notebook_id = manager.current_notebook_id
    task_id = None
    
    try:
        if notebook_id:
            task_id = task_manager.create_task("generate_flashcards", notebook_id)
            task_manager.update_status(task_id, "running")
        
        quantity = req.content if req.content in ["less", "normal", "more"] else "normal"
        filename = await manager.generate_flashcards(quantity=quantity, output_format="json")
        
        if task_id:
            task_manager.update_status(task_id, "completed")
            
        return {"status": "success", "filename": filename}
    except Exception as e:
        if task_id:
            task_manager.update_status(task_id, "error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate_study_guide")
async def create_study_guide(req: ContentRequest):
    notebook_id = manager.current_notebook_id
    task_id = None
    
    try:
        if notebook_id:
            task_id = task_manager.create_task("generate_study_guide", notebook_id)
            task_manager.update_status(task_id, "running")
        
        filename = await manager.generate_study_guide()
        
        # Read the generated study guide content
        study_guide_content = ""
        if os.path.exists(filename):
            try:
                with open(filename, 'r', encoding='utf-8') as f:
                    study_guide_content = f.read()
                
                # Add to chat history
                if notebook_id and study_guide_content:
                    manager.add_message(notebook_id, "ai", study_guide_content)
                    print(f"[DEBUG] Saved study guide to history for notebook {notebook_id}")
            except Exception as read_err:
                print(f"[ERROR] Error reading study guide file: {read_err}")
        
        if task_id:
            task_manager.update_status(task_id, "completed")
        
        return {
            "status": "success", 
            "filename": filename,
            "data": study_guide_content
        }
    except Exception as e:
        if task_id:
            task_manager.update_status(task_id, "error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    import sys
    
    # Fix for PyInstaller: redirect stdout/stderr if they are None
    if getattr(sys, 'frozen', False):
        # Running from PyInstaller bundle
        import io
        import os
        
        # Create log file for output in APPDATA to ensure write permissions
        log_dir = os.path.join(os.environ.get("LOCALAPPDATA", os.environ.get("APPDATA", ".")), "notebooklm-desktop")
        try:
            os.makedirs(log_dir, exist_ok=True)
            log_file_path = os.path.join(log_dir, "backend.log")
            log_file = open(log_file_path, "w", encoding="utf-8")
            print(f"Logging to {log_file_path}")
        except Exception as e:
            # Fallback to current directory if APPDATA fails (unlikely)
            log_file = open("backend.log", "w", encoding="utf-8")
            print(f"Logging to backend.log (fallback) - Error: {e}")
        
        # Redirect stdout and stderr if they are None
        if sys.stdout is None:
            sys.stdout = log_file
        if sys.stderr is None:
            sys.stderr = log_file
        
        print("Starting NotebookLM Backend (PyInstaller mode)...")
        
        # Use simplified logging config for PyInstaller
        uvicorn.run(
            app, 
            host="127.0.0.1", 
            port=8000,
            log_config=None,  # Disable default logging config
            access_log=False   # Disable access log to avoid formatter issues
        )
    else:
        # Normal development mode
        uvicorn.run(app, host="127.0.0.1", port=8000)

