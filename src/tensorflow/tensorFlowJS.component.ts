import { DOCUMENT } from '@angular/common';
import { Component, OnInit, Inject, HostListener } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { Classifier, Data, DataSet, InputColor, InputItem, Label, MLDataSet, MotorEl } from 'src/app/models/tensorflow.model';
import { HardwareService } from 'src/app/services/hardware.service';
import { TensorFlowMainService } from 'src/app/services/tensorflow-main.service';
import { MotorControlService } from 'src/app/services/motor-control.service';
import { v4 as uuid } from 'uuid';
import { TensorFlowDrawService } from 'src/app/services/tensorflow-draw.service';
import { TensorFlowConfig } from 'src/app/models/tensorflow-config.model';
import { TensorFlowData } from 'src/app/models/tensorflow-data.model';
import { TensorFlowTrainService } from 'src/app/services/tensorflow-train.service';

@Component({
  selector: 'app-tensorflow-js',
  templateUrl: './tensorflowJS.component.html',
  styleUrls: ['../windows/effects/effects.component.css', './tensorflowJS.component.css'],
})
export class TensorFlowJSComponent implements OnInit {

  public config: TensorFlowConfig;
  public d: TensorFlowData;

  public page = 'tensorflow';
  public status = 'Ready';
  public progress = 0;



  inputArray = [];
  stopRecordingCounter = 0;

  constructor(@Inject(DOCUMENT) private document: Document, public motorControlService: MotorControlService, public hardwareService: HardwareService,
    private electronService: ElectronService, public tensorflowService: TensorFlowMainService, private tensorflowDrawService: TensorFlowDrawService, private tensorflowTrainService: TensorFlowTrainService) {

      this.config = this.tensorflowDrawService.config;
      this.d = this.tensorflowService.d;


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


      this.electronService.ipcRenderer.on('load-from-files', (event: Event, data: any) => {
        this.tensorflowService.importDataSet(data);
      });

      this.electronService.ipcRenderer.on('load-ml-model-from-files', (event: Event, data: any) => {
        this.tensorflowService.importModel(data);
      });


      this.electronService.ipcRenderer.on('load-datasets', (event: Event, data: Array<DataSet>) => {
        this.loadDataSets(data);
      });


      this.electronService.ipcRenderer.on('load-model', (event: Event, data: any) => {
        if (data && data[0]) {
          this.tensorflowService.loadModel(data[0].id);
        }
      });

      this.tensorflowDrawService.redraw.subscribe(res => {
        this.tensorflowDrawService.drawTensorFlowGraphData(this.d.selectedDataset, this.d.trimLinesVisible ? this.d.trimLines : null);
      });

      this.tensorflowDrawService.updateTrimSize.subscribe(res => {
        const bounds = this.tensorflowService.trimmedDataSize();
        if (bounds.dataSize.length > 0) {
          this.d.size = Math.max(...bounds.dataSize);
        }
      });

      this.tensorflowService.updateTensorflowProgress.subscribe(data => {
        this.progress = data.progress;
        this.status = data.status;
        this.document.getElementById('msg').innerHTML = this.status;
        const width = 244 * (this.progress / 100);
        this.document.getElementById('progress').style.width = width + 'px';
      });

      this.tensorflowService.updateResizeElements.subscribe(data => {
        this.updateScreenDivisionY(data.coord);
      });

      this.tensorflowService.updateGraphBounds.subscribe(data => {
        this.tensorflowDrawService.updateBounds(data);
      });

      this.tensorflowService.updateGraph.subscribe(data => {
        // this.tensorflowDrawService.drawGraph();
        if (data) {
          this.redraw(data.set, data.trimLines);
          // this.tensorflowDrawService.drawTensorFlowGraphData(data.set, data.trimLines);
        }
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

      this.tensorflowService.loadMLData.subscribe(res => {
        this.loadMLdataSet(res);
      });



      this.tensorflowService.loadData.subscribe((res) => {
        this.loadDataSets(res);
      });


  }

  ngOnInit(): void {
    this.d.dataSets.push(new DataSet(uuid(), 'Data set ' + (this.d.dataSets.length + 1), this.d.selectedMicrocontrollers));
    this.d.dataSets[0].open = true;
    this.d.selectedDataset = this.d.dataSets[0];
    if (this.d.selectedModel.outputs.length === 0) {
      this.d.selectedModel.outputs.push(new Classifier(uuid(), 'Output-' + (this.d.selectedModel.outputs.length + 1)));
      this.d.selectedModel.outputs[0].active = true;
      this.tensorflowService.addLabelToClassifier(0);
    }
  }


  // @HostListener('window:keydown', ['$event'])
  // onKeyDown(e: KeyboardEvent) {

  // }

  // @HostListener('window:keyup', ['$event'])
  // onKeyDown(e: KeyboardEvent) {

  // }

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

            if (dataset.outputs[0].classifier_id) {
              this.addOutputFromDataSet(dataset);
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
      }
    }
  }



  addOutputFromDataSet(dataset: any) {
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


  addOutput(classifier: Classifier) {
    const outputClassifierInModel = this.d.selectedModel.outputs.filter(o => o.id === classifier.id)[0];
    if (!outputClassifierInModel) {
      this.d.selectedModel.outputs.push(classifier);
      this.tensorflowService.selectClassifier(classifier.id);
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

      if (this.stopRecordingCounter < 10) {

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
    if (data === 0.0) { this.stopRecordingCounter++; } else if (data > 0.03 || data < -0.03) { this.stopRecordingCounter = 0; }
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

  toggleResultWindow() {
    this.config.resultWindowVisible = !this.config.resultWindowVisible;
    this.updateScreenDivisionX(!this.config.resultWindowVisible ? window.innerWidth - 18 : window.innerWidth * 0.7);
  }


  // public loadScript(url: string) {
  //   let body = <HTMLDivElement> document.body;
  //   let script = document.createElement('script');
  //   script.innerHTML = '';
  //   script.src = url;
  //   script.async = true;
  //   script.defer = true;
  //   body.appendChild(script);
  // }



  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {

    if (this.config.updateHorizontalScreenDivision) {
      this.updateScreenDivisionY(e.clientY);
    } else if (this.config.updateVerticalScreenDivision) {
      this.updateScreenDivisionX(e.clientX);
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(e: MouseEvent) {
    if (this.config.updateHorizontalScreenDivision || this.config.updateVerticalScreenDivision) {
      this.config.updateHorizontalScreenDivision = false;
      this.config.updateVerticalScreenDivision = false;
    }
  }



  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    // this.config.width = (window.innerWidth - 550); //470
    this.config.width = window.innerWidth - 250 - (this.config.sidebarColumnWidth[0] + this.config.sidebarColumnWidth[1]);
    (this.document.getElementById('svg_graph') as HTMLElement).style.width = this.config.width + 'px';
    (this.document.getElementById('graph-header') as HTMLElement).style.width = this.tensorflowDrawService.config.width + 'px';

    this.config.height = window.innerHeight - this.config.horizontalScreenDivision - 120;
    this.document.getElementById('data').style.height = (window.innerHeight - this.config.horizontalScreenDivision) + 'px';
    this.document.getElementById('model').style.width = (window.innerWidth * this.config.verticalScreenDivision / 100) + 'px';
    this.document.getElementById('classifiers').style.width = (window.innerWidth * (100-this.config.verticalScreenDivision) / 100) + 'px';
    this.redraw();
  }


  updateScreenDivisionY(coord: number) {
    if (coord > 60 && coord <= window.innerHeight - 60) {
      this.updateResize(coord, 'horizontal');
    }
  }

  updateScreenDivisionX(coord: number) {
    if (coord <= window.innerWidth - 18) {
      const division = 100 / (window.innerWidth / coord);
      this.updateResize(division, 'vertical');
    }
  }


  updateResize(division: number, orientation: string) {
    if (orientation === 'horizontal') {
      this.document.getElementById('classifiers').style.height = division + 'px';
      this.document.getElementById('model').style.height = division + 'px';
      this.document.getElementById('data').style.height = (window.innerHeight - division) + 'px';
      this.config.height = window.innerHeight - division - 120;
      this.config.horizontalScreenDivision = division;
      if (this.config.horizontalScreenDivision >= window.innerHeight - 80) {
        this.document.getElementById('toggleDataSection').classList.add('hidden');
      } else {
        if (this.document.getElementById('toggleDataSection').classList.contains('hidden')) {
          this.document.getElementById('toggleDataSection').classList.remove('hidden');
        }
        this.redraw();
      }

    } else if (orientation === 'vertical') {
      this.document.getElementById('model').style.width = division + '%';
      this.document.getElementById('classifiers').style.width = (100 - division) + '%';
      this.config.verticalScreenDivision = division;
      if (division >= (100/window.innerWidth) * (window.innerWidth - 18)) {
        if (!this.document.getElementById('toggleResultWindow').classList.contains('hidden')) {
          this.document.getElementById('toggleResultWindow').classList.add('hidden');
        }
      } else {
        if (this.document.getElementById('toggleResultWindow').classList.contains('hidden')) {
          this.document.getElementById('toggleResultWindow').classList.remove('hidden');
        }
      }
    }
  }


  redraw(set = this.d.selectedDataset, lines = this.d.trimLines) {
    this.tensorflowDrawService.drawGraph();
    if (set) {
      this.tensorflowDrawService.drawTensorFlowGraphData(set, this.d.trimLinesVisible ? lines : null);
    }
  }

}



