import { auth, db } from '../firebase/firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

/* ── TOAST ──────────────────────────────────────────── */
const _tw = document.createElement('div');
_tw.id = 'toast-wrap';
document.body.appendChild(_tw);
export function toast(msg, type='info', ms=3000){
  const icons = { ok:'✅', err:'❌', warn:'⚠️', info:'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  _tw.appendChild(el);
  setTimeout(()=>{ el.style.animation='tOut .28s ease forwards'; setTimeout(()=>el.remove(),300); }, ms);
}

/* ── LOADER ─────────────────────────────────────────── */
const _ld = document.createElement('div');
_ld.id = 'gloader';
_ld.innerHTML = `<div class="sp"></div>`;
document.body.appendChild(_ld);
export function showLoader(){ _ld.style.display='flex'; }
export function hideLoader(){ _ld.style.display='none'; }

/* ── FORMAT ─────────────────────────────────────────── */
export const bdt = n => '৳' + parseFloat(n||0).toFixed(2);
export function ago(ts){
  if(!ts) return '–';
  const ms = Date.now() - (ts.seconds ? ts.seconds*1000 : +ts);
  const m = Math.floor(ms/60000);
  if(m<1) return 'Just now';
  if(m<60) return m+'m ago';
  const h = Math.floor(m/60);
  if(h<24) return h+'h ago';
  return Math.floor(h/24)+'d ago';
}
export function fmtDate(ts){
  if(!ts) return '–';
  const d = ts.toDate ? ts.toDate() : new Date((ts.seconds||0)*1000);
  return d.toLocaleDateString('en-BD',{day:'numeric',month:'short',year:'numeric'});
}

/* ── MODAL ──────────────────────────────────────────── */
export const openModal  = id => document.getElementById(id)?.classList.add('open');
export const closeModal = id => document.getElementById(id)?.classList.remove('open');

/* ── ADMIN AUTH GUARD ───────────────────────────────────
   Admin verification uses a SEPARATE "admins" collection.
   Process:
   Step 1: onAuthStateChanged fires ONCE → get user.uid
   Step 2: Check Firestore admins/{uid} document exists
   Step 3: If exists → cb(user, adminData)
           If not   → "Access Denied" → redirect login
──────────────────────────────────────────────────────── */
export function requireAdmin(cb){
  const unsub = onAuthStateChanged(auth, async user => {
    unsub(); /* single-fire — prevents repeat triggers */

    if(!user){
      location.replace('login.html');
      return;
    }

    try {
      /* Check admins collection first */
      const adminSnap = await getDoc(doc(db,'admins', user.uid));
      if(adminSnap.exists()){
        cb(user, adminSnap.data());
        return;
      }

      /* Fallback: check users collection role field */
      const userSnap = await getDoc(doc(db,'users', user.uid));
      const userData = userSnap.data();
      if(userData && userData.role === 'admin'){
        cb(user, userData);
        return;
      }

      /* Not admin */
      location.replace('login.html');
    } catch(e){
      console.error('Admin check failed:', e);
      location.replace('login.html');
    }
  });
}

/* ── MOBILE SIDEBAR ─────────────────────────────────── */
export function initMobileSidebar(){
  const btn     = document.getElementById('menuBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobileOverlay');
  if(!btn) return;
  btn.addEventListener('click', ()=>{
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });
  overlay?.addEventListener('click', ()=>{
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });
}
