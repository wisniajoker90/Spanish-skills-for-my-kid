import {readFileSync} from 'node:fs';
const config=JSON.parse(readFileSync(new URL('./wrangler.jsonc',import.meta.url),'utf8'));
const db=config.d1_databases[0];
if(config.name!=='franka-family-sync'||db.database_name!=='franka-family-sync'||db.binding!=='DB')throw Error('Unexpected production resource names');
if(!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(db.database_id)||db.database_id==='6ff9f3f3-41ca-466b-84af-da96516013b3')throw Error('Set the NEW production D1 ID; TEST binding and placeholders are forbidden');
if(config.vars.SYNC_ENABLED!=='false')throw Error('Preparation must keep SYNC_ENABLED=false; activation is a separate release step');
console.log('Configuration ready for inactive backend provisioning. No deployment performed.');
