const KEY='she_quadro_v2', ADMIN_PASS='admin123';
const PR={critica:['Crítica',0],alta:['Alta',1],media:['Média',2],baixa:['Baixa',3]};
const ST={pendente:'Pendente',andamento:'Em andamento',concluida:'Concluída'};
const TABS=[['abertas','Em aberto'],['pendente','Pendentes'],['andamento','Em andamento'],['reavaliar','Reavaliação'],['concluida','Concluídas'],['todas','Todas']];
const COR=['#1d6a47','#2c6aa0','#b8650a','#5d6b63'];
const LOGO='<svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l8 3v6c0 5-3.4 9-8 11-4.6-2-8-6-8-11V5z" fill="#f2a23a"/><path d="M8 12l3 3 5-6" stroke="#14452f" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const $=s=>document.querySelector(s);
const IC={plus:'<path d="M12 5v14M5 12h14"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',play:'<path d="M8 5l11 7-11 7z"/>',check:'<path d="M5 12l5 5 9-10"/>',undo:'<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',trash:'<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',out:'<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>',in:'<path d="M15 4h4v16h-4M10 8l4 4-4 4M14 12H4"/>',key:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',off:'<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>'};
const ic=n=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;
async function hash(s){try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('she:'+s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){return s}}
let mem=null;
function load(){try{const r=localStorage.getItem(KEY);if(r)return JSON.parse(r)}catch(e){}return mem||{users:[],tasks:[]}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){mem=db}}
let db=load(), sess=null, filt={status:'abertas',prio:'',resp:''}, tm;
try{sess=sessionStorage.getItem('she_u')}catch(e){}
function setSess(v){sess=v;try{v?sessionStorage.setItem('she_u',v):sessionStorage.removeItem('she_u')}catch(e){}}
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const hoje=()=>new Date().toLocaleDateString('sv-SE');
const fmt=d=>d.split('-').reverse().join('/');
const ini=n=>n.trim().split(/\s+/).slice(0,2).map(p=>p[0]).join('').toUpperCase();
const av=u=>`<span class="av" style="background:${COR[[...u.id].reduce((a,c)=>a+c.charCodeAt(0),0)%4]}">${esc(ini(u.nome))}</span>`;
const getU=id=>db.users.find(x=>x.id===id);
const uname=id=>{const u=getU(id);return u?u.nome+(u.ativo?'':' (inativo)'):'—'};
const podeMudar=t=>t.criadoPor===sess||t.resp===sess;
function toast(m){const e=$('#toast');e.textContent=m;e.classList.add('on');clearTimeout(tm);tm=setTimeout(()=>e.classList.remove('on'),2200)}
function dias(d){return Math.round((new Date(d+'T00:00')-new Date(hoje()+'T00:00'))/864e5)}
function prazoTxt(t){
  if(!t.prazo)return ['sem prazo',''];
  if(t.status==='concluida')return ['prazo '+fmt(t.prazo),''];
  const n=dias(t.prazo);
  if(n<0)return [`vencido há ${-n} dia${n<-1?'s':''}`,'late'];
  if(n===0)return ['vence hoje','soon'];
  if(n===1)return ['vence amanhã','soon'];
  return ['prazo '+fmt(t.prazo),''];
}
function bar(nome,u){return `<header class="bar"><h1>${LOGO}Quadro SHE</h1><div class="me">${u?av(u):'<span class="av" style="background:#2f8a5c">A</span>'}<span>${esc(nome)}</span></div><button class="btn sec" onclick="sair()">${ic('out')}Sair</button></header>`}

function render(){
  const a=$('#app');
  if(!sess){a.innerHTML=loginV();return}
  if(sess==='admin'){a.innerHTML=adminV();return}
  const me=getU(sess);
  if(!me||!me.ativo){setSess(null);a.innerHTML=loginV();return}
  a.innerHTML=boardV(me);
}

/* ---------- entrada ---------- */
function loginV(){
  return `<div class="split"><aside class="hero">${LOGO.replace('28','44').replace('28','44')}<h1>Quadro de atividades SHE</h1><p>Veja o que está pendente, quem é o responsável e até quando. Tudo da equipe de segurança, saúde e meio ambiente num só lugar.</p></aside>
  <section class="enter"><h2>Entrar</h2><p class="sub">Use o ID e a senha que o administrador cadastrou para você.</p>
  <form onsubmit="return entrar(event)"><label class="fld">ID de acesso<input id="lg" autocomplete="username" autocapitalize="none" required></label><label class="fld">Senha<input id="ps" type="password" autocomplete="current-password" required></label><button class="btn big">${ic('in')}Entrar</button></form>
  <details><summary>Acesso do administrador</summary><form onsubmit="return entrarAdm(event)"><label class="fld">Senha do administrador<input id="pw" type="password" autocomplete="off"></label><button class="btn sec">Entrar como administrador</button></form></details></section></div>`;
}
async function entrar(e){
  e.preventDefault();
  const lg=$('#lg').value.trim().toLowerCase(), h=await hash($('#ps').value);
  const u=db.users.find(x=>x.login===lg&&x.senha===h);
  if(!u){toast('ID ou senha incorretos');return false}
  if(!u.ativo){toast('Usuário inativo. Fale com o administrador.');return false}
  setSess(u.id);render();return false;
}
function entrarAdm(e){e.preventDefault();if($('#pw').value===ADMIN_PASS){setSess('admin');render()}else toast('Senha incorreta');return false}
function sair(){setSess(null);render()}

/* ---------- administração ---------- */
function adminV(){
  const l=db.users.slice().sort((a,b)=>a.nome.localeCompare(b.nome));
  return bar('Administrador')+`<main><div class="topo"><div><h2>Usuários</h2><p class="sub">Cadastre o técnico com um ID e uma senha, e passe esses dados para ele entrar.</p></div></div>
  <form class="add" onsubmit="return novoUser(event)"><label class="fld">Nome<input id="nu" required maxlength="60"></label><label class="fld">ID de acesso<input id="nl" required maxlength="30" autocapitalize="none" autocomplete="off"></label><label class="fld">Senha (mínimo 4 caracteres)<input id="ns" required minlength="4" maxlength="40" autocomplete="off"></label><button class="btn">${ic('plus')}Cadastrar</button></form>
  ${l.length?`<div class="lista">${l.map(u=>`<div class="li${u.ativo?'':' off'}">${av(u)}<span class="nm">${esc(u.nome)}<small>ID: ${esc(u.login)}</small></span><span class="st">${u.ativo?'Ativo':'Inativo'}</span><button class="ghost" onclick="trocarSenha('${u.id}')">${ic('key')}Trocar senha</button><button class="ghost ${u.ativo?'danger':'ok'}" onclick="alternar('${u.id}')">${ic(u.ativo?'off':'check')}${u.ativo?'Inativar':'Reativar'}</button></div>`).join('')}</div>`
  :`<p class="vazio">Nenhum usuário ainda. Preencha os campos acima e clique em Cadastrar.</p>`}</main>`;
}
async function novoUser(e){
  e.preventDefault();
  const n=$('#nu').value.trim(), lg=$('#nl').value.trim().toLowerCase().replace(/\s+/g,''), s=$('#ns').value;
  if(!n||!lg||s.length<4){toast('Preencha nome, ID e uma senha com 4 ou mais caracteres');return false}
  if(db.users.some(u=>u.login===lg)){toast('Esse ID já está em uso');return false}
  db.users.push({id:uid(),login:lg,nome:n,senha:await hash(s),ativo:true});save();render();toast('Usuário cadastrado');return false;
}
function alternar(id){const u=getU(id);u.ativo=!u.ativo;save();render();toast(u.ativo?'Usuário reativado':'Usuário inativado')}
function trocarSenha(id){
  const u=getU(id);
  dlg(`<form onsubmit="return salvarSenha(event,'${id}')"><h2>Nova senha</h2><p>Defina a nova senha de ${esc(u.nome)} e passe para ele.</p>
  <label class="fld">Nova senha<input id="np" required minlength="4" maxlength="40" autocomplete="off"></label>
  <div class="row"><button type="button" class="btn sec" onclick="fechar()">Cancelar</button><button class="btn">Salvar senha</button></div></form>`);
}
async function salvarSenha(e,id){e.preventDefault();const s=$('#np').value;if(s.length<4)return false;getU(id).senha=await hash(s);save();fechar();toast('Senha alterada');return false}

/* ---------- quadro ---------- */
function cnt(k){const T=db.tasks;return k==='todas'?T.length:k==='abertas'?T.filter(t=>t.status!=='concluida').length:T.filter(t=>t.status===k).length}
function lista(){
  let l=db.tasks.slice();
  if(filt.status==='abertas')l=l.filter(t=>t.status!=='concluida');
  else if(filt.status!=='todas')l=l.filter(t=>t.status===filt.status);
  if(filt.prio)l=l.filter(t=>t.prio===filt.prio);
  if(filt.resp==='sem')l=l.filter(t=>!t.resp);
  else if(filt.resp==='minhas')l=l.filter(t=>t.resp===sess);
  else if(filt.resp)l=l.filter(t=>t.resp===filt.resp);
  return l.sort((a,b)=>((a.status==='concluida')-(b.status==='concluida'))||(PR[a.prio][1]-PR[b.prio][1])||((a.prazo||'9').localeCompare(b.prazo||'9'))||(a.criadoEm-b.criadoEm));
}
function boardV(me){
  const venc=db.tasks.filter(t=>t.status!=='concluida'&&t.prazo&&t.prazo<hoje()).length,
        l=lista(), ab=cnt('abertas'),
        o=(v,t,c)=>`<option value="${v}"${c===v?' selected':''}>${t}</option>`;
  return bar(me.nome,me)+`<main>
  <div class="topo"><div><h2>Olá, ${esc(me.nome.split(' ')[0])}</h2><p class="sub">${ab} ${ab===1?'atividade em aberto':'atividades em aberto'}${venc?`, <b>${venc} com prazo vencido</b>`:''}.</p></div><button class="btn" onclick="formTask()">${ic('plus')}Nova atividade</button></div>
  <nav class="tabs" aria-label="Situação">${TABS.map(([k,t])=>`<button class="${filt.status===k?'on':''}" onclick="setFilt('status','${k}')">${t}<b>${cnt(k)}</b></button>`).join('')}</nav>
  <div class="filtros"><button class="tg${filt.resp==='minhas'?' on':''}" onclick="setFilt('resp','${filt.resp==='minhas'?'':'minhas'}')">Só as minhas</button>
    <select aria-label="Prioridade" onchange="setFilt('prio',this.value)">${o('','Todas as prioridades',filt.prio)}${Object.entries(PR).map(([k,v])=>o(k,v[0],filt.prio)).join('')}</select>
    <select aria-label="Responsável" onchange="setFilt('resp',this.value)">${o('','Todos os responsáveis',filt.resp)}${o('minhas','Minhas',filt.resp)}${o('sem','Sem responsável',filt.resp)}${db.users.map(u=>o(u.id,esc(u.nome),filt.resp)).join('')}</select></div>
  ${l.length?l.map(row).join(''):`<p class="vazio">${db.tasks.length?'Nada por aqui com esses filtros. Troque a aba ou limpe os filtros.':'Ainda não há atividades. Clique em Nova atividade para registrar a primeira.'}</p>`}</main>`;
}
function setFilt(k,v){filt[k]=v;render()}
function row(t){
  const dono=t.criadoPor===sess, pode=podeMudar(t), r=getU(t.resp), [pt,pc]=prazoTxt(t);
  const bloq=pode?'':' disabled title="Só quem criou ou o responsável pode alterar o status"';
  const IS={pendente:'clock',andamento:'play',concluida:'check'};
  const b=s=>`<button class="${s}${t.status===s?' on':''}" onclick="setStatus('${t.id}','${s}')"${bloq}>${ic(IS[s])}${ST[s]}</button>`;
  return `<article class="task p-${t.prio} s-${t.status}">
  <div class="head"><h3>${esc(t.titulo)}</h3><span class="tag">${PR[t.prio][0]}</span></div>
  ${t.desc?`<p class="desc">${esc(t.desc)}</p>`:''}
  ${t.status==='reavaliar'?`<div class="reav"><b>${esc(uname(t.motivoPor))}</b> pediu para explicar melhor: ${esc(t.motivo)}</div>`:''}
  <div class="info"><span class="who">${r?av(r)+esc(uname(t.resp)):'Sem responsável'}</span><span class="due ${pc}">${pt}</span><span>Criada por ${esc(uname(t.criadoPor))}</span></div>
  <div class="acts"><div class="seg" role="group" aria-label="Status">${b('pendente')}${b('andamento')}${b('concluida')}</div>
    <button class="ghost${t.status==='reavaliar'?' on':''}" onclick="pedirReav('${t.id}')"${bloq}>${ic('undo')}Pedir reavaliação</button>
    <span class="sp"></span>${dono?`<button class="ghost" onclick="formTask('${t.id}')">${ic('edit')}Editar</button><button class="ghost danger" onclick="excluir('${t.id}')">${ic('trash')}Excluir</button>`:''}</div>
  </article>`;
}
function setStatus(id,s){const t=db.tasks.find(x=>x.id===id);if(!podeMudar(t))return;t.status=s;delete t.motivo;delete t.motivoPor;save();render();toast('Status: '+ST[s])}
function excluir(id){const t=db.tasks.find(x=>x.id===id);if(!t||t.criadoPor!==sess)return;if(confirm('Excluir esta atividade?')){db.tasks=db.tasks.filter(x=>x.id!==id);save();render();toast('Atividade excluída')}}

/* ---------- janelas ---------- */
function dlg(h){const d=$('#dlg');d.innerHTML=h;d.showModal()}
function fechar(){$('#dlg').close()}
function formTask(id){
  const t=db.tasks.find(x=>x.id===id)||{prio:'media'};
  dlg(`<form onsubmit="return salvarTask(event,'${id||''}')"><h2>${id?'Editar atividade':'Nova atividade'}</h2><p>Só o título é obrigatório. Responsável e prazo você pode definir depois.</p>
  <label class="fld">Título<input id="f_t" required maxlength="120" value="${esc(t.titulo)}"></label>
  <label class="fld">Descrição<textarea id="f_d" rows="4" placeholder="O que precisa ser feito, onde e como">${esc(t.desc)}</textarea></label>
  <fieldset><legend>Prioridade</legend><div class="chips">${Object.entries(PR).map(([k,v])=>`<label class="chip c-${k}"><input type="radio" name="f_p" value="${k}"${t.prio===k?' checked':''}><span>${v[0]}</span></label>`).join('')}</div></fieldset>
  <div class="duas"><label class="fld">Responsável (opcional)<select id="f_r"><option value="">Sem responsável</option>${db.users.filter(u=>u.ativo||u.id===t.resp).map(u=>`<option value="${u.id}"${t.resp===u.id?' selected':''}>${esc(u.nome)}</option>`).join('')}</select></label>
  <label class="fld">Prazo (opcional)<input id="f_z" type="date" value="${esc(t.prazo)}"></label></div>
  <div class="row"><button type="button" class="btn sec" onclick="fechar()">Cancelar</button><button class="btn">Salvar</button></div></form>`);
}
function salvarTask(e,id){
  e.preventDefault();
  const v={titulo:$('#f_t').value.trim(),desc:$('#f_d').value.trim(),prio:$('input[name=f_p]:checked').value,resp:$('#f_r').value,prazo:$('#f_z').value};
  if(!v.titulo)return false;
  if(id){const t=db.tasks.find(x=>x.id===id);if(t.criadoPor!==sess)return false;Object.assign(t,v);if(t.status==='reavaliar'){t.status='pendente';delete t.motivo;delete t.motivoPor}}
  else db.tasks.push(Object.assign({id:uid(),status:'pendente',criadoPor:sess,criadoEm:Date.now()},v));
  save();fechar();render();toast(id?'Atividade atualizada':'Atividade criada');return false;
}
function pedirReav(id){
  dlg(`<form onsubmit="return enviarReav(event,'${id}')"><h2>Pedir reavaliação</h2><p>Diga o que está faltando ou confuso. A atividade fica marcada até quem criou explicá-la melhor.</p>
  <label class="fld">O que precisa ser esclarecido<textarea id="f_m" rows="4" required></textarea></label>
  <div class="row"><button type="button" class="btn sec" onclick="fechar()">Cancelar</button><button class="btn">Enviar pedido</button></div></form>`);
}
function enviarReav(e,id){
  e.preventDefault();const t=db.tasks.find(x=>x.id===id);
  if(!podeMudar(t))return false;
  t.status='reavaliar';t.motivo=$('#f_m').value.trim();t.motivoPor=sess;
  save();fechar();render();toast('Pedido enviado');return false;
}
render();
