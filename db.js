/* Folio storage — browser IndexedDB, with a clearly identified localStorage fallback
   for browsers that disable IndexedDB in local file previews / private contexts.
   All IndexedDB writes resolve ONLY when the encompassing transaction completes. */
(() => {
  'use strict';
  const DB_NAME = 'folio-personal-library';
  const DB_VERSION = 2;
  const FALLBACK_KEY = 'folio-library-fallback-v2';
  let db = null;
  let mode = 'indexeddb';

  function request(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || Error('Database request failed'));
    });
  }
  function txDone(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error || Error('Database transaction aborted'));
      tx.onerror = () => reject(tx.error || Error('Database transaction failed'));
    });
  }
  function connection() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains('books')) {
          const s = d.createObjectStore('books', {keyPath: 'id'});
          s.createIndex('isbn', 'isbn', {unique:false});
          s.createIndex('status', 'status', {unique:false});
          s.createIndex('addedAt', 'addedAt', {unique:false});
        }
        if (!d.objectStoreNames.contains('shelves')) d.createObjectStore('shelves', {keyPath:'name'});
        if (!d.objectStoreNames.contains('tombstones')) d.createObjectStore('tombstones', {keyPath:'id'});
        if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta', {keyPath:'key'});
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || Error('Could not open IndexedDB'));
      req.onblocked = () => reject(Error('A different tab has the database open for upgrading.'));
    });
  }
  function fallbackLoad() {
    const str = localStorage.getItem(FALLBACK_KEY);
    if (!str) return {initialized:false,books:[],shelves:[],tombstones:[]};
    const data = JSON.parse(str);
    return {initialized:true,books:data.books||[],shelves:data.shelves||[],tombstones:data.tombstones||[]};
  }
  function fallbackMutate(fn) {
    const current = fallbackLoad();
    fn(current);
    localStorage.setItem(FALLBACK_KEY, JSON.stringify({...current,initialized:true}));
  }
  async function init() {
    try {
      if (!('indexedDB' in window)) throw Error('IndexedDB is unavailable');
      db = await connection();
      db.onversionchange = () => {db.close(); db=null;};
      // Some privacy modes allow opening but not actually writing.
      const tx = db.transaction('meta','readwrite');
      tx.objectStore('meta').put({key:'health-check',value:true});
      await txDone(tx);
      mode = 'indexeddb';
    } catch (err) {
      if (db) db.close();
      db = null;
      mode = 'fallback';
      // Do not discard the cause; the UI explains reduced storage reliability.
      console.warn('Folio: IndexedDB unavailable, localStorage fallback in use.',err);
    }
    return mode;
  }
  async function load() {
    if (!db) return fallbackLoad();
    const tx = db.transaction(['books','shelves','tombstones','meta'],'readonly');
    const completed=txDone(tx);
    const result = await Promise.all([
      request(tx.objectStore('books').getAll()),
      request(tx.objectStore('shelves').getAll()),
      request(tx.objectStore('tombstones').getAll()),
      request(tx.objectStore('meta').get('initialized')),
    ]);
    await completed;
    return {books:result[0],shelves:result[1].map(x=>x.name),tombstones:result[2],initialized:!!result[3]};
  }
  async function putBook(book) {
    if (!db) return fallbackMutate(d=>{d.books=d.books.filter(x=>x.id!==book.id);d.books.push(book);});
    const tx=db.transaction(['books','meta'],'readwrite');
    tx.objectStore('books').put(book);
    tx.objectStore('meta').put({key:'initialized',value:true});
    await txDone(tx);
  }
  async function removeBook(id,tombstone) {
    if (!db) return fallbackMutate(d=>{d.books=d.books.filter(x=>x.id!==id);d.tombstones=d.tombstones.filter(x=>x.id!==id);d.tombstones.push(tombstone);});
    const tx=db.transaction(['books','tombstones'],'readwrite');
    tx.objectStore('books').delete(id);
    tx.objectStore('tombstones').put(tombstone);
    await txDone(tx);
  }
  async function writeShelves(shelves) {
    if (!db) return fallbackMutate(d=>{d.shelves=[...shelves]});
    const tx=db.transaction('shelves','readwrite');
    const store=tx.objectStore('shelves');store.clear();
    for (const name of shelves) store.put({name});
    await txDone(tx);
  }
  async function writeBooksAndShelves(books,shelves) {
    if (!db) return fallbackMutate(d=>{d.books=books;d.shelves=shelves;});
    const tx=db.transaction(['books','shelves'],'readwrite');
    const b=tx.objectStore('books');const s=tx.objectStore('shelves');
    b.clear();s.clear();
    for (const book of books) b.put(book);
    for (const name of shelves) s.put({name});
    await txDone(tx);
  }
  async function replaceAll(books,shelves,tombstones=[]) {
    if (!db) {
      localStorage.setItem(FALLBACK_KEY,JSON.stringify({initialized:true,books,shelves,tombstones}));
      return;
    }
    const tx=db.transaction(['books','shelves','tombstones','meta'],'readwrite');
    const b=tx.objectStore('books'),s=tx.objectStore('shelves'),t=tx.objectStore('tombstones');
    b.clear();s.clear();t.clear();
    for (const book of books) b.put(book);
    for (const name of shelves) s.put({name});
    for (const item of tombstones) t.put(item);
    tx.objectStore('meta').put({key:'initialized',value:true});
    await txDone(tx);
  }
  window.FolioDB = {init,load,putBook,removeBook,writeShelves,writeBooksAndShelves,replaceAll,get mode(){return mode}};
})();
