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
  value: scaleOption = scaleOption.scale100;
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
  name: string = '';
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


export class MicrocontrollerUploadItem { 
  id: string; 
  mcu: string;
  motorID: string; 
  name: string; 
  time: number = 0; 
  type: EffectType;

  constructor(id: string, mcu: string, motorID: string, name: string, type: EffectType, time: number = 0) {
    this.id = id;
    this.mcu = mcu;
    this.motorID = motorID;
    this.name = name;
    this.type = type;
    this.time = time;
  }
}

export class Collection {
  id: string = '';
  name: string = 'Sequence-1';
  effects: Array<Details> = [];
  midiEffects: Array<Details> = [];
  microcontroller?: MicroController;
  motorID = new motorid();
  rotation = new Rotation();
  config = new Config();
  visualizationType: EffectType = EffectType.torque;
  layers = [ new Layer('CW'), new Layer('CCW') ];
  overlappingData: Array<any> = [];
  effectDataList: Array<any> = [];
  renderedData: Array<any> = [];
  playing = false;
  returnToStart = false;
  offsetAngle = 0;
  changedAfterRender = false;
  time = 0;
  feedbackData: Array<any> = [];


  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}
