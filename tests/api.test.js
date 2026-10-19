import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/data.js';
const data={repertoires:[],songs:[],events:[],movements:[],members:[],goals:[],equipment:[]};
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v},status(code){this.code=code;return this},json(body){this.body=body;return this}});
const env=()=>{process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SECRET_KEY='sb_secret_test';process.env.EUROPA_ACCESS_TOKEN='x'.repeat(40);delete process.env.EUROPA_PRIVATE};
test('Acceso abierto: el link directo lee y guarda sin clave',async()=>{
 env();const original=globalThis.fetch;
 try{
  globalThis.fetch=async()=>({ok:true,json:async()=>[{revision:3,data}]});
  let res=response();await handler({method:'GET',headers:{},query:{}},res);assert.equal(res.code,200);assert.equal(res.body.revision,3);
  globalThis.fetch=async()=>({ok:true,json:async()=>[{revision:4,data}]});
  res=response();await handler({method:'PUT',headers:{},body:{revision:3,data},query:{}},res);assert.equal(res.code,200);assert.equal(res.body.revision,4);
  globalThis.fetch=async()=>({ok:true,json:async()=>[]});
  res=response();await handler({method:'PUT',headers:{},body:{revision:2,data},query:{}},res);assert.equal(res.code,409);
  delete process.env.SUPABASE_URL;
  res=response();await handler({method:'GET',headers:{},query:{}},res);assert.equal(res.code,503);
 }finally{globalThis.fetch=original}
});
test('Acceso privado opcional (EUROPA_PRIVATE=true) y revisiones',async()=>{
 env();process.env.EUROPA_PRIVATE='true';
 let calls=0;const original=globalThis.fetch;
 globalThis.fetch=async()=>{calls++;return {ok:true,json:async()=>[]}};
 try{
  let res=response();await handler({method:'GET',headers:{},query:{}},res);assert.equal(res.code,401);assert.equal(calls,0);
  res=response();await handler({method:'PUT',headers:{authorization:'Bearer '+process.env.EUROPA_ACCESS_TOKEN},body:{revision:0,data},query:{}},res);assert.equal(res.code,409);
  globalThis.fetch=async()=>({ok:true,json:async()=>[{revision:1,data}]});
  res=response();await handler({method:'PUT',headers:{authorization:'Bearer '+process.env.EUROPA_ACCESS_TOKEN},body:{revision:0,data},query:{}},res);assert.equal(res.code,200);assert.equal(res.body.revision,1);
 }finally{globalThis.fetch=original;delete process.env.EUROPA_PRIVATE}
});
