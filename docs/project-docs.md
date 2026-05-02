# Project Docs

## Data Model

- `project_documents` stores project-scoped markdown documents.
- Each document has `title`, `markdown`, `version`, and optional
  `last_edited_by`.
- `project_document_revisions` stores saved markdown snapshots by version.
- `project_document_assets` stores uploaded editor assets on the public disk.
- `Project::boot()` creates one default `Project Docs` document for new projects.

## Routes

- `GET /{project}/docs` opens the docs workspace on the oldest document.
- `GET /{project}/docs/{document}` opens a specific project document.
- `POST /{project}/docs` creates a titled markdown document.
- `PATCH /{project}/docs/{document}` renames a document.
- `PATCH /{project}/docs/{document}/content` saves markdown with optimistic
  version checks.
- `POST /{project}/docs/{document}/assets` stores uploaded files and returns a
  public URL.
- `DELETE /{project}/docs/{document}` deletes a document unless it is the last
  project document, then redirects to the next remaining document.

## Editor

- The docs page uses `resources/js/components/project-docs`.
- `DocumentEditor` is a simple Tiptap editor, not the earlier Notion-style
  editor tree.
- New documents are created from a sidebar button that opens a naming dialog.
- Document deletion is confirmed with a shadcn dialog before the request.
- Markdown is the canonical persisted format.
- `docs-markdown.ts` converts markdown into editor HTML and serializes common
  Tiptap JSON nodes back to markdown.
- The toolbar exposes headings, marks, lists, quotes, code blocks, horizontal
  rules, links, and image upload.

## Collaboration

- Saves broadcast `ProjectDocumentSaved` on
  `presence-project.{project}.docs.{document}`.
- Presence membership is authorized only for project members and matching
  project documents.
- The frontend listens with `useEchoPresence` and applies remote saves when the
  local editor is clean.
- Local edits with stale versions show a conflict state instead of overwriting
  the remote version.
- Selection whispers use `docsSelection` to draw remote collaborator cursors.

## Templates

- `ProjectTemplatePayloadBuilder` includes documents in template payloads.
- `ProjectTemplateApplier` replaces the clone's default document when template
  documents are present.
- Template-applied documents reset `version` to `1` and do not preserve the
  original `last_edited_by`.
