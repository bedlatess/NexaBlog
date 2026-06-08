const env = import.meta.env;

function configured(values: Array<string | undefined>) {
  return values.every((value) => Boolean(value && value.trim()));
}

export const integrations = {
  plausible: {
    enabled: Boolean(env.PUBLIC_PLAUSIBLE_DOMAIN),
    domain: env.PUBLIC_PLAUSIBLE_DOMAIN
  },
  giscus: {
    enabled: configured([
      env.PUBLIC_GISCUS_REPO,
      env.PUBLIC_GISCUS_REPO_ID,
      env.PUBLIC_GISCUS_CATEGORY,
      env.PUBLIC_GISCUS_CATEGORY_ID
    ]),
    repo: env.PUBLIC_GISCUS_REPO,
    repoId: env.PUBLIC_GISCUS_REPO_ID,
    category: env.PUBLIC_GISCUS_CATEGORY,
    categoryId: env.PUBLIC_GISCUS_CATEGORY_ID,
    mapping: env.PUBLIC_GISCUS_MAPPING ?? "pathname",
    reactionsEnabled: env.PUBLIC_GISCUS_REACTIONS ?? "1",
    emitMetadata: env.PUBLIC_GISCUS_METADATA ?? "0",
    inputPosition: env.PUBLIC_GISCUS_INPUT_POSITION ?? "bottom",
    lang: env.PUBLIC_GISCUS_LANG ?? "zh-CN"
  },
  supabase: {
    enabled: configured([
      env.PUBLIC_SUPABASE_URL,
      env.PUBLIC_SUPABASE_ANON_KEY
    ]),
    url: env.PUBLIC_SUPABASE_URL
  }
};

export const donationMethods = [
  {
    key: "wechat",
    label: "微信",
    value: env.PUBLIC_DONATE_WECHAT_LABEL,
    href: env.PUBLIC_DONATE_WECHAT_URL
  },
  {
    key: "alipay",
    label: "支付宝",
    value: env.PUBLIC_DONATE_ALIPAY_LABEL,
    href: env.PUBLIC_DONATE_ALIPAY_URL
  },
  {
    key: "paypal",
    label: "PayPal",
    value: env.PUBLIC_DONATE_PAYPAL_LABEL,
    href: env.PUBLIC_DONATE_PAYPAL_URL
  },
  {
    key: "afdian",
    label: "爱发电",
    value: env.PUBLIC_DONATE_AFDIAN_LABEL,
    href: env.PUBLIC_DONATE_AFDIAN_URL
  },
  {
    key: "crypto",
    label: "Crypto",
    value: env.PUBLIC_DONATE_CRYPTO_LABEL,
    href: env.PUBLIC_DONATE_CRYPTO_URL
  }
].filter((method) => method.value || method.href);

