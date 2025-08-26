'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const isObject = (value) => typeof value == "object" && value !== null;
const extend = Object.assign;
const isArray = Array.isArray;
const isFunction = (value) => typeof value === "function";
const isIntegerKey = (key) => parseInt(key) + "" === key;
let hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOnw = (target, key) => hasOwnProperty.call(target, key);
const hasChanged = (oldValue, newValue) => oldValue !== newValue;

function effect(fn, options = {}) {
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
            }
            finally {
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
function track(target, type, key) {
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
function trigger(target, type, key, newValue, oldValue) {
    const depsMap = targetMap.get(target);
    if (!depsMap)
        return;
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
    }
    else {
        //object
        if (key !== undefined) {
            add(depsMap.get(key));
        }
        switch (type) {
            case 0 /* ADD */:
                if (isArray(target) && isIntegerKey(key)) {
                    add(depsMap.get("length"));
                }
                break;
        }
    }
    effects.forEach((effect) => {
        if (effect.options.scheduler) {
            effect.options.scheduler(effect);
        }
        else {
            effect();
        }
    });
}

const get = createGetter();
const shallowGet = createGetter(false, true);
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
const set = createSetter();
const shallowSet = createSetter(true);
const mutableHandlers = {
    get,
    set,
};
const shallowReactiveHandlers = {
    get: shallowGet,
    set: shallowSet,
};
let readonlyObj = {
    set: (target, key) => {
        console.warn(`set ${target} on key ${key}`);
    },
};
const readonlyHandlers = extend({ get: readonlyGet }, readonlyObj);
const shallowReadonlyHandlers = extend({ get: shallowReadonlyGet }, readonlyObj);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key, receiver) {
        const result = Reflect.get(target, key, receiver);
        if (!isReadonly) {
            track(target, 0 /* GET */, key);
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
        let hasKey = isArray(target) && isIntegerKey(key)
            ? Number(key) < target.length
            : hasOnw(target, key);
        const result = Reflect.set(target, key, value, receiver);
        if (!hasKey) {
            //add
            trigger(target, 0 /* ADD */, key, value);
        }
        else if (hasChanged(oldValue, value)) {
            //set
            trigger(target, 1 /* SET */, key, value);
        }
        return result;
    };
}

function reactive(target) {
    return createReactive(target, false, mutableHandlers);
}
function shallowReactive(target) {
    return createReactive(target, false, shallowReactiveHandlers);
}
function readonly(target) {
    return createReactive(target, true, readonlyHandlers);
}
function shallowReadonly(target) {
    return createReactive(target, true, shallowReadonlyHandlers);
}
/**
 * readonly and deep, Currie ,new Proxy() core is intercept data edit and read
 * get set
 */
const reactiveMap = new WeakMap(); //会自动垃圾回收，不会造成内存泄漏，存储得key只能是object
const readonlyMap = new WeakMap();
function createReactive(target, isReadonly, baseHandlers) {
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

function ref(value) {
    return createRef(value);
}
function shallowRef(value) {
    return createRef(value, true);
}
const convert = (val) => (isObject(val) ? reactive(val) : val);
class RefImpl {
    rawValue;
    shallow;
    _value;
    __v_isRef = true;
    constructor(rawValue, shallow) {
        this.rawValue = rawValue;
        this.shallow = shallow;
        this._value = shallow ? rawValue : convert(rawValue);
        this.rawValue;
    }
    get value() {
        track(this, 0 /* GET */, "value");
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(newValue, this.rawValue)) {
            this.rawValue = newValue;
            this._value = this.shallow ? newValue : convert(newValue);
            trigger(this, 1 /* SET */, "value", newValue);
        }
    }
}
function createRef(rawValue, shallow = false) {
    return new RefImpl(rawValue, shallow);
}
class ObjectRefImpl {
    target;
    key;
    __v_isRef = true;
    constructor(target, key) {
        this.target = target;
        this.key = key;
    }
    get value() {
        return this.target[this.key];
    }
    set value(newValue) {
        this.target[this.key] = newValue;
    }
}
function toRef(target, key) {
    return new ObjectRefImpl(target, key);
}
function toRefs(object) {
    const ret = isArray(object) ? new Array(object.length) : {};
    for (let key in object) {
        ret[key] = toRef(object, key);
    }
    return ret;
}

class ComputedRefImpl {
    getter;
    setter;
    _dirty = true;
    _value;
    effect;
    constructor(getter, setter) {
        this.getter = getter;
        this.setter = setter;
        this.effect = effect(getter, {
            lazy: true,
            scheduler: () => {
                if (!this._dirty) {
                    this._dirty = true;
                    trigger(this, 1 /* SET */, "value");
                }
            },
        });
    }
    get value() {
        if (this._dirty) {
            this._value = this.effect();
            this._dirty = false;
        }
        track(this, 0 /* GET */, "value");
        return this._value;
    }
    set value(newVal) {
        this.setter(newVal);
    }
}
function computed(getterOrOptions) {
    let getter;
    let setter;
    if (isFunction(getterOrOptions)) {
        getter = getterOrOptions;
        setter = () => {
            console.warn(`computed value must be readonly`);
        };
    }
    else {
        getter = getterOrOptions.get;
        setter = getterOrOptions.set;
    }
    return new ComputedRefImpl(getter, setter);
}

exports.computed = computed;
exports.effect = effect;
exports.reactive = reactive;
exports.readonly = readonly;
exports.ref = ref;
exports.shallowReactive = shallowReactive;
exports.shallowReadonly = shallowReadonly;
exports.shallowRef = shallowRef;
exports.toRef = toRef;
exports.toRefs = toRefs;
//# sourceMappingURL=reactivity.cjs.js.map
