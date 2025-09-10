from pyscript import document
from pyproxy.remote import global_proxy

# proxied primitives
try:
    global_proxy['count'] = global_proxy['count'] + 1
except Exception as e:
    global_proxy['count'] = 1

document.querySelector('#count').textContent = str(global_proxy['count'])


# proxied dictionaries
try:
    ref = global_proxy['ref']
    ref['value'] = 'changed'
except Exception as e:
    global_proxy['ref'] = {'value': 'created'}
    ref = global_proxy['ref']

print(ref, global_proxy['ref'] is global_proxy['ref'])
print(ref['value'])

def drop_ref(event):
    global ref
    if ref:
        # drop the ref from the server (will create a new one next time)
        del global_proxy['ref']
        # implicitly unref (will free the heap on the server)
        ref = None

document.body.appendChild(document.createElement('button')).onclick = drop_ref
