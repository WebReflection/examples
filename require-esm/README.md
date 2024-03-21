# require-esm

This project simply tests the desired functionality of the latest flag so that no error and no failed assertion should ever be seen in console.

## As ESM Module

If the `./package.json` is defined as `"type": "module"` there is no issue whatsoever: it's always ESM.

## As CJS Module

Currently if the `--experimental-require-module` is not available, there is an error.

Remove that from the `./package.json` and see another error:

```
node:internal/modules/esm/resolve:303
  return new ERR_PACKAGE_PATH_NOT_EXPORTED(
         ^

Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: No "exports" main defined in ~/require-esm/node_modules/b/package.json
    at exportsNotFound (node:internal/modules/esm/resolve:303:10)
    at packageExportsResolve (node:internal/modules/esm/resolve:593:13)
    at resolveExports (node:internal/modules/cjs/loader:589:36)
    at Module._findPath (node:internal/modules/cjs/loader:666:31)
    at Module._resolveFilename (node:internal/modules/cjs/loader:1128:27)
    at Module._load (node:internal/modules/cjs/loader:983:27)
    at Module.require (node:internal/modules/cjs/loader:1230:19)
    at require (node:internal/modules/helpers:179:18)
    at main (~/require-esm/index.js:6:31) {
  code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'
}
```

## Goal

This test case should simply run with this `./package.json` defined as `"type":"commonjs"` and no assertion error should be ever seen in console.
