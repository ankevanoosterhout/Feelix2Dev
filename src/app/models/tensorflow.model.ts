import { Filter } from "./filter.model";
import * as tf from '@tensorflow/tfjs';
import { MicroController } from "./hardware.model";
import { Dates } from "./file.model";

export enum Activation {
  elu = 'elu',
  hardSigmoid = 'hardSigmoid',
  linear = 'linear',
  relu = 'relu',
  relu6 = 'relu6',
  selu = 'selu',
  sigmoid = 'sigmoid',
  softmax = 'softmax',
  softplus = 'softplus',
  softsign = 'softsign',
  tanh = 'tanh',
  swish = 'swish',
  mish = 'mish'
};

export const ActivationLabelMapping: Record<Activation, string> = {
  [Activation.elu]: 'elu',
  [Activation.hardSigmoid]: 'hardSigmoid',
  [Activation.linear]: 'linear',
  [Activation.relu]: 'relu',
  [Activation.relu6]: 'relu6',
  [Activation.selu]: 'selu',
  [Activation.sigmoid]: 'sigmoid',
  [Activation.softmax]: 'softmax',
  [Activation.softplus]: 'softplus',
  [Activation.softsign]: 'softsign',
  [Activation.tanh]: 'tahn',
  [Activation.swish]: 'swish',
  [Activation.mish]: 'mish'
};


export enum Initializer {
  constant = 'constant',
  glorotNormal = 'glorotNormal',
  glorotUniform = 'glorotUniform',
  heNormal = 'heNormal',
  heUniform = 'heUniform',
  identity = 'identity',
  leCunNormal = 'leCunNormal',
  leCunUniform = 'leCunUniform',
  ones = 'ones',
  orthogonal = 'orthogonal',
  randomNormal = 'randomNormal',
  randomUniform = 'randomUniform',
  truncatedNormal = 'truncatedNormal',
  varianceScaling = 'varianceScaling',
  zeros = 'zeros'
}


export enum ModelType {
  neuralNetwork = 0,
  regression = 1,
  RNN = 2,
  LSTM = 3,
  GRU = 4
};

export const ModelTypeMapping: Record<ModelType, string> = {
  [ModelType.neuralNetwork]: 'NeuralNetwork',
  [ModelType.regression]: 'Regression',
  [ModelType.RNN]: 'SimpleRNN',
  [ModelType.LSTM]: 'LSTM',
  [ModelType.GRU]: 'GRU'
};



export class Input {
  id: String;
  name: String;
  active = true;

  constructor(id: String, name: String) {
    this.id = id;
    this.name = name;
  }
}

export class ModelVariable {
  name: string;
  active: boolean;
  color: string;
  visible = false;
  slug: string;

  constructor(name: string, active: boolean, visible: boolean, color: string, slug: string) {
    this.name = name;
    this.active = active;
    this.visible = visible;
    this.color = color;
    this.slug = slug;
  }
}

export class Label {
  id: string;
  name: string;
  confidence: number;
  prediction: number;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}


export class Classifier  {
  id: string;
  name: string;
  labels: Array<Label> = [];
  open = false;
  active = false;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}



export class Options {
  layerName: string;
  inputs: Array<any> = [];
  outputs: Array<any> = [];
  inputDim: Array<any>; // Defines input shape as [inputDim].
  optimizer: any = { name:'sgd', value: tf.train.sgd };
  learningRate: number = 0.1;
  batchNormalization: boolean = true;
  kernelInitializer: any; // The convolutional kernel weights matrix’s initializer.
  biasInitializer: any; //The bias vector’s initializer.
  kernelRegularizer = { name:'l2', regularizer: tf.regularizers.l2(), config: { l2: 0.01 } };
  kernelConstraint: any; //The constraint for the convolutional kernel weights.
  biasConstraint: any; //The constraint for the bias vector.
  dropout: number = 0.2; // between 0 and 1
  useBias: boolean = true;
  weights: Array<number>;
  // debug: boolean = false; // determines whether or not to show the training visualization
}


export class TrainingOptions {
  epochs: number = 100;
  batchSize: number = 32;
}

export class NN_options extends Options {
  hiddenLayers: number = 2;
  units: number = 4;
  activation: Activation = Activation.relu;
  activationOutputLayer: Activation = Activation.softmax;
  activityRegularizer: any;
  metrics: any = { name:'categoricalAccuracy', value: tf.metrics.categoricalAccuracy };
  trainingOptions = new TrainingOptions();
  losses: any = { name:'categoricalCrossentropy', value: tf.metrics.categoricalCrossentropy };
  momentum = 10;
  batchInputShape: any;
}

export class RegressionOptions extends Options {
  degree: number = 1;
  losses: any = tf.metrics.meanSquaredError;
}

export class simpleRNN_options extends Options {
  returnSequences: boolean = true; //Whether the final output in the output series should be returned, or the entire sequence should be returned.
  returnState: boolean = false; // Whether or not the last state should be returned along with the output.
  goBackwards: boolean = false; //If this is true, process the input sequence backward and return the reversed sequence.
  stateful: boolean = false; //If true, the final state of each sample at index I in a batch will be used as the beginning state of the next batch’s sample at index i
  unroll: boolean = false; // The network will be unrolled if true; else, a symbolic loop will be utilized. Although unrolling can speed up an RNN, it is more memory-intensive. Only short sequences are acceptable for unrolling
  inputLength: number = 10; //When the length of the input sequences is constant, it must be given. If you want to link Flatten and Dense layers upstream, you’ll need this parameter
  recurrentInitializer: any; //The recurrentKernel weights matrix’s initializer. It is used for the linear transformation of the recurrent state.
  recurrentRegularizer: any; //The regularizer function applied to the recurrentKernel weights matrix.
  biasRegularizer: any; // The regularizer function applied to the bias vector.
  recurrentConstraint: any; // The constraint for the recurrentKernel weights.
  recurrentDropout: number = 0; //between 0 - 1
  cell: any; //A RNN cell instance.

}

export class LSTM_options extends Options {
  recurrentActivation: Activation = Activation.hardSigmoid;
  returnSequences: boolean = true; //Whether the final output in the output series should be returned, or the entire sequence should be returned.
  returnState: boolean = false; // Whether or not the last state should be returned along with the output.
  goBackwards: boolean = false; //If this is true, process the input sequence backward and return the reversed sequence.
  stateful: boolean = false; //If true, the final state of each sample at index I in a batch will be used as the beginning state of the next batch’s sample at index i
  unroll: boolean = false; // The network will be unrolled if true; else, a symbolic loop will be utilized. Although unrolling can speed up an RNN, it is more memory-intensive. Only short sequences are acceptable for unrolling
  unitForgetBias: boolean = false;
  implementation: number = 1; //  It specifies the implementation mode. It can be either 1 or 2. For superior performance, implementation is recommended.
  recurrentInitializer: any; //The recurrentKernel weights matrix’s initializer. It is used for the linear transformation of the recurrent state.
  recurrentRegularizer: any; //The regularizer function applied to the recurrentKernel weights matrix.
  biasRegularizer: any; // The regularizer function applied to the bias vector.
  recurrentConstraint: any; // The constraint for the recurrentKernel weights.
  recurrentDropout: number = 0; //between 0 - 1
  cell: any; //A RNN cell instance.

}

export class GRU_options extends Options {
  recurrentActivation: Activation = Activation.hardSigmoid;
  implementation: number = 1; //  It specifies the implementation mode. It can be either 1 or 2. For superior performance, implementation is recommended.
}




export class Model {
  id: string;
  name: string;
  date: any;
  type: ModelType;
  inputs: Array<ModelVariable> = [];
  outputs: Array<Classifier> = [];
  options: any;
  model: any;
  selected: boolean = false;
  filters: Array<Filter> = [];
  multiple = true;

  constructor(id: string, name: string, type: ModelType) {
    this.id = id;
    this.name = name;
    this.date = new Date().getTime();
    this.type = type;

    this.options =  this.type !== ModelType.regression ? new NN_options() : new RegressionOptions();

    this.inputs = [
      new ModelVariable('angle', true, true, '#43E6D5', 'A'),
      new ModelVariable('velocity', true, true, '#00AEEF', 'V'),
      new ModelVariable('direction', true, true, '#E18257', 'D'),
      new ModelVariable('pressure', false, false, '#4390E6', 'P'),
      new ModelVariable('target', false, false, '#7778E0', 'G')
      // new ModelVariable('time', false, false, '#4390E6')
    ]
  }
}

export class Bounds {
  xMin = 0;
  xMax = 1000;
  yMin = 0;
  yMax = 1;
}

export class InputItem {
  name: string;
  value: number;

  constructor(name: string) {
    this.name = name;
  }
}

export class OutputItem {
  label = new Label(null, null);
  classifier_id: string;
  classifier_name: string;

  constructor(id: string, name: string) {
    if (id && name) {
      this.classifier_id = id;
      this.classifier_name = name;
    }
  }
}

export class Data {
  inputs: Array<InputItem> = [];
  time: number;

}

export class McuEl {
  id: string;
  name: string;
  serialPath: string;
}

export class MotorEl {
  mcu = new McuEl();
  id: string;
  index: number;
  d: Array<Data> = [];
  record: boolean = true;
  visible: boolean = true;
  colors = [ new InputColor('angle', '#43E6D5'),
             new InputColor('velocity', '#00AEEF'),
             new InputColor('direction', '#E18257'),
             new InputColor('pressure', '#4390E6'),
             new InputColor('target', '#7778E0') ];

  constructor(mcuID: string, mcuName: string, serialPath: string, id: string, index: number) {
    this.mcu.id = mcuID;
    this.mcu.name = mcuName;
    this.mcu.serialPath = serialPath;
    this.id = id;
    this.index = index;
  }
}

export class InputColor {
  visible: boolean = true;
  input_name: string;
  hash: string;

  constructor(name: string, hash: string) {
    this.input_name = name;
    this.hash = hash;
  }
}

export class DataSet {
  id: String;
  name: String;
  // date: any;
  date = new Dates();
  m: Array<MotorEl> = [];
  output = new OutputItem(null, null);
  // outputs: Array<any> = []; //convert to single outputItem
  open = true;
  selected = false;
  bounds = new Bounds();
  offsetTime = 0;

  constructor(id: String, name: String, selectedMCUs: Array<MicroController> = null) {
    this.id = id;
    this.name = name;

    if (selectedMCUs) {
      for (const mcu of selectedMCUs) {
        for (const m of mcu.motors) {
          if (m.record) {
            const index = mcu.motors.indexOf(m);
            const motorEl = new MotorEl(mcu.id, mcu.name, mcu.serialPort.path, m.id, index);
            this.m.push(motorEl);
          }
        }
      }
    }
  }
}



export class MLDataSet extends DataSet {
  classifierID: string;
  confidencesLevels: Array<Label> = [];

}
