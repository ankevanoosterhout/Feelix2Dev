import { DOCUMENT } from '@angular/common';
import { Component, Inject, ChangeDetectorRef } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { TensorFlowMainService } from 'src/app/services/tensorflow-main.service';
import { v4 as uuid } from 'uuid';
import { TensorFlowDrawService } from 'src/app/services/tensorflow-draw.service';
import { TensorFlowConfig } from 'src/app/models/tensorflow-config.model';
import { TensorFlowData } from 'src/app/models/tensorflow-data.model';
import { DataSet, Model, ModelType } from 'src/app/models/tensorflow.model';
import { TensorFlowModelDrawService } from 'src/app/services/tensorflow-model-draw.service';
import { TensorFlowRecordService } from 'src/app/services/tensorflow-record.service';

@Component({
  selector: 'app-tensorflow',
  templateUrl: './tensorflow.component.html',
  styleUrls: ['./tensorflow.component.scss', './../file/file-list.component.css'],
})
export class TensorflowComponent {

  public config: TensorFlowConfig;
  public d: TensorFlowData;



  constructor(@Inject(DOCUMENT) private document: Document, public tensorflowService: TensorFlowMainService, private changeDetection: ChangeDetectorRef,
      private tensorflowDrawService: TensorFlowDrawService, private tensorflowModelDrawService: TensorFlowModelDrawService, private electronService: ElectronService,
      private tensorFlowRecordService: TensorFlowRecordService) {

    this.config = this.tensorflowDrawService.config;
    this.d = this.tensorflowService.d;

    this.tensorflowService.updateTrainingProgress.subscribe(data => {
      this.config.progress = data.progress;
      this.config.status = data.status;
      this.document.getElementById('msg').innerHTML = this.config.status;
      const width = 244 * (this.config.progress / 100);
      this.document.getElementById('progress').style.width = width + 'px';

    });

    this.electronService.ipcRenderer.on('load-from-files', (event: Event, data: any) => {
      if (data.type === 'loadData' || data.type === 'loadMLData') {
        this.tensorflowService.importDataSet(data.d);
      } else if (data.type === 'loadMLModel') {
        this.tensorflowService.importModel(data.d);
      } else if (data.type === 'loadTrainingData') {
        this.tensorflowService.importLogFile(data.d);
        this.changeDetection.detectChanges();
      }
    });


    this.tensorflowService.createModel.subscribe(res => {
      this.selectStep(res);
    });

    this.electronService.ipcRenderer.on('load-model', (event: Event, data: any) => {
      if (data && data[0]) {
        this.tensorflowService.loadModel(data[0].id);
      }
    });

    this.electronService.ipcRenderer.on('export-dataset-model', (event: Event, data: any) => {
      this.tensorflowService.saveDataNN(data);
    });

    this.electronService.ipcRenderer.on('load-datasets', (event: Event, data: any) => {
      this.tensorflowService.loadDataSets(data.d);
      this.changeDetection.detectChanges();
    });

    this.tensorflowService.loadData.subscribe((res) => {
      this.tensorflowService.loadDataSets(res);
      this.changeDetection.detectChanges();
    });

    this.tensorflowService.redraw.subscribe((res) => {
      this.tensorFlowRecordService.redraw((res.page === 'data' ? this.d.selectedDataset : this.d.selectedMLDataset), this.d.trimLines, (res.page === 'data' ? 'svg_graph_data' : 'svg_graph_deploy'));
    });


    this.electronService.ipcRenderer.on('motorData', (event: Event, data: any) => {
      const velocity = data.d.filter((d: { name: string; }) => d.name === 'velocity')[0];
      if (velocity) {
        this.tensorFlowRecordService.handleIncomingData(velocity.val, data.serialPath, data.motorID, data.d);
      }
    });

    this.electronService.ipcRenderer.on('pneumaticDataPressure', (event: Event, data: any) => {
      // console.log(data);

      for (const item of data.list) {
        // console.log(item);
        const pressure = item.d.filter((i: { name: string; }) => i.name === 'pressure')[0];
        if (pressure) {
          this.tensorFlowRecordService.handleIncomingData(pressure.val, data.serialPath, item.motorID, item.d);
        }
      }
    });

  }


  selectStep(step: number) {
    this.config.activeStep = step;
    this.d.multipleSelect.active = false;

    switch (step) {
      case(0): {
        if (this.d.selectedModel === undefined) {
          this.d.selectedModel = new Model(uuid(), 'custom model', ModelType.custom);
        }
        this.tensorflowModelDrawService.drawModel(this.d.selectedModel);
      }
      break;
      case(1): {
        this.tensorFlowRecordService.redraw(this.d.selectedDataset, this.d.trimLines, 'svg_graph_data');
      }
      break;
      case(2): {
        this.tensorflowDrawService.redrawGraphTraining.next(true);
      }
      break;
      case(3): {
        this.tensorFlowRecordService.redraw(this.d.selectedMLDataset, null, 'svg_graph_deploy');
      }
      break;
      default:
      break;
    }
  }








}
