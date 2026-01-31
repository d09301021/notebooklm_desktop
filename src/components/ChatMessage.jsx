import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MindMap from './MindMap';

export default function ChatMessage({ text, role }) {
  const isUser = role === "user";
  const isMindMap = text.startsWith("!!MINDMAP!!");

  let content = text;
  let mindMapData = null;

  if (isMindMap) {
    try {
      const jsonStr = text.replace("!!MINDMAP!!", "");
      mindMapData = JSON.parse(jsonStr);
      content = "I've generated a mind map based on our discussion:";
    } catch (e) {
      console.error("Failed to parse mindmap data", e);
    }
  }

  return (
    <div className={`message-container ${isUser ? 'user-container' : 'ai-container'}`}>
      <div className={`message-bubble ${isUser ? 'user' : 'ai'} ${isMindMap ? 'mindmap-bubble' : ''}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ node, ...props }) => <div style={{ margin: "0 0 0.8rem 0" }} {...props} />,
            ul: ({ node, ...props }) => <ul style={{ paddingLeft: "1.2rem", margin: "0.5rem 0" }} {...props} />,
            ol: ({ node, ...props }) => <ol style={{ paddingLeft: "1.2rem", margin: "0.5rem 0" }} {...props} />,
            code: ({ node, inline, className, children, ...props }) => {
              return inline ?
                <code style={{ background: "rgba(0,0,0,0.1)", padding: "2px 4px", borderRadius: "4px" }} {...props}>{children}</code> :
                <pre style={{ background: "rgba(0,0,0,0.05)", padding: "1rem", borderRadius: "8px", overflowX: "auto", margin: "0.5rem 0" }}>
                  <code {...props}>{children}</code>
                </pre>
            }
          }}
        >
          {content}
        </ReactMarkdown>
        {isMindMap && mindMapData && <MindMap data={mindMapData} />}
      </div>
    </div>
  )
}
