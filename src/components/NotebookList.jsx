import React, { useEffect, useState, useRef } from 'react';
import ConfirmationModal from './ConfirmationModal';
import { useTask } from '../context/TaskContext';

export default function NotebookList({ activeId, onSelect, width }) {
    const { activeTasks, completions } = useTask();
    const [notebooks, setNotebooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState("");

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [notebookToDelete, setNotebookToDelete] = useState(null);

    // Rename State
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const editInputRef = useRef(null);

    // Menu State
    const [menuOpenId, setMenuOpenId] = useState(null);
    const menuRef = useRef(null);

    const inputRef = useRef(null);

    useEffect(() => {
        if (isCreating && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isCreating]);

    useEffect(() => {
        if (editingId && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingId]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpenId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleMenu = (e, id) => {
        e.stopPropagation();
        setMenuOpenId(menuOpenId === id ? null : id);
    };

    const handleMenuAction = (e, action, notebook) => {
        e.stopPropagation();
        setMenuOpenId(null);
        if (action === 'rename') {
            startRename(e, notebook);
        } else if (action === 'delete') {
            handleDeleteClick(e, notebook.id);
        }
    };

    const fetchNotebooks = () => {
        fetch("http://127.0.0.1:8000/api/notebooks")
            .then(res => res.json())
            .then(data => {
                console.log("[DEBUG] NotebookList fetched data:", data);
                setNotebooks(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load notebooks:", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchNotebooks();
    }, []);

    const handleCreate = async () => {
        if (!newTitle.trim()) return setIsCreating(false);
        try {
            const res = await fetch("http://127.0.0.1:8000/api/notebooks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newTitle })
            });
            if (res.ok) {
                const data = await res.json();
                console.log("[DEBUG] NotebookList: Created new notebook, response:", data);
                fetchNotebooks();
                setNewTitle("");
                setIsCreating(false);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteClick = (e, id) => {
        e.stopPropagation();
        setNotebookToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!notebookToDelete) return;
        try {
            await fetch(`http://127.0.0.1:8000/api/notebooks/${notebookToDelete}`, { method: "DELETE" });
            if (activeId === notebookToDelete) onSelect(null);
            fetchNotebooks();
        } catch (e) {
            console.error(e);
        } finally {
            setNotebookToDelete(null);
            setDeleteModalOpen(false);
        }
    };

    const startRename = (e, notebook) => {
        e.stopPropagation();
        setEditingId(notebook.id);
        setEditTitle(notebook.title);
    };

    const handleRename = async () => {
        if (!editingId || !editTitle.trim()) {
            setEditingId(null);
            return;
        }

        const original = notebooks.find(n => n.id === editingId);
        if (original && original.title === editTitle) {
            setEditingId(null);
            return;
        }

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/notebooks/${editingId}/rename`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: editTitle })
            });
            if (res.ok) {
                fetchNotebooks();
            } else {
                throw new Error("Rename failed");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to rename notebook");
        } finally {
            setEditingId(null);
        }
    };

    if (loading) return <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>Loading notebooks...</div>;

    return (
        <div className="sidebar" style={{ width: width }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: '1.8rem',
                        fontWeight: '700',
                        letterSpacing: '-0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                    }}>
                        <span style={{ color: 'var(--text-primary)' }}>Notebook</span>
                        <span style={{
                            background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            color: 'transparent',
                            marginLeft: '1px'
                        }}>LM</span>
                    </h2>
                </div>
                <button onClick={() => setIsCreating(true)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '1.2rem' }}>+</button>
            </div>

            {
                isCreating && (
                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '8px' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="New Notebook Name"
                            style={{
                                background: '#2d2d2d', border: '1px solid #444',
                                color: '#fff', padding: '6px', borderRadius: '4px',
                                width: '100%', outline: 'none'
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreate();
                                if (e.key === 'Escape') setIsCreating(false);
                            }}
                        />
                    </div>
                )
            }

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {notebooks.map((nb) => {
                    const isActive = !!activeTasks[nb.id];
                    const isComplete = !!completions[nb.id] && !isActive;

                    if (isActive || isComplete) {
                        console.log(`[DEBUG] NotebookList render item: ${nb.id}, active=${isActive}, complete=${isComplete}`);
                    }

                    return (
                        <div
                            key={nb.id}
                            className={`notebook-item ${activeId === nb.id ? 'active' : ''}`}
                            onClick={() => onSelect(nb.id)}
                            style={{ position: 'relative' }}
                        >
                            {/* Left Icon Removed as requested */}
                            <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: '10px' }} onDoubleClick={(e) => startRename(e, nb)}>
                                {editingId === nb.id ? (
                                    <input
                                        ref={editInputRef}
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onBlur={handleRename}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleRename();
                                            if (e.key === 'Escape') setEditingId(null);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            background: '#1e1e1e', border: '1px solid #4da6ff',
                                            color: '#fff', padding: '2px 6px', borderRadius: '4px',
                                            width: '100%', outline: 'none', fontSize: '0.9rem'
                                        }}
                                    />
                                ) : (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', overflow: 'hidden' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                            stroke={`hsl(${(nb.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 137) % 360}, 70%, 60%)`}
                                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                            <line x1="10" y1="9" x2="8" y2="9"></line>
                                        </svg>
                                        <span style={{
                                            flex: 1,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {nb.title}
                                        </span>
                                        {/* Task Status Icons - Moved outside title span but inside flex container */}
                                        {isActive && (
                                            <span style={{
                                                fontSize: '1.2rem',
                                                animation: 'pulse 1.5s ease-in-out infinite',
                                                flexShrink: 0,
                                                color: '#ffeb3b', // Bright yellow for visibility test
                                                textShadow: '0 0 8px rgba(255, 235, 59, 0.5)'
                                            }}>
                                                ⏳
                                            </span>
                                        )}
                                        {isComplete && (
                                            <span style={{
                                                fontSize: '1.2rem',
                                                color: '#10b981',
                                                flexShrink: 0,
                                                textShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
                                            }}>
                                                ✅
                                            </span>
                                        )}
                                    </span>
                                )}
                            </div>
                            {/* Three Dots Menu Button */}
                            <button
                                className="menu-btn"
                                onClick={(e) => toggleMenu(e, nb.id)}
                                style={{
                                    background: 'transparent', border: 'none', color: '#888',
                                    cursor: 'pointer', padding: '4px', borderRadius: '4px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s', marginLeft: '8px'
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="1"></circle>
                                    <circle cx="12" cy="5" r="1"></circle>
                                    <circle cx="12" cy="19" r="1"></circle>
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {menuOpenId === nb.id && (
                                <div
                                    ref={menuRef}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '35px',
                                        background: '#2d2d2d',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                                        border: '1px solid #444',
                                        zIndex: 100,
                                        overflow: 'hidden',
                                        minWidth: '120px'
                                    }}
                                >
                                    <div
                                        onClick={(e) => handleMenuAction(e, 'rename', nb)}
                                        className="menu-item"
                                        style={{ padding: '8px 12px', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <span>✏️</span> Rename
                                    </div>
                                    <div
                                        onClick={(e) => handleMenuAction(e, 'delete', nb)}
                                        className="menu-item"
                                        style={{ padding: '8px 12px', fontSize: '0.9rem', cursor: 'pointer', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <span>🗑️</span> Remove
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="刪除筆記本"
                message="確定要刪除此筆記本嗎？此操作無法復原。"
                confirmText="刪除"
            />
            <style>{`
                .menu-btn:hover { background-color: rgba(255,255,255,0.1); color: #fff; }
                .menu-item:hover { background-color: rgba(255,255,255,0.05); }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div >
    );
}
