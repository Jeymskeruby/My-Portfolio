/* ============================= STORAGE LAYER ============================= */
// Portfolio-demo storage layer.
// The prototype persisted through `window.storage` — an async host key/value
// API with NO browser fallback (see Demo/Problems.txt #50). This swaps it for
// localStorage: the whole DB lives under ONE versioned JSON key; skGet /
// skSet / loadDB stay async so every `await` call site is unchanged; a
// try/catch in-memory fallback keeps the app usable (without persistence)
// when storage is blocked (private browsing) or full (quota exceeded).
const DB_KEY = 'relay_demo_db_v1';

const KEYS = ['users','tickets','messages','kb_articles','canned_responses','routing_rules','sla_config','audit_log','viewers','meta','status','teams','categories','priority_matrix','notifications'];
let DB = {users:[],tickets:[],messages:[],kb_articles:[],canned_responses:[],routing_rules:[],sla_config:{},audit_log:[],viewers:{},meta:{},status:{},teams:[],categories:[],priority_matrix:{},notifications:[]};

// Non-null once we detect localStorage is unavailable/unwritable; from then
// on the whole DB lives here and nothing is persisted (we warn once).
let __memStore = null;
let __warnedNoPersist = false;

function __readRoot(){
  if(__memStore) return __memStore;
  try{
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : {};
  }catch(e){
    __memStore = {};              // access denied or corrupt JSON
    return __memStore;
  }
}

function __writeRoot(root){
  if(__memStore){ __memStore = root; return; }
  try{
    localStorage.setItem(DB_KEY, JSON.stringify(root));
  }catch(e){
    console.error('localStorage write failed; continuing in-memory only', e);
    __memStore = root;            // quota exceeded or private-mode write block
    if(!__warnedNoPersist && typeof showToast === 'function'){
      __warnedNoPersist = true;
      showToast('Storage is unavailable (private browsing?) — changes won’t persist after you close this tab.', 'warn');
    }
  }
}

async function skGet(key, fallback){
  const root = __readRoot();
  return (root && Object.prototype.hasOwnProperty.call(root, key) && root[key] !== undefined)
    ? root[key]
    : fallback;
}

async function skSet(key, value){
  const root = __readRoot();
  root[key] = value;
  __writeRoot(root);
  DB[key] = value;                // keep the in-memory copy in lock-step
}

async function loadDB(){
  for(const k of KEYS){
    DB[k] = await skGet(k, DB[k]);
  }
}

function uid(prefix){ return prefix + Math.random().toString(36).slice(2,9); }
function nowTs(){ return Date.now(); }

