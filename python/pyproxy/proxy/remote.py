from json import dumps, loads
from . import heap

try:
    import weakref
except:
    # ⚠️ MicroPython misses weakref
    class NotWeakAtAll:
        def ref(self, *args, **kwargs):
            return lambda: args[0]

    weakref = NotWeakAtAll()



def reflect(*args):
    import js
    xhr = js.XMLHttpRequest.new()
    url = js.URL.new(js.location.href[5:])
    xhr.open('POST', f'{url.protocol}//{url.host}/reflect', False)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(dumps(args, separators=(',', ':')))
    return _resolve(loads(xhr.responseText))


class _DictProxy:
    def __init__(self, target, heldValue, callback=None):
        object.__setattr__(self, '__slots__', (target, heldValue, callback))
        # ⚠️ MicroPython misses __class__ property in proxied instances
        if self.__class__ is not target.__class__:
            object.__setattr__(self, '__class__', target.__class__)

    @property
    def __class__(self):
        return self.__slots__[0].__class__

    def __getattr__(self, key):
        return reflect('getattr', self.__slots__[1], key)

    def __setattr__(self, key, value):
        return reflect('setattr', self.__slots__[1], key, value)

    def __hasattr__(self, key):
        return reflect('hasattr', self.__slots__[1], key)

    def __delattr__(self, key):
        return reflect('delattr', self.__slots__[1], key)

    def __getitem__(self, key):
        return reflect('getitem', self.__slots__[1], key)

    def __setitem__(self, key, value):
        return reflect('setitem', self.__slots__[1], key, value)

    def __delitem__(self, key):
        return reflect('delitem', self.__slots__[1], key)

    # ⚠️ MicroPython misses __del__ for user code
    def __del__(self):
        _, heldValue, callback = self.__slots__
        object.__delattr__(self, '__slots__')
        if callback:
            callback(heldValue)


class FinalizationRegistry:
    def __init__(self, callback):
        self._callback = callback

    def proxy(self, target, heldValue):
        return _DictProxy(target, heldValue, self._callback)


def _resolve(result):
    if isinstance(result, dict):
        err = result.get('!', None)
        if err:
            raise Exception(err)

        uid = result.get('$')
        try:
            proxy = _dictionaries[uid]()
            if isinstance(proxy, _DictProxy):
                return proxy

            raise Exception("Collected proxy")
        except:
            print("creating new proxy", uid)
            proxy = _fr.proxy({}, uid)
            _dictionaries[uid] = weakref.ref(proxy)
            return proxy

    return result

def _drop(uid):
    print("dropping", uid)
    reflect('unref', uid)
    del _dictionaries[uid]


_fr = FinalizationRegistry(_drop)
_dictionaries = {}

global_proxy = _DictProxy({}, None)
