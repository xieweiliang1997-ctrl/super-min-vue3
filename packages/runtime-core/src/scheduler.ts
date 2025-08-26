let queue = [];
export function queueJob(job) {
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
