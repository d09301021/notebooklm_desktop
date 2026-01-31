import { useState, useEffect, useRef } from "react";
import ChatMessage from "./components/ChatMessage";
import Login from "./components/Login";
import NotebookList from "./components/NotebookList";
import SourceList from "./components/SourceList";
import PodcastSettings from "./components/PodcastSettings";
import QuizSettings from './components/QuizSettings';
import { TaskProvider } from "./context/TaskContext";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSources, setLoadingSources] = useState(false);
  const [activeNotebookId, setActiveNotebookId] = useState(null);
  const [sources, setSources] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [progress, setProgress] = useState({
    audio: "", video: "", slides: "", quiz: "", flashcards: "", mindmap: "", study_guide: ""
  });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showPodcastSettings, setShowPodcastSettings] = useState(false);
  const [showQuizSettings, setShowQuizSettings] = useState(false);
  const [artifacts, setArtifacts] = useState([]);

  const chatEndRef = useRef();

  /* Resizing State */
  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(300);
  const isResizingLeft = useRef(false);
  const isResizingRight = useRef(false);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/notebooks")
      .then(res => {
        if (res.ok) setIsAuthenticated(true);
      })
      .catch(err => console.log("Not authenticated yet"));
  }, []);

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-theme' : 'light-theme';
  }, [isDarkMode]);

  useEffect(() => {
    if (isAuthenticated && activeNotebookId) {
      setMessages([]);
      setLoadingHistory(true);
      fetch(`http://127.0.0.1:8000/api/history?notebook_id=${activeNotebookId}`)
        .then(res => res.json())
        .then(data => {
          setMessages(data);
          setLoadingHistory(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingHistory(false);
        });
    } else {
      setMessages([]);
    }
  }, [isAuthenticated, activeNotebookId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      /* ... resizing logic ... */
      if (isResizingLeft.current) {
        requestAnimationFrame(() => {
          const newWidth = Math.max(200, Math.min(600, e.clientX));
          setLeftWidth(newWidth);
        });
      } else if (isResizingRight.current) {
        requestAnimationFrame(() => {
          const newWidth = Math.max(250, Math.min(800, window.innerWidth - e.clientX));
          setRightWidth(newWidth);
        });
      }
    };
    /* ... rest of resizing hooks ... */
    const handleMouseUp = () => {
      isResizingLeft.current = false;
      isResizingRight.current = false;
      document.body.style.cursor = 'default';
      document.body.classList.remove('resizing-active');
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handlePodcastConfirm = (instructions) => {
    setShowPodcastSettings(false);
    generate("audio", instructions);
  };

  const handleQuizConfirm = (settings) => {
    setShowQuizSettings(false);
    generate("quiz", settings);
  };

  const handleNotebookSelect = async (id) => {
    setActiveNotebookId(id);
    setSources([]);
    setSuggestions([]);

    // Clear messages immediately to avoid stale content
    setMessages([]);

    try {
      setLoadingSources(true);
      const res = await fetch("http://127.0.0.1:8000/api/select_notebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notebook_id: id })
      });
      const data = await res.json();

      if (data.status === "success") {
        setSources(data.sources || []);

        // Load artifacts
        fetch(`http://127.0.0.1:8000/api/notebooks/${id}/artifacts`)
          .then(res => res.json())
          .then(aData => setArtifacts(aData.artifacts || []))
          .catch(e => console.error("Failed to load artifacts:", e));
      }
      setLoadingSources(false);

      // Fetch suggestions
      console.log("Fetching suggestions for notebook:", id);
      fetch(`http://127.0.0.1:8000/api/notebook_suggestions/${id}`)
        .then(res => res.json())
        .then(data => {
          console.log("Suggestions received:", data);
          setSuggestions(data.suggestions || []);
        })
        .catch(err => console.error("Error fetching suggestions:", err));

    } catch (e) {
      console.error("Failed to select notebook:", e);
    }
  };

  const handleSend = async (messageText) => {
    const textToSend = (typeof messageText === 'string') ? messageText : prompt;

    if (!textToSend.trim()) return;
    if (!activeNotebookId) {
      alert("Please select a notebook first.");
      return;
    }

    setMessages(prev => [...prev, { role: "user", text: textToSend }]);
    setLoading(true);
    setPrompt("");

    setMessages(prev => [...prev, { role: "ai", text: "" }]);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/stream_query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToSend })
      });

      if (!response.ok) throw new Error("Stream failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        aiText += chunk;

        setMessages(prev => {
          const newHistory = [...prev];
          const lastIdx = newHistory.length - 1;
          if (newHistory[lastIdx] && newHistory[lastIdx].role === "ai") {
            newHistory[lastIdx] = { ...newHistory[lastIdx], text: aiText };
          }
          return newHistory;
        });
      }

    } catch (e) {
      console.error(e);
      setMessages(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = { role: "ai", text: `Error: ${e.message}` };
        return newHistory;
      });
    }
    setLoading(false);
  };

  const generate = async (type, options = null) => {
    if (!activeNotebookId) {
      alert("Please select a notebook first!");
      return;
    }

    // Special handling for Podcast (audio) to show settings if options not provided
    if (type === "audio" && !options) {
      setShowPodcastSettings(true);
      return;
    }

    // Special handling for Quiz to show settings if options not provided
    if (type === "quiz" && !options) {
      setShowQuizSettings(true);
      return;
    }

    setProgress(prev => ({ ...prev, [type]: "Running..." }));

    const apiMap = {
      audio: "/api/generate_audio",
      video: "/api/generate_video",
      quiz: "/api/generate_quiz",
      mindmap: "/api/generate_mindmap",
      slides: "/api/generate_slides",
      flashcards: "/api/generate_flashcards",
      study_guide: "/api/generate_study_guide"
    };

    const defaultContent = {
      audio: "make it engaging and informative",
      video: "whiteboard",
      quiz: "medium", // This will be overridden by options if provided
      mindmap: "",
      slides: "",
      flashcards: "normal",
      study_guide: ""
    };

    try {
      const res = await fetch(`http://127.0.0.1:8000${apiMap[type]}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          type === "quiz" && typeof options === "object" && options !== null
            ? options
            : { content: options || defaultContent[type] }
        )
      });
      const data = await res.json();
      if (data.status === "success") {
        console.log(`${type} generated:`, data.filename, data.data ? "with data" : "WITHOUT data");
        setProgress(prev => ({ ...prev, [type]: "Done ✅" }));

        // Refresh artifacts
        if (activeNotebookId) {
          fetch(`http://127.0.0.1:8000/api/notebooks/${activeNotebookId}/artifacts`)
            .then(res => res.json())
            .then(d => setArtifacts(d.artifacts || []))
            .catch(console.error);
        }

        // If it's a mindmap, append it to the chat messages
        if (type === "mindmap") {
          if (data.data) {
            const mindmapMessage = `!!MINDMAP!!${JSON.stringify(data.data)}`;
            setMessages(prev => [...prev, { role: "ai", text: mindmapMessage }]);
          } else {
            console.warn("Mindmap generated but no JSON data returned!");
            alert(`Mind Map generated successfully!\nSaved to: ${data.filename}\n(Note: Not seeing it in chat? It might be empty or too large)`);
          }
        }

        // If it's a quiz, append a message or data
        if (type === "quiz") {
          if (data.data) {
            const quiz = data.data;
            let quizText = `### 📝 ${quiz.title || "測驗"}\n\n`;
            quiz.questions?.forEach((q, i) => {
              quizText += `**Q${i + 1}: ${q.question}**\n`;
              q.answerOptions?.forEach((opt, j) => {
                quizText += `- ${opt.isCorrect ? "✅" : "⚪️"} ${opt.text}\n`;
                if (opt.isCorrect && opt.rationale) {
                  quizText += `  > *解析：${opt.rationale}*\n`;
                }
              });
              quizText += `\n`;
            });
            setMessages(prev => [...prev, { role: "ai", text: quizText }]);
          }
        }

        // Handle study_guide
        if (type === "study_guide") {
          if (data.data) {
            setMessages(prev => [...prev, { role: "ai", text: data.data }]);
          } else {
            alert(`Study Guide generated successfully!\nSaved to: ${data.filename}`);
          }
        } else {
          alert(`${type} generated successfully!\nSaved to: ${data.filename}`);
        }
      } else {
        throw new Error(data.detail || "Generation failed");
      }
    } catch (e) {
      console.error(e);
      setProgress(prev => ({ ...prev, [type]: `Failed ❌` }));
      alert(`Failed to generate ${type}: ${e.message}`);
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <TaskProvider>
      <div className="app-container">
        <NotebookList
          activeId={activeNotebookId}
          onSelect={handleNotebookSelect}
          width={leftWidth}
        />

        <div
          className="resizer"
          onMouseDown={(e) => {
            e.preventDefault();
            isResizingLeft.current = true;
            document.body.style.cursor = 'col-resize';
            document.body.classList.add('resizing-active');
          }}
          title="Drag to resize"
        />

        <div className="chat-area">
          {/* ... chat header, messages, tools ... */}
          {/* Keeping chat area mostly same, just ensuring it flexes */}


          <div className="messages-container">
            {loadingHistory ? (
              <div className="skeleton-loader">
                <div className="skeleton-message" style={{ width: '60%' }}></div>
                <div className="skeleton-message right" style={{ width: '70%' }}></div>
                <div className="skeleton-message" style={{ width: '50%' }}></div>
                <div className="skeleton-message right" style={{ width: '65%' }}></div>
              </div>
            ) : messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#555', marginTop: '10vh' }}>
                <h3>Welcome to NotebookLM Desktop</h3>
                <p>Select a notebook from the left to start chatting.</p>

                {suggestions.length > 0 && (
                  <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'center' }}>
                    <p style={{ fontSize: '0.9rem' }}>Suggested Questions:</p>
                    {suggestions.map((s, i) => (
                      <button key={i}
                        onClick={() => handleSend(s)}
                        style={{
                          background: '#2d2d2d', border: '1px solid #444', padding: '0.8rem 1.2rem',
                          borderRadius: '20px', color: '#ddd', cursor: 'pointer', maxWidth: '80%', textAlign: 'left',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.borderColor = '#bb86fc'}
                        onMouseOut={(e) => e.target.style.borderColor = '#444'}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {messages.map((msg, i) => (
              <ChatMessage key={i} text={msg.text} role={msg.role} />
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="tools-bar">
            <button
              className={`tool-chip ${progress.audio === "Running..." ? "running" : ""}`}
              onClick={() => generate("audio")}
              disabled={!activeNotebookId}
            >
              🎧 Podcast {progress.audio && `(${progress.audio})`}
            </button>
            <button
              className={`tool-chip ${progress.video === "Running..." ? "running" : ""}`}
              onClick={() => generate("video")}
              disabled={!activeNotebookId}
            >
              🎥 Video {progress.video && `(${progress.video})`}
            </button>
            <button
              className={`tool-chip ${progress.slides === "Running..." ? "running" : ""}`}
              onClick={() => generate("slides")}
              disabled={!activeNotebookId}
            >
              📊 Slides {progress.slides && `(${progress.slides})`}
            </button>
            <button
              className={`tool-chip ${progress.quiz === "Running..." ? "running" : ""}`}
              onClick={() => generate("quiz")}
              disabled={!activeNotebookId}
            >
              ❓ Quiz {progress.quiz && `(${progress.quiz})`}
            </button>
            <button
              className={`tool-chip ${progress.flashcards === "Running..." ? "running" : ""}`}
              onClick={() => generate("flashcards")}
              disabled={!activeNotebookId}
            >
              🃏 Flashcards {progress.flashcards && `(${progress.flashcards})`}
            </button>
            <button
              className={`tool-chip ${progress.mindmap === "Running..." ? "running" : ""}`}
              onClick={() => generate("mindmap")}
              disabled={!activeNotebookId}
            >
              🧠 Mind Map {progress.mindmap && `(${progress.mindmap})`}
            </button>
            <button
              className={`tool-chip ${progress.study_guide === "Running..." ? "running" : ""}`}
              onClick={() => generate("study_guide")}
              disabled={!activeNotebookId}
            >
              📚 Study Guide {progress.study_guide && `(${progress.study_guide})`}
            </button>
          </div>

          <div className="input-area">
            <div className="input-wrapper">
              <textarea
                className="chat-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={1}
                placeholder={activeNotebookId ? "Ask a question..." : "Select a notebook first..."}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button className="btn-primary" onClick={() => handleSend()} disabled={loading || !activeNotebookId}>
                {loading ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>

        {activeNotebookId && (
          <>
            <div
              className="resizer"
              onMouseDown={(e) => {
                e.preventDefault();
                isResizingRight.current = true;
                document.body.style.cursor = 'col-resize';
                document.body.classList.add('resizing-active');
              }}
              title="Drag to resize"
            />
            <SourceList
              sources={sources}
              notebookId={activeNotebookId}
              onRefresh={() => handleNotebookSelect(activeNotebookId)}
              width={rightWidth}
              isDarkMode={isDarkMode}
              onThemeToggle={() => setIsDarkMode(!isDarkMode)}
              isLoading={loadingSources}
              artifacts={artifacts}
            />
          </>
        )}
        {showPodcastSettings && (
          <PodcastSettings
            onConfirm={handlePodcastConfirm}
            onCancel={() => setShowPodcastSettings(false)}
          />
        )}
        {showQuizSettings && (
          <QuizSettings
            onConfirm={handleQuizConfirm}
            onCancel={() => setShowQuizSettings(false)}
          />
        )}
      </div>
    </TaskProvider>
  );
}
