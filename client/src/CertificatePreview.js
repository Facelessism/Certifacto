import React from 'react';

export default function CertificatePreview({ previews }) {
  return (
    <div className="preview-list" aria-label="Certificate Previews">
      <h3>Preview Certificates</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {previews.map((url, i) => (
          <img key={i} src={url} alt={`Preview ${i + 1}`} style={{ maxWidth: 200, border: '1px solid #ccc' }} />
        ))}
      </div>
    </div>
  );
}