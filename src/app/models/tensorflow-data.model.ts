import { MicroController } from "./hardware.model";
import { DataSet, InputColor, MLDataSet, Model, ModelType, Layer } from "./tensorflow.model";
import { v4 as uuid } from 'uuid';
import * as tf from '@tensorflow/tfjs';

export class ML_Data {
  id: string;
  classifier: any;
  data: Array<any> = [];

  constructor(id: string) {
    this.id = id;
  }
}

export class TensorFlowData {

  selectedMicrocontrollers: Array<MicroController> = [];
  selectOptionMicrocontroller: MicroController;
  selectedModel: Model;

  kMeans_options = [{ name: 'k clusters', value: 3 },
                    { name: 'Max iterations', value: 4 },
                    { name: 'threshold', value: 0.5 } ];

  motorList = [];

  dataSets: Array<DataSet> = [];
  selectedDataset: DataSet = null;
  predictionDataset: DataSet = null;
  mlOutputData: Array<MLDataSet> = [];
  trainingData: Array<any> = [];

  multipleSelect = { min: 0, max: 0, active: false };

  processing = false;

  classify = false;
  dataVisible = true;
  sidebarWidth = 150;

  recording = { active: false, starttime: null };
  random = true;

  trimLinesVisible = false;
  trimLines = [ { id: 0, value: null }, { id: 1, value: null } ];

  colorList = [ new InputColor('angle', '#43E6D5'),
                new InputColor('velocity', '#00AEEF'),
                new InputColor('direction', '#E18257'),
                new InputColor('pressure', '#4390E6'),
                new InputColor('target', '#7778E0') ];

  colorOptions = ['#ED1A75','#EBAE52','#F2662D','#F0747A','#C05BEB','#7065EB','#43E6D5', '#00AEEF', '#E18257', '#4390E6', '#7778E0', '#F93858', '#B533FF', '#FCFF33', '#BBFF33' ];
  labels = [];

  size = 0;

  ML_OutputData: Array<ML_Data> = [];


  lossOptions = [
    { name: 'absoluteDifference', value: tf.losses.absoluteDifference },
    { name: 'computeWeightedLoss', value: tf.losses.computeWeightedLoss },
    { name: 'cosineDistance', value: tf.losses.cosineDistance },
    { name: 'hingeLoss', value: tf.losses.hingeLoss },
    { name: 'huberLoss', value: tf.losses.huberLoss },
    { name: 'logLoss', value: tf.losses.logLoss },
    { name: 'meanSquaredError', value: tf.losses.meanSquaredError },
    // { name: 'KLDivergence', value: tf.losses. },
    { name: 'sigmoidCrossEntropy', value: tf.losses.sigmoidCrossEntropy },
    { name: 'softmaxCrossEntropy', value: tf.losses.softmaxCrossEntropy },
    { name: 'categoricalCrossentropy', value: tf.metrics.categoricalCrossentropy }
  ];

  metricsOptions = [
    { name: 'binaryAccuracy', value: tf.metrics.binaryAccuracy },
    { name: 'binaryCrossentropy', value: tf.metrics.binaryCrossentropy },
    { name: 'categoricalAccuracy', value: tf.metrics.categoricalAccuracy },
    { name: 'categoricalCrossentropy', value: tf.metrics.categoricalCrossentropy },
    { name: 'cosineProximity', value: tf.metrics.cosineProximity },
    { name: 'meanAbsoluteError', value: tf.metrics.meanAbsoluteError },
    { name: 'meanAbsolutePercentageError', value: tf.metrics.meanAbsolutePercentageError },
    { name: 'meanSquaredError', value: tf.metrics.meanSquaredError },
    { name: 'precision', value: tf.metrics.precision },
    { name: 'recall', value: tf.metrics.recall },
    { name: 'sparseCategoricalAccuracy', value: tf.metrics.sparseCategoricalAccuracy }
  ];

  optimizerOptions = [
    { name: 'sgd', optimizer: tf.train.sgd },
    { name: 'momentum', optimizer: tf.train.momentum },
    { name: 'adagrad', optimizer: tf.train.adagrad },
    { name: 'adadelta', optimizer: tf.train.adadelta },
    { name: 'adam', optimizer: tf.train.adam },
    { name: 'rmsprop', optimizer: tf.train.rmsprop },
  ];

  regularizerOptions = [
    { name: 'l1', regularizer: tf.regularizers.l1, config: { l1: 0.01 }},
    { name: 'l1l2', regularizer: tf.regularizers.l1l2, config: { l1: 0.01, l2: 0.01 }},
    { name: 'l2', regularizer: tf.regularizers.l2, config: { l2: 0.01 } },
    { name: 'none', regularizer: undefined }
  ];

  // constraintOptions = [
  //   { name: 'maxNorm', value: tf.constraints.maxNorm, args: { max: 1, axis: 1 }},
  //   { name: 'minMaxNorm', value: tf.constraints.minMaxNorm, args: {minValue: 0, maxValue: 1, axis: 1, rate: 0.1 }},
  //   { name: 'nonNeg', value: tf.constraints.nonNeg, args: {}},
  //   { name: 'unitNorm', value: tf.constraints.unitNorm, args: { axis: 1 } },
  //   { name: 'none', value: undefined }
  // ];

  initializerOptions = [
    { name: 'constant', initializer: tf.initializers.constant, args: { value: 1 } },
    { name: 'glorotNormal', initializer: tf.initializers.glorotNormal, args: { seed: 1 } },
    { name: 'glorotUniform', initializer: tf.initializers.glorotUniform, args: { seed: 1 } },
    { name: 'heNormal', initializer: tf.initializers.heNormal, args: { seed: 1 } },
    { name: 'heUniform', initializer: tf.initializers.heUniform, args: { seed: 1 } },
    { name: 'identity', initializer: tf.initializers.identity, args: { gain: 1 } },
    { name: 'leCunNormal', initializer: tf.initializers.leCunNormal, args: { seed: 1 } },
    { name: 'leCunUniform', initializer: tf.initializers.leCunUniform, args: { seed: 1 } },
    { name: 'ones', initializer: tf.initializers.ones, args: { seed: 1, gain: 1 } },
    { name: 'orthogonal', initializer: tf.initializers.orthogonal, args: { seed: 1, gain: 1 } },
    { name: 'randomNormal', initializer: tf.initializers.randomNormal, args: { seed: 1, mean: 1, stddev: 1 } },
    { name: 'randomUniform', initializer: tf.initializers.randomUniform, args: { seed: 1, minval: 1, maxval: 1 } },
    { name: 'truncatedNormal', initializer: tf.initializers.truncatedNormal, args: { seed: 1, mean: 1, stddev: 1 } },
    { name: 'varianceScaling', initializer: tf.initializers.varianceScaling, args: { seed: 1, mode: 1, distribution: 'normal', stddev: 1 } },
    { name: 'zeros', initializer: tf.initializers.zeros, args: ''},
    { name: 'none', initializer: undefined }
  ];


};


