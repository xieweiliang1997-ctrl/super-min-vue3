declare class ComputedRefImpl {
    getter: any;
    setter: any;
    _dirty: boolean;
    _value: any;
    effect: any;
    constructor(getter: any, setter: any);
    get value(): any;
    set value(newVal: any);
}
export declare function computed(getterOrOptions: any): ComputedRefImpl;
export {};
