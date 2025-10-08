/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
}

interface ImportMetaEnv {
  readonly VITE_VAULT_REGISTRY_ADDRESS: string;
  readonly VITE_IPFS_API_URL: string;
  readonly VITE_IPFS_API_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
