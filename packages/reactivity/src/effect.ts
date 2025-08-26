import { isArray, isIntegerKey } from "@vuexwl/shared";
import { TriggerOrTypes } from "./operators";

export function effect(fn, options: any = {}) {
  const effect = createReactiveEffect(fn, options);
  if (!options.lazy) {
    effect();
  }
  return effect;
}
let uid = 0;
let activeEffect; //保存当前的effect
let effectStack = [];
function createReactiveEffect(fn, options) {
  const effect = function reactiveEffect() {
    if (!effectStack.includes(effect)) {
      try {
        activeEffect = effect;
        effectStack.push(effect);
        return fn();
      } finally {
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
      }
    }
  };
  effect.id = uid++;
  effect._isEffect = true;
  effect.raw = fn;
  effect.options = options;
  return effect;
}
const targetMap = new WeakMap();
export function track(target, type, key) {
  // console.log(target, type, key, activeEffect);
  if (activeEffect === undefined) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
  }
}

export function trigger(target, type, key?, newValue?, oldValue?) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const effects = new Set();
  const add = (effectToAdd) => {
    if (effectToAdd) {
      effectToAdd.forEach((effect) => effects.add(effect));
    }
  };
  //1 look array length attr;
  if (key === "length" && isArray(target)) {
    depsMap.forEach((dep, key) => {
      console.log(depsMap, dep, key);
      if (key === "length" || key > newValue) {
        add(dep);
      }
    });
  } else {
    //object
    if (key !== undefined) {
      add(depsMap.get(key));
    }

    switch (type) {
      case TriggerOrTypes.ADD:
        if (isArray(target) && isIntegerKey(key)) {
          add(depsMap.get("length"));
        }
        break;
      default:
        break;
    }
  }
  effects.forEach((effect: any) => {
    if (effect.options.scheduler) {
      effect.options.scheduler(effect);
    } else {
      effect();
    }
  });
}
