// ─── Sakshee CMS v1 ───────────────────────────────────────────────────────
// Private portfolio content manager — acting, modeling, blog

(function () {
  'use strict';

  // ── Config ──────────────────────────────────────────────────────────────
  const STORAGE_KEY = 'sakshee_cms_api';
  function getAPI() {
    return localStorage.getItem(STORAGE_KEY) || 'http://localhost:8097';
  }
  function setAPI(url) {
    localStorage.setItem(STORAGE_KEY, url.replace(/\/$/, ''));
  }

  // ── CSS ─────────────────────────────────────────────────────────────────
  const css = `
  .cms-wrap { padding: 2rem 2.5rem; }
  .cms-topbar { display:flex; justify-content:space-between; align-items:center;
    margin-bottom:1.75rem; padding-bottom:1rem;
    border-bottom:1px solid rgba(201,169,110,0.2); }
  .cms-topbar-title { font-family:'Cormorant Garamond',serif; font-size:1.5rem;
    font-style:italic; color:var(--ink); }
  .cms-api-badge { font-family:'Montserrat',sans-serif; font-size:0.5rem;
    letter-spacing:0.12em; text-transform:uppercase; color:var(--gold);
    opacity:0.7; cursor:pointer; }
  .cms-api-badge:hover { opacity:1; }

  /* Buttons */
  .cms-btn { font-family:'Montserrat',sans-serif; font-size:0.58rem;
    letter-spacing:0.18em; text-transform:uppercase; padding:0.55rem 1.3rem;
    border:1px solid var(--gold); background:none; color:var(--ink); cursor:pointer;
    transition:all .25s; white-space:nowrap; }
  .cms-btn:hover { background:var(--gold); color:#fff; }
  .cms-btn.primary { background:var(--gold); color:#fff; }
  .cms-btn.primary:hover { opacity:0.85; }
  .cms-btn.danger { border-color:#b5605a; color:#b5605a; }
  .cms-btn.danger:hover { background:#b5605a; color:#fff; }
  .cms-btn.sm { padding:0.3rem 0.75rem; font-size:0.52rem; }
  .cms-btn-row { display:flex; gap:.6rem; align-items:center; }

  /* Drop zone */
  .cms-drop { border:2px dashed rgba(201,169,110,0.3); border-radius:6px;
    padding:2.5rem; text-align:center; cursor:pointer; transition:all .25s;
    margin-bottom:1.75rem; }
  .cms-drop:hover, .cms-drop.over { border-color:var(--gold);
    background:rgba(201,169,110,0.04); }
  .cms-drop p { font-family:'Montserrat',sans-serif; font-size:0.62rem;
    letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-3); }
  .cms-drop span { color:var(--gold); }
  .cms-drop input { display:none; }
  .cms-progress { font-family:'Montserrat',sans-serif; font-size:0.58rem;
    color:var(--gold); text-align:center; margin:-.75rem 0 1rem; }

  /* File grid */
  .cms-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:1rem; }
  .cms-card { border:1px solid rgba(201,169,110,0.18); border-radius:4px;
    overflow:hidden; background:var(--warm); }
  .cms-card img { width:100%; aspect-ratio:4/3; object-fit:cover; display:block; }
  .cms-card .cms-icon { width:100%; aspect-ratio:4/3; display:flex;
    align-items:center; justify-content:center; font-size:2.2rem;
    background:rgba(201,169,110,0.06); }
  .cms-card-info { padding:.55rem .75rem; }
  .cms-card-name { font-family:'Montserrat',sans-serif; font-size:0.55rem;
    color:var(--ink-2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .cms-card-meta { font-family:'Montserrat',sans-serif; font-size:0.48rem;
    color:var(--gold); text-transform:uppercase; letter-spacing:.1em; margin-top:2px; }
  .cms-card-actions { padding:0 .75rem .75rem; }

  /* Empty */
  .cms-empty { text-align:center; padding:3.5rem 2rem;
    font-family:'Montserrat',sans-serif; font-size:0.6rem;
    letter-spacing:.15em; text-transform:uppercase; color:var(--ink-3); }

  /* Post list */
  .cms-post-list { display:flex; flex-direction:column; gap:.75rem; }
  .cms-post-row { display:flex; justify-content:space-between; align-items:center;
    padding:1rem 1.25rem; border:1px solid rgba(201,169,110,0.18);
    background:var(--warm); border-radius:4px; }
  .cms-post-title { font-family:'Cormorant Garamond',serif; font-size:1.1rem; color:var(--ink); }
  .cms-post-meta { font-family:'Montserrat',sans-serif; font-size:0.52rem;
    color:var(--ink-3); letter-spacing:.08em; margin-top:2px; }
  .cms-badge { display:inline-block; padding:1px 7px; border-radius:2px;
    font-family:'Montserrat',sans-serif; font-size:0.48rem;
    letter-spacing:.08em; text-transform:uppercase; margin-left:.6rem; }
  .pub  { background:rgba(181,96,90,.12); color:#b5605a; }
  .dft  { background:rgba(201,169,110,.12); color:var(--gold); }

  /* Modal */
  .cms-overlay { position:fixed; inset:0; z-index:9000;
    background:rgba(12,8,5,.93); display:flex;
    align-items:center; justify-content:center; padding:2rem; }
  .cms-modal { background:var(--cream); width:100%; max-width:680px;
    max-height:90vh; overflow-y:auto; border-radius:4px; padding:2.5rem; }
  .cms-modal h3 { font-family:'Cormorant Garamond',serif; font-size:1.75rem;
    font-style:italic; color:var(--ink); margin-bottom:1.75rem; }
  .cms-field { margin-bottom:1.1rem; }
  .cms-field label { display:block; font-family:'Montserrat',sans-serif;
    font-size:0.55rem; letter-spacing:.15em; text-transform:uppercase;
    color:var(--gold); margin-bottom:.45rem; }
  .cms-field input[type=text], .cms-field input[type=url], .cms-field textarea {
    width:100%; border:1px solid rgba(201,169,110,.28); background:var(--warm);
    padding:.6rem .85rem; font-family:'Cormorant Garamond',serif; font-size:1.05rem;
    color:var(--ink); outline:none; border-radius:2px; box-sizing:border-box; }
  .cms-field input:focus, .cms-field textarea:focus { border-color:var(--gold); }
  .cms-field textarea { min-height:220px; resize:vertical; line-height:1.75; }
  .cms-2col { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
  .cms-toggle-wrap { display:flex; align-items:center; gap:.65rem; }
  .cms-toggle-wrap input { width:17px; height:17px; accent-color:var(--gold); cursor:pointer; }
  .cms-toggle-wrap label { font-family:'Montserrat',sans-serif; font-size:0.58rem;
    letter-spacing:.1em; text-transform:uppercase; color:var(--ink-2); cursor:pointer; }
  .cms-cover-prev { width:100%; max-height:180px; object-fit:cover;
    border-radius:3px; margin-top:.5rem; }
  .cms-modal-footer { display:flex; justify-content:flex-end; gap:.65rem;
    margin-top:2rem; padding-top:1.5rem;
    border-top:1px solid rgba(201,169,110,.18); }

  /* API modal */
  .cms-api-modal input { width:100%; box-sizing:border-box;
    border:1px solid rgba(201,169,110,.28); background:var(--warm);
    padding:.6rem .85rem; font-family:'Montserrat',sans-serif; font-size:.75rem;
    color:var(--ink); outline:none; border-radius:2px; }
  .cms-api-modal input:focus { border-color:var(--gold); }
  .cms-api-note { font-family:'Montserrat',sans-serif; font-size:0.53rem;
    color:var(--ink-3); margin-top:.5rem; line-height:1.6; }
  `;
  if (!document.getElementById('cms-styles')) {
    const s = document.createElement('style');
    s.id = 'cms-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ── Utilities ────────────────────────────────────────────────────────────
  function fmtBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }
  function fmtDate(d) {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  function typeIcon(t) {
    return t === 'video' ? '🎬' : t === 'document' ? '📄' : null;
  }
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }

  // ── API ─────────────────────────────────────────────────────────────────
  async function apiFetch(path, opts = {}) {
    const base = getAPI();
    const res = await fetch(base + path, opts);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  // ── API URL modal ────────────────────────────────────────────────────────
  function showAPIModal() {
    const ov = el('div', 'cms-overlay');
    ov.innerHTML = `
      <div class="cms-modal cms-api-modal" style="max-width:480px">
        <h3>CMS API Server</h3>
        <div class="cms-field">
          <label>API URL</label>
          <input id="api-url-input" type="text" value="${getAPI()}"
            placeholder="https://xxxx.lhr.life or http://localhost:8097">
          <p class="cms-api-note">
            Running locally? Leave as <code>http://localhost:8097</code>.<br>
            Remote / tunneled? Paste your <strong>localhost.run</strong> or ngrok URL for port 8097.
          </p>
        </div>
        <div class="cms-modal-footer">
          <button class="cms-btn" id="api-cancel">Cancel</button>
          <button class="cms-btn primary" id="api-save">Save</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    const inp = ov.querySelector('#api-url-input');
    inp.focus(); inp.select();
    ov.querySelector('#api-cancel').onclick = () => ov.remove();
    ov.querySelector('#api-save').onclick = () => {
      const v = inp.value.trim();
      if (v) { setAPI(v); ov.remove(); }
    };
    ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  }

  // ── File Manager (acting / modeling) ─────────────────────────────────────
  function buildFileManager(section, container) {
    container.innerHTML = '';
    const wrap = el('div', 'cms-wrap');

    // Top bar
    const topbar = el('div', 'cms-topbar');
    topbar.innerHTML = `
      <div class="cms-topbar-title">${section.charAt(0).toUpperCase() + section.slice(1)}</div>`;
    const apiBtn = el('span', 'cms-api-badge', '⚙ API: ' + getAPI().replace('https://', '').replace('http://', ''));
    apiBtn.onclick = showAPIModal;
    topbar.appendChild(apiBtn);
    wrap.appendChild(topbar);

    // Drop zone
    const dz = el('div', 'cms-drop', `
      <p>Drop files here or <span>browse</span></p>
      <p style="margin-top:.35rem;font-size:0.5rem">Images · Videos · PDF · Word</p>
      <input type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx">
    `);
    const inp = dz.querySelector('input');
    dz.onclick = e => { if (e.target !== inp) inp.click(); };
    dz.ondragover = e => { e.preventDefault(); dz.classList.add('over'); };
    dz.ondragleave = () => dz.classList.remove('over');
    dz.ondrop = e => {
      e.preventDefault(); dz.classList.remove('over');
      doUpload(section, [...e.dataTransfer.files], grid, wrap);
    };
    inp.onchange = () => { doUpload(section, [...inp.files], grid, wrap); inp.value = ''; };
    wrap.appendChild(dz);

    // Grid
    const grid = el('div', 'cms-grid');
    wrap.appendChild(grid);
    container.appendChild(wrap);

    loadFiles(section, grid);
  }

  async function loadFiles(section, grid) {
    grid.innerHTML = '<div class="cms-empty">Loading…</div>';
    try {
      const files = await apiFetch('/files/' + section);
      renderGrid(section, files, grid);
    } catch {
      grid.innerHTML = '<div class="cms-empty">⚠ Could not reach CMS server — check API URL</div>';
    }
  }

  function renderGrid(section, files, grid) {
    grid.innerHTML = '';
    if (!files.length) {
      grid.innerHTML = '<div class="cms-empty">No files yet — upload something</div>';
      return;
    }
    files.forEach(f => {
      const card = el('div', 'cms-card');
      const icon = typeIcon(f.file_type);
      card.innerHTML = icon
        ? `<div class="cms-icon">${icon}</div>`
        : `<img src="${f.url}" alt="${f.original_name}" loading="lazy">`;
      card.innerHTML += `
        <div class="cms-card-info">
          <div class="cms-card-name" title="${f.original_name}">${f.original_name}</div>
          <div class="cms-card-meta">${f.file_type} · ${fmtBytes(f.size)}</div>
        </div>
        <div class="cms-card-actions">
          <button class="cms-btn sm danger" data-del="${f.id}">Delete</button>
        </div>`;
      card.querySelector('[data-del]').onclick = async () => {
        if (!confirm('Delete this file?')) return;
        try {
          await apiFetch(`/files/${section}/${f.id}`, { method: 'DELETE' });
          loadFiles(section, grid);
        } catch { alert('Delete failed'); }
      };
      grid.appendChild(card);
    });
  }

  async function doUpload(section, files, grid, wrap) {
    const prog = el('div', 'cms-progress');
    wrap.insertBefore(prog, wrap.children[2]); // after topbar + dropzone
    for (let i = 0; i < files.length; i++) {
      prog.textContent = `Uploading ${i + 1} of ${files.length} — ${files[i].name}`;
      const fd = new FormData();
      fd.append('file', files[i]);
      try { await apiFetch(`/upload/${section}`, { method: 'POST', body: fd }); }
      catch (e) { console.error('Upload error:', e); }
    }
    prog.remove();
    loadFiles(section, grid);
  }

  // ── Blog Manager ─────────────────────────────────────────────────────────
  function buildBlogManager(container) {
    container.innerHTML = '';
    const wrap = el('div', 'cms-wrap');

    const topbar = el('div', 'cms-topbar');
    topbar.innerHTML = `<div class="cms-topbar-title">Blog</div>`;
    const right = el('div', 'cms-btn-row');
    const apiBtn = el('span', 'cms-api-badge', '⚙ API: ' + getAPI().replace('https://', '').replace('http://', ''));
    apiBtn.onclick = showAPIModal;
    const newBtn = el('button', 'cms-btn primary sm', '+ New Post');
    newBtn.onclick = () => openPostModal(null, container, list);
    right.appendChild(apiBtn);
    right.appendChild(newBtn);
    topbar.appendChild(right);
    wrap.appendChild(topbar);

    const list = el('div', 'cms-post-list');
    wrap.appendChild(list);
    container.appendChild(wrap);

    loadPosts(list, container);
  }

  async function loadPosts(list, container) {
    list.innerHTML = '<div class="cms-empty">Loading…</div>';
    try {
      const posts = await apiFetch('/blog');
      renderPosts(posts, list, container);
    } catch {
      list.innerHTML = '<div class="cms-empty">⚠ Could not reach CMS server — check API URL</div>';
    }
  }

  function renderPosts(posts, list, container) {
    list.innerHTML = '';
    if (!posts.length) {
      list.innerHTML = '<div class="cms-empty">No posts yet — write something</div>';
      return;
    }
    posts.forEach(p => {
      const row = el('div', 'cms-post-row');
      row.innerHTML = `
        <div>
          <div class="cms-post-title">${p.title}
            <span class="cms-badge ${p.published ? 'pub' : 'dft'}">${p.published ? 'Published' : 'Draft'}</span>
          </div>
          <div class="cms-post-meta">${fmtDate(p.created_at)}${p.tags ? ' · ' + p.tags : ''}</div>
        </div>
        <div class="cms-btn-row">
          <button class="cms-btn sm" data-edit>Edit</button>
          <button class="cms-btn sm danger" data-del>Delete</button>
        </div>`;
      row.querySelector('[data-edit]').onclick = () => openPostModal(p, container, list);
      row.querySelector('[data-del]').onclick = async () => {
        if (!confirm('Delete "' + p.title + '"?')) return;
        try { await apiFetch('/blog/' + p.id, { method: 'DELETE' }); loadPosts(list, container); }
        catch { alert('Delete failed'); }
      };
      list.appendChild(row);
    });
  }

  function openPostModal(post, container, list) {
    const isNew = !post;
    const ov = el('div', 'cms-overlay');
    ov.innerHTML = `
      <div class="cms-modal">
        <h3>${isNew ? 'New Post' : 'Edit Post'}</h3>
        <div class="cms-field">
          <label>Title *</label>
          <input type="text" id="pm-title" value="${post?.title || ''}" placeholder="Post title">
        </div>
        <div class="cms-field">
          <label>Subtitle</label>
          <input type="text" id="pm-sub" value="${post?.subtitle || ''}" placeholder="Optional">
        </div>
        <div class="cms-field">
          <label>Body</label>
          <textarea id="pm-body" placeholder="Write your post…">${post?.body || ''}</textarea>
        </div>
        <div class="cms-2col">
          <div class="cms-field">
            <label>Tags</label>
            <input type="text" id="pm-tags" value="${post?.tags || ''}" placeholder="acting, life, travel">
          </div>
          <div class="cms-field">
            <label>Cover Image URL</label>
            <input type="url" id="pm-cover" value="${post?.cover_image || ''}" placeholder="https://…">
            ${post?.cover_image ? `<img class="cms-cover-prev" src="${post.cover_image}">` : ''}
          </div>
        </div>
        <div class="cms-field">
          <label>Or Upload Cover Photo</label>
          <input type="file" id="pm-cover-file" accept="image/*">
        </div>
        <div class="cms-field">
          <div class="cms-toggle-wrap">
            <input type="checkbox" id="pm-pub" ${post?.published ? 'checked' : ''}>
            <label for="pm-pub">Published (visible on site)</label>
          </div>
        </div>
        <div class="cms-modal-footer">
          <button class="cms-btn" id="pm-cancel">Cancel</button>
          <button class="cms-btn primary" id="pm-save">Save Post</button>
        </div>
      </div>`;
    document.body.appendChild(ov);

    ov.querySelector('#pm-cancel').onclick = () => ov.remove();
    ov.onclick = e => { if (e.target === ov) ov.remove(); };

    ov.querySelector('#pm-save').onclick = async () => {
      const title = ov.querySelector('#pm-title').value.trim();
      if (!title) { alert('Title is required'); return; }

      const payload = {
        title,
        subtitle: ov.querySelector('#pm-sub').value.trim() || null,
        body: ov.querySelector('#pm-body').value.trim() || null,
        tags: ov.querySelector('#pm-tags').value.trim() || null,
        cover_image: ov.querySelector('#pm-cover').value.trim() || null,
        published: ov.querySelector('#pm-pub').checked,
      };

      const btn = ov.querySelector('#pm-save');
      btn.disabled = true; btn.textContent = 'Saving…';

      try {
        let id;
        if (isNew) {
          const r = await apiFetch('/blog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          id = r.id;
        } else {
          await apiFetch('/blog/' + post.id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          id = post.id;
        }

        // Cover upload
        const cf = ov.querySelector('#pm-cover-file').files[0];
        if (cf && id) {
          const fd = new FormData(); fd.append('file', cf);
          await apiFetch('/blog/' + id + '/cover', { method: 'POST', body: fd });
        }

        ov.remove();
        loadPosts(list, container);
      } catch (e) {
        btn.disabled = false; btn.textContent = 'Save Post';
        alert('Save failed: ' + e.message);
      }
    };
  }

  // ── Watcher: inject into portfolio tabs when they become active ───────────
  let injected = { acting: false, modeling: false, blog: false };

  function injectIfReady() {
    const pw = document.getElementById('portfolio-world');
    if (!pw || !pw.classList.contains('visible')) return;

    ['acting', 'modeling', 'blog'].forEach(sec => {
      const panel = pw.querySelector(`[data-pf-tab="${sec}"]`);
      if (!panel) return;
      const active = panel.classList.contains('active') || panel.style.display !== 'none';
      if (!active) return;
      if (panel.dataset.cmsInit) return; // already done
      panel.dataset.cmsInit = '1';
      if (sec === 'blog') buildBlogManager(panel);
      else buildFileManager(sec, panel);
    });
  }

  // Also handle tab-switch clicks to reinit panels on demand
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-pf-tab-btn]');
    if (!btn) return;
    const sec = btn.getAttribute('data-pf-tab-btn');
    setTimeout(() => {
      const pw = document.getElementById('portfolio-world');
      if (!pw) return;
      const panel = pw.querySelector(`[data-pf-tab="${sec}"]`);
      if (!panel) return;
      delete panel.dataset.cmsInit;   // allow reinit
      injectIfReady();
    }, 150);
  });

  const obs = new MutationObserver(injectIfReady);
  obs.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
  document.addEventListener('DOMContentLoaded', injectIfReady);

})();
