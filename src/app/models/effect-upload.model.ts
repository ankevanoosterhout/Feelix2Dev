import { Collection } from './collection.model';
import { EffectType } from './configuration.model';
import { Details, Effect } from './effect.model';
import { MicroController, Motor } from './hardware.model';

export class Linear {
  Ymin: number = null;
  Ymax: number = null;
  Xmin: number = null;
  Xmax: number = null;
  dYdX: number = null;
}

// export class PID {
//   P: number;
//   I: number;
//   D: number;
// }



export class Model {
  identifier: string;
  value: any;

  constructor(identifier: string, value: any) {
    this.identifier = identifier;
    this.value = value;
  }
}

export class ConfigModel {
  serialPort: any;
  motors: Array<Motor>;
  vendor: string;
  updateSpeed: number;
  baudrate: number;
  collection: string;
  range: number;
  constrain_range: number;
  loop: number;
  motorID: string;


  constructor(collection: Collection, microcontroller: MicroController) {
    this.serialPort = microcontroller.serialPort;
    this.vendor = microcontroller.vendor;
    this.updateSpeed = microcontroller.updateSpeed;
    this.baudrate = microcontroller.baudrate;
    if (collection !== null) {
      this.motors = [ microcontroller.motors.filter(m => m.id === collection.motorID.name)[0] ];
      this.collection = collection.id;
      this.range = collection.rotation.end - collection.rotation.start;
      this.loop = collection.rotation.loop ? 1 : 0;
      if (collection.rotation.units.name === 'rad') {
        this.range *= (180 / Math.PI);
      } else if (collection.rotation.units.name === 'sec') {
        this.range *= 1000;
      }
      this.constrain_range = collection.rotation.constrain ? 1 : 0;
      this.motorID = collection.motorID.name;
    } else {
      this.motors = microcontroller.motors;
      this.motorID = microcontroller.motors[0].id;
    }
  }
}

export class EffectModel {
  id: string = null;
  motorID: string = null;
  position: Model = null;
  angle: Model = null;
  scale: Model = null;
  flip: Model = null;
  direction: Model = null;
  infinite: Model = null;
  repeat: Model = null;
  vis_type: Model = null;
  effect_type: Model = null;
  datasize: Model = null;
  pointer: number = null;
  quality: Model = null;
  midi_config: Model = null;

  constructor(collEffect: Details, effect: any, units: string, motorID: string) {

    this.id = effect.id;

    this.position = new Model('P',
    [ Math.round(collEffect.position.x) !== collEffect.position.x ? collEffect.position.x.toFixed(5) : collEffect.position.x,
      Math.round(collEffect.position.y) !== collEffect.position.y ? (collEffect.position.y / 100).toFixed(5) : (collEffect.position.y / 100) ]);

    this.angle = new Model('A', collEffect.position.width.toFixed(7));

    if (units === 'rad') {
      this.angle.value *= (180 / Math.PI);
      this.position.value[0] *= (180 / Math.PI);
    }
    if (units === 'sec') {
      this.angle.value *= 1000;
      this.position.value[0] *= 1000;
    }
    this.motorID = motorID;

    this.scale = new Model('S', [ Math.round(collEffect.scale.x) !== collEffect.scale.x ? (collEffect.scale.x / 100).toFixed(5) : (collEffect.scale.x / 100),
      Math.round(collEffect.scale.y) !== collEffect.scale.y ? (collEffect.scale.y / 100).toFixed(5) : (collEffect.scale.y / 100) ]);

    const middleLine = (((collEffect.position.top - collEffect.position.bottom) / 2 + collEffect.position.bottom) / 100) * (collEffect.scale.y / 100) + (collEffect.position.y / 100);
    this.flip = new Model('F', [ collEffect.flip.x ? 1 : 0, collEffect.flip.y ? 1 : 0, middleLine.toFixed(6) ]);

    this.direction = new Model('D', [ (collEffect.direction.cw ? 1 : 0), (collEffect.direction.ccw? 1 : 0) ]);

    this.infinite = new Model ('I', collEffect.infinite ? 1 : 0);

    this.datasize = new Model ('Z', (effect.type === EffectType.position ? effect.data.length * 2 : effect.data.length));

    if (effect.type === EffectType.torque) {
      this.vis_type = new Model('T', 0);
    } else if (effect.type === EffectType.position) {
      this.vis_type = new Model('T', 1);
    } else if (effect.type === EffectType.velocity || effect.type === EffectType.pneumatic) {
      if (effect.yUnit === 'deg') {
        this.vis_type = new Model('T', 3);
      } else {
        this.vis_type = new Model('T', 2);
      }
    } else if (effect.type === EffectType.midiNote) {
      this.midi_config = new Model('M', [effect.midi_config.channel, effect.midi_config.message_type, effect.midi_config.data1]);

    } else if (effect.type === EffectType.midi) {
      // config for midi effects here
    }

    this.quality = new Model('Q', collEffect.quality);

    this.effect_type = new Model('E', effect.rotation === 'dependent' ? 0 : 1);

    if (collEffect.repeat.repeatInstances.length > 0) {
      this.repeat = new Model('C', collEffect.repeat.repeatInstances);
    }
  }
}

export class DataModel {
  overlay: Array<any>;
  effectData: Array<any>;

  constructor(effectData: Array<any>, overlay: Array<any>) {
    this.effectData = effectData;
    this.overlay = overlay;
  }
}

export class FilterModel {
  filters: Array<any> = [];
  config: ConfigModel = null;
  vendor: string = null;

  constructor(filters: Array<any>, microcontroller: MicroController) {
    this.filters = filters;
    this.config = new ConfigModel(null, microcontroller);
    this.vendor = microcontroller.vendor;
  }
}


export class UploadModel {
  effects: Array<EffectModel> = [];
  config: ConfigModel = null;
  vendor: string = null;
  data: DataModel = null;
  newMCU = true;
  returnToStart: number = null;
  run: number = 0;

  constructor(collection: Collection, microcontroller: MicroController) {
    if (collection) {
      for (const collEffect of collection.effects) {
        const effectData = collection.effectDataList.filter(e => e.id === collEffect.effectID)[0];
        if (effectData && effectData.data.length > 0) {
          const effectModel = new EffectModel(collEffect, effectData, collection.rotation.units.name, collection.motorID.name);
          this.effects.push(effectModel);
        }
      }
      this.data = new DataModel(collection.effectDataList, collection.renderedData);

      // get startposition of velocity sequence (angle)
      if (collection.visualizationType < 2) {
        this.run = 1;
      }
      if (collection.returnToStart) {
        let firstItem = collection.effects[0];
        for (const item of collection.effects) {
          if (item.position.x < firstItem.position.x) {
            firstItem = item;
          }
        }
        if (firstItem) {
          const effectDataFirstItem = collection.effectDataList.filter(e => e.id === firstItem.effectID)[0];
          this.returnToStart = (effectDataFirstItem.data[0].y * 100) * (Math.PI / 180);
          // console.log(firstItem, this.returnToStart, effectDataFirstItem);
        }
      }
    }

    this.config = new ConfigModel(collection, microcontroller);

    this.vendor = microcontroller.vendor;
  }
}

// TODO: Revise this section
export class ConfigModel_TT {
  serialPort: any;
  motors: Array<Motor>;
  vendor: string;
  updateSpeed: number;
  baudrate: number;
  motorID: string;

  constructor(microcontroller: MicroController) {
    this.serialPort = microcontroller.serialPort;
    this.vendor = microcontroller.vendor;
    this.updateSpeed = microcontroller.updateSpeed;
    this.baudrate = microcontroller.baudrate;
    this.motors = [microcontroller.motors[0]];
    this.motorID = microcontroller.motors[0].id;
  }
}


export class UploadModel_TT {
  message = '';
  config: ConfigModel_TT = null;
  vendor: string = null;
  newMCU = true;

  constructor(message: string, microcontroller: MicroController) {

    this.message = message;

    this.config = new ConfigModel_TT(microcontroller);

    this.vendor = microcontroller.vendor;
  }
}



export class UploadStringModel {
  config: ConfigModel = null;
  vendor: string = null;
  dataString: string;

  constructor(microcontroller: MicroController, dataStr: string) {
    this.dataString = dataStr;
    this.config = new ConfigModel(null, microcontroller);
  }
}




export class ConnectModel {

  config: ConfigModel = null;
  vendor: string = null;

  constructor(microcontroller: MicroController) {

    this.config = new ConfigModel(null, microcontroller);
    this.vendor = microcontroller.vendor;
  }
}


