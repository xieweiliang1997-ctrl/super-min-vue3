const isObject = (value) => typeof value == "object" && value !== null;
const extend = Object.assign;
const isArray = Array.isArray;
const isFunction = (value) => typeof value === "function";
const isNumber = (value) => typeof value === "number";
const isString = (value) => typeof value === "string";
const isIntegerKey = (key) => parseInt(key) + "" === key;
let hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOnw = (target, key) => hasOwnProperty.call(target, key);
const hasChanged = (oldValue, newValue) => oldValue !== newValue;

export { extend, hasChanged, hasOnw, isArray, isFunction, isIntegerKey, isNumber, isObject, isString };
//# sourceMappingURL=shared.esm-bundler.js.map
