class Proxy:
    def __init__(self, target, callback, heldValue):
        object.__setattr__(self, '__slots__', (target, callback, heldValue))
        # MicroPython patch
        if self.__class__ is not target.__class__:
            object.__setattr__(self, '__class__', target.__class__)

    @property
    def __class__(self):
        return self.__slots__[0].__class__

    def __getattr__(self, key):
        return getattr(self.__slots__[0], key)

    def __setattr__(self, key, value):
        object.__setattr__(self.__slots__[0], key, value)

    def __hasattr__(self, key):
        return hasattr(self.__slots__[0], key)

    def __delattr__(self, key):
        object.__delattr__(self.__slots__[0], key)

    def __getitem__(self, key):
        return self.__slots__[0][key]

    def __setitem__(self, key, value):
        self.__slots__[0][key] = value

    def __delitem__(self, key):
        del self.__slots__[0][key]

    # ⚠️ MicroPython misses __del__
    def __del__(self):
        _, callback, heldValue = self.__slots__
        object.__delattr__(self, '__slots__')
        callback(heldValue)

class FinalizationRegistry:
    def __init__(self, callback):
        self._callback = callback

    def proxy(self, target, heldValue):
        return Proxy(target, self._callback, heldValue)

fr = FinalizationRegistry(lambda v: print("dropped", v))

class A(dict):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.test = 123

o = A({ 'a': 456 })
p = fr.proxy(o, 1)
p.test = 789
p = fr.proxy([1, 2, 3], 2)
print(isinstance(p, list), p.__class__)
# print(p['a'], p.test)
print([i for i in p])
del p
print('done')
