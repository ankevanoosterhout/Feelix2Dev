import { Dates } from './file.model';
import { Path } from './node.model';
import { EffectType } from './configuration.model';

export class Color {
  name = 'Light gray';
  hash = '#858585';

  constructor(name: string, hash: string) {
    this.name = name;
    this.hash = hash;
  }
}

export class RepeatInstance {
  id: string;
  x: number;
  constructor(id: string, x: number) {
    this.id = id;
    this.x = x;
  }
}

export class Repeat {
  instances = 1;
  repeatInstances: Array<RepeatInstance> = [];
}

export class GridSettings {
  spacingX = 20;
  spacingY = 20;
  subDivisionsX = 2;
  subDivisionsY = 2;
  color = new Color('Light gray', '#666666');
}

export class Unit {
  name: string;
  PR: number;

  constructor(name: string, PR: number) {
    this.name = name;
    this.PR = PR;
  }
}

export class Coords {
  x: number = 0;
  y: number = 0;
}

export class Guide {
  id: string = '';
  axis: string = '';
  coords = new Coords();
}

export class Grid {
  snap = false;
  visible = false;
  settings = new GridSettings();
  translation = 1.0;
  // units = new Unit('deg', 360);
  xUnit = new Unit('deg', 360);
  yUnit = new Unit('%', 100);
  guides: Array<Guide> = [];
  guidesVisible = true;
  lockGuides = false;
}

export class Range {
  start: number = 0;
  end: number = 360;

  constructor(start: number, end: number) {
    this.start = start;
    this.end = end;
  }
}

export class XY {
  x: any = null;
  y: any = null;
  uniform = false;

  constructor(x: any, y: any) {
    this.x = x;
    this.y = y;
  }
}

export class Size {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number = 0;
  bottom: number = 0;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

export class Direction {
  cw = true;
  ccw = true;
}


export class Details {
  id: string;
  name: string;
  effectID: string;
  direction = new Direction();
  scale = new XY(100,100);
  position = new Size(0,0,0,0);
  flip = new XY(false, false);
  repeat = new Repeat();
  infinite = false;
  quality = 1;
  xUnit: string;

  constructor(id: string, effectID: string, name: string, xUnit: string) {
    this.id = id;
    this.effectID = effectID;
    this.name = name;
    this.xUnit = xUnit;
  }
}


export class Effect {
  id: string;
  name: string = 'effect-1';
  date = new Dates(new Date().getTime());
  type: EffectType = EffectType.torque;
  paths: Array<Path> = [];
  grid = new Grid();
  scale: any = null;
  rotation = 'dependent';
  // colors: Array<Color> = [];
  range = new Range(0, 360);
  range_y = new Range(-100, 100);
  size = new Size(0,0,0,0);
  storedIn = 'file';

  constructor(id: string, type: EffectType) {
    this.id = id;
    this.type = type;
    if (type === EffectType.midi || type === EffectType.midiNote) {
      this.range_y = new Range(0, 128);
    }

    // this.colors.push(new Color('Blue', '#003fc1'));
    // this.colors.push(new Color('LightBlue', '#9bbef5'));
    this.date.created = new Date().getTime();
  }
}


export class LibraryEffect {
  id: string;
  effect: Effect;

  constructor(id: string, effect: Effect) {
    this.id = id;
    this.effect = effect;
  }
}
