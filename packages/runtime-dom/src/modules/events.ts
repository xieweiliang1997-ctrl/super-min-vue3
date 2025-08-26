export const patchEvent = (el, key, value) => {
  const invokers = el._vei || (el._vei = {});

  const exists = invokers[key];
  if (value && exists) {
    exists.value = value;
  } else {
    const eventName = key.slice(2).toLowerCase();
    if (value) {
      let invoker = (invokers[key] = createInvoker(value));
      el.addEventListener(eventName, invoker);
    } else {
      el.removeEventListener(eventName, exists);
      invokers[key] = undefined;
    }
  }
};
function createInvoker(value) {
  const invoker = (e) => {
    invoker.value(e);
  };
  invoker.value = value;
  return invoker;
}
