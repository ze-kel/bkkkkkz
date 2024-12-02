### ~~BkzLogger~~ To be renamed

App to store and browse your opinions about books\movies\games\apps\etc. saved as .md files. Pairs well with your vault in Obisidian or similar software.

### Current state

updated: 02 December 2024

Originally this started as a Goodreads alternative, and most of the code was written when I was an inexperienced dev. I ended up making a working but unpolished and buggy app with poor UX.

Recently I decided to return to this idea and attempt to make it into something actually good. This means almost a full rewrite.

Current goals:

1. Make a more generalized app, that supports custom schemas for markdown metadata. This will allow user to have different schemas for different folder: one for books, one for movies etc. This foundation will allow many different use cases.
2. Rewrite backend logic to Rust+Tauri. Use SQL cache layer to effectivelly query items. Rewrite frontend to Nuxt, improve
3. Significantly improve UI & UX. Make it an app I enjoy using.