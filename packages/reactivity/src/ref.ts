import { hasChanged, isArray, isObject } from "@vuexwl/shared";

import { track, trigger } from "./effect";
import { TrackOpTypes, TriggerOrTypes } from "./operators";
import { reactive } from "./reactive";

export function ref(value) {
  return createRef(value);
}

export function shallowRef(value) {
  return createRef(value, true);
}

const convert = (val) => (isObject(val) ? reactive(val) : val);
class RefImpl {
  public _value;
  public __v_isRef = true;
  constructor(public rawValue, public shallow) {
    this._value = shallow ? rawValue : convert(rawValue);
    this.rawValue;
  }
  get value() {
    track(this, TrackOpTypes.GET, "value");
    return this._value;
  }
  set value(newValue) {
    if (hasChanged(newValue, this.rawValue)) {
      this.rawValue = newValue;
      this._value = this.shallow ? newValue : convert(newValue);
      trigger(this, TriggerOrTypes.SET, "value", newValue);
    }
  }
}
function createRef(rawValue, shallow = false) {
  return new RefImpl(rawValue, shallow);
}
class ObjectRefImpl {
  public __v_isRef = true;
  constructor(public target, public key) {}
  get value() {
    return this.target[this.key];
  }
  set value(newValue) {
    this.target[this.key] = newValue;
  }
}
export function toRef(target, key) {
  return new ObjectRefImpl(target, key);
}

export function toRefs(object) {
  const ret = isArray(object) ? new Array(object.length) : {};
  for (let key in object) {
    ret[key] = toRef(object, key);
  }
  return ret;
}
