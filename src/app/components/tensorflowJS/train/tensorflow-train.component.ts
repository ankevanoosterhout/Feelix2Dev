
import { Component, HostListener, OnInit } from '@angular/core';
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

  public graphID = 'svg_graph_training';
  public size: { width: number, height: number, margin: number };

  constructor(public tensorflowService: TensorFlowMainService, private tensorflowDrawService: TensorFlowDrawService, private tensorflowTrainingService: TensorFlowTrainService) {
    this.size = { width: innerWidth - (this.tensorflowService.d.sidebarWidth + 300), height: innerHeight - 190, margin: 70 };

    this.tensorflowTrainingService.updateTrainingGraph.subscribe((res) => {
      this.tensorflowDrawService.drawTensorflowTrainingProgress(res, this.size);
    });
  }


  ngOnInit(): void {
    this.split(true);
  }

  split(first: boolean = false) {
    this.tensorflowTrainingService.splitData(this.tensorflowService.d.selectedModel.training.distribution, first);
  }


  train() {
    this.tensorflowTrainingService.processData();
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
    this.size = { width: innerWidth - (this.tensorflowService.d.sidebarWidth + 300), height: innerHeight - 190, margin: 70 };
    this.tensorflowDrawService.drawGraph(this.graphID, this.size);
  }






}
