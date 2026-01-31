import React from 'react';

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", cancelText = "Cancel" }) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', zIndex: 1200,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            backdropFilter: 'blur(4px)'
        }} onClick={onClose}>
            <div style={{
                background: '#1e1e1e',
                width: '400px', maxWidth: '90%',
                borderRadius: '12px', padding: '2rem',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                border: '1px solid #333',
                transform: 'scale(1)',
                animation: 'modalPop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }} onClick={e => e.stopPropagation()}>
                <h2 style={{
                    marginTop: 0, marginBottom: '1rem',
                    fontSize: '1.25rem', color: '#fff',
                    display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    ⚠️ {title}
                </h2>
                <p style={{
                    color: '#ccc', fontSize: '1rem', lineHeight: '1.5', marginBottom: '2rem'
                }}>
                    {message}
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button
                        onClick={onClose}
                        className="btn-secondary"
                        style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.9rem' }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className="btn-primary"
                        style={{
                            background: '#d32f2f',
                            padding: '0.6rem 1.2rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            boxShadow: '0 2px 8px rgba(211, 47, 47, 0.3)'
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes modalPop {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
