/* 부점 AI 대화창에서 "엑셀로 내려받고 싶어" 류의 요청을 받으면 현재 보이는 고객 목록을 .xlsx 로 만든다.
 * 외부 라이브러리 없이 동작한다: xlsx 는 XML 몇 개를 ZIP(무압축, store)으로 묶은 파일이므로
 * 여기서 직접 조립한다. Agent 는 호출하지 않는다(프론트 단독). Node 검증(check.js)에서도 같은 코드로 바이트를 만든다. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PensionExport=factory();})(typeof window==='undefined'?globalThis:window,function(){
'use strict';
// ----- 요청 판별 -----
// 대화 문장에 내려받기 의도가 있으면 Agent 로 보내지 않고 프론트가 바로 파일을 만든다.
// "추출" 단독은 검색 의도("현금성 장기대기 고객 추출해줘")와 겹치므로 엑셀/파일 단어와 함께 있을 때만 잡는다.
function isExportRequest(text){
 const n=String(text||'').replace(/\s+/g,'').toLowerCase();
 if(!n)return false;
 return /엑셀|excel|xlsx|csv|다운로드|다운받|내려받|파일로|명세/.test(n);
}
// ----- 열 정의 -----
// t: 'n' 정수, 'money' 천단위 정수, 'pct' 소수 1자리. 없으면 문자열.
const COLUMNS=[
 {h:'순번',w:6,t:'n'},
 {h:'고객명',w:10},
 {h:'고객번호',w:14},
 {h:'나이',w:6,t:'n'},
 {h:'성별',w:6},
 {h:'스타클럽 등급',w:13},
 {h:'투자성향',w:12},
 {h:'수신평잔(원)',w:16,t:'money'},
 {h:'IRP 잔액(원)',w:16,t:'money'},
 {h:'1년 수익률(%)',w:13,t:'pct'},
 {h:'세액공제 잔여한도(원)',w:20,t:'money'},
 {h:'디폴트옵션',w:24},
 {h:'관리신호',w:44},
 {h:'원리금보장 비중(%)',w:17,t:'pct'}
];
const num=x=>typeof x==='number'&&Number.isFinite(x)?x:null;
const text=x=>x==null?'':String(x);
// 수신평잔은 원천 데이터에 없어 시연용으로 IRP 잔액의 6~9배를 만든다.
// 고객 ID 해시로 배수를 정하므로 같은 고객은 몇 번 내려받아도 같은 값이 나온다. 만원 단위로 반올림.
function depositBalance(id,irp){
 if(num(irp)==null)return null;
 let h=0;const s=String(id||'');for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;
 const factor=6+(h%31)/10; // 6.0 ~ 9.0
 return Math.round(irp*factor/10000)*10000;
}
function protectedPct(record){
 const list=(record.irpAccount&&record.irpAccount.assetAllocation)||[];
 const a=list.find(x=>x&&x.assetType==='원리금보장형');
 return a?num(a.weightPct):null;
}
// 고객번호는 화면(브리핑 헤더·검색 결과)과 같은 5자리-5자리 표시형으로 쓴다. 원본이 더 길면(C01 6-7자리) 앞 5자리만.
function displayId(value){
 const m=/^(\d+)-(\d+)$/.exec(String(value==null?'':value));
 return m?m[1].slice(0,5)+'-'+m[2].slice(0,5):String(value==null?'':value);
}
function defaultOption(record){
 const d=(record.customer&&record.customer.defaultOption)||{};
 const status=d.registrationStatus||'확인 필요';
 const name=d.designatedProduct&&d.designatedProduct.productName;
 return name?status+' · '+name:status;
}
// items: [{record, profile}] — record 는 부점 AI 검색용 고객 레코드, profile 은 화면 프로필(레거시 행의 성별·고객번호 보완용)
function customerRows(items){
 return items.map((it,i)=>{
  const r=it.record||{},c=r.customer||{},a=r.irpAccount||{},p=it.profile||{};
  const id=(r.briefingMeta&&r.briefingMeta.caseId)||c.customerId||p.pin||String(i);
  const irp=num(a.valuationAmountKrw);
  return [i+1,text(c.name),displayId(c.customerId||p.pin),num(c.age)==null?num(p.age):c.age,text(c.gender||p.sex),text(c.starClubGrade||p.club),text(c.investmentProfile),
   depositBalance(id,irp),irp,num(a.oneYearReturnPct),num(a.taxDeductionRemainingKrw),defaultOption(r),
   (r.signals||[]).map(s=>s&&s.label).filter(Boolean).join(', '),protectedPct(r)];
 });
}
function pad2(n){return String(n).padStart(2,'0');}
function stamp(d){return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate())+' '+pad2(d.getHours())+':'+pad2(d.getMinutes());}
function fileStamp(d){return ''+d.getFullYear()+pad2(d.getMonth()+1)+pad2(d.getDate())+'_'+pad2(d.getHours())+pad2(d.getMinutes());}
// ----- XML / 시트 -----
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const colName=i=>{let s='';i+=1;while(i>0){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=(i-m-1)/26;}return s;};
// 스타일 인덱스(styles.xml 의 cellXfs 순서): 0 기본, 1 머리글(굵게·회색 바탕), 2 #,##0, 3 0.0
const STYLE={header:1,money:2,pct:3};
function cell(ref,v,style){
 if(v==null||v==='')return '';
 const s=style?' s="'+style+'"':'';
 if(typeof v==='number')return '<c r="'+ref+'"'+s+'><v>'+v+'</v></c>';
 return '<c r="'+ref+'"'+s+' t="inlineStr"><is><t xml:space="preserve">'+esc(v)+'</t></is></c>';
}
function sheetXml(columns,rows,freeze){
 let out='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">';
 out+='<sheetViews><sheetView workbookViewId="0"'+(freeze?'':' tabSelected="0"')+'>'+(freeze?'<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>':'')+'</sheetView></sheetViews>';
 out+='<cols>'+columns.map((c,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+c.w+'" customWidth="1"/>').join('')+'</cols><sheetData>';
 out+='<row r="1">'+columns.map((c,i)=>cell(colName(i)+'1',c.h,STYLE.header)).join('')+'</row>';
 rows.forEach((row,ri)=>{
  const r=ri+2;
  out+='<row r="'+r+'">'+row.map((v,ci)=>{const t=columns[ci]&&columns[ci].t;return cell(colName(ci)+r,v,t==='money'?STYLE.money:t==='pct'?STYLE.pct:0);}).join('')+'</row>';
 });
 return out+'</sheetData></worksheet>';
}
const STYLES='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
 '<numFmts count="1"><numFmt numFmtId="164" formatCode="0.0"/></numFmts>'+
 '<fonts count="2"><font><sz val="11"/><name val="맑은 고딕"/></font><font><b/><sz val="11"/><name val="맑은 고딕"/></font></fonts>'+
 '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF2F3F5"/><bgColor indexed="64"/></patternFill></fill></fills>'+
 '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'+
 '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+
 '<cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'+
 '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>'+
 '<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'+
 '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>'+
 '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
function workbookFiles(sheets){
 const files=[];
 files.push(['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((_,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>']);
 files.push(['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>']);
 files.push(['xl/workbook.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map((s,i)=>'<sheet name="'+esc(s.name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets></workbook>']);
 files.push(['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((_,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('')+'<Relationship Id="rId'+(sheets.length+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>']);
 files.push(['xl/styles.xml',STYLES]);
 sheets.forEach((s,i)=>files.push(['xl/worksheets/sheet'+(i+1)+'.xml',sheetXml(s.columns,s.rows,s.freeze)]));
 return files;
}
// ----- ZIP(store) -----
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(b){let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
// TextEncoder 가 없는 실행 환경(검증용 vm 컨텍스트)도 있어 순수 JS 인코더를 폴백으로 둔다.
function utf8(s){
 if(typeof TextEncoder!=='undefined')return new TextEncoder().encode(s);
 const out=[];for(let i=0;i<s.length;i++){
  let c=s.charCodeAt(i);
  if(c>=0xD800&&c<=0xDBFF&&i+1<s.length){const d=s.charCodeAt(i+1);if(d>=0xDC00&&d<=0xDFFF){c=0x10000+((c-0xD800)<<10)+(d-0xDC00);i++;}}
  if(c<0x80)out.push(c);else if(c<0x800)out.push(0xC0|(c>>6),0x80|(c&63));else if(c<0x10000)out.push(0xE0|(c>>12),0x80|((c>>6)&63),0x80|(c&63));else out.push(0xF0|(c>>18),0x80|((c>>12)&63),0x80|((c>>6)&63),0x80|(c&63));
 }
 return Uint8Array.from(out);
}
function dosTime(d){return {time:(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),date:((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate()};}
function zip(files,now){
 const parts=[],central=[];let offset=0;const {time,date}=dosTime(now);
 const u16=(v,b,o)=>{b[o]=v&255;b[o+1]=(v>>>8)&255;},u32=(v,b,o)=>{b[o]=v&255;b[o+1]=(v>>>8)&255;b[o+2]=(v>>>16)&255;b[o+3]=(v>>>24)&255;};
 for(const [name,content] of files){
  const n=utf8(name),data=utf8(content),crc=crc32(data);
  const local=new Uint8Array(30+n.length);
  u32(0x04034b50,local,0);u16(20,local,4);u16(0x0800,local,6);u16(0,local,8);u16(time,local,10);u16(date,local,12);u32(crc,local,14);u32(data.length,local,18);u32(data.length,local,22);u16(n.length,local,26);u16(0,local,28);local.set(n,30);
  parts.push(local,data);
  const c=new Uint8Array(46+n.length);
  u32(0x02014b50,c,0);u16(20,c,4);u16(20,c,6);u16(0x0800,c,8);u16(0,c,10);u16(time,c,12);u16(date,c,14);u32(crc,c,16);u32(data.length,c,20);u32(data.length,c,24);u16(n.length,c,28);u16(0,c,30);u16(0,c,32);u16(0,c,34);u16(0,c,36);u32(0,c,38);u32(offset,c,42);c.set(n,46);
  central.push(c);offset+=local.length+data.length;
 }
 const cdSize=central.reduce((s,c)=>s+c.length,0),end=new Uint8Array(22);
 u32(0x06054b50,end,0);u16(0,end,4);u16(0,end,6);u16(files.length,end,8);u16(files.length,end,10);u32(cdSize,end,12);u32(offset,end,16);u16(0,end,20);
 const all=parts.concat(central,[end]),out=new Uint8Array(all.reduce((s,p)=>s+p.length,0));let pos=0;for(const p of all){out.set(p,pos);pos+=p.length;}
 return out;
}
// ----- 조립 -----
// opts: {items:[{record,profile}], asOf:'YYYY-MM-DD', staff:'사번', condition:'적용 조건 문구', scope:'추출 범위 문구', now:Date}
function build(opts){
 const now=opts.now&&typeof opts.now.getFullYear==='function'?opts.now:new Date(); // instanceof 는 vm 컨텍스트 간에 실패
 const rows=customerRows(opts.items||[]);
 const meta=[['기준일',text(opts.asOf)||'확인 필요'],['추출 일시',stamp(now)],['추출 직원',text(opts.staff)||'—'],['적용 조건',text(opts.condition)||'전체 고객'],['고객 수',rows.length+'명'],['추출 범위',text(opts.scope)||'현재 메인 고객 목록']];
 const sheets=[{name:'고객 명단',columns:COLUMNS,rows,freeze:true},{name:'추출 조건',columns:[{h:'항목',w:14},{h:'값',w:60}],rows:meta,freeze:false}];
 return {fileName:'타겟고객_명단_'+fileStamp(now)+'.xlsx',bytes:zip(workbookFiles(sheets),now),count:rows.length,rows,columns:COLUMNS.map(c=>c.h)};
}
// 브라우저 다운로드. 크롬 기준 Blob + <a download>.
function download(result,doc){
 const d=doc||(typeof document!=='undefined'?document:null);
 if(!d||typeof Blob==='undefined'||typeof URL==='undefined'||!URL.createObjectURL)throw new Error('DOWNLOAD_UNSUPPORTED');
 const blob=new Blob([result.bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
 const url=URL.createObjectURL(blob),a=d.createElement('a');
 a.href=url;a.download=result.fileName;a.style.display='none';(d.body||d.documentElement).appendChild(a);a.click();
 setTimeout(()=>{a.remove();URL.revokeObjectURL(url);},1000);
 return result.fileName;
}
return {isExportRequest,build,download,customerRows,depositBalance,displayId,columns:COLUMNS.map(c=>c.h),zip,crc32};
});
