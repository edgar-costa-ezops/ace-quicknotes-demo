(function () {
  'use strict';

  var form = null;
  var list = null;
  var statusEl = null;
  var todayEl = null;

  var dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' });
  var listFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  function setStatus(message, kind) {
    if (!statusEl) return;
    statusEl.textContent = message || '';
    if (kind) {
      statusEl.setAttribute('data-kind', kind);
    } else {
      statusEl.removeAttribute('data-kind');
    }
  }

  function clearStatus() {
    setStatus('', null);
  }

  function reasonFrom(body, fallback) {
    try {
      var parsed = JSON.parse(body);
      if (parsed && typeof parsed.error === 'string') return parsed.error;
    } catch (_) {
      // ignore — fall through
    }
    return fallback;
  }

  function clearList() {
    while (list.firstChild) list.removeChild(list.firstChild);
  }

  function makeEmpty() {
    var li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Sem notas ainda — escreva a primeira acima.';
    return li;
  }

  function renderNote(note) {
    var li = document.createElement('li');
    li.className = 'note';
    li.setAttribute('data-id', String(note.id));

    var h3 = document.createElement('h3');
    h3.className = 'note-title';
    h3.textContent = note.title;

    var pBody = document.createElement('p');
    pBody.className = 'note-body';
    pBody.textContent = note.body;

    var pMeta = document.createElement('p');
    pMeta.className = 'note-meta';

    var time = document.createElement('time');
    time.setAttribute('datetime', note.created_at);
    time.textContent = formatDate(note.created_at);
    pMeta.appendChild(time);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('data-action', 'delete');
    btn.setAttribute('data-id', String(note.id));
    btn.textContent = 'Excluir';

    li.appendChild(h3);
    li.appendChild(pBody);
    li.appendChild(pMeta);
    li.appendChild(btn);
    return li;
  }

  function formatDate(iso) {
    try {
      return listFmt.format(new Date(iso));
    } catch (_) {
      return iso;
    }
  }

  function renderNotes(notes) {
    clearList();
    if (!notes || notes.length === 0) {
      list.appendChild(makeEmpty());
      return;
    }
    notes.forEach(function (n) {
      list.appendChild(renderNote(n));
    });
  }

  async function loadNotes() {
    clearStatus();
    try {
      var res = await fetch('/notes', { headers: { Accept: 'application/json' } });
      if (!res.ok) {
        var errReason = reasonFrom(await res.text(), 'resposta ' + res.status);
        setStatus('Não foi possível carregar as notas: ' + errReason + '.', 'error');
        return;
      }
      var data = await res.json();
      renderNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      setStatus('Não foi possível carregar as notas: ' + (err.message || 'falha de rede') + '.', 'error');
    }
  }

  async function createNote(formEl) {
    clearStatus();
    var fd = new FormData(formEl);
    var title = (fd.get('title') || '').toString();
    var body = (fd.get('body') || '').toString();

    try {
      var res = await fetch('/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ title: title, body: body }),
      });
      if (res.status === 201) {
        formEl.querySelector('#title').value = '';
        formEl.querySelector('#body').value = '';
        await loadNotes();
        return;
      }
      var reason = reasonFrom(await res.text(), 'resposta ' + res.status);
      setStatus('Não foi possível salvar: ' + reason + '.', 'error');
    } catch (err) {
      setStatus('Não foi possível salvar: ' + (err.message || 'falha de rede') + '.', 'error');
    }
  }

  async function deleteNote(id) {
    clearStatus();
    try {
      var res = await fetch('/notes/' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      if (res.status === 204) {
        await loadNotes();
        return;
      }
      var reason = reasonFrom(await res.text(), 'resposta ' + res.status);
      setStatus('Não foi possível excluir: ' + reason + '.', 'error');
    } catch (err) {
      setStatus('Não foi possível excluir: ' + (err.message || 'falha de rede') + '.', 'error');
    }
  }

  function onListClick(event) {
    var target = event.target;
    while (target && target !== list) {
      if (target.nodeType === 1 && target.getAttribute('data-action') === 'delete') {
        var id = target.getAttribute('data-id');
        if (id) deleteNote(id);
        return;
      }
      target = target.parentNode;
    }
  }

  function onFormSubmit(event) {
    event.preventDefault();
    createNote(form);
  }

  function setToday() {
    if (!todayEl) return;
    todayEl.textContent = dateFmt.format(new Date());
  }

  function init() {
    form = document.getElementById('note-form');
    list = document.getElementById('notes-list');
    statusEl = document.getElementById('status');
    todayEl = document.getElementById('today');

    setToday();
    if (form) form.addEventListener('submit', onFormSubmit);
    if (list) list.addEventListener('click', onListClick);
    loadNotes();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
