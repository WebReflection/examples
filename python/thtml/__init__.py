from .utils import Hole, parse

parsed = {}

def _util(svg):
  def fn(t):
    template = t.args[0::2]

    values = []
    for entry in t.args[1::2]:
      values.append(entry.value)

    length = len(values)

    if template in parsed:
      updates = parsed[template]
    else:
      updates = parse(template, length, svg)
      parsed[template] = updates

    return Hole(length and ''.join([updates[i](values[i]) for i in range(length)]) or updates[0]())

  return fn

def render(where, what):
  return where(what() if callable(what) else what)

html = _util(False)
svg = _util(True)

__all__ = ["Hole", "render", "html", "svg"]
