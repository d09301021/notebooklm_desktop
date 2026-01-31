import React, { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';
import ArtifactViewer from './ArtifactViewer';

export default function SourceList({ sources, notebookId, onRefresh, width, isDarkMode, onThemeToggle, isLoading, artifacts, onRefreshArtifacts }) {
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [viewingSource, setViewingSource] = useState(null);
    const [viewingArtifact, setViewingArtifact] = useState(null);
    const [loadingContent, setLoadingContent] = useState(false);
    const [sourceGuide, setSourceGuide] = useState(null);
    const [guideLoading, setGuideLoading] = useState(false);
    const [guideError, setGuideError] = useState(null);

    // Add Source State
    const [showAddModal, setShowAddModal] = useState(false);
    const [addTab, setAddTab] = useState('url'); // 'url', 'text', 'file'
    const [addInput, setAddInput] = useState({ url: '', title: '', content: '', file: null });
    const [addLoading, setAddLoading] = useState(false);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [sourceToDelete, setSourceToDelete] = useState(null);

    if (!sources) return null;

    const getIcon = (type) => {
        const t = (type || "").toLowerCase();

        const iconStyle = {
            width: '20px', height: '20px', borderRadius: '50%',
            display: 'inline-flex', justifyContent: 'center', alignItems: 'center',
            marginRight: '8px', flexShrink: 0, verticalAlign: 'middle'
        };

        const svgStyle = { width: '12px', height: '12px', stroke: '#fff', strokeWidth: '2' };

        if (t.includes("pdf")) return (
            <div style={{ ...iconStyle, background: '#ea4335' }}>
                <svg {...svgStyle} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            </div>
        );
        if (t.includes("youtube") || t.includes("video")) return (
            <div style={{ ...iconStyle, background: '#ff0000' }}>
                <svg {...svgStyle} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7" fill="#fff" fillOpacity="0.3" stroke="none"></polygon>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                    <polygon points="6 9 12 12 6 15 6 9" fill="#fff" stroke="none"></polygon>
                </svg>
            </div>
        );
        if (t.includes("audio")) return (
            <div style={{ ...iconStyle, background: '#a142f4' }}>
                <svg {...svgStyle} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5l12-2v13"></path>
                    <circle cx="6" cy="18" r="3"></circle>
                    <circle cx="18" cy="16" r="3"></circle>
                </svg>
            </div>
        );
        if (t.includes("web") || t.includes("url")) return (
            <div style={{ ...iconStyle, background: '#1a73e8' }}>
                <svg {...svgStyle} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
            </div>
        );
        return (
            <div style={{ ...iconStyle, background: '#fbbc04' }}>
                <svg {...svgStyle} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
            </div>
        );
    };

    const getArtifactIcon = (type) => {
        switch (type) {
            case 'audio': return '🎧';
            case 'video': return '🎥';
            case 'slides': return '📊';
            case 'quiz': return '❓';
            case 'flashcards': return '🃏';
            case 'mindmap': return '🧠';
            case 'study_guide': return '📚';
            default: return '📄';
        }
    };

    const getYouTubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const toggleSelect = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleView = async (source) => {
        setLoadingContent(true);
        setSourceGuide(null); // Reset guide
        setGuideLoading(true); // Start loading guide
        setViewingSource({ ...source, content: "Loading..." });

        // 1. Load Content
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/sources/${source.id}`);
            if (!res.ok) throw new Error("Failed to load content");
            const data = await res.json();
            setViewingSource(prev => ({ ...prev, content: data.content || "No content available" }));
        } catch (e) {
            setViewingSource(prev => ({ ...prev, content: `Error loading content: ${e.message}` }));
        }
        setLoadingContent(false);

        // 2. Load AI Guide (Summary)
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/notebooks/${notebookId}/sources/${source.id}/summary`);
            if (res.ok) {
                const data = await res.json();
                if (data.summary) {
                    setSourceGuide(data.summary);
                } else {
                    setGuideError("Detailed summary not available.");
                }
            } else {
                const err = await res.json();
                setGuideError(err.detail || "Failed to fetch summary.");
            }
        } catch (e) {
            console.error("Failed to load guide:", e);
            setGuideError(e.message);
        } finally {
            setGuideLoading(false);
        }
    };

    const handleViewArtifact = (artifact) => {
        setViewingArtifact(artifact);
    };
    const handleDownload = async () => {
        const selected = sources.filter(s => selectedIds.has(s.id));
        if (selected.length === 0) return;

        let downloadCount = 0;
        let failCount = 0;

        alert(`Starting download for ${selected.length} items...\nCheck your browser downloads.`);

        for (const s of selected) {
            try {
                if (s.url && (s.url.startsWith("http") || s.url.startsWith("blob"))) {
                    window.open(s.url, "_blank");
                    downloadCount++;
                    continue;
                }

                const res = await fetch(`http://127.0.0.1:8000/api/sources/${s.id}`);
                if (!res.ok) throw new Error("Failed to fetch content");

                const data = await res.json();
                const content = data.content;

                if (!content) {
                    console.warn(`No content for ${s.title}`);
                    failCount++;
                    continue;
                }

                const blob = new Blob([content], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${s.title || "source"}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                downloadCount++;

            } catch (e) {
                console.error(`Error downloading ${s.title}:`, e);
                failCount++;
            }
        }
    };

    const handleAddSource = async () => {
        if (addTab === 'url' && !addInput.url) return alert("Please enter a URL");
        if (addTab === 'text' && (!addInput.title || !addInput.content)) return alert("Please enter title and content");
        if (addTab === 'file' && !addInput.file) return alert("Please select a file");

        setAddLoading(true);
        try {
            let res;
            if (addTab === 'file') {
                const formData = new FormData();
                formData.append('file', addInput.file);
                formData.append('notebook_id', notebookId);

                res = await fetch("http://127.0.0.1:8000/api/sources/file", {
                    method: "POST",
                    body: formData // Content-Type is auto-set
                });
            } else {
                let endpoint = "";
                let body = { notebook_id: notebookId };

                if (addTab === 'url') {
                    endpoint = "/api/sources/url";
                    body.url = addInput.url;
                } else {
                    endpoint = "/api/sources/text";
                    body.title = addInput.title;
                    body.content = addInput.content;
                }

                res = await fetch(`http://127.0.0.1:8000${endpoint}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });
            }

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Failed to add source");
            }

            // Success
            onRefresh && onRefresh();
            setShowAddModal(false);
            setAddInput({ url: '', title: '', content: '', file: null });
        } catch (e) {
            alert(e.message);
        } finally {
            setAddLoading(false);
        }
    };

    const handleDeleteClick = (e, sourceId) => {
        e.stopPropagation();
        setSourceToDelete(sourceId);
        setDeleteModalOpen(true);
    };

    const confirmDeleteSource = async () => {
        if (!sourceToDelete) return;
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/sources/${sourceToDelete}?notebook_id=${notebookId}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete source");
            onRefresh && onRefresh();
        } catch (e) {
            alert(e.message);
        } finally {
            setSourceToDelete(null);
            setDeleteModalOpen(false);
        }
    };

    return (
        <div className="source-sidebar" style={{
            width: width,
            /* background: 'var(--bg-secondary, #1e1e1e)', -- handled by css now */
            /* borderLeft: '1px solid var(--border-color, #333)', -- handled by css now */
            display: 'flex',
            flexDirection: 'column',
            padding: '1rem',
            position: 'relative'
        }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>資料來源 ({sources.length})</span>
                    <button
                        onClick={onThemeToggle}
                        className="btn-secondary"
                        style={{
                            fontSize: '1rem',
                            padding: '4px 8px',
                            lineHeight: '1.2rem',
                            cursor: 'pointer'
                        }}
                        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {isDarkMode ? '☀️' : '🌙'}
                    </button>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-secondary"
                    style={{ fontSize: '1.2rem', padding: '0 8px', lineHeight: '1.5rem' }}
                    title="新增資料來源"
                >
                    +
                </button>
            </h3>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {isLoading ? (
                    <div className="skeleton-loader" style={{ padding: '0.5rem' }}>
                        <div className="skeleton-message" style={{ height: '40px', width: '90%', marginBottom: '0.5rem' }}></div>
                        <div className="skeleton-message" style={{ height: '40px', width: '85%', marginBottom: '0.5rem' }}></div>
                        <div className="skeleton-message" style={{ height: '40px', width: '95%', marginBottom: '0.5rem' }}></div>
                    </div>
                ) : sources.length === 0 ? (
                    <div style={{ color: '#666', fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem' }}>
                        尚未添加資料來源。<br />點擊 + 新增內容。
                    </div>
                ) : (
                    sources.map(source => (
                        <div key={source.id} className="source-item" style={{
                            padding: '0.8rem',
                            marginBottom: '0.5rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            border: selectedIds.has(source.id) ? '1px solid #4a90e2' : '1px solid transparent',
                            /* background: selectedIds.has(source.id) ? '#3d3d3d' : 'var(--bg-tertiary, #2d2d2d)', -- handled by css now mostly, but keep for select state */
                            background: selectedIds.has(source.id) ? 'rgba(77, 166, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                            transition: 'all 0.2s',
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '4px' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(source.id)}
                                    onChange={() => toggleSelect(source.id)}
                                    style={{
                                        marginTop: '4px',
                                        marginRight: '8px',
                                        cursor: 'pointer',
                                        appearance: 'none',
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        border: '2px solid #666',
                                        backgroundColor: selectedIds.has(source.id) ? '#4a90e2' : 'transparent',
                                        position: 'relative',
                                        flexShrink: 0
                                    }}
                                />
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div
                                        style={{ fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                        onClick={() => handleView(source)}
                                        title="Click to view content"
                                    >
                                        {getIcon(source.type)}
                                        <span>{source.title || "Untitled Source"}</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{source.type}</span>
                                        <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => handleView(source)}>View</span>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDeleteClick(e, source.id)}
                                    className="delete-source-btn"
                                    style={{
                                        background: 'none', border: 'none', color: '#666',
                                        cursor: 'pointer', marginLeft: '4px', fontSize: '1rem',
                                        opacity: 0.5
                                    }}
                                    title="Remove Source"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <style>{`
                .source-item:hover .delete-source-btn { opacity: 1 !important; color: #ff6b6b !important; }
            `}</style>

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDeleteSource}
                title="Remove Source"
                message="Are you sure you want to remove this source from the notebook?"
                confirmText="Remove"
            />
            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #333', display: 'flex', gap: '8px' }}>
                <button
                    className="btn-secondary"
                    style={{
                        flex: 1,
                        fontSize: '0.9rem',
                        border: isDarkMode ? '1px solid #444' : '1px solid #ccc',
                        color: isDarkMode ? '#fff' : '#333',
                        background: isDarkMode ? 'transparent' : '#f5f5f5'
                    }}
                    disabled={selectedIds.size === 0}
                    onClick={handleDownload}
                >
                    Download ({selectedIds.size})
                </button>
            </div>

            {/* Artifacts Panel (Bottom 1/3) */}
            <div style={{ height: '33%', borderTop: '1px solid #444', marginTop: '1rem', paddingTop: '1rem', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: isDarkMode ? '#ccc' : '#333' }}>生成的資訊 (Artifacts)</h3>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {!artifacts || artifacts.length === 0 ? (
                        <div style={{ color: isDarkMode ? '#666' : '#999', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', marginTop: '1rem' }}>
                            尚未生成任何內容
                        </div>
                    ) : (
                        artifacts.slice().reverse().map((artifact) => (
                            <div key={artifact.id} className="artifact-item" style={{
                                padding: '8px',
                                marginBottom: '4px',
                                borderRadius: '6px',
                                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                                border: isDarkMode ? 'none' : '1px solid #e0e0e0',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'background 0.2s'
                            }} onClick={() => handleViewArtifact(artifact)}>
                                <span style={{ fontSize: '1.2rem' }}>{getArtifactIcon(artifact.type)}</span>
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontSize: '0.9rem', color: isDarkMode ? '#eee' : '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500' }}>
                                        {artifact.title || artifact.type}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: isDarkMode ? '#888' : '#666' }}>
                                        {new Date(artifact.created_at).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {viewingArtifact && (
                    <ArtifactViewer
                        artifact={viewingArtifact}
                        notebookId={notebookId}
                        onClose={() => setViewingArtifact(null)}
                    />
                )}
            </div>
            {
                viewingSource && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                        display: 'flex', justifyContent: 'center', alignItems: 'center'
                    }}>
                        <div style={{
                            background: '#1e1e1e', width: '80%', height: '80%',
                            borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h2 style={{ display: 'flex', alignItems: 'center' }}>
                                    {getIcon(viewingSource.type)}
                                    {viewingSource.title}
                                </h2>
                                <button onClick={() => setViewingSource(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', background: '#2d2d2d', padding: '1rem', borderRadius: '8px' }}>
                                {/* AI Source Guide Section */}
                                <div style={{
                                    marginBottom: '1.5rem',
                                    padding: '1.2rem',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(145deg, #252525, #1e1e1e)',
                                    border: '1px solid rgba(77, 166, 255, 0.2)',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                                }}>
                                    <h3 style={{
                                        marginTop: 0,
                                        fontSize: '1.1rem',
                                        color: '#4da6ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '1rem'
                                    }}>
                                        ✨ AI Source Guide
                                    </h3>

                                    {guideLoading ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888', fontStyle: 'italic' }}>
                                            <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #4da6ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                            Analyzing source content (this may take 10-20s)...
                                        </div>
                                    ) : guideError ? (
                                        <div style={{ color: '#ff6b6b', fontSize: '0.9rem' }}>⚠️ {guideError}</div>
                                    ) : sourceGuide ? (
                                        <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#e0e0e0' }}>
                                            {sourceGuide.split('\n').map((line, i) => {
                                                if (line.startsWith('## ')) {
                                                    return <h4 key={i} style={{ margin: '12px 0 8px 0', color: '#fff' }}>{line.replace('## ', '')}</h4>;
                                                }
                                                if (line.trim().startsWith('- ')) {
                                                    return <div key={i} style={{ marginLeft: '1rem', marginBottom: '4px' }}>• {line.replace('- ', '')}</div>;
                                                }
                                                return <div key={i} style={{ marginBottom: '8px' }}>{line}</div>;
                                            })}
                                        </div>
                                    ) : (
                                        <div style={{ color: '#888', fontStyle: 'italic' }}>No summary available.</div>
                                    )}
                                </div>

                                <style>{`
                                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                            `}</style>

                                <hr style={{ border: 'none', borderTop: '1px solid #444', margin: '1rem 0' }} />
                                {viewingSource.url && getYouTubeId(viewingSource.url) ? (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={`https://www.youtube.com/embed/${getYouTubeId(viewingSource.url)}`}
                                            title="YouTube video player"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                ) : (
                                    <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                        {viewingSource.content}
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                {viewingSource.url && (
                                    <a href={viewingSource.url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ textDecoration: 'none', lineHeight: '2.5rem', height: 'auto' }}>
                                        Open Original URL ↗
                                    </a>
                                )}
                                <button className="btn-primary" onClick={() => setViewingSource(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add Source Modal */}
            {
                showAddModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', zIndex: 1100,
                        display: 'flex', justifyContent: 'center', alignItems: 'center'
                    }}>
                        <div style={{
                            background: '#1e1e1e', width: '500px', maxWidth: '90%',
                            borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                        }}>
                            <h2 style={{ marginBottom: '1.5rem' }}>Add Source</h2>

                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #333' }}>
                                <button
                                    onClick={() => setAddTab('url')}
                                    style={{
                                        background: 'none', border: 'none', color: addTab === 'url' ? '#4a90e2' : '#888',
                                        padding: '0.5rem 1rem', borderBottom: addTab === 'url' ? '2px solid #4a90e2' : '2px solid transparent',
                                        cursor: 'pointer'
                                    }}
                                >
                                    URL / YouTube
                                </button>
                                <button
                                    onClick={() => setAddTab('text')}
                                    style={{
                                        background: 'none', border: 'none', color: addTab === 'text' ? '#4a90e2' : '#888',
                                        padding: '0.5rem 1rem', borderBottom: addTab === 'text' ? '2px solid #4a90e2' : '2px solid transparent',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Paste Text
                                </button>
                                <button
                                    onClick={() => setAddTab('file')}
                                    style={{
                                        background: 'none', border: 'none', color: addTab === 'file' ? '#4a90e2' : '#888',
                                        padding: '0.5rem 1rem', borderBottom: addTab === 'file' ? '2px solid #4a90e2' : '2px solid transparent',
                                        cursor: 'pointer'
                                    }}
                                >
                                    File Upload
                                </button>
                            </div>

                            {addTab === 'url' && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>URL</label>
                                    <input
                                        type="text"
                                        className="chat-input"
                                        placeholder="https://..."
                                        value={addInput.url}
                                        onChange={(e) => setAddInput({ ...addInput, url: e.target.value })}
                                        style={{ width: '100%', marginBottom: '0.5rem' }}
                                    />
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Supports Web URLs, YouTube Videos, and PDFs hosted online.</div>
                                </div>
                            )}

                            {addTab === 'text' && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Title</label>
                                    <input
                                        type="text"
                                        className="chat-input"
                                        placeholder="Source Title"
                                        value={addInput.title}
                                        onChange={(e) => setAddInput({ ...addInput, title: e.target.value })}
                                        style={{ width: '100%', marginBottom: '1rem' }}
                                    />
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Content</label>
                                    <textarea
                                        className="chat-input"
                                        placeholder="Paste content here..."
                                        value={addInput.content}
                                        onChange={(e) => setAddInput({ ...addInput, content: e.target.value })}
                                        style={{ width: '100%', height: '150px', resize: 'vertical' }}
                                    />
                                </div>
                            )}

                            {addTab === 'file' && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Select File (PDF)</label>
                                    <input
                                        type="file"
                                        className="chat-input"
                                        accept=".pdf"
                                        onChange={(e) => setAddInput({ ...addInput, file: e.target.files[0] })}
                                        style={{ width: '100%', marginBottom: '0.5rem' }}
                                    />
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Currently supports PDF files.</div>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button className="btn-secondary" onClick={() => setShowAddModal(false)} disabled={addLoading}>Cancel</button>
                                <button className="btn-primary" onClick={handleAddSource} disabled={addLoading}>
                                    {addLoading ? "Adding..." : "Add Source"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
