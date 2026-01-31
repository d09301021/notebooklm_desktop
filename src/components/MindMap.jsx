import React, { useState } from 'react';

const MindMapNode = ({ node, depth = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div style={{
            marginLeft: depth > 0 ? '20px' : '0',
            borderLeft: depth > 0 ? '1px solid #444' : 'none',
            paddingLeft: depth > 0 ? '15px' : '0',
            marginBottom: '8px',
            position: 'relative'
        }}>
            <div
                onClick={() => hasChildren && setIsExpanded(!isExpanded)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: depth === 0 ? 'var(--mm-root-node-bg)' : 'var(--mm-node-bg)',
                    border: depth === 0 ? '1px solid var(--mm-root-node-border)' : '1px solid var(--mm-node-border)',
                    borderRadius: '8px',
                    cursor: hasChildren ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    boxShadow: depth === 0 ? '0 4px 12px var(--accent-glow, rgba(187, 134, 252, 0.2))' : 'none',
                    color: depth === 0 ? 'var(--mm-root-node-text)' : 'var(--mm-node-text)',
                    fontWeight: depth === 0 ? '600' : '400',
                }}
                onMouseOver={(e) => {
                    if (hasChildren) e.currentTarget.style.background = 'var(--surface-hover)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.background = depth === 0 ? 'var(--mm-root-node-bg)' : 'var(--mm-node-bg)';
                }}
            >
                {hasChildren && (
                    <span style={{
                        display: 'inline-block',
                        transition: 'transform 0.2s',
                        transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                        fontSize: '10px'
                    }}>
                        ▼
                    </span>
                )}
                <span style={{ fontSize: depth === 0 ? '1.1rem' : '0.95rem' }}>{node.name}</span>
            </div>

            {
                hasChildren && isExpanded && (
                    <div style={{ marginTop: '5px' }}>
                        {node.children.map((child, idx) => (
                            <MindMapNode key={idx} node={child} depth={depth + 1} />
                        ))}
                    </div>
                )
            }
        </div >
    );
};

export default function MindMap({ data }) {
    if (!data) return null;

    return (
        <div className="mindmap-container" style={{
            padding: '1.5rem',
            background: 'var(--mm-container-bg)',
            borderRadius: '16px',
            border: '1px solid var(--mm-container-border)',
            maxWidth: '100%',
            overflowX: 'auto',
            marginTop: '1rem',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
        }}>
            <h4 style={{
                margin: '0 0 1.2rem 0',
                color: 'var(--mm-root-node-text)',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                🧠 {data.name}
            </h4>
            <div style={{ minWidth: '300px' }}>
                <MindMapNode node={data} />
            </div>
        </div>
    );
}
