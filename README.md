# KGrid Node Runtime

KGrid Node Runtime, enabled by express server

## Installation

```
npm install -g @kgrid/noderuntime

```

## Configuration

- Set the environmental variable of `KGRID_PROXY_ADAPTER_URL` to the activator URL.
(Default: http://localhost:8080)

- Set the environmental variable of `KGRID_NODE_ENV_URL` to the runtime URL.
(Default: http://localhost:3000)

- Set the environmental variable of `KGRID_NODE_ENV_PORT` to the port this runtime will run at.
(Default:3000)

- The `KGRID_NODE_CACHE_STRATEGY` can take three values: `never`, `always`, or `use_checksum`

    - `never` or if no value is set means that existing objects will be overwritten whenever objects are re-downloaded from the activator.
    - `always` means that existing objects stored in the python runtime will never be re-downloaded from the activator and the local pyshelf and context.json files must be deleted and the runtime restarted for the objects to be replaced.
    - `use_checksum` means that objects will look for a checksum in the deployment descriptor sent over during activation and only re-download the object if that checksum has changed.
    
To change the location of the internal storage location for object code set `KGRID_NODE_SHELF_PATH`, otherwise it will be in the `shelf` directory.

## Start the runtime

Start the runtime by
```
kgrid-node
```

## Important Notes
- Editing the cache directly from the runtime's shelf will
not propagate changes to the endpoints in the runtime. New
KOs must come from the activator.

