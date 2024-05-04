
import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { Activation, ActivationLabelMapping, Model, ModelType, ModelTypeMapping } from 'src/app/models/tensorflow.model';
import { TensorFlowMainService } from 'src/app/services/tensorflow-main.service';
import { ML_Data, TensorFlowData } from 'src/app/models/tensorflow-data.model';
import { v4 as uuid } from 'uuid';
import { ElectronService } from 'ngx-electron';
import { TensorFlowModelDrawService } from 'src/app/services/tensorflow-model-draw.service';

@Component({
  selector: 'app-tensorflow-model',
  templateUrl: 'tensorflow-model.component.html',
  styleUrls: ['../../windows/effects/effects.component.css','./../tensorflow.component.scss'],
})
export class TensorflowModelComponent implements OnInit {

  public d: TensorFlowData;

  public ActivationLabelMapping = ActivationLabelMapping;
  public activationOptions = Object.values(Activation);

  public ModelTypeMapping = ModelTypeMapping;
  public modelTypeOptions = Object.values(ModelType).filter(value => typeof value === 'number');



  constructor(@Inject(DOCUMENT) private document: Document, private tensorflowService: TensorFlowMainService, private tensorflowModelDrawService: TensorFlowModelDrawService,
              private electronService: ElectronService) {

      this.d = this.tensorflowService.d;

      this.electronService.ipcRenderer.on('save-model', (event: Event, copy: boolean) => {
        this.tensorflowService.saveModel(copy);
      });

      this.electronService.ipcRenderer.on('export-model', (event: Event) => {
        this.tensorflowService.exportModel();
      });

      this.electronService.ipcRenderer.on('new-model', (event: Event) => {
        this.d.selectedModel = new Model(uuid(), 'model', ModelType.neuralNetwork);
        this.tensorflowService.updateModelSettings(this.d.selectedModel);
      });
  }



  ngOnInit(): void {

    this.tensorflowModelDrawService.drawModel(this.d.selectedModel);
  }



  updateModelType() {
    this.tensorflowService.updateModelType();
  }

  addInputItem() {
    this.tensorflowService.addInputItem();
  }

  addClassifier() {
    this.tensorflowService.addClassifier();
  }

}
