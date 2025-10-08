// IPFS upload helper
export async function uploadToIPFS(data: Uint8Array, filename: string, apiUrl: string, apiToken?: string): Promise<string> {
  const form = new FormData();
  form.append('file', new Blob([data]), filename);
  const headers: Record<string, string> = {};
  if (apiToken) {
    headers['Authorization'] = apiToken.includes(':') ? `Basic ${btoa(apiToken)}` : `Bearer ${apiToken}`;
  }
  const resp = await fetch(apiUrl.replace(/\/$/, '') + '/api/v0/add', {
    method: 'POST',
    body: form,
    headers,
  });
  if (!resp.ok) throw new Error('IPFS upload failed: ' + resp.status);
  const json = await resp.json();
  return json.Hash || json.Cid || json.cid;
}
