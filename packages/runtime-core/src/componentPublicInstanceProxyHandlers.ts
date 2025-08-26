import { hasOnw } from "@vuexwl/shared";

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    if (key[0] == "$") {
      return;
    }
    const { setupState, props, data } = instance;
    if (hasOnw(setupState, key)) {
      return setupState[key];
    } else if (hasOnw(props, key)) {
      return props[key];
    } else if (hasOnw(data, key)) {
      return data[key];
    } else {
      return undefined;
    }
  },
  set({ _: instance }, key, value) {
    const { setupState, props, data } = instance;
    if (hasOnw(setupState, key)) {
      setupState[key] = value;
    } else if (hasOnw(props, key)) {
      props[key] = value;
    } else if (hasOnw(data, key)) {
      data[key] = value;
    }
    return true;
  },
};
