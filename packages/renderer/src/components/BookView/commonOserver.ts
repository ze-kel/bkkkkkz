let observer: IntersectionObserver;

type IObsCallback = (isIntesecting: boolean) => void;

const callbacks: Record<string, IObsCallback> = {};

const initializeOserver = (element: Element) => {
  observer = new IntersectionObserver(triggerCallback, {
    root: element,
    threshold: [0, 0.01, 1],
    rootMargin: '200%',
  });
};

const triggerCallback = (entries: IntersectionObserverEntry[]) => {
  entries.forEach((entry) => {
    const id = entry.target.id;
    if (callbacks[id]) {
      callbacks[id](entry.isIntersecting);
    }
  });
};

const watchElement = (element: Element, callback: IObsCallback) => {
  if (!observer) {
    throw 'Trying to use observer without it being present';
  }

  callbacks[element.id] = callback;

  observer.observe(element);
};

const unwatchElement = (element: Element) => {
  delete callbacks[element.id];
};

export { watchElement, unwatchElement, initializeOserver };
