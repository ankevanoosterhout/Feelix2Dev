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
  [Activation.hardSigmoid]: 'hard sigmoid',
  [Activation.linear]: 'linear',
  [Activation.relu]: 'ReLU',
  [Activation.relu6]: 'ReLU6',
  [Activation.selu]: 'SELU',
  [Activation.sigmoid]: 'sigmoid',
  [Activation.softmax]: 'soft max',
  [Activation.softplus]: 'soft plus',
  [Activation.softsign]: 'soft sign',
  [Activation.tanh]: 'tanh',
  [Activation.swish]: 'swish',
  [Activation.mish]: 'mish'
};

export enum Regularizer {
  l1l2 = 'l1l2',
  l1 = 'l1',
  l2 = 'l2',
  none = 'none'
};

export const RegularizerLabelMapping: Record<Regularizer, string> = {
  [Regularizer.l1]: 'l1',
  [Regularizer.l2]: 'l2',
  [Regularizer.l1l2]: 'l1l2',
  [Regularizer.none]: 'none',
};

export enum Constraint {
  maxNorm = 'maxNorm',
  minMaxNorm = 'minMaxNorm',
  nonNeg = 'nonNeg',
  unitNorm = 'unitNorm',
  none = 'none'
};

export const ConstraintLabelMapping: Record<Constraint, string> = {
  [Constraint.maxNorm]: 'maxNorm',
  [Constraint.minMaxNorm]: 'minMaxNorm',
  [Constraint.nonNeg]: 'nonNeg',
  [Constraint.unitNorm]: 'unitNorm',
  [Constraint.none]: 'none',
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
};

export enum Padding {
  valid = 'valid',
  same = 'same',
  causal = 'causal',
  none = 'none'
}

export const PaddingMapping: Record<Padding, string> = {
  [Padding.valid]: 'valid',
  [Padding.same]: 'same',
  [Padding.causal]: 'causal',
  [Padding.none]: 'none'
};

export enum DataFormat {
  channelsFirst = 'channelsFirst',
  channelsLast = 'channelsLast'
}

export const DataFormatMapping: Record<DataFormat, string> = {
  [DataFormat.channelsFirst]: 'Channels first',
  [DataFormat.channelsLast]: 'Channels last',
};


export enum ModelType {
  CNN = 0,
  RNN = 1,
  LSTM = 2,
  DFNN = 3,
  regression = 4,
  custom = 5
};

export const ModelTypeMapping: Record<ModelType, string> = {
  [ModelType.CNN]: 'Convolutional NN',
  [ModelType.RNN]: 'Recurrent NN',
  [ModelType.LSTM]: 'Regression',
  [ModelType.DFNN]: 'Deep learning',
  [ModelType.regression]: 'Regression',
  [ModelType.custom]: 'Custom'
};


export class LayerType {
  name: string;
  tf: Function;
  description: string;
  args: any = { dimensions: 1 };
  subgroup: string;

  constructor(name: string, subgroup:string, tf: Function, args: object = null) {
    this.name = name;
    this.subgroup = subgroup;
    this.tf = tf;
    if (args) {
      this.args = args;
    }
  }
};




export class Input {
  id: string;
  name: string;
  active = true;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
};

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
};

export class Label {
  id: string;
  name: string;
  confidence: number;
  prediction: number;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
};


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
};


export class Layer {
  name: string;
  options: any = new Options();
  type: LayerType = null;
  settingsVisible = false;
  hidden = false;

  constructor(name: string) {
    this.name = name;

    if (this.name === 'input') {
      this.options = new InputLayerOptions();
    } else if (this.name === 'output') {
      this.options = new OutputLayerOptions();
    }
  }
 };


export class Option {
  value: any;

  constructor(value: any) {
    this.value = value;
  }
};

export class TrainingOptions {
  epochs: number = 100;
  learningRate: number = 0.1;
  optimizer: any = { name:'sgd', value: tf.train.sgd };
  metrics: any = { name:'categoricalAccuracy', value: tf.metrics.categoricalAccuracy };
  losses: any = { name:'categoricalCrossentropy', value: tf.metrics.categoricalCrossentropy };
  momentum = 10;
  distribution = 0.7;
};

export class Options {
  batchNormalization: boolean = true;
  useBias = new Option(false);
  weights = new Option([]); //'Initial weight values of the layer.'
  trainable = new Option(true);
  // units = new Option(4, 'Positive integer, dimensionality of the output space.');
};

export class Basic_options extends Options {
  units = new Option(4);
  activation = new Option(Activation.relu);
  activityRegularizer = new Option(Regularizer.none);
  kernelConstraint = new Option('none');
  kernelRegularizer = new Option(Regularizer.none);
  biasConstraint = new Option('none');
}

export class InputLayerOptions extends Options {
  inputs: Array<any> = [];
  inputDim: Array<any>; // Defines input shape as [inputDim].
  units = new Option(3);
  actuators = new Option(1);
  batchSize = new Option(32);
  batchInputShape: any;
  inputLength = new Option(undefined);
};

export class OutputLayerOptions extends Options {
  outputs: Array<any> = [];
  units = new Option(1);
  activation = new Option(Activation.relu);
  activityRegularizer = new Option(Regularizer.none);
};




export class Convolutional_options extends Options {
  kernelSize = new Option({x: 4, y: 2, z: 1});
  padding = new Option(Padding.none);
  filters = new Option(1);
  activation = new Option(Activation.relu);
  activityRegularizer = new Option(Regularizer.none);
  biasConstraint = new Option(Constraint.none);
  biasRegularizar = new Option(Regularizer.none);
  kernelConstraint = new Option(Constraint.none);
  kernelRegularizer = new Option(Regularizer.none);
  // kernelInitializer: any; // The convolutional kernel weights matrix’s initializer.
  // biasInitializer = new Option(undefined, 'The bias vector’s initializer.'); //The bias vector’s initializer.
};

export class Regression_options extends Options {
  degree: number = 1;
  losses: any = tf.metrics.meanSquaredError;
};

export class Recurrent_options extends Options {
  units = new Option(4);
  activation = new Option(Activation.relu);
  activityRegularizer = new Option(Regularizer.none);
  returnSequences = new Option(true);
  returnState = new Option(false);
  goBackwards = new Option(false);


  biasConstraint = new Option('none');
  biasRegularizar = new Option(Regularizer.none);
  stateful: boolean = false; //If true, the final state of each sample at index I in a batch will be used as the beginning state of the next batch’s sample at index i
  unroll: boolean = false; // The network will be unrolled if true; else, a symbolic loop will be utilized. Although unrolling can speed up an RNN, it is more memory-intensive. Only short sequences are acceptable for unrolling
  recurrentInitializer: any; //The recurrentKernel weights matrix’s initializer. It is used for the linear transformation of the recurrent state.
  recurrentRegularizer = new Option(Regularizer.none); //The regularizer function applied to the recurrentKernel weights matrix.
  recurrentConstraint = new Option(Constraint.none);
  recurrentDropout = new Option(0);
  cell: any; //A RNN cell instance.
  dropout = new Option(0.2); // between 0 and 1
};

export class Pooling_options extends Options {
  poolSize = new Option({x: 2, y: 1, z: 1});
  dataFormat = new Option('channelsFirst');
};


export class Normalization_options extends Options {
  axis = new Option(-1);
  units = new Option(4);
};

// export class LSTM_options extends Options {
//   recurrentActivation: Activation = Activation.hardSigmoid;
//   returnSequences: boolean = true; //Whether the final output in the output series should be returned, or the entire sequence should be returned.
//   returnState: boolean = false; // Whether or not the last state should be returned along with the output.
//   goBackwards: boolean = false; //If this is true, process the input sequence backward and return the reversed sequence.
//   stateful: boolean = false; //If true, the final state of each sample at index I in a batch will be used as the beginning state of the next batch’s sample at index i
//   unroll: boolean = false; // The network will be unrolled if true; else, a symbolic loop will be utilized. Although unrolling can speed up an RNN, it is more memory-intensive. Only short sequences are acceptable for unrolling
//   unitForgetBias: boolean = false;
//   implementation: number = 1; //  It specifies the implementation mode. It can be either 1 or 2. For superior performance, implementation is recommended.
//   recurrentInitializer: any; //The recurrentKernel weights matrix’s initializer. It is used for the linear transformation of the recurrent state.
//   recurrentRegularizer: any; //The regularizer function applied to the recurrentKernel weights matrix.
//   biasRegularizer: any; // The regularizer function applied to the bias vector.
//   recurrentConstraint: any; // The constraint for the recurrentKernel weights.
//   recurrentDropout: number = 0; //between 0 - 1
//   cell: any; //A RNN cell instance.
// }

export class DFConvolutional_options extends Options {

}

export class Model {
  id: string;
  name: string;
  date: any;
  type: ModelType;
  inputs: Array<ModelVariable> = [];
  outputs: Array<Classifier> = [];
  model: any;
  selected: boolean = false;
  filters: Array<Filter> = [];
  multiple = true;
  layers: Array<Layer> = [new Layer('input'), new Layer('output')];
  training = new TrainingOptions();


  constructor(id: string, name: string, type: ModelType) {
    this.id = id;
    this.name = name;
    this.date = new Date().getTime();
    this.type = type;

    if (this.type === ModelType.RNN) {
      this.layers.splice(1, 0, new Layer('RNN'));

    } else if (this.type === ModelType.regression) {
      this.layers.splice(1, 0, new Layer('regression'));

    } else if (this.type === ModelType.DFNN) {
      this.layers.splice(1, 0, new Layer('DFNN'));

    } else if (this.type === ModelType.custom) {
      this.layers.splice(1, 0, new Layer('custom'));
    }

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

export enum TrainingType  {
  training = 0,
  validation = 1
}

export class DataSet {
  id: String;
  name: String;
  // date: any;
  date = new Dates();
  m: Array<MotorEl> = [];
  outputs: Array<OutputItem> = [];
  // outputs: Array<any> = []; //convert to single outputItem
  open = true;
  selected = false;
  bounds = new Bounds();
  offsetTime = 0;
  trainingType: TrainingType;


  constructor(id: String, name: String, selectedMCUs: Array<MicroController> = [], outputs: Array<Classifier> = []) {
    this.id = id;
    this.name = name;

    for (const mcu of selectedMCUs) {
      for (const m of mcu.motors) {
        if (m.record) {
          const index = mcu.motors.indexOf(m);
          const motorEl = new MotorEl(mcu.id, mcu.name, mcu.serialPort.path, m.id, index);
          this.m.push(motorEl);
        }
      }
    }


    for (const output of outputs) {
      if (this.outputs.filter(o => o.classifier_id === output.id).length === 0) {
        this.outputs.push(new OutputItem(output.id, output.name));
      }
    }

  }
}



export class MLDataSet extends DataSet {
  classifierID: string;
  confidencesLevels: Array<Label> = [];

}


