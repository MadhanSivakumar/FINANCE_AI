import { useState, useEffect, useRef, useCallback } from "react";

const WS_URL = "wss://on1dysol7l.execute-api.us-east-1.amazonaws.com/productionx";
const PRESET_SYMBOLS = ["TSLA", "AAPL", "GOOGL", "MSFT", "AMZN", "NVDA"];

function Sparkline({ positive, width = 140, height = 48 }) {
    const points = useRef(
        Array.from({ length: 16 }, (_, i) => {
            const trend = positive ? 1 : -1;
            const noise = (Math.random() - 0.46) * 18;
            return Math.max(6, Math.min(42, 24 + trend * i * 1.8 + noise));
        })
    ).current;
    const pts = points.map((y, i) => `${(i / 15) * width},${height - y}`).join(" ");
    const area = `${pts} ${width},${height} 0,${height}`;
    const color = positive ? "#60a5fa" : "#f87171";
    const id = `grad-${positive ? "pos" : "neg"}`;
    return (
        <svg width={width} height={height} style={{ overflow: "visible", display: "block" }}>
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={area} fill={`url(#${id})`} />
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={(15 / 15) * width} cy={height - points[15]} r="3" fill={color} />
        </svg>
    );
}

function PortfolioSummary({ stocks, dark }) {
    const entries = Object.values(stocks);
    if (entries.length === 0) return null;
    const total = entries.reduce((s, e) => s + parseFloat(e.price || 0), 0);
    const avgChg = entries.reduce((s, e) => s + parseFloat(e.change_percent || 0), 0) / entries.length;
    const winners = entries.filter(e => parseFloat(e.change_percent) >= 0).length;
    const losers = entries.length - winners;
    const border = dark ? "#1a2540" : "#dde6f5";

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1px",
            background: border,
            borderRadius: "20px",
            overflow: "hidden",
            marginBottom: "40px",
            border: `1px solid ${border}`,
        }}>
            {[
                { label: "Total Portfolio", value: `$${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, big: true },
                { label: "Avg. Change", value: `${avgChg >= 0 ? "+" : ""}${avgChg.toFixed(3)}%`, color: avgChg >= 0 ? "#60a5fa" : "#f87171" },
                { label: "Winners", value: winners, color: "#60a5fa" },
                { label: "Losers", value: losers, color: losers > 0 ? "#f87171" : (dark ? "#e8f0ff" : "#0f172a") },
            ].map((item, i) => (
                <div key={i} style={{ background: dark ? "#080f1e" : "#ffffff", padding: "28px 32px", textAlign: "center" }}>
                    <div style={{ fontSize: "10px", letterSpacing: "3px", textTransform: "uppercase", color: dark ? "#334d70" : "#94a3b8", fontFamily: "'DM Sans',sans-serif", marginBottom: "10px" }}>{item.label}</div>
                    <div style={{ fontSize: item.big ? "28px" : "26px", fontWeight: item.big ? "300" : "400", fontFamily: item.big ? "'Cormorant Garamond',serif" : "'DM Sans',sans-serif", color: item.color || (dark ? "#e8f0ff" : "#0f172a"), letterSpacing: item.big ? "-1px" : "0" }}>{item.value}</div>
                </div>
            ))}
        </div>
    );
}

function StockCard({ stock, onRemove, dark, index }) {
    const isPos = parseFloat(stock.change_percent) >= 0;
    const [expanded, setExpanded] = useState(false);
    const accent = isPos ? "#60a5fa" : "#f87171";

    return (
        <div style={{
            background: dark ? "#080f1e" : "#ffffff",
            borderRadius: "24px",
            overflow: "hidden",
            border: `1px solid ${dark ? "#131f35" : "#e2ecf8"}`,
            boxShadow: dark ? "none" : "0 2px 30px #3b82f608",
            animation: `riseIn 0.6s cubic-bezier(0.22,1,0.36,1) ${index * 0.08}s both`,
            transition: "transform 0.25s ease, box-shadow 0.25s ease",
            position: "relative",
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = dark ? `0 20px 60px #00000080, 0 0 0 1px ${accent}25` : `0 20px 60px #3b82f618`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = dark ? "none" : "0 2px 30px #3b82f608"; }}
        >
            <div style={{ height: "2px", background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
            <div style={{ position: "absolute", top: 0, right: 0, width: "200px", height: "200px", background: `radial-gradient(circle, ${accent}06 0%, transparent 70%)`, pointerEvents: "none" }} />

            <div style={{ padding: "28px", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                    <div>
                        <div style={{ fontSize: "10px", letterSpacing: "3px", textTransform: "uppercase", color: dark ? "#253a55" : "#94a3b8", fontFamily: "'DM Sans',sans-serif", marginBottom: "8px" }}>{stock.data_source}</div>
                        <div style={{ fontSize: "32px", fontWeight: "600", color: dark ? "#e8f0ff" : "#0a1628", fontFamily: "'DM Sans',sans-serif", letterSpacing: "-0.5px", lineHeight: 1 }}>{stock.symbol}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                        <button onClick={() => onRemove(stock.symbol)} style={{
                            width: "28px", height: "28px", borderRadius: "50%",
                            background: dark ? "#0f1e35" : "#f1f5f9", border: "none",
                            color: dark ? "#253a55" : "#94a3b8", fontSize: "16px",
                            display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#ef444420"; e.currentTarget.style.color = "#ef4444"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = dark ? "#0f1e35" : "#f1f5f9"; e.currentTarget.style.color = dark ? "#253a55" : "#94a3b8"; }}
                        >×</button>
                        <div style={{ padding: "5px 12px", borderRadius: "20px", background: `${accent}15`, border: `1px solid ${accent}30`, fontSize: "12px", fontWeight: "500", color: accent, fontFamily: "'DM Sans',sans-serif", letterSpacing: "0.5px" }}>
                            {isPos ? "▲" : "▼"} {Math.abs(parseFloat(stock.change_percent)).toFixed(4)}%
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
                    <div>
                        <div style={{ fontSize: "10px", letterSpacing: "2px", color: dark ? "#1e3050" : "#cbd5e1", fontFamily: "'DM Sans',sans-serif", marginBottom: "6px", textTransform: "uppercase" }}>Current Price</div>
                        <div style={{ fontSize: "48px", fontWeight: "300", fontFamily: "'Cormorant Garamond',serif", color: dark ? "#e8f0ff" : "#0a1628", letterSpacing: "-2px", lineHeight: 1 }}>
                            <span style={{ fontSize: "22px", verticalAlign: "super", marginRight: "2px", color: dark ? "#334d70" : "#94a3b8" }}>$</span>
                            {parseFloat(stock.price).toFixed(2)}
                        </div>
                    </div>
                    <Sparkline positive={isPos} />
                </div>

                <div style={{ height: "1px", background: `linear-gradient(90deg, transparent, ${dark ? "#1a2540" : "#e8eef8"}, transparent)`, marginBottom: "20px" }} />

                <div style={{ background: dark ? "#050c1a" : "#f8faff", borderRadius: "14px", padding: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: accent }} />
                            <span style={{ fontSize: "10px", letterSpacing: "2px", color: dark ? "#253a55" : "#94a3b8", fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase" }}>AI Insight</span>
                        </div>
                        <button onClick={() => setExpanded(!expanded)} style={{ background: "none", border: "none", fontSize: "11px", color: accent, fontFamily: "'DM Sans',sans-serif", letterSpacing: "1px", padding: "2px 8px" }}>
                            {expanded ? "COLLAPSE ↑" : "EXPAND ↓"}
                        </button>
                    </div>
                    <p style={{ fontSize: "13px", lineHeight: "1.8", color: dark ? "#3d5a7a" : "#64748b", fontFamily: "'DM Sans',sans-serif", fontWeight: "300", margin: 0, maxHeight: expanded ? "280px" : "56px", overflow: "hidden", transition: "max-height 0.5s cubic-bezier(0.4,0,0.2,1)" }}>
                        {stock.ai_analysis}
                    </p>
                </div>
            </div>
        </div>
    );
}

function LoadingCard({ symbol, dark, index }) {
    return (
        <div style={{ background: dark ? "#080f1e" : "#ffffff", borderRadius: "24px", border: `1px solid ${dark ? "#131f35" : "#e2ecf8"}`, minHeight: "260px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "20px", animation: `riseIn 0.5s ease ${index * 0.08}s both` }}>
            <div style={{ fontSize: "14px", letterSpacing: "5px", color: dark ? "#131f35" : "#e2ecf8", fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase" }}>{symbol}</div>
            <div style={{ display: "flex", gap: "5px", alignItems: "flex-end", height: "28px" }}>
                {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} style={{ width: "3px", background: "#3b82f6", borderRadius: "2px", animation: `barPulse 1.1s ease-in-out ${i * 0.1}s infinite` }} />
                ))}
            </div>
            <div style={{ fontSize: "10px", letterSpacing: "3px", color: dark ? "#0f1e35" : "#dde6f5", fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase" }}>Analyzing</div>
        </div>
    );
}

export default function App() {
    const [stocks, setStocks] = useState({});
    const [loading, setLoading] = useState({});
    const [inputSymbol, setInputSymbol] = useState("");
    const [wsStatus, setWsStatus] = useState("disconnected");
    const [error, setError] = useState("");
    const [dark, setDark] = useState(true);
    const [inputFocused, setInputFocused] = useState(false);
    const wsRef = useRef(null);
    const pendingRef = useRef({});

    const connectWS = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;
        setWsStatus("connecting");
        const ws = new WebSocket(WS_URL);
        ws.onopen = () => {
            setWsStatus("connected");
            Object.keys(pendingRef.current).forEach(sym => ws.send(JSON.stringify({ action: "analyze", symbol: sym })));
        };
        ws.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.symbol) {
                    setStocks(prev => ({ ...prev, [data.symbol]: data }));
                    setLoading(prev => { const n = { ...prev }; delete n[data.symbol]; return n; });
                    delete pendingRef.current[data.symbol];
                }
            } catch (err) { console.error(err); }
        };
        ws.onclose = () => { setWsStatus("disconnected"); setTimeout(connectWS, 3000); };
        ws.onerror = () => setWsStatus("error");
        wsRef.current = ws;
    }, []);

    useEffect(() => { connectWS(); return () => wsRef.current?.close(); }, [connectWS]);

    const analyzeStock = (symbol) => {
        const sym = symbol.toUpperCase().trim();
        if (!sym || stocks[sym] || loading[sym]) return;
        setLoading(prev => ({ ...prev, [sym]: true }));
        setError("");
        pendingRef.current[sym] = true;
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ action: "analyze", symbol: sym }));
        } else { setError("Reconnecting to server..."); connectWS(); }
    };

    const removeStock = (symbol) => setStocks(prev => { const n = { ...prev }; delete n[symbol]; return n; });
    const handleSubmit = () => { if (!inputSymbol.trim()) return; analyzeStock(inputSymbol); setInputSymbol(""); };

    const bg = dark ? "#050c18" : "#eef3fc";
    const surface = dark ? "#080f1e" : "#ffffff";
    const border = dark ? "#131f35" : "#dde6f5";
    const text = dark ? "#e8f0ff" : "#0a1628";
    const muted = dark ? "#253a55" : "#94a3b8";
    const statusColor = wsStatus === "connected" ? "#60a5fa" : wsStatus === "connecting" ? "#fbbf24" : "#f87171";
    const isEmpty = Object.values(stocks).length === 0 && Object.keys(loading).length === 0;

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@200;300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${bg}; min-height: 100vh; font-family: 'DM Sans', sans-serif; transition: background 0.4s ease; -webkit-font-smoothing: antialiased; }
        ::selection { background: #3b82f640; }
        @keyframes riseIn { from { opacity: 0; transform: translateY(24px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes barPulse { 0%, 100% { height: 8px; opacity: 0.25; } 50% { height: 26px; opacity: 1; } }
        @keyframes fadeSlideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder { color: ${muted}; opacity: 0.6; }
        input:focus { outline: none; }
        button { cursor: pointer; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: #3b82f625; border-radius: 4px; }
        .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 24px; }
        @media (max-width: 860px) { .card-grid { grid-template-columns: 1fr; } }
      `}</style>

            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "-30%", left: "50%", transform: "translateX(-50%)", width: "1000px", height: "600px", background: dark ? "radial-gradient(ellipse, #1a3a6012 0%, transparent 70%)" : "radial-gradient(ellipse, #3b82f606 0%, transparent 70%)" }} />
                <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "600px", height: "400px", background: dark ? "radial-gradient(ellipse, #0f2a4510 0%, transparent 70%)" : "radial-gradient(ellipse, #3b82f604 0%, transparent 70%)" }} />
            </div>

            <nav style={{ position: "sticky", top: 0, zIndex: 200, background: dark ? "rgba(5,12,24,0.88)" : "rgba(238,243,252,0.88)", backdropFilter: "blur(24px) saturate(180%)", borderBottom: `1px solid ${border}`, height: "68px", display: "flex", alignItems: "center", padding: "0 48px", animation: "fadeSlideDown 0.5s ease" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginRight: "auto" }}>
                    <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "22px", fontWeight: "500", color: text, letterSpacing: "-0.5px" }}>Finance</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                        <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#3b82f6" }} />
                        <span style={{ fontSize: "10px", fontWeight: "600", color: "#3b82f6", letterSpacing: "3px", textTransform: "uppercase" }}>AI</span>
                    </div>
                </div>

                <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: "8px", background: dark ? "#0a1628" : "#f0f6ff", border: `1px solid ${border}`, borderRadius: "20px", padding: "7px 16px" }}>
                    <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
                    <span style={{ fontSize: "11px", color: muted, letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: "500" }}>{wsStatus}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {Object.values(stocks).length > 0 && <span style={{ fontSize: "12px", color: muted }}>{Object.values(stocks).length} position{Object.values(stocks).length > 1 ? "s" : ""}</span>}
                    <button onClick={() => setDark(!dark)} style={{ background: dark ? "#0d1e35" : "#e2ecf8", border: `1px solid ${border}`, borderRadius: "10px", padding: "8px 18px", fontSize: "12px", fontWeight: "500", color: dark ? "#60a5fa" : "#64748b", letterSpacing: "0.5px", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "6px" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "#3b82f650"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = border}
                    ><span>{dark ? "☀" : "☾"}</span><span>{dark ? "Light" : "Dark"}</span></button>
                </div>
            </nav>

            <main style={{ position: "relative", zIndex: 1, maxWidth: "1320px", margin: "0 auto", padding: "64px 48px 100px" }}>
                <div style={{ textAlign: "center", marginBottom: "64px", animation: "riseIn 0.7s ease" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: dark ? "#0d1e35" : "#e8f0ff", border: `1px solid ${dark ? "#1a2f50" : "#c7d9f8"}`, borderRadius: "20px", padding: "6px 18px", marginBottom: "28px" }}>
                        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#60a5fa" }} />
                        <span style={{ fontSize: "11px", fontWeight: "500", color: "#60a5fa", letterSpacing: "2px", textTransform: "uppercase" }}>Live Intelligence</span>
                    </div>

                    <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(48px, 7vw, 84px)", fontWeight: "300", color: text, lineHeight: 1.05, letterSpacing: "-3px", marginBottom: "20px" }}>
                        Market Analysis<br />
                        <span style={{ fontStyle: "italic", color: "#3b82f6" }}>Reimagined</span>
                    </h1>

                    <p style={{ fontSize: "16px", fontWeight: "300", color: muted, letterSpacing: "0.3px", lineHeight: 1.6, maxWidth: "480px", margin: "0 auto 48px" }}>
                        Real-time stock intelligence powered by multi-source financial data and Claude AI analysis
                    </p>

                    <div style={{ maxWidth: "580px", margin: "0 auto" }}>
                        <div style={{ display: "flex", background: surface, border: `1.5px solid ${inputFocused ? "#3b82f6" : border}`, borderRadius: "16px", overflow: "hidden", boxShadow: inputFocused ? `0 0 0 4px #3b82f615, 0 8px 40px ${dark ? "#00000060" : "#3b82f612"}` : `0 4px 24px ${dark ? "#00000040" : "#3b82f608"}`, transition: "all 0.3s ease", marginBottom: "20px" }}>
                            <div style={{ padding: "18px 20px", color: muted, fontSize: "18px", fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", display: "flex", alignItems: "center" }}>$</div>
                            <input
                                value={inputSymbol}
                                onChange={e => setInputSymbol(e.target.value.toUpperCase())}
                                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                                onFocus={() => setInputFocused(true)}
                                onBlur={() => setInputFocused(false)}
                                placeholder="Enter ticker symbol — AAPL, TSLA, NVDA..."
                                style={{ flex: 1, background: "none", border: "none", fontSize: "15px", color: text, fontFamily: "'DM Sans',sans-serif", fontWeight: "300", padding: "18px 8px", letterSpacing: "0.5px" }}
                            />
                            <button onClick={handleSubmit} style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", border: "none", padding: "0 32px", fontSize: "12px", fontWeight: "600", color: "#fff", letterSpacing: "2px", textTransform: "uppercase", transition: "opacity 0.2s", margin: "6px", borderRadius: "12px", whiteSpace: "nowrap" }}
                                onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                            >Analyze →</button>
                        </div>

                        {error && <div style={{ fontSize: "12px", color: "#f87171", marginBottom: "14px" }}>{error}</div>}

                        <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                            {PRESET_SYMBOLS.map((sym, i) => {
                                const active = !!stocks[sym];
                                return (
                                    <button key={sym} onClick={() => analyzeStock(sym)} style={{ background: active ? "#3b82f612" : "transparent", border: `1px solid ${active ? "#3b82f645" : border}`, borderRadius: "10px", padding: "7px 16px", fontSize: "12px", fontWeight: "500", color: active ? "#60a5fa" : muted, letterSpacing: "1px", transition: "all 0.2s", animation: `riseIn 0.5s ease ${0.1 + i * 0.05}s both` }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.color = "#60a5fa"; e.currentTarget.style.background = "#3b82f610"; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = active ? "#3b82f645" : border; e.currentTarget.style.color = active ? "#60a5fa" : muted; e.currentTarget.style.background = active ? "#3b82f612" : "transparent"; }}
                                    >{sym}</button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <PortfolioSummary stocks={stocks} dark={dark} />

                {isEmpty && (
                    <div style={{ textAlign: "center", padding: "80px 20px", animation: "riseIn 0.6s ease" }}>
                        <div style={{ width: "80px", height: "80px", borderRadius: "50%", border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", background: surface }}>
                            <span style={{ fontSize: "30px", opacity: 0.2 }}>◈</span>
                        </div>
                        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "28px", fontWeight: "300", color: dark ? "#131f35" : "#c7d9f8", marginBottom: "10px" }}>No positions open</div>
                        <div style={{ fontSize: "13px", color: dark ? "#0d1a2e" : "#dde6f5", letterSpacing: "1px", fontWeight: "300" }}>Search a ticker or tap a preset to begin analysis</div>
                    </div>
                )}

                {!isEmpty && (
                    <div className="card-grid">
                        {Object.keys(loading).map((sym, i) => <LoadingCard key={sym} symbol={sym} dark={dark} index={i} />)}
                        {Object.values(stocks).map((stock, i) => (
                            <StockCard key={stock.symbol} stock={stock} onRemove={removeStock} dark={dark} index={i} />
                        ))}
                    </div>
                )}

                {Object.values(stocks).length > 0 && (
                    <div style={{ textAlign: "center", marginTop: "80px", paddingTop: "32px", borderTop: `1px solid ${border}` }}>
                        <div style={{ fontSize: "11px", color: dark ? "#0d1a2e" : "#dde6f5", letterSpacing: "3px", textTransform: "uppercase", fontWeight: "500" }}>
                            Live Data · Finnhub · Yahoo Finance · Claude AI
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}