import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../api/base';
import { useToastStore } from '../state/toastHost';
import { useAuthStore } from '../state/auth';
import { Button } from '../components/ui/Button';
import { FileCard, BVFileItem } from '../components/ui/FileCard';
import { Modal } from '../components/ui/Modal';
import { Icon } from '../components/icons';
import { Input } from '../components/ui/Input';
import { useNetworkStore } from '../state/network';

const API_BASE = import.meta.env.VITE_API_BASE || '';// kept for compatibility but dynamic apiUrl used

interface FileItem extends BVFileItem {}

export const FilesSection: React.FC = () => {
  const { jwt } = useAuthStore();
  const toast = useToastStore();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [folderFilter, setFolderFilter] = useState('');
  const [passModal, setPassModal] = useState<{ open: boolean; file?: FileItem }>(() => ({ open: false }));
  const [downloadPass, setDownloadPass] = useState('');
  const [shareModal, setShareModal] = useState<{ open: boolean; file?: FileItem }>(() => ({ open: false }));
  const [shareRecipient, setShareRecipient] = useState('');
  const [sharePassphrase, setSharePassphrase] = useState('');
  const [shareNote, setShareNote] = useState('');
  const [shareExpiry, setShareExpiry] = useState('');
  const [shareSubmitting, setShareSubmitting] = useState(false);
  const [previewModal, setPreviewModal] = useState<{ open: boolean; file?: FileItem; content?: string; mime?: string; loading?: boolean }>(() => ({ open:false }));
  // On-chain access control removed – related state deleted.

  const removeFile = (fid: string) => setFiles(prev => prev.filter(f => f.file_id !== fid));

  const incNet = useNetworkStore(s => s.inc);
  const decNet = useNetworkStore(s => s.dec);

  let loadingPromise: Promise<void> | null = null;
  const load = async () => {
    if (!jwt) return;
    if (loadingPromise) return loadingPromise; // prevent overlapping
    setLoading(true);
    incNet();
    const run = (async () => {
      try {
        const params: string[] = ['limit=100'];
        if (search.trim()) params.push('q=' + encodeURIComponent(search.trim()));
        if (folderFilter.trim()) params.push('folder=' + encodeURIComponent(folderFilter.trim()));
        const resp = await axios.get(apiUrl('/files?' + params.join('&')), { headers: { Authorization: `Bearer ${jwt}` } });
        setFiles(resp.data.items);
        setError(null);
      } catch (e: any) {
        // Do not toast here; global interceptor + suppression handles network errors.
        setError(e.response?.data?.error || e.message);
      } finally {
        setLoading(false);
        decNet();
        loadingPromise = null;
      }
    })();
    loadingPromise = run;
    return run;
  };

  useEffect(() => { load(); }, [jwt]);
  // Profile load (access control removed)
  // AccessManager logic removed.
  // Debounced search reload
  useEffect(() => {
    const t = setTimeout(() => { if(jwt) load(); }, 350);
    return () => clearTimeout(t);
  }, [search, folderFilter]);
  useEffect(() => {
    const h = () => load();
    window.addEventListener('blockvault_upload_done', h);
    return () => window.removeEventListener('blockvault_upload_done', h);
  }, [jwt]);

  if (!jwt) return null;

  const doDownload = async (f: FileItem, pass: string) => {
    try {
      const url = apiUrl(`/files/${f.file_id}?key=${encodeURIComponent(pass)}`);
  incNet();
  const r = await fetch(url, { headers: { Authorization: `Bearer ${jwt}` }}).finally(decNet);
      if(!r.ok){
        try {
          const j = await r.json();
          if(r.status === 400) {
            toast.push({type:'error', msg: j.error || 'Bad passphrase'});
          } else if (r.status === 404) {
            toast.push({type:'error', msg: 'File not found (stale entry?)'});
            removeFile(f.file_id);
          } else if (r.status === 410) {
            toast.push({type:'error', msg: 'Encrypted blob missing'});
          } else {
            toast.push({type:'error', msg: j.error || `Download failed (${r.status})`});
          }
        } catch {
          toast.push({type:'error', msg:`Download failed (${r.status})`});
        }
        return;
      }
      const blob = await r.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = f.name;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.push({ type:'success', msg:'Downloaded' });
    } catch(e:any){ toast.push({type:'error', msg:'Download error'}); }
  };

  const doPreview = async (f: FileItem, pass: string) => {
    setPreviewModal(p => ({ ...p, loading: true, content: undefined }));
    try {
      const url = apiUrl(`/files/${f.file_id}?key=${encodeURIComponent(pass)}&inline=1`);
      incNet();
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${jwt}` }});
      if(!resp.ok){
        toast.push({type:'error', msg:'Preview failed'});
        return;
      }
      // Attempt to read as text first; if binary large, truncate
      const blob = await resp.blob();
      const size = blob.size;
      if(size > 2_000_000){ // 2MB safety
        toast.push({type:'info', msg:'File too large for inline preview'});
        return;
      }
      const text = await blob.text();
      let snippet = text;
      if(text.length > 10000) snippet = text.slice(0, 10000) + '\n... (truncated)';
      setPreviewModal(p => ({ ...p, content: snippet, mime: blob.type || 'text/plain', loading: false }));
    } catch (e:any){
      toast.push({type:'error', msg:'Preview error'});
    } finally {
      decNet();
    }
  };

  const openPreview = (file: FileItem) => {
    setDownloadPass('');
    setPreviewModal({ open: true, file, content: undefined, loading: false });
  };

  const submitPreview = async () => {
    if(!previewModal.file) return;
    const pass = downloadPass.trim();
    if(!pass){ toast.push({type:'error', msg:'Passphrase required'}); return; }
    setPreviewModal(p => ({ ...p, loading: true }));
    await doPreview(previewModal.file, pass);
  };

  const handleDownload = (f: FileItem) => {
    setDownloadPass('');
    setPassModal({ open: true, file: f });
  };

  const submitDownload = async () => {
    if(!passModal.file) return;
    const pass = downloadPass.trim();
    if(!pass){ toast.push({type:'error', msg:'Passphrase required'}); return; }
    await doDownload(passModal.file, pass);
    setPassModal({ open:false });
  };

  const openShareModal = (file: FileItem) => {
    setShareRecipient('');
    setSharePassphrase('');
    setShareNote('');
    setShareExpiry('');
    setShareModal({ open: true, file });
  };

  // Access control modal removed.

  // Legacy access list removed (no event index yet)

  // claimOwnership / grantViewer / revokeViewer removed.

  // revokeAccess deprecated in new AccessManager flow (using revokeViewer)

  const submitShare = async () => {
    if (!shareModal.file) return;
    const recipient = shareRecipient.trim();
    const passphrase = sharePassphrase.trim();
    if (!recipient) {
      toast.push({ type: 'error', msg: 'Recipient address required' });
      return;
    }
    if (!passphrase) {
      toast.push({ type: 'error', msg: 'Passphrase required' });
      return;
    }
    const payload: Record<string, any> = {
      recipient,
      passphrase,
    };
    const note = shareNote.trim();
    if (note) payload.note = note;
    if (shareExpiry) {
      const ms = Date.parse(shareExpiry);
      if (Number.isNaN(ms)) {
        toast.push({ type: 'error', msg: 'Invalid expiration date' });
        return;
      }
      payload.expires_at = ms;
    }
    try {
      setShareSubmitting(true);
  incNet();
      await axios.post(apiUrl(`/files/${shareModal.file.file_id}/share`), payload, { headers: { Authorization: `Bearer ${jwt}` }});
      toast.push({ type: 'success', msg: `Shared ${shareModal.file.name}` });
      window.dispatchEvent(new CustomEvent('blockvault_share_changed'));
      setShareModal({ open: false });
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Share failed';
      toast.push({ type: 'error', msg });
    } finally {
  decNet();
      setShareSubmitting(false);
    }
  };

  const handleDelete = async (f: FileItem) => {
    if(!confirm('Delete this file?')) return;
    try {
  incNet();
  await axios.delete(apiUrl(`/files/${f.file_id}`), { headers: { Authorization: `Bearer ${jwt}` }}).finally(decNet);
      toast.push({ type:'success', msg:'Deleted' });
      load();
    } catch(e:any){ toast.push({type:'error', msg:'Delete failed'}); }
  };

  const handleVerify = async (f: FileItem) => {
    try {
  incNet();
  const vr = await axios.get(apiUrl(`/files/${f.file_id}/verify`), { headers: { Authorization: `Bearer ${jwt}` }}).finally(decNet);
      toast.push({ type:'info', msg: vr.data.has_encrypted_blob ? 'Blob present' : 'Blob missing' });
    } catch(e:any){
      const status = e?.response?.status;
      if(status === 404){
        toast.push({type:'error', msg:'File not found (removed or server restarted)'});
        removeFile(f.file_id);
      } else {
        toast.push({type:'error', msg:'Verify failed'});
      }
    }
  };

  const skeletons = Array.from({ length: 5 }).map((_,i) => (
    <div key={i} className="p-4 rounded-xl border border-border/30 bg-background-tertiary/20 animate-pulse flex flex-col gap-3">
      <div className="h-3 w-1/2 bg-background-tertiary/60 rounded" />
      <div className="h-2 w-1/3 bg-background-tertiary/50 rounded" />
      <div className="h-2 w-5/6 bg-background-tertiary/40 rounded" />
    </div>
  ));

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">Your Files</h2>
          <Button size="sm" variant="secondary" onClick={load} disabled={loading}>Refresh</Button>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name..." label="Search" />
          <Input value={folderFilter} onChange={e=>setFolderFilter(e.target.value)} placeholder="Folder filter" label="Folder" />
          <div className="flex items-end gap-2">
            <Button size="sm" variant="outline" onClick={()=>{ setSearch(''); setFolderFilter(''); load(); }}>Clear</Button>
          </div>
        </div>
      </div>
      {error && <div className="text-xs text-accent-red">{error}</div>}
      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
        {loading && skeletons}
        {!loading && files.map(f => (
          <FileCard
            key={f.file_id}
            f={f}
            onDownload={() => handleDownload(f)}
            onDelete={() => handleDelete(f)}
            onVerify={() => handleVerify(f)}
            onShare={() => openShareModal(f)}
              onPreview={() => openPreview(f)}
            onCopyCid={() => { if(f.cid) { navigator.clipboard.writeText(f.cid); toast.push({type:'success', msg:'CID copied'});} }}
            // Access control removed
            onCopyHash={() => { navigator.clipboard.writeText(f.sha256); toast.push({type:'success', msg:'Hash copied'});} }
          />
        ))}
        {!loading && !files.length && (
          <div className="flex flex-col items-center justify-center text-center py-16 gap-4 border border-dashed border-border/50 rounded-2xl bg-background-tertiary/20">
            <div className="w-16 h-16 rounded-2xl bg-background-tertiary/40 flex items-center justify-center"><Icon name="folder" size={36} className="text-accent-blue" /></div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-text-primary">Your encrypted files will appear here</div>
              <div className="text-[11px] text-text-secondary/60">Upload a file to begin</div>
            </div>
          </div>
        )}
      </div>
      <Modal
        open={passModal.open}
        onClose={() => setPassModal({ open:false })}
        title="Enter Passphrase"
        footer={<>
          <Button size="sm" variant="secondary" onClick={()=>setPassModal({open:false})}>Cancel</Button>
          <Button size="sm" variant="primary" onClick={submitDownload}>Download</Button>
        </>}
      >
        <div className="space-y-3">
          <p className="text-[11px] leading-relaxed">Provide the passphrase used during encryption to decrypt and download <span className="font-medium text-text-primary">{passModal.file?.name}</span>.</p>
          <Input data-autofocus label="Passphrase" value={downloadPass} onChange={e=>setDownloadPass(e.target.value)} placeholder="decryption key" revealToggle />
        </div>
      </Modal>
      <Modal
        open={shareModal.open}
        onClose={() => !shareSubmitting && setShareModal({ open:false })}
        title={`Share ${shareModal.file?.name ?? ''}`.trim()}
        footer={<>
          <Button size="sm" variant="secondary" onClick={() => setShareModal({ open:false })} disabled={shareSubmitting}>Cancel</Button>
          <Button size="sm" variant="primary" onClick={submitShare} loading={shareSubmitting} disabled={shareSubmitting}>Send Share</Button>
        </>}
      >
        <div className="space-y-3">
          <Input label="Recipient address" value={shareRecipient} onChange={e => setShareRecipient(e.target.value)} placeholder="0x..." mono />
          <Input label="Passphrase" value={sharePassphrase} onChange={e => setSharePassphrase(e.target.value)} placeholder="same key you will send out-of-band" revealToggle />
          <label className="flex flex-col gap-1 text-xs text-text-secondary">
            <span className="text-text-secondary/80 font-medium tracking-tight">Note (optional)</span>
            <textarea
              value={shareNote}
              onChange={e => setShareNote(e.target.value)}
              rows={3}
              maxLength={280}
              className="w-full resize-none px-3 py-2 rounded-md bg-background-tertiary/70 border border-border/60 focus:border-accent-blue/80 focus:ring-2 focus:ring-accent-blue/40 outline-none transition text-text-primary placeholder:text-text-secondary/40"
              placeholder="Hint for the recipient"
            />
            <span className="text-[10px] text-text-secondary/50">{shareNote.length}/280</span>
          </label>
          <Input
            label="Expires at (optional)"
            type="datetime-local"
            value={shareExpiry}
            onChange={e => setShareExpiry(e.target.value)}
          />
          <p className="text-[11px] leading-relaxed text-text-secondary/70 flex items-center gap-2">
            <Icon name="info" size={14} className="text-accent-blue" />
            Recipient must register their RSA public key and decrypt the passphrase with their wallet keypair.
          </p>
        </div>
      </Modal>
      <Modal
        open={previewModal.open}
        onClose={() => setPreviewModal({ open:false })}
        title={`Preview ${previewModal.file?.name || ''}`.trim()}
        footer={<>
          <Button size="sm" variant="secondary" onClick={()=>setPreviewModal({ open:false })}>Close</Button>
          {!previewModal.content && <Button size="sm" variant="primary" onClick={submitPreview} loading={previewModal.loading}>Load Preview</Button>}
        </>}
      >
        <div className="space-y-3">
          {!previewModal.content && (
            <>
              <p className="text-[11px] leading-relaxed">Enter the passphrase to decrypt a small inline preview (text / UTF-8 assumed, max 10KB shown).</p>
              <Input data-autofocus label="Passphrase" value={downloadPass} onChange={e=>setDownloadPass(e.target.value)} placeholder="decryption key" revealToggle />
            </>
          )}
          {previewModal.content && (
            <div className="max-h-72 overflow-auto rounded-md border border-border/40 bg-background-tertiary/40 p-2 font-mono text-[11px] whitespace-pre-wrap break-all">
              {previewModal.content}
            </div>
          )}
        </div>
      </Modal>
      {/* Access control modal removed */}
    </section>
  );
};
