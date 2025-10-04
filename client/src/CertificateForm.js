import React, { useState, useRef } from "react";
import CertificatePreview from "./CertificatePreview";

const fontFamilies = [
  "Arial", "Times New Roman", "Georgia", "Verdana", "Cursive", "Comic Sans MS", "Courier New"
];
const fontWeights = ["normal", "bold", "lighter"];

export default function CertificateForm() {
  const [template, setTemplate] = useState(null);
  const [namesFile, setNamesFile] = useState(null);
  const [fontFile, setFontFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [footerText, setFooterText] = useState("");
  const [sendEmails, setSendEmails] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState({ host: "", port: 587, user: "", pass: "" });
  const [position, setPosition] = useState({ x: 600, y: 450 });
  const [fontOptions, setFontOptions] = useState({
    family: "Arial",
    size: 48,
    color: "#222",
    weight: "normal",
    alignment: "center",
    outlineColor: "#ffffff",
    outlineWidth: 0,
    shadow: false,
    rotation: 0,
    letterSpacing: "normal"
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewImages, setPreviewImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadLink, setDownloadLink] = useState("");
  const canvasRef = useRef();

  // Draw preview
  const drawPreview = () => {
    const canvas = canvasRef.current;
    if (canvas && previewUrl) {
      const ctx = canvas.getContext("2d");
      const img = new window.Image();
      img.src = previewUrl;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(fontOptions.rotation ? position.x : 0, fontOptions.rotation ? position.y : 0);
        if (fontOptions.rotation) {
          ctx.rotate((fontOptions.rotation * Math.PI) / 180);
        }
        ctx.font = `${fontOptions.weight} ${fontOptions.size}px ${fontOptions.family}`;
        ctx.fillStyle = fontOptions.color;
        ctx.textAlign = fontOptions.alignment;
        ctx.textBaseline = "middle";
        if (fontOptions.outlineWidth > 0) {
          ctx.strokeStyle = fontOptions.outlineColor;
          ctx.lineWidth = fontOptions.outlineWidth;
          ctx.strokeText("NAME HERE", position.x, position.y);
        }
        if (fontOptions.shadow) {
          ctx.shadowColor = "#222";
          ctx.shadowBlur = 6;
          ctx.shadowOffsetX = 4;
          ctx.shadowOffsetY = 4;
        }
        // Letter spacing
        if (fontOptions.letterSpacing === "normal") {
          ctx.fillText("NAME HERE", position.x, position.y);
        } else {
          let x = position.x;
          const spacing = Number(fontOptions.letterSpacing);
          "NAME HERE".split("").forEach(char => {
            ctx.fillText(char, x, position.y);
            x += ctx.measureText(char).width + spacing;
          });
        }
        ctx.restore();
        // Logo
        if (logoFile) {
          const logoImg = new window.Image();
          logoImg.src = URL.createObjectURL(logoFile);
          logoImg.onload = () => {
            ctx.drawImage(logoImg, 20, 20, 80, 80);
          };
        }
        // Signature
        if (signatureFile) {
          const sigImg = new window.Image();
          sigImg.src = URL.createObjectURL(signatureFile);
          sigImg.onload = () => {
            ctx.drawImage(sigImg, 1080, 820, 100, 50);
          };
        }
        // Footer
        if (footerText) {
          ctx.font = "18px Arial";
          ctx.fillStyle = "#222";
          ctx.textAlign = "center";
          ctx.fillText(footerText, canvas.width / 2, canvas.height - 30);
        }
      };
    }
  };

  React.useEffect(() => {
    drawPreview();
    // eslint-disable-next-line
  }, [previewUrl, position, fontOptions, logoFile, signatureFile, footerText]);

  const handleTemplateChange = (e) => {
    if (e.target.files[0]) {
      setTemplate(e.target.files[0]);
      setPreviewUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleNamesChange = (e) => setNamesFile(e.target.files[0]);
  const handleFontFileChange = (e) => setFontFile(e.target.files[0]);
  const handleLogoChange = (e) => setLogoFile(e.target.files[0]);
  const handleSignatureChange = (e) => setSignatureFile(e.target.files[0]);

  const handleCanvasClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    setPosition({
      x: Math.round((e.nativeEvent.offsetX / rect.width) * 1200),
      y: Math.round((e.nativeEvent.offsetY / rect.height) * 900)
    });
  };

  const handleFontOptionChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFontOptions((opts) => ({
      ...opts,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSmtpChange = (e) => {
    const { name, value } = e.target;
    setSmtpConfig((cfg) => ({ ...cfg, [name]: value }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);

    const formData = new FormData();
    formData.append("template", template);
    formData.append("names", namesFile);
    if (fontFile) formData.append("font", fontFile);
    if (logoFile) formData.append("logo", logoFile);
    if (signatureFile) formData.append("signature", signatureFile);
    formData.append("position", JSON.stringify(position));
    formData.append("fontOptions", JSON.stringify(fontOptions));
    formData.append("footerText", footerText);
    formData.append("sendEmails", sendEmails);
    formData.append("smtpConfig", JSON.stringify({
      host: smtpConfig.host,
      port: Number(smtpConfig.port),
      auth: { user: smtpConfig.user, pass: smtpConfig.pass }
    }));

    try {
      // Request previews before actual download
      // Display first 3 previews
      if (namesFile) {
        const fakeNames = ["Alice", "Bob", "Charlie"];
        const previews = [];
        for (let name of fakeNames) {
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const img = new window.Image();
            img.src = previewUrl;
            await new Promise(res => { img.onload = res; });
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            ctx.font = `${fontOptions.weight} ${fontOptions.size}px ${fontOptions.family}`;
            ctx.fillStyle = fontOptions.color;
            ctx.textAlign = fontOptions.alignment;
            ctx.textBaseline = "middle";
            ctx.fillText(name, position.x, position.y);
            previews.push(canvas.toDataURL());
          }
        }
        setPreviewImages(previews);
      }

      const res = await fetch("http://localhost:3001/api/certificate/generate", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        setDownloadLink(url);
      } else {
        alert("Generation failed.");
      }
    } catch {
      alert("Error connecting to backend.");
    }
    setIsGenerating(false);
  };

  return (
    <form onSubmit={handleGenerate} aria-label="Certificate Generator Form">
      <div>
        <label>
          Certificate Template (PNG/JPG/PDF):
          <input type="file" accept="image/png,image/jpeg,application/pdf" onChange={handleTemplateChange} required />
        </label>
      </div>
      {previewUrl && (
        <div style={{ position: "relative", border: "1px solid #ccc", margin: "1rem 0", width: 600, height: 400 }}>
          <canvas
            ref={canvasRef}
            width={1200}
            height={900}
            style={{ width: 600, height: 400, cursor: "crosshair" }}
            onClick={handleCanvasClick}
            aria-label="Certificate Preview Canvas"
          />
        </div>
      )}
      <div>
        <label>
          Name List (CSV, TXT, JSON, XLS/XLSX/ODS; see formats below):
          <input type="file" accept=".csv,.txt,.json,.xls,.xlsx,.ods" onChange={handleNamesChange} required />
        </label>
        <div>
          <small>
            <strong>Supported formats:</strong> <br />
            <ul>
              <li>CSV: <code>name</code> column, optional <code>email</code> column</li>
              <li>TXT: one name per line</li>
              <li>JSON: <code>["Alice","Bob"]</code> or <code>[{"name":"Alice"}]</code> or <code>{"names":["Alice","Bob"]}</code></li>
              <li>Excel: first column, all rows (XLS, XLSX, ODS)</li>
            </ul>
          </small>
        </div>
      </div>
      <div>
        <label>
          Custom Font (TTF/OTF, optional):
          <input type="file" accept=".ttf,.otf" onChange={handleFontFileChange} />
        </label>
      </div>
      <div>
        <label>
          Logo/Image (PNG/JPG, optional):
          <input type="file" accept="image/png,image/jpeg" onChange={handleLogoChange} />
        </label>
      </div>
      <div>
        <label>
          Signature (PNG/JPG, optional):
          <input type="file" accept="image/png,image/jpeg" onChange={handleSignatureChange} />
        </label>
      </div>
      <div>
        <label>
          Footer Text:
          <input type="text" value={footerText} onChange={e => setFooterText(e.target.value)} />
        </label>
      </div>
      <fieldset style={{ margin: "1rem 0", border: "1px solid #eee", padding: "1rem" }}>
        <legend><strong>Advanced Styling</strong></legend>
        <label>
          Font Family:
          <select name="family" value={fontOptions.family} onChange={handleFontOptionChange} style={{ marginLeft: 10 }}>
            {fontFamilies.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <label style={{ marginLeft: 20 }}>
          Font Weight:
          <select name="weight" value={fontOptions.weight} onChange={handleFontOptionChange}>
            {fontWeights.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </label>
        <label style={{ marginLeft: 20 }}>
          Font Size:
          <input name="size" type="number" value={fontOptions.size} min={12} max={200} onChange={handleFontOptionChange} style={{ width: 60 }} />
        </label>
        <label style={{ marginLeft: 20 }}>
          Font Color:
          <input name="color" type="color" value={fontOptions.color} onChange={handleFontOptionChange} />
        </label>
        <label style={{ marginLeft: 20 }}>
          Alignment:
          <select name="alignment" value={fontOptions.alignment} onChange={handleFontOptionChange}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>
        <br />
        <label>
          Outline Color:
          <input name="outlineColor" type="color" value={fontOptions.outlineColor} onChange={handleFontOptionChange} />
        </label>
        <label style={{ marginLeft: 20 }}>
          Outline Width:
          <input name="outlineWidth" type="number" value={fontOptions.outlineWidth} min={0} max={20} onChange={handleFontOptionChange} style={{ width: 50 }} />
        </label>
        <label style={{ marginLeft: 20 }}>
          Shadow:
          <input name="shadow" type="checkbox" checked={fontOptions.shadow} onChange={handleFontOptionChange} />
        </label>
        <label style={{ marginLeft: 20 }}>
          Rotation (deg):
          <input name="rotation" type="number" value={fontOptions.rotation} min={0} max={360} onChange={handleFontOptionChange} style={{ width: 50 }} />
        </label>
        <label style={{ marginLeft: 20 }}>
          Letter Spacing (px):
          <input name="letterSpacing" type="number" value={fontOptions.letterSpacing === "normal" ? 0 : fontOptions.letterSpacing} min={0} max={50} onChange={e => handleFontOptionChange({ target: { name: "letterSpacing", value: e.target.value === "0" ? "normal" : e.target.value } })} style={{ width: 50 }} />
        </label>
      </fieldset>
      <div style={{ margin: "1rem 0" }}>
        <small>
          <strong>Mark name position:</strong> Click on the preview above to set where the name should appear.
        </small>
      </div>
      <div>
        <label>
          Bulk Email Sending:
          <input type="checkbox" checked={sendEmails} onChange={e => setSendEmails(e.target.checked)} />
        </label>
        {sendEmails && (
          <fieldset style={{ margin: "1rem 0", border: "1px solid #eee", padding: "1rem" }}>
            <legend><strong>SMTP Config</strong></legend>
            <label>
              SMTP Host:
              <input name="host" type="text" value={smtpConfig.host} onChange={handleSmtpChange} required />
            </label>
            <label>
              Port:
              <input name="port" type="number" value={smtpConfig.port} onChange={handleSmtpChange} required />
            </label>
            <label>
              Username:
              <input name="user" type="text" value={smtpConfig.user} onChange={handleSmtpChange} required />
            </label>
            <label>
              Password:
              <input name="pass" type="password" value={smtpConfig.pass} onChange={handleSmtpChange} required />
            </label>
          </fieldset>
        )}
      </div>
      <button type="submit" disabled={isGenerating}>
        {isGenerating ? "Generating..." : "Generate Certificates"}
      </button>
      {previewImages.length > 0 && <CertificatePreview previews={previewImages} />}
      {downloadLink && (
        <div style={{ marginTop: 20 }}>
          <a href={downloadLink} download="certificates.zip">
            Download Certificates ZIP
          </a>
        </div>
      )}
    </form>
  );
}