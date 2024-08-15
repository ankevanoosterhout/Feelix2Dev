import { Injectable } from '@angular/core';
import { TensorFlowData } from '../models/tensorflow-data.model';
import { TensorFlowMainService } from './tensorflow-main.service';
import { Subject } from 'rxjs/internal/Subject';
import { TensorFlowConfig } from '../models/tensorflow-config.model';
import { Bounds, Data, InputItem } from '../models/tensorflow.model';
import { TensorFlowDrawService } from './tensorflow-draw.service';

@Injectable()
export class TensorFlowRecordService {

  public d: TensorFlowData;
  public config: TensorFlowConfig;

  public size = { width: innerWidth - 395, height: innerHeight - 70, margin: 70 };

  predictOutput: Subject<any> = new Subject<void>();


  constructor(private tensorflowService: TensorFlowMainService, private tensorflowDrawService: TensorFlowDrawService) {
    this.d = this.tensorflowService.d;
    this.config = this.tensorflowDrawService.config;
  }


  startRecording(data: number) {
    if (this.d.recording.active && this.d.recording.starttime === null && (data > 0.03 || data < -0.03)) {
      this.d.recording.starttime = new Date().getTime();
    }
  }

  record(page: string) {
    this.d.recording.active = !this.d.recording.active;

    this.tensorflowDrawService.enableZoom(!this.d.recording.active);


    if (!this.d.recording.active) {
      this.d.recording.starttime = null;
    } else {
      if (page === 'data' && this.d.selectedDataset && this.d.selectedDataset.m.length > 0) {
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
        this.tensorflowService.updateBoundsDataset();
        this.d.classify = false;
      }
    }
  }


  processRecordedData(dataSetEl: any, time: number) {
    if (this.d.classify) {
      this.predictOutput.next(true);

    } else if (!this.d.classify && time > dataSetEl.bounds.xMax - 500) {

      dataSetEl.bounds.xMax = dataSetEl.bounds.xMax < 3000 ?
      Math.ceil(dataSetEl.bounds.xMax * 0.006) * 200 : Math.ceil(dataSetEl.bounds.xMax * 0.0024) * 500;

      // this.tensorflowDrawService.updateBounds(dataSetEl.bounds);

    }
    this.redraw(dataSetEl, null, this.d.classify ? 'svg_graph_deploy' : 'svg_graph_data');
  }


  handleIncomingData(referenceData: number, serialPath: string, motorID: string, receivedData: any) {

    this.startRecording(referenceData); //data.velocity

    if (this.d.recording.starttime !== null) {

      this.updateRecording(referenceData); //data.velocity

      if (this.config.stopRecordingCounter < 10) {

        const dataSetEl = !this.d.classify ? this.d.selectedDataset : this.d.selectedMLDataset;

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

                this.checkBounds(inputItem.value, dataSetEl);
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

  checkBounds(value: number, set: any) {
    if (!this.d.classify) {
      if (value > set.bounds.yMax) {
        set.bounds.yMax = value >= 10 || set.bounds.yMin <= -10 ? Math.ceil(value/5) * 5 : Math.ceil(value * 2) / 2;
        this.tensorflowDrawService.updateBounds(set.bounds, 'svg_graph_data');

      } else if (value < set.bounds.yMin) {
        this.d.selectedDataset.bounds.yMin = value <= -10 || set.bounds.yMax >= 10 ? Math.floor(value/5) * 5 : Math.floor(value * 2) / 2; //Math.floor(value/2) * 2
        this.tensorflowDrawService.updateBounds(set.bounds, 'svg_graph_data');
      }
    }
  }



  redraw(set = this.d.selectedDataset, lines = this.d.trimLines, id: string) {
    const size = { width: innerWidth - 395, height: innerHeight - 70, margin: 70 };
    const bounds = set ? set.bounds : new Bounds();
    this.tensorflowDrawService.updateBounds(bounds, id);
    this.tensorflowDrawService.drawGraph(id, bounds, size);
    if (set) {
      this.tensorflowDrawService.drawTensorFlowGraphData(set, this.d.trimLinesVisible ? lines : null, id);
    }
  }




}
