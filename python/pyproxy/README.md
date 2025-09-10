# pyproxy

What if a MicroPython worker could directly read or set values to the server?

This demo is a tiny portion of what we're doing (or we're capable of doing) with the [PyScript](https://pyscript.net/) stack from a worker.

The worker in this case drives the server, not the main thread, and no JavaScript whatsoever is even used/needed except, of course, [PyScript](https://pyscript.net/) itself.

### How to run

Clone/fork this repo and from this folder:

```sh
$ python3 server.py

# or if you want a different port than 8080
$ python3 server.py -p 3000
```
