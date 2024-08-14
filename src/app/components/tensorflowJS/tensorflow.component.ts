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

@Component({
  selector: 'app-tensorflow',
  templateUrl: './tensorflow.component.html',
  styleUrls: ['./tensorflow.component.scss', './../file/file-list.component.css'],
})
export class TensorflowComponent {

  public config: TensorFlowConfig;
  public d: TensorFlowData;



  constructor(@Inject(DOCUMENT) private document: Document, public tensorflowService: TensorFlowMainService, private changeDetection: ChangeDetectorRef,
      private tensorflowDrawService: TensorFlowDrawService, private tensorflowModelDrawService: TensorFlowModelDrawService, private electronService: ElectronService) {

    this.config = this.tensorflowDrawService.config;
    this.d = this.tensorflowService.d;

    this.tensorflowService.updateTrainingProgress.subscribe(data => {
      this.config.progress = data.progress;
      this.config.status = data.status;
      this.document.getElementById('msg').innerHTML = this.config.status;
      const width = 244 * (this.config.progress / 100);
      this.document.getElementById('progress').style.width = width + 'px';

    });

    this.electronService.ipcRenderer.on('load-ml-model-from-files', (event: Event, data: any) => {
      this.tensorflowService.importModel(data);
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

    this.electronService.ipcRenderer.on('load-from-files', (event: Event, data: any) => {
      this.tensorflowService.importDataSet(data);
    });

    this.electronService.ipcRenderer.on('load-datasets', (event: Event, data: Array<DataSet>) => {
      this.tensorflowService.loadDataSets(data);
      this.changeDetection.detectChanges();
    });

    this.tensorflowService.loadData.subscribe((res) => {
      this.tensorflowService.loadDataSets(res);
      this.changeDetection.detectChanges();
    });

    this.tensorflowService.redrawNN.subscribe(() => {
      this.tensorflowModelDrawService.drawModel(this.d.selectedModel);
    })

  }


  selectStep(step: number) {
    this.config.activeStep = step;

    switch (step) {
      case(0): {
        if (this.d.selectedModel === undefined) {
          this.d.selectedModel = new Model(uuid(), 'custom model', ModelType.custom);
        }
        this.tensorflowModelDrawService.drawModel(this.d.selectedModel);
      }
      break;
      case(1): {
        this.tensorflowDrawService.redraw.next(true);
      }
      break;
      case(2): {
        this.tensorflowDrawService.redrawGraphTraining.next(true);
      }
      break;
      case(3): {
        if (this.d.mlOutputData.length > 0) {
          console.log('print output data');
        }
      }
      break;
      default: { console.log('step not listed'); }
      break;
    }
  }








}
