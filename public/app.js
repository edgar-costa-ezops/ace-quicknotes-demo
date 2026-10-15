(function () {
  'use strict';

  var SUBMIT_CREATE = 'Salvar';
  var SUBMIT_EDIT = 'Salvar alterações';
  var SEARCH_DEBOUNCE_MS = 150;
  var PREVIEW_BODY_LIMIT = 80;

  var notes = [];
  var editingId = null;
  var searchTerm = '';
  var pendingDelete = null;
  var triggerButton = null;

  var form = null;
  var titleInput = null;
  var bodyInput = null;
  var submitButton = null;
  var cancelEditButton = null;
  var grid = null;
  var searchInput = null;
  var counter = null;
  var dialog = null;
  var confirmTitle = null;
  var confirmBody = null;
  var emptyZero = null;
  var emptySearch = null;
  var searchTermOut = null;
  var clearSearchButton = null;
  var noteTemplate = null;

  var searchTimer = null;

  function colorIndex(id) {
    return ((Number(id) % 4) + 4) % 4;
  }

  function rotationFor(id) {
    var offsets = [-2, -1, 0, 1, 2];
    return offsets[((Number(id) * 37) % 5 + 5) % 5];
  }

  function reasonFrom(text, fallback) {
    try {
      var parsed = JSON.parse(text);
      if (parsed && typeof parsed.error === 'string') return parsed.error;
    } catch (_) {
      /* ignore — fall through */
    }
    return fallback;
  }

  function getVisible() {
    if (!searchTerm) return notes.slice();
    return notes.filter(function (n) {
      var title = (n.title || '').toLowerCase();
      var body = (n.body || '').toLowerCase();
      return title.indexOf(searchTerm) !== -1 || body.indexOf(searchTerm) !== -1;
    });
  }

  function renderCounter(visibleCount) {
    counter.textContent = '';
    if (!searchTerm) {
      var strong = document.createElement('strong');
      strong.textContent = String(notes.length);
      counter.appendChild(strong);
      counter.appendChild(document.createTextNode(' nota(s)'));
    } else {
      counter.appendChild(
        document.createTextNode(visibleCount + ' de ' + notes.length + ' visíveis')
      );
    }
  }

  function render() {
    while (grid.firstChild) grid.removeChild(grid.firstChild);

    var visible = getVisible();

    if (notes.length === 0) {
      emptyZero.hidden = false;
      emptySearch.hidden = true;
    } else if (searchTerm && visible.length === 0) {
      emptyZero.hidden = true;
      searchTermOut.textContent = searchInput.value.trim();
      emptySearch.hidden = false;
    } else {
      emptyZero.hidden = true;
      emptySearch.hidden = true;
    }

    if (notes.length > 0 && visible.length > 0) {
      visible.forEach(function (note) {
        var node = noteTemplate.content.firstElementChild.cloneNode(true);
        node.dataset.id = String(note.id);
        node.setAttribute('data-color-index', String(colorIndex(note.id)));
        node.style.setProperty('--rot', rotationFor(note.id) + 'deg');

        var titleEl = node.querySelector('.note-title');
        titleEl.textContent = note.title;

        var bodyEl = node.querySelector('.note-body');
        bodyEl.textContent = note.body;

        grid.appendChild(node);
      });
    }

    renderCounter(visible.length);
  }

  function filterAndRender() {
    render();
  }

  async function loadNotes() {
    try {
      var res = await fetch('/notes', { headers: { Accept: 'application/json' } });
      if (!res.ok) {
        return;
      }
      var data = await res.json();
      notes = Array.isArray(data) ? data : [];
    } catch (_) {
      notes = [];
    }
    render();
  }

  async function createNote(payload) {
    var res = await fetch('/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    return res;
  }

  async function updateNote(id, payload) {
    var res = await fetch('/notes/' + encodeURIComponent(id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    return res;
  }

  async function deleteNote(id) {
    var res = await fetch('/notes/' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });
    return res;
  }

  function startEdit(id) {
    var note = null;
    for (var i = 0; i < notes.length; i++) {
      if (notes[i].id === id) { note = notes[i]; break; }
    }
    if (!note) return;

    editingId = id;
    form.dataset.mode = 'edit';
    titleInput.value = note.title;
    bodyInput.value = note.body;
    submitButton.textContent = SUBMIT_EDIT;
    cancelEditButton.hidden = false;
    titleInput.focus();
  }

  function cancelEdit() {
    editingId = null;
    form.dataset.mode = 'create';
    titleInput.value = '';
    bodyInput.value = '';
    submitButton.textContent = SUBMIT_CREATE;
    cancelEditButton.hidden = true;
  }

  function openConfirm(note, sourceButton) {
    pendingDelete = note;
    triggerButton = sourceButton || document.activeElement;
    confirmTitle.textContent = note.title || '';
    var bodyText = note.body || '';
    confirmBody.textContent = bodyText.length > PREVIEW_BODY_LIMIT
      ? bodyText.slice(0, PREVIEW_BODY_LIMIT) + '…'
      : bodyText;
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  }

  async function onFormSubmit(event) {
    event.preventDefault();
    var payload = {
      title: titleInput.value,
      body: bodyInput.value,
    };
    try {
      if (editingId === null) {
        await createNote(payload);
      } else {
        await updateNote(editingId, payload);
      }
      cancelEdit();
      await loadNotes();
    } catch (_) {
      /* leave form populated so the user can retry */
    }
  }

  function onGridClick(event) {
    var target = event.target;
    while (target && target !== grid) {
      if (target.nodeType !== 1) { target = target.parentNode; continue; }
      var action = target.getAttribute && target.getAttribute('data-action');
      var article = target.closest && target.closest('.note');
      if (action && article) {
        var rawId = article.dataset.id;
        var id = Number(rawId);
        var note = null;
        for (var i = 0; i < notes.length; i++) {
          if (notes[i].id === id) { note = notes[i]; break; }
        }
        if (!note) return;
        if (action === 'edit') {
          startEdit(id);
        } else if (action === 'delete') {
          openConfirm(note, target);
        }
        return;
      }
      target = target.parentNode;
    }
  }

  function onSearchInput() {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      searchTerm = searchInput.value.trim().toLowerCase();
      filterAndRender();
    }, SEARCH_DEBOUNCE_MS);
  }

  function onKeydownGlobal(event) {
    if ((event.ctrlKey || event.metaKey) && event.key && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  }

  function onDialogClick(event) {
    if (event.target === dialog) {
      dialog.close('cancel');
    }
  }

  function onDialogClose() {
    if (dialog.returnValue === 'confirm' && pendingDelete) {
      var id = pendingDelete.id;
      deleteNote(id).then(function () {
        if (editingId === id) cancelEdit();
        return loadNotes();
      }).catch(function () { /* swallow */ });
    }
    if (triggerButton && typeof triggerButton.focus === 'function') {
      try { triggerButton.focus(); } catch (_) { /* ignore */ }
    }
    pendingDelete = null;
    triggerButton = null;
  }

  function onCancelEditClick() {
    cancelEdit();
  }

  function onClearSearchClick() {
    searchInput.value = '';
    searchTerm = '';
    filterAndRender();
    searchInput.focus();
  }

  function init() {
    form = document.getElementById('note-form');
    titleInput = document.getElementById('title');
    bodyInput = document.getElementById('body');
    submitButton = document.getElementById('submit-note');
    cancelEditButton = document.getElementById('cancel-edit');
    grid = document.getElementById('grid');
    searchInput = document.getElementById('search');
    counter = document.getElementById('counter');
    dialog = document.getElementById('confirm-dialog');
    confirmTitle = dialog.querySelector('.confirm-title');
    confirmBody = dialog.querySelector('.confirm-body');
    emptyZero = document.getElementById('empty-zero');
    emptySearch = document.getElementById('empty-search');
    searchTermOut = document.getElementById('search-term');
    clearSearchButton = document.getElementById('clear-search');
    noteTemplate = document.getElementById('note-template');

    form.addEventListener('submit', onFormSubmit);
    grid.addEventListener('click', onGridClick);
    searchInput.addEventListener('input', onSearchInput);
    document.addEventListener('keydown', onKeydownGlobal);
    dialog.addEventListener('click', onDialogClick);
    dialog.addEventListener('close', onDialogClose);
    cancelEditButton.addEventListener('click', onCancelEditClick);
    clearSearchButton.addEventListener('click', onClearSearchClick);

    loadNotes();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();