import { Injectable } from '@angular/core';
import { LocalStorageService } from '../services/local-storage-fallback.service';
import { Model, TrainingSet } from '../models/tensorflow.model';
import { v4 as uuid } from 'uuid';

// import { CloneService } from './clone.service';


@Injectable()
export class TensorFlowModelService {

  public static readonly LIBRARY_LOCATION = 'ngx-webstorage|models';

  models: Array<Model> = [];
  trainingData: Array<TrainingSet> = [];


  constructor(private localSt: LocalStorageService) {

    window.addEventListener('storage', event => {
      if (event.storageArea === localStorage) {
        if (event.key === TensorFlowModelService.LIBRARY_LOCATION) {
          const lib = localStorage.getItem(TensorFlowModelService.LIBRARY_LOCATION);
          const dataSetLib: Array<Model> = lib? JSON.parse(lib) : [];
          this.models = dataSetLib;
        }
      }
    },
    true
    );
  }


  getDataFromLocalStorage() {
    const savedModels = this.localSt.retrieve('models');
    if (savedModels) {
      this.models = savedModels;
    }
  }

  getAllModels(): Array<Model> {
    this.getDataFromLocalStorage();
    return this.models;
  }

  saveModel(model: Model, copy: boolean) {
    this.getDataFromLocalStorage();
    let modelItem = this.models.filter(m => m.id === model.id)[0];
    if (!copy && modelItem) {
      modelItem = model;
      return modelItem.id;
    } else {
      model.id = uuid();
      this.models.push(model);
      this.store();
      // console.log(this.models)
      return model.id;
    }
  }

  getModel(id: String) {
    this.getDataFromLocalStorage();
    return this.models.filter(m => m.id === id)[0];

  }

  deleteModel(id: String) {
    this.getDataFromLocalStorage();
    let model = this.models.filter(m => m.id === id)[0];
    if (model) {
      let index = this.models.indexOf(model);
      if (index > -1) {
        this.models.splice(index, 1);
        this.store();
      }
    }
  }

  updateModelName(model: Model) {
    const m = this.models.filter(m => m.id === model.id)[0];
    if (m) {
      m.name = model.name;
      this.store();
    }
  }

  clear() {
    this.models = [];
    this.store();
  }


  getAllTrainingData() {
    let data: Array<any> = [];

    return data;
  }

  storeTrainingData(data: TrainingSet) {

  }


  store() {
    this.localSt.store('models', this.models);
    // console.log(this.models);
  }






}
