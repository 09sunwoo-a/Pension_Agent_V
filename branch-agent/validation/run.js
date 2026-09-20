/* Local gate. Live calls are explicit via run_live.py, never automatic here. */
'use strict';
const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const python=process.env.BRANCH_PYTHON||(fs.existsSync(path.join(__dirname,'.venv/bin/python'))?path.join(__dirname,'.venv/bin/python'):'python3');
for(const name of ['check_data.js','check_contract.js','check_frontend.js']){
 const r=cp.spawnSync(process.execPath,[path.join(__dirname,name)],{cwd:root,stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);
}
for(const name of ['check_service.py','check_http.py']){
 const r=cp.spawnSync(python,['-B',path.join(__dirname,name)],{cwd:root,stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);
}
console.log('PASS: local stub/data/contract/frontend transport/real HTTP gates. Google live and internal E2E are separate.');
