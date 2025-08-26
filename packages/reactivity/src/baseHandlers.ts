import {
  extend,
  hasChanged,
  hasOnw,
  isArray,
  isIntegerKey,
  isObject,
} from "@vuexwl/shared";
import { track, trigger } from "./effect";
import { TrackOpTypes, TriggerOrTypes } from "./operators";
import { reactive, readonly } from "./reactive";

const get = createGetter();
const shallowGet = createGetter(false, true);
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
const set = createSetter();
const shallowSet = createSetter(true);
export const mutableHandlers = {
  get,
  set,
};
export const shallowReactiveHandlers = {
  get: shallowGet,
  set: shallowSet,
};

let readonlyObj = {
  set: (target, key) => {
    console.warn(`set ${target} on key ${key}`);
  },
};
export const readonlyHandlers = extend({ get: readonlyGet }, readonlyObj);
export const shallowReadonlyHandlers = extend(
  { get: shallowReadonlyGet },
  readonlyObj
);

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    const result = Reflect.get(target, key, receiver);
    if (!isReadonly) {
      track(target, TrackOpTypes.GET, key);
    }
    if (shallow) {
      return result;
    }
    if (isObject(result)) {
      return isReadonly ? readonly(result) : reactive(result);
    }
    return result;
  };
}
function createSetter(Shallow = false) {
  return function set(target, key, value, receiver) {
    const oldValue = target[key];

    let hasKey =
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOnw(target, key);

    const result = Reflect.set(target, key, value, receiver);
    if (!hasKey) {

      //add
      trigger(target, TriggerOrTypes.ADD, key, value);
    } else if (hasChanged(oldValue, value)) {
      //set

      trigger(target, TriggerOrTypes.SET, key, value, oldValue);
    }

    return result;
  };
}
