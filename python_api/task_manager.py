import uuid
import time
from typing import Dict, Optional, List

class TaskManager:
    def __init__(self):
        # task_id -> task_dict
        self.tasks: Dict[str, dict] = {}
        
    def create_task(self, type: str, notebook_id: str) -> str:
        task_id = str(uuid.uuid4())
        self.tasks[task_id] = {
            "id": task_id,
            "type": type,
            "notebook_id": notebook_id,
            "status": "pending",
            "created_at": time.time(),
            "updated_at": time.time(),
            "result": None,
            "error": None
        }
        return task_id
        
    def update_status(self, task_id: str, status: str, result: dict = None, error: str = None):
        if task_id in self.tasks:
            self.tasks[task_id]["status"] = status
            self.tasks[task_id]["updated_at"] = time.time()
            if result:
                self.tasks[task_id]["result"] = result
            if error:
                self.tasks[task_id]["error"] = error
                
    def get_task(self, task_id: str) -> Optional[dict]:
        return self.tasks.get(task_id)
        
    def get_active_tasks(self, notebook_id: str) -> List[dict]:
        active = []
        now = time.time()
        for t in self.tasks.values():
            if t["notebook_id"] == notebook_id:
                # Include pending/running tasks
                if t["status"] in ["pending", "running"]:
                    active.append(t)
                # Include recently completed/failed tasks (e.g. within last 5 seconds)
                elif now - t["updated_at"] < 5:
                    active.append(t)
        return active

    def get_all_active_tasks_grouped(self) -> Dict[str, List[str]]:
        """Returns map of notebook_id -> list of active task types"""
        active_map = {}
        now = time.time()
        
        # Cleanup old tasks
        self._cleanup_old_tasks()
        
        for t in self.tasks.values():
            if t["status"] in ["pending", "running"] or (now - t["updated_at"] < 5):
                nb_id = t["notebook_id"]
                if nb_id not in active_map:
                    active_map[nb_id] = []
                active_map[nb_id].append(t["type"])
                
        return active_map

    def _cleanup_old_tasks(self):
        """Remove tasks older than 1 hour"""
        now = time.time()
        to_remove = []
        for tid, t in self.tasks.items():
            if now - t["updated_at"] > 3600:
                to_remove.append(tid)
        
        for tid in to_remove:
            del self.tasks[tid]

# Global instance
task_manager = TaskManager()
