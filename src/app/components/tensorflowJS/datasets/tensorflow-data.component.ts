import { Component, HostListener, Inject, AfterViewInit, OnInit } from '@angular/core';
import { HardwareService } from 'src/app/services/hardware.service';
import { TensorFlowMainService } from 'src/app/services/tensorflow-main.service';
import { ElectronService } from 'ngx-electron';
import { UploadService } from 'src/app/services/upload.service';
import { DOCUMENT } from '@angular/common';
import { TensorFlowDrawService } from 'src/app/services/tensorflow-draw.service';
import { ActuatorType, Motor } from 'src/app/models/hardware.model';
import { Classifier, Data, DataSet, InputColor, InputItem, Label, MLDataSet, MotorEl } from 'src/app/models/tensorflow.model';
import { TensorFlowData } from 'src/app/models/tensorflow-data.model';
import { TensorFlowConfig } from 'src/app/models/tensorflow-config.model';
import { TensorFlowTrainService } from 'src/app/services/tensorflow-train.service';
import { v4 as uuid } from 'uuid';


@Component({
  selector: 'app-tensorflow-data',
  templateUrl: 'tensorflow-data.component.html',
  styleUrls: ['../../windows/effects/effects.component.css', './../tensorflow.component.scss'],
})
export class TensorflowDataComponent implements OnInit, AfterViewInit {



  public d: TensorFlowData;
  public config: TensorFlowConfig;


  constructor(@Inject(DOCUMENT) private document: Document,public tensorflowService: TensorFlowMainService, public hardwareService: HardwareService,
              private electronService: ElectronService, private uploadService: UploadService, private tensorflowDrawService: TensorFlowDrawService,
              private tensorflowTrainService: TensorFlowTrainService) {
                this.d = this.tensorflowService.d;
                this.config = this.tensorflowDrawService.config;

                this.tensorflowService.loadMLData.subscribe(res => {
                  this.loadMLdataSet(res);
                });

                this.tensorflowService.loadData.subscribe((res) => {
                  console.log(res);
                  this.loadDataSets(res);
                });


                this.electronService.ipcRenderer.on('motorData', (event: Event, data: any) => {
                  const velocity = data.d.filter((d: { name: string; }) => d.name === 'velocity')[0];
                  if (velocity) {
                    this.handleIncomingData(velocity.val, data.serialPath, data.motorID, data.d);
                  }
                });

                this.electronService.ipcRenderer.on('pneumaticDataPressure', (event: Event, data: any) => {
                  // console.log(data);

                  for (const item of data.list) {
                    // console.log(item);
                    const pressure = item.d.filter((i: { name: string; }) => i.name === 'pressure')[0];
                    if (pressure) {
                      this.handleIncomingData(pressure.val, data.serialPath, item.motorID, item.d);
                    }
                  }
                });


                this.electronService.ipcRenderer.on('load-datasets', (event: Event, data: Array<DataSet>) => {
                  console.log(data);
                  this.loadDataSets(data);
                });


                this.tensorflowDrawService.redraw.subscribe(res => {
                  this.tensorflowDrawService.drawTensorFlowGraphData(this.d.selectedDataset, this.d.trimLinesVisible ? this.d.trimLines : null);
                });

                this.tensorflowService.updateGraph.subscribe(data => {
                  if (data) { this.redraw(data.set, data.trimLines); }
                });


                this.electronService.ipcRenderer.on('export-dataset-model', (event: Event, data: any) => {
                  this.tensorflowService.saveDataNN(data);
                });

                this.electronService.ipcRenderer.on('load-from-files', (event: Event, data: any) => {
                  this.tensorflowService.importDataSet(data);
                });

                this.electronService.ipcRenderer.on('load-ml-model-from-files', (event: Event, data: any) => {
                  this.tensorflowService.importModel(data);
                });

                this.electronService.ipcRenderer.on('load-model', (event: Event, data: any) => {
                  if (data && data[0]) {
                    this.tensorflowService.loadModel(data[0].id);
                  }
                });


                this.tensorflowDrawService.updateTrimSize.subscribe(res => {
                  const bounds = this.tensorflowService.trimmedDataSize();
                  if (bounds.dataSize.length > 0) {
                    this.d.size = Math.max(...bounds.dataSize);
                  }
                });


                this.tensorflowService.updateGraphBounds.subscribe(data => {
                  this.tensorflowDrawService.updateBounds(data);
                });

                this.tensorflowTrainService.createPredictionModel.subscribe(data => {
                  this.d.predictionDataset = new DataSet(uuid(), 'Prediction', this.d.selectedMicrocontrollers);
                  this.d.predictionDataset.bounds = {
                    xMin: 0,
                    xMax: 700,
                    yMin: 10,
                    yMax: -10
                  }
                  this.tensorflowDrawService.updateBounds(this.d.predictionDataset.bounds);
                  // console.log(this.d.predictionDataset);
                });

                this.tensorflowService.drawTrimLines.subscribe(data => {
                  this.tensorflowDrawService.drawTrimLines(data.visible, data.lines);
                });

                this.tensorflowService.updateScale.subscribe(scale => {
                  this.tensorflowDrawService.updateScale(scale);
                });


    



              }



  ngAfterViewInit(): void {
    // this.config.width = window.innerWidth - (this.d.sidebarWidth);
    // (this.document.getElementById('svg_graph') as HTMLElement).style.width = this.config.width + 'px';
    // this.config.height = window.innerHeight - 100;
    this.tensorflowDrawService.drawGraph();
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    console.log(this.d.selectedMicrocontrollers);
    if (this.d.dataSets.length === 0) {
      this.d.dataSets.push(new DataSet(uuid(), 'Data set ' + (this.d.dataSets.length + 1), this.d.selectedMicrocontrollers));
      this.d.dataSets[0].open = true;
      this.d.selectedDataset = this.d.dataSets[0];
    }
  }


  record() {
    this.d.recording.active = !this.d.recording.active;

    this.tensorflowDrawService.enableZoom(!this.d.recording.active);


    if (!this.d.recording.active) {
      this.d.recording.starttime = null;
    } else {
      if (!this.d.classify && this.d.selectedDataset  && this.d.selectedDataset.m.length > 0) {
        if (this.d.selectedDataset.m[0].d.length > 0) {
          this.tensorflowService.addDataSet();
        }
      }
    }

    for (const microcontroller of this.d.selectedMicrocontrollers) {
      microcontroller.record = this.d.recording.active;

      if (!microcontroller.record) {

        // this.tensorflowService.updateProgess('connecting to microcontroller ' + microcontroller.serialPort.path, 0);
        // const model = new ConnectModel(microcontroller);
        // this.electronService.ipcRenderer.send('requestData', model);

      // } else {
        this.tensorflowService.updateBoundsActiveDataset();
        this.d.classify = false;
      }
    }
  }


  // selectDataSet(id:string, event: any) {
  //   this.tensorflowDrawService.enableZoom(true);
  //   this.tensorflowService.selectDataSet(id, event);
  // }






  updateCommunicationSpeed(serialPath: string) {
    const microcontroller = this.d.selectedMicrocontrollers.filter(m => m.serialPort.path === serialPath)[0];
    if (microcontroller) {
      this.hardwareService.updateMicroController(microcontroller);

      // console.log(uploadModel);
      if (microcontroller.motors[0].type !== ActuatorType.pneumatic) {
        const uploadModel = this.uploadService.createUploadModel(null, microcontroller);
        uploadModel.config.motors = microcontroller.motors;
        this.electronService.ipcRenderer.send('updateMotorSetting', uploadModel);
      }

      // console.log(microcontroller.updateSpeed);
    }
  }



  compareID(el1: any, el2: any) {
    return el1 && el2 ? el1.id === el2.id : el1 === el2;
  }


  cancelTrim() {
    this.tensorflowDrawService.removeTrimlines();
    this.d.size = this.tensorflowService.getDataSize(this.d.selectedDataset);
    this.d.trimLinesVisible = false;
  }

  trimDataSet() {
    this.tensorflowService.trimSet();
    this.tensorflowDrawService.removeTrimlines();
  }



  updateLine() {
    if (this.d.selectedDataset) {
      this.tensorflowDrawService.drawTensorFlowGraphData(this.d.selectedDataset, this.d.trimLinesVisible ? this.d.trimLines : null);
    }
  }





  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.config.width = window.innerWidth - (2 * this.d.sidebarWidth);
    // (this.document.getElementById('svg_graph') as HTMLElement).style.width = this.config.width + 'px';
    this.config.height = window.innerHeight - 100;
    this.redraw();
  }




  redraw(set = this.d.selectedDataset, lines = this.d.trimLines) {
    this.tensorflowDrawService.drawGraph();
    if (set) {
      this.tensorflowDrawService.drawTensorFlowGraphData(set, this.d.trimLinesVisible ? lines : null);
    }
  }





  startRecording(data: number) {
    if (this.d.recording.active && this.d.recording.starttime === null && (data > 0.03 || data < -0.03)) {
      this.d.recording.starttime = new Date().getTime();
    }
  }

  processRecordedData(dataSetEl: any, time: number) {
    if (this.d.classify) {
      this.tensorflowTrainService.predictOutput();

    } else if (!this.d.classify && time > dataSetEl.bounds.xMax - 500) {

      dataSetEl.bounds.xMax = dataSetEl.bounds.xMax < 3000 ?
      Math.ceil(dataSetEl.bounds.xMax * 0.006) * 200 : Math.ceil(dataSetEl.bounds.xMax * 0.0024) * 500;

      this.tensorflowDrawService.updateBounds(dataSetEl.bounds);
    }

    this.redraw(dataSetEl);
  }


  handleIncomingData(referenceData: number, serialPath: string, motorID: string, receivedData: any) {

    this.startRecording(referenceData); //data.velocity

    if (this.d.recording.starttime !== null) {

      this.updateRecording(referenceData); //data.velocity

      if (this.config.stopRecordingCounter < 10) {

        const dataSetEl = !this.d.classify ? this.d.selectedDataset : this.d.predictionDataset;

        if (dataSetEl.m && dataSetEl.m.length > 0) {
          const motorEl = dataSetEl.m.filter(m => m.mcu.serialPath === serialPath && m.id === motorID)[0]; //data.serialPath, data.motorID
          // console.log(motorEl);

          if (motorEl) {
            const dataObject = new Data();

            for (const input of this.d.selectedModel.inputs) {
              const dataItem = receivedData.filter((d: { slug: string; }) => d.slug === input.slug)[0]; //data.d
              // console.log(dataItem, input);

              if (dataItem) {
                const inputItem = new InputItem(input.name);
                inputItem.value = dataItem.val;
                dataObject.inputs.push(inputItem);

                this.checkBounds(inputItem.value);
              }
            }

            const time = new Date().getTime() - this.d.recording.starttime;
            dataObject.time = time;

            motorEl.d.push(dataObject);

            this.processRecordedData(dataSetEl, time);
          }
        }
      }
    }
  }


  updateRecording(data: number) {
    if (data === 0.0) { this.config.stopRecordingCounter++; } else if (data > 0.03 || data < -0.03) { this.config.stopRecordingCounter = 0; }
  }

  checkBounds(value: number) {
    if (!this.d.classify) {
      if (value > this.d.selectedDataset.bounds.yMax) {
        this.d.selectedDataset.bounds.yMax = value >= 10 || this.d.selectedDataset.bounds.yMin <= -10 ? Math.ceil(value/5) * 5 : Math.ceil(value * 2) / 2;
        this.tensorflowDrawService.updateBounds(this.d.selectedDataset.bounds);

      } else if (value < this.d.selectedDataset.bounds.yMin) {
        this.d.selectedDataset.bounds.yMin = value <= -10 || this.d.selectedDataset.bounds.yMax >= 10 ? Math.floor(value/5) * 5 : Math.floor(value * 2) / 2; //Math.floor(value/2) * 2
        this.tensorflowDrawService.updateBounds(this.d.selectedDataset.bounds);
      }
    }
  }





  loadMLdataSet(data: Array<any>) {

    const tmpID = uuid();

    if (data) {
      let i = 0;

      if (!this.d.selectedModel.outputs.filter(c => c.id === tmpID)[0]) {
        const newClassifier = new Classifier(tmpID, 'Classifier');

        for (let c = 0; c < data[0].classifier.length; c++) {
          const label = data[0].classifier[c];
          console.log(label);
          const newLabel = new Label(label.id, label.name);
          newClassifier.labels.push(newLabel);
        }
        this.d.selectedModel.outputs.push(newClassifier);
      }

      for (const mlData of data) {


        for (const data of mlData.data) {

          for (const dataSequence of data.i) {

            const actuators: Array<MotorEl> = [];

            let nrOfMotors = dataSequence[0].length;
            for (let m = 0; m < nrOfMotors; m++) {
              const motorEl = new MotorEl('actuator-' + (m + 1), 'actuator-' + (m + 1), null, null, m);
              motorEl.record = true;
              motorEl.visible = true;
              motorEl.colors = [ new InputColor('pressure', this.d.colorOptions[m]) ];
              actuators.push(motorEl);
            }

            let j = 0;

            const mlDataSet = new MLDataSet(uuid(), 'ml-output-' + (i + 1));
            mlDataSet.classifierID = tmpID;

            mlDataSet.selected = false;
            mlDataSet.open = false;

            for (const item of dataSequence) {

              let n = 0;
              for (const value of item) {
                if (mlDataSet.m[n] === undefined) {
                  actuators[n].d = [];
                  mlDataSet.m[n] = actuators[n];
                }
                const inputItem = new InputItem('pressure');
                inputItem.value = value[0];

                mlDataSet.m[n].d.push({inputs: [ inputItem ], time: j});

                n++;
              }

              j++;
            }

            let c = 0;
            for (const value of data.p) {
              const label = new Label(mlData.classifier[c].id, mlData.classifier[c].name);
              label.confidence = value;

              mlDataSet.confidencesLevels.push(label);
              c++;
            }

            mlDataSet.bounds = { xMin: 0, xMax: dataSequence.length - 1, yMin: 0.6, yMax: 1.4 };


            this.d.mlOutputData.push(mlDataSet);

          }


          i++;

        }
      }
    }
    console.log(this.d.mlOutputData);

  }


  loadDataSets(data: Array<DataSet>) {
    if (data) {
      for (const dataset of data) {
        if (this.d.dataSets.filter(d => d.id === dataset.id).length === 0) {
          if (dataset.m && dataset.m.length > 0) {
            for (const motor of dataset.m) {
              if (this.d.selectedMicrocontrollers.filter(m => m.serialPort.path === motor.mcu.serialPath).length === 0) {
                const mcu = this.hardwareService.microcontrollers.filter(m => m.serialPort.path === motor.mcu.serialPath)[0];
                if (mcu) {
                  // this.d.selectOptionMicrocontroller = mcu;
                  this.tensorflowService.addMicrocontroller(mcu, false);
                }
              }
              if (motor.d.length > 0) {
                for (const input of motor.d[0].inputs) {
                  const inputModels = this.d.selectedModel.inputs.filter(i => i.name === input.name);
                  if (inputModels.length === 1) {
                    if (!inputModels[0].active) { inputModels[0].active = true; }
                  } else if (inputModels.length === 0) {
                    //console.log('add input');
                    this.tensorflowService.addInputItem(input.name);
                    this.d.colorList.push(new InputColor(input.name, '#999'));
                  }
                }
              }
              if (!motor.colors || motor.colors.length === 0) {
                motor.colors = JSON.parse(JSON.stringify(this.d.colorList));
              }
            }

            if (dataset.output.classifier_id) {
              this.addClassifierFromDataSet(dataset);
            }

            this.d.dataSets.push(dataset);
          }
        }
        if (this.d.dataSets.length > 0) {
          this.config.transform = null;
          this.tensorflowService.selectDataSet(this.d.dataSets[0].id);
        } else {
          this.d.dataSets.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        }

        console.log(this.d.dataSets);
      }
    }
  }



  addClassifierFromDataSet(dataset: any) {
    const outputClassifierInModel = this.d.selectedModel.outputs.filter(o => o.id === dataset.output.classifier_id)[0];
    if (!outputClassifierInModel) {
      const newClassifier = new Classifier(dataset.output.classifier_id, dataset.output.classifier_name);
      this.d.selectedModel.outputs.push(newClassifier);
      this.checkIfHasLabel(newClassifier, dataset.output.label);
      this.tensorflowService.selectClassifier(newClassifier.id);
    } else {
      this.checkIfHasLabel(outputClassifierInModel, dataset.output.label);
      this.tensorflowService.selectClassifier(outputClassifierInModel.id);
    }
  }

  checkIfHasLabel(classifier: Classifier, label: Label) {
    if (label && label.id && classifier && classifier.labels) {
      const l = classifier.labels.filter(l => l.id === label.id)[0];
      if (!l) {
        const newLabel = new Label(label.id, label.name);
        classifier.labels.push(newLabel);
      }
    }
  }


  addClassifier(classifier: Classifier) {
    const outputClassifierInModel = this.d.selectedModel.outputs.filter(o => o.id === classifier.id)[0];
    if (!outputClassifierInModel) {
      this.d.selectedModel.outputs.push(classifier);
      this.tensorflowService.selectClassifier(classifier.id);
    }
  }



}
