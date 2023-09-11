import { twMerge } from 'tw-merge';
import { clsx } from 'clsx';

export function classMerge(...classes: (string | boolean)[]) {
  return twMerge(clsx(...classes));
}

export default classMerge;
