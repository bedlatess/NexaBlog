/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_SUPABASE_URL?: string;
  readonly PUBLIC_SUPABASE_ANON_KEY?: string;
  readonly PUBLIC_ADMIN_EMAIL?: string;
  readonly PUBLIC_PLAUSIBLE_DOMAIN?: string;
  readonly PUBLIC_GISCUS_REPO?: string;
  readonly PUBLIC_GISCUS_REPO_ID?: string;
  readonly PUBLIC_GISCUS_CATEGORY?: string;
  readonly PUBLIC_GISCUS_CATEGORY_ID?: string;
  readonly PUBLIC_GISCUS_MAPPING?: string;
  readonly PUBLIC_GISCUS_REACTIONS?: string;
  readonly PUBLIC_GISCUS_METADATA?: string;
  readonly PUBLIC_GISCUS_INPUT_POSITION?: string;
  readonly PUBLIC_GISCUS_LANG?: string;
  readonly PUBLIC_DONATE_WECHAT_LABEL?: string;
  readonly PUBLIC_DONATE_WECHAT_URL?: string;
  readonly PUBLIC_DONATE_ALIPAY_LABEL?: string;
  readonly PUBLIC_DONATE_ALIPAY_URL?: string;
  readonly PUBLIC_DONATE_PAYPAL_LABEL?: string;
  readonly PUBLIC_DONATE_PAYPAL_URL?: string;
  readonly PUBLIC_DONATE_AFDIAN_LABEL?: string;
  readonly PUBLIC_DONATE_AFDIAN_URL?: string;
  readonly PUBLIC_DONATE_CRYPTO_LABEL?: string;
  readonly PUBLIC_DONATE_CRYPTO_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
