let selectedPart="1파트",currentRows=[],edited=new Set();
const el=id=>document.getElementById(id);
function localToday(){let d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(s){el("toast").textContent=s;el("toast").style.display="block";setTimeout(()=>el("toast").style.display="none",4000)}
for(let i=1;i<=8;i++){let b=document.createElement("button");b.textContent=i+"파트";b.className=i===1?"active":"";b.onclick=()=>{if(edited.size&&!confirm("저장하지 않은 내용이 있습니다. 이동할까요?"))return;selectedPart=b.textContent;document.querySelectorAll("nav button").forEach(x=>x.classList.toggle("active",x===b));load()};el("parts").append(b)}
el("date").value=localToday();
async function load(){
 if(edited.size&&!confirm("저장하지 않은 수정값을 버리고 다시 조회할까요?"))return;
 const date=el("date").value;el("part").textContent=selectedPart;el("day").textContent=date;el("rows").innerHTML='<tr><td colspan="10">조회 중...</td></tr>';
 try{
   let u=new URL(API_URL);u.searchParams.set("part",selectedPart);u.searchParams.set("date",date);
   const r=await fetch(u);const j=await r.json();if(j.ok===false)throw Error(j.error||"조회 실패");
   currentRows=j.rows||[];edited.clear();el("count").textContent=currentRows.length;el("connection").textContent="연결됨";render();
 }catch(e){el("connection").textContent="오류";el("rows").innerHTML='<tr><td colspan="10">'+escapeHtml(e.message)+'</td></tr>';toast("조회 오류: "+e.message)}
}
function render(){
 const q=el("search").value.toLowerCase().trim();
 const filtered=currentRows.filter(x=>x.store.toLowerCase().includes(q));
 el("rows").innerHTML=filtered.map((r,i)=>`<tr data-store="${escapeHtml(r.store)}" class="${edited.has(r.store)?"changed":""}"><td>${escapeHtml(r.store)}</td><td>${escapeHtml(r.weekday)}</td><td>${escapeHtml(r.weekend)}</td><td class="usage-avg">${escapeHtml(r.weekdayUsageAvg??"-")}</td><td class="usage-avg">${escapeHtml(r.weekendUsageAvg??"-")}</td><td>${escapeHtml(r.prev)}</td><td><input class="incoming" type="number" min="0" step="any" value="${escapeHtml(r.incoming)}"></td><td><input class="usage" type="number" min="0" step="any" value="${escapeHtml(r.usage)}"></td><td class="remain">${escapeHtml(r.remain)}</td><td><button class="save">저장</button></td></tr>`).join("")||'<tr><td colspan="10">매장이 없습니다.</td></tr>';
 document.querySelectorAll("tr[data-store]").forEach(tr=>{
   let r=currentRows.find(x=>x.store===tr.dataset.store);
   for(const inp of tr.querySelectorAll("input"))inp.addEventListener("input",()=>{edited.add(r.store);tr.classList.add("changed");let p=Number(r.prev),inc=Number(tr.querySelector(".incoming").value),use=Number(tr.querySelector(".usage").value);tr.querySelector(".remain").textContent=Number.isFinite(p+inc-use)?String(p+inc-use):"-"});
   tr.querySelector(".save").onclick=()=>save(tr,r);
 });
}
async function save(tr,r){
 const incoming=tr.querySelector(".incoming").value,usage=tr.querySelector(".usage").value;
 if(!confirm(`${r.store}\n입고: ${incoming||0} / 사용: ${usage||0}\n저장할까요?`))return;
 const btn=tr.querySelector(".save");btn.disabled=true;
 try{
  const response=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"save",part:selectedPart,date:el("date").value,store:r.store,incoming,usage})});
  const j=await response.json();if(j.ok===false)throw Error(j.error||"저장 실패");
  r.incoming=incoming;r.usage=usage;r.remain=j.remain;edited.delete(r.store);tr.classList.remove("changed");tr.classList.add("saved");tr.querySelector(".remain").textContent=j.remain;toast("저장 완료: "+r.store);
 }catch(e){toast("저장 실패: "+e.message)}finally{btn.disabled=false}
}
el("lookup").onclick=load;el("refresh").onclick=load;el("search").oninput=render;load();
