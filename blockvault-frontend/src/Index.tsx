import React from 'react';
import VaultUpload from './modules/phase1/VaultUpload';

export default function Index() {
  return (
    <div style={{ maxWidth: 640, margin: '2rem auto', padding: '2rem' }}>
      <h1>BlockVault Minimal</h1>
      <p>Phase 1 upload demo (UI dependencies trimmed for typecheck green).</p>
      <VaultUpload />
    </div>
  );
}
