const { assign } = Object;

export default function Matrix({
  width = 560,
  height = 880,
  size = 5,
  gap = 8,
  background = 'white',
  color = 'green',
  isON = value => value > 50,
} = {}) {
  const canvas = assign(
    document.createElement('canvas'),
    { width, height }
  );
  const context = canvas.getContext('2d');
  const cell = width / (size + 2);
  const sx = (width - size * (cell + gap)) / 2;
  const sy = (height - size * (cell + gap)) / 2;
  const fix = gap + cell;

  let prev = [];
  const render = values => {
    let x = 0, y = 0, value;
    const curr = values.slice(-(size * size));
    if (prev.length && prev.every((v, i) => curr[i] === v))
      return false;
    prev = values;
    context.clearRect(0, 0, width, height);
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    for (value of curr) {
      if (isON(value)) {
        context.fillStyle = color;
        context.fillRect(sx + x * fix, sy + y * fix, cell, cell);
      }
      if (++x === size) {
        x = 0;
        y++;
      }
    }
    return true;
  };
  const toDataURL = (...args) => canvas.toDataURL(...args);
  return {
    __proto__: Matrix.prototype,
    get canvas() { return canvas },
    render,
    toDataURL,
    toImage: (values, ...rest) => {
      render(values);
      const img = new Image;
      img.src = toDataURL(...rest);
      return img;
    }
  };
}
