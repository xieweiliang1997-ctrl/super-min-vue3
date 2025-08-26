import { isObject } from "@vuexwl/shared";
import {
  mutableHandlers,
  shallowReactiveHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from "./baseHandlers";
export function reactive<T>(target: T) {
  return createReactive(target, false, mutableHandlers);
}
export function shallowReactive<T>(target: T) {
  return createReactive(target, false, shallowReactiveHandlers);
}
export function readonly<T>(target: T) {
  return createReactive(target, true, readonlyHandlers);
}
export function shallowReadonly<T>(target: T) {
  return createReactive(target, true, shallowReadonlyHandlers);
}

/**
 * readonly and deep, Currie ,new Proxy() core is intercept data edit and read
 * get set
 */
const reactiveMap = new WeakMap(); //会自动垃圾回收，不会造成内存泄漏，存储得key只能是object
const readonlyMap = new WeakMap();
export function createReactive(target, isReadonly:boolean, baseHandlers) {
  //is target not object not intercept
  if (!isObject(target)) {
    return target;
  }
  const proxyMap = isReadonly ? readonlyMap : reactiveMap;
  //if target is proxy not unproxy
  const exisitPorxy = proxyMap.get(target);
  if (exisitPorxy) {
    return exisitPorxy;
  }
  const proxy = new Proxy(target, baseHandlers);
  
  proxyMap.set(target, proxy);
  return proxy;
}
