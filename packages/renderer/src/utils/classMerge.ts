import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

export function classMerge(...classes: (string | boolean)[]) {
  return twMerge(clsx(...classes));
}

export default classMerge;
