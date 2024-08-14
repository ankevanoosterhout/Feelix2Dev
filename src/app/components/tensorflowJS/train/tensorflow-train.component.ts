
import { Component, HostListener, OnInit } from '@angular/core';
import { TensorFlowData } from 'src/app/models/tensorflow-data.model';
import { Bounds, TrainingSet } from 'src/app/models/tensorflow.model';
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
  styleUrls: ['../../windows/effects/effects.component.css','./../sidebar.component.scss', './../tensorflow.component.scss'],
})
export class TensorflowTrainComponent implements OnInit {

  public graphID_A = 'svg_graph_training_A';
  public graphID_B = 'svg_graph_training_B';
  public size: { width: number, height: number, margin: number };
  public d: TensorFlowData;

  constructor(public tensorflowService: TensorFlowMainService, private tensorflowDrawService: TensorFlowDrawService, private tensorflowTrainService: TensorFlowTrainService) {
    this.d = this.tensorflowService.d;
    this.resize();

    this.tensorflowTrainService.updateTrainingGraph.subscribe((epoch) => {
      const max = epoch * 1.2 > this.d.selectedModel.training.epochs ? this.d.selectedModel.training.epochs : epoch * 1.2;
      this.tensorflowDrawService.updateBounds({xMin: 0, xMax:max, yMin: 0, yMax: 2}, this.size);
      this.redrawGraph();
    });

    this.tensorflowTrainService.selectLogFile.subscribe((id) => {
      this.selectLogFile(id);
    });

    this.tensorflowDrawService.redrawGraphTraining.subscribe((res) => {
      this.resize();
    });
  }


  ngOnInit(): void {
    this.split(true);
  }

  split(first: boolean = false) {
    this.tensorflowTrainService.splitData(this.d.selectedModel.training.distribution, first);
  }


  async train() {
    this.d.selectedModel.model = undefined;
    this.tensorflowService.updateProgess('Compiling the model', 5);
    const success = await this.compileModel();
    if (!success) { return; }

    this.tensorflowService.updateProgess('Processing data', 10);
    this.processData();
  }

  
  async processData() {
    try {
      this.tensorflowTrainService.processData();
      return true;
    }
    catch(e: any) {
      const error = (e as Error).message;
      this.tensorflowService.updateProgess(error, 0);
      return false;
    }
  }


  async compileModel() {
    try {
      this.tensorflowTrainService.processingModel(false);
      return true;
    }
    catch(e: any) {
      const error = (e as Error).message;
      this.tensorflowService.updateProgess(error, 0);
      return false;
    }
  }

  deploy() {

  }


  compareFunction(el1: any, el2: any) {
    return el1 && el2 ? el1.name === el2.name : el1 === el2;
  }




  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.resize();
  }

  updateSize() {
    this.size = { width: innerWidth - (this.d.sidebarWidth + 450), height: (innerHeight - 240) / 2, margin: innerWidth * 0.035 };
  }

  resize()  {
    this.updateSize();
    const newBounds = new Bounds(0,this.d.selectedModel.training.epochs, 0, 2);
    this.tensorflowDrawService.updateBounds(newBounds, this.size);
    this.redrawGraph();
  }

  redrawGraph() {
    this.tensorflowDrawService.drawGraph(this.graphID_A, this.size);
    this.tensorflowDrawService.drawGraph2(this.graphID_B, this.size);
    const dataFile = this.d.trainingData.filter(t => t.open)[0];
    if (dataFile) {
      this.drawData(dataFile);
    }
  }

  drawData(logs: TrainingSet) {
    if (logs) {
      this.tensorflowDrawService.drawTensorflowTrainingProgress(logs.data, this.size);
    }
  }

  selectLogFile(id: string) {
    this.tensorflowService.selectLogFile(id);
    this.resize();
  }






}
