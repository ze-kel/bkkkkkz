import { twMerge } from 'tailwind-merge';
import { cx } from 'class-variance-authority';

// Merges classes while removing tailwind conflicts
// 'p-2 mt-4 p-4' => 'mt-4 p-4'
export function cls(...classes: (string | boolean)[]) {
  return twMerge(cx(...classes));
}

export default cls;
