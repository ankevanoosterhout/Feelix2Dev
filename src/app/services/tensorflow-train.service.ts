import { Injectable, Inject } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { TensorFlowData } from '../models/tensorflow-data.model';
import { DataSet, Model, ModelType } from '../models/tensorflow.model';
import { TensorFlowMainService } from './tensorflow-main.service';
import { Subject } from 'rxjs';
import { DOCUMENT } from '@angular/common';


@Injectable()
export class TensorFlowTrainService {

  public d: TensorFlowData;

  createPredictionModel: Subject<any> = new Subject<void>();

  constructor(@Inject(DOCUMENT) private document: Document, private tensorflowService: TensorFlowMainService) {
    this.d = this.tensorflowService.d;

    // this.tensorflowService.createJSON.subscribe((res) => {
    //   const JSONData = this.createJSONfromDataSet(res.data, res.train);
    // });
  }

  predictOutput() {
    let collectData = true;
    let i = 0;
    if (this.d.predictionDataset) {
      for (const motor of this.d.predictionDataset.m) {
        if (motor.d.length <= this.d.selectedModel.options.trainingOptions.batchSize && motor.d.length !== 0) { //20
          collectData = false;
        }
        i++;

        if (i >= this.d.predictionDataset.m.length && collectData) {

          const data = this.createJSONfromDataSet([this.d.predictionDataset], false);
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



  createJSONfromDataSet(dataSets: Array<DataSet>, train = true) {

    const data = { xs: [], ys: [] };
    let dataSize = 0;

    dataSets.forEach(set => {

      let outputs = [];
      if (set.output.label.id) {

        for (const classifier of this.d.selectedModel.outputs) {
          if (classifier.active && classifier.id === set.output.classifier_id) {
            for (let i = 0; i < classifier.labels.length; i++) {
              classifier.labels[i].id === set.output.label.id ? outputs.push(1) : outputs.push(0);
            }
          }
        }

        if (outputs.length === 0) {
          this.d.processing = false;
          this.tensorflowService.updateProgess('cannot find outputs', 0);
          return false;
        }
        // console.log(outputs);
      }

      // console.log(set.m);

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
              inputArray.push([inputs]);
            }

            i++;

            if (i >= this.d.selectedModel.options.trainingOptions.batchSize) {
              if (m === 0) {
                data.xs.push(inputArray);
                data.ys.push(outputs);
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


  Regression_createModel(data: any, modelObj: Model) {

  }


  NN_createData(data: any, modelObj: Model) {

    this.d.selectedModel.model = tf.sequential();

    this.createPredictionModel.next(true);

    this.d.selectedModel.model.name = modelObj.name;

    this.tensorflowService.updateProgess('model created', 10);

    if (data.xs && data.ys) {

      const inputShape = [null, data.xs[0][0][0].length, (data.xs[0][0].length * data.xs[0].length) ];
      const outputShape = [null, data.ys[0].length]


      const numSamples = data.xs.length;
      const iTensor = tf.tensor(data.xs, [numSamples, data.xs[0].length, data.xs[0][0].length, data.xs[0][0][0].length]);
      const outputTensor = tf.tensor(data.ys, [numSamples, data.ys[0].length]);

      const inputTensor = tf.reshape(iTensor, [numSamples, data.xs[0][0][0].length, (data.xs[0][0].length * data.xs[0].length) ]);


      for (let layer = 0; layer < this.d.selectedModel.options.hiddenUnits; layer++) {
        let hiddenLayer = null;

        if (modelObj.type === ModelType.neuralNetwork) {

          hiddenLayer = tf.layers.dense({
            units: (data.xs[0][0].length * data.xs[0].length), //data.xs[0][0][0].length
            inputShape: inputShape.slice(1), // [ number of inputs, batch size ]
            activation: this.d.selectedModel.options.activation, // make activation function adjustable in model settings
            kernelRegularizer: this.d.selectedModel.options.regularizer.value
          });
        } else if (modelObj.type === ModelType.RNN) {

          hiddenLayer = tf.layers.simpleRNN({
            units: (data.xs[0][0].length * data.xs[0].length), //data.xs[0][0][0].length
            inputShape: [data.xs[0][0][0].length, (data.xs[0][0].length * data.xs[0].length)], // [ number of inputs, batch size ]
            activation: this.d.selectedModel.options.activation, // make activation function adjustable in model settings
            returnSequences: this.d.selectedModel.options.returnSequences,
            kernelRegularizer: this.d.selectedModel.options.regularizer.value
          });
        } else if (modelObj.type === ModelType.LSTM) {

          hiddenLayer = tf.layers.lstm({
            units: (data.xs[0][0][0].length * data.xs[0][0].length * data.xs[0].length), //data.xs[0][0][0].length
            inputShape: [data.xs[0][0][0].length, (data.xs[0][0].length * data.xs[0].length)], // [ number of inputs, batch size ]
            activation: this.d.selectedModel.options.activation, // make activation function adjustable in model settings
            returnSequences: this.d.selectedModel.options.returnSequences,
            kernelRegularizer: this.d.selectedModel.options.regularizer.value
          });
        } else if (modelObj.type === ModelType.GRU) {

          hiddenLayer = tf.layers.gru({
            units: (data.xs[0][0][0].length * data.xs[0][0].length * data.xs[0].length), //data.xs[0][0][0].length
            inputShape: [data.xs[0][0][0].length, (data.xs[0][0].length * data.xs[0].length)], // [ number of inputs, batch size ]
            activation: this.d.selectedModel.options.activation, // make activation function adjustable in model settings
            returnSequences: this.d.selectedModel.options.returnSequences,
            kernelRegularizer: this.d.selectedModel.options.regularizer.value
          });
        }

        this.d.selectedModel.model.add(hiddenLayer);

        if (this.d.selectedModel.options.batchNormalization) {
          const batchNormalizationLayer = tf.layers.batchNormalization();
          this.d.selectedModel.model.add(batchNormalizationLayer);
        }
        // this.selectedModel.model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
      }





      if (this.d.selectedModel.options.dropout !== 0) {
        this.d.selectedModel.model.add(tf.layers.dropout({ rate: this.d.selectedModel.options.dropout }));
      }

      this.d.selectedModel.model.add(tf.layers.flatten());
      //add output layer
      const outputLayer = tf.layers.dense({
        units: outputShape[1],
        activation: this.d.selectedModel.options.activationOutputLayer
      });

      this.d.selectedModel.model.add(outputLayer);




      const optimizerFunction = this.d.selectedModel.options.optimizer.name === 'momentum' ?
          this.d.selectedModel.options.optimizer.value(this.d.selectedModel.options.learningRate, this.d.selectedModel.options.momentum) :
          this.d.selectedModel.options.optimizer.value(this.d.selectedModel.options.learningRate);

      this.d.selectedModel.model.compile({
        optimizer: optimizerFunction,
        loss: this.d.selectedModel.options.losses.value,
        metrics: [ this.d.selectedModel.options.metrics.value ]
      });
      // console.log(this.d.selectedModel.options);
      // console.log(this.d.selectedModel.model);
    //   this.selectedModel.model.normalizeData();

      this.tensorflowService.updateProgess('start training', 20);




      this.train(inputTensor, outputTensor, this.d.selectedModel.options.trainingOptions).then(() => {
        console.log('training is complete');

        (this.document.getElementById('deploy') as HTMLButtonElement).disabled = false;

        this.document.body.style.cursor = 'default';

        this.d.processing = false;

        inputTensor.dispose();
        outputTensor.dispose();

        console.log("memory " + tf.memory().numTensors);

      });

    } else {
      this.tensorflowService.updateProgess('no data found, training canceled', 0);
      this.d.processing = false;

      this.document.body.style.cursor = 'default';

      return false;
    }
  }


  async train(iTensor: any, oTensor: any, options: any) {
    // console.log(iTensor, oTensor);
    for (let i = 0; i < options.epochs; i++) {
      const response = await this.d.selectedModel.model.fit(iTensor, oTensor, {
        verbose: true,
        shuffle: true,
        batchSize: options.batchSize,
        epochs: 1
      });
      if (i < options.epochs - 1) {
        if (i % 10 === 0) {
          console.log(response.history);
          const metric = this.getMetric(response.history);
          this.tensorflowService.updateProgess('training: loss = ' + response.history.loss[0] + '' + (metric ? metric : ''), ((80/options.epochs) * i) + 20);
        }
      } else {
        const metric = this.getMetric(response.history);
        this.tensorflowService.updateProgess('finished training: ' + response.history.loss[0] + '' + (metric ? metric : ''), 100);
      }
    }
  }


 getMetric(history: any) {
    return history.categoricalAccuracy ? ', categorical accuracy: ' + history.categoricalAccuracy[0] :
           history.precision ? ', precision: ' +  history.precision[0] :
           history.meanAbsoluteError ? ', mean absolute error: ' + history.meanAbsoluteError[0] :
           history.meanAbsolutePercentageError ? ', mean absolute percentage error: ' + history.meanAbsolutePercentageError[0] :
           history.recall ? ', recall: ' +  history.recall[0] :
           history.cosineProximity ? ', cosine proximity: ' + history.cosineProximity[0] :
           history.binaryCrossentropy ? ', binary crossentropy: ' + history.binaryCrossentropy[0] :
           history.categoricalCrossentropy ? ', categorical crossentropy: ' + history.categoricalCrossentropy[0] :
           history.meanSquaredError ? ', mean squared error: ' +  history.meanSquaredError[0] :
           null;
 }

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
