import React, { createContext, useContext, useState, useEffect } from 'react';

const TaskContext = createContext();

export function useTask() {
    return useContext(TaskContext);
}

export function TaskProvider({ children }) {
    // Map of notebookId -> Set of running task types
    const [activeTasks, setActiveTasks] = useState({});

    // Recent completions for showing checkmarks temporarily
    // Map of notebookId -> timestamp
    const [completions, setCompletions] = useState({});

    // Polling interval
    const POLL_INTERVAL = 2000;

    useEffect(() => {
        const pollTasks = async () => {
            try {
                const res = await fetch("http://127.0.0.1:8000/api/tasks/active");
                if (res.ok) {
                    const data = await res.json();
                    if (Object.keys(data).length > 0) {
                        console.log("[DEBUG] TaskContext received tasks:", data);
                    }
                    setActiveTasks(prev => {
                        // Detect completions
                        const newCompletions = { ...completions };
                        let changed = false;

                        Object.keys(prev).forEach(nbId => {
                            if (!data[nbId]) {
                                newCompletions[nbId] = Date.now();
                                changed = true;
                            }
                        });

                        if (changed) setCompletions(newCompletions);
                        return data;
                    });
                }
            } catch (e) {
                console.error("Task poll error:", e);
            }
        };

        const interval = setInterval(pollTasks, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [completions]);

    // Clean up old completions (remove checkmark after 5s)
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setCompletions(prev => {
                const next = { ...prev };
                let changed = false;
                Object.keys(next).forEach(key => {
                    if (now - next[key] > 5000) {
                        delete next[key];
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const startTask = async (endpoint, payload) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Failed to start task");
            const data = await res.json();
            return data.task_id;
        } catch (e) {
            console.error("Start task error:", e);
            throw e;
        }
    };

    const waitForTask = async (taskId) => {
        return new Promise((resolve, reject) => {
            const check = async () => {
                try {
                    const res = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}`);
                    if (!res.ok) throw new Error("Failed to check task");
                    const data = await res.json();

                    if (data.status === "completed") resolve(data.result);
                    else if (data.status === "error") reject(new Error(data.error));
                    else setTimeout(check, 1000);
                } catch (e) {
                    reject(e);
                }
            };
            check();
        });
    };

    return (
        <TaskContext.Provider value={{ activeTasks, completions, startTask, waitForTask }}>
            {children}
        </TaskContext.Provider>
    );
}
