
const KEY="my_media_library_v2";
const colors=["#7567f8","#e85d9e","#e35d5d","#e08a32","#35a86b","#3296d7","#9b65c7","#555"];
const base={theme:"dark",accent:"#7567f8",folders:[{id:"root",name:"Моя библиотека",color:"#7567f8",parent:null}],items:[]};
let db=load(),page="home",folderId="root",query="";
function load(){try{return JSON.parse(localStorage.getItem(KEY))||structuredClone(base)}catch{return structuredClone(base)}}
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function id(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function folder(id){return db.folders.find(x=>x.id===id)}
function children(id){return db.folders.filter(x=>x.parent===id)}
function items(id){return db.items.filter(x=>x.folderId===id)}
function n(v){return new Intl.NumberFormat("ru-RU").format(v)}
function theme(){document.documentElement.dataset.theme=db.theme;document.documentElement.style.setProperty("--accent",db.accent)}
function toast(t){const x=document.getElementById("toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),1700)}
function stat(icon,name,value){return `<div class="stat"><span>${icon} ${name}</span><b>${n(value)}</b></div>`}
function header(title,sub=""){return `<div class="top"><div><h1>${esc(title)}</h1>${sub?`<div class="sub">${esc(sub)}</div>`:""}</div><div class="actions"><input class="search" id="search" placeholder="🔎 Поиск..." value="${esc(query)}"><button class="btn primary" id="quick">＋ Добавить</button></div></div>`}
function card(x){
 const st={done:"Просмотрено",watching:"Смотрю",want:"Хочу посмотреть",unfinished:"Не досмотрено",dropped:"Брошено",reading:"Читаю",readWant:"Хочу прочитать"}[x.status]||x.status;
 const extra=x.type==="show"?`${x.seasons||0} сез. · ${x.episodes||0} сер.`:x.type==="book"?`${x.parts||0} частей`:"Фильм";
 return `<article class="card"><div class="cover">${x.cover?`<img src="${esc(x.cover)}">`:`<div class="emoji">${x.type==="book"?"📖":x.type==="movie"?"🎬":"📺"}</div>`}</div><div class="body"><div class="title">${esc(x.title)} ${x.favorite?"⭐":""}</div><div class="meta">${extra}</div><div class="tags"><span class="tag status">${esc(st)}</span>${x.rating?`<span class="tag">⭐ ${x.rating}/10</span>`:""}</div><div class="cardActions"><button class="btn" data-open="${x.id}">Открыть</button><button class="btn" data-fav="${x.id}">${x.favorite?"★":"☆"}</button></div></div></article>`
}
function folderCard(f){const count=children(f.id).length+items(f.id).length;return `<div class="folder" style="border-top:4px solid ${f.color}"><div class="folderIcon">📁</div><button style="position:absolute;right:10px;top:10px" class="btn" data-edit-folder="${f.id}">⋯</button><button style="background:none;border:0;color:var(--text);text-align:left;width:100%" data-folder="${f.id}"><div class="folderName">${esc(f.name)}</div><div class="folderCount">${count} объектов</div></button></div>`}
function render(){
 theme();document.querySelectorAll(".nav button").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
 let out=page==="home"?home():page==="folders"?folders():page==="folder"?inside():page==="stats"?stats():page==="favorites"?favorites():settings();
 document.getElementById("main").innerHTML=out;
 document.getElementById("search")?.addEventListener("input",e=>{query=e.target.value;render()});
 document.getElementById("quick")?.addEventListener("click",()=>itemModal());
}
function home(){
 const now=db.items.filter(x=>["watching","reading"].includes(x.status)).slice(0,8);
 return header("Моя библиотека","Данные сохраняются на этом устройстве")+`<div class="stats">${stat("🎬","Фильмов просмотрено",db.items.filter(x=>x.type==="movie"&&x.status==="done").length)}${stat("📺","Серий просмотрено",db.items.reduce((a,x)=>a+(x.watchedEpisodes||0),0))}${stat("📖","Книг прочитано",db.items.filter(x=>x.type==="book"&&x.status==="done").length)}${stat("📄","Страниц прочитано",db.items.reduce((a,x)=>a+(x.readPages||0),0))}</div><div class="panel"><h2>▶️ Продолжить</h2>${now.length?`<div class="grid">${now.map(card).join("")}</div>`:`<div class="empty">Добавь фильм, сериал или книгу и здесь появится прогресс.</div>`}</div><div class="panel"><h2>🗂️ Папки</h2><div class="folderGrid">${children("root").map(folderCard).join("")||`<div class="empty">Создай свою первую папку.</div>`}</div></div>`
}
function folders(){return header("Папки","Вложенность без ограничений")+`<div class="toolbar"><button class="btn primary" onclick="folderModal()">＋ Новая папка</button></div><div class="folderGrid">${children("root").map(folderCard).join("")||`<div class="empty">Пока нет папок.</div>`}</div>`}
function crumbs(id){let a=[],x=folder(id);while(x){a.unshift(x);x=folder(x.parent)}return `<div class="breadcrumb">${a.map((f,i)=>i<a.length-1?`<button data-folder="${f.id}">${esc(f.name)}</button> › `:`<b>${esc(f.name)}</b>`).join("")}</div>`}
function inside(){
 const f=folder(folderId), q=query.toLowerCase(), list=items(folderId).filter(x=>[x.title,x.author,x.tags,x.note].join(" ").toLowerCase().includes(q));
 return crumbs(folderId)+header(f.name,`${children(folderId).length} папок · ${items(folderId).length} объектов`)+`<div class="toolbar"><button class="btn primary" onclick="folderModal()">＋ Папка</button><button class="btn" onclick="itemModal()">＋ Объект</button></div><div class="folderGrid">${children(folderId).map(folderCard).join("")}</div><div class="panel"><h2>Содержимое</h2>${list.length?`<div class="grid">${list.map(card).join("")}</div>`:`<div class="empty">Здесь пока пусто.</div>`}</div>`
}
function stats(){const done=db.items.filter(x=>x.status==="done");return header("Статистика","За всё время")+`<div class="stats">${stat("🎬","Фильмов просмотрено",done.filter(x=>x.type==="movie").length)}${stat("📺","Сериалов завершено",done.filter(x=>x.type==="show").length)}${stat("🎞️","Серий просмотрено",db.items.reduce((a,x)=>a+(x.watchedEpisodes||0),0))}${stat("📖","Книг прочитано",done.filter(x=>x.type==="book").length)}${stat("📄","Страниц прочитано",db.items.reduce((a,x)=>a+(x.readPages||0),0))}</div><div class="panel"><h2>Статусы</h2><div class="stats">${stat("🟢","Завершено",done.length)}${stat("🟡","Сейчас",db.items.filter(x=>["watching","reading"].includes(x.status)).length)}${stat("🔵","В планах",db.items.filter(x=>["want","readWant"].includes(x.status)).length)}${stat("🟠","Не закончено",db.items.filter(x=>x.status==="unfinished").length)}${stat("⚪","Брошено",db.items.filter(x=>x.status==="dropped").length)}</div></div>`}
function favorites(){let a=db.items.filter(x=>x.favorite);return header("Избранное")+`<div class="grid">${a.map(card).join("")||`<div class="empty">Здесь будут твои ⭐ любимые.</div>`}</div>`}
function settings(){return header("Настройки","Локальные данные браузера")+`<div class="panel"><h2>🎨 Внешний вид</h2><div class="actions"><button class="btn ${db.theme==="light"?"primary":""}" onclick="setTheme('light')">☀️ Светлая</button><button class="btn ${db.theme==="dark"?"primary":""}" onclick="setTheme('dark')">🌙 Тёмная</button></div><p>Цвет интерфейса</p><div class="colors">${colors.map(c=>`<button class="color ${db.accent===c?"selected":""}" style="background:${c}" data-color="${c}"></button>`).join("")}</div></div><div class="panel"><h2>💾 Резервная копия</h2><p class="sub">Экспортируй библиотеку в JSON, чтобы сохранить её отдельно или перенести на другое устройство.</p><div class="actions"><button class="btn primary" onclick="exportData()">📥 Экспорт</button><label class="btn">📤 Импорт<input hidden type="file" id="import" accept=".json"></label></div></div><div class="panel"><h2>⚠️ Данные</h2><button class="btn danger" onclick="reset()">Удалить всю библиотеку</button></div>`}
function show(){document.getElementById("modal").classList.add("show")}
function close(){document.getElementById("modal").classList.remove("show")}
function folderModal(edit){
 const f=edit?folder(edit):null;
 document.getElementById("box").innerHTML=`<h2>${f?"Изменить папку":"Новая папка"}</h2><div class="form"><div class="field"><label>Название</label><input id="fname" value="${esc(f?.name||"Новая папка")}"></div><div class="field"><label>Вложить в</label><select id="fparent">${db.folders.filter(z=>z.id!==edit).map(z=>`<option value="${z.id}" ${z.id===(f?.parent||folderId)?"selected":""}>${esc(z.name)}</option>`).join("")}</select></div><div class="field full"><label>Цвет</label><div class="colors" id="fcolors">${colors.map(c=>`<button class="color ${c===(f?.color||db.accent)?"selected":""}" style="background:${c}" data-c="${c}"></button>`).join("")}</div></div></div><div class="modalActions"><button class="btn" onclick="close()">Отмена</button>${f?`<button class="btn danger" onclick="deleteFolder('${f.id}')">Удалить</button>`:""}<button class="btn primary" onclick="saveFolder('${edit||""}')">Сохранить</button></div>`;
 document.querySelectorAll("#fcolors .color").forEach(b=>b.onclick=()=>{document.querySelectorAll("#fcolors .color").forEach(x=>x.classList.remove("selected"));b.classList.add("selected")});show()
}
function saveFolder(edit){
 const name=document.getElementById("fname").value.trim();if(!name)return toast("Введи название");
 const f=edit?folder(edit):{id:id()};f.name=name;f.parent=document.getElementById("fparent").value;f.color=document.querySelector("#fcolors .selected").dataset.c;
 if(!edit)db.folders.push(f);save();close();render();toast("Папка сохранена")
}
function deleteFolder(x){if(x==="root"||!confirm("Удалить папку и всё внутри?"))return;const gone=new Set([x]);let change=true;while(change){change=false;db.folders.forEach(f=>{if(gone.has(f.parent)&&!gone.has(f.id)){gone.add(f.id);change=true}})}db.folders=db.folders.filter(f=>!gone.has(f.id));db.items=db.items.filter(i=>!gone.has(i.folderId));folderId="root";save();close();render()}
function itemModal(edit){
 const x=edit?db.items.find(z=>z.id===edit):null;
 document.getElementById("box").innerHTML=`<h2>${x?"Изменить":"Добавить"}</h2><div class="form">
 <div class="field full"><label>Название</label><input id="title" value="${esc(x?.title||"")}"></div>
 <div class="field"><label>Тип</label><select id="type"><option value="movie">Фильм</option><option value="show">Сериал</option><option value="book">Книга</option></select></div>
 <div class="field"><label>Статус</label><select id="status"></select></div>
 <div class="field"><label>Папка</label><select id="ifolder">${db.folders.map(f=>`<option value="${f.id}" ${f.id===(x?.folderId||folderId)?"selected":""}>${esc(f.name)}</option>`).join("")}</select></div>
 <div class="field"><label>Автор / создатель</label><input id="author" value="${esc(x?.author||"")}"></div>
 <div class="field"><label>Сезонов</label><input id="seasons" type="number" min="0" value="${x?.seasons||""}"></div>
 <div class="field"><label>Серий</label><input id="episodes" type="number" min="0" value="${x?.episodes||""}"></div>
 <div class="field"><label>Частей</label><input id="parts" type="number" min="0" value="${x?.parts||""}"></div>
 <div class="field"><label>Просмотрено серий</label><input id="watched" type="number" min="0" value="${x?.watchedEpisodes||""}"></div>
 <div class="field"><label>Прочитано страниц</label><input id="pages" type="number" min="0" value="${x?.readPages||""}"></div>
 <div class="field"><label>Всего страниц</label><input id="total" type="number" min="0" value="${x?.totalPages||""}"></div>
 <div class="field"><label>Оценка 0–10</label><input id="rating" type="number" min="0" max="10" step=".5" value="${x?.rating||""}"></div>
 <div class="field full"><label>Обложка: URL изображения</label><input id="cover" value="${esc(x?.cover||"")}"></div>
 <div class="field full"><label>Теги</label><input id="tags" value="${esc(x?.tags||"")}"></div>
 <div class="field full"><label>Заметка</label><textarea id="note">${esc(x?.note||"")}</textarea></div>
 </div><div class="modalActions"><button class="btn" onclick="close()">Отмена</button>${x?`<button class="btn danger" onclick="removeItem('${x.id}')">Удалить</button>`:""}<button class="btn primary" onclick="saveItem('${edit||""}')">Сохранить</button></div>`;
 const type=document.getElementById("type"),status=document.getElementById("status");
 function fill(){const book=type.value==="book";status.innerHTML=(book?[["reading","Читаю"],["readWant","Хочу прочитать"],["done","Прочитано"],["unfinished","Не дочитано"],["dropped","Брошено"]]:[["watching","Смотрю"],["want","Хочу посмотреть"],["done","Просмотрено"],["unfinished","Не досмотрено"],["dropped","Брошено"]]).map(a=>`<option value="${a[0]}">${a[1]}</option>`).join("");status.value=x?.status||(book?"readWant":"want")}
 type.value=x?.type||"movie";type.onchange=fill;fill();show()
}
function saveItem(edit){
 const title=document.getElementById("title").value.trim();if(!title)return toast("Введи название");
 const x=edit?db.items.find(z=>z.id===edit):{id:id(),favorite:false};
 Object.assign(x,{title,type:document.getElementById("type").value,status:document.getElementById("status").value,folderId:document.getElementById("ifolder").value,author:document.getElementById("author").value,seasons:+document.getElementById("seasons").value||0,episodes:+document.getElementById("episodes").value||0,parts:+document.getElementById("parts").value||0,watchedEpisodes:+document.getElementById("watched").value||0,readPages:+document.getElementById("pages").value||0,totalPages:+document.getElementById("total").value||0,rating:document.getElementById("rating").value,cover:document.getElementById("cover").value.trim(),tags:document.getElementById("tags").value,note:document.getElementById("note").value});
 if(!edit)db.items.push(x);save();close();render();toast("Сохранено")
}
function removeItem(x){if(confirm("Удалить объект?")){db.items=db.items.filter(i=>i.id!==x);save();close();render()}}
function exportData(){const b=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="my-media-library-backup.json";a.click();URL.revokeObjectURL(a.href)}
function reset(){if(confirm("Удалить всю библиотеку?")){db=structuredClone(base);save();render();toast("Библиотека очищена")}}
function setTheme(x){db.theme=x;save();render()}
document.querySelectorAll(".nav button").forEach(b=>b.onclick=()=>{page=b.dataset.page;query="";render()});
document.getElementById("add").onclick=()=>itemModal();
document.getElementById("modal").onclick=e=>{if(e.target.id==="modal")close()};
document.addEventListener("click",e=>{
 const f=e.target.closest("[data-folder]");if(f){folderId=f.dataset.folder;page="folder";query="";render();return}
 const ef=e.target.closest("[data-edit-folder]");if(ef){folderModal(ef.dataset.editFolder);return}
 const oi=e.target.closest("[data-open]");if(oi){itemModal(oi.dataset.open);return}
 const fv=e.target.closest("[data-fav]");if(fv){const x=db.items.find(i=>i.id===fv.dataset.fav);x.favorite=!x.favorite;save();render()}
 const c=e.target.closest("[data-color]");if(c){db.accent=c.dataset.color;save();render()}
 const fc=e.target.closest("[data-c]");if(fc){document.querySelectorAll("#fcolors .color").forEach(x=>x.classList.remove("selected"));fc.classList.add("selected")}
});
document.addEventListener("change",e=>{if(e.target.id==="import"){const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.folders||!d.items)throw 0;db=d;save();render();toast("Библиотека импортирована")}catch{toast("Файл не подходит")}};r.readAsText(file)}})
render();
