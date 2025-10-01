import matplotlib

from pyscript import document
from pyscript.js_modules.custom_package import test

document.body.firstElementChild.remove();
document.body.insertAdjacentHTML('beforeend', test());
