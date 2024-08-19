
import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { ElectronService } from 'ngx-electron';
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
  training = false;



  constructor(public tensorflowService: TensorFlowMainService, private tensorflowDrawService: TensorFlowDrawService, private tensorflowTrainService: TensorFlowTrainService,
              private changeDetection: ChangeDetectorRef, private electronService: ElectronService) {

    this.d = this.tensorflowService.d;

    this.tensorflowTrainService.updateTrainingGraph.subscribe((data) => {
      const max = data.e * 1.2 > this.d.selectedModel.training.epochs ? this.d.selectedModel.training.epochs : data.e * 1.2;
      const file = this.d.trainingData.filter(t => t.open)[0];

      if (file) {
        file.bounds_loss.xMax = max;
        file.bounds_metric.xMax = max;
        file.bounds_loss.yMax = Math.max(file.bounds_loss.yMax, data.loss * 1.2, data.val_loss * 1.2);
        file.bounds_metric.yMax = Math.max(file.bounds_metric.yMax, data.metric * 1.2, data.val_metric * 1.2);


        // this.tensorflowDrawService.updateBounds(file.bounds_loss, this.graphID_A, this.size);
        // this.tensorflowDrawService.updateBounds(file.bounds_metric, this.graphID_B, this.size);
        this.tensorflowDrawService.redrawGraph(file, this.size);
      }
    });

    this.tensorflowTrainService.selectLogFile.subscribe((id) => {
      this.selectLogFile(id);
    });

    this.tensorflowService.selectLogFileTrain.subscribe((id) => {
      this.selectLogFile(id);
    });
  }


  ngOnInit(): void {
    this.updateSize();
    this.split(true);
  }

  ngAfterViewInit(): void {
    this.tensorflowDrawService.redrawGraph(this.d.trainingData.length > 0 ? this.d.trainingData.filter(t => t.open || (this.d.selectedTrainingSet && t.id === this.d.selectedTrainingSet.id))[0] : null, this.size);
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
      this.tensorflowTrainService.handleError(e);
      return false;
    }
  }


  async compileModel() {
    try {
      this.tensorflowTrainService.processingModel(false);
      return true;
    }
    catch(e: any) {
      this.tensorflowTrainService.handleError(e);
      return false;
    }
  }

  deploy() {
    if (!this.d.selectedModel.model.isTraining) {
      this.d.classify = true;
      this.tensorflowService.createModel.next(3);
    }
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
    this.tensorflowDrawService.redrawGraph(this.d.trainingData.length > 0 ? this.d.trainingData.filter(t => t.open || (this.d.selectedTrainingSet && t.id === this.d.selectedTrainingSet.id))[0] : null, this.size);
  }


  selectLogFile(id: string) {
    this.tensorflowService.selectLogFile(id);
    this.changeDetection.detectChanges();
    this.resize();
  }

  deleteLogFile(id: string) {
    // if (!this.training) {
    if (this.d.trainingData.length === 1) {
      this.d.trainingData = [];
    } else {
      this.tensorflowService.deleteLogFile(id);
    }
    this.changeDetection.detectChanges();
    this.resize();
    // }
  }

  shuffle() {
    this.d.random = !this.d.random;
    this.split();
  }

  exportLogFiles() {
    if (this.d.trainingData.length > 0) {

      this.tensorflowService.exportFileData(this.d.trainingData);
    }
  }

  importLogFiles() {
    this.electronService.ipcRenderer.send('loadDataFromFile', { storageName: 'loadTrainingData', storageLocation: 'loadDataLocation' });
  }

  createTrainingLogFile() {
    this.tensorflowTrainService.createLogFile();
  }
}
