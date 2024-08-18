import { Filter } from "./filter.model";
import * as tf from '@tensorflow/tfjs';
import { MicroController } from "./hardware.model";
import { Dates } from "./file.model";
import { v4 as uuid } from 'uuid';
import { Repeat } from "./effect.model";


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

export const InitializerLabelMapping: Record<Initializer, string> = {
  [Initializer.constant]: 'constant',
  [Initializer.glorotNormal]: 'glorotNormal',
  [Initializer.glorotUniform]: 'glorotUniform',
  [Initializer.heNormal]: 'heNormal',
  [Initializer.heUniform]: 'heUniform',
  [Initializer.identity]: 'identity',
  [Initializer.leCunNormal]: 'leCunNormal',
  [Initializer.leCunUniform]: 'leCunUniform',
  [Initializer.ones]: 'ones',
  [Initializer.orthogonal]: 'orthogonal',
  [Initializer.randomNormal]: 'randomNormal',
  [Initializer.randomUniform]: 'randomUniform',
  [Initializer.truncatedNormal]: 'truncatedNormal',
  [Initializer.varianceScaling]: 'varianceScaling',
  [Initializer.zeros]: 'zeros',
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


export enum InterpolationFormat {
  nearest = 'nearest',
  bilinear = 'bilinear'
}

export const InterpolationFormatMapping: Record<InterpolationFormat, string> = {
  [InterpolationFormat.nearest]: 'nearest',
  [InterpolationFormat.bilinear]: 'bilinear',
};


export enum ModelType {
  CNN = 0,
  RNN = 1,
  FNN = 2,
  GAN = 3,
  DQN = 4,
  custom = 5
};

export const ModelTypeMapping: Record<ModelType, string> = {
  [ModelType.CNN]: 'Convolutional Neural Network',
  [ModelType.RNN]: 'Recurrent Neural Network',
  [ModelType.FNN]: 'Forward Neural Network',
  [ModelType.GAN]: 'Generative Adversarial Network',
  [ModelType.DQN]: 'Deep Q-Network',
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

export enum VariableType {
  discrete = 0,
  continuous = 1,
  categorical = 2
};

export const VariableTypeMapping: Record<VariableType, string> = {
  [VariableType.discrete]: 'discrete',
  [VariableType.continuous]: 'continuous',
  [VariableType.categorical]: 'categorical'
};

export class ModelVariable {
  name: string;
  active: boolean;
  color: string;
  visible = false;
  slug: string;
  type = VariableType.continuous;

  constructor(name: string, active: boolean, visible: boolean, color: string, slug: string, type: VariableType) {
    this.name = name;
    this.active = active;
    this.visible = visible;
    this.color = color;
    this.slug = slug;
    this.type = type;
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

  constructor(id: string, name: string, dummy = false) {
    this.id = id;
    this.name = name;

    if (dummy) {
      this.labels = [new Label(uuid(), 'item-1'), new Label(uuid(), 'item-2')];
    }
  }
};


export class Layer {
  name: string;
  options: any = new Options();
  type: LayerType = null;
  settingsVisible = false;
  hidden = false;

  constructor(name: string, type = null) {
    this.name = name;

    if (type) {
      this.type = type;

      if (type.subgroup === 'basic') {
        this.options = new Basic_options(type);

      } else if (type.subgroup === 'recurrent') {
        this.options = new Recurrent_options(type);

      } else if (type.subgroup === 'convolutional') {
        this.options = new Convolutional_options(type);

      } else if (type.subgroup === 'normalization') {
        this.options = new Normalization_options(type);

      } else if (type.subgroup === 'pooling') {
        this.options = new Pooling_options(type);
      }
    }

    if (this.name === 'input') {
      this.options = new InputLayerOptions();
      // this.type = new LayerType('dense', 'basic', tf.layers.dense);
    } else if (this.name === 'output') {
      this.options = new OutputLayerOptions();
      // this.type = new LayerType('dense', 'basic', tf.layers.dense);
    }

  }
 };


export class Option {
  value: any;
  min: number;
  max: number;

  constructor(value = null, min = null, max = null) {
    this.value = value;
    this.min = min;
    this.max = max;
  }
};

export class tf_function {
  name: string;
  value: Function | string;

  constructor(name: string, value: Function | string) {
    this.name = name;
    this.value = value;
  }
}

export class TrainingOptions {
  epochs: number = 100;
  learningRate: number = 0.1;
  optimizer: tf_function = new tf_function('sgd', tf.train.sgd);
  metrics: tf_function = new tf_function('categoricalAccuracy', tf.metrics.categoricalAccuracy);
  losses: tf_function = new tf_function('categoricalCrossentropy', tf.metrics.categoricalCrossentropy);
  momentum = 10;
  distribution: number = 0.7;
  validationBatchSize: number = 2;
  batchSize = 2;
};

export class Options {
  // batchNormalization: boolean = true;
  weights = new Option([]); //'Initial weight values of the layer.'
  trainable = new Option(true);
  // units = new Option(4, 'Positive integer, dimensionality of the output space.');
};

export class InputLayerOptions extends Options {
  inputs: Array<any> = [];
  inputDim: Array<any>; // Defines input shape as [inputDim].
  units = new Option(3);
  actuators = new Option(1);
  batchInputShape: any;
  inputLength = new Option(10);
  inputDimension = 1;
  sparse = new Option(false);
};

export class OutputLayerOptions extends Options {
  outputs: Array<any> = [];
  units = new Option(2);
  activation = new Option(Activation.softmax);
  activityRegularizer = new Option({ name: 'none', regularizer: undefined});
};



export class Basic_options extends Options {
  units = new Option(4);
  useBias = new Option(false);
  activation = new Option(Activation.relu);
  activityRegularizer = new Option({ name: 'none', regularizer: undefined});
  kernelInitializer = new Option({ name: 'zeros', initializer: tf.initializers.zeros });
  kernelConstraint = new Option(Constraint.none);
  kernelRegularizer = new Option({ name: 'none', regularizer: undefined});
  biasInitializer = new Option({ name: 'zeros', initializer: tf.initializers.zeros });
  biasConstraint = new Option(Constraint.none);
  biasRegularizer = new Option({ name: 'none', regularizer: undefined});
  embeddingsInitializer = new Option({ name: 'zeros', initializer: tf.initializers.zeros });
  embeddingsRegularizer = new Option({ name: 'none', regularizer: undefined});
  embeddingsConstraint  = new Option(Constraint.none);
  maskZero = new Option(false);
  dataFormat = new Option('channelsLast');
  n = new Option(1);
  dims = new Option([]);
  inputDim = new Option(1);
  outputDim = new Option(0);
  rate = new Option(0.2);
  noiseShape: Array<number> = [];
  seed = new Option(0);
  inputLength = new Option(undefined);
  targetShape = new Option([1,1]);

  constructor(layerType: LayerType) {
    super();

    if (layerType) {

      const name = layerType.name;
      // if (name === 'dropout') {
      //   this.units = undefined;
      // }
      if (name === 'dense' || name === 'dropout' || name === 'embedding' || name === 'reshape') {
        this.dataFormat = undefined;
        this.n = undefined;
        this.dims = undefined;
      }

      if (name === 'flatten' || name === 'permute' || name === ' repeatVector' || name === 'dropout' || name === 'reshape') {
        this.activation = undefined;
        this.activityRegularizer = undefined;

        this.useBias = undefined;
        this.biasInitializer = undefined;
        this.biasConstraint = undefined;
        this.biasRegularizer = undefined;

        this.kernelInitializer = undefined;
        this.kernelConstraint = undefined;
        this.kernelRegularizer = undefined;

        if (name === 'flatten' || name === 'permute' || name === 'dropout') {
          this.n = undefined;
        }

        if (name === 'permute') {
          this.dims.value = [];
          for (let i = 0; i < layerType.args.dimensions; i++) {
            this.dims.value.push(i + 1);
          }
        } else {
          this.dims = undefined;
        }
      }

      if (name !== 'embedding') {
        this.embeddingsConstraint = undefined;
        this.embeddingsInitializer = undefined;
        this.embeddingsRegularizer = undefined;
        this.maskZero = undefined;
        this.inputDim = undefined;
        this.outputDim = undefined;
        this.inputLength = undefined;

      } else if (name === 'embedding') {
        this.units = undefined;
        this.activation = undefined;
        this.useBias = undefined;
        this.biasInitializer = undefined;
        this.biasConstraint = undefined;
        this.biasRegularizer = undefined;

        this.kernelInitializer = undefined;
        this.kernelConstraint = undefined;
        this.kernelRegularizer = undefined;
      }

      if (name !== 'dropout') {
        this.rate = undefined;
        this.seed = undefined;
        this.noiseShape = undefined;
      }

      if (name !== 'reshape') {
        this.targetShape = undefined;
      }
    }
  }
}


export class Convolutional_options extends Options {
  kernelSize = new Option([]);
  strides = new Option([]);
  padding = new Option(Padding.none);
  filters = new Option(1);
  useBias = new Option(false);
  activation = new Option(Activation.relu);
  activityRegularizer = new Option({ name: 'none', regularizer: undefined });
  biasInitializer = new Option({ name: 'zeros', initializer: tf.initializers.zeros });
  biasConstraint = new Option(Constraint.none);
  biasRegularizer = new Option({ name: 'none', regularizer: undefined});
  kernelInitializer = new Option({ name: 'zeros', initializer: tf.initializers.zeros });
  kernelConstraint = new Option(Constraint.none);
  kernelRegularizer = new Option({ name: 'none', regularizer: undefined});
  dilationRate = new Option([]);
  depthMultiplier = new Option(1);
  depthwiseInitializer = new Option({ name: 'zeros', initializer: tf.initializers.glorotNormal });
  depthwiseConstraint = new Option(Constraint.none);
  depthwiseRegularizer = new Option({ name: 'none', regularizer: undefined });
  pointwiseConstraint = new Option(Constraint.none);
  pointwiseInitializer = new Option({ name: 'none', initializer: undefined });
  pointwiseRegularizer = new Option({ name: 'none', regularizer: undefined });
  dataFormat = new Option(DataFormat.channelsFirst);
  interpolation = undefined;


  constructor(layerType: LayerType) {
    super();
    if (layerType) {
      this.kernelSize.value = [];
      this.strides.value = [];
      this.dilationRate.value = [];
      for (let i = 0; i < layerType.args.dimensions; i++) {
        this.kernelSize.value.push(2);
        this.strides.value.push(2);
        this.dilationRate.value.push(2);
      }

      const name = layerType.name;
      if (name === 'conv1d' || name === 'conv2d' || name === 'conv2dTranspose' || name === 'conv3d' || name === 'cropping2D' || name === 'upSampling2d') {

        this.depthMultiplier = undefined;
        this.depthwiseInitializer = undefined;
        this.depthwiseConstraint = undefined;
        this.depthwiseRegularizer = undefined;

        this.pointwiseConstraint = undefined;
        this.pointwiseInitializer = undefined;
        this.pointwiseRegularizer = undefined;

        this.interpolation = undefined;

        if (name === 'cropping2D' || name === 'upSampling2d') {
          this.useBias = undefined;
          this.biasInitializer = undefined;
          this.biasConstraint = undefined;
          this.biasRegularizer = undefined;

          this.kernelInitializer = undefined;
          this.kernelConstraint = undefined;
          this.kernelRegularizer = undefined;

          if (name === 'upSampling2d') {
            this.interpolation = new Option(InterpolationFormat.nearest);
          }
        }
      } else if (name === 'depthwiseConv2d') {
        this.pointwiseConstraint = undefined;
        this.pointwiseInitializer = undefined;
        this.pointwiseRegularizer = undefined;
      }
    }
  }
};


export class Recurrent_options extends Options {
  units = new Option(4);
  useBias = new Option(false);
  activation = new Option(Activation.relu);
  returnSequences = new Option(true);
  returnState = new Option(false);
  goBackwards = new Option(false);
  biasInitializer = new Option({ name: 'zeros', initializer: tf.initializers.zeros });
  biasConstraint = new Option('none');
  biasRegularizer = new Option({ name: 'none', regularizer: undefined});
  stateful = new Option(false); //If true, the final state of each sample at index I in a batch will be used as the beginning state of the next batch’s sample at index i
  unroll = new Option(false); // The network will be unrolled if true; else, a symbolic loop will be utilized. Although unrolling can speed up an RNN, it is more memory-intensive. Only short sequences are acceptable for unrolling
  recurrentInitializer = new Option({ name: 'zeros', initializer: tf.initializers.zeros }); //The recurrentKernel weights matrix’s initializer. It is used for the linear transformation of the recurrent state.
  recurrentActivation = new Option(Activation.hardSigmoid);
  recurrentRegularizer = new Option({ name: 'none', regularizer: undefined}); //The regularizer function applied to the recurrentKernel weights matrix.
  recurrentConstraint = new Option(Constraint.none);
  recurrentDropout = new Option(0);
  kernelInitializer = new Option({ name: 'zeros', initializer: tf.initializers.zeros }); //The recurrentKernel weights matrix’s initializer. It is used for the linear transformation of the recurrent state.
  kernelRegularizer = new Option({ name: 'none', regularizer: undefined}); //The regularizer function applied to the recurrentKernel weights matrix.
  kernelConstraint = new Option(Constraint.none);
  cell = new Option(null); //A RNN cell instance.
  dropout = new Option(0.2); // between 0 and 1
  resetAfter = new Option(false);
  implementation = new Option(1);
  unitForgetBias = new Option(false);

  // kernelSize = new Option([]);
  // strides = new Option([]);
  // padding = new Option(Padding.none);
  // filters = new Option(1);
  // dataFormat
  // dilationRate

  constructor(layerType: LayerType) {
    super();
    if (layerType) {

      const name = layerType.name;
      if (name === 'rnn' || name === 'simpleRNN' || name === 'simpleRNNCell' || name === 'stackedRNNCells') {
        this.recurrentActivation = undefined;
        this.resetAfter = undefined;
        this.implementation = undefined;
        this.unitForgetBias = undefined;

        if (name === 'rnn' || name === 'stackedRNNCells') {
          this.units = undefined;
          this.useBias = undefined;
          this.activation = undefined;
          this.recurrentInitializer = undefined;
          this.recurrentRegularizer = undefined;
          this.recurrentConstraint = undefined;
          this.recurrentDropout = undefined;
          this.kernelInitializer = undefined;
          this.kernelRegularizer = undefined;
          this.kernelConstraint = undefined;
          this.biasInitializer = undefined;
          this.biasConstraint = undefined;
          this.biasRegularizer = undefined;
        }

        if (name === 'simpleRNN' || name === 'simpleRNNCell' || name === 'stackedRNNCells') {
          this.goBackwards = undefined;
          this.stateful = undefined;
          this.unroll = undefined;

          if (name === 'simpleRNNCell' || name === 'stackedRNNCells') {
            this.returnSequences = undefined;
            this.returnState = undefined;
          }
        }

      } else if (name === 'gru') {
        this.resetAfter = undefined;
        this.unitForgetBias = undefined;

      } else if (name === 'gruCell') {
        this.unitForgetBias = undefined;

      } else if (name === 'LSTM') {
        this.resetAfter = undefined;
        this.returnSequences = undefined;
        this.returnState = undefined;
        this.goBackwards = undefined;
        this.stateful = undefined;
        this.unroll = undefined;
      }
    }
  }
};


export class Pooling_options extends Options {
  poolSize = new Option([]);
  dataFormat = new Option('channelsFirst');
  strides = new Option([]);
  padding = new Option(Padding.none);

  constructor(layerType: LayerType) {
    super();
    if (layerType) {
      this.poolSize.value = [];
      this.strides.value = [];
      for (let i = 0; i < layerType.args.dimensions; i++) {
        this.poolSize.value.push(2);
        this.strides.value.push(2);
      }
    }
  }
};



export class Normalization_options extends Options {
  axis = new Option(-1);
  epsilon = new Option(1e-3);
  units = new Option(4);
  center = new Option(true);
  scale = new Option(true);

  momentum = new Option(0.99);
  betaInitializer = new Option({ name: 'zeros', initializer: tf.initializers.zeros });
  gammaInitializer = new Option({ name: 'ones', initializer: tf.initializers.ones, args: { seed: 1, gain: 1 } });
  betaRegularizer = new Option({ name: 'none', regularizer: undefined});
  gammaRegularizer = new Option({ name: 'none', regularizer: undefined});

  movingMeanInitializer = new Option({ name: 'zeros', initializer: tf.initializers.zeros });
  movingVarianceInitializer = new Option({ name: 'ones', initializer: tf.initializers.ones  });
  betaConstraint = new Option(Constraint.none);
  gammaConstraint = new Option(Constraint.none);


  constructor(layerType: LayerType) {
    super();
    if (layerType) {

      const name = layerType.name;

      if (name === 'layerNormalization') {
        this.momentum = undefined;
        this.movingMeanInitializer = undefined;
        this.movingVarianceInitializer = undefined;
        this.betaConstraint = undefined;
        this.gammaConstraint = undefined;
      }



    }
  }
};


//Each ANN has one Output Layer which provides the output of model.If the model is Regression, then the Output Layer will have only one Node. The output of this Node is the Y-Predicted
//value of the input given in Input Layer.If the target variable is a categorical data of two classes, then the Output Layer should have 2 Nodes and the activation function should be ‘Sigmoid’.
//If it is a multi-class classification, then the Output Layer should have Nodes exactly the same number of classes of the target variable. And the activation function should be ‘Softmax’.
//If the activation function is Sigmoid or Softmax, we will get the probability value from all the Nodes in the Output Layer. The index of the Highest Probability value is the output.


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
  layers: Array<Layer> = [new Layer('input'), new Layer('output')];
  training = new TrainingOptions();


  constructor(id: string, name: string, type: ModelType) {
    this.id = id;
    this.name = name;
    this.date = new Date().getTime();
    this.type = type;

    if (this.type === ModelType.RNN) {
      const layerEmbedding = new Layer('embedding', new LayerType('embedding', 'basic', tf.layers.embedding));
      layerEmbedding.hidden = true;

      const layerGRU = new Layer('gru', new LayerType('gru', 'recurrent', tf.layers.gru));
      layerGRU.hidden = true;

      const layerSimpleRNN = new Layer('simpleRNN', new LayerType('simpleRNN', 'recurrent', tf.layers.simpleRNN));
      layerSimpleRNN.hidden = true;

      const layerDense = new Layer('dense', new LayerType('dense', 'basic', tf.layers.dense));
      layerDense.hidden = true;

      this.layers.splice(1, 0, layerEmbedding, layerGRU, layerSimpleRNN, layerDense);

    } else if (this.type === ModelType.DQN) {
      const layerDense = new Layer('dense', new LayerType('dense', 'basic', tf.layers.dense));
      layerDense.options.activation = new Option(Activation.relu);
      layerDense.options.units = new Option(24);
      layerDense.hidden = true;

      const layerDense2 = new Layer('dense', new LayerType('dense', 'basic', tf.layers.dense));
      layerDense2.options.activation = new Option(Activation.relu);
      layerDense2.options.units = new Option(24);
      layerDense2.hidden = true;

      this.layers.splice(1, 0, layerDense, layerDense2);

    } else if (this.type === ModelType.CNN) {
      const layerConv2D = new Layer('conv2D', new LayerType('conv2d', 'convolutional', tf.layers.conv2d, { dimensions: 2 }));
      layerConv2D.hidden = true;

      const layerMaxPooling2D = new Layer('conv2D', new LayerType('averagePooling2d', 'pooling', tf.layers.averagePooling2d, { dimensions: 2 }));
      layerMaxPooling2D.hidden = true;

      const layerConv2D_2 = new Layer('conv2D', new LayerType('conv2d', 'convolutional', tf.layers.conv2d, { dimensions: 2 }));
      layerConv2D_2.hidden = true;

      const layerMaxPooling2D_2 = new Layer('conv2D', new LayerType('averagePooling2d', 'pooling', tf.layers.averagePooling2d, { dimensions: 2 }));
      layerMaxPooling2D_2.hidden = true;

      const layerConv2D_3 = new Layer('conv2D', new LayerType('conv2d', 'convolutional', tf.layers.conv2d, { dimensions: 2 }));
      layerConv2D_3.hidden = true;

      const flatten = new Layer('flatten', new LayerType('flatten', 'basic', tf.layers.flatten));
      flatten.hidden = true;

      const layerDense = new Layer('dense', new LayerType('dense', 'basic', tf.layers.dense));
      layerDense.hidden = true;

      const layerDense2 = new Layer('dense', new LayerType('dense', 'basic', tf.layers.dense));
      layerDense2.hidden = true;

      this.layers.splice(1, 0, layerConv2D, layerMaxPooling2D, layerConv2D_2, layerMaxPooling2D_2, layerConv2D_3, flatten, layerDense, layerDense2);


    } else if (this.type === ModelType.FNN) {

      let units = [128,64,64,32];
      for (let l = 0; l < 4; l++) {
        const layerDense = new Layer('dense', new LayerType('dense', 'basic', tf.layers.dense));
        layerDense.hidden = true;
        layerDense.options.units.value = units[l];
        const layerNormalize = new Layer('batchNormalization', new LayerType('batchNormalization', 'normalization', tf.layers.batchNormalization));
        layerNormalize.options.units.value = units[l];
        layerNormalize.hidden = true;
        const dropout = new Layer('dropout', new LayerType('dropout', 'basic', tf.layers.dropout));
        dropout.hidden = true;
        dropout.options.units.value = units[l];
        dropout.options.rate.value = 0.5;

        this.layers.splice(1 + (l * 3), 0, layerDense, layerNormalize, dropout);
      }

      this.layers.filter(l => l.name === 'output')[0].options.activation = new Option(Activation.softmax);


    } else if (this.type === ModelType.GAN) {
      const layerDense = new Layer('dense', new LayerType('dense', 'basic', tf.layers.dense));
      layerDense.options.activation = new Option(Activation.relu);
      layerDense.options.units = new Option(256);
      layerDense.hidden = true;

      const layerNormalize = new Layer('batchNormalization', new LayerType('batchNormalization', 'normalization', tf.layers.batchNormalization));
      layerNormalize.options.units = new Option(256);
      layerNormalize.hidden = true;

      const layerDense1 = new Layer('dense', new LayerType('dense', 'basic', tf.layers.dense));
      layerDense1.options.activation = new Option(Activation.relu);
      layerDense1.options.units = new Option(512);
      layerDense1.hidden = true;

      const layerNormalize1 = new Layer('batchNormalization', new LayerType('batchNormalization', 'normalization', tf.layers.batchNormalization));
      layerNormalize1.options.units = new Option(512);
      layerNormalize1.hidden = true;

      const layerDense2 = new Layer('dense', new LayerType('dense', 'basic', tf.layers.dense));
      layerDense2.options.activation = new Option(Activation.relu);
      layerDense2.options.units = new Option(1024);
      layerDense2.hidden = true;

      const layerNormalize2 = new Layer('batchNormalization', new LayerType('batchNormalization', 'normalization', tf.layers.batchNormalization));
      layerNormalize2.options.units = new Option(1024);
      layerNormalize2.hidden = true;

      const layerDense3 = new Layer('dense', new LayerType('dense', 'basic', tf.layers.dense));
      layerDense3.options.activation = new Option(Activation.tanh);
      layerDense3.options.units = new Option(3072);
      layerDense3.hidden = true;

      const layerReshape = new Layer('reshape', new LayerType('reshape', 'basic', tf.layers.reshape));
      layerReshape.options.targetShape = new Option([32,32,3]);
      layerReshape.hidden = true;

      this.layers.splice(1, 0, layerDense, layerNormalize, layerDense1, layerNormalize1, layerDense2, layerNormalize2, layerDense3, layerReshape);

    }

    this.inputs = [
      new ModelVariable('angle', true, true, '#43E6D5', 'A', VariableType.continuous),
      new ModelVariable('velocity', true, true, '#00AEEF', 'V', VariableType.continuous),
      new ModelVariable('direction', true, true, '#E18257', 'D', VariableType.discrete),
      new ModelVariable('pressure', false, false, '#4390E6', 'P', VariableType.continuous),
      new ModelVariable('target', false, false, '#7778E0', 'G', VariableType.continuous)
      // new ModelVariable('time', false, false, '#4390E6')
    ]
  }
}




export class Bounds {
  xMin = 0;
  xMax = 1000;
  yMin = 0;
  yMax = 1;

  constructor(xMin = null, xMax = null, yMin = null, yMax = null) {
    if (xMin !== null) { this.xMin = xMin; }
    if (xMax !== null) { this.xMax = xMax; }
    if (yMin !== null) { this.yMin = yMin; }
    if (yMax !== null) { this.yMax = yMax; }
  }
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
  id: string;
  name: string;
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


  constructor(id: string, name: string, selectedMCUs: Array<MicroController> = [], outputs: Array<Classifier> = []) {
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


export class TrainingSet {
  id: string;
  name: string;
  data: Array<any> = [];
  open = true;
  selected = false;
  date = new Dates();
  bounds_loss = new Bounds(0, 100, 0, 1);
  bounds_metric = new Bounds(0, 100, 0, 1);
  training: TrainingOptions;

  constructor(id: string, name: string, training: TrainingOptions) {
    this.id = id;
    this.name = name;
    this.training = training;
  }
}


export class MinMax {
  min: number;
  max: number;
}


export class TrimSection {
  id: string;
  values = new MinMax();
  width: number;
  size: number;

  constructor(id: string, values: MinMax) {
    this.id = id;
    this.values = values;
    this.width = this.values.max - this.values.min;
  }
}

