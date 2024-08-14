
import { DOCUMENT } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { Activation, ActivationLabelMapping, Model, ModelType, ModelTypeMapping } from 'src/app/models/tensorflow.model';
import { TensorFlowMainService } from 'src/app/services/tensorflow-main.service';

import { ML_Data, TensorFlowData } from 'src/app/models/tensorflow-data.model';
import { TensorFlowTrainService } from 'src/app/services/tensorflow-train.service';
import { v4 as uuid } from 'uuid';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'app-model',
  templateUrl: 'model.component.html',
  styleUrls: ['../../windows/effects/effects.component.css', './../tensorflowJS.component.css'],
})
export class ModelComponent {

  public d: TensorFlowData;

  public ActivationLabelMapping = ActivationLabelMapping;
  public activationOptions = Object.values(Activation);

  public ModelTypeMapping = ModelTypeMapping;
  public modelTypeOptions = Object.values(ModelType).filter(value => typeof value === 'number');




  constructor(@Inject(DOCUMENT) private document: Document, private tensorflowService: TensorFlowMainService, private tensorflowTrainService: TensorFlowTrainService,
              private electronService: ElectronService) {
    this.d = this.tensorflowService.d;

    this.electronService.ipcRenderer.on('save-model', (event: Event, copy: boolean) => {
      this.tensorflowService.saveModel(copy);
    });

    this.electronService.ipcRenderer.on('export-model', (event: Event) => {
      this.tensorflowService.exportModel();
    });
  }



  initializeNN_Model() {
    if (!this.d.processing && this.d.dataSets.length > 0) {

      this.tensorflowService.updateProgess('training', 0);

      this.document.body.style.cursor = 'wait';

      this.d.processing = true;
      this.tensorflowService.updateProgess('initializing model', 10);

      const data = this.tensorflowTrainService.createJSONfromDataSet(this.d.dataSets, true);

      const inputLabels = [];
      const outputLabels = [];

      for (const input of this.d.selectedModel.inputs) {
        if (input.active) { inputLabels.push(input.name); }
      }

      for (const output of this.d.selectedModel.outputs) {
        for (const label of output.labels) {
          if (label.name) {
            if (!outputLabels.includes(label.name)) { outputLabels.push(label.name); }
          }
        }
      }

      this.d.selectedModel.inputs = inputLabels;
      this.d.selectedModel.layers[this.d.selectedModel.layers.length - 1].options.outputs = outputLabels;

      this.tensorflowTrainService.createTensors();

      (this.document.getElementById('deploy') as HTMLButtonElement).disabled = true;

    } else {
      this.tensorflowService.updateProgess(this.d.processing ? 'training in progress': 'no data', 0);
    }
  }



  initializeRegression_Model() {
    if (!this.d.processing) {
      this.tensorflowService.updateProgess('this feature is not yet implemented', 0);
    }
  }


  classifyAtRunTime() {
    if (this.d.selectedModel.model) {

      if (!this.d.classify) {
        this.d.processing = false;
        this.d.classify = true;
        this.d.ML_OutputData.push(new ML_Data(uuid()))
        this.tensorflowService.updateProgess('deploy', 100);
        this.document.getElementById('record-button').click();
      } else {
        this.d.processing = false;
        this.d.classify = false;
        this.d.predictionDataset = null;
        this.tensorflowService.updateProgess('stopped', 0);
        this.tensorflowService.resetFiltersMicrocontroller();
      }
    }
  }

  addInputItem() {
    this.tensorflowService.addInputItem();
  }

  resetInputList() {
    this.tensorflowService.resetInputList();
  }

  updateInput(index: number) {
    this.tensorflowService.updateInput(index);
  }

  deleteInputItem(index: number) {
    this.tensorflowService.deleteInputItem(index);
  }

  addOutput() {
    this.tensorflowService.addOutput();
  }

  deleteClassifier(index: number) {
    this.tensorflowService.deleteClassifier(index);
  }

  selectClassifier(id: string) {
    this.tensorflowService.selectClassifier(id);
  }

  updateClassifier(i: number, pos: number) {
    this.tensorflowService.updateClassifier(i, pos);
  }

  updateModelType() {
    this.tensorflowService.updateModelType();
  }

  stopTraining() {
    this.tensorflowService.stopTraining();
  }

  compareFunction(el1: any, el2: any) {
    return el1 && el2 ? el1.name === el2.name : el1 === el2;
  }


}
