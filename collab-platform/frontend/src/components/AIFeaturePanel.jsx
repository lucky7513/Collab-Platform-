import { useState, useRef, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL + "/api/ai/process"
  : "/api/ai/process";

const TABS = [
  { id: "search", label: "Smart Search", icon: "⌕" },
  { id: "summarize", label: "Summarize", icon: "◈" },
  { id: "generate", label: "Generate", icon: "✦" },
];

const GENERATE_TYPES = [
  "Meeting agenda",
  "Project brief",
  "Status update",
  "Technical spec",
  "Action items",
];

async function callAI(action, text) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, text }),
  });
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  const data = await res.json();
  return data.result || data.content || data.text || JSON.stringify(data);
}

function TypewriterText({ text, speed = 10 }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    if (!text) return;
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text]);
  return <span>{displayed}</span>;
}

export default function AIFeaturePanel({ documents = [] }) {
  const [activeTab, setActiveTab] = useState("search");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchDocs] = useState(
    documents.length
      ? documents
      : [
          { id: 1, title: "Q2 Roadmap", content: "Feature planning for Q2 including auth redesign, notifications, and mobile app launch." },
          { id: 2, title: "Design System", content: "Color tokens, typography scale, spacing guidelines, and component library documentation." },
          { id: 3, title: "API Docs", content: "REST endpoints for users, documents, workspaces, and real-time sync via WebSocket." },
          { id: 4, title: "Onboarding Guide", content: "Step-by-step setup for new team members: accounts, tools, workflows, and best practices." },
        ]
  );

  const [docText, setDocText] = useState("");
  const [summaryStyle, setSummaryStyle] = useState("concise");

  const [genType, setGenType] = useState("Meeting agenda");
  const [genContext, setGenContext] = useState("");

  const resultRef = useRef(null);
  useEffect(() => {
    if (result && resultRef.current)
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [result]);

  const reset = () => { setResult(""); setError(""); };

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setLoading(true); reset();
    try {
      const corpus = searchDocs.map((d) => `[${d.title}]: ${d.content}`).join("\n");
      const text = await callAI(
        "search",
        `Query: "${searchQuery}"\n\nSearch through these documents and return the most relevant results ranked by relevance with a short explanation:\n${corpus}`
      );
      setResult(text);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleSummarize() {
    if (!docText.trim()) return;
    setLoading(true); reset();
    try {
      const styleMap = {
        concise: "Summarize in 3-5 bullet points, very brief",
        detailed: "Summarize in a structured format with key sections, detailed",
        executive: "Write a 2-3 sentence executive summary for leadership",
        action: "Extract only action items and decisions made",
      };
      const text = await callAI("summarize", `${styleMap[summaryStyle]}:\n\n${docText}`);
      setResult(text);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleGenerate() {
    if (!genContext.trim()) return;
    setLoading(true); reset();
    try {
      const text = await callAI(
        "generate",
        `Generate a ${genType} for a collaborative team platform. Context: ${genContext}`
      );
      setResult(text);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const handleSubmit = () => {
    if (activeTab === "search") handleSearch();
    else if (activeTab === "summarize") handleSummarize();
    else handleGenerate();
  };

  return (
    <div style={styles.wrapper}>
      <style>{css}</style>
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <span style={styles.sparkIcon}>✦</span>
          <h2 style={styles.title}>AI Assistant</h2>
          <span style={styles.badge}>Claude</span>
        </div>
        <p style={styles.subtitle}>Powered by your backend</p>
      </div>

      <div style={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}
            onClick={() => { setActiveTab(tab.id); reset(); }}
            className="ai-tab"
          >
            <span style={styles.tabIcon}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div style={styles.body}>
        {activeTab === "search" && (
          <div style={styles.section}>
            <label style={styles.label}>What are you looking for?</label>
            <input
              style={styles.input}
              placeholder="e.g. authentication flow, design tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="ai-input"
            />
            <div style={styles.docChips}>
              <span style={styles.chipLabel}>Searching across:</span>
              {searchDocs.map((d) => (
                <span key={d.id} style={styles.chip}>{d.title}</span>
              ))}
            </div>
          </div>
        )}

        {activeTab === "summarize" && (
          <div style={styles.section}>
            <label style={styles.label}>Paste document content</label>
            <textarea
              style={{ ...styles.input, ...styles.textarea }}
              placeholder="Paste your document, meeting notes, or any text here..."
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              className="ai-input"
            />
            <div style={styles.styleRow}>
              <span style={styles.chipLabel}>Style:</span>
              {["concise", "detailed", "executive", "action"].map((s) => (
                <button
                  key={s}
                  style={{ ...styles.chip, ...styles.chipBtn, ...(summaryStyle === s ? styles.chipActive : {}) }}
                  onClick={() => setSummaryStyle(s)}
                  className="ai-chip-btn"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "generate" && (
          <div style={styles.section}>
            <label style={styles.label}>Content type</label>
            <div style={styles.genTypeGrid}>
              {GENERATE_TYPES.map((t) => (
                <button
                  key={t}
                  style={{ ...styles.typeCard, ...(genType === t ? styles.typeCardActive : {}) }}
                  onClick={() => setGenType(t)}
                  className="ai-type-card"
                >
                  {t}
                </button>
              ))}
            </div>
            <label style={{ ...styles.label, marginTop: 16 }}>Context</label>
            <textarea
              style={{ ...styles.input, ...styles.textarea }}
              placeholder="Describe what you need..."
              value={genContext}
              onChange={(e) => setGenContext(e.target.value)}
              className="ai-input"
            />
          </div>
        )}

        <button
          style={{ ...styles.submitBtn, ...(loading ? styles.submitBtnLoading : {}) }}
          onClick={handleSubmit}
          disabled={loading}
          className="ai-submit"
        >
          {loading ? (
            <span style={styles.loadingInner}>
              <span style={styles.spinner} className="ai-spinner" />
              Processing...
            </span>
          ) : (
            <>
              {activeTab === "search" && "⌕ Search"}
              {activeTab === "summarize" && "◈ Summarize"}
              {activeTab === "generate" && "✦ Generate"}
            </>
          )}
        </button>

        {error && <div style={styles.errorBox}>⚠ {error}</div>}

        {result && (
          <div style={styles.resultBox} ref={resultRef}>
            <div style={styles.resultHeader}>
              <span style={styles.resultLabel}>
                {activeTab === "search" && "Search Results"}
                {activeTab === "summarize" && "Summary"}
                {activeTab === "generate" && "Generated Content"}
              </span>
              <button
                style={styles.copyBtn}
                onClick={() => navigator.clipboard.writeText(result)}
                className="ai-copy"
              >
                Copy
              </button>
            </div>
            <div style={styles.resultContent}>
              <TypewriterText text={result} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: { fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "#0d0f12", border: "1px solid #1e2530", borderRadius: 16, overflow: "hidden", width: "100%", maxWidth: 560, color: "#e8eaf0", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" },
  header: { padding: "20px 24px 16px", borderBottom: "1px solid #1e2530", background: "linear-gradient(135deg, #0d0f12 0%, #111620 100%)" },
  headerTop: { display: "flex", alignItems: "center", gap: 10 },
  sparkIcon: { fontSize: 18, color: "#cc785c", filter: "drop-shadow(0 0 8px #cc785c88)" },
  title: { margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "#f0f2f8" },
  badge: { background: "#1a1008", border: "1px solid #6b3a1f", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#cc785c", fontWeight: 600, marginLeft: 4 },
  subtitle: { margin: "4px 0 0 28px", fontSize: 12, color: "#4a5568", letterSpacing: "0.04em", textTransform: "uppercase" },
  tabs: { display: "flex", borderBottom: "1px solid #1e2530", background: "#0a0c10" },
  tab: { flex: 1, padding: "12px 8px", background: "none", border: "none", color: "#4a5a70", cursor: "pointer", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s", borderBottom: "2px solid transparent" },
  tabActive: { color: "#cc785c", borderBottom: "2px solid #cc785c", background: "#0d0f12" },
  tabIcon: { fontSize: 15 },
  body: { padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 0 },
  section: { marginBottom: 16 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#5a6a80", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 },
  input: { width: "100%", background: "#080a0e", border: "1px solid #1e2530", borderRadius: 10, color: "#e8eaf0", padding: "11px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.2s" },
  textarea: { minHeight: 120, resize: "vertical", lineHeight: 1.6 },
  docChips: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 10 },
  chipLabel: { fontSize: 11, color: "#3a4a5a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginRight: 2 },
  chip: { background: "#111620", border: "1px solid #1e2530", borderRadius: 6, padding: "3px 9px", fontSize: 12, color: "#5a7090" },
  styleRow: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 10 },
  chipBtn: { cursor: "pointer", background: "#111620", transition: "all 0.15s", textTransform: "capitalize" },
  chipActive: { background: "#1a1008", border: "1px solid #cc785c", color: "#cc785c" },
  genTypeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  typeCard: { background: "#080a0e", border: "1px solid #1e2530", borderRadius: 8, color: "#5a7090", padding: "10px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500, textAlign: "left", transition: "all 0.15s" },
  typeCardActive: { background: "#1a1008", border: "1px solid #cc785c", color: "#cc785c" },
  submitBtn: { width: "100%", background: "linear-gradient(135deg, #8b4513, #cc785c)", border: "none", borderRadius: 10, color: "#fff", padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "0.02em", transition: "opacity 0.2s, transform 0.1s", marginTop: 4, fontFamily: "inherit" },
  submitBtnLoading: { opacity: 0.7, cursor: "not-allowed" },
  loadingInner: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  spinner: { width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block" },
  errorBox: { marginTop: 14, background: "#1a0a0a", border: "1px solid #4a1a1a", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#e05555" },
  resultBox: { marginTop: 16, background: "#080a0e", border: "1px solid #1e2530", borderRadius: 10, overflow: "hidden" },
  resultHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid #1e2530", background: "#0d0f12" },
  resultLabel: { fontSize: 11, fontWeight: 700, color: "#cc785c", textTransform: "uppercase", letterSpacing: "0.07em" },
  copyBtn: { background: "none", border: "1px solid #1e2530", borderRadius: 5, color: "#4a5a70", padding: "3px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" },
  resultContent: { padding: "14px", fontSize: 13, lineHeight: 1.75, color: "#c0cce0", whiteSpace: "pre-wrap", maxHeight: 320, overflowY: "auto" },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  .ai-tab:hover { color: #cc785c !important; }
  .ai-input:focus { border-color: #cc785c !important; box-shadow: 0 0 0 3px rgba(204,120,92,0.12); }
  .ai-submit:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
  .ai-submit:active:not(:disabled) { transform: translateY(0); }
  .ai-spinner { animation: spin 0.7s linear infinite; }
  .ai-chip-btn:hover { border-color: #cc785c !important; color: #cc785c !important; }
  .ai-type-card:hover { border-color: #3a2010 !important; color: #8a7060 !important; }
  .ai-copy:hover { background: #1a2030 !important; color: #a0b0c0 !important; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;