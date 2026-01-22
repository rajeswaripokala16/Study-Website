// Main JS: handles menu, loads data, renders sections

// Mobile menu toggle
const mobileBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
if (mobileBtn && mobileMenu) {
  mobileBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
  });
}

// Year in footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Utility: fetch JSON with graceful errors
async function safeJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed: ' + res.status);
    return await res.json();
  } catch (e) {
    console.warn('Data load error for', url, e);
    return [];
  }
}

// PDFs rendering
async function initPdfs() {
  const data = await safeJson('/assets/js/data/pdfs.json');
  const grid = document.getElementById('pdfGrid');
  const tagSel = document.getElementById('pdfTagFilter');
  const search = document.getElementById('pdfSearch');
  if (!grid || !tagSel || !search) return;

  // Build tag options
  const tags = Array.from(new Set(data.flatMap(d => d.tags || []))).sort();
  for (const t of tags) {
    const opt = document.createElement('option');
    opt.value = t; opt.textContent = t; tagSel.appendChild(opt);
  }

  function match(item) {
    const q = search.value.trim().toLowerCase();
    const tag = tagSel.value;
    const inText = !q || item.title.toLowerCase().includes(q) || (item.summary||'').toLowerCase().includes(q);
    const inTag = !tag || (item.tags||[]).includes(tag);
    return inText && inTag;
  }

  function card(item) {
    return `
      <article class="group border rounded-lg overflow-hidden bg-white hover:bg-brand/5 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 flex flex-col">
        <div class="h-32 bg-slate-100"></div>
        <div class="p-4 flex-1 flex flex-col">
          <h3 class="font-semibold group-hover:text-brand transition-colors">${item.title}</h3>
          <p class="text-sm text-slate-600 mt-1">${item.summary || ''}</p>
          <div class="mt-2 text-xs text-slate-500">${(item.tags||[]).map(t=>`#${t}`).join(' ')}</div>
          <a href="${item.url}" download class="mt-4 px-3 py-2 bg-brand text-white rounded self-start hover:bg-brand-dark text-sm">Download</a>
        </div>
      </article>`;
  }

  function languageFrom(item) {
    const tags = (item.tags || []).map(t => t.toLowerCase());
    const known = ["javascript","python","java","c","c++","c#","go","rust","php","ruby","kotlin","swift","typescript"]; 
    const found = known.find(k => tags.includes(k));
    return found || (tags[0] || 'general');
  }

  function render() {
    const filtered = data.filter(match);
    const groups = new Map();
    for (const it of filtered) {
      const lang = languageFrom(it);
      if (!groups.has(lang)) groups.set(lang, []);
      groups.get(lang).push(it);
    }
    const sections = Array.from(groups.entries())
      .sort((a,b)=>a[0].localeCompare(b[0]))
      .map(([lang, items]) => `
        <div class="mt-8">
          <h3 class="text-xl font-semibold inline-block transition hover:text-brand hover:underline underline-offset-4 decoration-brand/60 px-2 rounded hover:bg-brand/10">${lang.toUpperCase()}</h3>
          <div class="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            ${items.map(card).join('')}
          </div>
        </div>
      `).join('');
    grid.innerHTML = sections || '<p class="text-slate-500">No PDFs found.</p>';
  }

  search.addEventListener('input', render);
  tagSel.addEventListener('change', render);
  render();
}

// Channels rendering
async function initChannels() {
  const data = await safeJson('/assets/js/data/channels.json');
  const grid = document.getElementById('channelGrid');
  if (!grid) return;
  // Group channels by primary topic/language and render sections
  const groups = new Map();
  for (const ch of data) {
    const topics = (ch.topics || []).map(t => t.toLowerCase());
    const known = ["javascript","python","java","c","c++","c#","go","rust","php","ruby","kotlin","swift","typescript","web dev"];
    const key = known.find(k => topics.includes(k)) || (topics[0] || 'general');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(ch);
  }
  grid.innerHTML = Array.from(groups.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([key, items]) => `
    <div class="mt-8">
      <h3 class="text-xl font-semibold inline-block transition hover:text-brand hover:underline underline-offset-4 decoration-brand/60 px-2 rounded hover:bg-brand/10">${key.toUpperCase()}</h3>
      <div class="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${items.map(ch => `
          <article class="group border rounded-lg overflow-hidden bg-white hover:bg-brand/5 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
            <div class="h-40 bg-slate-100 flex items-center justify-center">
              ${ch.logo ? `<img src="${ch.logo}" alt="${ch.name} logo" class="h-24 object-contain transition-transform group-hover:scale-105">` : '<span class="text-slate-400">Logo</span>'}
            </div>
            <div class="p-4">
              <a href="${ch.url}" target="_blank" rel="noopener" class="font-semibold text-brand hover:underline">${ch.name}</a>
              <p class="text-sm text-slate-600 mt-1">${ch.description || ''}</p>
              <div class="mt-2 text-xs text-slate-500">Topics: ${(ch.topics||[]).join(', ')}</div>
            </div>
          </article>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// Blog preview: fetch simple index from blog/index.html by scanning links? We'll maintain a small data file for simplicity.
async function initBlog() {
  const list = document.getElementById('blogList');
  if (!list) return;
  const posts = await safeJson('/assets/js/data/blog.json');
  list.innerHTML = posts.slice(0, 6).map(p => `
    <article class="group border rounded-lg overflow-hidden bg-white hover:bg-slate-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
      <div class="h-32 bg-slate-100"></div>
      <div class="p-4">
        <a href="${p.url}" class="font-semibold text-brand hover:underline group-hover:text-brand">${p.title}</a>
        <p class="text-sm text-slate-600 mt-1">${p.excerpt || ''}</p>
        <div class="text-xs text-slate-500 mt-2">${p.date || ''}</div>
      </div>
    </article>`).join('');
}

window.addEventListener('DOMContentLoaded', () => {
  initPdfs();
  initChannels();
  initBlog();
});