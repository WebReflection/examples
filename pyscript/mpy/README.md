# MicroPython Tests

```html
<!-- explicit bootstrap -->
<script type="module">
  import loadMicroPython from 'https://webreflection.github.io/examples/pyscript/mpy.js';

  // pass optional config object
  const interpreter = await loadMicroPython();

  await interpreter.runPythonAsync('print("Hello MicroPython")');
</script>

<!-- implicit bootstrap -->
<script type="module" src="https://webreflection.github.io/examples/pyscript/mpy.js" auto></script>
<script type="micropython">
print("Hello MicroPython");
</script>
```