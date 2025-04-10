import re

VOID_ELEMENTS = re.compile(
  r'^(?:area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr)$',
  re.IGNORECASE
)

elements = re.compile(
  r'<([a-zA-Z0-9]+[a-zA-Z0-9:._-]*)([^>]*?)(\/?)>',
)

attributes = re.compile(
  r'([^\s\\>\'"=]+)\s*=\s*([\'"]?)' + '\x01',
)

holes = re.compile(
  '[\x01\x02]',
)

def as_attribute(match):
  return f'\x02={match.group(2)}{match.group(1)}'

def as_closing(name, xml, self_closing):
  if len(self_closing) > 0:
    if xml or re.match(VOID_ELEMENTS, name):
      return ' /'
    return f'></{name}'
  return ''

# \x01 Node.ELEMENT_NODE
# \x02 Node.ATTRIBUTE_NODE

def instrument(template, prefix, xml):
  def pin(match):
    name = match.group(1)
    attrs = match.group(2)
    self_closing = match.group(3)
    return f'<{
      name
    }{
      re.sub(attributes, as_attribute, attrs).rstrip()
    }{
      as_closing(name, xml, self_closing)
    }>'

  def point():
    nonlocal i
    i += 1
    return prefix + str(i - 1)

  i = 0
  return re.sub(
    holes,
    lambda match: f'<!--{point()}-->' if match.group(0) == '\x01' else point(),
    re.sub(
      elements,
      pin,
      '\x01'.join(template).strip()
    )
  )
