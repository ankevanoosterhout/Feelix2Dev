import { DOCUMENT } from '@angular/common';
import { Component, OnInit, Inject, HostListener } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { TensorFlowMainService } from 'src/app/services/tensorflow-main.service';
// import { v4 as uuid } from 'uuid';
import { TensorFlowDrawService } from 'src/app/services/tensorflow-draw.service';
import { TensorFlowConfig } from 'src/app/models/tensorflow-config.model';
import { TensorFlowData } from 'src/app/models/tensorflow-data.model';
import { TensorFlowTrainService } from 'src/app/services/tensorflow-train.service';

@Component({
  selector: 'app-tensorflow',
  templateUrl: './tensorflow.component.html',
  styleUrls: ['./tensorflow.component.scss', './../file/file-list.component.css'],
})
export class TensorflowComponent {

  public config: TensorFlowConfig;
  public d: TensorFlowData;



  constructor(@Inject(DOCUMENT) private document: Document, private electronService: ElectronService, public tensorflowService: TensorFlowMainService,
              private tensorflowDrawService: TensorFlowDrawService, private tensorflowTrainService: TensorFlowTrainService) {

                this.config = this.tensorflowDrawService.config;
                this.d = this.tensorflowService.d;
              }


  selectStep(step: number) {
    this.config.activeStep = step;
  }



}
