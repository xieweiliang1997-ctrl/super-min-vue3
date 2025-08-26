export declare const isObject: (value: any) => boolean;
export declare const extend: {
    <T, U>(target: T, source: U): T & U;
    <T_1, U_1, V>(target: T_1, source1: U_1, source2: V): T_1 & U_1 & V;
    <T_2, U_2, V_1, W>(target: T_2, source1: U_2, source2: V_1, source3: W): T_2 & U_2 & V_1 & W;
    (target: object, ...sources: any[]): any;
};
export declare const isArray: (arg: any) => arg is any[];
export declare const isFunction: (value: any) => boolean;
export declare const isNumber: (value: any) => boolean;
export declare const isString: (value: any) => boolean;
export declare const isIntegerKey: (key: any) => boolean;
export declare const hasOnw: (target: any, key: any) => any;
export declare const hasChanged: (oldValue: any, newValue: any) => boolean;
export declare const enum ShapeFlags {
    ELEMENT = 1,
    FUNCTIONAL_COMPONENT = 2,
    STATEFUL_COMPONENT = 4,
    TEXT_CHILDREN = 8,
    ARRAY_CHILDREN = 16,
    SLOTS_CHILDREN = 32,
    TELEPORT = 64,
    SUSPENSE = 128,
    COMPONENT_SHOULD_KEEP_ALIVE = 256,
    COMPONENT_KEPT_ALIVE = 512,
    COMPONENT = 6
}
