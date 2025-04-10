from thtml.parser import instrument
from thtml.utils import parse
from random import random

prefix = '🐍' + str(random())[2:5]

print(instrument(["<div />"], prefix, False))
print(instrument(["<rect />"], prefix, True))
print(instrument(["<div></div>"], prefix, False))
print(instrument(["<div></div>"], prefix, True))

print(instrument(["<div test=", "></div>"], prefix, False))

