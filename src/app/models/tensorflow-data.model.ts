import { MicroController } from "./hardware.model";
import { DataSet, InputColor, MLDataSet, Model, ModelType } from "./tensorflow.model";
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
  selectedModel: Model = new Model(uuid(), 'model', ModelType.neuralNetwork);

  kMeans_options = [{ name: 'k clusters', value: 3 },
                    { name: 'Max iterations', value: 4 },
                    { name: 'threshold', value: 0.5 } ];

  motorList = [];

  dataSets: Array<DataSet> = [];
  selectedDataset: DataSet = null;
  predictionDataset: DataSet = null;
  mlOutputData: Array<MLDataSet> = [];

  multipleSelect = { min: 0, max: 0, active: false };

  processing = false;

  classify = false;
  recording = { active: false, starttime: null };

  trimLinesVisible = false;
  trimLines = [ { id: 0, value: null }, { id: 1, value: null } ];

  colorList = [ new InputColor('angle', '#43E6D5'),
                new InputColor('velocity', '#00AEEF'),
                new InputColor('direction', '#E18257'),
                new InputColor('pressure', '#4390E6'),
                new InputColor('target', '#7778E0') ];

  colorOptions = ['#43E6D5', '#00AEEF', '#E18257', '#4390E6', '#7778E0', '#F93858', '#B533FF', '#FCFF33', '#BBFF33' ];

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
    { name: 'sgd', value: tf.train.sgd },
    { name: 'momentum', value: tf.train.momentum },
    { name: 'adagrad', value: tf.train.adagrad },
    { name: 'adadelta', value: tf.train.adadelta },
    { name: 'adam', value: tf.train.adam },
    { name: 'rmsprop', value: tf.train.rmsprop },
  ];

  regularizerOptions = [
    { name: 'l1', value: tf.regularizers.l1()  },
    { name: 'l1l2', value: tf.regularizers.l1l2()  },
    { name: 'l2', value: tf.regularizers.l2()  },
    { name: 'none', value: undefined }
  ];
};


