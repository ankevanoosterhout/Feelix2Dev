# Feelix

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 14.3.0.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.


## Download MSI or DMG Installer to install software 

## To install developer mode:

Run `npm install`

Run `npm run i` or in case that is not working:
Remove ', import.meta.url' in node_modules/closed-chain-ik/src/worker/WorkerSolver.js" line 30 (change to: const worker = new Worker( new URL( './workerSolver.worker.js'), { type: 'module' } );


## Run locally 

Run `npm run electron` to test the locally

## Package application

Enable production environment main.ts 
Uncomment line 15: '\\.o(bj)?$' in node_modules/electron-packager/src/copy-filter.js and add ''/\\.angular($|/)',' to ignore angular cache

Run `ng build`

Run `npm run package-win` or `npm run package-mac`

Run `node build_installer.js` or `node dmg_builder.js`

## Node version 18.17.1


