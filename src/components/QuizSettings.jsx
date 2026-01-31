import React, { useState } from 'react';

const DIFFICULTIES = [
    { id: 'easy', label: '簡單 (Easy)', desc: '基礎概念，適合初學者。' },
    { id: 'medium', label: '中等 (Medium)', desc: '涵蓋核心內容與細節。' },
    { id: 'hard', label: '困難 (Hard)', desc: '深度挑戰，測試全面理解。' }
];

const QUANTITIES = [
    { id: 'fewer', label: '較少 (Fewer)', desc: '5 題左右，快速檢測。' },
    { id: 'standard', label: '標準 (Standard)', desc: '10 題以上，完整測驗。' }
];

export default function QuizSettings({ onConfirm, onCancel }) {
    const [difficulty, setDifficulty] = useState('medium');
    const [quantity, setQuantity] = useState('standard');
    const [instructions, setInstructions] = useState('');

    const handleConfirm = () => {
        onConfirm({
            difficulty,
            quantity,
            instructions: instructions.trim() || null
        });
    };

    return (
        <div className="modal-overlay">
            <div className="settings-modal quiz-modal">
                <div className="modal-header">
                    <h3>❓ Quiz 生成設定</h3>
                    <button className="close-btn" onClick={onCancel}>&times;</button>
                </div>

                <div className="modal-body">
                    <section className="settings-section">
                        <p className="modal-subtitle">選擇難度：</p>
                        <div className="mode-options">
                            {DIFFICULTIES.map((opt) => (
                                <label key={opt.id} className={`mode-card ${difficulty === opt.id ? 'active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="quizDifficulty"
                                        checked={difficulty === opt.id}
                                        onChange={() => setDifficulty(opt.id)}
                                        style={{ display: 'none' }}
                                    />
                                    <div className="mode-info">
                                        <span className="mode-label">{opt.label}</span>
                                        <span className="mode-desc">{opt.desc}</span>
                                    </div>
                                    <div className="radio-indicator"></div>
                                </label>
                            ))}
                        </div>
                    </section>

                    <section className="settings-section">
                        <p className="modal-subtitle">題目數量：</p>
                        <div className="mode-options" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                            {QUANTITIES.map((opt) => (
                                <label key={opt.id} className={`mode-card ${quantity === opt.id ? 'active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="quizQuantity"
                                        checked={quantity === opt.id}
                                        onChange={() => setQuantity(opt.id)}
                                        style={{ display: 'none' }}
                                    />
                                    <div className="mode-info">
                                        <span className="mode-label">{opt.label}</span>
                                        <span className="mode-desc">{opt.desc}</span>
                                    </div>
                                    <div className="radio-indicator"></div>
                                </label>
                            ))}
                        </div>
                    </section>

                    <section className="settings-section">
                        <p className="modal-subtitle">補充指令 (選填)：</p>
                        <textarea
                            className="custom-instructions"
                            placeholder="例如：請著重於第 3 章的內容，或是使用繁體中文生成..."
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            rows={3}
                            style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                marginTop: '8px',
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-color)',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                resize: 'vertical'
                            }}
                        />
                    </section>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onCancel}>取消</button>
                    <button className="btn-primary" onClick={handleConfirm}>開始生成</button>
                </div>
            </div>
        </div>
    );
}
