import { Component, OnInit, Inject, AfterViewInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { v4 as uuid } from 'uuid';

import { ElectronService } from '../../../services/electron.service';
import { EffectLibraryService } from '../../../services/effect-library.service';
import { EffectVisualizationService } from '../../../services/effect-visualization.service';
import { DrawingService } from '../../../services/drawing.service';
import { FileService } from '../../../services/file.service';
import { Effect, RepeatInstance } from '../../../models/effect.model';
import { CloneService } from '../../../services/clone.service';
import { EffectTypeLabelMapping } from '../../../models/configuration.model';


@Component({
    selector: 'app-effects',
    standalone: true,
    imports: [ CommonModule, FormsModule ],
    templateUrl: './effects.component.html',
    styleUrls: ['./effects.component.css'],
})
export class EffectsComponent implements OnInit, AfterViewInit {
  activeTab = 0;

  activeEffectDetails = null;
  transformVisible = true;
  positionVisible = true;
  detailsVisible = true;
  repeatVisible = false;
  reflectVisible = false;
  qualityVisible = false;

  effect?: Effect;

  inLibrary = false;

  public EffectTypeLabelMapping = EffectTypeLabelMapping;

  tabs = [ { id: 0, name: 'Effects', selected: true, disabled: false },
           { id: 1, name: 'Global Library', selected: false, disabled: false  },
           { id: 2, name: 'Effect Details', selected: false, disabled: false  } ];
          //  {id: 3, name: 'TorqueTuner', selected: false, disabled: false } ];

  buttons = [ { name: 'add', icon: '../../src/assets/icons/buttons/add.svg' },
              { name: 'remove', icon: '../../src/assets/icons/buttons/bin.svg' }];

  // directionOptions = [
  //   { name: 'clockwise', val: 'cw' },
  //   { name: 'counterclockwise',  val: 'ccw' }
  // ];

  displayOptions = [
    { name: 'list', src: '../../../src/assets/icons/buttons/list.svg', slug: 'list', selected: false },
    { name: 'small thumbnails', src: '../../../src/assets/icons/buttons/small-thumbnail.svg', slug: 'small-thumbnails', selected: false },
    { name: 'large thumbnails', src: '../../../src/assets/icons/buttons/large-thumbnail.svg', slug: 'large-thumbnails', selected: true }
  ];

  sortOptions = [
    { name: 'name', slug: 'name' },
    { name: 'type', slug: 'type' },
    { name: 'date modified', slug: 'date-modified' },
    { name: 'date created', slug: 'date-created' }
  ]

  // DVs = [
  //   { name: 'position', val: null },
  //   { name: 'force intensity', val: null },
  //   { name: 'force direction',  val: null },
  //   { name: 'scale', val: null },
  // ];

  // IVs = [
  //   { name: 'time', val: null },
  //   { name: 'speed', val: null },
  //   { name: 'relative position',  val: null },
  // ];

  qualityOptions = [
    { level: 0, name: 'low', division: 8 },
    { level: 1, name: 'normal', division: 4 },
    { level: 2, name: 'high', division: 2 },
    { level: 3, name: 'maximum', division: 1 }
  ];

  // repeatOptions = ['position', 'time'];

  // tslint:disable-next-line: variable-name
  constructor(@Inject(DOCUMENT) private document: Document, private electronService: ElectronService, public effectLibraryService: EffectLibraryService,
              private effectVisualizationService: EffectVisualizationService, public drawingService: DrawingService,
              private fileService: FileService, private cloneService: CloneService) {


    this.drawingService.drawEffectsInLibrary.subscribe(res => {
      if (this.activeTab === 0) {
        this.drawFileEffects();
      } else if (this.activeTab === 1) {
        this.drawLibraryEffects();
      } else if (this.activeTab === 2) {
        const activeEffect = this.drawingService.file.activeCollectionEffect;
        if (activeEffect) this.effect = this.drawingService.file.effects.filter(e => e.id === activeEffect.effectID)[0];
      }
    });

    this.effectLibraryService.showLibraryTab.subscribe(res => {
      this.selectTab(1);
    });

  }

  ngOnInit(): void {
    this.document.body.classList.add('disable-scroll-body');

    // if (this.electronService.isElectronApp) {
    //   this.electronService.ipcRenderer.send('getEffects');
    // }
  }

  ngAfterViewInit(): void {
    this.drawScrollbar();
    this.drawFileEffects();
  }

  public dragstart(item: any) {
    this.drawingService.setTmpEffect(item);
    const overEffectItem = this.document.getElementById('overlayEffect-' + item.id);
    if (overEffectItem) overEffectItem.classList.add('dragging');
  }

  public dragend(item: any) {
    this.document.getElementById('overlayEffect-' + item.id)?.classList.remove('dragging');
    this.drawingService.config.tmpEffect = null;
  }


  drawScrollbar() {
    const innerObj = this.document.getElementById('inner');
    const outerObj = this.document.getElementById('outer');
    const inner = innerObj ? parseInt(innerObj.style.height, 10) : 0;
    const outer = outerObj ? parseInt(outerObj.style.height, 10) : 0;

    if (inner + 5 > outer) {
      const ratio = (outer / (inner + 5));
      const handleObj = this.document.getElementById('handle'); 
      if (handleObj) handleObj.style.height = (ratio * outer) + 'px';
    }
  }


  selectTab(id: number) {
    for (const tab of this.tabs) {
      if (tab.id !== id) {
        tab.selected = false;
      } else {
        this.activeTab = id;
        tab.selected = true;
      }
    }
    if (this.activeTab === 0) {
      this.drawFileEffects();
    } else if (this.activeTab === 1) {
      this.drawLibraryEffects();
    } else if (this.activeTab === 2) {
      const activeEffectID = this.drawingService.file.activeCollectionEffect?.effectID;
      if (activeEffectID) this.effect = this.drawingService.file.effects.filter(e => e.id === activeEffectID)[0];
    }
  }


  drawEffects(effects: any, type: string) {
    for (const el of effects) {
      const div = this.document.getElementById('effectSVG-' + (type === 'library' ? el.effect.id : el.id));
      if (div) {
        this.effectVisualizationService.drawEffect((type === 'library' ? el.effect : el), this.drawingService.file.configuration.colors, this.drawingService.file.configuration.libraryViewSettings);
      }
    }
  }


  drawLibraryEffects() {
    this.effectLibraryService.getEffectsFromLocalStorage();
    setTimeout(() => { this.drawEffects(this.effectLibraryService.effectLibrary, 'library'); }, 100);
  }

  drawFileEffects() {
    setTimeout(() => { this.drawEffects(this.drawingService.file.effects, 'file'); }, 100);
  }

  changeQuality(effect: any) {
    const qualityLevel = effect.details.quality.level;
    const quality = this.qualityOptions.filter(q => q.level === qualityLevel)[0];
    effect.details.quality = quality;
  }

  updateVariableValue(effect: any, value: any) {
    effect.details.parameter.value = value;
  }

  updateCollectionEffect() {
    this.fileService.updateCollectionEffect(
      this.drawingService.file.activeCollection,
      this.drawingService.file.activeCollectionEffect);
  }


  updateLibEffectName(effect: any) {
    let fileEffect = this.effectLibraryService.getEffect(effect.id);
    if (fileEffect) {
      fileEffect.effect.name = effect.name;
      const openTab = this.drawingService.file.configuration.openTabs.filter(t => t.id === effect.id)[0];
      if (openTab) { openTab.name = effect.name; }
    }
    this.sortItemsEffectList();
  }

  updateEffectName(effect: any) {
    let fileEffect = this.drawingService.file.effects.filter(e => e.id === effect.id)[0];
    if (fileEffect) {
      fileEffect.name = effect.name;
      const openTab = this.drawingService.file.configuration.openTabs.filter(t => t.id === effect.id)[0];
      if (openTab) { openTab.name = effect.name; }
    }
  }

  repeatEffect(effect: any) {
    if (effect.details.repeat.instances > 20) { effect.details.repeat.instances = 20; }
  }

  editEffectItem(effectID: string) {
    const fileEffect = this.drawingService.file.effects.filter(e => e.id === effectID)[0];
    this.fileService.openEffect(effectID);
    this.electronService.ipcRenderer.send('updateToolbar', { type: fileEffect.type });
  }

  exportEffectItem(effectID: string) {
    let effect = this.drawingService.file.effects.filter(e => e.id === effectID)[0];
    if (effect) {
      this.electronService.ipcRenderer.send('export', { effect: effect });
    }
  }

  importLibraryEffectItem(libEffectID:string) {
    const item = this.effectLibraryService.getEffect(libEffectID);
    if (item) {
      const copyEffect = this.cloneService.deepClone(item.effect);
      copyEffect.storedIn = 'file';
      copyEffect.id = uuid();
      copyEffect.date.modified = new Date().getTime();
      this.drawingService.file.effects.push(copyEffect);
      this.sortItemsEffectList();
      this.selectTab(0);
    }
  }

  deleteEffectItem(effectID: string) {
    for (const collection of this.drawingService.file.collections) {
      if (collection.effects.filter(e => e.effectID === effectID).length > 0) {
        this.drawingService.showMessageDialog({ msg: 'This effect is currently in use, are you sure you want to delete it?', type: 'verification', action: 'deleteEffect', d: effectID });
        return;
      }
    }
    this.fileService.deleteEffect(effectID);
  }

  exportLibEffectItem(libEffectID: string) {
    const item = this.effectLibraryService.getEffect(libEffectID);
    if (item) {
      this.electronService.ipcRenderer.send('export', { effect: item.effect });
    }
  }

  deleteLibraryItem(libEffectID: string) {
    this.effectLibraryService.deleteEffect(libEffectID);
    this.drawLibraryEffects();
  }

  editLibraryEffectItem(libEffectID: string) {
    const item = this.effectLibraryService.getEffect(libEffectID);

    if (item) {
      const copyItem = this.cloneService.deepClone(item);
      copyItem.effect.name += '-copy';
      copyItem.effect.id = uuid();
      copyItem.effect.date.modified = new Date().getTime();
      this.fileService.addEffect(copyItem.effect);
    }
  }

  compareSlug(unit1: any, unit2: any) {
    return unit1 && unit2 ? unit1.slug === unit2.slug : unit1 === unit2;
  }

  display(view: string) {
    this.drawingService.file.configuration.libraryViewSettings = view;
    this.fileService.updateConfig(this.drawingService.file.configuration);
  }


  updateValue(id: string) {
    let valueStr = (this.document.getElementById(id) as HTMLInputElement).value;
    const activeEffect = this.drawingService.file.activeCollectionEffect;

    if (valueStr !== undefined && activeEffect !== undefined) {
      let value = parseFloat(valueStr);
      
      if (id === 'position-x') {
        activeEffect.position.x = value;
      } else if (id === 'position-y') {
        activeEffect.position.y = value;
      } else if (id === 'position-width') {
        if (value > 0.0) {
          const newXscale = this.updateScale(activeEffect.position.width, value, activeEffect.scale.x);
          activeEffect.position.width = value;
          activeEffect.scale.x = newXscale;
        }
      } else if (id === 'position-height') {
        if (value > 0.0) {
          const newYscale = this.updateScale(activeEffect.position.height, value, activeEffect.scale.y);
          activeEffect.position.height = value;
          activeEffect.scale.y = newYscale;
        }
      } else if (id === 'scale-x') {
        this.updateEffectWidth(value);
      } else if (id === 'scale-y') {
        this.updateEffectHeight(value);

      } else if (id === 'scale') {
        this.updateEffectWidth(value);
        this.updateEffectHeight(value);
      }
      (this.document.getElementById(id) as HTMLInputElement).value = value.toFixed(2).toString();
    }
    this.updateCollectionEffect();
  }

  updateEffectWidth(value: number) {
    if (value > 0) {
      const activeEffect = this.drawingService.file.activeCollectionEffect;

      if (activeEffect !== undefined) {
        const newWidth = this.updateScale(activeEffect.scale.x, value, activeEffect.position.width);
        activeEffect.position.width = newWidth;
        activeEffect.scale.x = value;
      }
    }
  }

  updateEffectHeight(value: number) {
    if (value > 0) {
      const activeEffect = this.drawingService.file.activeCollectionEffect;

      if (activeEffect !== undefined) {
        const newHeight = this.updateScale(activeEffect.scale.y, value, activeEffect.position.height);
        activeEffect.position.height = newHeight;
        activeEffect.scale.y = value;
      }
    }
  }

  updateScale(old1: number, new1:number, old2:number) {
    return (old2 / old1) * new1;
  }

  updateUniformResize() {
    const activeEffect = this.drawingService.file.activeCollectionEffect;

    if (activeEffect !== undefined && activeEffect.scale.uniform) {
      if (activeEffect.scale.x !== activeEffect.scale.y) {
        this.updateEffectHeight(activeEffect.scale.x);
      }
    }
    this.updateCollectionEffect();
  }

  showCompleteValue(id: string | undefined = undefined) {
    const activeEffect = this.drawingService.file.activeCollectionEffect;
    
    if (activeEffect !== undefined && id !== undefined) {
      if (id === 'position-x') {
        (this.document.getElementById(id) as HTMLInputElement).value = activeEffect.position.x.toString();
      } else if (id === 'position-y') {
        (this.document.getElementById(id) as HTMLInputElement).value = activeEffect.position.y.toString();
      } else if (id === 'scale' || id === 'scale-x') {
        (this.document.getElementById(id) as HTMLInputElement).value = activeEffect.scale.x.toString();
      } else if (id === 'scale-y') {
        (this.document.getElementById(id) as HTMLInputElement).value = activeEffect.scale.y.toString();
      } else if (id === 'position-width') {
        (this.document.getElementById(id) as HTMLInputElement).value = activeEffect.position.width.toString();
      } else if (id === 'position-height') {
        (this.document.getElementById(id) as HTMLInputElement).value = activeEffect.position.height.toString();
      }
    }
    this.drawingService.setInputFieldsActive(true);
  }

  hideCompleteValue(id: string | undefined = undefined) {
    if (id !== undefined) {
      let value = parseFloat((this.document.getElementById(id) as HTMLInputElement).value);
      if (value) {
        let decimals = this.countDecimals(value);
        if (decimals > 3) { decimals = 3; }
        if (decimals < 2) { decimals = 2; }
        (this.document.getElementById(id) as HTMLInputElement).value = value.toFixed(decimals).toString();
      }
    }
    this.drawingService.setInputFieldsActive(false);
  }

  updateEffectRepeat() {
    const activeEffect = this.drawingService.file.activeCollectionEffect;

    if (activeEffect !== undefined) { 
      const newN = activeEffect.repeat.instances;
      const oldN = activeEffect.repeat.repeatInstances.length + 1;
      if (newN > 0) {
        const difference = newN - oldN;
        if (difference > 0) {
          for (let i = oldN; i < difference + oldN; i++) {
            const position = activeEffect.position.x + (activeEffect.position.width * i);
            const newInstance = new RepeatInstance(uuid(), position);
            activeEffect.repeat.repeatInstances.push(newInstance);
          }
        } else if (difference < 0) {
          for (let b = difference; b < 0; b++) {
            if (activeEffect.repeat.repeatInstances.length > 0) {
              activeEffect.repeat.repeatInstances.pop();
            }
          }
        }
      } else {
        activeEffect.repeat.instances = oldN;
      }
      this.updateCollectionEffect();
    }
  }

  updateRepeatInstanceXValue(id: string) {
    const activeEffect = this.drawingService.file.activeCollectionEffect;
    const value = (this.document.getElementById('r-' + id) as HTMLInputElement).value;

    if (activeEffect !== undefined) {
      activeEffect.repeat.repeatInstances.filter(r => r.id === id)[0].x = parseFloat(value);
      this.updateCollectionEffect();
    }
  }

  countDecimals(value: number) {
    if(Math.floor(value) === value) return 0;
    return value.toString().split('.').length > 1 && value.toString().split('.')[1].length || 0;
  }

  updateQuality() {
    const activeCollection = this.drawingService.file.activeCollection;
    const activeEffect = this.drawingService.file.activeCollectionEffect;
    
    if (activeCollection !== undefined && activeEffect !== undefined) {
      if (activeEffect.quality < 1) {
        activeEffect.quality = 1;
      } else {
        activeEffect.quality = Math.round(activeEffect.quality);
      }
      for (const collEffect of activeCollection.effects) {
        if (collEffect.effectID === activeEffect.effectID) {
          collEffect.quality = activeEffect.quality;
        }
      }
      if (activeCollection.effectDataList.length > 0) {
        const renderObj = this.document.getElementById('render-' + activeCollection.id);
        if (renderObj) {
          renderObj.click();
          renderObj.click();
        }
      }

      this.fileService.updateCollection(activeCollection);
    }
  }


  sortItemsEffectList() {
    this.fileService.sortEffects(this.drawingService.file.configuration.sortType);
  }

  sortItems() {
    this.effectLibraryService.sortLibraryEffectsBy(this.drawingService.file.configuration.sortType, this.drawingService.file.configuration.sortDirection);
    this.sortItemsEffectList();
  }

  toggleSortDirection() {
    this.drawingService.file.configuration.sortDirection = this.drawingService.file.configuration.sortDirection === 'first-last' ? 'last-first' : 'first-last';
    this.sortItems();
  }
}
