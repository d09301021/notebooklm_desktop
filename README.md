# Tauri + React

This template should help get you started developing with Tauri and React in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

# NotebookLM Desktop (Unofficial)
這是一個使用 Tauri + React + Python 建構的非官方 [NotebookLM](https://notebooklm.google.com/) 桌面應用程式。後端使用 [notebooklm-py](https://github.com/d09301021/notebooklm-py) 進行 API 互動，前端提供現代化的桌面體驗。
## ✨ 特色
- **桌面體驗**: 使用 Tauri 建構，輕量且快速。
- **本地 API**: 內建 Python FastAPI 後端，處理與 Google NotebookLM 的通訊。
- **現代介面**: React + Tailwind (假設) + Vite 打造的流暢 UI。
## 🛠️ 技術均疊
- **前端**: React, Vite
- **桌面框架**: Tauri v2
- **後端**: Python, FastAPI
- **API 封裝**: notebooklm-py
## 🚀 快速開始
### 前置需求
請確保您的系統已安裝：
- [Node.js](https://nodejs.org/) (建議 v18+)
- [Rust](https://www.rust-lang.org/tools/install) (Tauri 開發需要)
- [Python](https://www.python.org/) 3.10+
### 1. 安裝前端依賴
```bash
npm install
```
### 2. 設定 Python 環境
建議使用 `venv` 建立虛擬環境：
```bash
cd python_api
python -m venv venv
# Windows
venv\Scripts\activate
# 安裝依賴
pip install -r requirements.txt
```
### 3. 開發模式
同時啟動前端與後端進行開發：
```bash
# 在專案根目錄執行 (Tauri 會自動管理前端與後端啟動，視 tauri.conf.json 設定而定)
npm run tauri dev
```
> **注意**: 如果 `src-tauri` 設定中未自動啟動 Python 後端，您可能需要手動在 `python_api` 目錄下執行 `uvicorn app:app --reload`。
### 4. 建置應用程式
打包成可執行檔 (Windows .exe, macOS .app 等)：
```bash
npm run tauri build
```
## 📂 專案結構
- `src/`: React 前端原始碼
- `src-tauri/`: Rust 桌面端配置與邏輯
- `python_api/`: Python 後端 API
- `dist/`: 前端建置產物
## 🤝 貢獻
歡迎提交 Issue 或 Pull Request！
## 📄 授權
此專案僅供學習研究使用。
NotebookLM 是 Google 的商標。
