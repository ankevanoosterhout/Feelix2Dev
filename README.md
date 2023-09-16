# Feelix

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 14.3.0.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.


## Download MSI or DMG Installer to install software 

## To install developer mode:

Run `npm i`

## Run locally 

Run `npm run electron` to test the locally

## Package application

Enable production environment main.ts 
Uncomment line 15: '\\.o(bj)?$' in node_modules/electron-packager/src/copy-filter.js and add ''/\\.angular($|/)',' to ignore angular cache

Run `ng build`

Run `npm run package-win` or `npm run package-mac`

Run `node build_installer.js` or `node dmg_builder.js`

## Node version 18.17.1


