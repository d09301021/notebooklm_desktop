import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

// --- Mind Map Component ---

const MindMapNode = ({ node, isRoot = false }) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    const toggle = (e) => {
        e.stopPropagation();
        setExpanded(!expanded);
    };

    return (
        <div className="mindmap-node-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 10px' }}>
            <div
                onClick={hasChildren ? toggle : undefined}
                className={`mindmap-card ${isRoot ? 'root' : ''}`}
                style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    background: isRoot ? 'var(--primary-color)' : 'var(--surface-color)',
                    color: isRoot ? '#fff' : 'var(--text-primary)',
                    border: `2px solid ${isRoot ? 'transparent' : 'var(--border-color)'}`,
                    fontWeight: isRoot ? 'bold' : 'normal',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    cursor: hasChildren ? 'pointer' : 'default',
                    position: 'relative',
                    zIndex: 2,
                    minWidth: '120px',
                    textAlign: 'center',
                    marginBottom: '20px'
                }}
            >
                {node.name || node.topic || "Node"}
                {hasChildren && (
                    <span style={{ marginLeft: '8px', fontSize: '0.8rem', opacity: 0.7 }}>
                        {expanded ? '−' : '+'}
                    </span>
                )}
            </div>

            {hasChildren && expanded && (
                <div style={{ display: 'flex', position: 'relative', alignItems: 'flex-start' }}>
                    {/* Connector line from parent to children container */}
                    <div style={{
                        position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)',
                        width: '2px', height: '20px', background: 'var(--border-color)'
                    }}></div>

                    {node.children.map((child, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                            {/* Horizontal connector above child */}
                            {node.children.length > 1 && (
                                <div style={{
                                    position: 'absolute', top: '-10px',
                                    left: i === 0 ? '50%' : '0',
                                    right: i === node.children.length - 1 ? '50%' : '0',
                                    height: '2px', background: 'var(--border-color)'
                                }}></div>
                            )}
                            {/* Vertical connector to child */}
                            <div style={{ width: '2px', height: '20px', background: 'var(--border-color)', marginBottom: '-2px' }}></div>

                            <MindMapNode node={child} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Quiz Component ---

const InteractiveQuiz = ({ content }) => {
    const [quizData, setQuizData] = useState(null);
    const [parseError, setParseError] = useState(null);
    const [answers, setAnswers] = useState({}); // Moved Hook to top level

    useEffect(() => {
        if (!content) return;
        try {
            console.log("Raw quiz content:", content);
            const parsed = typeof content === 'string' ? JSON.parse(content) : content;
            console.log("Parsed quiz data:", parsed);
            setQuizData(parsed);
        } catch (e) {
            console.error("Quiz parse error:", e);
            setParseError(e.message);
        }
    }, [content]);

    if (parseError) return <div style={{ color: 'red' }}>Error parsing quiz data: {parseError}</div>;
    if (!quizData) return <div>Loading quiz...</div>;

    // Normalize structure
    // Handle both { questions: [...] } and [...]
    // Handle both "question"/"answerOptions" and "text"/"options"
    let rawQuestions = Array.isArray(quizData) ? quizData : (quizData.questions || []);

    // Normalize keys
    const questions = rawQuestions.map(q => ({
        text: q.text || q.question,
        options: (q.options || q.answerOptions || []).map(opt => ({
            text: opt.text || opt.option,
            rationale: opt.rationale,
            isCorrect: opt.isCorrect
        })),
        hint: q.hint
    }));

    const handleOptionSelect = (qIndex, oIndex) => {
        setAnswers(prev => ({ ...prev, [qIndex]: oIndex }));
    };

    if (!questions.length) return <div>No questions found in data.</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
            {questions.map((q, qIndex) => {
                const userAnswer = answers[qIndex];
                const isAnswered = userAnswer !== undefined;

                return (
                    <div key={qIndex} style={{ marginBottom: '24px', padding: '20px', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                            {qIndex + 1}. {q.text}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {q.options && q.options.map((opt, oIndex) => {
                                const isSelected = userAnswer === oIndex;
                                const isCorrect = opt.isCorrect;
                                let bg = 'transparent';
                                let borderColor = 'var(--border-color)';

                                if (isAnswered) {
                                    if (isSelected) {
                                        bg = isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
                                        borderColor = isCorrect ? '#10b981' : '#ef4444';
                                    }
                                    if (isCorrect) {
                                        borderColor = '#10b981'; // Highlight correct answer
                                    }
                                }

                                return (
                                    <div key={oIndex}
                                        onClick={() => !isAnswered && handleOptionSelect(qIndex, oIndex)}
                                        style={{
                                            padding: '12px',
                                            border: `1px solid ${borderColor}`,
                                            borderRadius: '6px',
                                            cursor: isAnswered ? 'default' : 'pointer',
                                            background: bg,
                                            transition: 'all 0.2s',
                                            display: 'flex', justifyContent: 'space-between',
                                            color: 'var(--text-primary)',
                                            position: 'relative'
                                        }}>
                                        <span>{opt.text}</span>
                                        {isAnswered && isCorrect && <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>}
                                        {isAnswered && isSelected && !isCorrect && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>✗</span>}
                                    </div>
                                );
                            })}
                        </div>
                        {isAnswered && (
                            <div style={{ marginTop: '16px', fontSize: '0.95rem', color: 'var(--text-secondary)', padding: '12px', background: 'var(--bg-color)', borderRadius: '6px', lineHeight: '1.5' }}>
                                <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--primary-color)' }}>解析：</strong>
                                {q.options[userAnswer]?.rationale || q.hint || "無解析"}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default function ArtifactViewer({ artifact, notebookId, onClose }) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!artifact) return;

        const isTextBased = ['quiz', 'study_guide', 'mindmap', 'flashcards'].includes(artifact.type);

        if (isTextBased) {
            setLoading(true);
            fetch(`http://127.0.0.1:8000/api/notebooks/${notebookId}/artifacts/${artifact.id}/content`)
                .then(res => {
                    if (!res.ok) throw new Error("Failed to load content");
                    return res.json();
                })
                .then(data => {
                    setContent(data.content);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setError(err.message);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [artifact, notebookId]);

    if (!artifact) return null;

    const handleDownload = () => {
        if (artifact.details && artifact.details.path) {
            window.open(`file://${artifact.details.path}`, '_blank');
        }
    };

    const handleExportDocx = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/notebooks/${notebookId}/artifacts/${artifact.id}/export/docx`, {
                method: 'POST'
            });
            const data = await res.json();
            if (res.ok) {
                alert(`Exported successfully to: ${data.path}`);
            } else {
                alert(`Export failed: ${data.detail}`);
            }
        } catch (err) {
            console.error(err);
            alert("Export failed. See console.");
        }
    };


    // Parse content for Mind Map
    let mindMapData = null;
    if (artifact.type === 'mindmap' && content) {
        try {
            mindMapData = typeof content === 'string' ? JSON.parse(content) : content;
            if (mindMapData.root) mindMapData = mindMapData.root;
        } catch (e) {
            console.error("Failed to parse mindmap", e);
        }
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000,
            color: 'var(--text-primary)'
        }} onClick={onClose}>
            <style>{`
        /* Mind Map Tree Lines */
        .mindmap-tree ul::before {
            content: ''; position: absolute; top: 0; left: 50%;
            border-left: 1px solid var(--border-color); width: 0; height: 20px;
        }
        .mindmap-tree li::before, .mindmap-tree li::after {
            content: ''; position: absolute; top: 0; right: 50%;
            border-top: 1px solid var(--border-color); width: 50%; height: 20px;
        }
        .mindmap-tree li::after {
            right: auto; left: 50%;
            border-left: 1px solid var(--border-color);
        }
        .mindmap-tree li:only-child::after, .mindmap-tree li:only-child::before {
            display: none;
        }
        .mindmap-tree li:only-child { padding-top: 0; }
        .mindmap-tree li:first-child::before, .mindmap-tree li:last-child::after {
            border: 0 none;
        }
        .mindmap-tree li:last-child::before {
            border-right: 1px solid var(--border-color);
            border-radius: 0 5px 0 0;
        }
        .mindmap-tree li:first-child::after {
            border-radius: 5px 0 0 0;
        }
        .mindmap-tree ul ul::before {
            content: ''; position: absolute; top: 0; left: 50%;
            border-left: 1px solid var(--border-color); width: 0; height: 20px;
        }
      `}</style>

            <div style={{
                background: 'var(--bg-color)',
                width: '90%', maxWidth: '1200px', height: '90%',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-color)',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--surface-color)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1.5rem' }}>
                            {artifact.type === 'quiz' ? '❓' :
                                artifact.type === 'study_guide' ? '📚' :
                                    artifact.type === 'mindmap' ? '🧠' : '📄'}
                        </span>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{artifact.title}</h3>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', opacity: 0.8 }}>
                                {new Date(artifact.created_at).toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {artifact.type === 'quiz' && (
                            <button onClick={handleExportDocx} className="btn-secondary" style={{ fontSize: '0.9rem', padding: '6px 12px', marginRight: '8px', background: '#2563eb', color: 'white', border: 'none' }}>
                                Download Word
                            </button>
                        )}
                        <button onClick={handleDownload} className="btn-secondary" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                            Open/Download
                        </button>
                        <button onClick={onClose} style={{
                            background: 'none', border: 'none', color: 'var(--text-secondary)',
                            fontSize: '1.5rem', cursor: 'pointer', padding: '0 8px'
                        }}>×</button>
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--bg-color)' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'var(--text-primary)' }}>Loading Content...</div>
                    ) : error ? (
                        <div style={{ color: '#ff6b6b', textAlign: 'center' }}>Error: {error}</div>
                    ) : (
                        <div className="artifact-content" style={{ color: 'var(--text-primary)', height: '100%' }}>
                            {/* Render based on type */}
                            {artifact.type === 'study_guide' || artifact.type === 'flashcards' ? (
                                <div style={{ lineHeight: '1.8', maxWidth: '800px', margin: '0 auto', fontSize: '1.05rem' }}>
                                    <ReactMarkdown>{content}</ReactMarkdown>
                                </div>
                            ) : artifact.type === 'mindmap' ? (
                                mindMapData ? (
                                    <div className="mindmap-tree" style={{
                                        display: 'flex', justifyContent: 'center',
                                        overflow: 'auto', padding: '40px',
                                        minHeight: '100%'
                                    }}>
                                        <ul style={{ padding: 0, margin: 0, display: 'flex' }}>
                                            <MindMapNode node={mindMapData} isRoot={true} />
                                        </ul>
                                    </div>
                                ) : <div>Invalid Mind Map Data (Check Console)</div>
                            ) : artifact.type === 'quiz' ? (
                                <InteractiveQuiz content={content} />
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                    Preview not available for this file type.<br />
                                    Please use the Open button to view it externally.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
