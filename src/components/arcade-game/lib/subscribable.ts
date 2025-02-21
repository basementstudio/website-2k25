import { useEffect } from "react"
import { nanoid } from 'nanoid';

// eslint-disable-next-line @typescript-eslint/ban-types
export interface Subscribable<T extends Function = () => void> {
  addCallback: (callback: T, id?: string) => string;
  removeCallback: (id: string | T) => void;
  getCallbacks: () => T[];
  getCallback: (id: string) => T;
  getCallbackIds: () => string[];
  clearCallbacks: () => void;
  runCallbacks: T;
}

export const subscribable = <
  // eslint-disable-next-line @typescript-eslint/ban-types
  T extends Function = () => void,
>(): Subscribable<T> => {
  const callbacks: Record<string, T> = {};

  const addCallback = (callback: T, id: string): string => {
    const _id = id || nanoid(4);
    callbacks[_id] = callback;
    return _id;
  };

  // eslint-disable-next-line @typescript-eslint/ban-types
  const removeCallback = (id: string | Function): void => {
    if (typeof id === 'function') {
      const key = Object.keys(callbacks).find((k) => callbacks[k] === id);
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      if (key) delete callbacks[key];
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete callbacks[id];
  };

  const getCallbacks = (): T[] => Object.values(callbacks);

  const getCallback = (id: string): T => callbacks[id];

  const clearCallbacks = (): void => {
    Object.keys(callbacks).forEach((id) => {
      removeCallback(id);
    });
  };

  const runCallbacks = (...params: unknown[]): void => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    let response = undefined as any;
    Object.values(callbacks).forEach((callback) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      response = callback(...params);
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response;
  };

  return {
    addCallback,
    removeCallback,
    getCallback,
    getCallbacks,
    getCallbackIds: () => Object.keys(callbacks),
    clearCallbacks,
    runCallbacks: runCallbacks as unknown as T,
  } as Subscribable<T>;
};


export const useSubscribe = <T extends () => void = () => void>(subscribable: Subscribable<T>, callback: T, deps: unknown[] = []) => {
  useEffect(() => {
    const id = subscribable.addCallback(callback)
    return () => subscribable.removeCallback(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribable, ...deps])
}
