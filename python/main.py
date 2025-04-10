from thtml import render, html, svg
from js import document
from random import random

def passthrough(value):
  print(str(value))
  return str(value)

data = {"a": 1, "b": 2}
aria = {"role": "button", "label": "Click me"}

names = ["John", "Jane", "Jim", "Jill"]

document.body.innerHTML = render(passthrough, html(t'''
  <div>
    <!-- boolean attributes hints: try with True -->
    <h1 ?hidden={False}>Hello, PEP750 SSR!</h1>
    <!-- automatic quotes with safe escapes -->
    <p class={'test & "test"'}>
      Some random number: {random()}
    </p>
    <!-- sef closing non void tags -->
    <textarea placeholder={random()} />
    <!-- ignored void elements -->
    <!-- special attributes cases -->
    <div data={data} aria={aria} />
    <hr />
    <svg>
      <!-- preseved XML/SVG self closing nature -->
      {svg(t'<rect width="200" height="100" rx="20" ry="20" fill="blue" />')}
    </svg>
    <ul>
      <!-- lists within parts of the layout -->
      {[html(t"<li>{name}</li>") for name in names]}
    </ul>
  </div>
'''))
