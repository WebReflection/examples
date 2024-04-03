import { computed, effect, signal } from './signal.js';

const counter = signal(0);

const isEven = computed(() => (counter & 1) == 0);

effect(() => {
  if (isEven.value)
    console.log('is even');
  else
    console.log('is NOT even');
});

// is even
counter.value++;
// is NOT even

effect(() => console.log('fx', isEven.value, counter.value++));
console.log('out', isEven.value, counter.value++); // 1
