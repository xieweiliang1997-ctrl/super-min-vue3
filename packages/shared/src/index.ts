export const isObject = (value) => typeof value == "object" && value !== null;
export const extend = Object.assign;
export const isArray = Array.isArray;
export const isFunction = (value) => typeof value === "function";
export const isNumber = (value) => typeof value === "number";
export const isString = (value) => typeof value === "string";
export const isIntegerKey = (key) => parseInt(key) + "" === key;
let hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOnw = (target, key) => hasOwnProperty.call(target, key);
export const hasChanged = (oldValue, newValue) => oldValue !== newValue;

export const enum ShapeFlags {
  ELEMENT = 1,
  FUNCTIONAL_COMPONENT = 1 << 1,
  STATEFUL_COMPONENT = 1 << 2,
  TEXT_CHILDREN = 1 << 3,
  ARRAY_CHILDREN = 1 << 4,
  SLOTS_CHILDREN = 1 << 5,
  TELEPORT = 1 << 6,
  SUSPENSE = 1 << 7,
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  COMPONENT_KEPT_ALIVE = 1 << 9,
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT
}
