import { MagneticSensor } from './position-sensors.model';

export enum SensorCommunication {
  SPI = 0,
  I2C = 1
}

export const SensorCommunicationMapping: Record<SensorCommunication, string> = {
  [SensorCommunication.SPI]: 'SPI',
  [SensorCommunication.I2C]: 'I2C',
};

export enum ActuatorType {
  bldc = 0,
  stepper = 1,
  pneumatic = 2,
  torquetuner = 3
};

export const ActuatorLabelMapping: Record<ActuatorType, string> = {
  [ActuatorType.bldc]: 'BLDC Motor',
  [ActuatorType.stepper]: 'Stepper Motor',
  [ActuatorType.pneumatic]: 'Pneumatic Actuator',
  [ActuatorType.torquetuner]: 'TorqueTuner'
};

export class TorqueTunerConfig {
  min_angle: number = 0;
  max_angle: number = 3600;
  scale: number = 90;
  stretch: number = 1;
  damping: number = 0.17;
  default_velocity: number = 0;
}

export class Unit {
  name = '4096PPR'; //Pulses per revolution
  PR = 4096;

  constructor(name = '4096PPR', PR = 4096) {
    this.name = name;
    this.PR = PR;
  }
}

export class Quality {
  level = 1;
  name = 'normal';
  division = 4;
}

export class Calibration {
  value = 0.0;
  direction: string = null;
  xStartPos = 0.0;
}

export class Position {
  start = 0.0;
  end = 0.0;
  current = 0;
}

export class Radial {
  value = 4096;
  unit = new Unit('PPR', 4096);
}

export class Linear {
  value = 5;
  unit = new Unit('cm', 5);
}

export class Translation {
  radial = new Radial();
  linear = new Linear();
}

export class Rotation {
  linear = false;
  translation = new Translation();
}

export class PID {
  p: number = null;
  i: number = null;
  d: number = null;
  Tf: number = null;
  output_ramp: number = null;

  constructor(p: number, i: number, d: number, Tf: number = null, output_ramp: number = null) {
    this.p = p;
    this.i = i;
    this.d = d;
    this.Tf = Tf;
    this.output_ramp = output_ramp;
  }
}

export class CurrentSense {
  name: string;
  value: number;

  constructor(name: string, value: number) {
    this.name = name;
    this.value = value;
  }
}


export class Config {
  supplyVoltage: number = 12;
}

export class BLDCConfig extends Config {
  polepairs: number = 7;
  phaseResistance: number = 15.2;
  voltageLimit: number = 12;
  velocityLimit: number = 21;
  inlineCurrentSensing = false;
  encoderType: string = 'Magnetic sensor';
  encoder: any = new MagneticSensor();
  sensorOffset = 0.0;
  calibration = new Calibration();
  rotation = new Rotation();
  transmission = 1;
  frequency = 50000;
  current_sense = [ new CurrentSense('a', 0.0), new CurrentSense('b', 0.0) ];
  current_sense_calibration: number;
  overheatProtection = false;
  output_ramp_angle = 10000;
  output_ramp_velocity = 1000;
  position_pid = new PID(20.0, 0.0, 0.0, 0, 1000);
  velocity_pid = new PID(0.5, 10, .001, 0.01, 1000);
}

export class minMax {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }
}

export class PneuConfig extends Config {
  pressureLimit: number = 1;
  sensorAddress: number = 0x28;
  sensorCSS: number = 10;
  nrOfSensors: number = 1;
  sensorCommunication: SensorCommunication = SensorCommunication.I2C;
  pin: number = 2;
  in: number = 3;
  closedLoop = true;
  inflate_pid = new PID(0.5, 10.0, 0.0, 0.01, 1000);
  deflate_pid = new PID(0.5, 10.0, 0.0, 0.01, 1000);
  inflate_valve = new minMax(185, 250);
  deflate_valve = new minMax(185, 250);
}

export class StepperConfig extends Config { //update config details for stepper motorsvelocity_pid
  voltageLimit: number = 12;
  velocityLimit: number = 21;
  encoderType: string = 'Magnetic sensor';
  encoder: any = new MagneticSensor();
  sensorOffset = 0.0;
  calibration = new Calibration();
  rotation = new Rotation();
  transmission = 1;
  frequency = 50000;
  position_pid = new PID(20.0, 0.0, 0.0, 0);
  velocity_pid = new PID(0.5, 10, .001, 0.01);
}

export class State {
  speed = 0;
  direction = 1;
  position = new Position();
  sleep = false;
  target = 0;
  pressure = 0;
}

export class Motor {
  id: string = null;
  type: ActuatorType;
  config: any;
  state = new State();
  record = false;
  visible = true;
  I2C_address: any;
  I2C_communication = 0;

  constructor(id: number, type: ActuatorType, i2cComm = 0) {
    this.id = (id + 10).toString(16).toUpperCase();
    this.I2C_address = '0x' + this.id;
    this.I2C_communication = i2cComm;
    this.type = type;

    if (this.type === ActuatorType.bldc) {
      this.config = new BLDCConfig();
    } else if (this.type === ActuatorType.stepper) {
      this.config = new StepperConfig();
    } else if (this.type === ActuatorType.pneumatic) {
      this.config = new PneuConfig();
      this.config.pin = id + 2;
    } else if (this.type === ActuatorType.torquetuner){
      this.config = new TorqueTunerConfig();
    }
  }
}


export class OtherDevices {
  serialPort: any = null;
  speed = false;
  position = false;
  direction = false;
  updateSpeed = 100;
  intervalFunction: any = null;

  constructor(serialPort: any) {
    this.serialPort = serialPort;
  }
}


export class MicroController {
  id: string = null;
  serialPort: any = null;
  name: string = null;
  vendor: string = null;
  motors = [ new Motor(0, ActuatorType.bldc, 1) ];
  storageSpace: number = null;
  connected = false;
  playing = false;
  selected = false;
  lastDataSend: number = null;
  updateSpeed = 20;
  baudrate = 115200;
  dataToOtherDevices: Array<any> = [];
  record = false;

  constructor(id: string, serialPort: any, vendor: string) {
    this.id = id;
    this.serialPort = serialPort;
    this.vendor = vendor;
    if (this.vendor === 'STM32') {
      this.updateSpeed = 150;
    }
    this.lastDataSend = new Date().getTime();
    this.name = serialPort.path + '-' + vendor;
  }
}


export class ConnectedDevice {
  id: string = null;
  name: string = null;
  serialPort: any = null;
  connected = true;
  lastDataSend: number = null;
  lastDataReceived: number = null;
  dataSendSpeed = 50;
  baudrate = 115200;

  constructor(id: string, serialPort: any, name: string) {
    this.id = id;
    this.serialPort = serialPort.port;
    this.baudrate = serialPort.baudrate;
    this.name = name;
    this.lastDataSend = new Date().getTime();
    this.lastDataReceived = new Date().getTime();
  }
}
