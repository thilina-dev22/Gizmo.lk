/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_CARD_PAYMENT?: string;
  readonly VITE_WEB3FORMS_ACCESS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
