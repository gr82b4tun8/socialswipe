// babel.config.js (Updated)
module.exports = function(api) {
  api.cache(true);
  return {
      presets: ['babel-preset-expo'],
      plugins: [
          // Plugin to load .env variables into process.env during build time
          // IMPORTANT: Only use this for variables needed at runtime during LOCAL DEV.
          // For production builds via EAS, use EAS Secrets.
          ['inline-dotenv', {
              // Optional: Specify path if your .env is not in the root
              // path: '.env'
          }],
          // Your module-resolver for path aliases
          [
              'module-resolver',
              {
                  root: ['./'],
                  alias: {
                      '@': './src',
                  },
                  extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.json', '.ts', '.tsx'],
              },
          ],
          // **** ADDED: Reanimated plugin MUST be last ****
          'react-native-reanimated/plugin',
      ],
  };
};