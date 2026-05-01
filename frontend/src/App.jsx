import { useState, useEffect } from "react";
import { generatePages } from "./pageGenerator.js";
import { submitConfession } from "./submit.js";
import { downloadPages } from "./download.js";

function App() {
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");

useEffect(() => {
  document.fonts.ready.then(() => {
    requestAnimationFrame(() => {
      generatePages(to, from, message);
    });
  });
}, [to, from, message]);

  return (
    <div className="container">

      <div className="form">
        <label>To</label>
        <textarea id="toInput" value={to} onChange={(e) => setTo(e.target.value)} />

        <label>Message</label>
        <textarea id="messageInput" value={message} onChange={(e) => setMessage(e.target.value)} />

        <label>From</label>
        <textarea id="fromInput" value={from} onChange={(e) => setFrom(e.target.value)} />

        <button onClick={downloadPages}>Download Pages</button>
        <button onClick={() => submitConfession(to, from, message)}>
          Submit Confession
        </button>
      </div>

      <div className="preview-wrapper" id="previewWrapper"></div>

      {/* TEMPLATE (same as before) */}
      <div className="template" id="template" style={{ display: "none" }}>
        <div className="to">
          <h2 className="previewTo">Someone</h2>
        </div>

        <div className="message"></div>

        <div className="from">
          <h3 className="previewFrom">Unknown</h3>
        </div>
      </div>

    </div>
  );
}

export default App;