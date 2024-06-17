import { Injectable } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { LocalStorageService } from 'ngx-webstorage';
import { CloneService } from './clone.service';
import { DataSet } from '../models/tensorflow.model';
import { Folder } from '../models/file.model';

@Injectable()
export class DataSetService {

  public static readonly LIBRARY_LOCATION = 'ngx-webstorage|dataSets';

  dataSetLibrary: Array<any> = [];


  constructor(private localSt: LocalStorageService, private cloneService: CloneService) {


    window.addEventListener('storage', event => {
      if (event.storageArea === localStorage) {
        if (event.key === DataSetService.LIBRARY_LOCATION) {
          const dataSetLib: Array<any> = JSON.parse(localStorage.getItem(DataSetService.LIBRARY_LOCATION));
          this.dataSetLibrary = dataSetLib;
        }
      }
    },
    true
    );

  }


  getDataFromLocalStorage() {
    const dataSets = this.localSt.retrieve('dataSetLibrary');
    if (dataSets) {
      this.dataSetLibrary = dataSets;
    }
  }


  getAllDataSets(folderID = null) {
    this.getDataFromLocalStorage();
    if (folderID) {
      return this.getFolder(folderID, this.dataSetLibrary.filter(d => d instanceof Folder));
    }
    return this.dataSetLibrary;
  }

  getFolder(id: string, files: Array<any>) {
    if (files) {
      for (const item of files) {
        if (item.id === id) {
          return item.content;
        } else {
          this.getFolder(id, item.content);
        }
      }
    }
    return [];
  }

  updateDataSet(dataSet: DataSet, activeFolder: any) {
    if (activeFolder.id) {
      const folder = this.getFolder(activeFolder.id, this.dataSetLibrary.filter(d => d instanceof Folder));
      if (folder) {
        let item = folder.content.filter(d => d.id === dataSet.id)[0];
        if (item) { item = dataSet; }
      }
    } else {
      let item = this.dataSetLibrary.filter(d => d.id === dataSet.id)[0];
      if (item) { item = dataSet; }
    }
    this.store();
  }

  loadDataSet(id: string) {
    this.getDataFromLocalStorage();
    const dataSet = this.dataSetLibrary.filter(d => d.id === id)[0];

    return dataSet;
  }

  deleteDataSet(id: String) {
    this.getDataFromLocalStorage();
    const set = this.dataSetLibrary.filter(d => d.id === id)[0];
    if (set) {
      const index = this.dataSetLibrary.indexOf(set);
      this.dataSetLibrary.splice(index, 1);
      this.store();
    }
  }


  saveDataSet(dataSet: DataSet) {
    if (dataSet) {
      this.getDataFromLocalStorage();
      let dataSetLib = this.dataSetLibrary.filter(d => d.id === dataSet.id)[0];
      if (dataSetLib) {
        dataSetLib = this.cloneService.deepClone(dataSet);
        dataSetLib.name = dataSet.name;
        dataSet.date.modified = new Date().getTime();
        dataSetLib.date = this.cloneService.deepClone(dataSet.date);
        dataSetLib.selected = false;

      } else {
        dataSet.id = uuid();
        dataSet.date.modified = new Date().getTime();
        dataSet.selected = false;
        this.dataSetLibrary.push(dataSet);
      }
      this.store();
    }
  }



  createFolder(files: Array<any>, name:string, level: number) {
    const newFolder = new Folder(uuid(), name);
    for (const d of files) {
      if (d.selected) {
        d.selected = false;
        newFolder.content.push(d);
        const index = this.dataSetLibrary.indexOf(d);
        if (index > -1) {
          this.dataSetLibrary.splice(index, 1);
        }
      }
    }
    newFolder.level = level + 1;
    newFolder.date.modified = new Date().getTime();
    this.dataSetLibrary.push(newFolder);
    this.store();
  }

  copyDataSet(dataSet: DataSet) {
    if (dataSet) {
      const copy = this.cloneService.deepClone(dataSet);
      copy.date = this.cloneService.deepClone(dataSet.date);
      copy.id = uuid();
      copy.selected = false;
      return copy;
    }
  }


  clear() {
    this.dataSetLibrary = [];
    this.store();
  }


  store() {
    this.localSt.store('dataSetLibrary', this.dataSetLibrary);
  }









}
