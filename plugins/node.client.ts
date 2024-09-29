import { Buffer } from 'node:buffer';
import process from 'node:process';

// This is needed to support gray-matter library.
// Can be deleted after migration to rust frontmatter parsing
globalThis.Buffer = Buffer;
globalThis.process = process;

export default defineNuxtPlugin({});
