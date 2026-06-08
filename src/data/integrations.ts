const env = import.meta.env;

function configured(values: Array<string | undefined>) {
  return values.every((value) => Boolean(value && value.trim()));
}

const requiredGiscusFields = [
  ["PUBLIC_GISCUS_REPO", env.PUBLIC_GISCUS_REPO],
  ["PUBLIC_GISCUS_REPO_ID", env.PUBLIC_GISCUS_REPO_ID],
  ["PUBLIC_GISCUS_CATEGORY", env.PUBLIC_GISCUS_CATEGORY],
  ["PUBLIC_GISCUS_CATEGORY_ID", env.PUBLIC_GISCUS_CATEGORY_ID]
] as const;

const donationChannels = [
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
];

export const integrationStatus = {
  giscusMissing: requiredGiscusFields
    .filter(([, value]) => !value?.trim())
    .map(([key]) => key),
  donationConfigured: donationChannels
    .filter((method) => method.value || method.href)
    .map((method) => method.label),
  donationAvailable: donationChannels.map((method) => method.label)
};

export const integrationSetup = [
  {
    label: "Giscus 评论",
    status: integrationStatus.giscusMissing.length ? "待配置" : "已启用",
    summary: integrationStatus.giscusMissing.length
      ? "GitHub Discussions 评论会在文章页底部挂载。"
      : `当前仓库：${env.PUBLIC_GISCUS_REPO}`,
    required: requiredGiscusFields.map(([key]) => key),
    optional: [
      "PUBLIC_GISCUS_MAPPING",
      "PUBLIC_GISCUS_REACTIONS",
      "PUBLIC_GISCUS_METADATA",
      "PUBLIC_GISCUS_INPUT_POSITION",
      "PUBLIC_GISCUS_LANG"
    ],
    missing: integrationStatus.giscusMissing
  },
  {
    label: "Plausible 统计",
    status: env.PUBLIC_PLAUSIBLE_DOMAIN ? "已启用" : "待配置",
    summary: env.PUBLIC_PLAUSIBLE_DOMAIN
      ? `统计域名：${env.PUBLIC_PLAUSIBLE_DOMAIN}`
      : "只需要填写生产域名，脚本会自动插入到页面。",
    required: ["PUBLIC_PLAUSIBLE_DOMAIN"],
    optional: [],
    missing: env.PUBLIC_PLAUSIBLE_DOMAIN ? [] : ["PUBLIC_PLAUSIBLE_DOMAIN"]
  },
  {
    label: "打赏渠道",
    status: integrationStatus.donationConfigured.length ? "已配置" : "待配置",
    summary: integrationStatus.donationConfigured.length
      ? `已启用：${integrationStatus.donationConfigured.join("、")}`
      : "每个渠道填 label 或 URL 即会显示，未填写的渠道自动隐藏。",
    required: [],
    optional: [
      "PUBLIC_DONATE_WECHAT_LABEL / PUBLIC_DONATE_WECHAT_URL",
      "PUBLIC_DONATE_ALIPAY_LABEL / PUBLIC_DONATE_ALIPAY_URL",
      "PUBLIC_DONATE_PAYPAL_LABEL / PUBLIC_DONATE_PAYPAL_URL",
      "PUBLIC_DONATE_AFDIAN_LABEL / PUBLIC_DONATE_AFDIAN_URL",
      "PUBLIC_DONATE_CRYPTO_LABEL / PUBLIC_DONATE_CRYPTO_URL"
    ],
    missing: []
  }
];

export const integrations = {
  plausible: {
    enabled: Boolean(env.PUBLIC_PLAUSIBLE_DOMAIN),
    domain: env.PUBLIC_PLAUSIBLE_DOMAIN
  },
  giscus: {
    enabled: configured(requiredGiscusFields.map(([, value]) => value)),
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

export const donationMethods = donationChannels.filter((method) => method.value || method.href);
