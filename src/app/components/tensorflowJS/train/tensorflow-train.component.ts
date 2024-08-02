
import { Component, HostListener, OnInit } from '@angular/core';
import { Bounds } from 'src/app/models/tensorflow.model';
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

  public graphID_A = 'svg_graph_training_A';
  public graphID_B = 'svg_graph_training_B';
  public size: { width: number, height: number, margin: number };

  constructor(public tensorflowService: TensorFlowMainService, private tensorflowDrawService: TensorFlowDrawService, private tensorflowTrainingService: TensorFlowTrainService) {
    this.size = { width: innerWidth - (this.tensorflowService.d.sidebarWidth + 300), height: (innerHeight - 160) / 2, margin: 70 };

    this.tensorflowTrainingService.updateTrainingGraph.subscribe(() => {
      this.drawData();
    });
  }


  ngOnInit(): void {
    this.split(true);
    this.tensorflowDrawService.trainingPage = true;
    this.resize();
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
    this.resize();
  }

  resize()  {
    this.size = { width: innerWidth - (this.tensorflowService.d.sidebarWidth + 300), height: (innerHeight - 160) / 2, margin: 70 };
    this.tensorflowDrawService.updateBounds(new Bounds(0, this.tensorflowService.d.selectedModel.training.epochs, 0, 1.0), this.size);
    this.redrawGraph();
  }

  redrawGraph() {
    this.tensorflowDrawService.drawGraph(this.graphID_A, this.size);
    this.tensorflowDrawService.drawGraph2(this.graphID_B, this.size);
    if (this.tensorflowService.d.selectedModel.training.logs.length > 0) {
      this.drawData();
    }
  }

  drawData() {
    this.tensorflowDrawService.drawTensorflowTrainingProgress(this.tensorflowService.d.selectedModel.training.logs);
    this.tensorflowDrawService.drawTensorflowTrainingProgress2(this.tensorflowService.d.selectedModel.training.logs);
  }





}
