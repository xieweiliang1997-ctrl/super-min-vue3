export declare function ref(value: any): RefImpl;
export declare function shallowRef(value: any): RefImpl;
declare class RefImpl {
    rawValue: any;
    shallow: any;
    _value: any;
    __v_isRef: boolean;
    constructor(rawValue: any, shallow: any);
    get value(): any;
    set value(newValue: any);
}
declare class ObjectRefImpl {
    target: any;
    key: any;
    __v_isRef: boolean;
    constructor(target: any, key: any);
    get value(): any;
    set value(newValue: any);
}
export declare function toRef(target: any, key: any): ObjectRefImpl;
export declare function toRefs(object: any): {};
export {};
