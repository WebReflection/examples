from . import heap


def reflect(method, uid, key=None, value=None):
    is_global = uid == None
    try:
        target = globals() if is_global else heap.ref(uid)
        if method == 'getattr':
            result = getattr(target, key)
            return {"$": heap.id(result)} if isinstance(result, dict) else result
        elif method == 'setattr':
            setattr(target, key, value)
            return True
        elif method == 'hasattr':
            return hasattr(target, key)
        elif method == 'delattr':
            delattr(target, key)
            return True
        if method == 'getitem':
            result = target.__getitem__(key)
            return {"$": heap.id(result)} if isinstance(result, dict) else result
        elif method == 'setitem':
            target.__setitem__(key, value)
            return True
        elif method == 'delitem':
            target.__delitem__(key)
            return True
        elif method == 'has':
            return key in target
        elif method == 'unref':
            heap.unref(uid)
            return True
        else:
            raise Exception(f"Invalid method: {method}")
    except Exception as e:
        return {"!": str(e)}

