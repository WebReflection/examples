from html import escape
from random import random
from .parser import instrument
import re

prefix = 't🐍' + str(random())[2:5]

rename = re.compile(
  r'([^\s>]+)[\s\S]*$'
)

interpolation = re.compile(
  f'(<!--{prefix}(\\d+)-->|\\s*{prefix}(\\d+)=([^\\s>]))'
)

def attribute(name, quote, value):
  return f" {name}={quote}{escape(str(value))}{quote}"


def get_value(value):
  if isinstance(value, str):
    return escape(value)
  if isinstance(value, (bool, int, float, Hole)):
    return str(value)
  if isinstance(value, (list, tuple)):
    return ''.join([get_value(item) for item in value])
  if iscallable(value):
    return get_value(value())
  return '' if value == None else escape(str(value))


def as_aria(pre, quote):
  def aria(value):
    values = []
    for k, v in value.items():
      values.append(attribute(k if k == 'role' else f'aria-{k.lower()}', quote, v))
    return pre + ''.join(values)
  
  return aria


def as_attribute(pre, name, quote):
  return lambda value: pre if value == None else (pre + attribute(name, quote, value))


def as_boolean(pre, name):
  attr = f' {name}'
  return lambda value: (pre + attr) if value else pre


def as_dataset(pre):
  def dataset(value):
    values = []
    for k, v in value.items():
      if v is not None:
        values.append(f' data-{k.replace('_', '-')}="{escape(str(v))}"')
    return pre + ''.join(values)

  return dataset


def as_generic(pre, name, quote):
  def generic(value):
    if value != None and value != False:
      if value == True:
        return pre + f' {lower}'
      else:
        return pre + attribute(name, quote, value)
    return pre

  return generic


def as_value(pre):
  return lambda value: (pre + get_value(value))


def parse(template, length, svg):
  html = instrument(template, prefix, svg)
  updates = []
  i = 0
  for match in re.finditer(interpolation, html):
    index = match.start()
    pre = html[i:index]
    i = match.end()

    if match.group(2):
      updates.append(as_value(pre))
    else:
      name = ''
      quote = match.group(4)
      if quote == '"' or quote == "'":
        next = html.index(quote, i)
        name = html[i:next]
        i = next + 1
      else:
        i -= 1
        name = re.sub(rename, r'\1', html[i:])
        i += len(name)
        quote = '"'

      if name == 'aria':
        updates.append(as_aria(pre, quote))
      elif name == 'data':
        updates.append(as_dataset(pre))
      elif name[0] == '?':
        updates.append(as_boolean(pre, name[1:].lower()))
      # TBD: is this too much? valid for .data or .dataset though
      elif name[0] == '.':
        lower = name[1:].lower()
        if lower == 'dataset':
          updates.append(as_dataset(pre))
        else:
          updates.append(as_generic(pre, lower, quote))
      else:
        updates.append(as_attribute(pre, name, quote))

  if len(updates) != length:
    raise ValueError(f'{len(updates)} updates found, expected {length}')

  if length:
    last = updates[length - 1]
    chunk = html[i:]
    updates[length - 1] = lambda value: (last(value) + chunk)
  else:
    updates.append(lambda: html)
  return updates


class Hole:
  def __init__(self, value: str):
    self.value = value

  def __str__(self):
    return self.value

  def __repr__(self):
    return f"Hole({self.value})"
