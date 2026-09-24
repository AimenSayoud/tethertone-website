// Single source of truth for everything the pages share.
export default {
  // Absolute URL of the deployed site, without a trailing slash.
  // Change this (and add a CNAME file) to move to a custom domain.
  siteUrl: 'https://aimensayoud.github.io/tethertone-website',
  name: 'Tethertone',
  tagline: "Your Mac's audio on your Android phone",
  repo: 'https://github.com/AimenSayoud/tethertone',
  repoSlug: 'AimenSayoud/tethertone',
  siteRepo: 'https://github.com/AimenSayoud/tethertone-website',
  // Fallback when the GitHub API cannot be reached; site.js updates it live.
  version: '0.2.0',
  releaseDate: '2026-09-24',
  themeColor: '#0b1120',
  // Search engine ownership verification. Paste the content value of the
  // <meta> tag each service gives you; empty values render nothing.
  verification: {
    google: '',   // Google Search Console → HTML tag → google-site-verification
    bing: '',     // Bing Webmaster Tools → HTML Meta Tag → msvalidate.01
  },
  // IndexNow (Bing, Yandex, Seznam, Naver): the key file is published at
  // /<key>.txt and CI submits every page after each deploy.
  indexNowKey: '561637f40f83ff5e6998b2b713a30ec2',
  locale: 'en_US',
};
