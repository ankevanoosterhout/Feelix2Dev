import { DOCUMENT } from '@angular/common';
import { Injectable, Inject } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { ActuatorType, MicroController } from '../models/hardware.model';
import { Model, DataSet, Classifier, Label, MotorEl, ModelVariable, ModelType, OutputItem, InputColor, VariableType, MLDataSet, Data, MinMax, TrimSection, Bounds } from '../models/tensorflow.model';
import { HardwareService } from './hardware.service';
import { DataSetService } from './dataset.service';
import { Subject } from 'rxjs';
import { TensorFlowModelService } from './tensorflow-model.service';
import { UploadStringModel } from '../models/effect-upload.model';
import { ElectronService } from 'ngx-electron';
import { FileSaverService } from 'ngx-filesaver';
import * as JSZip from 'jszip';
import { TensorFlowData } from '../models/tensorflow-data.model';
import { CloneService } from './clone.service';



@Injectable()
export class TensorFlowMainService {

    public d: TensorFlowData;

    updateTrainingProgress: Subject<any> = new Subject<void>();
    reloadPage: Subject<any> = new Subject<void>();
    updateResizeElements: Subject<any> = new Subject<void>();
    updateGraphBounds: Subject<any> = new Subject<void>();
    updateGraph: Subject<any> = new Subject<void>();
    updateScale: Subject<any> = new Subject<void>();
    drawTrimLines: Subject<any> = new Subject<void>();
    loadData: Subject<any> = new Subject<void>();
    loadMLData: Subject<any> = new Subject<void>();
    redraw: Subject<any> = new Subject<void>();
    redrawNN: Subject<any> = new Subject<void>();
    createModel: Subject<any> = new Subject<void>();
    getColorListItem: Subject<any> = new Subject<void>();

    constructor(@Inject(DOCUMENT) private document: Document, public hardwareService: HardwareService, private dataSetService: DataSetService,
                private tensorflowModelService: TensorFlowModelService, private electronService: ElectronService, private _FileSaverService: FileSaverService,
                private cloneService: CloneService) {

                  this.d = new TensorFlowData();
                }


    deleteDataSets(id: string = null, ML = false) {
      const dataset = !ML ? this.d.dataSets : this.d.mlOutputData;
      const set = dataset.filter(s => id ? s.id === id : s.open)[0];
      let index = -1;
      if (set && !this.d.multipleSelect.active) {
        index = dataset.indexOf(set);
        dataset.splice(index, 1);
      } else {
        for (let i = this.d.multipleSelect.max; i >= this.d.multipleSelect.min; i--) {
          index = i;
          dataset.splice(i, 1);
        }
        this.d.multipleSelect.active = false;
      }
      index--;
      if (dataset.length === 0) {
        if (!ML) {
          this.addDataSet();
          index = 0;
        } else {
          this.redraw.next({ page: ML ? 'deploy' : 'data' });
        }
      }
      if (index > -1 && index < dataset.length) {
        this.selectDataSet(dataset[index].id, ML);
      }

    }

    addDataSet() {
      const newID = uuid();
      this.d.dataSets.push(new DataSet(newID, 'Data set ' + (this.d.dataSets.length + 1), this.d.selectedMicrocontrollers, this.d.selectedModel.outputs));
      this.selectDataSet(newID, false);
    }

    saveDataSet(dataSet: DataSet = this.d.selectedDataset) {
      if (dataSet && !this.d.multipleSelect.active) {
        this.dataSetService.saveDataSet(dataSet);
        this.updateProgess(dataSet.name + ' saved', 100);
      } else {
        for (let i = this.d.multipleSelect.min; i < this.d.multipleSelect.max; i++) {
          this.dataSetService.saveDataSet(this.d.dataSets[i]);
        }
      }
    }

    saveCopyDataSet(page: string) {
      const dataSets = this.getDataSets(page);
      let index = 0;
      for (const set of dataSets) {
        const copy = this.dataSetService.copyDataSet(set);
        if (copy) {
          copy.name += '-copy';
          copy instanceof DataSet ? this.d.dataSets.push(copy) : this.d.mlOutputData.push(copy);
          this.saveDataSet(copy);
          if (index >= dataSets.length - 1) {
            this.selectDataSet(copy.id, false);
          }
        }
        index++;
      }
    }

    getDataSets(page: string) {
      return page === 'data' ?
        this.d.multipleSelect.active ? this.d.dataSets.slice(this.d.multipleSelect.min, this.d.multipleSelect.max + 1) : [ this.d.selectedDataset ] :
        this.d.multipleSelect.active ? this.d.mlOutputData.slice(this.d.multipleSelect.min, this.d.multipleSelect.max + 1) : [ this.d.selectedMLDataset ];
    }

    // mergeDataSets() {
      // const dataSets = this.d.dataSets.slice(this.d.multipleSelect.min, this.d.multipleSelect.max + 1);
      // console.log(dataSets.length);
    // }

    createNewMLDataset() {
      const nrOfSets = this.d.mlOutputData.filter(d => d.name.split('-')[0] === 'Prediction').length + 1;
      const predictionDataset = new MLDataSet(uuid(), 'Prediction-' + nrOfSets, this.d.selectedMicrocontrollers);
      predictionDataset.bounds = new Bounds(0,700,0,1);
      this.d.mlOutputData.push(predictionDataset);

      // this.d.recording.starttime = new Date().getTime();

      this.selectDataSet(predictionDataset.id, true);
    }


    exportFileData(fileData: Array<any>) {
      console.log(fileData);
      if (fileData.length > 1) {
        this.zipFiles(fileData);
      } else if (fileData.length === 1) {
        const dataBlob = this.createBlob(fileData);
        const filename = fileData[0].name + '.json';
        this.saveFile(dataBlob, filename, 'text/plain');
      } else {
        this.updateProgess('No dataset selected', 0);
      }
    }

    saveFile(dataBlob: any, filename: string, type: string) {
      try {
        this._FileSaverService.save(dataBlob, filename, type);
        this.updateProgess('File has been saved', 100);
      }
      catch(e) {
        const error = (e as Error).message;
        console.log(error);
      }
    }


    createBlob(data: any) {
      return new Blob([JSON.stringify(data)], { type: 'text/plain' });
    }

    async zipFiles(files: Array<any>) {
      const zip = new JSZip();

      for (const file of files) {
        const fileblob = this.createBlob([file]);
        const filename = file.name + '.json';
        zip.file(filename, fileblob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      this.saveFile(content, files[0].name + '.zip', 'application/zip');
    }


    importClassifiersFromModel() {
      const dataSets = this.d.multipleSelect.active ? this.d.dataSets.slice(this.d.multipleSelect.min, this.d.multipleSelect.max + 1) : this.d.dataSets;

      for (const set of dataSets) {
        for (const classifier of this.d.selectedModel.outputs) {
          this.addOutputToDataSet(set, classifier);
        }
      }
    }


    importDataSet(data: any) {
      //open dialogue window
      if (data) {
        const dataObj = JSON.parse(data);

        if (dataObj.length > 0 && dataObj[0].m && dataObj[0].m.length > 0) {

          for (const obj of dataObj) {
            if (obj.output) {
              const outputArray = [obj.output];
              obj.outputs = outputArray;
            }
          }

          this.loadData.next(dataObj);

          if (this.d.dataSets.length > 0) {
            this.selectDataSet(this.d.dataSets[this.d.dataSets.length - 1].id, false);
          }
        } else {
          this.loadMLData.next(dataObj);

          if (this.d.mlOutputData.length > 0) {
            this.selectDataSet(this.d.mlOutputData[this.d.mlOutputData.length - 1].id, true);
          }
        }
      }

    }

    trimDataSet() {
      if (this.d.selectedDataset && this.d.selectedDataset.m.length > 0) {

        this.d.trimLinesVisible = true;

        this.updateScale.next(1);

        // this.d.trimLines[0].value = this.d.selectedDataset.bounds.xMin + 50;
        // this.d.trimLines[1].value = this.d.selectedDataset.bounds.xMax - 50;

        this.d.trimLines[0].values.min = this.d.selectedDataset.bounds.xMin + 50;
        this.d.trimLines[0].values.max = this.d.selectedDataset.bounds.xMax - 50;
        this.d.trimLines[0].width = this.d.trimLines[0].values.min - this.d.trimLines[0].values.max;

        this.drawTrimLines.next({ bounds: this.d.selectedDataset.bounds, visible: this.d.trimLinesVisible, lines: this.d.trimLines });
      }
    }


    trimSet() {

      for (let i = this.d.trimLines.length - 1; i >= 0; i--) {
        const dataSetCopy = this.dataSetService.copyDataSet(this.d.selectedDataset);
        dataSetCopy.name = this.d.selectedDataset.name + '-copy-' + (i + 1);

        const bounds = this.trimmedDataSize(dataSetCopy, this.d.trimLines[i].values);

        if (bounds.set.m.length > 0 && bounds.set.m[0].d.length > 0) {

          const span = this.d.trimLines[i].values.max - this.d.trimLines[i].values.min;

          dataSetCopy.bounds.xMin = 0;
          dataSetCopy.bounds.xMax = span < 1000 ? Math.ceil(span / 100) * 100 : span < 3000 ? Math.ceil(span / 200) * 200 : Math.ceil(span / 500) * 500;
          dataSetCopy.bounds.yMin = bounds.yMin < -10 || bounds.yMax > 10 ? Math.floor(bounds.yMin/5) * 5 : Math.floor(bounds.yMin*4) / 4;
          dataSetCopy.bounds.yMax = bounds.yMin < -10 || bounds.yMax > 10 ? Math.ceil(bounds.yMax/5) * 5 : Math.ceil(bounds.yMax*4) / 4;


          this.d.dataSets.push(bounds.set);
        }

      }

      this.d.trimLinesVisible = false;
      this.d.trimLines = [ new TrimSection(uuid(), { min: 10, max: 990 }) ];

      this.selectDataSet(this.d.dataSets[this.d.dataSets.length - 1].id, false);

    }



    trimmedDataSize(dataSet: DataSet = this.dataSetService.copyDataSet(this.d.selectedDataset), lines: MinMax) {

      let Ymin = null;
      let Ymax = null;
      let size = [];
      for (const m of dataSet.m) {
        if (m.d.length > 0) {

          for (let i = m.d.length - 1; i >= 0; i--) {

            if (m.d[i].time < lines.min || m.d[i].time > lines.max) {
              m.d.splice(i, 1);
            } else {
              m.d[i].time -= Math.floor(lines.min);
              for (const el of m.d[i].inputs) {
                if (this.d.selectedModel.inputs.filter(i => i.name === el.name && i.active).length > 0) {
                  if (Ymax === null || el.value > Ymax) { Ymax = el.value; }
                  if (Ymin === null || el.value < Ymin) { Ymin = el.value; }
                }
              }
            }
          }
          size.push(m.d.length);
        }
      }
      return { yMin: Ymin, yMax: Ymax, dataSize: size, set: dataSet };
    }


    scaleYaxisBounds(dataSet: DataSet) {
      let Ymin = null;
      let Ymax = null;
      for (const m of dataSet.m) {
        for (const d of m.d) {
          for (const input of d.inputs) {
            if (input.name !== 'direction' && this.d.selectedModel.inputs.filter(i => i.name === input.name && i.active && i.visible).length > 0) {
              if (Ymax === null ||input.value > Ymax) { Ymax = input.value; }
              if (Ymin === null ||input.value < Ymin) { Ymin = input.value; }
            }
          }
        }
      }
      dataSet.bounds.yMin = Ymin < -10 || Ymax > 10 ? Math.floor(Ymin/5) * 5 : Math.floor(Ymin*4) / 4;
      dataSet.bounds.yMax = Ymin < -10 || Ymax > 10 ? Math.ceil(Ymax/5) * 5 : Math.ceil(Ymax*4) / 4;
    }


    loadDataSet() {
      //open
      this.electronService.ipcRenderer.send('load-dataset', 'dataset');
    }

    showOutputData() {
      this.electronService.ipcRenderer.send('show-ml-output');
    }


    saveDataNN(page: string, data: any = null) {

      const dataSets: Array<any> = this.getDataSets(page);


      if (page === 'data') {
        for (const set of dataSets) {
          console.log(set);
          if (set.classifierID) {
            const output  = this.d.selectedModel.outputs.filter(o => o.id === set.classifierID)[0];
            const index = this.d.selectedModel.outputs.indexOf(output);
            if (index > -1) {
              this.updateOutputDataSet(set, index);
            }
          }
        }
      }

      this.exportFileData(data ? data : dataSets);
    }

    itemsSaved = ((error: any) => {
      if (error) {
        // console.log(error);
        this.updateProgess('not able to save data ' + error, 0);
        return;
      } else {
        this.updateProgess('data saved', 100);
      }
    }).bind(this);



  getItemsMultipleSelect(set: Array<any>, id: string, event = null) {

    const shift = event ? event.shiftKey : false;
    const current = shift ? set.filter(s => s.open)[0] : null;
    const selected = set.filter(s => s.id === id)[0];

    if (current && selected) {
      this.d.multipleSelect.active = true;
      this.d.multipleSelect.min = set.indexOf(current);
      this.d.multipleSelect.max = set.indexOf(selected);
      if (this.d.multipleSelect.min > this.d.multipleSelect.max) {
        const tmp = this.d.multipleSelect.max;
        this.d.multipleSelect.max = this.d.multipleSelect.min;
        this.d.multipleSelect.min = tmp;
      }
    } else {
      this.d.multipleSelect.active = false;
      this.d.multipleSelect.min = 0;
      this.d.multipleSelect.max = 0;
    }
  }


  selectDataSet(id: string, ML: boolean = false, event = null) {
    // let ML = this.d.dataSets.filter(d => d.id === id)[0] === undefined ? true : false;

    this.d.trimLinesVisible = false;
    // this.d.classify = ML;
    const dataSet = !ML ? this.d.dataSets : this.d.mlOutputData;

    this.getItemsMultipleSelect(dataSet, id, event);


    for (const set of dataSet) {
      set.open = set.id === id ? true : false;

      if (set.open) {
        set.bounds.xMin = 0;
        this.updateGraphBounds.next(set.bounds);
        ML && set instanceof MLDataSet ? this.d.selectedMLDataset = set : this.d.selectedDataset = set;

        this.updateGraph.next({ set: set, model: this.d.selectedModel, mcus: this.d.selectedMicrocontrollers, trimLines: this.d.trimLinesVisible ? this.d.trimLines : null });
        this.d.size = this.getDataSize(set);


        if (ML) {
          const mlData = this.d.mlOutputData.filter(m => m.id === set.id)[0];

          for (const item of mlData.confidencesLevels) {

            for (const output of this.d.selectedModel.outputs) {
              const label = output.labels.filter(l => l.id === item.id)[0];
              if (label) {
                label.confidence = item.confidence;

                if (this.document.getElementById('bar-' + mlData.classifierID + '-' + label.id) !== null) {
                  (this.document.getElementById('bar-' + mlData.classifierID + '-' + label.id) as HTMLElement).style.width = (label.confidence * 100) + '%';
                  (this.document.getElementById('confidence-' + mlData.classifierID + '-' + label.id) as HTMLElement).innerHTML = (label.confidence * 100).toFixed(2) + '%';
                }
              }
            }
          }
        }
      }
    }
  }





  getDataSize(set: DataSet) {
    const motorEl = set.m.filter(m => m.visible && m.d.length > 0)[0];
    return motorEl ? motorEl.d.length : 0;
  }

  updateBoundsDataset(set = this.d.selectedDataset) {
    if (set && set.m.length > 0 && set.m[0].d.length > 0) {
      const endTime = this.d.selectedDataset.m[0].d[this.d.selectedDataset.m[0].d.length - 1].time;
      set.bounds.xMax = endTime < 3000 ? (Math.ceil(endTime / 200) * 200) : (Math.ceil(endTime / 500) * 500);
      this.updateGraphBounds.next(set.bounds);
      this.updateGraph.next({ set: set, model: this.d.selectedModel, mcus: this.d.selectedMicrocontrollers, trimLines: this.d.trimLinesVisible ? this.d.trimLines : null });
    }
  }


  updateOutputDataSet(set = this.d.selectedDataset, index: number) {
    // console.log(this.d.selectedDataset.output);
    if (set && set.outputs.filter(o => o.classifier_id === this.d.selectedModel.outputs[index].id).length === 0) {
      set.outputs.push(new OutputItem(this.d.selectedModel.outputs[index].id, this.d.selectedModel.outputs[index].name));
      const selectClassifierDiv = (this.document.getElementById('dataset-output-select-' + this.d.selectedModel.outputs[index].id) as HTMLElement);
      if (selectClassifierDiv) selectClassifierDiv.classList.remove('invisible');
    }
  }


  updateOutputLabel(classifierID:string, labelID: string) {

    const dataItem = this.d.selectedDataset.outputs.filter(o => o.classifier_id === classifierID)[0];
    const classifier = this.d.selectedModel.outputs.filter(o => o.id === classifierID)[0];

    if (classifier) {
      const label = classifier.labels.filter(l => l.id === labelID)[0];
      if (label) {
        dataItem.label = label;
      }
    }
  }





  addOutputToDataSet(set: DataSet = this.d.selectedDataset, classifier: Classifier, label: any = null) {
    if (set.outputs.filter(o => o.classifier_id === classifier.id).length === 0) {
      set.outputs.push(new OutputItem(classifier.id, classifier.name));
      if (label) {
        set.outputs[set.outputs.length - 1].label.id = label.id;
        set.outputs[set.outputs.length - 1].label.name = label.name;
      }
    }
  }

  selectClassifier(id: string) {
    const output  = this.d.selectedModel.outputs.filter(o => o.id === id)[0];
    output.active = !output.active;
    const index = this.d.selectedModel.outputs.indexOf(output);
    if (index > -1) {
      this.updateOutputDataSet(this.d.selectedDataset, index);
    }
  }

  updateDataSetName(id: String) {
    const value = (this.document.getElementById('dataSet-' + id) as HTMLInputElement).value;
    this.d.dataSets.filter(d => d.id === id)[0].name = value;
  }

  updateDataSetInputColor(id: String, motorIndex: number, colorIndex: number, color: string) {
    const set = this.d.dataSets.filter(d => d.id === id)[0];
    if (set) {
      set.m[motorIndex].colors[colorIndex].hash = color;
    }
  }

  addInputItem(name = 'untitled') {
    const nrOfInputs = this.d.selectedModel.inputs.length;
    this.d.selectedModel.inputs.push(new ModelVariable(name + '-' + (nrOfInputs - 5), false, false, '#999', 'C' + (nrOfInputs - 5), VariableType.continuous));
  }

  deleteInputItem(i: number) {
    this.d.selectedModel.inputs.splice(i, 1);
  }

  getNrOfActiveInputs() {
    return this.d.selectedModel.inputs.filter(i => i.active).length;
  }

  resetInputList() {
    this.d.selectedModel.inputs = [
      new ModelVariable('angle', true, true, '#43E6D5', 'A', VariableType.continuous),
      new ModelVariable('velocity', true, true, '#00AEEF', 'V', VariableType.continuous),
      new ModelVariable('direction', true, true, '#E18257', 'D', VariableType.discrete),
      new ModelVariable('pressure', false, false, '#4390E6', 'P', VariableType.continuous),
      new ModelVariable('target', false, false, '#7778E0', 'G', VariableType.continuous)
    ]
  }

  updateInput(i: number) {
    const value = (this.document.getElementById('input-' + i) as HTMLInputElement).value;
    this.d.selectedModel.inputs[i].name = value;
  }



  deleteClassifier(i: number) {
    this.d.selectedModel.outputs.splice(i, 1);

    if (this.d.selectedModel.outputs.length === 0) {
      this.addOutput(true);
    } else if (this.d.selectedModel.outputs.filter(o => o.active).length === 0) {
      this.d.selectedModel.outputs[0].active = true;
    }
  }



  addOutput(dummy: boolean) {
    this.d.selectedModel.outputs.push(new Classifier(uuid(), 'Output-' + (this.d.selectedModel.outputs.length + 1), dummy));
    if (this.d.selectedModel.outputs.filter(o => o.active).length === 0) {
      this.d.selectedModel.outputs[0].active = true;
    }
  }


  getNrOfActiveClassifiers(): any {
    const outputs = this.d.selectedModel.outputs.filter(o => o.active);
    let total = 0;

    if (outputs.length > 0) {
      const labelsPerItem = [];
      let index = 0;
      for (const output of outputs) {
        total += output.labels.length;
        labelsPerItem.push({ i: index, size: output.labels.length, color: this.d.colorOptions[index] });
        index++;
      }
      return { total: total, labels: labelsPerItem };
    }
    return { total: 1, labels: 1 };
  };


  updateClassifier(i: number, pos: number) {
    const value = (this.document.getElementById('classifier-' + pos + '-' + i) as HTMLInputElement).value;
    this.d.selectedModel.outputs[i].name = value;
    (this.document.getElementById('classifier-' + (pos === 1 ? 2 : 1) + '-' + i) as HTMLInputElement).value = value;
  }

  addLabelToClassifier(i: number) {
    this.d.selectedModel.outputs[i].open = true;
    this.d.selectedModel.outputs[i].labels.push(new Label(uuid(), 'item-' + (this.d.selectedModel.outputs[i].labels.length + 1)));
  }

  deleteLabel(classifier_name: String, i:number) {
    this.d.selectedModel.outputs.filter(c => c.name === classifier_name)[0].labels.splice(i, 1);
  }

  saveTrainingSettings() {
    //
  }

  saveMLoutput() {
    const dataSets = this.getDataSets('deploy');
    if (dataSets && dataSets.length > 0) {
      this.exportFileData([dataSets]);
    }
  }


  updateClassifierLabel(classifier_name: String, i: number) {
    const value = (this.document.getElementById(classifier_name + '-label-' + i) as HTMLInputElement).value;
    this.d.selectedModel.outputs.filter(c => c.name === classifier_name)[0].labels[i].name = value;
  }

  deleteFilter(id: string) {
    const filterItem = this.d.selectedModel.filters.filter(f => f.id === id)[0];
    if (filterItem) {
      const index = this.d.selectedModel.filters.indexOf(filterItem);
      if (index > -1) {
        this.d.selectedModel.filters.splice(index, 1);
      }
    }
  }




  deleteMicrocontroller(serialPort: String) {
    const microcontroller = this.d.selectedMicrocontrollers.filter(m => m.serialPort.path === serialPort)[0];
    if (microcontroller) {
      if (this.d.dataSets.length > 0) {
        for (const set of this.d.dataSets) {
          this.removeMicrocontrollerFromDataset(microcontroller, set);
        }
        if (this.d.selectedDataset) { this.selectDataSet(this.d.selectedDataset.id); }
      }
      const index = this.d.selectedMicrocontrollers.indexOf(microcontroller);
      this.d.selectedMicrocontrollers.splice(index, 1);
    }
    this.d.selectedModel.layers[0].options.actuators.value = this.getNrOfActiveMotors();
  }

  addMicrocontroller(microcontroller: MicroController = null, updateInputs = true) {
    console.log('add ', microcontroller);
    if (microcontroller === null) {
      microcontroller = this.d.selectOptionMicrocontroller;
    }
    if (microcontroller !== undefined && this.d.selectedMicrocontrollers.filter(m => m.serialPort.path === microcontroller.serialPort.path).length === 0) {
      for (const motor of microcontroller.motors) {
        motor.record = true;

        if (motor.type === ActuatorType.pneumatic) {
          const pressureInputItem = this.d.selectedModel.inputs.filter(i => i.name === 'pressure')[0];
          pressureInputItem.active = true;
          pressureInputItem.visible = true;

          if (updateInputs) {

            if (motor.config.nrOfSensors && motor.config.nrOfSensors > 1) {
              for (let i = 1; i < motor.config.nrOfSensors; i++) {
                const input = this.d.selectedModel.inputs.filter(i => i.name === 'pressure-' + i);
                if (input.length === 0) {
                  const inputModel = new ModelVariable('pressure-' + i, true, true, '#4390E6', 'P-' + i, VariableType.continuous);
                  this.d.selectedModel.inputs.push(inputModel);
                  this.d.colorList.push(new InputColor(inputModel.name, inputModel.color));
                }
              }
            }
          }
        }
      }
      this.d.selectedMicrocontrollers.push(microcontroller);
      this.d.selectedModel.layers[0].options.actuators.value = this.getNrOfActiveMotors();

      // console.log(this.d.selectedMicrocontrollers);
      for (const set of this.d.dataSets) {
        if (set.m.filter(m => m.mcu.serialPath === microcontroller.serialPort.path).length === 0) {
          this.addMicrocontrollerToDataSet(microcontroller, set);
        }
      }
    }
  }


  getNrOfActiveMotors() {
    let nr = 0;
    for (const mcu of this.d.selectedMicrocontrollers) {
      for (const motor of mcu.motors) {
        if (motor.record) {
          nr++;
        }
      }
    }
    return nr;
  }

  addMicrocontrollerToDataSet(mcu: MicroController, dataSet: DataSet) {
    for (const m of mcu.motors) {
      const index = mcu.motors.indexOf(m);
      const motorEl = new MotorEl(mcu.id, mcu.name, mcu.serialPort.path, m.id, index);
      motorEl.record = m.record;
      motorEl.visible = true;
      motorEl.colors = JSON.parse(JSON.stringify(this.d.colorList));
      dataSet.m.push(motorEl);
    }
  }

  removeMicrocontrollerFromDataset(mcu: MicroController, dataSet: DataSet) {
    for (const m of dataSet.m) {
      if (m.mcu.id === mcu.id) {
        const index = dataSet.m.indexOf(m);
        if (index > -1) {
          dataSet.m.splice(index, 1);
        }
      }
    }
  }

  updateProgess(_status: String, _progress: number, _data = null) {
    this.updateTrainingProgress.next({ status: _status, progress: _progress, d: _data });
  }


  updateResize(_coord: number) {
    this.updateResizeElements.next({ coord: _coord })
  }



  stopTraining() {
    this.d.processing = false;
    // this.d.selectedModel.model.stopTraining = true;
  }





  resetFiltersMicrocontroller() {
    for (const microcontroller of this.d.selectedMicrocontrollers) {
      const newUploadStringModel = new UploadStringModel(microcontroller, 'FFR');
      this.electronService.ipcRenderer.send('send_data_str', newUploadStringModel);
    }
  }




  importModel(model: any) {
    //select a folder
    if (model) {
      const modelObj = JSON.parse(model);
      console.log(modelObj);
      this.d.selectedModel = modelObj;
    }
  }


  exportModel() {
    if (this.d.selectedModel) {
      if (this.d.selectedModel.model) {
        this.d.selectedModel.model.save();
        this.updateProgess('Save exported files', 100);
      } else {
        this.updateProgess('Error: model not initialized', 0);
      }
    }
  }

  loadModel(id: String) {
    const modelData = this.tensorflowModelService.getModel(id);
    if (modelData) {
      this.d.selectedModel = modelData;
      if (modelData.model) {
        const modelStr = JSON.stringify(modelData.model);
        // console.log(modelStr);
        this.d.selectedModel.model = JSON.parse(modelStr);
        // console.log(this.selectedModel.model);
      }
      this.d.selectedModel.training.losses = this.d.lossOptions.filter(l => l.name === this.d.selectedModel.training.losses.name)[0];
      this.d.selectedModel.training.metrics = this.d.metricsOptions.filter(l => l.name === this.d.selectedModel.training.metrics.name)[0];
      this.d.selectedModel.training.optimizer = this.d.optimizerOptions.filter(l => l.name === this.d.selectedModel.training.optimizer.name)[0];

      this.updateModelSettings(this.d.selectedModel);
      this.updateProgess('Model loaded', 100);
    } else {
      this.updateProgess('Error loading model', 0);
    }
  }

  saveModel(copy: boolean) {
    if (this.d.selectedModel) {

      this.d.selectedModel.id = this.tensorflowModelService.saveModel(this.d.selectedModel, copy);
      this.updateProgess('model saved', 100);
    }
  }

  updateModelSettings(model: Model) {

    (this.document.getElementById('model_type') as HTMLSelectElement).selectedIndex = model.type;

    // (this.document.getElementById('learningRate') as HTMLInputElement).value = model.options.learningRate;
    // (this.document.getElementById('hiddenLayers') as HTMLInputElement).value = model.options.hiddenLayers;

    // (this.document.getElementById('epochs') as HTMLInputElement).value = model.options.trainingOptions.epochs;
    // (this.document.getElementById('batchsize') as HTMLInputElement).value = model.options.trainingOptions.batchSize;

    // (this.document.getElementById('activation') as HTMLSelectElement).selectedIndex = model.options.activation;
    // (this.document.getElementById('activation_output') as HTMLSelectElement).selectedIndex = model.options.activationOutputLayer;

    // (this.document.getElementById('losses') as HTMLSelectElement).selectedIndex = model.options.losses;
    // (this.document.getElementById('metrics') as HTMLSelectElement).selectedIndex = model.options.metrics;
    // (this.document.getElementById('optimizer') as HTMLSelectElement).selectedIndex = model.options.optimizer;


    (this.document.getElementById('modelName') as HTMLInputElement).value = model.name;

    this.updateVariables(model.inputs);
    this.updateVariables(model.outputs);
  }

  updateVariables(variables: Array<any>) {
    for (const variable of variables) {
      const variable_el = this.document.getElementById(variable.id);
      const variable_name = this.document.getElementById('label-' + variable.id);
      if (variable_name) {
        variable_name.innerHTML = variable.name;
      }
      if (variable_el) {
        variable_el[0].checked = variable.active;
      }
    }
  }





  loadDataSets(data: Array<DataSet>) {

    if (data) {
      if (data.length > 0 && this.d.dataSets.length === 1 && ((this.d.dataSets[0].m && this.d.dataSets[0].m.length > 0 && this.d.dataSets[0].m[0].d.length === 0) ||
          this.d.dataSets[0].m === undefined || this.d.dataSets[0].m.length === 0)) {

        this.d.dataSets = [];
      }
      if (data.length > 0) {
        for (const dataset of data) {
          if (this.d.dataSets.filter(d => d.id === dataset.id).length === 0) {
            if (dataset.m && dataset.m.length > 0) {

              for (const motor of dataset.m) {
                if (this.d.selectedMicrocontrollers.filter(m => m.serialPort.path === motor.mcu.serialPath).length === 0) {
                  const mcu = this.hardwareService.microcontrollers.filter(m => m.serialPort.path === motor.mcu.serialPath)[0];
                  if (mcu) {
                    // this.d.selectOptionMicrocontroller = mcu;
                    this.addMicrocontroller(mcu, false);
                  } else {
                    const nrOfmotors = dataset.m.filter(m => m.mcu.serialPath === motor.mcu.serialPath).length;
                    const newMCU = this.hardwareService.addMicroController({ serialPort: { path: motor.mcu.serialPath }}, '', motor.mcu.id);
                    this.hardwareService.addActuators(newMCU, nrOfmotors);
                    this.addMicrocontroller(newMCU, false);
                  }
                }
                if (motor.d.length > 0) {
                  for (const input of motor.d[0].inputs) {
                    const inputModels = this.d.selectedModel.inputs.filter(i => i.name === input.name);
                    if (inputModels.length === 1) {
                      if (!inputModels[0].active) { inputModels[0].active = true; }
                    } else if (inputModels.length === 0) {
                      //console.log('add input');
                      this.addInputItem(input.name);
                      this.d.colorList.push(new InputColor(input.name, '#999'));
                    }
                  }
                }
                if (!motor.colors || motor.colors.length === 0) {
                  motor.colors = JSON.parse(JSON.stringify(this.d.colorList));
                }
              }

              if (dataset.outputs && dataset.outputs.filter(o => o.classifier_id).length > 0) {
                this.addOutputFromDataSet(dataset);
              }

              this.d.dataSets.push(dataset);
            }
          }
        }
        if (this.d.dataSets.length > 0) {
          // this.config.transform = null;
          this.d.dataSets.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
          this.selectDataSet(this.d.dataSets[0].id, false);
          this.updateModelBasedOnDatasets();
          this.redrawNN.next(true);
        }
      }
    }
  }

  updateModelBasedOnDatasets() {
    let range = new MinMax();
    this.d.selectedModel.inputs.forEach(i => { i.active = false; i.visible = false; });
    this.d.selectedMicrocontrollers.forEach(mcu => mcu.motors.forEach(m => m.record = false));
    this.d.selectedModel.layers[0].options.actuators.value = 0;
    this.d.selectedModel.layers[0].options.sparse.value = false;

    for (const set of this.d.dataSets) {

      if (set.m.length > 0) {

        if (range.min === undefined) { range.min =  set.m[0].d.length; }
        if (range.max === undefined) { range.max =  set.m[0].d.length; }

        if (set.m[0].d.length > range.max) {
          range.max = set.m[0].d.length;
        } else if (set.m[0].d.length < range.min) {
          range.min = set.m[0].d.length;
        }

        if (set.m[0].d.length > 0) {

          for (const input of set.m[0].d[0].inputs) {
            const inputItem = this.d.selectedModel.inputs.filter(i => i.name === input.name)[0];
            if (inputItem) {
              inputItem.active = true;
              inputItem.visible = true;
            }
          }
        }
        for (const motor of set.m) {
          if (motor.d.length > 0) {
            const microcontroller = this.d.selectedMicrocontrollers.filter(mcu => mcu.serialPort.path === motor.mcu.serialPath)[0];
            if (microcontroller) {
              const motorItem = microcontroller.motors.filter(m => m.id == motor.id)[0];
              if (motorItem) {
                if (motorItem.record === false) {
                  this.d.selectedModel.layers[0].options.actuators.value++;
                  motorItem.record = true;
                }
              }
            }
          }
        }
      }
    }
    if (range.max - range.min > 0 && range.max - range.min < 3) {
      this.d.selectedModel.layers[0].options.sparse.value = true;
    } else {
      this.d.selectedModel.layers[0].options.sparse.value = false;
    }

    this.d.selectedModel.layers[0].options.units.value = this.d.selectedModel.inputs.filter(i => i.active).length;
    if (this.d.selectedModel.layers[0].options.inputDimension > 1) { this.d.selectedModel.layers[0].options.units.value *= this.d.selectedModel.layers[0].options.actuators.value; }
    this.d.selectedModel.layers[0].options.inputLength.value = range.min > 30 ? Math.ceil(range.min / 3) : range.min;
  }




  addOutputFromDataSet(dataset: any) {
    if (this.d.selectedModel.outputs.length === 1 && this.d.selectedModel.outputs[0].labels.length === 2 &&
        this.d.selectedModel.outputs[0].labels[0].name === 'item-1' && this.d.selectedModel.outputs[0].labels[1].name === 'item-2') {

      this.d.selectedModel.outputs = [];
    }

    for (const output of dataset.outputs) {
      const outputClassifierInModel = this.d.selectedModel.outputs.filter(o => o.id === output.classifier_id)[0];

      if (outputClassifierInModel) {
        this.checkIfHasLabel(outputClassifierInModel, output.label);
        this.selectClassifier(outputClassifierInModel.id);

      } else {
        const newClassifier = new Classifier(output.classifier_id, output.classifier_name, false);
        this.d.selectedModel.outputs.push(newClassifier);
        this.checkIfHasLabel(newClassifier, output.label);
        this.selectClassifier(newClassifier.id);
      }
    }
  }


  checkIfHasLabel(classifier: Classifier, label: Label) {
    if (label && label.id && classifier && classifier.labels) {
      const l = classifier.labels.filter(l => l.id === label.id)[0];
      if (!l) {
        const newLabel = new Label(label.id, label.name);
        classifier.labels.push(newLabel);
      }
    }
  }


  selectLogFile(id: string) {
    const activeFile = this.d.trainingData.filter(t => t.open)[0];
    if (activeFile) { activeFile.open = false; }

    const file = this.d.trainingData.filter(t => t.id === id)[0];
    if (file) { file.open = true; }

    this.d.selectedModel.training = this.cloneService.deepClone(file.training);

    // console.log(this.d.selectedModel);
  }



  deleteLogFile(id:string = null) {

    const file = id === null ? this.d.trainingData.filter(t => t.open)[0] : this.d.trainingData.filter(t => t.id === id)[0];
    if (file) {
      const index = this.d.trainingData.indexOf(file);
      if (index > -1) {
        this.d.trainingData.splice(index, 1);
        if (this.d.trainingData.length > 0) {
          this.selectLogFile(this.d.trainingData[(index > 0 ? index - 1 : 0)].id);
        }
      }
    }
  }


  importLogFile(trainingData: any) {
    if (trainingData) {
      const data = JSON.parse(trainingData);
      const oldTrainingData = this.d.trainingData;
      this.d.trainingData = oldTrainingData.concat(data);

      console.log(this.d.trainingData);

      if (this.d.trainingData.length > 0) {
        this.selectLogFile(this.d.trainingData[this.d.trainingData.length - 1].id);
      }
    }
  }



}
