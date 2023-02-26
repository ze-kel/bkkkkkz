### Current state
updated: 26.03.2023

I left it in a messy and unfinished state last year. Over the last couple of weeks, I did several refactors, while learning from my previous mistakes.

I'm unsure about my commitment to it long-term because this project:
- requires a lot of work to make it file browsing and editing experience comparable to vscode\obsidian\someothermdapp
- made with in vue3 which I do not enjoy working with that much
- doesn't interest me enough to overcome the points above

I'll probably work some more on it, but no big plans rn

### BkzLogger

App to store data about books you've read in plaintext markdown.
Goodreads-like functionality except for all the social stuff.
Integrates perfectly with your markdown notes in Obsidian or similar apps.

![](./docs_content/image.png)

### Developing

Use at least node specified in `.nvmrc`

`npm run watch` to run in dev mode

`npm run test` to run e2e tests

`npm run compile` to build for production
