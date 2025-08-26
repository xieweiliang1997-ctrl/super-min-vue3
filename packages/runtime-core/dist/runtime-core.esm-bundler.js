const isObject = (value) => typeof value == "object" && value !== null;
const extend = Object.assign;
const isArray = Array.isArray;
const isFunction = (value) => typeof value === "function";
const isString = (value) => typeof value === "string";
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

function isVnode(vnode) {
    return vnode.__v_isVnode;
}
//createvNode 创建虚拟节点
/**
 *
 * @param type 组件
 * @param props 数据
 * @param children 子节点
 * @returns 虚拟节点
 */
function createVNode(type, props, children = null) {
    //根据type来区分是组件，还是普通的元素
    const shapeFlag = isString(type)
        ? 1 /* ELEMENT */
        : isObject(type)
            ? 4 /* STATEFUL_COMPONENT */
            : 0;
    const vnode = {
        __v_isVnode: true,
        type,
        props,
        children,
        component: null,
        el: null,
        key: props && props.key,
        shapeFlag,
    };
    normalizeChildren(vnode, vnode.children);
    return vnode;
}
function normalizeChildren(vnode, children) {
    let type = 0;
    if (children == null) ;
    else if (isArray(children)) {
        type = 16 /* ARRAY_CHILDREN */;
    }
    else {
        type = 8 /* TEXT_CHILDREN */;
    }
    vnode.shapeFlag |= type;
}
const TEXT = Symbol("Text");
function normalizeVNode(child) {
    if (isObject(child)) {
        return child;
    }
    return createVNode(TEXT, null, String(child));
}

/**
 *
 * @param render 渲染器
 * @returns createApp Api
 */
function createAppAPI(render) {
    return function createApp(rootComponent, rootProps) {
        const app = {
            _props: rootProps,
            _component: rootComponent,
            _container: null,
            mount(container) {
                // let vnode ={}
                // render(vnode,container)
                //1.根据组件创建虚拟节点
                //2.将虚拟节点和容器获取到后用render方法进行渲染
                const vnode = createVNode(rootComponent, rootProps);
                render(vnode, container);
                //创造虚拟节点
                //调用render
                app._container = container;
            },
        };
        return app;
    };
}

const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        if (key[0] == "$") {
            return;
        }
        const { setupState, props, data } = instance;
        if (hasOnw(setupState, key)) {
            return setupState[key];
        }
        else if (hasOnw(props, key)) {
            return props[key];
        }
        else if (hasOnw(data, key)) {
            return data[key];
        }
        else {
            return undefined;
        }
    },
    set({ _: instance }, key, value) {
        const { setupState, props, data } = instance;
        if (hasOnw(setupState, key)) {
            setupState[key] = value;
        }
        else if (hasOnw(props, key)) {
            props[key] = value;
        }
        else if (hasOnw(data, key)) {
            data[key] = value;
        }
        return true;
    },
};

function createComponetInstance(vnode) {
    // webcomponent 组件 "插槽" "属性"
    const instance = {
        //组件实例
        vnode,
        type: vnode.type,
        props: { a: 1 },
        attrs: {},
        slots: {},
        data: { c: 3 },
        setupState: { b: 2 },
        ctx: null,
        isMounted: false,
        render: null,
    };
    instance.ctx = { _: instance };
    return instance;
}
function setupComponent(instance) {
    const { props, children } = instance;
    instance.props = props;
    instance.children = children;
    //查看组件是否有状态
    let isStateful = instance.vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */;
    if (isStateful) {
        //调用当前实例的 setup方法
        isStatefulComponent(instance);
    }
}
function isStatefulComponent(instance) {
    //代理 传递给render函数的参数
    instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
    //获取组件的类型,拿到组件的setup
    let Component = instance.type;
    let { setup } = Component;
    if (setup) {
        let setupContext = createSetContext(instance);
        const setupReult = setup(instance.props, setupContext);
        handleSetupResult(instance, setupReult);
    }
    else {
        // Component.render(instance.proxy);
        finishhComponentSetup(instance);
    }
}
function handleSetupResult(instance, setupReult) {
    if (isFunction(setupReult)) {
        instance.render = setupReult;
    }
    else if (isObject(setupReult)) {
        instance.setupState = setupReult;
    }
    finishhComponentSetup(instance);
}
function finishhComponentSetup(instance) {
    let Component = instance.type;
    if (!instance.render) {
        //对template模板进行编译,产生render函数
        // instance.render = render;
        if (!Component.render && Component.template) ;
        instance.render = Component.render;
    }
}
function createSetContext(instance) {
    return {
        attrs: instance.attrs,
        slots: instance.slots,
        // props: instance.props,
        emit: () => { },
        expose: () => { },
    };
}

let queue = [];
function queueJob(job) {
    if (!queue.includes(job)) {
        queue.push(job);
        queueFlush();
    }
}
let isFlushPending = false;
function queueFlush() {
    if (!isFlushPending) {
        isFlushPending = true;
        Promise.resolve().then(flushJops);
    }
}
function flushJops() {
    isFlushPending = false;
    //清空是 我们需要根据调用的顺序依次刷新，保证先付后子
    queue.sort((a, b) => a.uid - b.uid);
    for (let i = 0; i < queue.length; i++) {
        const job = queue[i];
        job();
    }
    queue.length = 0;
}

/**
 *
 * @param rendererOptions 操纵element的方法
 * @returns 返回renderer渲染器
 */
function createRenderer(rendererOptions) {
    const { createElement: hostCreateElement, remove: hostRemove, insert: hostInsert, querySelector: hostQuerySelector, setElementText: hostSetElementText, createText: hostCreateText, setText: hostSetText, patchProp: hostPatchProp, nextSibling: hostNextSibling, } = rendererOptions;
    const setupRenderEffect = (instance, container) => {
        //使用effect包裹render;
        instance.update = effect(function componentEffect() {
            //每个组件都有一个effect ,vue3是组件级更新,数据改变相应的组件做出变化
            if (!instance.isMounted) {
                //初次挂载
                let proxyToUse = instance.proxy;
                let subTree = (instance.subTree = instance.render.call(proxyToUse, proxyToUse));
                patch(null, subTree, container);
                instance.isMounted = true;
            }
            else {
                //更新
                //diff (核心 diff + 序列优化 watchApi 生命周期)
                const prevTree = instance.subTree;
                let proxyToUse = instance.proxy;
                const nextTree = instance.render.call(proxyToUse, proxyToUse);
                patch(prevTree, nextTree, container);
            }
        }, {
            scheduler: queueJob,
        });
        instance.render();
    };
    /**
     *
     * @param initialVnode 新节点
     * @param container 容器
     */
    const mountComponent = (initialVnode, container) => {
        //调用setup 拿到返回值， 获取render函数返回的结果进行渲染
        //1.创建实例
        const instance = (initialVnode.component =
            createComponetInstance(initialVnode));
        //2.需要的数据解析到实例
        setupComponent(instance);
        //3.创建一个effect 让render函数执行
        setupRenderEffect(instance, container);
    };
    /**
     *
     * @param n1 老节点
     * @param n2 新节点
     * @param container 容器
     */
    const processComponent = (n1, n2, container) => {
        if (n1 == null) {
            //组件没有上一次的虚拟节点
            mountComponent(n2, container);
        }
    };
    const processText = (n1, n2, container) => {
        if (n1 == null) {
            hostInsert((n2.el = hostCreateText(n2.children)), container);
        }
    };
    const isSameVNodeType = (n1, n2) => {
        return n1.type === n2.type && n1.key === n2.key;
    };
    const unmount = (n1) => {
        hostRemove(n1.el);
    };
    /**
     *
     * @param n1 老节点
     * @param n2 新节点
     * @param container 容器
     */
    const patch = (n1, n2, container, anchor = null) => {
        const { shapeFlag, type } = n2;
        if (n1 && !isSameVNodeType(n1, n2)) {
            anchor = hostNextSibling(n1.el);
            unmount(n1);
            n1 = null;
        }
        switch (type) {
            case TEXT:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ELEMENT */) {
                    processElement(n1, n2, container, anchor);
                }
                else if (shapeFlag & 4 /* STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container);
                }
                break;
        }
    };
    const mountChildren = (children, container) => {
        for (let i = 0; i < children.length; i++) {
            let child = normalizeVNode(children[i]);
            patch(null, child, container);
        }
    };
    const mountElement = (vnode, container, anchor = null) => {
        //递归渲染
        const { props, shapeFlag, type, children } = vnode;
        let el = (vnode.el = hostCreateElement(type));
        if (props) {
            for (const key in props) {
                hostPatchProp(el, key, null, props[key]);
            }
        }
        if (shapeFlag & 8 /* TEXT_CHILDREN */) {
            hostSetElementText(el, children);
        }
        else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            mountChildren(children, el);
        }
        hostInsert(el, container, anchor);
    };
    const patchProps = (oldProps, newProps, el) => {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prev = oldProps[key];
                const next = newProps[key];
                if (prev !== next) {
                    hostPatchProp(el, key, prev, next);
                }
            }
            for (const key in oldProps) {
                if (!(key in newProps)) {
                    hostPatchProp(el, key, oldProps[key], null);
                }
            }
        }
    };
    const unmountChildren = (children) => {
        for (let index = 0; index < children.length; index++) {
            unmount(children[index]);
        }
    };
    const patchKeydChildren = (c1, c2, el) => {
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = c2.length - 1;
        // sync from start 从头开始一个个比 遇到不太同的停止
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, el);
            }
            else {
                break;
            }
            i++;
        }
        //sync from end
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, el);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        //两个比较后多一个 common squence + mount
        if (i > e1) {
            //新增了一个
            if (i <= e2) {
                //想知道向前插入还是向后插入
                const nextProp = e2 + 1;
                const anchor = nextProp < c2.length ? c2[nextProp].el : null;
                while (i <= e2) {
                    patch(null, c2[i], el, anchor); //向后添加
                    i++;
                }
            }
        }
        else if (i > e2) {
            //老的多新的少
            while (i <= e1) {
                unmount(c1[i]);
                i++;
            }
        }
        else {
            //乱序比较 尽可能复用，用新的元素做成一个映射表，一样的就服用,不一样的要不插入，要不删除
            let s1 = i;
            let s2 = i;
            const KeyToNewIndexMap = new Map();
            for (let i = s2; i <= e2; i++) {
                const childVNode = c2[i]; //
                KeyToNewIndexMap.set(childVNode.key, i);
            }
            for (let i = s1; i <= e1; i++) {
                const oldVNode = c1[i];
                console.log(KeyToNewIndexMap);
                let newIndex = KeyToNewIndexMap.get(oldVNode.key);
                if (newIndex === undefined) {
                    unmount(oldVNode);
                }
                else {
                    patch(oldVNode, c2[newIndex], el);
                }
            }
        }
    };
    const patchChildren = (n1, n2, el) => {
        const c1 = n1.children;
        const c2 = n2.children;
        const prevShapeFlag = n1.shapeFlag;
        const shapeFlag = n2.shapeFlag;
        if (shapeFlag & 8 /* TEXT_CHILDREN */) {
            //case1:之前是数组,现在是文本
            //文本
            if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
                unmountChildren(c1);
            }
            if (c2 !== c1) {
                //case 两个都是文本
                hostSetElementText(el, c2);
            }
        }
        else {
            //元素
            if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
                //两个都是数组
                if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                    //
                    //当前是一个数组,之前是数组
                    //两个数组的比对 -> diff算法 *********
                    patchKeydChildren(c1, c2, el);
                }
                else {
                    //没有孩子
                    unmountChildren(c1);
                }
            }
            else {
                if (prevShapeFlag & shapeFlag.TEXT_CHILDREN) {
                    //case4现在是数组之前是文本
                    hostSetElementText(el, "");
                }
                if (shapeFlag & shapeFlag.ARRAY_CHILDREN) {
                    mountChildren(c2, el);
                }
            }
        }
    };
    const patchElement = (n1, n2, container) => {
        //元素是相同节点
        let el = (n2.el = n1.el);
        //g更新属性,更新儿子
        const oldPorops = n1.props || {};
        const newPorops = n2.props || {};
        patchProps(oldPorops, newPorops, el);
        patchChildren(n1, n2, el);
    };
    const processElement = (n1, n2, container, anchor) => {
        if (n1 == null) {
            mountElement(n2, container, anchor);
        }
        else {
            patchElement(n1, n2);
        }
    };
    /**
     *
     * @param vnode 虚拟dom
     * @param container 容器
     */
    const render = (vnode, container) => {
        //  console.log(vnode, container);
        // core的核心，根据不同的虚拟节点，创建对应的真是dom
        //默认调用render,可能是初始化流程
        patch(null, vnode, container);
    };
    return {
        createApp: createAppAPI(render),
    };
}

function h(type, propsOrChildren, children) {
    const len = arguments.length;
    if (len === 2) {
        //类型 + 属性 ,类型+孩子
        if (isObject(propsOrChildren) && isArray(propsOrChildren)) {
            if (isVnode(propsOrChildren)) {
                return createVNode(type, null, [propsOrChildren]);
            }
            return createVNode(type, propsOrChildren, null);
        }
        else {
            return createVNode(type, null, propsOrChildren);
        }
    }
    else {
        if (len > 3) {
            children = Array.prototype.slice.call(arguments, 2);
        }
        else if (len === 3 && isVnode(children)) {
            children = [children];
        }
        return createVNode(type, propsOrChildren, children);
    }
    // console.log(type, propsOrChildren, children);
}

export { computed, createRenderer, effect, h, reactive, readonly, ref, shallowReactive, shallowReadonly, shallowRef, toRef, toRefs };
//# sourceMappingURL=runtime-core.esm-bundler.js.map
