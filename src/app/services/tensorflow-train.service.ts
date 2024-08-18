import { Injectable, Inject } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { TensorFlowData } from '../models/tensorflow-data.model';
import { Bounds, DataSet, Layer, MLDataSet, Model, ModelType, TrainingSet, TrainingType } from '../models/tensorflow.model';
import { TensorFlowMainService } from './tensorflow-main.service';
import { Subject } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { v4 as uuid } from 'uuid';
import { CloneService } from './clone.service';

@Injectable()
export class TensorFlowTrainService {

  public d: TensorFlowData;


  updateTrainingGraph: Subject<any> = new Subject<void>();
  selectLogFile: Subject<any> = new Subject<void>();

  constructor(@Inject(DOCUMENT) private document: Document, private tensorflowService: TensorFlowMainService, private cloneService: CloneService) {
    this.d = this.tensorflowService.d;

  }

  async predictOutput() {

    if (this.d.selectedMLDataset) {
      let collectData = true;
      let m = 0;

      for (const motor of this.d.selectedMLDataset.m) {
        while(this.d.selectedModel.layers[0].options.inputLength * this.d.selectedModel.training.batchSize <= motor.d.length - 1) { //20
          collectData = false;
        }
        m++;
        console.log(m, this.d.selectedMLDataset.m.length);

        if (m >= this.d.selectedMLDataset.m.length && collectData) {
          console.log(this.d.selectedMLDataset);
          const data = await this.createJSONfromDataSet([this.d.selectedMLDataset]);
          console.log(data);

          await this.NN_Deploy(data);
          this.tensorflowService.createNewMLDataset();
        }
      }
    }
  }


  async NN_Deploy(data: any) {

    if (this.d.selectedModel.model) {


      const [xReshaped, yReshaped] = await this.transformArray(data.xs, null, this.getInputShapeModel(), false);

      let outputs: any;

      if (this.d.selectedModel.training.validationBatchSize > 1) {
        // const [trainingSet,validationSet] = await this.splitTrainingData({ xs: xReshaped, ys: null, trainingType: data.trainingType }, this.d.selectedModel.training.validationBatchSize);

        // console.log(trainingSet);

        outputs = this.d.selectedModel.model.predictOnBatch(xReshaped, {
          verbose: 0,
          batchSize: this.d.selectedModel.training.validationBatchSize
        });
      } else {
        outputs = this.d.selectedModel.model.predict(xReshaped);
      }
      // console.log(outputs);
      const prediction = Array.from((outputs as any).dataSync());

      console.log(prediction, this.d.selectedMLDataset);

      // console.log(prediction);
      this.updatePredictionClassifiers(prediction);




      //add prediction to mlDataset > update confidence levels

      // this.d.selectedMLDataset.outputs.filter()


      // if (this.d.mlOutputData.length > 0) {
        // this.d.selectedMLDataset.m[motorIndex].d = input; //{ p: prediction, i: input }
        // this.d.selectedMLDataset.m[motorIndex].d
        // this.d.selectedMLDataset.classifier = this.d.selectedModel.outputs.filter(o => o.active)[0].labels;
      // }

      xReshaped.dispose();
    }

  }

  updatePredictionClassifiers(results: Array<any>) {
    // console.log(this.d.selectedModel.outputs);
    for (const output of this.d.selectedModel.outputs) {
      let i  = 0;
      if (output.active) {
        for (const label of output.labels) {
          label.confidence = results[i];
          console.log(label);
          (this.document.getElementById('bar-' + output.id + '-' + label.id) as HTMLElement).style.width = (label.confidence * 100) + '%';
          (this.document.getElementById('confidence-' + output.id + '-' + label.id) as HTMLElement).innerHTML = (label.confidence * 100).toFixed(2) + '%';

          i++;
        }
      }
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



  async processingModel(forwardOnSucces = true) {


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

      if (this.d.selectedModel.outputs.length > 0 && this.d.selectedModel.outputs.filter(output => output.active).length === 0) {
        this.d.selectedModel.outputs[0].active = true;
      } else {
        this.tensorflowService.updateProgess('error: no output selected', 0);
        return;
      }
      for (const output of this.d.selectedModel.outputs) {
        if (output.active) {
          for (const label of output.labels) {
            if (label.name) {
              if (!outputLabels.includes(label.name)) { outputLabels.push(label.name); }
            }
          }
        }
      }

      this.d.selectedModel.layers[0].options.inputs = inputLabels;
      this.d.selectedModel.layers[this.d.selectedModel.layers.length - 1].options.outputs = outputLabels;


      this.createTensors().then(() => {
        if (this.d.selectedModel.model) {
          this.tensorflowService.updateProgess('model created', 10);

          if (forwardOnSucces) {
            this.abortProcess();
            this.tensorflowService.createModel.next(1);
          }

          console.log(this.d.selectedModel.model);
        }
      }).catch(e => {
        console.log('error initiliazing model');
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
        let outputEl = [];
        if (output.label.id) {

          for (const classifier of this.d.selectedModel.outputs) {
            if (classifier.active && classifier.id === output.classifier_id) {
              for (let i = 0; i < classifier.labels.length; i++) {
                classifier.labels[i].id === output.label.id ? outputEl.push(1) : outputEl.push(0);
              }
              outputs.push(outputEl);
            }
          }


          if (outputs.length === 0) {
            this.abortProcess('cannot find output data');
            return false;
          }
        }
      }

      let m = 0;

      set.m.forEach(motor => {

        console.log(motor);

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
              if (data.xs[n][i] && inputs.length > 0) {
                data.xs[n][i].push(inputs);
              }
            } else if (inputs.length > 0) {
              inputArray.push([inputs]); // [inputs]
            }

            i++;

            if ((i > motor.d.length - 1 && this.d.selectedModel.layers[0].options.sparse && !this.d.classify) || i >= this.d.selectedModel.layers[0].options.inputLength.value) { //inputLength //this.d.selectedModel.training.batchSize
              if (m === 0) {
                if (inputArray.length > 0 && (this.d.classify || outputs.length > 0)) {
                  data.xs.push(inputArray);
                  data.ys.push(outputs);
                  data.trainingType.push(set.trainingType ? set.trainingType : TrainingType.training);
                }
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
      // shape = this.d.selectedModel.layers[0].options.inputDimension === 1 && motors === 1 ? [this.d.selectedModel.layers[0].options.inputLength.value, motors, inputs] :
      //         this.d.selectedModel.layers[0].options.inputDimension === 1 || motors === 1 ? [this.d.selectedModel.layers[0].options.inputLength.value, inputs * motors] :
      //         [this.d.selectedModel.layers[0].options.inputLength.value, motors, inputs];

      shape = this.d.selectedModel.layers[0].options.inputDimension === 1 ? [this.d.selectedModel.layers[0].options.inputLength.value, motors * inputs] :
        [this.d.selectedModel.layers[0].options.inputLength.value, motors, inputs];

      // let ones = shape.indexOf(1);
      // while (ones > -1) {
      //   shape.slice(ones, 1);
      //   ones = shape.indexOf(1);
      // }
      // console.log(shape);
      // this.d.selectedModel.layers[0].options.inputDimension === 1 && motors === 1 ? [this.d.selectedModel.layers[0].options.inputLength.value, motors, inputs] :
      //         this.d.selectedModel.layers[0].options.inputDimension === 1 || inputs === 1 ? [this.d.selectedModel.layers[0].options.inputLength.value * motors * inputs] :
      //         this.d.selectedModel.layers[0].options.inputDimension === 1 || motors === 1 ? [inputs, this.d.selectedModel.layers[0].options.inputLength.value * motors] :

              // [this.d.selectedModel.layers[0].options.inputLength.value, motors, inputs];
    }

    console.log(shape);

    return shape;
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
          batchSize: this.d.selectedModel.training.batchSize,
          inputShape: this.getInputShapeModel(),
          sparse: layer.options.sparse.value,
        });

      } else if (index === this.d.selectedModel.layers.length - 1) {
        layerItem = tf.layers.dense({
          name: 'output',
          units: outputShape[1],
          activation: layer.options.activation.value,
          // inputShape: this.d.selectedModel.layers[0].options.inputLength && this.d.selectedModel.layers[0].options.inputLength.value ? [ this.d.selectedModel.layers[0].options.inputLength.value ] : undefined
        });


      } else if (index > 0 && layer.type) {

        console.log(layer);

        layerItem = layer.type.tf({
            name: layer.name + '-' + index,
            trainable: layer.options.trainable.value,
            units: layer.options.units && layer.type.subgroup !== 'normalization' && layer.type.name !== 'dropout' && layer.type.name !== 'flatten' ? layer.options.units.value : undefined,
           // inputShape: index === 1 ? inputShape : undefined,
           // batchSize: index === 1 && this.d.selectedModel.layers[0].options.batchSize && this.d.selectedModel.training.batchSize !== null ? this.d.selectedModel.training.batchSize : undefined,
            inputLength: index === 1 && this.d.selectedModel.layers[0].options.inputLength && this.d.selectedModel.layers[0].options.inputLength.value ? this.d.selectedModel.layers[0].options.inputLength.value : undefined,

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

            // biasInitializer: layer.options.biasInitializer && layer.options.biasInitializer.value.name !== 'none' ?
            //                  layer.options.biasInitializer.value.initializer(layer.options.biasInitializer.value.args) : undefined,
            biasConstraint:  layer.options.biasConstraint && layer.options.biasConstraint.value !== 'none' ? layer.options.biasConstraint.value : undefined,
            biasRegularizer: layer.options.biasRegularizer && layer.options.biasRegularizer.value.name !== 'none' ?
                             layer.options.biasRegularizer.value.regularizer(layer.options.biasRegularizer.value.config) : undefined,

            // kernelInitializer: layer.options.kernelInitializer && layer.options.kernelInitializer.value.name !== 'none' ?
                              //  layer.options.kernelInitializer.value.initializer(layer.options.kernelInitializer.value.args) : undefined,
            kernelConstraint:  layer.options.kernelConstraint && layer.options.kernelConstraint.value !== 'none' ? layer.options.kernelConstraint.value : undefined,
            kernelRegularizer: layer.options.kernelRegularizer && layer.options.kernelRegularizer.value.name !== 'none' ?
                               layer.options.kernelRegularizer.value.regularizer(layer.options.kernelRegularizer.value.config) : undefined,

            // depthwiseInitializer: layer.options.depthwiseInitializer && layer.options.depthwiseInitializer.value.name !== 'none' ?
            //                       layer.options.depthwiseInitializer.value.initializer(layer.options.depthwiseInitializer.value.args) : undefined,
            depthwiseConstraint:  layer.options.depthwiseConstraint && layer.options.depthwiseConstraint.value !== 'none' ? layer.options.depthwiseConstraint.value : undefined,
            depthwiseRegularizer: layer.options.depthwiseRegularizer && layer.options.depthwiseRegularizer.value.name !== 'none' ?
                                  layer.options.depthwiseRegularizer.value.regularizer(layer.options.depthwiseRegularizer.value.config) : undefined,

            // pointwiseInitializer: layer.options.pointwiseInitializer && layer.options.pointwiseInitializer.value.name !== 'none' ?
            //                       layer.options.pointwiseInitializer.value.initializer(layer.options.pointwiseInitializer.value.args) : undefined,
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

            // recurrentInitializer: layer.options.recurrentInitializer && layer.options.recurrentInitializer.value.name !== 'none' ?
            //                       layer.options.recurrentInitializer.value.initializer(layer.options.recurrentInitializer.value.args) : undefined,
            recurrentConstraint:  layer.options.recurrentConstraint && layer.options.recurrentConstraint.value !== 'none' ? layer.options.recurrentConstraint.value : undefined,
            recurrentRegularizer: layer.options.recurrentRegularizer && layer.options.recurrentRegularizer.value.name !== 'none' ?
                                  layer.options.recurrentRegularizer.value.regularizer(layer.options.recurrentRegularizer.value.config) : undefined
          });

      }

      console.log(layerItem);

      if (layerItem) {
        const success = this.addLayer(layerItem);

        if (!success) {
          this.d.selectedModel.model = null;
          this.abortProcess();
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



  abortProcess(error: string = null) {
    if (error) {
      this.tensorflowService.updateProgess(error, 0);
    }
    this.d.processing = false;
    this.document.body.style.cursor = 'default';
  }


  async processData() {

    this.d.processing = true;

    this.document.body.style.cursor = 'wait';

    const data = await this.createJSONfromDataSet(this.d.dataSets);

    // console.log(data);
    const validation = this.d.dataSets.filter(d => d.trainingType === TrainingType.validation).length > 0 ? true : false;

    if (!this.d.selectedModel.model) { await this.processingModel(false); }

    if (this.d.selectedModel.model) {

      const [xReshaped, yReshaped] = await this.transformArray(data.xs, data.ys, this.getInputShapeModel(), validation);

      // console.log(xReshaped, yReshaped);

      // this.createPredictionModel.next(true);


      if (this.d.dataSets.length === 0 || this.d.dataSets.filter(d => d.trainingType === TrainingType.training).length === 0) {

        this.abortProcess('Error: no training data detected');

        return;

      } else if (!validation) {

        await this.trainModel(xReshaped, yReshaped);

      } else if (validation) {

        this.tensorflowService.updateProgess('Creating training and validation sets', 20);
        const [trainingSet,validationSet] = await this.splitTrainingData({ xs: xReshaped, ys: yReshaped, trainingType: data.trainingType }, this.d.selectedModel.training.batchSize);

        await this.trainAndValidateModel(trainingSet, validationSet);
      }

    } else {
      this.abortProcess('Error compiling model');
    }

  }




  async transformArray(inputArray: Array<any>, outputArray: Array<any>, shape: Array<number>, returnDataset: boolean) {

    let reshapedInputTensor: any;
    let reshapedOutputTensor: any;

    const outputTensor = outputArray ? tf.tensor(outputArray) : null;

    if (!this.d.selectedModel.layers[0].options.sparse.value) {

      const inputTensor = tf.tensor(inputArray);
      const squeezedTensor = inputTensor.shape.includes(1) ? inputTensor.squeeze() : inputTensor;
      reshapedInputTensor = squeezedTensor.reshape([-1, ...shape]);

    } else {
      const spd = this.getSparseRepresentation(inputArray);

      const sparseTensor = tf.sparseToDense(spd.sparseIndices, spd.sparseValues, spd.denseShape);
      const squeezedTensor = sparseTensor.shape.includes(1) ? sparseTensor.squeeze() : sparseTensor;
      reshapedInputTensor = squeezedTensor.reshape([-1, ...shape]);
    }

    if (outputTensor && (reshapedInputTensor.rank < outputTensor.rank || this.d.selectedModel.model.layers[this.d.selectedModel.model.layers.length - 2].outboundNodes[0].outputTensors[0].rank < outputTensor.rank)) {
      if (outputTensor.shape.includes(1)) {
        reshapedOutputTensor = outputTensor.squeeze();
      }

      return returnDataset ? [ reshapedInputTensor.arraySync(), reshapedOutputTensor.arraySync() ] : [ reshapedInputTensor, reshapedOutputTensor ];
    }

    return returnDataset ? [ reshapedInputTensor.arraySync(), outputArray ] : [ reshapedInputTensor, outputTensor ];
  }





  getSparseRepresentation(denseArray: Array<any>) {
    const denseShape: Array<number> = [];
    const sparseIndices = [];
    const sparseValues = [];

    function findSparseIndices(arr: Array<any>, currentIndex = []) {

      if (Array.isArray(arr)) {

        for (let i = 0; i < arr.length - 1; i++) {
          findSparseIndices(arr[i], currentIndex.concat(i));
        }
      } else {
        if (arr !== 0) {
          sparseIndices.push(currentIndex);
          sparseValues.push(arr);
        }
      }
    }

    findSparseIndices(denseArray);

    let currentLevel = denseArray;
    while (Array.isArray(currentLevel)) {
      denseShape.push(currentLevel.length);
      currentLevel = currentLevel[0];
    }

    while (denseShape.includes(1)) {
      const index = denseShape.indexOf(1);
      if (index > -1) { denseShape.splice(index, 1); }
    }

    return {
      sparseIndices: sparseIndices,
      sparseValues: sparseValues,
      denseShape: denseShape
    };
  }


  async trainModel(iTensor: any, oTensor: any) {

    const optimizer = await this.createOptimizer();

    await this.compileModel(optimizer);

    this.tensorflowService.updateProgess('start training', 25);

    await this.fitModel(iTensor, oTensor, this.d.selectedModel.training.batchSize);

    this.abortProcess();

    this.d.selectedModel.model.summary();

  }


  async trainAndValidateModel(trainDs: any, validationDs: any) {

    const optimizer = await this.createOptimizer();

    await this.compileModel(optimizer);

    this.tensorflowService.updateProgess('start training', 25);

    await this.fitDatasetToModel(trainDs, validationDs);

    this.abortProcess();

    this.d.selectedModel.model.summary();

  }



  async createTensor(data: Array<any>) {
    try {
      const tensor = tf.tensor(data);
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
      return tensor;
    }
    catch(e: any) {
      this.handleError(e);
      return;
    }
  }



  handleError(e: any) {
    const error = (e as Error).message;
    console.log(error);
    this.abortProcess(error);
    this.d.selectedModel.model = null;
  }



  async fitModel(iTensor: any, oTensor: any, batchSize: number) {


    let logFile: any;

    await this.d.selectedModel.model.fit(iTensor, oTensor, {
      verbose: 0,
      shuffle: true,
      batchSize: batchSize,
      epochs: this.d.selectedModel.training.epochs,
      callbacks: {
        onTrainBegin: async() => {
          const emptyFile = this.d.trainingData.filter(d => d.data.length === 0)[0];
          logFile = emptyFile ? emptyFile : this.createLogFile();
        },
        onEpochEnd: async(epoch: any, logs: any) => {
          const metric = this.getMetric(logs);
          logFile.data.push({ log: { loss: logs.loss, metric: metric.training, text_metric: metric.text }, epoch: epoch});
          this.tensorflowService.updateProgess('Training: loss = ' + logs.loss + '' + (metric ? metric.text + metric.training : ' '), ((75/this.d.selectedModel.training.epochs) * epoch) + 25,
            { e: epoch, metric: metric, loss: logs.loss });
          this.updateTrainingGraph.next({ e: epoch, metric: metric.training, loss: logs.loss, val_metric: metric.validation, val_loss: logs.val_loss });
        },
        onTrainEnd: async(logs: any) => {
          console.log(logs);
          this.tensorflowService.updateProgess('Training complete.', 100);

          iTensor.dispose();
          oTensor.dispose();

          console.log("memory " + tf.memory().numTensors);
        }
        // ,earlyStopping: async() => ({monitor: 'val_loss', patience: 5})
      }
    });
  }


  async fitDatasetToModel(trainDs: any, validationDs: any) {
    let logFile: any;

    try {
      this.d.selectedModel.model.fitDataset(trainDs, {
        epochs: this.d.selectedModel.training.epochs,
        validationData: validationDs,
        validationBatchSize: this.d.selectedModel.training.validationBatchSize,
        verbose: 0,
        callbacks: {
          onTrainBegin: async() => {
            const emptyFile = this.d.trainingData.filter(d => d.data.length === 0)[0];
            logFile = emptyFile ? emptyFile : this.createLogFile();
          },
          onEpochEnd: async(epoch: any, logs: any) => {

            const metric = this.getMetric(logs);
            logFile.data.push({ log: { loss: logs.loss, val_loss: logs.val_loss, metric: metric.training, val_metric: metric.validation, text_metric: metric.text }, epoch: epoch});
            this.tensorflowService.updateProgess('Training: loss = ' + logs.loss + '' + (metric ? metric.text + metric.training : ' '), ((75/this.d.selectedModel.training.epochs) * epoch) + 25,
              { e: epoch, metric: metric, loss: logs.loss });
            this.updateTrainingGraph.next({ e: epoch, metric: metric.training, loss: logs.loss, val_metric: metric.validation, val_loss: logs.val_loss });
          },
          onTrainEnd: async() => {
            this.tensorflowService.updateProgess('Training complete.', 100);
            this.document.body.style.cursor = 'default';

            console.log("memory " + tf.memory().numTensors);
          }
        }
      });
    }
    catch(e: any) {
      console.log('error fitting dataset');
      this.handleError(e);
    }
  }


  createLogFile() {
    const logFile = new TrainingSet(uuid(), 'Training logs ' + (this.d.trainingData.length + 1), this.cloneService.deepClone(this.d.selectedModel.training));
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
      if (data.ys) {
        trainingData.ys.push(data.ys[index]);
      }
    } else if (type === TrainingType.validation) {
      validationData.xs.push(data.xs[index]);
      if (data.ys) {
        validationData.ys.push(data.ys[index]);
      }
    }
    index++;
  }

  batchSize = batchSize !== null && batchSize !== 0 ? batchSize : 1;

  if (data.ys) {
    const trainingDataset = tf.data.zip({
      xs: tf.data.array(trainingData.xs),
      ys: tf.data.array(trainingData.ys)
    }).shuffle(trainingData.xs.length);


    const validationDataset = data.ys ? tf.data.zip({
      xs: tf.data.array(validationData.xs),
      ys: tf.data.array(validationData.ys)
    }).shuffle(validationData.xs.length) : null;

    return [trainingDataset.batch(batchSize), (validationDataset ? validationDataset.batch(this.d.selectedModel.training.validationBatchSize) : null)];

  } else {

    return [tf.data.array(trainingData.xs).batch(this.d.selectedModel.training.validationBatchSize), null];
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


      this.d.selectedModel.model.compile({
        optimizer: optimizer,
        loss: this.d.selectedModel.training.losses.value,
        metrics: this.d.selectedModel.training.metrics.value !== undefined ? [ this.d.selectedModel.training.metrics.value ] : []
      });

      this.tensorflowService.updateProgess('compiled successfully', 22);

    }
    catch(e: any) {
      console.log('error compiling');
      this.handleError(e);
      return;
    }


  }







  // NN_Deploy(input: any, selectedModel: any) {

  //   // this.serialPath = path;
  //   // console.log('predict');
  //   // console.log(input);

  //   if (selectedModel.type !== 'Regression') {
  //     const iTensor = tf.tensor(input);
  //     const inputTensor = tf.reshape(iTensor, [input.length, input[0][0][0].length, (input[0][0].length * input[0].length) ]);
  //    // console.log(iTensor, inputTensor);
  //     const outputs = this.d.selectedModel.training.batchSize > 1 ? this.d.selectedModel.model.predictOnBatch(inputTensor) : this.d.selectedModel.model.predict(inputTensor);
  //     // console.log(outputs);
  //     const prediction = Array.from((outputs as any).dataSync());
  //     // console.log(prediction);
  //     this.updatePredictionClassifiers(prediction);

  //     if (this.d.ML_OutputData.length > 0) {
  //       this.d.ML_OutputData[this.d.ML_OutputData.length - 1].data.push({ p: prediction, i: input });
  //       this.d.ML_OutputData[this.d.ML_OutputData.length - 1].classifier = this.d.selectedModel.outputs.filter(o => o.active)[0].labels;
  //     }

  //     iTensor.dispose();
  //   }
  // }


  // async createTensorsOld(modelObj: Model) {


  //   this.d.selectedModel.model = tf.sequential();

  //   // this.createPredictionModel.next(true);

  //   this.d.selectedModel.model.name = modelObj.name;

  //   this.tensorflowService.updateProgess('model created', 10);

  //   const data = await this.createJSONfromDataSet(this.d.dataSets);


  //   if (data.xs && data.ys) {
  //     console.log(data);

  //     const inputShape =  [null, data.xs[0][0][0].length, (data.xs[0][0].length * data.xs[0].length) ];
  //     // const inputShape = this.getInputShapeModel(this.d.selectedModel);

  //     const outputShape = [null, data.ys[0].length];

  //     console.log(inputShape);

  //     const numSamples = data.xs.length;
  //     const iTensor = tf.tensor(data.xs, [numSamples, data.xs[0].length, data.xs[0][0].length, data.xs[0][0][0].length]);
  //     const outputTensor = tf.tensor(data.ys, [numSamples, data.ys[0].length]);
  //     let inputTensor = tf.reshape(iTensor, [numSamples, data.xs[0][0][0].length, (data.xs[0][0].length * data.xs[0].length) ]);

  //     console.log(inputTensor);
  //     let i = 0;
  //     for(const layer of modelObj.layers) {

  //       let hiddenLayer: any;

  //       if (modelObj.type === ModelType.CNN) {

  //         hiddenLayer = tf.layers.dense({
  //           name: layer.name + '' + i,
  //           units: layer.options.units, //data.xs[0][0][0].length
  //           inputShape: inputShape.slice(1), // [ number of inputs, batch size ]
  //           activation: layer.options.activation, // make activation function adjustable in model settings
  //           kernelRegularizer: layer.options.kernelRegularizer.regularizer,
  //         });
  //       } else if (modelObj.type === ModelType.RNN) {

  //         hiddenLayer = tf.layers.simpleRNN({
  //           units: (data.xs[0][0].length * data.xs[0].length), //data.xs[0][0][0].length
  //           inputShape: inputShape.slice(1), // [ batchsize, timesteps ]
  //           activation: layer.options.activation, // make activation function adjustable in model settings
  //           returnSequences: i < layer.options.layers - 1 ? layer.options.returnSequences : false,
  //           kernelRegularizer: layer.options.kernelRegularizer.regularizer,
  //           inputLength: layer.options.trainingOptions.batchSize
  //         });

  //       }
  //       //  else if (modelObj.type === ModelType.LSTM) {

  //       //   hiddenLayer = tf.layers.lstm({
  //       //     units: (data.xs[0][0].length * data.xs[0].length), //data.xs[0][0][0].length
  //       //     inputShape: inputShape.slice(1),// [ number of inputs, batch size ]
  //       //     recurrentActivation: this.d.selectedModel.options.activation,
  //       //     activation: this.d.selectedModel.options.activation, // make activation function adjustable in model settings
  //       //     returnSequences: layer < this.d.selectedModel.options.hiddenLayers - 1 ? this.d.selectedModel.options.returnSequences : false,
  //       //     kernelRegularizer: this.d.selectedModel.options.kernelRegularizer.regularizer,
  //       //     implementation: this.d.selectedModel.options.implementation
  //       //   });

  //         //console.log(hiddenLayer);

  //       // }
  //       // else if (modelObj.type === ModelType.GRU) {

  //       //   hiddenLayer = tf.layers.gru({
  //       //     units: (data.xs[0][0].length * data.xs[0].length), //data.xs[0][0][0].length
  //       //     inputShape: inputShape.slice(1), // [ number of inputs, batch size ]
  //       //     activation: this.d.selectedModel.options.activation, // make activation function adjustable in model settings
  //       //     returnSequences: layer < this.d.selectedModel.options.hiddenLayers - 1 ? this.d.selectedModel.options.returnSequences : false,
  //       //     kernelRegularizer: this.d.selectedModel.options.kernelRegularizer.regularizer,
  //       //     implementation: this.d.selectedModel.options.implementation
  //       //   });
  //       // }

  //       this.d.selectedModel.model.add(hiddenLayer);

  //       if (layer.options.batchNormalization) {
  //         const batchNormalizationLayer = tf.layers.batchNormalization();
  //         this.d.selectedModel.model.add(batchNormalizationLayer);
  //       }

  //       if (layer.options.dropout !== 0) {
  //         this.d.selectedModel.model.add(tf.layers.dropout({ rate: layer.options.dropout }));
  //       }
  //       console.log(this.d.selectedModel);
  //       // this.selectedModel.model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
  //     }


  //     if (this.d.selectedModel.type === ModelType.CNN) {
  //       this.d.selectedModel.model.add(tf.layers.flatten());
  //     }
  //     //add output layer
  //     const outputLayer = tf.layers.dense({
  //       units: outputShape[1],
  //       activation: this.d.selectedModel.layers[this.d.selectedModel.layers.length - 1].options.activation
  //     });

  //     this.d.selectedModel.model.add(outputLayer);



  //     // const optimizerFunction = this.d.selectedModel.training.optimizer.name === 'momentum' ?
  //     //     this.d.selectedModel.training.optimizer.value(this.d.selectedModel.training.learningRate, this.d.selectedModel.training.momentum) :
  //     //     this.d.selectedModel.training.optimizer.value(this.d.selectedModel.training.learningRate);

  //     // this.d.selectedModel.model.compile({
  //     //   optimizer: optimizerFunction,
  //     //   loss: this.d.selectedModel.training.losses.value,
  //     //   metrics: [ this.d.selectedModel.training.metrics.value ]
  //     // });
  //     // console.log(this.d.selectedModel.training);
  //     // console.log(this.d.selectedModel.model);
  //     // this.d.selectedModel.model.normalizeData();

  //     this.tensorflowService.updateProgess('start training', 25);




  //     // this.train(inputTensor, outputTensor, this.d.selectedModel.training.epochs, this.d.selectedModel.layers[0].options.batchSize).then(() => {
  //     //   console.log('training is complete');

  //     //   (this.document.getElementById('deploy') as HTMLButtonElement).disabled = false;

  //     //   this.document.body.style.cursor = 'default';

  //     //   this.d.processing = false;

  //     //   inputTensor.dispose();
  //     //   outputTensor.dispose();

  //     //   console.log("memory " + tf.memory().numTensors);

  //     // });

  //   } else {
  //     this.tensorflowService.updateProgess('no data found, training canceled', 0);
  //     this.d.processing = false;

  //     this.document.body.style.cursor = 'default';

  //     return false;
  //   }
  // }


}
