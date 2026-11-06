/* Folio v2 — offline-first personal library. HTML, CSS, and vanilla JS only. */
(() => {
  'use strict';
  const STORAGE_KEY = 'folio-prototype-v1'; // legacy v1 migration only
  const ACCENT_KEY = 'folio-accent';
  const ACCENTS = ['forest','ocean','violet','terracotta','rose','amber'];
  const pref=(key,def)=>{try{return localStorage.getItem(key)||def}catch{return def}};
  const setPref=(key,value)=>{try{localStorage.setItem(key,value)}catch{}};
  const THEME_KEY = 'folio-theme';
  const DEFAULT_SHELVES = ['Fiction', 'Non-fiction', 'Work & study', 'Favorites', 'To buy'];
  const STATUSES = [
    ['to-read','To read'], ['reading','Reading'], ['completed','Finished'],
    ['paused','On hold'], ['abandoned','Abandoned']
  ];
  const icon = (name, cls='') => `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  const h = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const plain = value => String(value ?? '').trim();
  const id = () => (globalThis.crypto?.randomUUID?.() || `book-${Date.now()}-${Math.floor(Math.random()*1e8)}`);
  const money = n => new Intl.NumberFormat('en-BE',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(Number(n)||0);
  const formatDate = d => {const t=new Date(d);return Number.isNaN(t.getTime())?'Unknown date':t.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})};
  const bookCover = slug => `assets/covers/${slug}.svg`;
  const placeholderCover = title => {
    const words = String(title||'BOOK').split(/\s+/).slice(0,3).map(w=>w.slice(0,13));
    const body = words.map((w,i)=>`<text x="140" y="${140+i*32}" text-anchor="middle" font-family="Georgia,serif" fill="%23f7f9ef" font-size="25">${encodeURIComponent(w.replace(/[&<>]/g,''))}</text>`).join('');
    return `data:image/svg+xml,${'%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 400"%3E%3Crect width="280" height="400" fill="%23385a4b"/%3E%3Ccircle cx="220" cy="280" r="95" fill="%23466f58"/%3E'}${body}%3C/svg%3E`;
  };
  const safeSrc = (value, title) => {
    const u = plain(value);
    if (/^assets\/covers\/[a-z0-9-]+\.svg$/i.test(u)) return bookCover(u.split('/').pop().replace(/\.svg$/i,''));
    if (/^(https?:\/\/|data:image\/(?:png|jpeg|webp|gif|svg\+xml);base64,)/i.test(u)) return u;
    return placeholderCover(title);
  };
  const cover = (b, cls='book-cover') => `<img class="${cls}" loading="lazy" src="${h(safeSrc(b.cover,b.title))}" alt="Cover illustration for ${h(b.title)}" data-cover-title="${h(b.title)}">`;
  const statusName = s => STATUSES.find(x=>x[0]===s)?.[1] || 'To read';
  const statusPill = s => `<span class="status-chip ${h(s)}">${h(statusName(s))}</span>`;
  const priceText = b => b.price===null||b.price===undefined||b.price===''?'—':money(b.price);
  const pct = b => b.pages>0 ? Math.max(0,Math.min(100,Math.round((Number(b.currentPage)||0)/b.pages*100))) : 0;
  const splitTags = s => Array.isArray(s) ? s.map(plain).filter(Boolean) : String(s||'').split(',').map(plain).filter(Boolean);
  const sample = [
    {slug:'atomic-habits',title:'Atomic Habits',author:'James Clear',isbn:'9780735211292',year:2018,genre:'Self-improvement',shelf:'Non-fiction',price:18.90,status:'reading',pages:320,currentPage:201,description:'Practical ideas for building better habits through small, consistent changes.',tags:['Habits','Personal growth'],notes:['Start with a habit that takes less than two minutes.']},
    {slug:'dune',title:'Dune',author:'Frank Herbert',isbn:'9780441172719',year:1965,genre:'Science fiction',shelf:'Fiction',price:16.50,status:'reading',pages:688,currentPage:248,description:'On the desert planet Arrakis, political intrigue and destiny collide.',tags:['Sci-fi','Classic'],notes:[]},
    {slug:'1984',title:'1984',author:'George Orwell',isbn:'9780451524935',year:1949,genre:'Dystopia',shelf:'Fiction',price:12.20,status:'completed',pages:328,currentPage:328,description:'A classic exploration of surveillance, truth, and authoritarian power.',tags:['Classic','Politics'],notes:['The relationship between language and power is especially interesting.']},
    {slug:'clean-code',title:'Clean Code',author:'Robert C. Martin',isbn:'9780132350884',year:2008,genre:'Programming',shelf:'Work & study',price:37.90,status:'to-read',pages:464,currentPage:0,description:'A handbook of readable, maintainable software craftsmanship.',tags:['Software','Learning'],notes:[]},
    {slug:'sapiens',title:'Sapiens',author:'Yuval Noah Harari',isbn:'9780062316097',year:2015,genre:'History',shelf:'Non-fiction',price:22.00,status:'completed',pages:464,currentPage:464,description:'A sweeping exploration of humanity and the stories that connect us.',tags:['History'],notes:[]},
    {slug:'deep-work',title:'Deep Work',author:'Cal Newport',isbn:'9781455586691',year:2016,genre:'Productivity',shelf:'Non-fiction',price:17.95,status:'paused',pages:304,currentPage:88,description:'How to focus without distraction on cognitively demanding work.',tags:['Focus','Study'],notes:['Try two distraction-free study blocks per day.']},
    {slug:'the-hobbit',title:'The Hobbit',author:'J. R. R. Tolkien',isbn:'9780547928227',year:1937,genre:'Fantasy',shelf:'Fiction',price:14.99,status:'completed',pages:300,currentPage:300,description:'Bilbo Baggins leaves home for an unforgettable adventure.',tags:['Fantasy','Classic'],notes:[]},
    {slug:'psychology-of-money',title:'The Psychology of Money',author:'Morgan Housel',isbn:'9780857197689',year:2020,genre:'Finance',shelf:'Non-fiction',price:19.99,status:'to-read',pages:256,currentPage:0,description:'Timeless lessons about wealth, behavior, and decision-making.',tags:['Finance'],notes:[]},
    {slug:'educated',title:'Educated',author:'Tara Westover',isbn:'9780399590504',year:2018,genre:'Memoir',shelf:'Non-fiction',price:15.49,status:'completed',pages:352,currentPage:352,description:'A memoir about family, independence, and the transformative power of education.',tags:['Memoir'],notes:[]},
    {slug:'pride-prejudice',title:'Pride and Prejudice',author:'Jane Austen',isbn:'9780141439518',year:1813,genre:'Romance',shelf:'Fiction',price:11.50,status:'to-read',pages:480,currentPage:0,description:'A witty, enduring story of class, misunderstanding, and love.',tags:['Classic'],notes:[]},
    {slug:'project-hail-mary',title:'Project Hail Mary',author:'Andy Weir',isbn:'9780593135204',year:2021,genre:'Science fiction',shelf:'Fiction',price:21.99,status:'to-read',pages:496,currentPage:0,description:'An astronaut awakens far from Earth with the fate of humanity at stake.',tags:['Sci-fi'],notes:[]},
    {slug:'midnight-library',title:'The Midnight Library',author:'Matt Haig',isbn:'9780525559474',year:2020,genre:'Contemporary fiction',shelf:'Fiction',price:13.90,status:'abandoned',pages:304,currentPage:77,description:'A library offers endless possible versions of a single life.',tags:['Fiction'],notes:[]},
    {slug:'thinking-fast-slow',title:'Thinking, Fast and Slow',author:'Daniel Kahneman',isbn:'9780374533557',year:2011,genre:'Psychology',shelf:'Work & study',price:24.50,status:'reading',pages:499,currentPage:120,description:'An introduction to two powerful modes of human thinking.',tags:['Psychology','Learning'],notes:[]},
    {slug:'design-everyday',title:'The Design of Everyday Things',author:'Don Norman',isbn:'9780465050659',year:2013,genre:'Design',shelf:'Work & study',price:19.40,status:'to-read',pages:368,currentPage:0,description:'A practical look at human-centered design and everyday usability.',tags:['Design','UX'],notes:[]}
  ].map((b,i)=>({...b,id:`sample-${i}`,cover:bookCover(b.slug),quantity:1,notes:b.notes.map((body,j)=>({id:`note-${i}-${j}`,body,date:'2026-10-21T09:00:00.000Z'})),addedAt:new Date(Date.UTC(2026,9,28-i)).toISOString(),updatedAt:new Date(Date.UTC(2026,9,28-i)).toISOString()}));
  function readSaved(){try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return null;const d=JSON.parse(raw);if(!Array.isArray(d.books))return null;return d}catch{return null}}
  const existing=readSaved();
  const state={books:[],shelves:[...DEFAULT_SHELVES],tombstones:[],pendingImport:null,editingNoteId:null,storageMode:'loading',page:'home',query:'',status:'all',sort:'newest',layout:'grid',filters:{shelf:'all',genre:'all',tag:'all',minYear:'',maxYear:'',minPrice:'',maxPrice:''},dialog:null,detailTab:'overview',formCover:'',lastFocused:null,scanner:null,scanLoop:null};
  let theme=pref(THEME_KEY,'system');
  let accent=pref(ACCENT_KEY,'forest');
  if (!ACCENTS.includes(accent)) accent='forest';
  function applyTheme(){
    const dark=theme==='dark'||(theme==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme=dark?'dark':'light';
    document.documentElement.dataset.accent=accent;
    document.querySelector('.theme-toggle').innerHTML=icon(dark?'sun':'moon');
    document.querySelector('meta[name="theme-color"]').content=dark?'#141c19':'#f7f8f5';
  }
  async function writeBook(book) {
    await FolioDB.putBook(book);
    const index=state.books.findIndex(b=>b.id===book.id);
    if (index>=0) state.books[index]=book; else state.books.unshift(book);
  }
  async function writeShelfSet(shelves) {
    await FolioDB.writeShelves(shelves);
    state.shelves=[...shelves];
  }
  function saveError(err){console.error('Folio storage error:',err);toast('Save failed. Export a backup and check device storage.');}
  function importLegacyBook(b){return normalizeBook(b);}
  async function boot() {
    document.getElementById('view').innerHTML='<div class="loading-page">Opening your library…</div>';
    try {
      state.storageMode=await FolioDB.init();
      const stored=await FolioDB.load();
      if (stored.initialized) {
        state.books=stored.books.map(importLegacyBook);
        state.shelves=stored.shelves;
        state.tombstones=stored.tombstones||[];
      } else {
        state.books=(existing?.books||sample).map(importLegacyBook);
        state.shelves=existing?.shelves||DEFAULT_SHELVES;
        state.tombstones=[];
        await FolioDB.replaceAll(state.books,state.shelves);
      }
      render();
      if (state.storageMode==='fallback') toast('Limited storage mode: use JSON backups regularly.');
      if ('serviceWorker' in navigator && location.protocol!=='file:') {
        navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('Offline cache unavailable:',err));
      }
      if (navigator.storage?.persist && location.protocol!=='file:') {
        // Persist only if browser grants it; failure is not fatal.
        navigator.storage.persist().catch(()=>{});
      }
    } catch(err) {
      console.error(err);
      document.getElementById('view').innerHTML=`<div class="empty-state"><h2>Could not open your library</h2><p>${h(err.message)}</p><p>Check browser storage permissions. Your previous JSON backups are safe.</p></div>`;
    }
  }
  const totals=()=>({count:state.books.length,reading:state.books.filter(b=>b.status==='reading').length,value:state.books.reduce((s,b)=>s+(Number.isFinite(Number(b.price))&&b.price!==null&&b.price!==''?Number(b.price)*(Number(b.quantity)||1):0),0),unknown:state.books.filter(b=>b.price===null||b.price===undefined||b.price==='').length});
  const card=b=>`<article class="book-card" data-book="${h(b.id)}" tabindex="0" role="button" aria-label="Open ${h(b.title)} details"><div class="book-cover-wrap">${cover(b)}</div><div class="book-card-body"><div class="book-title" title="${h(b.title)}">${h(b.title)}</div><div class="book-author">${h(b.author)}</div><div class="book-bottom">${statusPill(b.status)}<span class="book-price">${priceText(b)}</span></div></div></article>`;
  function pageHead(eyebrow,title,subtitle,actions=''){return `<div class="page-head"><div><p class="eyebrow">${eyebrow}</p><h1 class="page-title">${title}</h1><p class="page-subtitle">${subtitle}</p></div>${actions}</div>`}
  function renderHome(){
    const t=totals();const recent=[...state.books].sort((a,b)=>String(b.addedAt).localeCompare(String(a.addedAt))).slice(0,5);
    const curr=state.books.find(b=>b.status==='reading');
    const featured=state.books.slice(0,2);
    return `${pageHead('Your private little universe','Good to have you here.','Every book has a story. This is where yours live.',`<button class="btn btn-primary desktop-add" data-action="add-book">${icon('plus')} Add a book</button>`)}
      <section class="stats-grid" aria-label="Library summary">
       <div class="stat-card"><div class="stat-icon">${icon('library')}</div><div><div class="stat-label">Books in your library</div><div class="stat-value">${t.count}</div></div></div>
       <div class="stat-card"><div class="stat-icon blue">${icon('book-open')}</div><div><div class="stat-label">Currently reading</div><div class="stat-value">${t.reading}</div></div></div>
       <div class="stat-card"><div class="stat-icon alt">${icon('wallet')}</div><div><div class="stat-label">Your collection value</div><div class="stat-value">${money(t.value)}</div>${t.unknown?`<div class="secondary-info">${t.unknown} without prices</div>`:''}</div></div>
      </section>
      <section class="dashboard-main" aria-label="Reading highlights">
        <div class="feature-panel"><div class="feature-copy"><span class="feature-kicker">WELCOME TO FOLIO</span><div class="feature-title">Every great story<br>deserves a place.</div><p>A calm space to keep track of the books that matter to you.</p><button class="btn" data-page="library">Explore library ${icon('arrow-right')}</button></div><div class="feature-books">${featured[0]?cover(featured[0]):''}${featured[1]?cover(featured[1]):''}</div></div>
        <div class="reading-panel"><div class="reading-panel-head"><h3>Continue reading</h3>${icon('book-open')}</div>${curr?`<div class="reading-inline">${cover(curr)}<div style="flex:1;min-width:0"><h3>${h(curr.title)}</h3><p>${h(curr.author)}</p><div class="progress-track"><span style="width:${pct(curr)}%"></span></div><div class="progress-caption"><span>${pct(curr)}% complete</span><span>${Number(curr.currentPage)||0}/${Number(curr.pages)||0} pages</span></div><button data-book="${h(curr.id)}" class="text-link" style="margin-top:10px">Update progress ${icon('arrow-right')}</button></div></div>`:`<p class="empty-line">No books in progress yet.</p><button class="btn btn-secondary" data-page="library">Explore your books</button>`}</div>
      </section>
      <div class="section-heading"><div><h2>Recently added</h2><p>Your newest additions, all in one place</p></div><button class="text-link" data-page="library">View all ${icon('arrow-right')}</button></div>
      ${recent.length?`<div class="books-grid">${recent.map(card).join('')}</div>`:emptyState('No books yet','Add your first book to get started.','add-book','Add a book')}
    `;
  }
  function filterBooks() {
	  
    const input = state.query.trim().toLowerCase();

    // Detect the language operator: l:French
    const languageMatch = input.match(/(?:^|\s)l:(\S+)/);

    // Extract the requested language
    const languageQuery = languageMatch ? languageMatch[1] : "";

    // Remove the language operator from normal search
    const q = languageMatch
        ? input.replace(languageMatch[0], "").trim()
        : input;

    const f = state.filters;
	
	const languageAliases = {
		
		fr: "french",
		en: "english",
		uk: "ukrainian",
		ru: "russian",
		de: "german",
		es: "spanish",
		it: "italian",
		nl: "dutch"
		
		};

	const normalizeLanguage = (language) => {
	const value = String(language || "").trim().toLowerCase();

		return languageAliases[value] || value;
	};
	
    const matches = state.books.filter(b => {
		
		if (languageQuery)
		{
			const bookLanguage = normalizeLanguage(b.language);
			const requestedLanguage = normalizeLanguage(languageQuery);
			
			//in this way searched language and book language are converted to the same format

			if (bookLanguage !== requestedLanguage) {
				return false;
			}
		}
		
        if (state.status !== 'all' && b.status !== state.status) return false;
        if (f.shelf !== 'all' && b.shelf !== f.shelf) return false;
        if (f.genre !== 'all' && b.genre !== f.genre) return false;
        if (f.tag !== 'all' && !(b.tags || []).includes(f.tag)) return false;
		
        const year = Number(b.year) || 0;
        const price = b.price === '' || b.price == null ? null : Number(b.price);
		
        if (f.minYear !== '' && year < Number(f.minYear)) return false;
        if (f.maxYear !== '' && year > Number(f.maxYear)) return false;
        if (f.minPrice !== '' && (price === null || price < Number(f.minPrice))) return false;
        if (f.maxPrice !== '' && (price === null || price > Number(f.maxPrice))) return false;
        if (!q) return true;
		
        return [b.title, b.author, b.isbn, b.year, b.price, b.description, b.genre, b.shelf, b.status, statusName(b.status), ...(b.tags || []), ...(b.notes || []).map(n => typeof n === 'string' ? n : n.body)].join(' ').toLocaleLowerCase().includes(q);
    });
	
    matches.sort((a, b) => {
        switch (state.sort) {
            case 'title':
                return a.title.localeCompare(b.title);
            case 'author':
                return a.author.localeCompare(b.author);
            case 'year-new':
                return (b.year || 0) - (a.year || 0);
            case 'year-old':
                return (a.year || 0) - (b.year || 0);
            case 'price-low':
                return (Number(a.price) || 0) - (Number(b.price) || 0);
            case 'price-high':
                return (Number(b.price) || 0) - (Number(a.price) || 0);
            case 'progress':
                return pct(b) - pct(a);
            default:
                return String(b.addedAt || '').localeCompare(String(a.addedAt || ''));
        }
    });
	console.log(q)
    return matches;
}
  function emptyState(title,description,action,label){return `<div class="empty-state"><span class="empty-icon">${icon('book-open')}</span><h3>${h(title)}</h3><p>${h(description)}</p>${action?`<button class="btn btn-primary" data-action="${h(action)}">${icon('plus')} ${h(label||'Add a book')}</button>`:''}</div>`}
  const selectOption=(value,label,selected)=>`<option value="${h(value)}" ${String(value)===String(selected)?'selected':''}>${h(label)}</option>`;
  function renderLibrary(){return `${pageHead('YOUR COLLECTION','My library','Browse your books, find a favorite, or discover what to read next.',`<button class="btn btn-primary desktop-add" data-action="add-book">${icon('plus')} Add a book</button>`)}
     <div class="library-controls"><label class="search-field">${icon('search')}<input id="library-search" type="search" autocomplete="off" placeholder="Search title, author, ISBN, notes..." aria-label="Search books" value="${h(state.query)}"></label>
       <button class="control-square" data-action="open-filters" title="Advanced filters" aria-label="Advanced filters">${icon('filter')}</button>
       <select id="library-sort" class="sort-select" aria-label="Sort books">
         ${[['newest','Recently added'],['title','Title A–Z'],['author','Author A–Z'],['year-new','Newest publication'],['year-old','Oldest publication'],['price-low','Price: low to high'],['price-high','Price: high to low'],['progress','Reading progress']].map(x=>selectOption(x[0],x[1],state.sort)).join('')}
       </select>
     </div>
     <div class="chip-row" role="group" aria-label="Filter by reading status">${[['all','All books'],...STATUSES].map(([s,label])=>`<button class="filter-chip ${state.status===s?'active':''}" data-status="${h(s)}">${h(label)}</button>`).join('')}</div>
     <div class="library-statusline"><span id="result-count"></span><div class="library-view-toggle"><button data-layout="grid" title="Grid view" aria-label="Grid view" class="${state.layout==='grid'?'active':''}">${icon('grid')}</button><button data-layout="list" title="List view" aria-label="List view" class="${state.layout==='list'?'active':''}">${icon('list')}</button></div></div>
     <div id="library-results"></div>`}
  function updateLibraryResults(){const results=filterBooks();const count=document.getElementById('result-count'),box=document.getElementById('library-results');if(!count||!box)return;
    const filtersActive=state.filters.shelf!=='all'||state.filters.genre!=='all'||state.filters.tag!=='all'||Object.entries(state.filters).some(([k,v])=>k!=='shelf'&&k!=='genre'&&k!=='tag'&&v!=='');
    count.innerHTML=`Showing <strong>${results.length}</strong> of <strong>${state.books.length}</strong> books${filtersActive?' · Advanced filters active':''}`;
    box.innerHTML=results.length?`<div class="${state.layout==='grid'?'books-grid':'book-list'}">${results.map(card).join('')}</div>`:emptyState('No books found','Try another search or clear your filters.','clear-filters','Clear filters');
  }
  function renderShelves(){const all=['All books',...new Set([...state.shelves,...state.books.map(b=>b.shelf).filter(Boolean)])];return `${pageHead('STAY ORGANIZED','My shelves','A little order makes it easier to find your next story.',`<button class="btn btn-secondary" data-action="new-shelf">${icon('plus')} New shelf</button>`)}<div class="shelf-grid">${all.map((s,i)=>{const items=s==='All books'?state.books:state.books.filter(b=>b.shelf===s);return `<div class="shelf-card-wrap"><button class="shelf-card" data-shelf="${h(s)}"><div class="shelf-graphic">${items.slice(0,3).map(b=>cover(b)).join('')||icon('book-open')}</div><h3>${h(s)}</h3><p>${items.length} ${items.length===1?'book':'books'} ${icon('arrow-right','small')}</p></button>${s!=='All books'?`<div class="shelf-actions"><button data-action="rename-shelf" data-shelf-name="${h(s)}">Rename</button><button data-action="delete-shelf" data-shelf-name="${h(s)}">Remove</button></div>`:''}</div>`}).join('')}</div>`}
  async function renameShelf(oldName){
    const renamed=plain(prompt('Rename shelf:',oldName));if(!renamed||renamed===oldName)return;
    if(state.shelves.some(s=>s!==oldName&&s.toLowerCase()===renamed.toLowerCase())){toast('Shelf already exists');return}
    const shelves=state.shelves.map(s=>s===oldName?renamed:s);
    const books=state.books.map(b=>b.shelf===oldName?{...b,shelf:renamed,updatedAt:new Date().toISOString()}:b);
    try{await FolioDB.writeBooksAndShelves(books,shelves);state.books=books;state.shelves=shelves;render();toast('Shelf renamed')}catch(err){saveError(err)}
  }
  async function deleteShelf(name){
    if(!confirm(`Remove shelf “${name}”? Books on this shelf will become unshelved; no books will be deleted.`))return;
    const shelves=state.shelves.filter(s=>s!==name);
    const books=state.books.map(b=>b.shelf===name?{...b,shelf:'',updatedAt:new Date().toISOString()}:b);
    try{await FolioDB.writeBooksAndShelves(books,shelves);state.books=books;state.shelves=shelves;render();toast('Shelf removed; books preserved')}catch(err){saveError(err)}
  }
  function renderSettings(){return `${pageHead('MAKE IT YOURS','Settings','Your library, just the way you like it.')}
    <div class="settings-layout">
    <section class="settings-panel"><h2>Appearance</h2><p>Choose a comfortable look and your favorite accent colour.</p><div class="theme-options">${[['light','sun','Light'],['dark','moon','Dark'],['system','settings','System']].map(([v,i,label])=>`<button class="theme-option ${theme===v?'active':''}" data-theme-option="${v}">${icon(i)} ${label}</button>`).join('')}</div>
      <h3 class="settings-subheading">Accent colour</h3><div class="accent-options" role="group" aria-label="Accent colour">${[['forest','Forest'],['ocean','Ocean'],['violet','Violet'],['terracotta','Terracotta'],['rose','Rose'],['amber','Amber']].map(([v,label])=>`<button class="accent-choice ${accent===v?'active':''}" data-accent-option="${v}" aria-label="${label}" aria-pressed="${accent===v}"><span class="accent-dot ${v}"></span>${label}${accent===v?icon('check'):''}</button>`).join('')}</div></section>
    <section class="settings-panel"><h2>Backup & restore</h2><p>Transfer your collection between phone and computer using JSON. Full backups include locally uploaded covers and all your notes.</p><button class="btn btn-primary" data-action="export">${icon('download')} Export JSON</button><button class="btn btn-secondary" data-action="import">${icon('upload')} Import JSON / CSV</button><button class="btn btn-secondary" data-action="export-csv">${icon('download')} Export CSV</button><div class="info-banner">${icon('info')} Import shows a preview. Choose full restore or safely merge. No automatic sync.</div></section>
    <section class="settings-panel"><h2>About your library</h2><p><strong>${state.books.length} titles</strong> are stored on this device. Your records and notes stay private unless you export them.</p><button class="btn btn-secondary" data-action="reset-demo">${icon('refresh')} Restore sample books</button><button class="btn btn-danger" data-action="clear-all">${icon('trash')} Clear library</button></section>
    <section class="settings-panel"><h2>Data and offline access</h2><p><strong>${state.storageMode==='indexeddb'?'IndexedDB storage active':'Limited localStorage mode'}</strong>. ${state.storageMode==='indexeddb'?'Your collection is saved in the browser database.':'This browser does not permit IndexedDB in the current context; use HTTPS/localhost for full support.'}</p><div class="info-banner">${icon('cloud-off')} No account, server, or automatic synchronization. Book information lookup needs internet. Barcode scanning needs camera permission; compatibility differs between browsers.</div><button class="btn btn-secondary" data-action="storage-info">${icon('info')} Storage advice</button></section>
    </div>`}
  function render(){const view=document.getElementById('view');view.innerHTML=state.page==='home'?renderHome():state.page==='library'?renderLibrary():state.page==='shelves'?renderShelves():renderSettings();document.querySelectorAll('[data-page]').forEach(el=>el.classList.toggle('active',el.dataset.page===state.page));if(state.page==='library')updateLibraryResults();applyTheme()}
  function navigate(page){if(!['home','library','shelves','settings'].includes(page))return;state.page=page;render();window.scrollTo(0,0)}
  let toastTimeout;
  function toast(msg){const root=document.getElementById('toast-root');root.innerHTML=`<div class="toast">${icon('check')}${h(msg)}</div>`;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>root.innerHTML='',3500)}
  function openDialog(d){state.lastFocused=document.activeElement;state.dialog=d;state.detailTab='overview';state.editingNoteId=null;state.formCover='';renderDialog()}
  function closeDialog(){stopScan();state.dialog=null;document.getElementById('overlay-root').innerHTML='';document.body.style.overflow='';state.lastFocused?.focus?.()}
  function dialogHeading(title,subtitle){return `<header class="modal-heading"><div><h2 id="modal-title">${h(title)}</h2>${subtitle?`<div class="muted">${h(subtitle)}</div>`:''}</div><button class="icon-btn" data-action="close-dialog" aria-label="Close dialog">${icon('x')}</button></header>`}
  function dialogWrap(heading,body,footer='',cls=''){return `<div class="overlay" data-overlay="true"><section class="modal-panel ${cls}" role="dialog" aria-modal="true" aria-labelledby="modal-title">${heading}<div class="modal-body">${body}</div>${footer?`<footer class="modal-footer">${footer}</footer>`:''}</section></div>`}
  function renderDialog(){const d=state.dialog;if(!d)return;let html='';
    if(d.kind==='form')html=renderFormDialog(d.bookId,d.prefill||'');
    if(d.kind==='detail')html=renderDetailDialog(d.bookId);
    if(d.kind==='filters')html=renderFilterDialog();
    if(d.kind==='scan')html=renderScanDialog();
    if(d.kind==='import-preview')html=renderImportDialog();
    document.getElementById('overlay-root').innerHTML=html;document.body.style.overflow='hidden';
    const focus=document.querySelector('.modal-panel input:not([type=hidden]),.modal-panel button[data-action="close-dialog"]');focus?.focus({preventScroll:true});
  }
  function renderFormDialog(bookId,prefill){const b=state.books.find(b=>b.id===bookId)||{};const edit=Boolean(b.id);const val=(k,f='')=>h(b[k]??f);
    const shelfList=[...new Set([...state.shelves,b.shelf].filter(Boolean))];
    const genreList=[...new Set(['Fiction','Fantasy','Science fiction','Programming','History','Psychology','Memoir','Design','Self-improvement','Productivity','Other',...state.books.map(x=>x.genre).filter(Boolean),b.genre].filter(Boolean))];
    state.formCover=b.cover||'';
    return dialogWrap(dialogHeading(edit?'Edit book':'Add a new book',edit?'Update the details of your collection':'Fill the basics now; you can edit everything later.'),
      `<form id="book-form">
        <div class="form-block"><h3>Quick add with ISBN</h3><div class="isbn-quick"><div class="field"><label for="form-isbn">ISBN-10 / ISBN-13</label><input id="form-isbn" name="isbn" inputmode="numeric" placeholder="e.g. 9780735211292" value="${val('isbn',prefill)}"></div><button class="btn btn-secondary" type="button" data-action="isbn-lookup">${icon('search')} Look up</button><button class="btn btn-secondary" type="button" data-action="open-scan">${icon('camera')} Scan</button></div><p class="form-hint" id="lookup-status">Optional — searches multiple public catalogues and needs internet.</p><div id="lookup-external-links" class="form-hint" hidden></div></div>
        <div class="form-block"><h3>Book details</h3><div class="form-grid">
         <div class="field full"><label for="form-title">Title <span aria-label="required">*</span></label><input id="form-title" name="title" required maxlength="200" placeholder="Book title" value="${val('title')}"></div>
         <div class="field full"><label for="form-subtitle">Subtitle</label><input id="form-subtitle" name="subtitle" maxlength="240" placeholder="Optional subtitle" value="${val('subtitle')}"></div>
         <div class="field full"><label for="form-author">Author</label><input id="form-author" name="author" maxlength="200" placeholder="Author name" value="${val('author')}"></div>
         <div class="field mobile-full"><label for="form-publisher">Publisher</label><input id="form-publisher" name="publisher" maxlength="160" placeholder="Publisher" value="${val('publisher')}"></div>
         <div class="field mobile-full"><label for="form-language">Language</label><input id="form-language" name="language" maxlength="60" placeholder="e.g. English, French, Spanish" value="${val('language')}"></div>
         <div class="field"><label for="form-year">Publication year</label><input id="form-year" name="year" inputmode="numeric" type="number" min="0" max="2200" placeholder="2026" value="${val('year')}"></div>
         <div class="field"><label for="form-pages">Number of pages</label><input id="form-pages" name="pages" inputmode="numeric" type="number" min="0" max="999999" value="${val('pages')}"></div>
         <div class="field mobile-full"><label for="form-genre">Genre</label><input id="form-genre" name="genre" list="genre-options" placeholder="e.g. Fantasy" value="${val('genre')}"><datalist id="genre-options">${genreList.map(g=>`<option value="${h(g)}"></option>`).join('')}</datalist></div>
         <div class="field mobile-full"><label for="form-shelf">Shelf</label><input id="form-shelf" name="shelf" list="shelf-options" placeholder="e.g. Fiction" value="${val('shelf','Fiction')}"><datalist id="shelf-options">${shelfList.map(s=>`<option value="${h(s)}"></option>`).join('')}</datalist></div>
         <div class="field full"><label for="form-tags">Tags (comma separated)</label><input id="form-tags" name="tags" placeholder="Favorite, Study, Classic" value="${h((b.tags||[]).join(', '))}"></div>
         <div class="field full"><label for="form-description">Description</label><textarea id="form-description" name="description" placeholder="A few words about this book">${val('description')}</textarea></div>
        </div></div>
        <div class="form-block"><h3>Cover image</h3><div class="image-picker"><img id="form-cover-preview" class="preview" src="${h(safeSrc(b.cover,b.title||'New book'))}" alt="Selected book cover"><div class="picker-info"><div class="field"><label for="form-cover">Image URL (optional)</label><input id="form-cover" name="cover" placeholder="https://..." value="${h((b.cover||'').startsWith('data:')?'':(b.cover||''))}"></div><p>Or upload an image from your device</p><input type="file" id="cover-upload" accept="image/png,image/jpeg,image/webp" aria-label="Upload cover image"></div></div></div>
        <div class="form-block"><h3>Reading & purchase</h3><div class="form-grid">
          <div class="field"><label for="form-status">Reading status</label><select id="form-status" name="status">${STATUSES.map(([v,l])=>selectOption(v,l,b.status||'to-read')).join('')}</select></div>
          <div class="field"><label for="form-current">Current page</label><input id="form-current" name="currentPage" type="number" min="0" inputmode="numeric" value="${val('currentPage',0)}"></div>
          <div class="field"><label for="form-price">Purchase price (€)</label><input id="form-price" name="price" type="number" step="0.01" min="0" placeholder="Unknown" inputmode="decimal" value="${val('price')}"></div>
          <div class="field"><label for="form-quantity">Copies owned</label><input id="form-quantity" name="quantity" type="number" min="1" max="99999" inputmode="numeric" value="${val('quantity',1)}"></div>
          <div class="field"><label for="form-acquired">Date acquired</label><input id="form-acquired" name="acquiredAt" type="date" value="${val('acquiredAt')}"></div>
          <div class="field"><label for="form-started">Started reading</label><input id="form-started" name="startedAt" type="date" value="${val('startedAt')}"></div>
          <div class="field"><label for="form-finished">Finished reading</label><input id="form-finished" name="finishedAt" type="date" value="${val('finishedAt')}"></div>
          <div class="field"><label for="form-favorite">Favorite</label><select name="favorite" id="form-favorite">${selectOption('no','No',b.favorite?'yes':'no')}${selectOption('yes','Yes',b.favorite?'yes':'no')}</select></div>
          <div class="field full"><label for="form-note">Personal note</label><textarea id="form-note" name="note" placeholder="Anything you want to remember about this book...">${edit?'':h('')}</textarea><p class="form-hint">New notes are added to the book's note history. Existing notes stay intact.</p></div>
        </div></div>
        <p id="form-message" class="form-error" role="alert" hidden></p>
      </form>`,
      `<button class="btn btn-secondary" data-action="close-dialog">Cancel</button><button type="submit" form="book-form" class="btn btn-primary">${icon('check')} ${edit?'Save changes':'Add to library'}</button>`);
  }
  function renderDetailDialog(bookId){const b=state.books.find(b=>b.id===bookId);if(!b)return dialogWrap(dialogHeading('Book not found'),'<p>This book is no longer available.</p>');const tab=state.detailTab;
    const headings=`<div class="detail-hero">${cover(b)}<div style="min-width:0"><div style="margin-bottom:10px">${statusPill(b.status)}</div><h2>${h(b.title)}</h2><p>by ${h(b.author||'Unknown author')}</p><div class="tag-list">${(b.tags||[]).slice(0,3).map(x=>`<span class="tag-pill">${h(x)}</span>`).join('')}</div></div></div>
      <div class="detail-tabs" role="tablist">${[['overview','Overview'],['reading','Reading'],['notes','My notes']].map(([t,l])=>`<button role="tab" aria-selected="${tab===t}" data-detail-tab="${t}" class="${tab===t?'active':''}">${l}${t==='notes'?` (${(b.notes||[]).length})`:''}</button>`).join('')}</div>`;
    let content='';
    if(tab==='overview')content=`<div class="detail-section"><h3>About this book</h3><p class="detail-description">${h(b.description||'No description yet. Edit this book to add one.')}</p>
      <div class="metadata-grid">${[['ISBN',b.isbn||'Not added'],['Publication year',b.year||'Unknown'],['Publisher',b.publisher||'Unknown'],['Language',b.language||'Not specified'],['Genre',b.genre||'Uncategorized'],['Shelf',b.shelf||'Unshelved'],['Purchase price',priceText(b)],['Copies owned',b.quantity||1],['Date acquired',b.acquiredAt||'Not recorded'],['Total paid',b.price===null?'Unknown':money(Number(b.price)*(Number(b.quantity)||1))]].map(([k,v])=>`<div><div class="metadata-label">${k}</div><div class="metadata-value">${h(v)}</div></div>`).join('')}</div></div>`;
    if(tab==='reading')content=`<div class="detail-section"><h3>Reading progress</h3><div style="margin:16px 0"><div class="progress-track" style="height:10px"><span style="width:${pct(b)}%"></span></div><div class="progress-caption"><span>${pct(b)}% completed</span><span>Page ${Number(b.currentPage)||0} / ${Number(b.pages)||0}</span></div></div>
      <form id="progress-form" class="progress-form"><div class="field"><label for="progress-page">Update current page</label><input id="progress-page" type="number" name="currentPage" min="0" max="${Math.max(0,Number(b.pages)||999999)}" value="${Number(b.currentPage)||0}"></div><button class="btn btn-primary" type="submit">Save progress</button></form>
      <div class="field" style="margin-top:22px"><label for="quick-status">Reading status</label><select id="quick-status" data-quick-status="${h(b.id)}">${STATUSES.map(([v,l])=>selectOption(v,l,b.status)).join('')}</select></div></div>`;
    if(tab==='notes')content=`<div class="detail-section"><h3>Personal notes</h3>${(b.notes||[]).length?[...(b.notes||[])].reverse().map(n=>`<div class="note-card"><div class="note-meta"><span>${h(formatDate(n.date))}</span><div class="note-actions"><button data-edit-note="${h(n.id)}" aria-label="Edit note">Edit</button><button data-delete-note="${h(n.id)}" aria-label="Delete note">Delete</button></div></div>${state.editingNoteId===n.id?`<form id="edit-note-form" data-note-id="${h(n.id)}" class="note-entry"><textarea name="note" aria-label="Edit note" required>${h(n.body)}</textarea><div class="note-actions"><button class="btn btn-primary" type="submit">Save changes</button><button class="btn btn-secondary" type="button" data-action="cancel-note-edit">Cancel</button></div></form>`:`<p>${h(n.body)}</p>`}</div>`).join(''):'<p class="empty-line">No notes yet. Capture a thought, quote, or reminder below.</p>'}
      <form id="note-form" class="note-entry"><label for="new-note" class="mini-heading">Add a new note</label><textarea id="new-note" name="note" placeholder="What would you like to remember?" required></textarea><button class="btn btn-primary" type="submit">${icon('plus')} Save note</button></form></div>`;
    return dialogWrap(dialogHeading('Book details','Everything about this book in one place'),`${headings}${content}`,`<button class="btn btn-danger" data-action="delete-book" data-id="${h(b.id)}">${icon('trash')} Delete</button><button class="btn btn-primary" data-action="edit-book" data-id="${h(b.id)}">${icon('edit')} Edit book</button>`);
  }
  function renderFilterDialog(){const f=state.filters;const genres=[...new Set(state.books.map(b=>b.genre).filter(Boolean))].sort();const tags=[...new Set(state.books.flatMap(b=>b.tags||[]))].sort();const shelves=[...new Set([...state.shelves,...state.books.map(b=>b.shelf).filter(Boolean)])].sort();
    return dialogWrap(dialogHeading('Advanced filters','Combine different filters to narrow your collection'),`<form id="filters-form"><div class="form-grid">
    <div class="field full"><label>Shelf</label><select name="shelf">${selectOption('all','All shelves',f.shelf)}${shelves.map(s=>selectOption(s,s,f.shelf)).join('')}</select></div>
    <div class="field full"><label>Genre</label><select name="genre">${selectOption('all','All genres',f.genre)}${genres.map(g=>selectOption(g,g,f.genre)).join('')}</select></div>
    <div class="field full"><label>Tag</label><select name="tag">${selectOption('all','All tags',f.tag)}${tags.map(g=>selectOption(g,g,f.tag)).join('')}</select></div>
    <div class="field"><label>From year</label><input type="number" name="minYear" placeholder="1900" value="${h(f.minYear)}"></div><div class="field"><label>To year</label><input type="number" name="maxYear" placeholder="2026" value="${h(f.maxYear)}"></div>
    <div class="field"><label>Minimum price (€)</label><input type="number" name="minPrice" step="0.01" min="0" placeholder="0" value="${h(f.minPrice)}"></div><div class="field"><label>Maximum price (€)</label><input type="number" name="maxPrice" step="0.01" min="0" placeholder="50" value="${h(f.maxPrice)}"></div>
    </div><p class="form-hint">Filters work together with your keyword search and reading status.</p></form>`,
    `<button class="btn btn-secondary" data-action="reset-advanced">Reset</button><button class="btn btn-primary" type="submit" form="filters-form">${icon('check')} Apply filters</button>`,'narrow')}
  function renderScanDialog(){return dialogWrap(dialogHeading('Scan ISBN barcode','Place the barcode in the camera frame'),`<p class="scan-status" id="scan-status">Preparing camera… You can always enter the ISBN manually instead.</p><div class="scan-viewport"><video id="camera-preview" autoplay muted playsinline></video><div class="scan-guides"></div></div><form id="manual-isbn-form" class="isbn-quick"><div class="field"><label>Or type the ISBN</label><input name="isbn" placeholder="978..." inputmode="numeric" required></div><button class="btn btn-primary" type="submit">Use ISBN ${icon('arrow-right')}</button></form><p class="form-hint">Camera access generally needs HTTPS or localhost, plus browser barcode detection support.</p>`, `<button class="btn btn-secondary" data-action="close-dialog">Cancel</button>`,'narrow')}
  function findBook(id){return state.books.find(b=>String(b.id)===String(id))}
  const validISBN = raw => {
    const isbn=plain(raw).replace(/[\s-]/g,'').toUpperCase();
    if (/^\d{13}$/.test(isbn)) return [...isbn].reduce((sum,v,i)=>sum+Number(v)*(i%2?3:1),0)%10===0;
    if (/^\d{9}[\dX]$/.test(isbn)) return [...isbn].reduce((sum,v,i)=>sum+(10-i)*(v==='X'?10:Number(v)),0)%11===0;
    return false;
  };
  function normalizeBook(raw){
    if(!raw || typeof raw!=='object' || !plain(raw.title)) throw Error('A book in the backup has no title.');
    const now=new Date().toISOString();
    const date=x=>/^\d{4}-\d{2}-\d{2}$/.test(String(x||''))?String(x):'';
    const number=(x,def=0,max=10000000)=>x===null||x===undefined||x===''?def:Math.max(0,Math.min(max,Number.isFinite(Number(x))?Number(x):def));
    return {id:plain(raw.id)||id(),title:plain(raw.title).slice(0,240),subtitle:plain(raw.subtitle).slice(0,240),author:plain(raw.author).slice(0,300),isbn:plain(raw.isbn).replace(/[\s-]/g,'').slice(0,13),year:raw.year==null||raw.year===''?null:Math.floor(number(raw.year,0,2200)),publisher:plain(raw.publisher).slice(0,160),language:plain(raw.language).slice(0,60),pages:Math.floor(number(raw.pages,0,999999)),currentPage:Math.floor(number(raw.currentPage,0,999999)),status:STATUSES.some(x=>x[0]===raw.status)?raw.status:'to-read',genre:plain(raw.genre).slice(0,100),shelf:plain(raw.shelf).slice(0,100),tags:splitTags(raw.tags).slice(0,100),description:plain(raw.description).slice(0,20000),price:raw.price===''||raw.price==null?null:number(raw.price,0,100000000),quantity:Math.max(1,Math.floor(number(raw.quantity,1,99999))),cover:plain(raw.cover).slice(0,3000000),notes:Array.isArray(raw.notes)?raw.notes.slice(0,10000).map(n=>({id:plain(n?.id)||id(),body:plain(typeof n==='string'?n:n?.body).slice(0,50000),date:plain(n?.date)||now})).filter(n=>n.body):[],acquiredAt:date(raw.acquiredAt),startedAt:date(raw.startedAt),finishedAt:date(raw.finishedAt),favorite:!!raw.favorite,addedAt:plain(raw.addedAt)||now,updatedAt:plain(raw.updatedAt)||now};
  }
  function withNote(b,body){const copy={...b,notes:[...(b.notes||[])]};if(plain(body))copy.notes.push({id:id(),body:plain(body),date:new Date().toISOString()});copy.updatedAt=new Date().toISOString();return copy}
  async function handleBookSave(form){
    const obj=Object.fromEntries(new FormData(form));const title=plain(obj.title);
    if(!title){form.querySelector('#form-message').hidden=false;form.querySelector('#form-message').textContent='Please add a book title.';return}
    const old=state.dialog?.bookId?findBook(state.dialog.bookId):null;
    if(plain(obj.isbn)&&!validISBN(obj.isbn)){form.querySelector('#form-message').hidden=false;form.querySelector('#form-message').textContent='ISBN checksum is invalid. Check the digits or leave ISBN empty.';return}
    const duplicate=state.books.find(b=>b.id!==old?.id && ((obj.isbn&&b.isbn===plain(obj.isbn).replace(/[\s-]/g,''))||(b.title.toLowerCase()===title.toLowerCase()&&b.author.toLowerCase()===plain(obj.author).toLowerCase())));
    if(duplicate&&!confirm(`“${duplicate.title}” may already be in your library. Add another record anyway?`))return;
    let image=state.formCover||old?.cover||'';
    if(plain(obj.cover)&&plain(obj.cover)!==old?.cover)image=plain(obj.cover);
    const now=new Date().toISOString();
    const b=normalizeBook({...old,...obj,id:old?.id||id(),title,cover:image,notes:old?.notes||[],tags:splitTags(obj.tags),quantity:obj.quantity||1,price:obj.price===''?null:Number(obj.price),favorite:obj.favorite==='yes',addedAt:old?.addedAt||now,updatedAt:now});
    b.currentPage=Math.min(b.pages||999999,b.currentPage);
    if(b.status==='completed'&&b.pages)b.currentPage=b.pages;
    if(b.status==='reading'&&!b.startedAt)b.startedAt=now.slice(0,10);
    if(b.status==='completed'&&!b.finishedAt)b.finishedAt=now.slice(0,10);
    const saved=withNote(b,obj.note);
    const btn=document.querySelector('[form="book-form"][type=submit]');if(btn)btn.disabled=true;
    try {
      const newShelf=saved.shelf&&!state.shelves.includes(saved.shelf)?[...state.shelves,saved.shelf]:null;
      if(newShelf) await FolioDB.writeBooksAndShelves([...state.books.filter(x=>x.id!==saved.id),saved],newShelf);
      else await FolioDB.putBook(saved);
      if(newShelf) state.shelves=newShelf;
      const i=state.books.findIndex(x=>x.id===saved.id);
      if(i>=0)state.books[i]=saved; else state.books.unshift(saved);
      closeDialog();navigate('library');toast(old?'Book updated successfully':'Book added to your library');
    } catch(err){saveError(err)} finally{if(btn?.isConnected)btn.disabled=false}
  }
  function clearFilters(){state.query='';state.status='all';state.filters={shelf:'all',genre:'all',tag:'all',minYear:'',maxYear:'',minPrice:'',maxPrice:''};render()}
  const download=(content,filename,type)=>{
    const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  };
  function exportBackup(){
    const payload={format:'folio-personal-library',version:2,createdAt:new Date().toISOString(),books:state.books,shelves:state.shelves,tombstones:state.tombstones};
    download(JSON.stringify(payload,null,2),`folio-library-${new Date().toISOString().slice(0,10)}.json`,'application/json');
    toast('Complete JSON backup downloaded');
  }
  const csvFields=['title','subtitle','author','isbn','year','publisher','language','genre','shelf','tags','description','price','quantity','pages','currentPage','status','acquiredAt','startedAt','finishedAt','favorite','notes','cover','id','addedAt','updatedAt'];
  function exportCSV(){
    const quote=x=>{let t=Array.isArray(x)?x.join(' | '):x==null?'':String(x);if(/^[\s]*[=+@-]/.test(t))t="'"+t;return '"'+t.replace(/"/g,'""')+'"'};
    const rows=[csvFields.join(','),...state.books.map(b=>csvFields.map(f=>quote(f==='notes'?(b.notes||[]).map(n=>n.body).join(' | '):b[f])).join(','))];
    download('﻿'+rows.join('\r\n'),`folio-library-${new Date().toISOString().slice(0,10)}.csv`,'text/csv;charset=utf-8');toast('CSV exported (JSON is the full-fidelity backup)');
  }
  function parseCSV(text){
    const rows=[],row=[];let cur='',quoted=false;
    for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){cur+='"';i++}else if(c==='"')quoted=false;else cur+=c}
      else if(c==='"')quoted=true;else if(c===','){row.push(cur);cur=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cur);if(row.some(v=>v.length))rows.push([...row]);row.length=0;cur=''}else cur+=c}
    if(quoted)throw Error('CSV contains an unclosed quoted value.');row.push(cur);if(row.some(v=>v.length))rows.push(row);
    if(rows.length<2)throw Error('No book records in CSV.');const headers=rows.shift().map((x,i)=>i===0?x.replace(/^\ufeff/,'').trim():x.trim());
    if(!headers.includes('title'))throw Error('CSV must include a title column.');
    return rows.map(r=>{
      const raw={};headers.forEach((key,i)=>{if(csvFields.includes(key))raw[key]=r[i]||''});
      raw.tags=(raw.tags||'').split(/\s*\|\s*/).filter(Boolean);raw.notes=raw.notes?[{body:raw.notes.replace(/\s+\|\s+/g,'\n'),date:new Date().toISOString()}]:[];
      raw.favorite=raw.favorite==='true';if(raw.price==='')raw.price=null;
      return normalizeBook(raw);
    });
  }
  function sameBook(a,b){
    return a.id===b.id || (a.isbn&&b.isbn&&a.isbn===b.isbn&&a.title.toLowerCase()===b.title.toLowerCase()) || (a.title.toLowerCase()===b.title.toLowerCase()&&a.author&&b.author&&a.author.toLowerCase()===b.author.toLowerCase());
  }
  async function importBackup(file){
    try {
      if(file.size>100*1024*1024)throw Error('File is larger than 100 MB. Use a smaller backup.');
      const source=await file.text();let data;
      if(/\.csv$/i.test(file.name)){data={format:'folio-csv',version:1,books:parseCSV(source),shelves:[]};}
      else {data=JSON.parse(source.replace(/^\ufeff/,''));if(data?.format!=='folio-personal-library'||![1,2].includes(data.version)||!Array.isArray(data.books))throw Error('Not a compatible Folio JSON backup.');}
      if(data.books.length>100000)throw Error('Backup has too many books.');
      const books=data.books.map(normalizeBook);
      const ids=new Set();for(const b of books){if(ids.has(b.id))throw Error('Backup contains duplicate book IDs.');ids.add(b.id)}
      const shelves=[...new Set([...(Array.isArray(data.shelves)?data.shelves:[]),...books.map(b=>b.shelf)].map(plain).filter(Boolean))].slice(0,10000);
      const tombstones=Array.isArray(data.tombstones)?data.tombstones.filter(t=>t&&typeof t.id==='string').map(t=>({id:t.id,updatedAt:plain(t.updatedAt)})):[];
      const duplicates=books.filter(b=>state.books.some(x=>sameBook(x,b))).length;
      state.pendingImport={books,shelves,tombstones,source:file.name,duplicates,format:data.format};
      openDialog({kind:'import-preview'});
    } catch(err){alert(`Could not read import: ${err.message}`)}
  }
  function renderImportDialog(){
    const p=state.pendingImport;if(!p)return '';
    return dialogWrap(dialogHeading('Review import','No data has been changed yet'),`<div class="import-summary"><div><strong>${p.books.length}</strong><span>Books in file</span></div><div><strong>${p.duplicates}</strong><span>Potential matches</span></div><div><strong>${p.shelves.length}</strong><span>Shelves</span></div></div><p class="detail-description"><strong>File:</strong> ${h(p.source)}<br><strong>Format:</strong> ${p.format==='folio-csv'?'CSV (limited fields)':'Folio JSON (complete backup)'}</p><div class="import-choice"><label><input type="radio" name="import-mode" value="merge-keep" checked><span><strong>Merge — keep existing</strong><small>Add missing books; preserve current details when a book matches. Combine unique notes.</small></span></label><label><input type="radio" name="import-mode" value="merge-replace"><span><strong>Merge — prefer imported</strong><small>Add missing books; use imported details for matching books. Combine unique notes.</small></span></label><label><input type="radio" name="import-mode" value="replace"><span><strong>Restore entire backup</strong><small>Replace every local book with the books in this file. Existing books not in the file are removed.</small></span></label></div><div class="info-banner">${icon('info')} For safety, download your current JSON backup before restoring. Merge does not automatically apply deletions made on another device.</div>`, `<button class="btn btn-secondary" data-action="export">${icon('download')} Back up current</button><button class="btn btn-primary" data-action="confirm-import">${icon('check')} Import books</button>`);
  }
  function unionNotes(a,b){const out=[...a.map(n=>({...n}))];for(const n of b){if(!out.some(x=>x.id===n.id||(x.body===n.body&&x.date===n.date)))out.push({...n})}return out}
  async function confirmImport(){
    const data=state.pendingImport;if(!data)return;
    const mode=document.querySelector('input[name="import-mode"]:checked')?.value||'merge-keep';
    if(mode==='replace'&&!confirm(`Restore ${data.books.length} books and DELETE any current books not in this file? Please ensure you have exported the current collection first.`))return;
    let books,shelves,tombs;
    if(mode==='replace'){books=data.books;shelves=data.shelves;tombs=data.tombstones;}
    else {
      books=state.books.map(b=>({...b}));shelves=[...new Set([...state.shelves,...data.shelves])];tombs=[...state.tombstones];
      for(const imported of data.books){const i=books.findIndex(local=>sameBook(local,imported));
        if(i<0){if(!tombs.some(t=>t.id===imported.id&&String(t.updatedAt)>String(imported.updatedAt)))books.push(imported);}
        else {const local=books[i];const preferred=mode==='merge-replace'?imported:local;books[i]={...preferred,id:local.id,notes:unionNotes(local.notes||[],imported.notes||[]),updatedAt:new Date().toISOString()};}
      }
      // Tombstones are preserved for future manual reconciliation; imported deletions are never silently applied.
      for(const t of data.tombstones)if(!tombs.some(x=>x.id===t.id))tombs.push(t);
    }
    const btn=document.querySelector('[data-action="confirm-import"]');if(btn)btn.disabled=true;
    try{await FolioDB.replaceAll(books,shelves,tombs);state.books=books;state.shelves=shelves;state.tombstones=tombs;state.pendingImport=null;closeDialog();clearFilters();navigate('library');toast(`${books.length} books safely imported`)}
    catch(err){saveError(err)}finally{if(btn?.isConnected)btn.disabled=false}
  }
  /* Multi-catalogue ISBN lookup. Each source is public and is requested directly
     from the browser; unavailable/CORS-blocked sources fail independently.
     We accept edition-level ISBN matches only: never substitute a similar title.
     Personal library records and notes are never sent to the catalogues. */
  const isbnDigits = value => plain(value).replace(/[\s-]/g,'').toUpperCase();
  const isbn10From13 = isbn => {
    if (!/^978\d{10}$/.test(isbn)) return '';
    const nine = isbn.slice(3, 12);
    const check = (11 - [...nine].reduce((sum, digit, i) => sum + (10 - i) * Number(digit), 0) % 11) % 11;
    return nine + (check === 10 ? 'X' : check);
  };
  const isbn13From10 = isbn => {
    if (!/^\d{9}[\dX]$/.test(isbn)) return '';
    const twelve = '978' + isbn.slice(0,9);
    const sum = [...twelve].reduce((total, digit, i) => total + Number(digit) * (i % 2 ? 3 : 1), 0);
    return twelve + ((10 - sum % 10) % 10);
  };
  const isbnVariants = isbn => new Set([isbn, isbn10From13(isbn), isbn13From10(isbn)].filter(Boolean));
  const isMatchingIdentifier = (value, isbn) => isbnVariants(isbn).has(isbnDigits(value));
  const textValue = value => {
    if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
    if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join(', ');
    if (value && typeof value === 'object') {
      if (typeof value.value === 'string') return value.value.trim();
      if (typeof value.name === 'string') return value.name.trim();
      if (typeof value.label === 'string') return value.label.trim();
      if (typeof value.mainTitle === 'string') return value.mainTitle.trim();
      return textValue(value.en || value.fr || value.de || value.uk || '');
    }
    return '';
  };
  const firstYear = value => textValue(value).match(/(?:1[5-9]|20|21)\d{2}/)?.[0] || '';
  const secureCover = value => {
    const u = textValue(value);
    if (!u || !/^https?:\/\//i.test(u)) return '';
    return u.replace(/^http:\/\//i, 'https://');
  };
  const isbnFields = data => {
    if (!data || typeof data !== 'object') return null;
    const fields = {
      title: textValue(data.title),
      subtitle: textValue(data.subtitle),
      author: textValue(data.author),
      publisher: textValue(data.publisher),
      year: firstYear(data.year),
      pages: (Number(data.pages) > 0 ? Math.floor(Number(data.pages)) : (textValue(data.pages).match(/\b(\d{1,5})\s*(?:p(?:ages)?|s(?:eiten)?)\b/i)?.[1] || '')),
      description: textValue(data.description),
      language: textValue(data.language),
      genre: textValue(data.genre),
      cover: secureCover(data.cover)
    };
    return fields.title ? fields : null;
  };
  const jsonFrom = async (url, signal) => {
    const response = await fetch(url, {signal, credentials:'omit'});
    if (!response.ok) throw Error(`HTTP ${response.status}`);
    return response.json();
  };
  const textFrom = async (url, signal) => {
    const response = await fetch(url, {signal, credentials:'omit'});
    if (!response.ok) throw Error(`HTTP ${response.status}`);
    return response.text();
  };
  const openLibraryLookup = async (isbn, signal) => {
    const result = await jsonFrom(`https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`, signal);
    const data = result[`ISBN:${isbn}`];
    if (!data) return null;
    return isbnFields({
      title:data.title, subtitle:data.subtitle,
      author:(data.authors || []).map(a => a.name || '').filter(Boolean).join(', '),
      year:data.publish_date,
      publisher:(data.publishers || []).map(p => p.name || '').filter(Boolean).join(', '),
      pages:data.number_of_pages,
      description:typeof data.notes === 'string' ? data.notes : data.notes?.value,
      cover:data.cover?.large || data.cover?.medium || data.cover?.small
    });
  };
  const googleBooksLookup = async (isbn, signal) => {
    const json = await jsonFrom(`https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}&maxResults=10`, signal);
    // Google Books sometimes responds with loosely related volumes. Check the ISBN.
    const volume = (json.items || []).map(v => v.volumeInfo).find(v => (v?.industryIdentifiers || []).some(id => isMatchingIdentifier(id.identifier, isbn)));
    if (!volume) return null;
    return isbnFields({
      title:volume.title, subtitle:volume.subtitle,
      author:volume.authors, publisher:volume.publisher, year:volume.publishedDate,
      pages:volume.pageCount, description:volume.description, language:volume.language,
      genre:volume.categories?.[0],
      cover:volume.imageLinks?.extraLarge || volume.imageLinks?.large || volume.imageLinks?.medium || volume.imageLinks?.thumbnail
    });
  };
  const inventaireLookup = async (isbn, signal) => {
    // Inventaire publishes anonymous ISBN facts and edition entity endpoints.
    // Try facts first, then an edition entity when facts are incomplete.
    let data;
    try { data = await jsonFrom(`https://inventaire.io/api/data/isbn?isbn=${encodeURIComponent(isbn)}`, signal); }
    catch (err) { if (signal.aborted) throw err; }
    const parseEntity = input => {
      const entity = input?.entity || input?.edition || input;
      const claims = entity?.claims || {};
      const claim = key => textValue((claims[key] || [])[0]);
      return isbnFields({
        title:entity?.title || entity?.labels || input?.title || claim('wdt:P1476'),
        subtitle:entity?.subtitle || input?.subtitle,
        author:entity?.author || entity?.authors || input?.authors,
        publisher:entity?.publisher || input?.publisher || claim('wdt:P123'),
        year:entity?.year || input?.year || claim('wdt:P577'),
        pages:entity?.pages || input?.pages || claim('wdt:P1104'),
        description:entity?.description || input?.description || entity?.descriptions,
        language:entity?.language || input?.language,
        cover:entity?.cover || input?.cover || entity?.image || entity?.images?.[0]
      });
    };
    const basic = parseEntity(data);
    if (basic) return basic;
    const details = await jsonFrom(`https://inventaire.io/api/entities?action=by-uris&uris=${encodeURIComponent('isbn:' + isbn)}`, signal);
    return parseEntity(details?.entities?.['isbn:' + isbn]);
  };
  const lobidLookup = async (isbn, signal) => {
    const json = await jsonFrom(`https://lobid.org/resources/search?q=${encodeURIComponent(`isbn:${isbn}`)}&format=json&size=5`, signal);
    const member = (json.member || []).find(item => {
      const listedISBNs = [item.isbn].flat().filter(Boolean);
      // Query is ISBN-specific; if a dedicated ISBN field exists, verify it.
      return !listedISBNs.length || listedISBNs.some(v => isMatchingIdentifier(v, isbn));
    });
    if (!member) return null;
    const contributors = (member.contribution || []).map(c => textValue(c.agent || c)).filter(Boolean).join(', ');
    return isbnFields({
      title:member.title?.mainTitle || member.title || member.name,
      subtitle:member.title?.subtitle || member.subtitle,
      author:contributors || member.creator || member.author || member.responsibilityStatement,
      publisher:member.publication?.[0]?.publishedBy || member.publisher || member.publishedBy,
      year:member.publication?.[0]?.startDate || member.issued || member.datePublished || member.publication?.[0]?.date,
      pages:member.extent?.[0]?.label || member.numberOfPages,
      language:member.language?.[0]?.label || member.language,
      description:member.abstract || member.description,
      cover:member.image || member.cover
    });
  };
  const bnfLookup = async (isbn, signal) => {
    const query = `bib.isbn all "${isbn}"`;
    const url = `https://catalogue.bnf.fr/api/SRU?version=1.2&operation=searchRetrieve&query=${encodeURIComponent(query)}&recordSchema=dc&maximumRecords=3&startRecord=1`;
    const xmlText = await textFrom(url, signal);
    const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
    if (xml.querySelector('parsererror')) throw Error('Invalid BnF XML');
    const record = xml.getElementsByTagNameNS('*','recordData')[0];
    if (!record) return null;
    const dc = name => [...record.getElementsByTagNameNS('http://purl.org/dc/elements/1.1/', name)].map(node => node.textContent.trim()).filter(Boolean);
    // bib.isbn is edition-specific; verify where an identifier was included.
    const ids = dc('identifier').filter(value => /(?:97[89]\d|\d{9}[\dX])/i.test(value.replace(/[-\s]/g,'')));
    if (ids.length && !ids.some(value => [...isbnVariants(isbn)].some(v => value.replace(/[-\s]/g,'').includes(v)))) return null;
    return isbnFields({
      title:dc('title')[0], author:dc('creator').join(', '),
      publisher:dc('publisher').join(', '), year:dc('date')[0],
      description:dc('description').join(' '), language:dc('language')[0],
      genre:dc('subject')[0]
    });
  };
  const wikidataLookup = async (isbn, signal) => {
    const isbn10 = isbn10From13(isbn);
    const parts = [`{ ?book wdt:P212 "${isbn}". }`, ...(isbn10 ? [`{ ?book wdt:P957 "${isbn10}". }`] : [])];
    const query = `SELECT ?bookLabel ?authorLabel ?publisherLabel ?date ?pages ?image WHERE {
      ${parts.join(' UNION ')}
      OPTIONAL { ?book wdt:P50 ?author. }
      OPTIONAL { ?book wdt:P123 ?publisher. }
      OPTIONAL { ?book wdt:P577 ?date. }
      OPTIONAL { ?book wdt:P1104 ?pages. }
      OPTIONAL { ?book wdt:P18 ?image. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en,de,uk". }
    } LIMIT 4`;
    const json = await jsonFrom(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`, signal);
    const row = json.results?.bindings?.[0];
    if (!row || /^Q\d+$/.test(row.bookLabel?.value || '')) return null;
    return isbnFields({
      title:row.bookLabel?.value, author:row.authorLabel?.value,
      publisher:row.publisherLabel?.value, year:row.date?.value,
      pages:row.pages?.value, cover:row.image?.value
    });
  };
  const ISBN_SERVICES = [
    ['Open Library', openLibraryLookup],
    ['Google Books', googleBooksLookup],
    ['BnF (France)', bnfLookup],
    ['Inventaire', inventaireLookup],
    ['lobid (Germany)', lobidLookup],
    ['Wikidata', wikidataLookup]
  ];
  function showISBNExternalLinks(isbn){
    const target = document.getElementById('lookup-external-links');
    if (!target) return;
    target.hidden = false;
    // These are manual catalogue searches. ISBNsearch.org does not offer
    // a public browser API, so we never scrape or pretend to auto-import it.
    target.innerHTML = `<span>Search manually: </span>
      <a href="https://isbnsearch.org/isbn/${encodeURIComponent(isbn)}" target="_blank" rel="noopener noreferrer">ISBNsearch.org ↗</a>
      · <a href="https://www.google.com/search?q=${encodeURIComponent('"' + isbn + '" book')}" target="_blank" rel="noopener noreferrer">Web search ↗</a>`;
  }
  async function lookupISBN(){
    const isbn = isbnDigits(document.getElementById('form-isbn')?.value);
    const status = document.getElementById('lookup-status');
    if (!status) return;
    if (!validISBN(isbn)) { status.textContent = 'Invalid ISBN checksum. Please check all digits.'; return; }
    state.lookupController?.abort();
    const ctl = new AbortController();
    state.lookupController = ctl;
    const btn = document.querySelector('[data-action="isbn-lookup"]');
    if (btn) btn.disabled = true;
    const already = state.books.find(b => b.isbn === isbn && b.id !== state.dialog?.bookId);
    showISBNExternalLinks(isbn);
    status.textContent = `Searching ${ISBN_SERVICES.length} catalogues for ${isbn}…`;
    const timer = setTimeout(() => ctl.abort(), 8500);
    let responded = 0;
    const results = await Promise.allSettled(ISBN_SERVICES.map(async ([name, lookup]) => {
      try {
        const fields = await lookup(isbn, ctl.signal);
        return {name, fields};
      } finally {
        responded++;
        if (!ctl.signal.aborted && status.isConnected) status.textContent = `Searching book catalogues… ${responded}/${ISBN_SERVICES.length} checked`;
      }
    }));
    clearTimeout(timer);
    if (state.lookupController !== ctl) return;
    state.lookupController = null;
    if (btn?.isConnected) btn.disabled = false;
    if (ctl.signal.aborted && !results.some(r => r.status === 'fulfilled' && r.value.fields)) {
      status.textContent = 'Search timed out or was cancelled. Retry, or use the external search links.';
      return;
    }
    const matches = results.filter(r => r.status === 'fulfilled' && r.value.fields).map(r => r.value);
    const failures = results.filter(r => r.status === 'rejected').length;
    if (!matches.length) {
      status.textContent = failures
        ? `No record retrieved (${failures} catalogues unavailable or blocked by the browser). Try external search or manual entry.`
        : 'No catalogue returned this ISBN. Try external search or manual entry.';
      return;
    }
    // Metadata is merged only when missing: source priority follows the
    // ISBN_SERVICES array, and anything the user already typed wins.
    const merged = {};
    for (const {fields} of matches) for (const [key, value] of Object.entries(fields)) {
      if (value !== '' && value != null && !merged[key]) merged[key] = value;
    }
    const form = document.getElementById('book-form');
    if (!form || !status.isConnected) return;
    for (const [key, value] of Object.entries(merged)) {
      if (key === 'cover') {
        if (value && !state.formCover) {
          state.formCover = value;
          const coverInput = document.getElementById('form-cover');
          const coverPreview = document.getElementById('form-cover-preview');
          if (coverInput) coverInput.value = value;
          if (coverPreview) coverPreview.src = value;
        }
        continue;
      }
      const input = form.elements.namedItem(key);
      if (input && !input.value && value) input.value = value;
    }
    status.textContent = `Found “${merged.title}” via ${matches.map(r => r.name).join(', ')}. Review edition details before saving.${already ? ` Already in library: ${already.title}.` : ''}${failures ? ` ${failures} source(s) unavailable.` : ''}`;
    toast('Book details found');
  }
  async function compressImage(file){return new Promise((resolve,reject)=>{if(file.size>12*1024*1024){reject(Error('Image exceeds 12 MB.'));return}const reader=new FileReader();reader.onerror=()=>reject(Error('Could not read the image'));reader.onload=()=>{const img=new Image();img.onerror=()=>reject(Error('Unsupported image'));img.onload=()=>{const scale=Math.min(1,440/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',.75))};img.src=reader.result};reader.readAsDataURL(file)})}
  function stopScan(){if(state.scanLoop){clearTimeout(state.scanLoop);state.scanLoop=null}if(state.scanner){state.scanner.getTracks().forEach(t=>t.stop());state.scanner=null}}
  async function startScan(){const notice=document.getElementById('scan-status');if(!notice)return;
    if(!navigator.mediaDevices?.getUserMedia){notice.textContent='Camera access requires HTTPS/localhost and permission. Enter ISBN manually below.';return}
    let detector=null;
    if('BarcodeDetector' in window){try {detector=new BarcodeDetector({formats:['ean_13']})}catch{}}
    try {
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});
      if(state.dialog?.kind!=='scan'){stream.getTracks().forEach(t=>t.stop());return}
      state.scanner=stream;const video=document.getElementById('camera-preview');video.srcObject=stream;await video.play();
      notice.textContent=detector?'Scanning ISBN-13… Keep the barcode steady.':'Scanning using built-in JavaScript EAN-13 reader… Keep barcode level and well lit.';
      const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});let misses=0;
      const tick=async()=>{if(state.dialog?.kind!=='scan'||!state.scanner)return;let found='';
        try {
          if(detector){const codes=await detector.detect(video);found=codes.map(x=>x.rawValue.replace(/\D/g,'')).find(x=>validISBN(x)&&/^97[89]\d{10}$/.test(x))||'';}
          if(!found&&video.videoWidth>0){canvas.width=640;canvas.height=Math.round(video.videoHeight*640/video.videoWidth);ctx.drawImage(video,0,0,canvas.width,canvas.height);found=window.FolioBarcode?.scan(ctx.getImageData(0,0,canvas.width,canvas.height))||'';}
        } catch(err){if(++misses===1)console.debug('Scanner frame skipped',err)}
        if(found){stopScan();openDialog({kind:'form',prefill:found});lookupISBN();return}
        state.scanLoop=setTimeout(tick,detector?300:550);
      };tick();
    }catch(e){stopScan();notice.textContent=`Camera unavailable (${e.name||'permission denied'}). You can type the ISBN below.`}
  }
  async function changeStatus(bookId,status){const old=findBook(bookId);if(!old)return;const b={...old,status,updatedAt:new Date().toISOString()};if(status==='completed'&&b.pages)b.currentPage=b.pages;
    if(status==='reading'&&!b.startedAt)b.startedAt=new Date().toISOString().slice(0,10);
    if(status==='completed'&&!b.finishedAt)b.finishedAt=new Date().toISOString().slice(0,10);
    try{await writeBook(b);renderDialog();render();toast('Reading status updated')}catch(err){saveError(err);renderDialog()}}
  async function deleteBook(bookId){const b=findBook(bookId);if(!b)return;if(!confirm(`Delete “${b.title}” from your library? This cannot be undone.`))return;
    const deleted={id:bookId,updatedAt:new Date().toISOString()};try{await FolioDB.removeBook(bookId,deleted);state.books=state.books.filter(x=>x.id!==bookId);state.tombstones.push(deleted);closeDialog();render();toast('Book deleted')}catch(err){saveError(err)}}
  function readActionTarget(event){return event.target.closest('[data-action],[data-page],[data-book],[data-status],[data-layout],[data-shelf],[data-detail-tab],[data-theme-option],[data-accent-option],[data-delete-note],[data-edit-note]')}
  document.addEventListener('click', async e=>{
    if(e.target.classList.contains('overlay')){closeDialog();return}
    const el=readActionTarget(e);if(!el)return;
    if(el.dataset.page){e.preventDefault();navigate(el.dataset.page);return}
    if(el.dataset.book){openDialog({kind:'detail',bookId:el.dataset.book});return}
    if(el.dataset.status){state.status=el.dataset.status;render();return}
    if(el.dataset.layout){state.layout=el.dataset.layout;render();return}
    if(el.dataset.shelf){const s=el.dataset.shelf;state.filters.shelf=s==='All books'?'all':s;state.status='all';state.query='';navigate('library');return}
    if(el.dataset.detailTab){state.detailTab=el.dataset.detailTab;renderDialog();return}
    if(el.dataset.themeOption){theme=el.dataset.themeOption;setPref(THEME_KEY,theme);render();toast('Theme preference saved');return}
    if(el.dataset.accentOption){accent=el.dataset.accentOption;setPref(ACCENT_KEY,accent);render();toast('Accent colour saved');return}
    if(el.dataset.deleteNote){const old=findBook(state.dialog?.bookId);if(!old)return;const n=old.notes.find(x=>x.id===el.dataset.deleteNote);if(!n||!confirm('Delete this note?'))return;const b={...old,notes:old.notes.filter(x=>x.id!==el.dataset.deleteNote),updatedAt:new Date().toISOString()};try{await writeBook(b);renderDialog();toast('Note deleted')}catch(err){saveError(err)}return}
    if(el.dataset.editNote){state.editingNoteId=el.dataset.editNote;renderDialog();return}
    switch(el.dataset.action){
      case'add-book':openDialog({kind:'form'});break;
      case'edit-book':openDialog({kind:'form',bookId:el.dataset.id});break;
      case'close-dialog':closeDialog();break;
      case'open-filters':openDialog({kind:'filters'});break;
      case'clear-filters':clearFilters();break;
      case'reset-advanced':state.filters={shelf:'all',genre:'all',tag:'all',minYear:'',maxYear:'',minPrice:'',maxPrice:''};closeDialog();render();break;
      case'export':exportBackup();break;
      case'export-csv':exportCSV();break;
      case'confirm-import':await confirmImport();break;
      case'cancel-note-edit':state.editingNoteId=null;renderDialog();break;
      case'storage-info':alert('IndexedDB keeps your records only in this browser profile. Clearing site data, private browsing, or device loss can delete it. Export JSON backups regularly, and use an HTTPS-hosted copy or localhost for reliable storage, offline installation and camera access.');break;
      case'import':document.getElementById('import-input').click();break;
      case'toggle-theme':theme=document.documentElement.dataset.theme==='dark'?'light':'dark';setPref(THEME_KEY,theme);render();break;
      case'isbn-lookup':lookupISBN();break;
      case'open-scan':openDialog({kind:'scan'});startScan();break;
      case'delete-book':deleteBook(el.dataset.id);break;
      case'new-shelf':{const name=plain(prompt('Name your new shelf:'));if(!name)return;if(state.shelves.some(s=>s.toLowerCase()===name.toLowerCase())){toast('That shelf already exists');return}try{await writeShelfSet([...state.shelves,name]);render();toast('Shelf created')}catch(err){saveError(err)}break}
      case'reset-demo':if(confirm('Restore the sample collection? This replaces your current books. Export a backup first.')){try{await FolioDB.replaceAll(structuredClone(sample),DEFAULT_SHELVES,[]);state.books=structuredClone(sample);state.shelves=[...DEFAULT_SHELVES];state.tombstones=[];render();toast('Sample books restored')}catch(err){saveError(err)}}break;
      case'clear-all':if(confirm('Delete ALL books stored in this browser? Export a backup first if needed.')){try{const deleted=state.books.map(b=>({id:b.id,updatedAt:new Date().toISOString()}));await FolioDB.replaceAll([],state.shelves,[...state.tombstones,...deleted]);state.books=[];state.tombstones.push(...deleted);render();toast('Library cleared')}catch(err){saveError(err)}}break;
      case'rename-shelf':await renameShelf(el.dataset.shelfName);break;
      case'delete-shelf':await deleteShelf(el.dataset.shelfName);break;
    }
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.dialog)closeDialog();if((e.key==='Enter'||e.key===' ')&&e.target.matches('.book-card')){e.preventDefault();openDialog({kind:'detail',bookId:e.target.dataset.book})}});
  document.addEventListener('input',e=>{if(e.target.id==='library-search'){state.query=e.target.value;updateLibraryResults()}if(e.target.id==='form-cover'&&e.target.value){const img=document.getElementById('form-cover-preview');if(img)img.src=e.target.value;state.formCover=e.target.value}});
  document.addEventListener('change',async e=>{
    if(e.target.id==='library-sort'){state.sort=e.target.value;updateLibraryResults()}
    if(e.target.dataset.quickStatus)changeStatus(e.target.dataset.quickStatus,e.target.value);
    if(e.target.id==='cover-upload'&&e.target.files?.[0]){try{state.formCover=await compressImage(e.target.files[0]);document.getElementById('form-cover-preview').src=state.formCover;document.getElementById('form-cover').value='';toast('Cover image ready')}catch(err){alert(err.message)}}
    if(e.target.id==='import-input'&&e.target.files?.[0]){await importBackup(e.target.files[0]);e.target.value=''}
  });
  document.addEventListener('submit',e=>{if(!['book-form','filters-form','progress-form','note-form','edit-note-form','manual-isbn-form'].includes(e.target.id))return;e.preventDefault();const form=e.target;
    if(form.id==='book-form')handleBookSave(form);
    if(form.id==='filters-form'){state.filters=Object.fromEntries(new FormData(form));closeDialog();render()}
    if(form.id==='progress-form'){const old=findBook(state.dialog?.bookId);if(!old)return;const b={...old,currentPage:Math.max(0,Math.min(Number(old.pages)||999999,Number(new FormData(form).get('currentPage'))||0)),updatedAt:new Date().toISOString()};writeBook(b).then(()=>{renderDialog();render();toast('Reading progress saved')}).catch(saveError)}
    if(form.id==='note-form'){const old=findBook(state.dialog?.bookId);if(!old)return;const b=withNote(old,new FormData(form).get('note'));writeBook(b).then(()=>{renderDialog();render();toast('Note added')}).catch(saveError)}
    if(form.id==='edit-note-form'){const old=findBook(state.dialog?.bookId);const noteId=form.dataset.noteId;const body=plain(new FormData(form).get('note'));if(!old||!body)return;const b={...old,notes:(old.notes||[]).map(n=>n.id===noteId?{...n,body,date:new Date().toISOString()}:n),updatedAt:new Date().toISOString()};writeBook(b).then(()=>{state.editingNoteId=null;renderDialog();render();toast('Note updated')}).catch(saveError)}
    if(form.id==='manual-isbn-form'){const isbn=plain(new FormData(form).get('isbn')).replace(/[\s-]/g,'');stopScan();openDialog({kind:'form',prefill:isbn});lookupISBN()}
  });
  document.addEventListener('error',e=>{const img=e.target;if(img instanceof HTMLImageElement&&img.dataset.coverTitle&&!img.dataset.fallback){img.dataset.fallback='1';img.src=placeholderCover(img.dataset.coverTitle)}},true);
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(theme==='system')applyTheme()});
  boot();
})();
