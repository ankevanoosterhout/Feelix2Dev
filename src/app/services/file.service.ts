import { Injectable } from '@angular/core';
import { File } from '../models/file.model';
import { Details, Effect } from '../models/effect.model';
import { v4 as uuid } from 'uuid';
import { LocalStorageService } from 'ngx-webstorage';
import { Subject } from 'rxjs';
import { FileSaverService } from 'ngx-filesaver';
import { NodeService } from './node.service';
import { Collection } from '../models/collection.model';
import { Configuration, EffectType, OpenTab } from '../models/configuration.model';
import { HistoryService } from './history.service';
import { CloneService } from './clone.service';
import { MidiNote } from '../models/audio.model';
import { MidiDataService } from './midi-data.service';

@Injectable()
export class FileService {

  public static readonly  LOAD_FILE = 'loadFile';
  public static readonly  LOAD_FILE_LOCATION = 'loadFileLocation';
  public static readonly  FILES_LOCATION = 'ngx-webstorage|files';

  public fileObservable = new Subject<File[]>();
  fs: any;

  files = [];

  // tslint:disable-next-line: variable-name
  constructor(private localSt: LocalStorageService, private _FileSaverService: FileSaverService, private nodeService: NodeService,
              private historyService: HistoryService, private cloneService: CloneService, private midiDataService: MidiDataService) {

    this.fs = (window as any).fs;
    // if loadfile exists, remove it from localstorage (on startup)
    localStorage.removeItem(FileService.LOAD_FILE);
    localStorage.removeItem(FileService.LOAD_FILE_LOCATION);

    // retrive files stored in local storage
    const storedFiles = this.localSt.retrieve('files');
    if (storedFiles && storedFiles.length > 0) {
      this.files = storedFiles;
      this.setAnyActive();
    } else {
      this.createDefault('Untitled-1');
    }

    // listen for new files made by the user
    /*
    this.localSt.observe('files').subscribe(value => {
      console.log(value);
      this.files = value;
      this.fileObservable.next(this.files);
    });
    */

    // listen for files opened by the user and files changes

    window.addEventListener( 'storage', event => {
      if (event.storageArea === localStorage) {
        if (event.key === FileService.FILES_LOCATION) {
          const files: File[] = JSON.parse(localStorage.getItem(FileService.FILES_LOCATION));
          this.files = files;
          this.fileObservable.next(this.files);
        }

        if (event.key.startsWith(FileService.LOAD_FILE)) {
          const fileLocation: string = JSON.parse(localStorage.getItem(FileService.LOAD_FILE_LOCATION));

          this.parseFile(localStorage.getItem(FileService.LOAD_FILE)).then((file: File) => {
            try {
              file.path = fileLocation;
              if (this.files.filter(f => f._id === file._id).length === 0) {
                this.files.push(file);
              }
              this.setActive(file);
            } catch (error) {
            }
          });

          localStorage.removeItem(FileService.LOAD_FILE);
          localStorage.removeItem(FileService.LOAD_FILE_LOCATION);
        }
      }
    }, false );


  }

  createDefault(name: string) {
    const defaultFile = new File(name, uuid(), true);
    const collection = new Collection(uuid(), 'Collection-' + (defaultFile.collections.length + 1));
    // console.log(collection);
    const defaultEffect = new Effect(uuid(), EffectType.torque);
    defaultFile.collections.push(collection);
    defaultFile.effects.push(defaultEffect);
    defaultFile.activeEffect = defaultEffect;
    const effectTab = new OpenTab(defaultEffect.id, defaultEffect.name);
    effectTab.isActive = true;
    defaultFile.configuration.openTabs.push(effectTab);
    this.nodeService.reset();
    this.add(defaultFile);
  }

  createFileFrom(effectData: any) {
    const newFile = new File(effectData.interface.name, uuid(), true);

    // newFile.grid.units = effectData.units;
    // newFile.mode = effectData.componentType.sub === 'time' ? 'servo' : 'default';
    // newFile.nodes = [ effectData.path ];
    // const effect = effectData;
    // if (newFile.mode === 'default') {
    //   effect.path = effectData.path.id;
    // } else {
    //   newFile.configuration.activeTimeEffect = effect;
    // }
    // newFile.effects.push(effect);
    this.add(newFile);
  }

  addCollection() {
    const selectedFile = this.files.filter(f => f.isActive)[0];
    if (selectedFile) {
      const collection = new Collection(uuid(), 'Collection-' + (selectedFile.collections.length + 1));
      selectedFile.collections.push(collection);
      // console.log(selectedFile.collections);
      this.store();
    }
  }

  updateCollection(collection: Collection) {
    const activeFile = this.files.filter(f => f.isActive)[0];
    if (activeFile) {
      activeFile.collections.filter(c => c.id === collection.id)[0] = this.cloneService.deepClone(collection);
      activeFile.activeCollection = activeFile.collections.filter(c => c.id === collection.id)[0];
      this.store();
    }
  }


  updateCollectionEffect(collection: Collection, collEffect: Details) {
    const activeFile = this.files.filter(f => f.isActive)[0];
    if (activeFile) {
      activeFile.activeCollectionEffect = collEffect;
      activeFile.activeCollection = collection;
      let collectionItem = activeFile.collections.filter(c => c.id === collection.id)[0];
      if (collectionItem) {
        collectionItem.effects.filter(e => e.id === collEffect.id)[0] = this.cloneService.deepClone(collEffect);
        // collectionItem.effects.filter(e => e.id === collEffect.id)[0].flip = this.cloneService.deepClone(collEffect.flip);
        // collectionItem.effects.filter(e => e.id === collEffect.id)[0].scale = this.cloneService.deepClone(collEffect.scale);
        collectionItem.effects.filter(e => e.id === collEffect.id)[0].xUnit = collEffect.xUnit;
        this.store();
      }
    }
  }

  copyCollection(collectionID: string) {
    const activeFile = this.files.filter(f => f.isActive)[0];
    if (activeFile) {
      const collection = activeFile.collections.filter(c => c.id === collectionID)[0];
      if (collection) {
        const collectionCopy = this.cloneService.deepClone(collection);
        collectionCopy.id = uuid();
        collectionCopy.name += '-copy';
        for (const effect of collectionCopy.effects) {
          effect.id = uuid();
        }
        activeFile.collections.push(collectionCopy);
        this.store();
      }
    }
  }

  deleteCollection(collectionID: string) {
    const activeFile = this.files.filter(f => f.isActive)[0];
    if (activeFile) {
      const collection = activeFile.collections.filter(c => c.id === collectionID)[0];
      const selectIndex = activeFile.collections.indexOf(collection);
      activeFile.collections.splice(selectIndex, 1);
      this.store();
    }
  }

  addEffect(effect: Effect) {
    const activeFile = this.files.filter(f => f.isActive)[0];
    if (activeFile) {
      activeFile.effects.push(effect);
      this.addTab(activeFile, effect.id, effect.name);
      this.setEffectActive(effect);
      this.sortEffects(activeFile.configuration.sortType);
    }
  }


  addMidiEffect(effect: MidiNote) {
    const activeFile = this.files.filter(f => f.isActive)[0];
    if (activeFile) {
      this.addTab(activeFile, effect.id, effect.name);
      this.setEffectActive(effect);
    }
  }

  addTab(file: File, effectID: string, effectName: string) {
    const openTab = file.configuration.openTabs.filter(t => t.id === effectID)[0];
    if (!openTab) {
      const tab = new OpenTab(effectID, effectName);
      file.configuration.openTabs.push(tab);
    } else {
      openTab.name = effectName;
    }
  }


  openEffect(effectID: string) {
    const activeFile = this.files.filter(f => f.isActive)[0];
    if (activeFile && activeFile.effects.length > 0) {

      // const effect = activeFile.effects.filter(e => e.id === effectID)[0];
      const effect = this.getEffect(effectID, activeFile);
      if (effect) {
        const tab = activeFile.configuration.openTabs.filter(t => t.id === effectID)[0];
        if (!tab) {
          const newTab = new OpenTab(effect.id, effect.name);
          activeFile.configuration.openTabs.push(newTab);
        } else {
          tab.name = effect.name;
        }
        this.setEffectActive(effect);
      }
    }
  }

  closeEffectTab(effectID: string) {
    const activeFile = this.files.filter(f => f.isActive)[0];
    if (activeFile) {
      if (activeFile.configuration.openTabs.length > 0) {
        const openTab = activeFile.configuration.openTabs.filter(t => t.id === effectID)[0];

        if (openTab) {
          const tabActive = openTab.isActive;
          const tabIndex = activeFile.configuration.openTabs.indexOf(openTab);
          if (tabIndex > -1) {
            activeFile.configuration.openTabs.splice(tabIndex, 1);
            if (tabActive) {
              this.setAnyEffectActive();
            } else {
              this.store();
            }
          }
          this.historyService.clearHistoryEffect(effectID);
        }
      }
    }
  }

  updateActiveEffectData(file: File) {
    if (file.activeEffect) {
      if (file.activeEffect.type === EffectType.midi) { // && file.activeEffect.dataType === MidiDataType.notes
        let midiEffect = file.effects.filter(e => e.id === file.activeEffect.id)[0];
        if (midiEffect) {
          midiEffect.range = this.cloneService.deepClone(file.activeEffect.range);
          midiEffect.grid = this.cloneService.deepClone(file.activeEffect.grid);
          midiEffect.date.modified = new Date().getTime();
          if (midiEffect.data) {
            midiEffect.data = this.cloneService.deepClone(file.activeEffect.data);
            midiEffect.size = this.midiDataService.getSize(file.activeEffect.data);
          }
        }
      } else {
        file.activeEffect.paths = this.nodeService.getAll();
        file.activeEffect.size = this.getPathEffectSize(file.activeEffect);

        for (const collection of file.collections) {
          const multiply = collection.rotation.units.PR / file.activeEffect.grid.xUnit.PR;
          for (const collEffect of collection.effects) {
            if (collEffect.effectID === file.activeEffect.id) {
              const newWidth = file.activeEffect.size.width * multiply;
              collEffect.position.width = newWidth * (collEffect.scale.x/100);
              collEffect.position.height = file.activeEffect.size.height * (collEffect.scale.y/100);
              collEffect.position.top = file.activeEffect.size.top;
              collEffect.position.bottom = file.activeEffect.size.bottom;
            }
          }
        }
        // let effect = file.effects.filter(e => e.id === file.activeEffect.id)[0];
        let effect = this.getEffect(file.activeEffect.id, file);
        if (effect && effect.type !== EffectType.midiNote) {
          file.effects.filter(e => e.id === effect.id)[0] = this.cloneService.deepClone(file.activeEffect);
          file.effects.filter(e => e.id === effect.id)[0].paths = this.cloneService.deepClone(file.activeEffect.paths);
          file.effects.filter(e => e.id === effect.id)[0].size = this.cloneService.deepClone(file.activeEffect.size);
          file.effects.filter(e => e.id === effect.id)[0].type = file.activeEffect.type;
          file.effects.filter(e => e.id === effect.id)[0].rotation = file.activeEffect.rotation;
          file.effects.filter(e => e.id === effect.id)[0].range = this.cloneService.deepClone(file.activeEffect.range);
          file.effects.filter(e => e.id === effect.id)[0].range_y = this.cloneService.deepClone(file.activeEffect.range_y);
          file.effects.filter(e => e.id === effect.id)[0].date.modified = new Date().getTime();
          file.effects.filter(e => e.id === effect.id)[0].grid = this.cloneService.deepClone(file.activeEffect.grid);

        } else if (effect && effect.type === EffectType.midiNote) {
          const parent = this.getParentEffect(effect.id, file);
          if (parent && parent.data.filter(p => p.effect.id === effect.id)[0]) {
            parent.data.filter(p => p.effect.id === effect.id)[0].effect = this.cloneService.deepClone(file.activeEffect);
            parent.data.filter(p => p.effect.id === effect.id)[0].effect.paths = this.cloneService.deepClone(file.activeEffect.paths);
            parent.data.filter(p => p.effect.id === effect.id)[0].effect.size = this.cloneService.deepClone(file.activeEffect.size);
            parent.data.filter(p => p.effect.id === effect.id)[0].effect.type = file.activeEffect.type;
            parent.data.filter(p => p.effect.id === effect.id)[0].effect.range = this.cloneService.deepClone(file.activeEffect.range);
            parent.data.filter(p => p.effect.id === effect.id)[0].effect.range_y = this.cloneService.deepClone(file.activeEffect.range_y);
            parent.data.filter(p => p.effect.id === effect.id)[0].effect.date.modified = new Date().getTime();
            parent.data.filter(p => p.effect.id === effect.id)[0].effect.grid = this.cloneService.deepClone(file.activeEffect.grid);
            parent.data.filter(p => p.effect.id === effect.id)[0].effect.midi_config = this.cloneService.deepClone(file.activeEffect.midi_config);
          }
        }
      }
    }
  }



  getEffect(id: string, file: File) {
    for (const effect of file.effects) {
      if (effect.id === id) {
        return effect;
      } else if (effect.type === EffectType.midi) { // && effect.dataType === MidiDataType.notes
        if (effect.data && effect.data.length > 0) {
          const midiEffect = effect.data.filter(d => d.effect.id === id)[0];
          if (midiEffect) {
            return midiEffect.effect;
          }
        }
      }
    }
    return;
  }

  getParentEffect(child: string, file: File) {
    for (const effect of file.effects) {
      if (effect.type === EffectType.midi) { // && effect.dataType === MidiDataType.notes
        if (effect.data && effect.data.length > 0) {
          if (effect.data.filter(d => d.effect.id === child).length > 0) {
            return effect;
          }
        }
      }
    }
  }


  setEffectActive(effect: Effect) {
    const activeFile = this.files.filter(f => f.isActive)[0];
    if (activeFile) {
      this.updateActiveEffectData(activeFile);

      for (const tab of activeFile.configuration.openTabs) {
        tab.isActive = tab.id === effect.id ? true : false;
      }
      activeFile.activeEffect = effect;
      this.nodeService.loadFile(activeFile.activeEffect.paths);
      this.store();
    }
  }

  setAnyEffectActive() {
    const activeFile = this.files.filter(f => f.isActive)[0];
    if (activeFile) {
      if (activeFile.configuration.openTabs.length > 0) {
        const activeTab = activeFile.configuration.openTabs.filter(t => t.isActive)[0];
        if (activeTab) {
          this.setEffectActive(activeFile.effects.filter(e => e.id === activeTab.id)[0]);
        } else {
          const tab = activeFile.configuration.openTabs[activeFile.configuration.openTabs.length - 1];
          const effect = activeFile.effects.filter(e => e.id === tab.id)[0];
          if (effect) {
            this.setEffectActive(effect);
          }
        }
      } else {
        if (activeFile.activeEffect) {
          this.updateActiveEffectData(activeFile);
        }
        this.nodeService.reset();
        activeFile.activeEffect = null;
        this.store();
      }
    }
  }

  updateEffect(effect: Effect, saveToHistory = true) {
   if (effect) {
    const activeFile = this.files.filter(f => f.isActive)[0];
    if (activeFile) {
        this.updateActiveEffectData(activeFile);
        if (saveToHistory) {
          this.historyService.addToHistory();
        }
        this.store();
      }
    }
  }

  getPathEffectSize(effect: any) {
    if (effect && effect.paths.length > 0) {
      let minX = effect.paths[0].box.left;
      let maxX = effect.paths[0].box.right;
      let minY = effect.paths[0].box.bottom;
      let maxY = effect.paths[0].box.top;
      for (const path of effect.paths) {
        if (path.box.left < minX) {
          minX = path.box.left;
        }
        if (path.box.right > maxX) {
          maxX = path.box.right;
        }
        if (path.box.top > maxY) {
          maxY = path.box.top;
        }
        if (path.box.bottom < minY) {
          minY = path.box.bottom;
        }
      }
      return { x: minX, y: maxY, width: maxX - minX, height: maxY - minY, top: maxY, bottom: minY };
    }
    return { x: 0, y: 0, width: 0, height: 0, top:0, bottom: 0 };
  }

  sortEffects(sortType: string) {
    const activeFile = this.files.filter(f => f.isActive)[0];
    activeFile.configuration.sortType = sortType;
    if (activeFile.configuration.sortType === 'name') {
      activeFile.effects.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
    } else if (activeFile.configuration.sortType === 'type') {
      activeFile.effects.sort((a,b) => (a.type > b.type) ? 1 : ((b.type > a.type) ? -1 : 0));
    } else if (activeFile.configuration.sortType === 'date-created') {
      activeFile.effects.sort((a,b) => (a.date.created > b.date.created) ? 1 : ((b.date.created > a.date.created) ? -1 : 0));
    } else if (activeFile.configuration.sortType === 'date-modified') {
      activeFile.effects.sort((a,b) => (a.date.modified > b.date.modified) ? 1 : ((b.date.modified > a.date.modified) ? -1 : 0));
    }
    if (activeFile.configuration.sortDirection === 'last-first') {
      activeFile.effects.reverse();
    }
    this.store();
  }

  deleteEffect(effectID: string) {
    const activeFile = this.files.filter(f => f.isActive)[0];
    if (activeFile) {
      const effect = activeFile.effects.filter(e => e.id === effectID)[0];

      if (effect) {

        for (const collection of activeFile.collections) {
          for (let i = collection.effects.length - 1; i >= 0; i-- ) {
            if (collection.effects[i].effectID === effectID) {
              collection.effects.splice(i, 1);
            }
          }
        }
        this.closeEffectTab(effectID);
        // const openTab = activeFile.configuration.openTabs.filter(t => t.id === effectID)[0];
        // if (openTab) {
        //   if (openTab.isActive) {
        //     activeFile.activeEffect = null;
        //     this.nodeService.reset();
        //   }
        //   const tabIndex = activeFile.configuration.openTabs.indexOf(openTab);
        //   activeFile.configuration.openTabs.splice(tabIndex, 1);
        // }
        if (effect.type === EffectType.midi) { // && effect.dataType === MidiDataType.notes
          if (effect.data && effect.data.length > 0) {
            for (const item of effect.data) {
              const openTabMidi = activeFile.configuration.openTabs.filter(t => t.id === item.effect.id)[0];

              if (openTabMidi) {

                this.closeEffectTab(item.effect.id)
              }
            }
          }
        }
        const effectIndex = activeFile.effects.indexOf(effect);
        activeFile.effects.splice(effectIndex, 1);

        if (!activeFile.activeEffect) {
          this.setAnyEffectActive();
        } else {
          this.store();
        }
      }
    }
  }

  add(file: File) {
    this.files.push(file);
    this.setActive(file);
    this.store();
  }

  getFileCount() {
    return this.files.length + 1;
  }

  updateActiveFile() {
    const activeFile = this.files.filter(f => f.isActive)[0];
    if (activeFile) {
      this.updateActiveEffectData(activeFile);
      activeFile.date.changed = true;
      this.store();
    }
  }

  update(file: File, changes = true) {
    // console.log('update');
    const originalFile = this.files.filter(f => f._id === file._id)[0];
    // console.log(file.collections, originalFile.collections);
    const index = this.files.indexOf(originalFile, 0);
    if (index > -1) {
      this.files[index] = this.cloneService.deepClone(file);
      this.updateActiveEffectData(this.files[index]);
      this.files[index].collections = this.cloneService.deepClone(file.collections);
      this.files[index].date.changed = changes;
      this.store();
    }
  }

  updateConfig(fileConfiguration: Configuration) {
    const activeFile = this.files.filter(f => f.isActive)[0];
    if (activeFile) {
      activeFile.configuration = this.cloneService.deepClone(fileConfiguration);
      this.store();
    }
  }

  get(id: string): File {
    return this.files.filter(f => f._id === id)[0];
  }

  store() {
    this.fileObservable.next(this.files);
    this.localSt.store('files', this.files);
    // console.log('store');
  }

  getActiveFile(): File {
    return this.files.filter(f => f.isActive)[0];
  }

  delete(file: File) {
    const index = this.files.indexOf(file, 0);
    if (index > -1) {
      this.files.splice(index, 1);
      if (this.files.length === 0) {
        this.createDefault('Untitled-1');
      }
    }
    if (file.isActive && this.files.length > 0) {
      this.files[this.files.length - 1].isActive = true;
    }
    this.historyService.clearHistoryFile(file._id);
    this.store();
  }

  getAll() {
    return this.files;
  }

  getDefault() {
    return this.files[0];
  }



  getAllFileData(): File {
    const currentactiveFile = this.files.filter(f => f.isActive)[0];
    if (currentactiveFile) {
      this.updateActiveEffectData(currentactiveFile);
    }
    this.store();
    return currentactiveFile;
  }

  getAllFileDataByID(id: string): File {
    const selectedFile = this.files.filter(f => f._id === id)[0];
    if (selectedFile) {
      if (selectedFile.isActive) {
        this.updateActiveEffectData(selectedFile);
      }
      this.store();
      return selectedFile;
    }
  }

  setActive(file: File) {
    // deactive current active file
    const currentactiveFile = this.files.filter(f => f.isActive)[0];
    if (currentactiveFile) {
      currentactiveFile.isActive = false;
      if (currentactiveFile.activeEffect !== null) {
        currentactiveFile.activeEffect.paths = this.nodeService.getAll();
        currentactiveFile.activeEffect.size = this.getPathEffectSize(currentactiveFile.activeEffect);
        let effect = currentactiveFile.effects.filter(e => e.id === currentactiveFile.activeEffect.id)[0];
        if (effect) {
          effect = JSON.stringify(currentactiveFile.activeEffect);
        }
      }
    }
    // activate new file
    const newactiveFile = this.files.filter(f => f._id === file._id)[0];
    newactiveFile.isActive = true;
    if (newactiveFile.activeEffect !== null) {
      this.nodeService.loadFile(newactiveFile.activeEffect.paths);
    }
    this.store();
  }



  setAnyActive() {
    const currentactiveFile = this.files.filter(f => f.isActive)[0];
    if (!currentactiveFile) {
      const newactiveFile = this.files[this.files.length - 1];
      newactiveFile.isActive = true;
      if (!newactiveFile.activeEffect && newactiveFile.effects.length > 0) {
        newactiveFile.activeEffect = this.setAnyEffectActive();
      }
      if (newactiveFile.activeEffect) {
        this.nodeService.loadFile(newactiveFile.activeEffect.paths);
      } else {
        this.nodeService.reset();
      }
      this.store();
    } else {
      if (!currentactiveFile.activeEffect && currentactiveFile.effects.length > 0) {
        currentactiveFile.activeEffect = this.setAnyEffectActive();
      }
      if (currentactiveFile.activeEffect) {
        this.nodeService.loadFile(currentactiveFile.activeEffect.paths);
      } else {
        this.nodeService.reset();
      }
    }
  }


  save(file: File, close = false) {
    if (file.isActive) {
      this.updateActiveEffectData(file);
    }
    this.store();
    if (file.path) {
      fetch(file.path).then((res) => {
        this.saveChangesToFile(file);
      }).catch((err) => {
        this.saveFileWithDialog(file);
      });
    } else {
      this.saveFileWithDialog(file);
    }

    if (close) {
      file.isActive = false;
      this.setAnyActive();
      this.delete(file);
    }
  }

  saveFileWithDialog(file: File) {
    const blob = new Blob([JSON.stringify(file)], { type: 'text/plain' });
    const currentFileName = file.name + '.feelix';
    this._FileSaverService.save(blob, currentFileName, 'text/plain');
    // this._FileSaverService.save(blob, file.name + '.json');
  }

  saveChangesToFile(file: File) {
    file.date.modified = new Date().getTime();
    file.date.changed = false;
    // if (file.isActive) {
    //   file.nodes = this.nodeService.getAll();
    // }
    this.store();
    // let blob = new Blob([JSON.stringify(file)], { type: "text/plain" });
    try {
      this.fs.writeFileSync(file.path, JSON.stringify(file), 'utf-8');
    } catch (e) {
      alert('Failed to save file data');
    }
  }

  parseFile(file: any) {
    return new Promise((resolve, reject) => {
      resolve(JSON.parse(file));
    });
  }

  deleteGuides(guides: Array<string>) {
    for (const guide of guides) {
      const activeFile = this.files.filter(f => f.isActive)[0];
      const gEl = activeFile.activeEffect.grid.guides.filter(g => g.id === guide)[0];
      if (gEl) {
        const index = activeFile.activeEffect.grid.guides.indexOf(gEl);
        if (index > -1) {
          activeFile.activeEffect.grid.guides.splice(index, 1);
        }
      }
    }
    this.store();
  }

  getGuidesWithinBox(box: any, guides: Array<any>, shift: boolean, alt: boolean) {
    const selectedGuides = [];
    for (const guide of guides) {
      if (guide.axis === 'y') {
        if (guide.coords.x > box.x1 && guide.coords.x < box.x2) {
          selectedGuides.push(guide.id);
        }
      } else if (guide.axis === 'x') {
        if (guide.coords.y > box.y1 && guide.coords.y < box.y2) {
          selectedGuides.push(guide.id);
        }
      }
    }
    return selectedGuides;
  }

  copyGuides(guides: Array<string>) {
    const activeFile = this.files.filter(f => f.isActive)[0];
    for (const guide of guides) {
      const gEl = activeFile.grid.guides.filter(g => g.id === guide)[0];
      if (gEl) {
        const copy = gEl;
        copy.id = uuid();
        activeFile.guides.push(copy);
      }
    }
    this.store();
  }



  updateUnits(oldUnits: any, newUnits: any, axis = 'x') {
    const activeFile = this.files.filter(f => f.isActive)[0];
    if (activeFile && activeFile.activeEffect) {
      activeFile.activeEffect.paths = this.nodeService.updateUnits(oldUnits.PR, newUnits.PR);
      activeFile.activeEffect.size = this.getPathEffectSize(activeFile.activeEffect);
      this.nodeService.loadFile(activeFile.activeEffect.paths);

    }
    if (axis === 'x') {
      activeFile.activeEffect.range.end = activeFile.activeEffect.range.end * (newUnits.PR / activeFile.activeEffect.grid.xUnit.PR);
      activeFile.activeEffect.range.start = activeFile.activeEffect.range.start * (newUnits.PR / activeFile.activeEffect.grid.xUnit.PR);

      activeFile.activeEffect.grid.settings.spacingX = activeFile.activeEffect.grid.settings.spacingX * (newUnits.PR / activeFile.activeEffect.grid.xUnit.PR);

      activeFile.activeEffect.grid.xUnit = newUnits;
    } else if (axis === 'y') {
      activeFile.activeEffect.range_y.end = activeFile.activeEffect.range_y.end * (newUnits.PR / activeFile.activeEffect.grid.yUnit.PR);
      activeFile.activeEffect.range_y.start = activeFile.activeEffect.range_y.start * (newUnits.PR / activeFile.activeEffect.grid.yUnit.PR);
      activeFile.activeEffect.grid.yUnit = newUnits;
    }
    this.nodeService.setGridLayer(activeFile.activeEffect.grid);
    let effect = activeFile.effects.filter(e => e.id === activeFile.activeEffect.id)[0];


    if (effect) {
      // activeFile.effects.filter(e => e.id === activeFile.activeEffect.id)[0] = this.cloneService.deepClone(activeFile.activeEffect);
      activeFile.effects.filter(e => e.id === activeFile.activeEffect.id)[0].range = this.cloneService.deepClone(activeFile.activeEffect.range);
      activeFile.effects.filter(e => e.id === activeFile.activeEffect.id)[0].paths = this.cloneService.deepClone(activeFile.activeEffect.paths);
      activeFile.effects.filter(e => e.id === activeFile.activeEffect.id)[0].size = this.cloneService.deepClone(activeFile.activeEffect.size);
      activeFile.effects.filter(e => e.id === activeFile.activeEffect.id)[0].grid = this.cloneService.deepClone(activeFile.activeEffect.grid);
      activeFile.effects.filter(e => e.id === activeFile.activeEffect.id)[0].date.modified = new Date().getTime();
    }
    this.store();
  }

}
