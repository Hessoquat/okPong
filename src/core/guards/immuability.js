export const deepFreeze = (object, seen = new WeakSet()) => {
  if (!object || typeof object !== 'object' || seen.has(object)) return object;
  seen.add(object);
  Object.freeze(object);
  Reflect.ownKeys(object).forEach(key => {
    deepFreeze(object[key], seen);
  });
  return object;
};