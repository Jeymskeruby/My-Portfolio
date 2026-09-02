/**
 * mock-firebase.js
 * ------------------------------------------------------------------
 * A drop-in, offline replacement for the Firebase Auth + Firestore
 * compat SDK, built for a PORTFOLIO DEMO of iServe.
 *
 * Why this exists:
 *  The real app talks to a live Firebase project. For a portfolio
 *  showcase we don't want to ship real credentials or depend on a
 *  live backend. This file re-implements just enough of the
 *  firebase.auth() / firebase.firestore() API surface (chainable
 *  where/orderBy/limit/get/doc/add/set/update/delete/onSnapshot,
 *  plus email/password auth) so the ORIGINAL app code runs unmodified.
 *
 *  Data is persisted to localStorage so it survives navigation
 *  between the separate HTML pages (this is a multi-page app, not
 *  an SPA). Call `resetIServeDemoData()` from the console, or use
 *  the "Reset Demo Data" button injected into the header, to restore
 *  the seeded starting state.
 * ------------------------------------------------------------------
 */
(function (global) {
  'use strict';

  const DB_KEY = 'iserve_demo_db_v1';
  const SESSION_KEY = 'iserve_demo_session_v1';

  // ---------- small utilities ----------
  function uid(prefix) {
    return prefix + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj, replacer), reviver);
  }

  // Custom markers so Timestamps / Dates survive JSON <-> localStorage round trips
  function replacer(key, value) {
    if (value instanceof Timestamp) return { __t: 'timestamp', seconds: Math.floor(value.ms / 1000), ms: value.ms };
    if (value instanceof Date) return { __t: 'timestamp', seconds: Math.floor(value.getTime() / 1000), ms: value.getTime() };
    return value;
  }
  function reviver(key, value) {
    if (value && typeof value === 'object' && value.__t === 'timestamp') {
      return new Timestamp(value.ms);
    }
    return value;
  }

  class Timestamp {
    constructor(ms) { this.ms = ms; this.seconds = Math.floor(ms / 1000); this.nanoseconds = 0; }
    toDate() { return new Date(this.ms); }
    toMillis() { return this.ms; }
    static now() { return new Timestamp(Date.now()); }
    static fromDate(d) { return new Timestamp(d.getTime()); }
  }

  // FieldValue sentinels
  class FVServerTimestamp {}
  class FVIncrement { constructor(n) { this.n = n; } }
  class FVArrayUnion { constructor(items) { this.items = items; } }
  class FVArrayRemove { constructor(items) { this.items = items; } }

  function toStorable(value) {
    if (value instanceof Date) return Timestamp.fromDate(value);
    if (Array.isArray(value)) return value.map(toStorable);
    if (value && typeof value === 'object' && !(value instanceof Timestamp) &&
        !(value instanceof FVServerTimestamp) && !(value instanceof FVIncrement) &&
        !(value instanceof FVArrayUnion) && !(value instanceof FVArrayRemove)) {
      const out = {};
      for (const k in value) out[k] = toStorable(value[k]);
      return out;
    }
    return value;
  }

  function applyFieldValues(newData, existing) {
    const out = { ...existing };
    for (const key in newData) {
      const v = newData[key];
      if (v instanceof FVServerTimestamp) {
        out[key] = Timestamp.now();
      } else if (v instanceof FVIncrement) {
        out[key] = (typeof out[key] === 'number' ? out[key] : 0) + v.n;
      } else if (v instanceof FVArrayUnion) {
        const arr = Array.isArray(out[key]) ? out[key].slice() : [];
        v.items.forEach(item => { if (!arr.some(x => JSON.stringify(x) === JSON.stringify(item))) arr.push(item); });
        out[key] = arr;
      } else if (v instanceof FVArrayRemove) {
        const arr = Array.isArray(out[key]) ? out[key].slice() : [];
        out[key] = arr.filter(x => !v.items.some(item => JSON.stringify(item) === JSON.stringify(x)));
      } else {
        out[key] = toStorable(v);
      }
    }
    return out;
  }

  function getField(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }

  function toComparable(v) {
    if (v instanceof Timestamp) return v.ms;
    if (v instanceof Date) return v.getTime();
    return v;
  }

  function compare(fieldVal, op, target) {
    const a = toComparable(fieldVal);
    const b = toComparable(target);
    switch (op) {
      case '==': return JSON.stringify(a) === JSON.stringify(b);
      // Real Firestore excludes documents that don't have the field at all.
      case '!=': return fieldVal !== undefined && JSON.stringify(a) !== JSON.stringify(b);
      case '>': return a > b;
      case '>=': return a >= b;
      case '<': return a < b;
      case '<=': return a <= b;
      case 'array-contains': return Array.isArray(fieldVal) && fieldVal.includes(target);
      case 'array-contains-any': return Array.isArray(fieldVal) && target.some(t => fieldVal.includes(t));
      case 'in': return Array.isArray(target) && target.includes(fieldVal);
      case 'not-in': return Array.isArray(target) && !target.includes(fieldVal);
      default: return true;
    }
  }

  // ---------- persistent store ----------
  let DB = null;
  let listeners = {}; // collectionName -> Set(callback)

  function loadDB() {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      try { return JSON.parse(raw, reviver); } catch (e) { console.warn('Mock DB parse failed, reseeding', e); }
    }
    const seeded = (typeof global.__ISERVE_SEED__ === 'function') ? global.__ISERVE_SEED__(Timestamp) : {};
    persist(seeded);
    return seeded;
  }

  function persist(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db, replacer));
  }

  function getDB() {
    if (!DB) DB = loadDB();
    return DB;
  }

  function save() { persist(DB); }

  function notify(collectionName) {
    const set = listeners[collectionName];
    if (set) set.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
  }

  global.resetIServeDemoData = function () {
    // Full wipe: this clears the mock database, the mock auth session, AND
    // every app-level flag the original code stores directly in localStorage
    // (isAdmin, organizerUser, userId, userEmail, pendingJoinEventId, etc.).
    // A partial clear can leave the app "logged in" from the header's point
    // of view even after the underlying account is gone, so we clear
    // everything and let the app rebuild from a clean slate.
    localStorage.clear();
    DB = loadDB();
    Object.keys(listeners).forEach(notify);
    fireAuthListeners();
    console.log('iServe demo data reset — all local state cleared.');
  };

  // ---------- Firestore-like snapshot helpers ----------
  function makeDocSnapshot(collectionName, id, data) {
    return {
      id,
      exists: data !== undefined,
      data: () => (data === undefined ? undefined : deepClone(data)),
      ref: new DocRef(collectionName, id)
    };
  }

  function makeQuerySnapshot(collectionName, entries) {
    const docs = entries.map(([id, data]) => makeDocSnapshot(collectionName, id, data));
    return {
      docs,
      size: docs.length,
      empty: docs.length === 0,
      forEach: (cb) => docs.forEach(cb)
    };
  }

  // ---------- DocRef ----------
  class DocRef {
    constructor(collectionName, id) {
      this.collectionName = collectionName;
      this.id = id;
    }
    async get() {
      const col = getDB()[this.collectionName] || {};
      return makeDocSnapshot(this.collectionName, this.id, col[this.id]);
    }
    async set(data, opts) {
      const db = getDB();
      db[this.collectionName] = db[this.collectionName] || {};
      const existing = (opts && opts.merge) ? (db[this.collectionName][this.id] || {}) : {};
      db[this.collectionName][this.id] = applyFieldValues(data, existing);
      save();
      notify(this.collectionName);
      return undefined;
    }
    async update(data) {
      const db = getDB();
      db[this.collectionName] = db[this.collectionName] || {};
      const existing = db[this.collectionName][this.id] || {};
      db[this.collectionName][this.id] = applyFieldValues(data, existing);
      save();
      notify(this.collectionName);
      return undefined;
    }
    async delete() {
      const db = getDB();
      if (db[this.collectionName]) delete db[this.collectionName][this.id];
      save();
      notify(this.collectionName);
      return undefined;
    }
    collection() {
      // Sub-collections aren't used by this app; return an empty-safe stub.
      return new Query(this.collectionName + '/' + this.id + '/_sub');
    }
    onSnapshot(onNext, onError) {
      const fire = async () => {
        try { await onNext(await this.get()); } catch (e) { if (onError) onError(e); else console.error(e); }
      };
      setTimeout(fire, 0);
      listeners[this.collectionName] = listeners[this.collectionName] || new Set();
      listeners[this.collectionName].add(fire);
      return () => listeners[this.collectionName].delete(fire);
    }
  }

  // ---------- Query ----------
  class Query {
    constructor(collectionName, filters, orderByField, orderDir, limitN) {
      this.collectionName = collectionName;
      this.filters = filters || [];
      this.orderByField = orderByField || null;
      this.orderDir = orderDir || 'asc';
      this.limitN = limitN || null;
    }
    where(field, op, value) {
      return new Query(this.collectionName, [...this.filters, { field, op, value }], this.orderByField, this.orderDir, this.limitN);
    }
    orderBy(field, dir) {
      return new Query(this.collectionName, this.filters, field, dir || 'asc', this.limitN);
    }
    limit(n) {
      return new Query(this.collectionName, this.filters, this.orderByField, this.orderDir, n);
    }
    doc(id) {
      return new DocRef(this.collectionName, id || uid(this.collectionName));
    }
    async add(data) {
      const db = getDB();
      db[this.collectionName] = db[this.collectionName] || {};
      const id = uid(this.collectionName);
      db[this.collectionName][id] = applyFieldValues(data, {});
      save();
      notify(this.collectionName);
      return new DocRef(this.collectionName, id);
    }
    _entries() {
      const col = getDB()[this.collectionName] || {};
      let entries = Object.keys(col).map(id => [id, col[id]]);
      for (const f of this.filters) {
        entries = entries.filter(([, data]) => compare(getField(data, f.field), f.op, f.value));
      }
      if (this.orderByField) {
        const field = this.orderByField;
        // Real Firestore omits documents missing the orderBy field.
        entries = entries.filter(([, data]) => getField(data, field) !== undefined);
        entries.sort((a, b) => {
          const av = toComparable(getField(a[1], field));
          const bv = toComparable(getField(b[1], field));
          if (av === bv) return 0;
          const cmp = av > bv ? 1 : -1;
          return this.orderDir === 'desc' ? -cmp : cmp;
        });
      }
      if (this.limitN != null) entries = entries.slice(0, this.limitN);
      return entries;
    }
    async get() {
      return makeQuerySnapshot(this.collectionName, this._entries());
    }
    onSnapshot(onNext, onError) {
      const fire = async () => {
        // await so a rejection from an async onNext reaches onError instead of
        // becoming an unhandled promise rejection in the console.
        try { await onNext(makeQuerySnapshot(this.collectionName, this._entries())); }
        catch (e) { if (onError) onError(e); else console.error(e); }
      };
      setTimeout(fire, 0);
      listeners[this.collectionName] = listeners[this.collectionName] || new Set();
      listeners[this.collectionName].add(fire);
      return () => listeners[this.collectionName].delete(fire);
    }
  }

  // ---------- WriteBatch ----------
  class WriteBatch {
    constructor() { this.ops = []; }
    set(ref, data, opts) { this.ops.push({ type: 'set', ref, data, opts }); return this; }
    update(ref, data) { this.ops.push({ type: 'update', ref, data }); return this; }
    delete(ref) { this.ops.push({ type: 'delete', ref }); return this; }
    async commit() {
      const db = getDB();
      const touched = new Set();
      for (const op of this.ops) {
        db[op.ref.collectionName] = db[op.ref.collectionName] || {};
        const col = db[op.ref.collectionName];
        if (op.type === 'set') {
          const existing = (op.opts && op.opts.merge) ? (col[op.ref.id] || {}) : {};
          col[op.ref.id] = applyFieldValues(op.data, existing);
        } else if (op.type === 'update') {
          const existing = col[op.ref.id] || {};
          col[op.ref.id] = applyFieldValues(op.data, existing);
        } else if (op.type === 'delete') {
          delete col[op.ref.id];
        }
        touched.add(op.ref.collectionName);
      }
      save();
      touched.forEach(notify);
      return undefined;
    }
  }

  // ---------- Firestore root ----------
  function firestore() {
    return {
      collection(name) { return new Query(name); },
      batch() { return new WriteBatch(); },
    };
  }
  firestore.FieldValue = {
    serverTimestamp: () => new FVServerTimestamp(),
    increment: (n) => new FVIncrement(n),
    arrayUnion: (...items) => new FVArrayUnion(items),
    arrayRemove: (...items) => new FVArrayRemove(items),
  };
  firestore.Timestamp = Timestamp;

  // ---------- Auth ----------
  function authCollection() {
    const db = getDB();
    db.__authUsers = db.__authUsers || {};
    return db.__authUsers;
  }

  function makeUser(record) {
    return {
      uid: record.uid,
      email: record.email,
      displayName: record.displayName || null,
      // Guarded: the account may have been deleted earlier in the session.
      get emailVerified() { return !!(authCollection()[record.uid] || {}).emailVerified; },
      async updateProfile(data) {
        const users = authCollection();
        users[record.uid] = { ...users[record.uid], ...data };
        save();
      },
      // Simulated re-auth: real Firebase verifies the supplied credential
      // before a sensitive change. Here we just compare the stored password.
      async reauthenticateWithCredential(credential) {
        const users = authCollection();
        const rec = users[record.uid];
        if (!rec || (credential && credential.password !== rec.password)) {
          const err = new Error('The current password is incorrect.');
          err.code = 'auth/wrong-password';
          throw err;
        }
        return { user: makeUser(rec) };
      },
      async updatePassword(newPassword) {
        const users = authCollection();
        if (!users[record.uid]) {
          const err = new Error('No current user.');
          err.code = 'auth/no-current-user';
          throw err;
        }
        if (!newPassword || String(newPassword).length < 6) {
          const err = new Error('Password should be at least 6 characters.');
          err.code = 'auth/weak-password';
          throw err;
        }
        users[record.uid].password = newPassword;
        save();
      },
      async sendEmailVerification() {
        // Simulated: in the real flow this sends an email with a link.
        // Here we just mark that verification has been "requested";
        // reload() below simulates the user having clicked the link.
        return undefined;
      },
      async reload() {
        // Simulated verification: since there's no real inbox in a demo,
        // clicking "Check verification" (which calls reload()) simulates
        // the user having verified their email.
        const users = authCollection();
        if (users[record.uid]) {
          users[record.uid].emailVerified = true;
          save();
        }
      },
      async delete() {
        const users = authCollection();
        delete users[record.uid];
        if (getSessionUid() === record.uid) setSessionUid(null);
        save();
      }
    };
  }

  function getSessionUid() {
    return localStorage.getItem(SESSION_KEY) || null;
  }
  function setSessionUid(uidVal) {
    if (uidVal) localStorage.setItem(SESSION_KEY, uidVal);
    else localStorage.removeItem(SESSION_KEY);
    fireAuthListeners();
  }

  let authListeners = [];
  function fireAuthListeners() {
    const uidVal = getSessionUid();
    const users = authCollection();
    const user = uidVal && users[uidVal] ? makeUser(users[uidVal]) : null;
    authListeners.forEach(({ onNext }) => {
      try { onNext(user); } catch (e) { console.error(e); }
    });
  }

  function auth() {
    return {
      get currentUser() {
        const uidVal = getSessionUid();
        const users = authCollection();
        return (uidVal && users[uidVal]) ? makeUser(users[uidVal]) : null;
      },
      async signInWithEmailAndPassword(email, password) {
        const users = authCollection();
        const found = Object.values(users).find(u => u.email.toLowerCase() === String(email).toLowerCase());
        if (!found) {
          const err = new Error('There is no account with this email.');
          err.code = 'auth/user-not-found';
          throw err;
        }
        if (found.password !== password) {
          const err = new Error('Incorrect password.');
          err.code = 'auth/wrong-password';
          throw err;
        }
        setSessionUid(found.uid);
        return { user: makeUser(found) };
      },
      async createUserWithEmailAndPassword(email, password) {
        const users = authCollection();
        const exists = Object.values(users).find(u => u.email.toLowerCase() === String(email).toLowerCase());
        if (exists) {
          const err = new Error('This email is already registered.');
          err.code = 'auth/email-already-in-use';
          throw err;
        }
        const newUid = uid('user');
        users[newUid] = { uid: newUid, email, password, emailVerified: false, displayName: null };
        save();
        setSessionUid(newUid);
        return { user: makeUser(users[newUid]) };
      },
      async signOut() {
        setSessionUid(null);
      },
      async sendPasswordResetEmail() {
        // Simulated no-op for the demo.
        return undefined;
      },
      onAuthStateChanged(onNext, onError) {
        const entry = { onNext, onError };
        authListeners.push(entry);
        const uidVal = getSessionUid();
        const users = authCollection();
        const user = (uidVal && users[uidVal]) ? makeUser(users[uidVal]) : null;
        setTimeout(() => onNext(user), 0);
        return () => { authListeners = authListeners.filter(l => l !== entry); };
      }
    };
  }

  // firebase.auth.EmailAuthProvider.credential(email, password) — used by the
  // profile "change password" flow before reauthenticateWithCredential().
  auth.EmailAuthProvider = {
    credential(email, password) {
      return { providerId: 'password', email: email, password: password };
    }
  };

  // ---------- global firebase namespace ----------
  const firebaseMock = {
    apps: [],
    initializeApp(config) {
      firebaseMock.apps.push(config || {});
      return {};
    },
    auth,
    firestore,
  };

  global.firebase = firebaseMock;

})(window);
