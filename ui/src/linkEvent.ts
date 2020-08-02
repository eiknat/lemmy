// mimic the linkEvent function from inferno for easier migration

// helpers from inferno-shared
// https://github.com/infernojs/inferno/blob/master/packages/inferno-shared/src/index.ts
export function isFunction(o: any): o is Function {
  return typeof o === "function";
}

export function isNull(o: any): o is null {
  return o === null;
}

export interface LinkedEvent<T, E extends Event> {
  data: T;
  event: (data: T, event: E) => void;
}

/**
 * Links given data to event as first parameter
 * @param {*} data data to be linked, it will be available in function as first parameter
 * @param {Function} event Function to be called when event occurs
 * @returns {{data: *, event: Function}}
 */
export function linkEvent<T, E extends Event>(
  data: T,
  event: (data: T, event: E) => void,
): LinkedEvent<T, E> | null {
  if (isFunction(event)) {
    return (evt) => event(data, evt)
  }
  return null; // Return null when event is invalid, to avoid creating unnecessary event handlers
}

// object.event should always be function, otherwise its badly created object.
export function isLinkEventObject(o): o is LinkedEvent<any, any> {
  return !isNull(o) && typeof o === "object";
}