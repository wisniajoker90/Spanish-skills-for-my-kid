const {defineConfig,devices}=require('@playwright/test');
const path=require('node:path');
module.exports=defineConfig({testDir:path.resolve(__dirname,'../../tests'),workers:1,retries:0,use:{baseURL:'http://127.0.0.1:4174',trace:'retain-on-failure'},projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}],webServer:{command:'node serve.cjs',url:'http://127.0.0.1:4174',reuseExistingServer:false}});
