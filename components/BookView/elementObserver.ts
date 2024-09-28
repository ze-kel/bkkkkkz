type IObsCallback = (isIntesecting: boolean) => void;

class ElObserver {
  observer: IntersectionObserver;
  callbacks: Record<string, IObsCallback>;
  triggerCallback(entries: IntersectionObserverEntry[]) {
    entries.forEach((entry) => {
      const id = entry.target.id;
      if (this.callbacks[id]) {
        this.callbacks[id](entry.isIntersecting);
      }
    });
  }

  watchElement(element: Element, callback: IObsCallback) {
    if (!this.observer) {
      throw 'Trying to use observer without it being present';
    }

    this.callbacks[element.id] = callback;

    this.observer.observe(element);
  }

  unwatchElement(element: Element) {
    delete this.callbacks[element.id];
  }

  constructor(element: Element) {
    this.observer = new IntersectionObserver(this.triggerCallback.bind(this), {
      root: element,
      threshold: [0, 0.01, 1],
      rootMargin: '200%',
    });
    this.callbacks = {};
  }

  destroy(element: Element) {
    this.observer.unobserve(element);
  }
}

export default ElObserver;
