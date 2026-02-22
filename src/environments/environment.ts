export const environment = {
  
    firebase: {
    apiKey: process.env['apiKey'] || "",
    authDomain: process.env['authDomain'] || "",
    projectId: process.env['projectId'] || "",
    storageBucket: process.env['storageBucket'] || "",
    messagingSenderId: process.env['messagingSenderId'] || "",
    appId: process.env['appId'] || ""
  },
  supabase: {
    surl: process.env['surl'] || "",
    key: process.env['key'] || ""
  }
};
