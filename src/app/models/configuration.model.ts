import { InputColor } from "./tensorflow.model";

export enum EffectType {
  torque = 0,
  position = 1,
  velocity = 2,
  pneumatic = 3,
  midi = 4,
  midiNote = 5
};


export const EffectTypeLabelMapping: Record<EffectType, string> = {
  [EffectType.torque]: 'torque',
  [EffectType.position]: 'position',
  [EffectType.velocity]: 'velocity',
  [EffectType.pneumatic]: 'pneumatic',
  [EffectType.midi]: 'midi',
  [EffectType.midiNote]: 'midi note'
};


export class ScrollOffset {
  id: string = null;
  value = 0;

  constructor(id: string) {
    this.id = id;
  }
};

export class OpenTab {
  id: string = null;
  isActive = false;
  name: string = null;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
};

export class EffectTypeColor {
  type: EffectType;
  hash: Array<string>;


  constructor(type: EffectType, hash: Array<string>) {
    this.type = type;
    this.hash = hash;
  }
};

export class Configuration {
  horizontalScreenDivision = 35; //35
  verticalScreenDivision = 70; //70
  collectionDisplay = 'large';
  openTabs: Array<OpenTab> = [];
  rendered = false;
  libraryViewSettings = 'large-thumbnails';
  sortType = 'date-modified';
  sortDirection = 'first-last';
  colors: Array<EffectTypeColor> =
    [ new EffectTypeColor(EffectType.torque, ['#0f4d9d']),
      new EffectTypeColor(EffectType.velocity, ['#ed1a75']),
      new EffectTypeColor(EffectType.position, ['#d94313', '#d5afaf']),
      new EffectTypeColor(EffectType.pneumatic, ['#37DEF8']),
      new EffectTypeColor(EffectType.midi, ['#5993bd']),
      new EffectTypeColor(EffectType.midiNote, ['#0970ba']) ];

  colorList = [ new InputColor('pressure', '#43E6D5'),
                new InputColor('pressure-1', '#00AEEF'),
                new InputColor('pressure-2', '#E18257'),
                new InputColor('pressure-3', '#4390E6'),
                new InputColor('pressure-4', '#7778E0') ];
};
