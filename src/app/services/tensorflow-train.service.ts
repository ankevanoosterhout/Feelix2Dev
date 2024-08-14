import { Injectable, Inject } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { TensorFlowData } from '../models/tensorflow-data.model';
import { DataSet, Layer, Model, ModelType, TrainingSet, TrainingType } from '../models/tensorflow.model';
import { TensorFlowMainService } from './tensorflow-main.service';
import { Subject } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { v4 as uuid } from 'uuid';

@Injectable()
export class TensorFlowTrainService {

  public d: TensorFlowData;

  createPredictionModel: Subject<any> = new Subject<void>();
  updateTrainingGraph: Subject<any> = new Subject<void>();
  selectLogFile: Subject<any> = new Subject<void>();

  constructor(@Inject(DOCUMENT) private document: Document, private tensorflowService: TensorFlowMainService) {
    this.d = this.tensorflowService.d;

  }

  async predictOutput() {
    let collectData = true;
    let i = 0;
    if (this.d.predictionDataset) {
      for (const motor of this.d.predictionDataset.m) {
        if (motor.d.length <= this.d.selectedModel.layers[0].options.batchSize.value && motor.d.length !== 0) { //20
          collectData = false;
        }
        i++;

        if (i >= this.d.predictionDataset.m.length && collectData) {

          const data = await this.createJSONfromDataSet([this.d.predictionDataset]);
          this.NN_Deploy(data.xs, this.d.selectedModel);
          this.clearCollectedData();
        }
      }
    }
  }


  clearCollectedData() {
    this.d.recording.starttime = new Date().getTime();
    for (const motor of this.d.predictionDataset.m) {
      motor.d = [];
    }
  }

  splitData(distribution: number, first:boolean) {
    if (this.d.dataSets.length > 0 && (first && this.d.dataSets.filter(d => d.trainingType === null || d.trainingType === undefined).length > 0) || !first) { //online sort when training types are not yet assigned
      let Tsample = Math.round(distribution * this.d.dataSets.length);

      if (this.d.random) {
        this.shuffle(this.d.dataSets);
      }

      let index = 0;
      for (const el of this.d.dataSets) {
        el.trainingType = index < Tsample ? TrainingType.training : TrainingType.validation;
        index++;
      }

      this.d.dataSets.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
    }
  }

  shuffle(arr: Array<any>) {
    let currentIndex = arr.length;

    while (currentIndex != 0) {

      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [arr[currentIndex], arr[randomIndex]] = [
        arr[randomIndex], arr[currentIndex]];
    }
  }



  processingModel(forwardOnSucces = true) {


    if (!this.d.processing && this.d.selectedModel) {

      this.document.body.style.cursor = 'wait';

      this.d.selectedModel.model = null;
      this.d.processing = true;
      this.tensorflowService.updateProgess('initializing model', 0);

      const inputLabels = [];
      const outputLabels = [];

      for (const input of this.d.selectedModel.inputs) {
        if (input.active) { inputLabels.push(input.name); }
      }

      for (const output of this.d.selectedModel.outputs) {
        for (const label of output.labels) {
          if (label.name) {
            if (!outputLabels.includes(label.name)) { outputLabels.push(label.name); }
          }
        }
      }

      this.d.selectedModel.layers[0].options.inputs = inputLabels;
      this.d.selectedModel.layers[this.d.selectedModel.layers.length - 1].options.outputs = outputLabels;


      this.createTensors().then(() => {
        if (this.d.selectedModel.model) {
          this.tensorflowService.updateProgess('model created', 10);
          this.d.processing = false;

          if (forwardOnSucces) {
            this.tensorflowService.createModel.next(1);
          }
          console.log(this.d.selectedModel.model);
        }
      }).catch(e => {
        this.handleError(e);
      });

      // const data = this.createJSONfromDataSet(this.d.dataSets, true);

      // (this.document.getElementById('deploy') as HTMLButtonElement).disabled = true;

    }

  }





  async createJSONfromDataSet(dataSets: Array<DataSet>) {

    console.log(dataSets);

    this.tensorflowService.updateProgess('collecting data', 15);

    const data = { xs: [], ys: [], trainingType: [] };
    let dataSize = 0;

    dataSets.forEach(set => {

      let outputs = [];
      for (const output of set.outputs) {
        // let outputEl = [];
        if (output.label.id) {

          for (const classifier of this.d.selectedModel.outputs) {
            if (classifier.active && classifier.id === output.classifier_id) {
              for (let i = 0; i < classifier.labels.length; i++) {
                classifier.labels[i].id === output.label.id ? outputs.push(1) : outputs.push(0);
              }
            }
            // outputs.push(outputEl);
          }


          if (outputs.length === 0) {
            this.d.processing = false;
            this.tensorflowService.updateProgess('cannot find outputs', 0);
            this.document.body.style.cursor = 'default';
            return false;
          }
        }
      }

      let m = 0;

      set.m.forEach(motor => {
        let inputArray = [];
        let i = 0;
        let n = 0 + dataSize;

        if (motor.d.length > 0) {

          for (const d of motor.d) {
            const inputs = [];
            for (const input of d.inputs) {
              const input_variable = this.d.selectedModel.inputs.filter(i => i.name === input.name)[0];
              if (input_variable && input_variable.active) {
                inputs.push(input.value);
              }
            }
            if (m !== 0 && data.xs[n]) {
              if (data.xs[n][i]) {
                data.xs[n][i].push(inputs);
              }
            } else {
              inputArray.push([inputs]); // [inputs]
            }

            i++;

            if (i > motor.d.length - 1 || i > this.d.selectedModel.layers[0].options.inputLength.value) { //inputLength //this.d.selectedModel.layers[0].options.batchSize.value
              if (m === 0) {
                data.xs.push(inputArray);
                data.ys.push(outputs);
                data.trainingType.push(set.trainingType);
              } else {
                n++;
              }
              i = 0;
              inputArray = [];
            }
          }
        }
        m++;
      });

      dataSize = data.xs.length;
    });


    return data;
  }



  getInputShapeModel()  {
    let motors = this.tensorflowService.getNrOfActiveMotors();
    const inputs = this.tensorflowService.getNrOfActiveInputs();
    const channels = 1;

    if (motors === 0) { motors++; }

    let shape: Array<number>;

    if (this.d.selectedModel.layers[1].type.subgroup === 'convolutional') {
      shape = this.d.selectedModel.layers[0].options.inputDimension === 1 ? [channels, motors * inputs] : [channels, inputs, motors];
    } else {
      shape = this.d.selectedModel.layers[0].options.inputDimension === 1 || motors === 1 ?
            [inputs, this.d.selectedModel.layers[0].options.inputLength.value * motors] : [this.d.selectedModel.layers[0].options.inputLength.value, motors, inputs];
    }

    console.log(shape);

    return shape;
    // return [motors, inputs]; //model.layers[0].options.inputLength.value,
  }


  getOutputShapeModel() {
    const outputLayer = this.d.selectedModel.layers[this.d.selectedModel.layers.length - 1];
    console.log(outputLayer);
    return [ null, outputLayer.options.outputs.length ];
  }


  async createTensors() {

    this.d.selectedModel.model = tf.sequential();
    this.d.selectedModel.model.name = this.d.selectedModel.name;


    const outputShape = this.getOutputShapeModel();
    console.log(outputShape);
    // const outputShape = [58, 2];

    // console.log(inputShape, outputShape);
    let index = 0;

    for (const layer of this.d.selectedModel.layers) {
      let layerItem = null;

      // console.log(index, layer);

      if (index === 0) {

        layerItem = tf.layers.inputLayer({
          batchSize: layer.options.batchSize && layer.options.batchSize.value !== null ? layer.options.batchSize.value : null,
          inputShape: this.getInputShapeModel(),
          sparse: layer.options.sparse.value
        });

      } else if (index === this.d.selectedModel.layers.length - 1) {
        layerItem = tf.layers.dense({
          name: 'output',
          units: outputShape[1],
          activation: layer.options.activation.value,
          // inputShape: this.d.selectedModel.layers[0].options.inputLength && this.d.selectedModel.layers[0].options.inputLength.value ? [ this.d.selectedModel.layers[0].options.inputLength.value ] : undefined
        });


      } else if (index > 0 && layer.type) {

        // console.log(layer.type);

        layerItem = layer.type.tf({
            name: layer.name + '-' + index,
            trainable: layer.options.trainable,
            units: layer.options.units && layer.type.subgroup !== 'normalization' ? layer.options.units.value : undefined,
           // inputShape: index === 1 ? inputShape : undefined,
           // batchSize: index === 1 && this.d.selectedModel.layers[0].options.batchSize && this.d.selectedModel.layers[0].options.batchSize.value !== null ? this.d.selectedModel.layers[0].options.batchSize.value : undefined,
            //inputLength: index === 1 && this.d.selectedModel.layers[0].options.inputLength && this.d.selectedModel.layers[0].options.inputLength.value ? this.d.selectedModel.layers[0].options.inputLength.value : undefined,

            filters: layer.options.filters ? layer.options.filters.value : undefined,
            padding: layer.options.padding && layer.options.padding.value !== 'none' ? layer.options.padding.value : undefined,
            useBias: layer.options.useBias ? layer.options.useBias.value : undefined,

            dataFormat: layer.options.dataFormat ? layer.options.dataFormat.value : undefined,
            inputDim: layer.options.inputDim ? layer.options.inputDim.value : undefined,
            outputDim: layer.options.outputDim ? layer.options.outputDim.value : undefined,
            rate: layer.options.rate ? layer.options.rate.value : undefined,
            seed: layer.options.seed ? layer.options.seed.value : undefined,
            targetShape: layer.options.targetShape ? layer.options.targetShape.value : undefined,

            //weights:,

            kernelSize: layer.options.kernelSize ? layer.options.kernelSize.value.length > 1 ? layer.options.kernelSize.value : layer.options.kernelSize.value[0] : undefined,
            poolSize:   layer.type.subgroup === 'pooling' ? layer.options.poolSize && layer.options.poolSize.value.length > 1 ? layer.options.poolSize.value : layer.options.poolSize.value[0] : undefined,

            strides:      layer.options.strides ? layer.options.strides.value.length > 1 ? layer.options.strides.value : layer.options.strides.value[0] : undefined,
            dilationRate: layer.options.dilationRate ? layer.options.dilationRate.value.length > 1 ? layer.options.dilationRate.value : layer.options.dilationRate.value[0] : undefined,

            biasInitializer: layer.options.biasInitializer && layer.options.biasInitializer.value.name !== 'none' ?
                             layer.options.biasInitializer.value.initializer(layer.options.biasInitializer.value.args) : undefined,
            biasConstraint:  layer.options.biasConstraint && layer.options.biasConstraint.value !== 'none' ? layer.options.biasConstraint.value : undefined,
            biasRegularizer: layer.options.biasRegularizer && layer.options.biasRegularizer.value.name !== 'none' ?
                             layer.options.biasRegularizer.value.regularizer(layer.options.biasRegularizer.value.config) : undefined,

            kernelInitializer: layer.options.kernelInitializer && layer.options.kernelInitializer.value.name !== 'none' ?
                               layer.options.kernelInitializer.value.initializer(layer.options.kernelInitializer.value.args) : undefined,
            kernelConstraint:  layer.options.kernelConstraint && layer.options.kernelConstraint.value !== 'none' ? layer.options.kernelConstraint.value : undefined,
            kernelRegularizer: layer.options.kernelRegularizer && layer.options.kernelRegularizer.value.name !== 'none' ?
                               layer.options.kernelRegularizer.value.regularizer(layer.options.kernelRegularizer.value.config) : undefined,

            depthwiseInitializer: layer.options.depthwiseInitializer && layer.options.depthwiseInitializer.value.name !== 'none' ?
                                  layer.options.depthwiseInitializer.value.initializer(layer.options.depthwiseInitializer.value.args) : undefined,
            depthwiseConstraint:  layer.options.depthwiseConstraint && layer.options.depthwiseConstraint.value !== 'none' ? layer.options.depthwiseConstraint.value : undefined,
            depthwiseRegularizer: layer.options.depthwiseRegularizer && layer.options.depthwiseRegularizer.value.name !== 'none' ?
                                  layer.options.depthwiseRegularizer.value.regularizer(layer.options.depthwiseRegularizer.value.config) : undefined,

            pointwiseInitializer: layer.options.pointwiseInitializer && layer.options.pointwiseInitializer.value.name !== 'none' ?
                                  layer.options.pointwiseInitializer.value.initializer(layer.options.pointwiseInitializer.value.args) : undefined,
            pointwiseConstraint:  layer.options.pointwiseConstraint && layer.options.pointwiseConstraint.value !== 'none' ? layer.options.pointwiseConstraint.value : undefined,
            pointwiseRegularizer: layer.options.pointwiseRegularizer && layer.options.pointwiseRegularizer.value.name !== 'none' ?
                                  layer.options.pointwiseRegularizer.value.regularizer(layer.options.pointwiseRegularizer.value.config) : undefined,

            activation: layer.options.activation ? layer.options.activation.value : undefined,
            activityRegularizer:  layer.options.activityRegularizer && layer.options.activityRegularizer.value.name !== 'none' ?
                                  layer.options.activityRegularizer.value.regularizer(layer.options.activityRegularizer.value.config) : undefined,

            recurrentActivation: layer.options.recurrentActivation ? layer.options.recurrentActivation.value : undefined,

            unitForgetBias: layer.options.unitForgetBias ? layer.options.unitForgetBias.value : undefined,

            returnSequences: layer.options.returnSequences ? layer.options.returnSequences.value : undefined,
            returnState: layer.options.returnState ? layer.options.returnState.value : undefined,
            goBackwards: layer.options.goBackwards ? layer.options.goBackwards.value : undefined,
            stateful: layer.options.stateful ? layer.options.stateful.value : undefined,
            dropout: layer.options.dropout ? layer.options.dropout.value : undefined,
            recurrentDropout: layer.options.recurrentDropout ? layer.options.recurrentDropout.value : undefined,
            unroll: layer.options.unroll ? layer.options.unroll.value : undefined,
            n: layer.options.n? layer.options.n.value : undefined,
            implementation: layer.options.implementation ? layer.options.implementation.value : undefined,

            //dropoutFunc

            recurrentInitializer: layer.options.recurrentInitializer && layer.options.recurrentInitializer.value.name !== 'none' ?
                                  layer.options.recurrentInitializer.value.initializer(layer.options.recurrentInitializer.value.args) : undefined,
            recurrentConstraint:  layer.options.recurrentConstraint && layer.options.recurrentConstraint.value !== 'none' ? layer.options.recurrentConstraint.value : undefined,
            recurrentRegularizer: layer.options.recurrentRegularizer && layer.options.recurrentRegularizer.value.name !== 'none' ?
                                  layer.options.recurrentRegularizer.value.regularizer(layer.options.recurrentRegularizer.value.config) : undefined
          });

      }

      console.log(layerItem);

      if (layerItem) {
        const success = this.addLayer(layerItem);

        if (!success) {
          this.document.body.style.cursor = 'default';
          this.d.selectedModel.model = null;
          this.d.processing = false;
          return false;
        }
      }


      index++;
    }
    this.document.body.style.cursor = 'default';
  }


  addLayer(layer: Layer):boolean {
    try {
      this.d.selectedModel.model.add(layer);
      return true;
    }
    catch(e: any) {
      this.handleError(e);
      return false;
    }

  }




  async processData() {

    this.document.body.style.cursor = 'wait';

    const data = await this.createJSONfromDataSet(this.d.dataSets);

    const reshapedxArray = await this.transformArray(data.xs, this.getInputShapeModel());

    console.log(reshapedxArray);

    this.createPredictionModel.next(true);
    this.tensorflowService.updateProgess('Create training and validation sets', 20);

    const [trainingSet,validationSet] = await this.splitTrainingData({ xs: reshapedxArray, ys: data.ys, trainingType: data.trainingType }, this.d.selectedModel.layers[0].options.batchSize.value);


    const model = await this.trainModel(trainingSet, validationSet);

    if (model) {
      model.summary();
    }

  }


  async transformArray(inputArray: Array<any>, shape: Array<number>) {
    // Convert the input array to a tensor
    const inputTensor = tf.tensor(inputArray); // Shape: [n, 6, 3, 2]

    // Reshape the tensor from [n, 6, 3, 2] to [n, 18, 2]
    const reshapedTensor = inputTensor.reshape([-1, ...shape]);

    // Convert the reshaped tensor back to a JavaScript array
    const outputArray = reshapedTensor.arraySync();

    return outputArray;
  }




  async trainModel(trainDs: any, validationDs: any) {

    const optimizer = await this.createOptimizer();

    await this.compileModel(optimizer);

    this.tensorflowService.updateProgess('start training', 25);

    // const reshapedTrainingDataset = this.reshapeDataset(trainDs);
    // const reshapedValidationDataset = this.reshapeDataset(validationDs);

    await this.fitDatasetToModel(trainDs, validationDs);

    // await this.fitModel(trainDs, validationDs, batchSize);

    return this.d.selectedModel.model;

  }



  async createTensor(data: Array<any>) {
    try {
      const tensor = tf.tensor(data);
      console.log(tensor);
      return tensor;
    }
    catch(e: any) {
      this.handleError(e);
      return;
    }
  }


  async reshapeTensor(_tensor: tf.Tensor, shape: any) {
    try {
      const tensor = tf.reshape(_tensor, shape);
      console.log(tensor);
      return tensor;
    }
    catch(e: any) {
      this.handleError(e);
      return;
    }
  }

  async fitModel(trainDs: any, validationDs: any, batchSize: number) {

    console.log(trainDs.xs.length, trainDs.xs[0].length, trainDs.xs[0][0].length)

    // const iTensor = await this.createTensor(trainDs.xs);
    // const reshapediTensor = iTensor.reshape([trainDs.xs.length, ...this.getInputShapeModel()]);
    // console.log(reshapediTensor);
    // const oTensor = await this.createTensor(trainDs.ys);

    const numSamples = trainDs.xs.length;
    const iTensor = tf.tensor(trainDs.xs, [numSamples, trainDs.xs[0].length, trainDs.xs[0][0].length, trainDs.xs[0][0][0].length]);
    const oTensor = tf.tensor(trainDs.ys, [numSamples, trainDs.ys[0].length]);
    let inputTensor = tf.reshape(iTensor, [numSamples, trainDs.xs[0][0][0].length, (trainDs.xs[0][0].length * trainDs.xs[0].length) ]);
    // const reshapedoTensor = oTensor.reshape([trainDs.ys.length, (trainDs.ys[0].length * trainDs.ys[0][0].length)]);
    let outputTensor = tf.expandDims(oTensor);
    // const reshapediTensor =  await this.reshapeTensor(iTensor, [trainDs.xs[0].length, trainDs.xs[0][0].length]);
    // console.log(reshapediTensor);
    // const reshapedoTensor =  await this.reshapeTensor(oTensor, [trainDs.xs[0].length, trainDs.xs[0][0].length]);
    // console.log(reshapedoTensor);



    this.train(inputTensor, outputTensor, validationDs, this.d.selectedModel.training.epochs, batchSize).then(() => {
      console.log('training is complete');

      (this.document.getElementById('deploy') as HTMLButtonElement).disabled = false;

      this.document.body.style.cursor = 'default';

      this.d.processing = false;

      inputTensor.dispose();
      outputTensor.dispose();

      console.log("memory " + tf.memory().numTensors);

    }).catch(e => {
      this.handleError(e);
    });
  }

  handleError(e: any) {
    const error = (e as Error).message;
    console.log(error);
    this.document.body.style.cursor = 'default';
    this.d.processing = false;
    this.tensorflowService.updateProgess(error, 0);
  }


  async fitDatasetToModel(trainDs: any, validationDs: any) {

    const logFile = this.createLogFile();

    try {
      this.d.selectedModel.model.fitDataset(trainDs, {
        epochs: this.d.selectedModel.training.epochs,
        validationData: validationDs,
        validationBatchSize: 1,
        callbacks: {
          onEpochEnd: async(epoch: any, logs: any) => {

            console.log(logs);
            const metric = this.getMetric(logs);
            logFile.data.push({ log: { loss: logs.loss, val_loss: logs.val_loss, metric: metric.training, val_metric: metric.validation, text_metric: metric.text }, epoch: epoch});
            this.tensorflowService.updateProgess('Training: loss = ' + logs.loss + '' + (metric ? metric.text + metric.training : ' '), ((75/this.d.selectedModel.training.epochs) * epoch) + 25,
              { e: epoch, metric: metric, loss: logs.loss });
            this.updateTrainingGraph.next(epoch);
          },
          onTrainEnd: async(logs: any) => {
            this.tensorflowService.updateProgess('Training complete.', 100);
            this.document.body.style.cursor = 'default';
          }

        }
      });
    }
    catch(e: any) {
      console.log('error fitting dataset');
      this.handleError(e);
      this.d.trainingData.slice(-1);
      this.selectLogFile.next(this.d.trainingData[this.d.trainingData.length - 1].id);
    }
  }


  createLogFile() {
    const logFile = new TrainingSet(uuid(), 'Training logs ' + (this.d.trainingData.length + 1))
    this.d.trainingData.push(logFile);
    this.selectLogFile.next(logFile.id);

    return logFile;
  }




  getMetric(logs: any) {
    return logs.categoricalAccuracy !== undefined ? { text: ', categorical accuracy: ', training: logs.categoricalAccuracy, validation: logs.val_categoricalAccuracy } :
           logs.precision !== undefined ? { text: ', precision: ', training: logs.precision, validation: logs.val_precision } :
           logs.meanAbsoluteError !== undefined ? { text: ', mean absolute error: ', training: logs.meanAbsoluteError, validation: logs.val_meanAbsoluteError } :
           logs.meanAbsolutePercentageError !== undefined ? { text: ', mean absolute percentage error: ', tranining: logs.meanAbsolutePercentageError, validation: logs.val_meanAbsolutePercentageError } :
           logs.recall !== undefined ? { text: ', recall: ',  training: logs.recall, validation: logs.val_recall } :
           logs.cosineProximity !== undefined ? { text: ', cosine proximity: ', training: logs.cosineProximity, validation: logs.cosineProximity } :
           logs.binaryCrossentropy !== undefined ? { text: ', binary crossentropy: ', training: logs.binaryCrossentropy, validation: logs.val_binaryCrossentropy } :
           logs.categoricalCrossentropy !== undefined ? { text: ', categorical crossentropy: ', training: logs.categoricalCrossentropy, validation: logs.val_categoricalCrossentropy } :
           logs.meanSquaredError !== undefined ? { text: ', mean squared error: ', training: logs.meanSquaredError, validation: logs.val_meansSquaredError } :
           logs.acc !== undefined ? { text: ', accuracy: ', training: logs.acc, validation: logs.val_acc } :
           { text: '', training: null, validation: null };
 }


 async splitTrainingData(data: { xs: any, ys: any, trainingType: Array<any> }, batchSize: number) {

    let trainingData = { xs: [], ys: [] };
    let validationData = { xs: [], ys: [] };



    let index = 0;

    for (const type of data.trainingType) {
      if (type === TrainingType.training) {
        trainingData.xs.push(data.xs[index]);
        trainingData.ys.push(data.ys[index]);
      } else if (type === TrainingType.validation) {
        validationData.xs.push(data.xs[index]);
        validationData.ys.push(data.ys[index]);
      }
      index++;
    }

    // const inputTensor = tf.tensor(trainingData.xs);
    // const outputTensor = tf.tensor(trainingData.ys);
    // const iSize = tf.util.sizeFromShape(inputTensor.shape);
    // const oSize = tf.util.sizeFromShape(outputTensor.shape);

    // if (iSize !== oSize) {
    //   console.log(iSize, oSize);
    // }

    batchSize = batchSize !== null && batchSize !== 0 ? batchSize : 1;



    const trainingDataset = tf.data.zip({
      xs: tf.data.array(trainingData.xs),
      ys: tf.data.array(trainingData.ys)
    });
    // .shuffle(trainingData.xs.length);

    const validationDataset = tf.data.zip({
      xs: tf.data.array(validationData.xs),
      ys: tf.data.array(validationData.ys)
    });
    //.shuffle(validationData.xs.length);

    return [trainingDataset.batch(batchSize), validationDataset.batch(batchSize)];


}



  // async createDatasets(xs: Array<any>, ys: Array<any>, distribution: number, batchSize: number) {


  //   const dataset = tf.data.zip({
  //     xs: tf.data.array(xs),
  //     ys: tf.data.array(ys)
  //   })
  //   .shuffle(xs.length);


  //  // .reshape(null, xs.length, xs[0].length * xs[0][0].length);
  //   batchSize = batchSize !== null && batchSize !== 0 ? batchSize : 1;

  //   const splitIndex = Math.round((1 - distribution) * xs.length);

  //   return [dataset.take(splitIndex).batch(batchSize),
  //           dataset.skip(splitIndex + 1).batch(batchSize)];
  // }



  NN_Deploy(input: any, selectedModel: any) {

    // this.serialPath = path;
    // console.log('predict');
    // console.log(input);

    if (selectedModel.type !== 'Regression') {
      const iTensor = tf.tensor(input);
      const inputTensor = tf.reshape(iTensor, [input.length, input[0][0][0].length, (input[0][0].length * input[0].length) ]);
     // console.log(iTensor, inputTensor);
      const outputs = this.d.selectedModel.multiple ? this.d.selectedModel.model.predictOnBatch(inputTensor) : this.d.selectedModel.model.predict(inputTensor);
      // console.log(outputs);
      const prediction = Array.from((outputs as any).dataSync());
      // console.log(prediction);
      this.updatePredictionClassifiers(prediction);

      if (this.d.ML_OutputData.length > 0) {
        this.d.ML_OutputData[this.d.ML_OutputData.length - 1].data.push({ p: prediction, i: input });
        this.d.ML_OutputData[this.d.ML_OutputData.length - 1].classifier = this.d.selectedModel.outputs.filter(o => o.active)[0].labels;
      }

      iTensor.dispose();
    }
  }


  updatePredictionClassifiers(results: Array<any>) {
    // console.log(this.d.selectedModel.outputs);
    for (const classifier of this.d.selectedModel.outputs) {
      let i  = 0;
      for (const label of classifier.labels) {
        // console.log(label);
        label.confidence = results[i];
        (this.document.getElementById('bar-' + classifier.id + '-' + label.id) as HTMLElement).style.width = (label.confidence * 100) + '%';
        (this.document.getElementById('confidence-' + classifier.id + '-' + label.id) as HTMLElement).innerHTML = (label.confidence * 100).toFixed(2) + '%';

        i++;
      }
    }
  }

  async createOptimizer() {
    try {
      if (this.d.selectedModel.training.optimizer.value instanceof Function) {

        const optimizerFunction = this.d.selectedModel.training.optimizer.name === 'momentum' ?
        this.d.selectedModel.training.optimizer.value(this.d.selectedModel.training.learningRate, this.d.selectedModel.training.momentum) :
        this.d.selectedModel.training.optimizer.value(this.d.selectedModel.training.learningRate);

        console.log(this.d.selectedModel.training.optimizer.value);
        this.tensorflowService.updateProgess('optimizer created', 20);

        return optimizerFunction;
      }
    }
    catch(e: any) {
      console.log('error creating optimizer');
      this.handleError(e);
      return;
    }
  }

  async compileModel(optimizer: any) {
    try {

      if (this.d.selectedModel.model) {

        this.d.selectedModel.model.compile({
          optimizer: optimizer,
          loss: this.d.selectedModel.training.losses.name,
          metrics: [ this.d.selectedModel.training.metrics.value ]
        });

        this.tensorflowService.updateProgess('compiled successfully', 22);
      }
    }
    catch(e: any) {
      console.log('error compiling');
      this.handleError(e);
      return;
    }


  }


  // trainModelOnData(inputTensor: any, outputTensor: any) {
  //   const optimizerFunction = this.d.selectedModel.training.optimizer.name === 'momentum' ?
  //       this.d.selectedModel.training.optimizer.value(this.d.selectedModel.training.learningRate, this.d.selectedModel.training.momentum) :
  //       this.d.selectedModel.training.optimizer.value(this.d.selectedModel.training.learningRate);

  //   this.d.selectedModel.model.compile({
  //     optimizer: optimizerFunction,
  //     loss: this.d.selectedModel.training.losses.value,
  //     metrics: [ this.d.selectedModel.training.metrics.value ]
  //   });
  //   console.log(this.d.selectedModel.training);
  //   console.log(this.d.selectedModel.model);


  //   this.tensorflowService.updateProgess('start training', 25);


  //   this.train(inputTensor, outputTensor, this.d.selectedModel.training.epochs, this.d.selectedModel.layers[0].options.batchSize.value).then(() => {
  //     console.log('training is complete');

  //     (this.document.getElementById('deploy') as HTMLButtonElement).disabled = false;

  //     this.document.body.style.cursor = 'default';

  //     this.d.processing = false;

  //     inputTensor.dispose();
  //     outputTensor.dispose();

  //     console.log("memory " + tf.memory().numTensors);

  //   });
  // }


  async train(iTensor: any, oTensor: any, validationDs: any, epochs: any, batchSize: number) {


    const logFile = this.createLogFile();

    await this.d.selectedModel.model.fit(iTensor, oTensor, {
      verbose: true,
      shuffle: true,
      batchSize: batchSize,
      epochs: epochs,
      // validationData: [validationDs.xs, validationDs.ys],
      callbacks: {
        onEpochEnd: async(epoch: any, logs: any) => {
          const metric = this.getMetric(logs);
          logFile.data.push({ log: { loss: logs.loss, val_loss: logs.val_loss, metric: metric.training, val_metric: metric.validation, text_metric: metric.text }, epoch: epoch});
          this.tensorflowService.updateProgess('Training: loss = ' + logs.loss + '' + (metric ? metric.text + metric.training : ' '), ((75/this.d.selectedModel.training.epochs) * epoch) + 25,
            { e: epoch, metric: metric, loss: logs.loss });
          this.updateTrainingGraph.next(epoch);
        },
        onTrainEnd: async(logs: any) => {
          console.log(logs);
          this.tensorflowService.updateProgess('Training complete.', 100);
        }

      }

      // if (i < epochs - 1) {
      //   if (i % 10 === 0) {
      //     console.log(response.history);
      //     // const metric = this.getMetric(response.history);
      //     // this.tensorflowService.updateProgess('training: loss = ' + response.history.loss[0] + '' + (metric ? metric : ''), ((75/epochs) * i) + 25, { e: epochs, metric: metric[0], loss: response.history.loss[0] });
      //     // this.updateTrainingGraph.next(epochs);
      //   }
      // } else {
      //   const metric = this.getMetric(response.history);
      //   this.tensorflowService.updateProgess('finished training: ' + response.history.loss[0] + '' + metric, 100,  { e: epochs, metric: metric[0], loss: response.history.loss[0] });
      //   return this.d.selectedModel.model;
      // }
    });
  }







  // async train(iTensor: any, oTensor: any, epochs: any, batchSize: number) {
  //   console.log(iTensor, oTensor);

  //   for (let i = 0; i < epochs; i++) {
  //     const response = await this.d.selectedModel.model.fit(iTensor, oTensor, {
  //       verbose: true,
  //       shuffle: true,
  //       batchSize: batchSize,
  //       epochs: 1
  //     });
  //     if (i < epochs - 1) {
  //       if (i % 10 === 0) {
  //         console.log(response.history);
  //         const metric = this.getMetric(response.history);
  //         this.tensorflowService.updateProgess('training: loss = ' + response.history.loss[0] + '' + (metric ? metric : ''), ((75/epochs) * i) + 25, { e: epochs, metric: metric[0], loss: response.history.loss[0] });
  //         this.updateTrainingGraph.next(epochs);
  //       }
  //     } else {
  //       const metric = this.getMetric(response.history);
  //       this.tensorflowService.updateProgess('finished training: ' + response.history.loss[0] + '' + metric, 100,  { e: epochs, metric: metric[0], loss: response.history.loss[0] });
  //       return this.d.selectedModel.model;
  //     }
  //   }
  // }






  async createTensorsOld(modelObj: Model) {


    this.d.selectedModel.model = tf.sequential();

    this.createPredictionModel.next(true);

    this.d.selectedModel.model.name = modelObj.name;

    this.tensorflowService.updateProgess('model created', 10);

    const data = await this.createJSONfromDataSet(this.d.dataSets);


    if (data.xs && data.ys) {
      console.log(data);

      const inputShape =  [null, data.xs[0][0][0].length, (data.xs[0][0].length * data.xs[0].length) ];
      // const inputShape = this.getInputShapeModel(this.d.selectedModel);

      const outputShape = [null, data.ys[0].length];

      console.log(inputShape);

      const numSamples = data.xs.length;
      const iTensor = tf.tensor(data.xs, [numSamples, data.xs[0].length, data.xs[0][0].length, data.xs[0][0][0].length]);
      const outputTensor = tf.tensor(data.ys, [numSamples, data.ys[0].length]);
      let inputTensor = tf.reshape(iTensor, [numSamples, data.xs[0][0][0].length, (data.xs[0][0].length * data.xs[0].length) ]);

      console.log(inputTensor);
      let i = 0;
      for(const layer of modelObj.layers) {

        let hiddenLayer;

        if (modelObj.type === ModelType.CNN) {

          hiddenLayer = tf.layers.dense({
            name: layer.name + '' + i,
            units: layer.options.units, //data.xs[0][0][0].length
            inputShape: inputShape.slice(1), // [ number of inputs, batch size ]
            activation: layer.options.activation, // make activation function adjustable in model settings
            kernelRegularizer: layer.options.kernelRegularizer.regularizer,
          });
        } else if (modelObj.type === ModelType.RNN) {

          hiddenLayer = tf.layers.simpleRNN({
            units: (data.xs[0][0].length * data.xs[0].length), //data.xs[0][0][0].length
            inputShape: inputShape.slice(1), // [ batchsize, timesteps ]
            activation: layer.options.activation, // make activation function adjustable in model settings
            returnSequences: i < layer.options.layers - 1 ? layer.options.returnSequences : false,
            kernelRegularizer: layer.options.kernelRegularizer.regularizer,
            inputLength: layer.options.trainingOptions.batchSize
          });

        }
        //  else if (modelObj.type === ModelType.LSTM) {

        //   hiddenLayer = tf.layers.lstm({
        //     units: (data.xs[0][0].length * data.xs[0].length), //data.xs[0][0][0].length
        //     inputShape: inputShape.slice(1),// [ number of inputs, batch size ]
        //     recurrentActivation: this.d.selectedModel.options.activation,
        //     activation: this.d.selectedModel.options.activation, // make activation function adjustable in model settings
        //     returnSequences: layer < this.d.selectedModel.options.hiddenLayers - 1 ? this.d.selectedModel.options.returnSequences : false,
        //     kernelRegularizer: this.d.selectedModel.options.kernelRegularizer.regularizer,
        //     implementation: this.d.selectedModel.options.implementation
        //   });

          //console.log(hiddenLayer);

        // }
        // else if (modelObj.type === ModelType.GRU) {

        //   hiddenLayer = tf.layers.gru({
        //     units: (data.xs[0][0].length * data.xs[0].length), //data.xs[0][0][0].length
        //     inputShape: inputShape.slice(1), // [ number of inputs, batch size ]
        //     activation: this.d.selectedModel.options.activation, // make activation function adjustable in model settings
        //     returnSequences: layer < this.d.selectedModel.options.hiddenLayers - 1 ? this.d.selectedModel.options.returnSequences : false,
        //     kernelRegularizer: this.d.selectedModel.options.kernelRegularizer.regularizer,
        //     implementation: this.d.selectedModel.options.implementation
        //   });
        // }

        this.d.selectedModel.model.add(hiddenLayer);

        if (layer.options.batchNormalization) {
          const batchNormalizationLayer = tf.layers.batchNormalization();
          this.d.selectedModel.model.add(batchNormalizationLayer);
        }

        if (layer.options.dropout !== 0) {
          this.d.selectedModel.model.add(tf.layers.dropout({ rate: layer.options.dropout }));
        }
        console.log(this.d.selectedModel);
        // this.selectedModel.model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
      }


      if (this.d.selectedModel.type === ModelType.CNN) {
        this.d.selectedModel.model.add(tf.layers.flatten());
      }
      //add output layer
      const outputLayer = tf.layers.dense({
        units: outputShape[1],
        activation: this.d.selectedModel.layers[this.d.selectedModel.layers.length - 1].options.activation
      });

      this.d.selectedModel.model.add(outputLayer);



      // const optimizerFunction = this.d.selectedModel.training.optimizer.name === 'momentum' ?
      //     this.d.selectedModel.training.optimizer.value(this.d.selectedModel.training.learningRate, this.d.selectedModel.training.momentum) :
      //     this.d.selectedModel.training.optimizer.value(this.d.selectedModel.training.learningRate);

      // this.d.selectedModel.model.compile({
      //   optimizer: optimizerFunction,
      //   loss: this.d.selectedModel.training.losses.value,
      //   metrics: [ this.d.selectedModel.training.metrics.value ]
      // });
      // console.log(this.d.selectedModel.training);
      // console.log(this.d.selectedModel.model);
      // this.d.selectedModel.model.normalizeData();

      this.tensorflowService.updateProgess('start training', 25);




      // this.train(inputTensor, outputTensor, this.d.selectedModel.training.epochs, this.d.selectedModel.layers[0].options.batchSize).then(() => {
      //   console.log('training is complete');

      //   (this.document.getElementById('deploy') as HTMLButtonElement).disabled = false;

      //   this.document.body.style.cursor = 'default';

      //   this.d.processing = false;

      //   inputTensor.dispose();
      //   outputTensor.dispose();

      //   console.log("memory " + tf.memory().numTensors);

      // });

    } else {
      this.tensorflowService.updateProgess('no data found, training canceled', 0);
      this.d.processing = false;

      this.document.body.style.cursor = 'default';

      return false;
    }
  }









    // handleRegressionResults = ((error: any, result: any) => {
    //   if(error){
    //     this.updateProgess(error, 0);
    //     this.d.classify = false;
    //     console.error(error);
    //     return;
    //   }
    //   for (const output of this.d.selectedModel.outputs) {
    //     for (const label of output.labels) {
    //       const result_label = result.filter((r: { label: string; }) => r.label == label.name)[0];
    //       // label.prediction = result_label.;
    //       // this.document.getElementById('bar-' + output.name + '-' + label.name).style.width = (label.prediction * 100) + '%';
    //       // this.document.getElementById('confidence-' + output.name + '-' + label.name).innerHTML = (label.prediction  * 100).toFixed(2) + '%';
    //     }
    //   }
    // }).bind(this);


    //   let filterArray = [];
    //   let n = 0;

    //   for (const filter of this.d.selectedModel.filters) {
    //     const classifier = this.d.selectedModel.outputs.filter(o => o.name === filter.classifier.name)[0];
    //     if (classifier && classifier.labels.length > 0) {
    //       const highestConfidenceLabel = this.getHighestConfidenceLabel(classifier);
    //       // console.log(highestConfidenceLabel.name);
    //       let index = classifier.labels.indexOf(highestConfidenceLabel);

    //       if (index > -1) {


    //         if ((filter.type.name === 'amplify' || filter.type.name === 'constrain') && filter.functionVariable.value[index] !== filter.functionVariable.prevValue) {

    //           let filterObj = { type: filter.type.slug, value: filter.functionVariable.value[index], smoothness: filter.type.interpolate };
    //           filterArray.push(filterObj);

    //           filter.functionVariable.prevValue = filter.functionVariable.value[index];

    //         } else if (filter.type.name === 'noise') {

    //           const newRandom = (Math.floor(Math.random() * ((filter.functionVariable.value[index] * 100) * 2)) - (filter.functionVariable.value[index] * 100)) / 100;
    //           let filterObj = { type: filter.type.slug, value: newRandom, smoothness: filter.type.interpolate };

    //           filterArray.push(filterObj);
    //         }
    //       }
    //     }
    //     if (n === this.d.selectedModel.filters.length - 1) {
    //       if (filterArray.length > 0) {
    //         // console.log('update filter');
    //         const microcontroller = this.d.selectedMicrocontrollers.filter(m => m.serialPort.path === this.serialPath)[0];
    //         if (microcontroller) {
    //           const filterModel = new FilterModel(filterArray, microcontroller);
    //           // console.log(filterModel);
    //           this.electronService.ipcRenderer.send('updateFilter', filterModel);
    //         }
    //       }
    //     }
    //     n++;
    //   }

    // }).bind(this);



    // getHighestConfidenceLabel(classifier: Classifier): Label {
    //   let maxConfidence = classifier.labels[0];
    //   for (const label of classifier.labels) {
    //     if (label.confidence > maxConfidence.confidence) {
    //       maxConfidence = label;
    //     }
    //   }
    //   return maxConfidence;
    // }

}
