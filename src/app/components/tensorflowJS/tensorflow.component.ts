import { DOCUMENT } from '@angular/common';
import { Component, OnInit, Inject, HostListener } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { TensorFlowMainService } from 'src/app/services/tensorflow-main.service';
import { v4 as uuid } from 'uuid';
import { TensorFlowDrawService } from 'src/app/services/tensorflow-draw.service';
import { TensorFlowConfig } from 'src/app/models/tensorflow-config.model';
import { TensorFlowData } from 'src/app/models/tensorflow-data.model';
import { Model, ModelType } from 'src/app/models/tensorflow.model';
import { TensorFlowModelDrawService } from 'src/app/services/tensorflow-model-draw.service';

@Component({
  selector: 'app-tensorflow',
  templateUrl: './tensorflow.component.html',
  styleUrls: ['./tensorflow.component.scss', './../file/file-list.component.css'],
})
export class TensorflowComponent {

  public config: TensorFlowConfig;
  public d: TensorFlowData;



  constructor(@Inject(DOCUMENT) private document: Document, public tensorflowService: TensorFlowMainService,
      private tensorflowDrawService: TensorFlowDrawService, private tensorflowModelDrawService: TensorFlowModelDrawService, private electronService: ElectronService) {

    this.config = this.tensorflowDrawService.config;
    this.d = this.tensorflowService.d;

    this.tensorflowService.updateTensorflowProgress.subscribe(data => {
      this.config.progress = data.progress;
      this.config.status = data.status;
      this.document.getElementById('msg').innerHTML = this.config.status;
      const width = 244 * (this.config.progress / 100);
      this.document.getElementById('progress').style.width = width + 'px';
    });


    this.electronService.ipcRenderer.on('deploy-model', (event: Event) => {
      this.document.getElementById('deploy').click();
    });

    this.electronService.ipcRenderer.on('train-model', (event: Event) => {
      this.document.getElementById('train').click();
    });

    this.tensorflowService.createModel.subscribe(res => {
      this.selectStep(res);
    });


  }


  selectStep(step: number) {
    this.config.activeStep = step;

    if (step === 0) {
      if (this.d.selectedModel === undefined) {
        this.d.selectedModel = new Model(uuid(), 'custom model', ModelType.custom);
      }
      this.tensorflowModelDrawService.drawModel(this.d.selectedModel);
    } else if (step === 1) {
      this.tensorflowDrawService.drawGraph();
    } else if (step === 2) {

    } else if (step === 3) {

    }
  }







  // @HostListener('window:keydown', ['$event'])
  // onKeyDown(e: KeyboardEvent) {

  // }

  // @HostListener('window:keyup', ['$event'])
  // onKeyDown(e: KeyboardEvent) {

  // }



}
