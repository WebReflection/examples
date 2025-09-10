ids = []

def clear():
    ids = []

def id(ref):
    size = len(ids)
    uid = next((r for r in ids if r is ref), size)
    if uid is size:
        ids.append(ref)
        return size
    return ids.index(ref)

def ref(uid):
    return ids[uid]

def unref(uid):
    ids[uid] = None
