# markdown example

This page simply shows how to render markdown out of a basic HTML page:

```html
<!doctype html>
<script type="module">
  import { marked } from 'https://esm.run/marked';

  document.body.innerHTML = marked(
    await fetch('./README.md').then(r => r.text())
  );
</script>
```
