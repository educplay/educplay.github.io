
// script.js (v2) — manejo de registro, puntos y lógica de juegos/libros/canciones
const STORAGE_USERS = 'educplay_users_v2'; // stores object {username:{password,points,progress:{books:[],games:[],songs:[]}}}
const STORAGE_SESSION = 'educplay_session_v2'; // current logged username

// ---------- utilities ----------
function loadUsers(){ return JSON.parse(localStorage.getItem(STORAGE_USERS) || '{}'); }
function saveUsers(u){ localStorage.setItem(STORAGE_USERS, JSON.stringify(u)); }
function setSession(user){ localStorage.setItem(STORAGE_SESSION, user); }
function getSession(){ return localStorage.getItem(STORAGE_SESSION); }
function clearSession(){ localStorage.removeItem(STORAGE_SESSION); }

function ensureUser(username){ const users = loadUsers(); if(!users[username]) users[username] = {password:'',points:0,progress:{books:[],games:[],songs:[]}}; return users; }

function addPoints(amount, type, id){ const user = getSession(); if(!user) return false; const users = loadUsers(); if(!users[user]) return false; users[user].points += amount; // add detail
  const arr = users[user].progress[type] || []; if(!arr.includes(id)) arr.push(id); users[user].progress[type]=arr;
  saveUsers(users); return true;
}

// ---------- DOM helpers ----------
function $(id){ return document.getElementById(id); }

document.addEventListener('DOMContentLoaded', ()=>{
  // If registration page
  if ($('registerBtn')){
    const msg = $('msg');
    $('registerBtn').addEventListener('click', ()=>{
      const u = $('username').value.trim(); const p = $('password').value;
      if(!u||!p){ msg.textContent='Rellena usuario y contraseña'; msg.style.color='crimson'; return; }
      const users = loadUsers();
      if(users[u]){ msg.textContent='Usuario ya existe. Usa otro nombre o inicia sesión.'; msg.style.color='crimson'; return; }
      users[u] = {password:p, points:0, progress:{books:[],games:[],songs:[]}};
      saveUsers(users); setSession(u); msg.textContent='Registro exitoso. Sesión iniciada.'; msg.style.color='green';
      setTimeout(()=> location.href='perfil.html',700);
    });
    $('loginBtn').addEventListener('click', ()=>{
      const u = $('username').value.trim(); const p = $('password').value;
      const users = loadUsers();
      if(!users[u] || users[u].password !== p){ msg.textContent='Usuario o contraseña incorrectos.'; msg.style.color='crimson'; return; }
      setSession(u); msg.textContent='Sesión iniciada.'; msg.style.color='green';
      setTimeout(()=> location.href='perfil.html',600);
    });
  }

  // Profile page
  if ($('profile')){
    const user = getSession();
    if(!user){
      $('notLogged').textContent = 'No has iniciado sesión. Regístrate o inicia sesión para guardar puntos.';
      $('profileContent').style.display='none';
    } else {
      $('notLogged').textContent='';
      $('profileContent').style.display='block';
      const users = loadUsers();
      const data = users[user];
      $('welcome').textContent = 'Hola, ' + user;
      $('totalPoints').textContent = data.points || 0;
      const detail = $('detail');
      detail.innerHTML='';
      const li1 = document.createElement('li'); li1.textContent = 'Juegos completados: ' + (data.progress.games || []).length; detail.appendChild(li1);
      const li2 = document.createElement('li'); li2.textContent = 'Libros leídos: ' + (data.progress.books || []).length; detail.appendChild(li2);
      const li3 = document.createElement('li'); li3.textContent = 'Canciones escuchadas: ' + (data.progress.songs || []).length; detail.appendChild(li3);
      $('logoutBtn').addEventListener('click', ()=>{ clearSession(); location.reload(); });
    }
  }

  // --- Games initialization ---
  if ($('balloonArea')){ initBalloonGame_v2(); }
  if ($('letterChoices')){ initLetterGame(); }
  if ($('grid')){ initMemoryGame(); }

  // --- Books initialization ---
  if ($('page')){ initBook_v2(); }

  // --- Songs init ---
  if ($('markListen')){
    const btn = $('markListen');
    btn.addEventListener('click', ()=>{
      const page = location.pathname.split('/').pop();
      const id = page.replace('.html','');
      const added = addPoints(5,'songs', id);
      const fb = $('feedback');
      if(added){ fb.textContent='Escuchado — +5 puntos'; fb.style.color='green'; } else { fb.textContent='Regístrate para guardar puntos.'; fb.style.color='crimson'; }
    });
  }

  // Book mark read buttons
  if ($('markRead')){
    $('markRead').addEventListener('click', ()=>{
      const page = location.pathname.split('/').pop();
      const id = page.replace('.html','');
      const added = addPoints(10,'books', id);
      const fb = document.getElementById('feedback') || document.querySelector('.feedback');
      if(added){ fb.textContent='Libro marcado como leído — +10 puntos'; fb.style.color='green'; } else { fb.textContent='Regístrate para guardar puntos.'; fb.style.color='crimson'; }
    });
  }

  // Restart memory
  if ($('restart')){ $('restart').addEventListener('click', ()=> initMemoryGame()); }
});

// ------------------ Balloon game (v2) ------------------
function initBalloonGame_v2(){
  const area = $('balloonArea'); const choices = $('choices'); const feedback = $('feedback'); const newBtn = $('newBtn');
  function newRound(){
    feedback.textContent=''; area.innerHTML=''; choices.innerHTML='';
    const n = Math.floor(Math.random()*6)+3; for(let i=0;i<n;i++){ const b=document.createElement('div'); b.className='balloon'; area.appendChild(b); }
    const correct = n; const opts = shuffle([correct, correct + (Math.random()>0.5?1:-1), correct + (Math.random()>0.5?2:-2)]);
    opts.forEach(v=>{ const btn=document.createElement('button'); btn.textContent=v; btn.onclick=()=>{
      if(v===correct){ feedback.textContent='¡Correcto! +5 puntos'; feedback.style.color='green'; const added=addPoints(5,'games', 'game_count'); if(!added) feedback.textContent='¡Correcto! Regístrate para guardar puntos.';
      } else { feedback.textContent='Intenta otra vez'; feedback.style.color='crimson'; }
    }; choices.appendChild(btn); });
  }
  newBtn.addEventListener('click', newRound); newRound();
}


// ------------------ Letter guess game ------------------
function initLetterGame(){
  const items = [
    {img:'Manzana', letter:'A'},
    {img:'Beso', letter:'B'},
    {img:'Casa', letter:'C'},
    {img:'Dado', letter:'D'},
    {img:'Elefante', letter:'E'}
  ];
  const prompt = $('prompt'); const choices = $('letterChoices'); const fb = $('feedback');
  function newRound(){
    fb.textContent=''; choices.innerHTML='';
    const item = items[Math.floor(Math.random()*items.length)];
    prompt.innerHTML = '<h3>'+item.img+'</h3><p class="small">¿Qué letra inicia esta palabra?</p>';
    const letters = shuffle([item.letter, String.fromCharCode(65 + Math.floor(Math.random()*26)), String.fromCharCode(65 + Math.floor(Math.random()*26))]);
    letters.forEach(l=>{ const b=document.createElement('button'); b.textContent=l; b.onclick=()=>{
      if(l===item.letter){ fb.textContent='¡Bien! +5 puntos'; fb.style.color='green'; const added=addPoints(5,'games','game_letter'); if(!added) fb.textContent='¡Bien! Regístrate para guardar puntos.';
      } else { fb.textContent='No es correcto'; fb.style.color='crimson'; }
    }; choices.appendChild(b); });
  }
  newRound();
}

// ------------------ Memory game ------------------
function initMemoryGame(){
  const icons = ['🐶','🐱','🐭','🐸','🐵','🦊','🐯','🐻'];
  const grid = $('grid'); const fb = $('feedback');
  let deck = shuffle(icons.concat(icons)).slice(0,8*1); // 8 pairs
  deck = shuffle(deck.concat(deck)).slice(0,16);
  grid.innerHTML='';
  let first=null, second=null, lock=false, matches=0;
  deck.forEach((icon,i)=>{
    const card = document.createElement('button'); card.className='card'; card.textContent='?'; card.style.fontSize='28px'; card.dataset.icon=icon;
    card.addEventListener('click', ()=>{
      if(lock || card===first || card.classList.contains('matched')) return;
      card.textContent = card.dataset.icon;
      if(!first){ first=card; return; }
      second=card; lock=true;
      if(first.dataset.icon === second.dataset.icon){
        first.classList.add('matched'); second.classList.add('matched'); matches++;
        first=null; second=null; lock=false;
        if(matches===8){ fb.textContent='¡Ganaste! +10 puntos'; const added=addPoints(10,'games','game_memory'); if(!added) fb.textContent='¡Ganaste! Regístrate para guardar puntos.'; }
      } else {
        setTimeout(()=>{ first.textContent='?'; second.textContent='?'; first=null; second=null; lock=false; }, 700);
      }
    });
    grid.appendChild(card);
  });
}

// ------------------ Book (v2) ------------------
function initBook_v2(){
  // choose pages based on filename
  const pageEl = $('page');
  const file = location.pathname.split('/').pop();
  const pagesMap = {
    'book1.html': ['Había una vez un conejito que vivía en el bosque.','Un día encontró una flor brillante.','Fin. ¡Gracias por leer!'],
    'book2.html': ['Una estrella soñaba con brillar en el cielo.','La estrella ayudó a sus amigos en la noche.','Fin. ¡Dulces sueños!'],
    'book3.html': ['La tortuga era lenta pero muy sabia.','Aprendió que la paciencia trae amigos.','Fin. ¡Hasta la próxima!']
  };
  const pages = pagesMap[file] || ['Historia','...','Fin'];
  let idx=0;
  const prev = $('prev'); const next = $('next'); const fb = document.getElementById('feedback') || document.querySelector('.feedback');
  function render(){ pageEl.innerHTML = '<p>'+pages[idx]+'</p>'; }
  prev.addEventListener('click', ()=>{ if(idx>0) idx--; render(); });
  next.addEventListener('click', ()=>{ if(idx<pages.length-1) idx++; render(); });
  render();
}

// ------------- helpers --------------
function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]] } return arr }
