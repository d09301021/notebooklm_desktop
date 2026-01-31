import React, { useState } from 'react';

const MODES = {
    QUICK: {
        id: 'quick',
        label: '快速摘要 (Short / Fast)',
        description: '快速掃描文件，適合主管或非技術人員。',
        template: '你是一位文件研究助理。\n\n請僅根據目前 Notebook 中的文件內容，進行快速摘要：\n\n規則：\n- 使用條列式輸出\n- 最多 5 點\n- 每一點不超過 20 字\n- 只講結論，不補充背景\n- 不可使用 Notebook 以外的知識\n- 若文件中沒有足夠資訊，請直接說「文件未提及」\n\n輸出格式：\n- 重點 1\n- 重點 2\n- 重點 3'
    },
    DEFAULT: {
        id: 'default',
        label: '一般分析 (Balanced)',
        description: '日常問答與文件理解，平衡速度與深度。',
        template: '你是一位專業文件分析助理。\n\n請根據目前 Notebook 中的所有相關文件，回答以下問題。\n\n分析要求：\n- 條列 5–8 個重點\n- 每個重點 1–2 句完整敘述\n- 所有結論必須能對應文件內容\n- 不可引入 Notebook 以外的知識\n- 若資訊不足，請明確指出不足之處\n\n輸出結構：\n【重點摘要】\n- ...\n\n【補充說明（若有）】\n- ...'
    },
    DEEP: {
        id: 'deep',
        label: '深度研究 (Long / Deep)',
        description: '嚴謹分析，適合法規、醫療或決策依據。',
        template: '你是一位嚴謹的專業研究分析師。\n\n請「僅依據目前 Notebook 中的文件內容」進行深入分析，回答以下問題。\n\n研究規則：\n- 分段說明，每段需有明確主題\n- 所有結論都必須有文件依據\n- 不可推測、補充或使用外部知識\n- 若文件中不存在相關資訊，必須明確指出\n- 適度保留專業用語，不需過度簡化\n\n輸出結構：\n【核心結論】\n（摘要主要發現）\n\n【依據分析】\n- 主題一：\n- 主題二：\n- 主題三：\n\n【限制與缺口】\n（說明文件不足或無法確認之處）'
    }
};

export default function PodcastSettings({ onConfirm, onCancel }) {
    const [selectedMode, setSelectedMode] = useState('DEFAULT');
    const [speechOptimized, setSpeechOptimized] = useState(false);
    const [wordLimit, setWordLimit] = useState(false);

    const handleConfirm = () => {
        let finalPrompt = MODES[selectedMode].template;

        if (speechOptimized) {
            finalPrompt += "\n\n🔹 語音摘要：請產生適合 60 秒內語音播放的版本，語氣專業但口語。";
        }

        if (wordLimit) {
            finalPrompt += "\n\n🔹 強制字數：請將整體回應控制在 300 字以內。";
        }

        onConfirm(finalPrompt);
    };

    return (
        <div className="modal-overlay">
            <div className="settings-modal podcast-modal">
                <div className="modal-header">
                    <h3>🎧 Podcast 生成設定</h3>
                    <button className="close-btn" onClick={onCancel}>&times;</button>
                </div>

                <div className="modal-body">
                    <p className="modal-subtitle">請選擇分析模式：</p>
                    <div className="mode-options">
                        {Object.keys(MODES).map((key) => (
                            <label key={key} className={`mode-card ${selectedMode === key ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="podcastMode"
                                    checked={selectedMode === key}
                                    onChange={() => setSelectedMode(key)}
                                    style={{ display: 'none' }}
                                />
                                <div className="mode-info">
                                    <span className="mode-label">{MODES[key].label}</span>
                                    <span className="mode-desc">{MODES[key].description}</span>
                                </div>
                                <div className="radio-indicator"></div>
                            </label>
                        ))}
                    </div>

                    <div className="advanced-options">
                        <p className="modal-subtitle">進階選項：</p>
                        <label className="checkbox-option">
                            <input
                                type="checkbox"
                                checked={speechOptimized}
                                onChange={(e) => setSpeechOptimized(e.target.checked)}
                            />
                            <span>語音優化 (適合 60 秒播放)</span>
                        </label>
                        <label className="checkbox-option">
                            <input
                                type="checkbox"
                                checked={wordLimit}
                                onChange={(e) => setWordLimit(e.target.checked)}
                            />
                            <span>強制字數 (300 字以內)</span>
                        </label>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onCancel}>取消</button>
                    <button className="btn-primary" onClick={handleConfirm}>開始生成</button>
                </div>
            </div>
        </div>
    );
}
