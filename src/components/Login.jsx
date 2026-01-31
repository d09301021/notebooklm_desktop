import React, { useState } from 'react';

export default function Login({ onLogin }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleConnect = async () => {
        setLoading(true);
        setError(null);

        // Call API to login (triggers Playwright)
        try {
            const res = await fetch("http://127.0.0.1:8000/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}) // Empty body triggers interactive login
            });

            if (!res.ok) {
                const text = await res.text();
                try {
                    const json = JSON.parse(text);
                    throw new Error(json.detail || "Login failed");
                } catch (e2) {
                    throw new Error(text || "Login failed");
                }
            }

            onLogin(); // Notify parent on success
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '500px', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '1.5rem' }}>NotebookLM Desktop</h1>

                <p style={{ color: '#ccc', marginBottom: '2rem', lineHeight: '1.6' }}>
                    Click below to open a secure browser window for Google Login.<br />
                    <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                        (We use an automated browser to securely capture your session)
                    </span>
                </p>

                {loading ? (
                    <div style={{ marginBottom: '1rem', color: '#bb86fc' }}>
                        <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
                        Launching Browser... Please log in to Google in the new window.<br />
                        <span style={{ fontSize: '0.8rem', color: '#aaa' }}>Do not close the browser until this updates.</span>
                    </div>
                ) : (
                    <button
                        onClick={handleConnect}
                        className="btn-primary"
                        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                    >
                        Connect with Google Account
                    </button>
                )}

                {error && <div style={{ color: '#cf6679', marginTop: '1.5rem' }}>Error: {error}</div>}
            </div>
        </div>
    );
}
