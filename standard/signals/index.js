import { computed, signal } from './signal.js';

const counter = signal(0);

const isEven = computed(() => {
  return (counter & 1) == 0;
});

console.log(isEven.peek());
console.log(isEven.value);

counter.value++;
console.log(isEven.value);

counter.value++;
console.log(isEven.value);
