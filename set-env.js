const fs = require('fs');
const writeFile = fs.writeFile;
const targetPath = './src/environments/environment.ts';
// Load variables from Netlify's build environment
const envVars = {
  production: true,
  apiKey: process.env.NG_APP_API_KEY,
  authDomain: process.env.NG_APP_AUTH_DOMAIN,
  projectId: process.env.NG_APP_PROJECT_ID,
  storageBucket: process.env.NG_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.NG_APP_MESSAGING_SENDER_ID,
  appId: process.env.NG_APP_APP_ID,
  surl: process.env.NG_APP_SUPABASE_URL,
  key: process.env.NG_APP_SUPABASE_KEY
};
// Ensure all client-side variables are prefixed with NG_APP_ if using newer Angular versions.

const envFileContent = `
export const environment = ${JSON.stringify({
  production: envVars.production,
  firebase: {
    apiKey: envVars.apiKey,
    authDomain: envVars.authDomain,
    projectId: envVars.projectId,
    storageBucket: envVars.storageBucket,
    messagingSenderId: envVars.messagingSenderId,
    appId: envVars.appId
  },
  supabase: {
    surl: envVars.surl,
    key: envVars.key
  }
}, null, 2)};
`;

// write the file
writeFile(targetPath, envFileContent, (err) => {
  if (err) {
    console.error(err);
    throw err;
  }
  console.log(`Environment file successfully generated at ${targetPath}`);
});
