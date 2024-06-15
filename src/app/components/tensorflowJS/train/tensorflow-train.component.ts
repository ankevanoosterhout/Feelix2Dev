
import { DOCUMENT } from '@angular/common';
import { Component, HostListener, Inject, Input, OnInit } from '@angular/core';
import { TensorFlowConfig } from 'src/app/models/tensorflow-config.model';
import { TensorFlowData } from 'src/app/models/tensorflow-data.model';
import { TensorFlowDrawService } from 'src/app/services/tensorflow-draw.service';
import { TensorFlowMainService } from 'src/app/services/tensorflow-main.service';
import { TensorFlowTrainService } from 'src/app/services/tensorflow-train.service';
// import { Activation, ActivationLabelMapping, Model, ModelType, ModelTypeMapping } from 'src/app/models/tensorflow.model';
// import { TensorFlowMainService } from 'src/app/services/tensorflow-main.service';

// import { ML_Data, TensorFlowData } from 'src/app/models/tensorflow-data.model';
// import { TensorFlowTrainService } from 'src/app/services/tensorflow-train.service';
// import { v4 as uuid } from 'uuid';
// import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'app-tensorflow-train',
  templateUrl: 'tensorflow-train.component.html',
  styleUrls: ['../../windows/effects/effects.component.css','./../tensorflow.component.scss'],
})
export class TensorflowTrainComponent implements OnInit {

  public d: TensorFlowData;
  public config: TensorFlowConfig;

  public graphID = 'svg_graph_training';
  public size: { width: number, height: number, margin: number };

  constructor(@Inject(DOCUMENT) private document: Document, public tensorflowService: TensorFlowMainService, private tensorflowDrawService: TensorFlowDrawService,
              private tensorflowTrainingService: TensorFlowTrainService) {
    this.d = this.tensorflowService.d;
    this.size = { width: innerWidth - (this.d.sidebarWidth + 300), height: innerHeight - 205, margin: 80 };
    this.config = this.tensorflowDrawService.config;

  }


  ngOnInit(): void {
    // this.tensorflowDrawService.drawTrainingSlider();
  }


  train() {
    this.tensorflowTrainingService.CreateTensors(this.d.dataSets, this.d.selectedModel);
  }

  validate() {

  }

  deploy() {

  }


  compareFunction(el1: any, el2: any) {
    return el1 && el2 ? el1.name === el2.name : el1 === el2;
  }


  updateSidebarColumn(open: number) {

  }


  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.size = { width: innerWidth - 470, height: innerHeight - 219, margin: 80 };
    this.tensorflowDrawService.drawGraph(this.graphID, this.size);
  }






}
