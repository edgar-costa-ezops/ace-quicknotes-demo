# ace-quicknotes-demo
Minimal notes API used to test the ACE platform end-o-end (new project, own repo, ACE-driven implementaton).

## Quick start

Requires Node.js >= 18.

```bash
npm install      # installs express, better-sqlite3 (runtime) and jest, supertest (dev)
npm start        # boots the server on http://127.0.0.1:3000
npm test         # runs the Jest + supertest integration suite (jest --runInBand)
```

## Web UI
Após rodar `npm start`, abra `http://localhost:3000/` no navegador — a interface web é servida de `public/` e consome a mesma API acima.

### Endpoints

| Method | Route        | Behavior                                       | Status      |
|--------|--------------|------------------------------------------------|-------------|
| POST   | /notes       | Create a note (`{title, body}` JSON)            | 201 / 400   |
| GET    | /notes       | List all notes                                  | 200         |
| GET    | /notes/:id   | Fetch a single note                             | 200 / 404   |
| DELETE | /notes/:id   | Hard-delete a note                              | 204 / 404   |

Validation: `title` is required, must be a non-empty string (trimmed) and at most 200 characters; `body` is required and must be a non-empty string. Validation errors return `400` with `{ "error": "<message>" }`. Missing or non-existent ids return `404` with `{ "error": "Note not found" }`.

Data is persisted to a local SQLite file at `./data/quicknotes.db` (created on first run). The `data/` directory is gitkept; the `*.db` files are ignored.

## UI features

A interface web (`public/index.html`, `public/styles.css`, `public/app.js`) entrega um "mural de post-its" deliberado e cinco features pequenas:

### Editar
Clicar no ícone de lápis em uma nota abre o modo de edição inline — o mesmo formulário fica pré-preenchido e o botão principal muda para "Salvar alterações". O submit chama `PUT /notes/:id` com `{title, body}` (mesma validação do POST). Como a cor do post-it é atribuída deterministicamente por `id % 4` no front-end e o `PUT` não muda o `id`, a cor do post-it é preservada após a edição.

### Buscar
O campo acima da muralha filtra client-side por substring case-insensitive em `title` OU `body`. O input dispara um debounce de 150 ms antes de re-renderizar. Atalho `Ctrl+K` (Windows/Linux) ou `Cmd+K` (macOS) foca o campo e seleciona o texto atual. Quando a busca não retorna nada, o mural mostra o empty state de busca com um botão "Limpar busca" que esvazia o campo, devolve a lista completa e mantém o foco na busca.

### Contador
No cabeçalho, o contador mostra `<strong>N</strong> nota(s)` quando a busca está vazia e `X de N visíveis` quando há um termo ativo. Ele é atualizado depois de criar, editar, excluir ou filtrar.

### Confirmar exclusão
Clicar no ícone de lixeira abre um `<dialog>` nativo do HTML com o preview da nota (title + primeiros ~80 caracteres do body, com reticências quando trunca). O botão "Cancelar" tem `autofocus` e é o default — `Esc` e clicar no backdrop também fecham como cancelamento. Confirmar chama `DELETE /notes/:id` e devolve o foco para o botão que abriu o diálogo.

### Empty states
Dois estados vazios com SVG inline:
- **Zero notas** (sem busca): ilustração de uma página em branco com um post-it amarelo, texto "Sua primeira nota está aqui embaixo" e uma seta apontando para o formulário.
- **Busca sem resultado**: texto "Nenhuma nota encontrada para '<termo>'" e botão "Limpar busca".
