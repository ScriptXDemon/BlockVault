import React from 'react';
import VaultUpload from '../modules/phase1/VaultUpload';
import { WalletSection } from '../modules/WalletSection';

  return (
    <div style={{ display: 'flex', maxWidth: 900, margin: '2rem auto', gap: '2rem' }}>
      <aside style={{ flex: '0 0 280px', border: '1px solid #ccc', borderRadius: 8, padding: '2rem', background: '#232347' }}>
        <WalletSection />
      </aside>
      <main style={{ flex: 1, border: '1px solid #ccc', borderRadius: 8, padding: '2rem' }}>
        <h1>BlockVault Phase 1 – Decentralized Storage</h1>
        <VaultUpload />
      </main>
    </div>
  );
