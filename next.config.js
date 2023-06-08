module.exports = {
  /*experimental: {
    outputStandalone: true
  },*/
  output: 'standalone',
  reactStrictMode: true,
  i18n: {
    // These are all the locales you want to support in
    // your application
    locales: ['default', 'en-CA', 'fr-CA'],
    // This is the default locale you want to be used when visiting
    // a non-locale prefixed path e.g. `/hello`
    defaultLocale: 'default',
    localeDetection: false,
  },
  trailingSlash: true,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      config.experiments.topLevelAwait = true;

      // Important: return the modified config
      return config
  }
}
