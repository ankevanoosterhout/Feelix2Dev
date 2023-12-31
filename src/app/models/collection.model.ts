import { EffectType } from './configuration.model';
import { SliderDrawplane } from './drawing-plane-config.model';
import { Details, Effect } from './effect.model';
import { MicroController, Unit } from './hardware.model';

export class Rotation {
  start = 0;
  end = 360;
  units = new Unit('deg', 360);
  linear = false;
  loop = false;
  start_y = -100;
  end_y = 100;
  units_y = new Unit('%', 100);
  constrain = false;
}

export enum scaleOption {
  scale50 = 0.5,
  scale75 = 0.75,
  scale100 = 1,
  scale125 = 1.25,
  scale150 = 1.5,
  scale250 = 2.5,
  scale500 = 5
};

export const ScaleLabelMapping: Record<scaleOption, string> = {
  [scaleOption.scale50]: '50%',
  [scaleOption.scale75]: '75%',
  [scaleOption.scale100]: '100%',
  [scaleOption.scale125]: '125%',
  [scaleOption.scale150]: '150%',
  [scaleOption.scale250]: '250%',
  [scaleOption.scale500]: '500%'
};



export class Scale {
  value: scaleOption = null;
  graphD3: any = null;

  constructor(value: scaleOption) {
    this.value = value;
  }
}

export class Config {
  scale = new Scale(scaleOption.scale100);
  zoom: any = null;
  yScale: any = null;
  xScale: any = null;
  newXscale: any = null;
  newYscale: any = null;
  xAxis: any = null;
  xAxisSmall: any = null;
  xAxisThicks: any = null;
  xAxisSmallThicks: any = null;
  slider = new SliderDrawplane();
  svg: any = null;
  midi = false;
  midiYscale: any = null;
  newMidiYscale: any = null;
}

export class Layer {
  name: string = null;
  visible = true;
  locked = false;

  constructor(name: string) {
    this.name = name;
  }
}

export class motorid {
  name: string = 'A';
  index: number = 0;
}

export class Collection {
  id: string = null;
  name: string = 'Sequence-1';
  effects: Array<Details> = [];
  midiEffects: Array<Details> = [];
  microcontroller: MicroController = null;
  motorID = new motorid();
  rotation = new Rotation();
  config = new Config();
  visualizationType: EffectType = EffectType.torque;
  layers = [ new Layer('CW'), new Layer('CCW') ];
  overlappingData = [];
  effectDataList = [];
  renderedData = [];
  playing = false;
  returnToStart = false;
  changedAfterRender = false;
  time = 0;
  feedbackData: Array<any> = [];

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}
