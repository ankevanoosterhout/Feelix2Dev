const electron = require('electron');
const { app, BrowserWindow, Menu, MenuItem, ipcMain, webContents, shell } = require('electron')
const url = require('url');
const path = require('path');
const { dialog } = require('electron');
const fs = require('fs');
const jsonfile = require('jsonfile');
const { localStorage } = require('electron-browser-storage');

const serialPort = require('./serial-communication.js');
global['window'] = fs.window;
global['HTMLVideoElement'] = fs.HTMLVideoElement;

let mainWindow, infoWindow = null, helpWindow = null, kinematicWindow = null;
let toolbars = [];
let mainMenu, displays, kinematicsMenu;
let gridSnap = false, gridVisible = false, guidesLock = false;
let tmpWindow = null;
let activeWindow = null;
let tensorflowWindow = null;


/****** start app *****/

app.on('ready', createWindow)

app.on('window-all-closed', () => {

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})






/****** create menus *****/


const mainMenuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New File',
        click() {
          createFileSettingWindow("file-settings");
        }
      },
      {
        label: 'Open File',
        accelerator: process.platform == 'darwin' ? 'Command+O' : 'Ctrl+O',
        click() {
          openFileDialog('feelix', 'loadFile', 'loadFileLocation');
        }
      },
      {
        label: 'Save',
        accelerator: process.platform == 'darwin' ? 'Command+S' : 'Ctrl+S',
        click() { mainWindow.webContents.send('saveActiveFile', true); }
      },
      {
        label: 'Save as',
        accelerator: process.platform == 'darwin' ? 'Command+Shift+S' : 'Ctrl+Shift+S',
        click() { mainWindow.webContents.send('saveActiveFile', false); }
      },
      {
        label: 'Settings',
        click() { createFileSettingWindow("file-update-settings"); }
      },

      // {
      //   label: 'Example files',
      //   submenu: []
      // },
      {
        label: 'Quit',
        accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Ctrl+Q',
        click() {
          mainWindow.webContents.send('saveData');
          setTimeout(() => app.quit(), 100);
        }
      }
    ]
  },
  {
    label: 'Effect',
    submenu: [
      {
        label: 'New Effect',
        click() {
          createEffectSettingWindow("effect-settings");
        }
      },
      {
        label: 'Effect Settings',
        click() {
          mainWindow.webContents.send('saveData');
          createEffectSettingWindow("effect-update-settings");
        }
      },
      {
        label: 'Save to Effect Library',
        click() {
          mainWindow.webContents.send('saveEffectToLibrary');
        }
      },
      {
        label: 'Clear effect library',
        click() {
          mainWindow.webContents.send('clearCache');
        }
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: process.platform === 'darwin' ? 'Command+Z' : 'Ctrl+Z',
        enabled: true,
        click() {
          mainWindow.webContents.send('undo');
        }
      },
      {
        label: 'Redo',
        accelerator: process.platform === 'darwin' ? 'Command+Shift+Z' : 'Ctrl+Shift+Z',
        enabled: true,
        click() {
          mainWindow.webContents.send('redo');
        }
      },
      {
        label: 'Transform',
        enabled: true,
        submenu: [
          {
            label: 'Move',
            accelerator: process.platform === 'darwin' ? 'Command+M' : 'Ctrl+M',
            click() {
              mainWindow.webContents.send('requestObjectSize', { type: 'move' });
              createTransform();
            }
          },
          {
            label: 'Reflect',
            accelerator: process.platform === 'darwin' ? 'Command+O' : 'Ctrl+O',
            submenu: [
              {
                label: 'Horizontal',
                click() {
                  mainWindow.webContents.send('reflect:horizontal');
                }
              },
              {
                label: 'Vertical',
                click() {
                  mainWindow.webContents.send('reflect:vertical');
                }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Show rulers',
        accelerator: process.platform == 'darwin' ? 'Command+R' : 'Ctrl+R',
        visible: false,
        click() {
          mainMenu.items[3].submenu.items[0].visible = false;
          mainMenu.items[3].submenu.items[1].visible = true;
          mainWindow.webContents.send('rulers:toggle', true);
        }
      },
      {
        label: 'Hide rulers',
        accelerator: process.platform == 'darwin' ? 'Command+Alt+R' : 'Ctrl+Alt+R',
        visible: true,
        click() {
          mainMenu.items[3].submenu.items[0].visible = true;
          mainMenu.items[3].submenu.items[1].visible = false;
          mainWindow.webContents.send('rulers:toggle', false);
        }
      },
      {
        label: 'Grid',
        submenu: [
          {
            label: 'Show grid',
            accelerator: process.platform == 'darwin' ? 'Command+G' : 'Ctrl+G',
            visible: true,
            click() {
              mainMenu.items[3].submenu.items[2].submenu.items[0].visible = false;
              mainMenu.items[3].submenu.items[2].submenu.items[1].visible = true;
              mainMenu.items[3].submenu.items[2].submenu.items[2].enabled = true;
              mainWindow.webContents.send('grid:toggle', true);
            }
          },
          {
            label: 'Hide grid',
            accelerator: process.platform == 'darwin' ? 'Command+Alt+G' : 'Ctrl+Alt+G',
            visible: false,
            click() {
              mainMenu.items[3].submenu.items[2].submenu.items[0].visible = true;
              mainMenu.items[3].submenu.items[2].submenu.items[1].visible = false;
              mainMenu.items[3].submenu.items[2].submenu.items[2].enabled = false;
              mainMenu.items[3].submenu.items[2].submenu.items[2].checked = false;
              mainWindow.webContents.send('grid:toggle', false);
            }
          },
          {
            label: 'Snap to grid',
            type: 'checkbox',
            checked: false,
            enabled: false,
            click() {
              if (mainMenu.items[3].submenu.items[2].submenu.items[2].enabled) {
                gridSnap = !gridSnap;
                mainMenu.items[3].submenu.items[2].submenu.items[2].checked = gridSnap;
                mainWindow.webContents.send('grid:snap', gridSnap);
              }
            }
          },
          {
            label: 'Grid settings',
            click() {
              mainMenu.items[3].submenu.items[2].submenu.items[2].enabled = true;
              adjustGridSettings();
            }
          }
        ]
      },
      {
        label: 'Guides',
        submenu: [
          {
            label: 'Show guides',
            visible: false,
            click() {
              mainMenu.items[2].submenu.items[4].submenu.items[0].visible = false;
              mainMenu.items[2].submenu.items[4].submenu.items[1].visible = true;
              mainWindow.webContents.send('showGuides', true);
            }
          },
          {
            label: 'Hide guides',
            visible: true,
            click() {
              mainMenu.items[2].submenu.items[4].submenu.items[1].visible = false;
              mainMenu.items[2].submenu.items[4].submenu.items[0].visible = true;
              mainWindow.webContents.send('showGuides', false);
            }
          },
          {
            label: 'Lock guides',
            type: 'checkbox',
            checked: false,
            click() {
              guidesLock = !guidesLock;
              mainMenu.items[2].submenu.items[4].submenu.items[2].checked = guidesLock;
              mainWindow.webContents.send('lockGuides', guidesLock);
            }
          }
        ]
      },
      {
        label: 'Kinematic Design',
        accelerator: process.platform == 'darwin' ? 'Command+K' : 'Ctrl+K',
        // enabled: false,
        click() {
          createKinematicsWindow();
        }
      },
      {
        label: 'Machine Learning',
        // enabled: false,
        click() {
          createTensorFlowWindow();
        }
      }

    ]
  },
  {
    label: 'Hardware',
    submenu: [

      {
        label: 'Microcontroller settings',
        accelerator: process.platform == 'darwin' ? 'Command+M' : 'Ctrl+M',
        click() {
          createMotorSettingsWindow();
        }
      },
      {
        label: 'Reset microcontroller data',
        click() {
          serialPort.closeAllSerialPorts();
          mainWindow.webContents.send('resetCOMList');
        }
      }
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'Info',
        click() {
          if (infoWindow === null) {
            createInfoWindow();
          }
        }
      },
      {
        label: 'Online help Feelix',
        click() { shell.openExternal('https://docs.feelix.xyz/'); }
      },
      {
        label: 'SimpleFOC support',
        click() { shell.openExternal('https://simplefoc.com/'); }
      },
      {
        label: 'Clear application data',
        click() { mainWindow.webContents.send('clearApplicationData'); }
      },
      {
        label: 'Open development tools',
        click() {
          // const devtools = new BrowserWindow();
          // mainWindow.webContents.setDevToolsWebContents(devtools.webContents);
          mainWindow.webContents.openDevTools();
        }
      }
    ]
  }
];



const ml_control_menu_template = [
  {
    label: 'Info',
    submenu: [

    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'Open development tools',
        click() {  tensorflowWindow.webContents.openDevTools(); }
      },
    ]
  }
];


const kinematics_menu_template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New model',
        click() {
          createFileSettingWindow("model-settings");
        }
      },
      {
        label: 'Load model',
        click() {
          openFileDialog('mFeelix', 'loadModel', 'loadModelLocation');
        }
      },
      {
        label: 'Save',
        accelerator: process.platform == 'darwin' ? 'Command+S' : 'Ctrl+S',
        click() { kinematicWindow.webContents.send('saveActiveFile', true); }
      },
      {
        label: 'Save as',
        accelerator: process.platform == 'darwin' ? 'Command+Shift+S' : 'Ctrl+Shift+S',
        click() { kinematicWindow.webContents.send('saveActiveFile', false); }
      },
      {
        label: 'Examples',
        submenu: [
          {
            label: 'Snake',
            click() {
              kinematicWindow.webContents.send('example', 'snake');
            }
          },
          {
            label: 'Pointing device',
            click() {
              kinematicWindow.webContents.send('example', 'pointing-device');
            }
          },
          {
            label: 'Linear extension',
            click() {
              kinematicWindow.webContents.send('example', 'pointing-device');
            }
          }
        ]
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Hide grid',
        visible: true,
        click() {
          kinematicsMenu.items[1].submenu.items[0].visible = false;
          kinematicsMenu.items[1].submenu.items[1].visible = true;
          kinematicWindow.webContents.send('gridVisible', false);
        }
      },
      {
        label: 'Show grid',
        visible: false,
        click() {
          kinematicsMenu.items[1].submenu.items[0].visible = true;
          kinematicsMenu.items[1].submenu.items[1].visible = false;
          kinematicWindow.webContents.send('gridVisible', true);
        }
      },
      {
        label: 'Show tools',
        visible: false,
        click() {
          kinematicsMenu.items[1].submenu.items[2].visible = true;
          kinematicsMenu.items[1].submenu.items[3].visible = false;
          kinematicWindow.webContents.send('toolsVisible', true);
        }
      },
      {
        label: 'Hide tools',
        visible: true,
        click() {
          kinematicsMenu.items[1].submenu.items[2].visible = true;
          kinematicsMenu.items[1].submenu.items[3].visible = false;
          kinematicWindow.webContents.send('toolsVisible', true);
        }
      },
      {
        label: 'Show controls',
        visible: false,
        click() {
          kinematicsMenu.items[1].submenu.items[4].visible = true;
          kinematicsMenu.items[1].submenu.items[5].visible = false;
          kinematicWindow.webContents.send('controlsVisible', true);
        }
      },
      {
        label: 'Hide controls',
        visible: true,
        click() {
          kinematicsMenu.items[1].submenu.items[4].visible = true;
          kinematicsMenu.items[1].submenu.items[5].visible = false;
          kinematicWindow.webContents.send('controlsVisible', true);
        }
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: process.platform == 'darwin' ? 'Command+Z' : 'Ctrl+Z',
        click() {
          kinematicWindow.webContents.send('undo', false);
        }
      },
      {
        label: 'Redo',
        accelerator: process.platform === 'darwin' ? 'Command+Shift+Z' : 'Ctrl+Shift+Z',
        click() {
          kinematicWindow.webContents.send('redo', false);
        }
      },
      {
        label: 'Copy',
        accelerator: process.platform === 'darwin' ? 'Command+Shift+C' : 'Ctrl+Shift+C',
        click() {
          kinematicWindow.webContents.send('copy');
        }
      },
      {
        label: 'Deselect all',
        click() {
          kinematicWindow.webContents.send('deselect');
        }
      },
      {
        label: 'Delete',
        click() {
          kinematicWindow.webContents.send('delete', 'selected');
        }
      },
      {
        label: 'Delete all',
        click() {
          kinematicWindow.webContents.send('delete', 'all');
        }
      },
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'Info',
        click() {

        }
      },
      {
        label: 'Open development tools',
        click() {  kinematicWindow.webContents.openDevTools(); }
      },
    ]
  }
];



function openFileDialog(extension, storage, location) {
  dialog.showOpenDialog({
    filters: [{ name: 'All Files', extensions: [extension, 'json'] }],
    properties: ['openFile', 'multiSelections']

  }).then(result => {
    if (result.canceled) return;
    if (result.filePaths) {
      for (const filePath of result.filePaths) {
        jsonfile.readFile(filePath, (err, obj) => {
          if (err) return;

          let loadFile = JSON.stringify(JSON.stringify(obj));
          let loadFileLocation = JSON.stringify(JSON.stringify(filePath));

          if (storage === 'loadFile' || storage === 'loadModel') {

            localStorage.setItem(storage, (loadFile.substring(1, loadFile.length - 1)));
            localStorage.setItem(location, (loadFileLocation.substring(1, loadFileLocation.length - 1)));

          } else if (storage === 'loadData') {
            tensorflowWindow.webContents.send('load-from-files', JSON.stringify(obj));

          } else if (storage === 'loadMLModel') {
            tensorflowWindow.webContents.send('load-ml-model-from-files', JSON.stringify(obj));
          }
        });
      }
    }
  }).catch(err => {
    displayStatus(err, 'main');
  });
}


/****** save file data *****/

ipcMain.on('saveFile', (e, d) => {
  if (d) {
    // console.log(d);
    const data = JSON.parse(d);
    if (data.overwrite && data.file.path) {
      const existingFile = fs.existsSync(data.file.path);
      if (!existingFile) {
        data.overwrite = false;
      }
    }
    saveFileWithDialog(data.file, data.overwrite, data.newId, data.extension);
  }
})


function saveFileWithDialog(file, overwrite, newId, ext) {
  file.date.modified = new Date().getTime();
  file.date.changed = false;

  if (overwrite && file.overwrite) {
    saveChanges(file, 'update', ext);
  } else {
    file._id = newId;

    dialog.showSaveDialog(mainWindow, {
      title: 'Save as',
      defaultPath: '~/' + file.name + ext
    }).then(result => {
      if (result.canceled) return;

      if (result.filePath) {
        let fileName = result.filePath.replace(/^.*[\\\/]/, '');
        let extension = fileName.split(".");
        if (extension[extension.length - 1] === 'feelix') {
          fileName = fileName.slice(0, -5);
        } else if (extension[extension.length - 1] === 'mFeelix') {
          fileName = fileName.slice(0, -6);
        }

        let posName = fileName.lastIndexOf(".");
        file.name = fileName.substring(0, posName < 0 ? fileName.length : posName);

        let posPath = result.filePath.lastIndexOf(".");
        file.path = result.filePath.substring(0, posPath < 0 ? result.filePath.length : posPath) + ext;

        saveChanges(file, 'add', ext);
      }
    }).catch(err => {
      displayStatus(err, 'main');
    });
  }
}


function saveChanges(file, type, extension = '.feelix') {
  fs.writeFile(file.path, JSON.stringify(file), 'utf8', (err) => {
    if (err) throw err;
    const data = {
      file: file,
      type: type
    };

    mainWindow.webContents.send('updatedFile', data);

  });
}


/****** create windows *****/

function createWindow() {
  displays = electron.screen.getAllDisplays();

  mainWindow = new BrowserWindow({
    backgroundColor: '#4a4a4a',
    fullscreenable: true,
    width: displays[0].bounds.width * 0.8,
    height: displays[0].bounds.height * 0.8,
    minHeight: 600,
    minWidth: 700,
    x: displays[0].bounds.width * 0.1,
    y: displays[0].bounds.height * 0.1,
    icon: path.join(__dirname, '../src/assets/icons/png/64x64.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, `../dist/feelix/index.html`),
      protocol: "file:",
      slashes: true
    })
  );

  mainWindow.on('close', () => app.quit());

  mainMenu = Menu.buildFromTemplate(mainMenuTemplate);

  Menu.setApplicationMenu(mainMenu);

  const promise = localStorage.getItem('ngx-webstorage|showInfo');

  promise.then(data => {
    if (data !== 'false') { createInfoWindow(); }
  });

  // mainWindow.webContents.openDevTools();

  mainWindow.webContents.on('did-finish-load', () => {
    displayStatus('Ready', 'main');
    // disconnectMicrocontrollers();
    // serialPort.checkSerialPorts();
  });
}

function createTensorFlowWindow() {
  if (!tensorflowWindow) {
    tensorflowWindow = new BrowserWindow({
      width: 1200,
      height: 650,
      title: 'tensorflow',
      // titleBarStyle: 'hidden',
      backgroundColor: '#333',
      resizable: true,
      movable: true,
      show: false,
      icon: path.join(__dirname, '../src/assets/icons/png/64x64.png'),
      parent: mainWindow,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    })

    const tensorflowMenu = Menu.buildFromTemplate(ml_control_menu_template);

    tensorflowWindow.setMenu(tensorflowMenu);

    tensorflowWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, `../dist/feelix/index.html`),
        protocol: "file:",
        slashes: true,
        hash: '/tensorflowjs'
      })
    );

    tensorflowWindow.once('ready-to-show', () => {
      tensorflowWindow.show()
    });

    // tensorflowWindow.webContents.openDevTools();

    tensorflowWindow.on('close', () => {
      tensorflowWindow = null
    });
  }
}





function drawTemporaryWindow(width, minWidth, height, minHeight, title, resizable, hash, details = null, parent = mainWindow) {

  if (tmpWindow !== null) {
    tmpWindow.close();
  }

  activeWindow = hash;

  tmpWindow = new BrowserWindow({
    show: false,
    width: width,
    height: height,
    minWidth: minWidth,
    minHeight: minHeight,
    title: title,
    backgroundColor: '#333',
    alwaysOnTop: true,
    frame: false,
    resizable: resizable,
    // resizable: true,
    fullscreenable:false,
    center: false,
    movable: true,
    parent: parent,
    icon: path.join(__dirname, '../src/assets/icons/png/64x64.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  tmpWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, `../dist/feelix/index.html`),
      protocol: "file:",
      slashes: true,
      hash: '/' + hash
    })
  )

  tmpWindow.once('ready-to-show', () => {
    tmpWindow.show()
    if (details !== null) {
      tmpWindow.webContents.send('details', details);
    }
    mainWindow.webContents.send('resetCursor');
  })

  // tmpWindow.webContents.openDevTools();

  tmpWindow.on('close', () => {
    tmpWindow = null
  })

}


function createInfoWindow() {
  infoWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Info',
    // titleBarStyle: 'hidden',
    backgroundColor: '#eee',
    resizable: false,
    movable: true,
    show: false,
    icon: path.join(__dirname, '../src/assets/icons/png/64x64.png'),
    parent: mainWindow,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  infoWindow.setMenu(null);

  infoWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, `../dist/feelix/index.html`),
      protocol: "file:",
      slashes: true,
      hash: '/info'
    })
  );

  infoWindow.once('ready-to-show', () => {
    infoWindow.show()
  });


  infoWindow.on('close', () => {
    infoWindow = null
  })
}



function createToolbar(hash, width, type) {

  if (toolbars.filter(t => t.type === type).length === 0) {

    let y = (displays[0].bounds.height * 0.1) + 350;
    if (type === 'motor') {
      y = (displays[0].bounds.height * 0.1) + 70;
    }

    let newToolbar = new BrowserWindow({
      width: width, // 321
      height: 46,
      x: (displays[0].bounds.width * 0.1) + 50,
      y: y,
      title: 'Toolbar',
      // titleBarStyle: 'hiddenInset',
      backgroundColor: '#3a3a3a',
      frame: false,
      resizable: false,
      alwaysOnTop: true,
      visibleOnAllWorkspaces: false,
      fullscreenable: false,
      center: false,
      movable: true,
      show: false,
      parent: mainWindow,
      icon: path.join(__dirname, '../src/assets/icons/png/64x64.png'),
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    })
    newToolbar.loadURL(
      url.format({
        pathname: path.join(__dirname, `../dist/feelix/index.html`),
        protocol: "file:",
        slashes: true,
        hash: hash
      })
    );

    newToolbar.once('ready-to-show', () => {
      newToolbar.show();
      mainWindow.webContents.send('resetCursor');
    })

    newToolbar.on('close', () => {
      const toolbarEl = toolbars.filter(t => t.type === type);
      if (toolbarEl) {
        const toolbarIndex = toolbars.indexOf(toolbarEl);
        toolbars.splice(toolbarIndex, 1);
      }
      newToolbar = null
    })

    toolbars.push({ toolbar: newToolbar, type: type });
  }

}

function createKinematicsWindow() {
  kinematicWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Kinematics',
    // titleBarStyle: 'hidden',
    backgroundColor: '#e0e0e0',
    resizable: true,
    movable: true,
    show: false,
    icon: path.join(__dirname, '../src/assets/icons/png/64x64.png'),
    parent: mainWindow,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  kinematicsMenu = Menu.buildFromTemplate(kinematics_menu_template);

  kinematicWindow.setMenu(kinematicsMenu);

  kinematicWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, `../dist/feelix/index.html`),
      protocol: "file:",
      slashes: true,
      hash: '/kinematics'
    })
  );

  kinematicWindow.once('ready-to-show', () => {
    kinematicWindow.show()
  });

  // kinematicWindow.webContents.openDevTools();

  kinematicWindow.on('close', () => {
    kinematicWindow = null
  })
}




function createFileSettingWindow(filepath) {
  drawTemporaryWindow(380, 380, 180, 180, 'File Settings', false, filepath);
}

function createLoadDataSetWindow(filepath) {
  drawTemporaryWindow(560, 300, 400, 300, 'Load Data Sets', true, filepath);
}

function createEffectSettingWindow(filepath) {
  drawTemporaryWindow(400, 400, (filepath === "effect-settings" ? 370 : 350), 350, 'Effect Settings', false, filepath);
}

function createMotorSettingsWindow() {
  drawTemporaryWindow(520, 400, 450, 300, 'Microcontroller settings', true, 'motor-settings');
}

function adjustGridSettings() {
  drawTemporaryWindow(400, 400, 480, 480, 'Grid size', false, 'grid-settings');
}


// function createZiGZaG() {
//   drawTemporaryWindow(400, 380, 'Zig Zag', false, 'zigzag');
// }

function createTransform() {
  drawTemporaryWindow(400, 400, 270, 270, 'Transform', false, 'transform');
}

function createConnectToCOM(comPorts) {
  mainWindow.webContents.send('updateAvailableCOMPorts', comPorts.serialPort);

  if (activeWindow !== 'motor-settings') {
  //   tmpWindow.webContents.send('comports', comPorts);
  // } else {
    createMotorSettingsWindow();

    setTimeout(() => tmpWindow.webContents.send('comports', comPorts), 1000);
  }
}

function getPorts(comPorts) {
  if (tmpWindow && activeWindow === 'motor-settings') {
    tmpWindow.webContents.send('comports', comPorts);
  }
}


// function openFile(file, tab) {
//   const src = path.join(__dirname, '../../example-files/' + tab + '/' + file);
//   jsonfile.readFile(src, (err, obj) => {
//     let loadFile = JSON.stringify(JSON.stringify(obj));
//     let loadFileLocation = JSON.stringify(JSON.stringify(src));

//     localStorage.setItem('loadFile', (loadFile.substring(1, loadFile.length - 1)));
//     localStorage.setItem('loadFileLocation', (loadFileLocation.substring(1, loadFileLocation.length - 1)));
//   });
// }




/****** communication *****/

ipcMain.on('openExternalLink', (e, url) => {
  if (!['https:', 'http:'].includes(new URL(url).protocol)) return;
  shell.openExternal(url);
});

ipcMain.on('closeInfoWindow', () => {
  infoWindow.close();
});

ipcMain.on('attachToolbar', () => {
  const selectedToolbar = toolbars.filter(t => t.type === 'edit')[0];
  if (selectedToolbar) {
    selectedToolbar.toolbar.close();
    mainWindow.webContents.send('attachToolbar');
  }
});

ipcMain.on('attachToolbarMotor', () => {
  const selectedToolbar = toolbars.filter(t => t.type === 'motor')[0];
  if (selectedToolbar) {
    selectedToolbar.toolbar.close();
    mainWindow.webContents.send('attachMotorControlToolbar');
  }
});

ipcMain.on('showToolbar', () => {
  createToolbar('/toolbar', 321, 'edit');
  mainMenu.items[2].submenu.items[0].checked = true;
});

ipcMain.on('showToolbarMotor', () => {
  createToolbar('/motor-control-toolbar', 244, 'motor'); //170
});



ipcMain.on('closeTmpWindow', () => {
  tmpWindow.close();
});

ipcMain.on('effectSettings', (e, filepath) => {
  createEffectSettingWindow(filepath);
});

ipcMain.on('export', (e, data) => {
  mainWindow.webContents.send('showExport', data);
});

ipcMain.on('updateButtonState', (e, data) => {
  mainWindow.webContents.send('updateButtonState', data);
});



ipcMain.on('addCollection', () => {
  mainWindow.webContents.send('addCollection');
});

ipcMain.on('uploadAll', () => {
  mainWindow.webContents.send('uploadAll');
});

ipcMain.on('uploadAll', () => {
  mainWindow.webContents.send('uploadAll');
});

ipcMain.on('transform', (e, data) => {
  mainWindow.webContents.send('transform', data);
  if (data.tmp === false) {
    tmpWindow.close();
  }
});

ipcMain.on('updateMotorControlToolbarButton', (e, data) => {
  const motorToolbar = toolbars.filter(t => t.type === 'motor')[0];
  if (motorToolbar) {
    motorToolbar.toolbar.webContents.send('disableButton', data);
  }
});

ipcMain.on('updateCursor', (e, details) => {
  mainWindow.webContents.send('updateCursor', details);
  mainWindow.focus();
});

ipcMain.on('selectCursor', (e, acc) => {
  const selectedToolbar = toolbars.filter(t => t.type === 'edit')[0];
  if (selectedToolbar) {
    selectedToolbar.toolbar.webContents.send('selectCursor', acc);
  }
});

ipcMain.on('updateToolbarSize', (e, size) => {
  const selectedToolbar = toolbars.filter(t => t.type === 'edit')[0];
  if (selectedToolbar) {
    if (size === 'large') {
      selectedToolbar.toolbar.setBounds({ width: 321 });
    } else { selectedToolbar.toolbar.setBounds({ width: 284 }); }
  }
});


ipcMain.on('increaseHeightCOMWindow', (e, height) => {
  tmpWindow.setSize(500, height);
});

ipcMain.on('updateHeightSettings', (e, height) => {
  tmpWindow.setSize(430, height);
});

ipcMain.on('listSerialPorts', (e, data) => {
  if (data) {
    serialPort.listSerialPorts(createConnectToCOM);
  } else {
    serialPort.listSerialPorts(getPorts);
  }
});


ipcMain.on('addMicrocontroller', (e, data) => {
  // console.log('add microcontroller ', data);
  serialPort.createConnection(data);
  mainWindow.webContents.send('updateStatus', { microcontroller: data, connected: false, error: false });
});

// ipcMain.on('updateMicrocontroller', (e, data) => {
//   mainWindow.webContents.send('updateMicrocontroller', { microcontroller: data, connected: false, error: false });
// });

ipcMain.on('updateMicrocontrollers', (e, data) => {
  if (tmpWindow !== null && (activeWindow === 'motor-settings')) {
    tmpWindow.webContents.send('microcontrollers', data);
  }
});

ipcMain.on('deleteMicrocontrollerCollections', (e, data) => {
  mainWindow.webContents.send('deleteMicrocontrollerCollections', data);
});


ipcMain.on('connectToSerialPort', (e, data) => {
  serialPort.connectToSerialPort(data.COM);
});

ipcMain.on('loadDataFromFile', (e) => {
  openFileDialog('json', 'loadData', 'loadDataLocation');
});

// ipcMain.on('connectToSerialPort', (e, data) => {
//   if (data.connect) {
//     serialPort.connectToSerialPort(data.COM);
//   } else {
//     serialPort.closeSerialPort(data.COM);
//   }
// });



ipcMain.on('playEffect', (e, data) => {
  serialPort.playEffect(data.play, data.microcontroller);
});

ipcMain.on('playAll', (e, data) => {
  mainWindow.webContents.send('playAll', data);
});


ipcMain.on('playAllSequenceWindow', (e, data) => {
  mainWindow.webContents.send('playAllSequenceWindow');
});

ipcMain.on('motorSettings', (e, data) => {
  createMotorSettingsWindow();
});

ipcMain.on('changeViewSettings', (e, data) => {
  mainWindow.webContents.send('changeViewSettings');
});


ipcMain.on('load-datasets', (e, data) => {
  tensorflowWindow.webContents.send('load-datasets', data);
});

ipcMain.on('load-model', (e, data) => {
  tensorflowWindow.webContents.send('load-model', data);
});

ipcMain.on('export-datasets', (e, data) => {
  tensorflowWindow.webContents.send('export-dataset-model', data);
});

// ipcMain.on('saveLogFile', (e, data) => {
//   const timeStamp = new Date().getTime();

//   dialog.showSaveDialog(mainWindow, {
//     title: 'Save data log',
//     defaultPath: '~/log-' + timeStamp + '.txt'
//   }, (filePath) => {
//     if (filePath != null) {
//       fs.writeFile(filePath, data, 'utf8', (err) => {
//         if (err) throw err;
//       });
//     }
//   });
// })


ipcMain.on('clearAllData', (e) => {
  localStorage.clear();
  setTimeout(() => {
    app.relaunch();
    app.exit();
  }, 10000);
});

ipcMain.on('updateMenu', (e, item) => {

  gridVisible = item.visible;
  gridSnap = item.snap;
  gridLock = item.lock;
  fileType = item.type;
  mainMenu.items[3].submenu.items[2].submenu.items[0].visible = !item.visible;
  mainMenu.items[3].submenu.items[2].submenu.items[1].visible = item.visible;
  mainMenu.items[3].submenu.items[2].submenu.items[2].checked = item.snap;
  mainMenu.items[3].submenu.items[2].submenu.items[2].enabled = item.visible === false ? false : true;
})



ipcMain.on('showMessage', (event, data) => {
  mainWindow.webContents.send('showMessage', data);
});

ipcMain.on('ondragstart', (event, data) => {
  mainWindow.webContents.send('addHapticEffect', data);
})

ipcMain.on('ondragstartLib', (event, data) => {
  mainWindow.webContents.send('addHapticLibEffect', data);
})


ipcMain.on('updateLayerColors', (event, data) => {
  mainWindow.webContents.send('updateEffectColors', data);
});


ipcMain.on('updateToolbar', (event, data) => {
  const selectedToolbar = toolbars.filter(t => t.type === 'edit')[0];
  if (selectedToolbar) {
    selectedToolbar.toolbar.webContents.send('updateToolbar', data);
  } else {
    mainWindow.webContents.send('updateToolbar', data);
  }
});


ipcMain.on('repeatEffect', (event, data) => {
  mainWindow.webContents.send('repeatEffect', data);
});

ipcMain.on('mirrorEffect', (event, data) => {
  mainWindow.webContents.send('mirrorEffect', data);
});

ipcMain.on('changeLayerEffect', (event, data) => {
  mainWindow.webContents.send('changeLayerEffect', data);
});

ipcMain.on('saveToEffectLibrary', (event, data) => {
  mainWindow.webContents.send('saveToEffectLibrary', data);
});


// ipcMain.on('updateMicrocontrollerDetails', (event, microcontrollerDetails) => {
//   mainWindow.webContents.send('updateControllerDetails', microcontrollerDetails);
// })


ipcMain.on('upload', (event, data) => {
  // console.log(data);
  serialPort.uploadData(data);
});

ipcMain.on('requestData', (event, data) => {
  // console.log(data);
  serialPort.requestData(data);
});

ipcMain.on('load-dataset', () => {
  createLoadDataSetWindow('load-dataset');
});


ipcMain.on('loadMLModel', (event, data) => {
  createLoadDataSetWindow('load-model');
});

// ipcMain.on('moveToPos', (event, data) => {
//   serialPort.moveToPos(data.microcontroller, data.pos);
// });

ipcMain.on('getCalibrationValue', (event, data) => {
  serialPort.calibrateMotor(data);
});

ipcMain.on('getCurrentSenseCalibrationValue', (event, data) => {
  serialPort.calibrateCurrentSense(data);
});

ipcMain.on('updateFilter', (event, data) => {
  serialPort.updateFilter(data);
});

ipcMain.on('updateMotorSetting', (event, data) => {
  serialPort.updateMotorSetting(data);
});

ipcMain.on('saveCalibrationValueToEEPROM', (event, data) => {
  serialPort.saveCalibrationValueToEEPROM(data.motor, data.microcontroller);
});

ipcMain.on('updateStartPos', (event, data) => {
  serialPort.updateStartPosition(data.microcontroller, data.position);
});

ipcMain.on('updateEffectData', (event, data) => {
  serialPort.updateEffectData(data.type, data.data, data.effectIndex, data.microcontroller); ///type, data, effectIndex, serialData
});

ipcMain.on('updateSleepmode', (event, data) => {
  serialPort.updateSleepmode(data.microcontroller, data.sleep);
});

ipcMain.on('updateExternalDevice', (event, data) => {
  serialPort.updateExternalDevice(data.COM, data.list);
});

ipcMain.on('openEffectInNewFile', (event, effect) => {
  mainWindow.send('openEffectInNewFile', effect);
  mainWindow.focus();
});

ipcMain.on('play_collection', (event, data) => {
  serialPort.play(data.play, data.motor_id, data.collection_name, data.port);
});

ipcMain.on('return_to_start', (event, data) => {
  serialPort.returnToStart(data.motor_id, data.collection_name, data.port);
});

ipcMain.on('run', (event, data) => {
  serialPort.run(data.motor_id, data.port, data.run);
});

ipcMain.on('update_motor_variable', (event, data) => {
  serialPort.updateMotorControlVariable(data.char, data.d, data.motor_id, data.port);
});

ipcMain.on('update_effect_variable', (event, data) => {
  serialPort.updateEffectData(data.char, data.d, data.effect_index, data.port);
});

ipcMain.on('send_data_str', (event, data) =>  {
  serialPort.sendDataString(data);
});

ipcMain.on('getValue', (event, data) => {
  serialPort.getValue(data.motor_id, data.port, data.char);
});

ipcMain.on('newModel', (event, data) => {
  if (kinematicWindow !== null) {
    kinematicWindow.webContents.send('newModel', data);
  }
});

ipcMain.on('listDevices', (event, data) => {
  serialPort.listDevices(data.motor_id, data.port);
});


//tensorflow communication

// ipcMain.on('createTensors', (event, data) => {
//   tensorflow.createTensors(data.d, data.options, data.epochs, data.batchSize); //32, 12
// });

// ipcMain.on('NN_classify', (event, data) => {
//   tensorflow.NN_classify(data);
// });





function updateSerialStatus(status) {
  if (status.microcontroller) {
    mainWindow.webContents.send('updateStatus', status);
  }
}

function updateSerialProgress(data) {
  mainWindow.webContents.send('updateProgress', data);
  if (tensorflowWindow !== null) {
    tensorflowWindow.webContents.send('updateProgress', data);
  }
}

function updateAvailablePortList(list) {
  mainWindow.webContents.send('updateAvailableCOMPorts', list);
}

function displayStatus(data, page) {
  if (page === 'main') {
    mainWindow.webContents.send('statusMsg', data);
  }
}

function disconnectMicrocontrollers() {
  mainWindow.webContents.send('disconnect');
}

function visualizaMotorData(data) {
  mainWindow.webContents.send('playData', data);
  if (tensorflowWindow !== null) {
    tensorflowWindow.webContents.send('motorData', data);
  }
}

function visualizaPressureMotorData(data) {
  mainWindow.webContents.send('playDataPressure', data);
  if (tensorflowWindow !== null) {
    tensorflowWindow.webContents.send('pneumaticDataPressure', data);
  }
}


function updateZeroElectricAngle(data) {
  mainWindow.webContents.send('zero_electric_angle', data);

  if (tmpWindow !== null && (activeWindow === 'motor-settings')) {
    tmpWindow.webContents.send('zero_electric_angle', data);
  }

}

function uploadSuccesful(collection) {
  mainWindow.webContents.send('upload_succesful', collection);
}

function updateCurrentSenseCalibration(data) {
  mainWindow.webContents.send('updateCurrentSenseCalibration', data);

  if (tmpWindow !== null && (activeWindow === 'motor-settings')) {
    tmpWindow.webContents.send('updateCurrentSenseCalibration', data);
  }
}

function showMessageConfirmation(data) {
  mainWindow.webContents.send('showMessageConfirmation', data);
}

function returnData(data) {
  if (tmpWindow !== null && (activeWindow === 'motor-settings')) {
    tmpWindow.webContents.send('receiveData', data);
  }
}

function checkPorts(portlist) {
  if (tmpWindow !== null && (activeWindow === 'motor-settings')) {
    tmpWindow.webContents.send('checkPorts', portlist);
  } else if (tensorflowWindow) {
    tensorflowWindow.webContents.send('checkPorts', portlist);
  }
}




exports.updateSerialStatus = updateSerialStatus;
exports.displayStatus = displayStatus;
exports.updateAvailablePortList = updateAvailablePortList;
exports.visualizaMotorData = visualizaMotorData;
exports.visualizaPressureMotorData = visualizaPressureMotorData;
exports.updateSerialProgress = updateSerialProgress;
exports.updateZeroElectricAngle = updateZeroElectricAngle;
exports.uploadSuccesful = uploadSuccesful;
exports.updateCurrentSenseCalibration = updateCurrentSenseCalibration;
exports.showMessageConfirmation = showMessageConfirmation;
exports.returnData = returnData;
exports.checkPorts = checkPorts;
