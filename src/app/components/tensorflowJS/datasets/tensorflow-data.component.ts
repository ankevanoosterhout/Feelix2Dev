import { Component, HostListener, Inject, AfterViewInit, OnInit } from '@angular/core';
import { TensorFlowMainService } from 'src/app/services/tensorflow-main.service';
import { ElectronService } from 'ngx-electron';
import { TensorFlowDrawService } from 'src/app/services/tensorflow-draw.service';
import { Classifier, Data, DataSet, InputColor, InputItem, Label, MLDataSet, MotorEl, OutputItem } from 'src/app/models/tensorflow.model';
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

  public graphID = 'svg_graph';
  public size = { width: innerWidth - 395, height: innerHeight - 70, margin: 70 };


  public d: TensorFlowData;
  public config: TensorFlowConfig;


  constructor(public tensorflowService: TensorFlowMainService, private electronService: ElectronService, private tensorflowDrawService: TensorFlowDrawService,
              private tensorflowTrainService: TensorFlowTrainService) {
                this.d = this.tensorflowService.d;
                this.config = this.tensorflowDrawService.config;

                this.tensorflowService.loadMLData.subscribe(res => {
                  this.loadMLdataSet(res);
                });


                this.tensorflowDrawService.redraw.subscribe(res => {
                  this.tensorflowDrawService.drawTensorFlowGraphData(this.d.selectedDataset, this.d.trimLinesVisible ? this.d.trimLines : null);
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




                this.tensorflowDrawService.updateTrimSize.subscribe(res => {
                  const bounds = this.tensorflowService.trimmedDataSize();
                  if (bounds.dataSize.length > 0) {
                    this.d.size = Math.max(...bounds.dataSize);
                  }
                });


                this.tensorflowService.updateGraphBounds.subscribe(data => {
                  this.tensorflowDrawService.updateBounds(data, this.size);
                });

                this.tensorflowService.updateGraph.subscribe(data => {
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
                  this.tensorflowDrawService.drawTrimLines(data.visible, data.lines, this.size);
                });

                this.tensorflowService.updateScale.subscribe(scale => {
                  this.tensorflowDrawService.updateScale(scale);
                });


              }



  ngAfterViewInit(): void {
    // this.config.width = window.innerWidth - (this.d.sidebarWidth);
    // (this.document.getElementById('svg_graph') as HTMLElement).style.width = this.config.width + 'px';
    // this.config.height = window.innerHeight - 100;
    // this.tensorflowDrawService.redraw.next(this.d.selectedDataset);
    this.redraw();
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    if (this.d.dataSets.length === 0) {
      this.d.dataSets.push(new DataSet(uuid(), 'Data set ' + (this.d.dataSets.length + 1), this.d.selectedMicrocontrollers, this.d.selectedModel.outputs));
      this.d.dataSets[0].open = true;
      this.d.selectedDataset = this.d.dataSets[0];
    }
  }



  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {

    // (this.document.getElementById('svg_graph') as HTMLElement).style.width = this.config.width + 'px';
    // this.redraw();
    this.redraw();

  }




  redraw(set = this.d.selectedDataset, lines = this.d.trimLines) {
    this.size = { width: innerWidth - 395, height: innerHeight - 70, margin: 70 };
    this.tensorflowDrawService.drawGraph(this.graphID, this.size);
    if (set) {
      this.tensorflowDrawService.drawTensorFlowGraphData(set, this.d.trimLinesVisible ? lines : null);
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

      this.tensorflowDrawService.updateBounds(dataSetEl.bounds, this.size);
    }
    this.redraw(dataSetEl, null)
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





  loadMLdataSet(dataSets: Array<any>) {
    const tmpID = uuid();

    if (dataSets) {
      let i = 0;

      for (const mlData of dataSets) {


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
    if (!this.d.selectedModel.outputs.filter(c => c.id === tmpID)[0]) {
      const newClassifier = new Classifier(tmpID, 'Classifier');

      for (let c = 0; c < dataSets[0].classifier.length; c++) {
        newClassifier.labels.push(this.d.mlOutputData[0].confidencesLevels[c]);
      }
      newClassifier.active = true;

      this.d.selectedModel.outputs.push(newClassifier);
    }
  }












  addClassifier(classifier: Classifier) {
    console.log('add classifier', classifier);
    const outputClassifierInModel = this.d.selectedModel.outputs.filter(o => o.id === classifier.id)[0];
    if (!outputClassifierInModel) {
      this.d.selectedModel.outputs.push(classifier);
      this.tensorflowService.selectClassifier(classifier.id);
    }
  }



}
