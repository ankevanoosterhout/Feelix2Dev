import { DOCUMENT } from '@angular/common';
import { Injectable, Inject } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { ActuatorType, MicroController } from '../models/hardware.model';
import { Model, DataSet, Classifier, Label, MotorEl, ModelVariable, ModelType, OutputItem, InputColor, VariableType } from '../models/tensorflow.model';
import { HardwareService } from './hardware.service';
import { DataSetService } from './dataset.service';
import { Subject } from 'rxjs';
import { TensorFlowModelService } from './tensorflow-model.service';
import { UploadStringModel } from '../models/effect-upload.model';
import { ElectronService } from 'ngx-electron';
import { FileSaverService } from 'ngx-filesaver';
import * as JSZip from 'jszip';
import { TensorFlowData } from '../models/tensorflow-data.model';


@Injectable()
export class TensorFlowMainService {

    public d: TensorFlowData;

    updateTensorflowProgress: Subject<any> = new Subject<void>();
    reloadPage: Subject<any> = new Subject<void>();
    updateResizeElements: Subject<any> = new Subject<void>();
    updateGraphBounds: Subject<any> = new Subject<void>();
    updateGraph: Subject<any> = new Subject<void>();
    updateScale: Subject<any> = new Subject<void>();
    drawTrimLines: Subject<any> = new Subject<void>();
    loadData: Subject<any> = new Subject<void>();
    loadMLData: Subject<any> = new Subject<void>();
    redrawNN: Subject<any> = new Subject<void>();
    createModel: Subject<any> = new Subject<void>();
    getColorListItem: Subject<any> = new Subject<void>();

    constructor(@Inject(DOCUMENT) private document: Document, public hardwareService: HardwareService, private dataSetService: DataSetService,
                private tensorflowModelService: TensorFlowModelService, private electronService: ElectronService, private _FileSaverService: FileSaverService) {

                  this.d = new TensorFlowData();
                }


    deleteDataSet(dataset: Array<any>, set: any, ML = false) {
      const index = dataset.indexOf(set);
      dataset.splice(index, 1);
      if (index < dataset.length) {
        this.selectDataSet(dataset[index].id, ML);
      } else if (dataset.length > 0) {
        this.selectDataSet(dataset[0].id, ML);
      } else if (!ML) {
        this.addDataSet();
        // this.updateGraph.next(true);
        // this.d.selectedDataset = null;
      }
    }

    deleteDataSets(id: string = null, ML = false) {
      const dataset = !ML ? this.d.dataSets : this.d.mlOutputData;
      const set = dataset.filter(s => id ? s.id === id : s.open)[0];
      if (set && !this.d.multipleSelect.active) {
        this.deleteDataSet(dataset, set, ML);
      } else {
        for (let i = this.d.multipleSelect.min; i < this.d.multipleSelect.max; i++) {
          this.deleteDataSet(dataset, dataset[i], ML);
        }
      }
    }

    addDataSet() {
      const newID = uuid();
      this.d.dataSets.push(new DataSet(newID, 'Data set ' + (this.d.dataSets.length + 1), this.d.selectedMicrocontrollers, this.d.selectedModel.outputs));
      this.selectDataSet(newID, false);
      console.log(this.d.dataSets);
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

    saveCopyDataSet() {
      const dataSets = this.d.multipleSelect.active ? this.d.dataSets.slice(this.d.multipleSelect.min, this.d.multipleSelect.max + 1) : [ this.d.selectedDataset ];
      let index = 0;
      for (const set of dataSets) {
        const copy = this.dataSetService.copyDataSet(set);
        if (copy) {
          copy.name += '-copy';
          this.d.dataSets.push(copy);
          this.saveDataSet(copy);
          if (index >= dataSets.length - 1) {
            this.selectDataSet(copy.id, false);
          }
        }
        index++;
      }
    }

    mergeDataSets() {
      const dataSets = this.d.dataSets.slice(this.d.multipleSelect.min, this.d.multipleSelect.max + 1);
      // console.log(dataSets.length);
    }


    exportDataSet(dataSets: Array<any>) {
      if (dataSets.length > 1) {
        this.zipFiles(dataSets);
      } else if (dataSets.length === 1) {
        const dataBlob = this.createBlob(dataSets);
        const filename = dataSets[0].name + '.json';
        this._FileSaverService.save(dataBlob, filename, 'text/plain');
      } else {
        this.updateProgess('No dataset selected', 0);
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
      this._FileSaverService.save(content, 'folder.zip', 'application/zip');
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
          this.loadData.next(dataObj);

          if (this.d.dataSets.length > 0) {
            this.selectDataSet(this.d.dataSets[this.d.dataSets.length - 1].id, false);
          }
        } else {
          this.loadMLData.next(dataObj);

          if (!this.d.predictionDataset && this.d.ML_OutputData.length > 0) {
            this.selectDataSet(this.d.ML_OutputData[0].id, true);
          }
        }
      }

    }

    trimDataSet() {
      if (this.d.selectedDataset && this.d.selectedDataset.m.length > 0) {

        this.d.trimLinesVisible = true;

        this.updateScale.next(1);

        this.d.trimLines[0].value = this.d.selectedDataset.bounds.xMin + 50;
        this.d.trimLines[1].value = this.d.selectedDataset.bounds.xMax - 50;

        this.drawTrimLines.next({ bounds: this.d.selectedDataset.bounds, visible: this.d.trimLinesVisible, lines: this.d.trimLines });
      }
    }


    trimSet() {
      const dataSetCopy = this.dataSetService.copyDataSet(this.d.selectedDataset);
      dataSetCopy.name = this.d.selectedDataset.name + '-copy';

      const bounds = this.trimmedDataSize(dataSetCopy);
      // console.log(bounds.dataSize);
      // for (const m of dataSetCopy.m) {
      //   if (m.d.length > 0) {
      //     for (let i = m.d.length - 1; i >= 0; i--) {
      //       if (m.d[i].time < this.d.trimLines[0].value || m.d[i].time > this.d.trimLines[1].value) {
      //         m.d.splice(i, 1);
      //       } else {
      //         m.d[i].time -= Math.floor(this.d.trimLines[0].value);
      //         for (const el of m.d[i].inputs) {
      //           if (el.name !== 'direction' && this.d.selectedModel.inputs.filter(i => i.name === el.name && i.active).length > 0) {
      //             if (Ymax === null || el.value > Ymax) { Ymax = el.value; }
      //             if (Ymin === null || el.value < Ymin) { Ymin = el.value; }
      //           }
      //         }
      //       }
      //     }
      //   }
      // }
      const span = this.d.trimLines[1].value - this.d.trimLines[0].value;

      dataSetCopy.bounds.xMin = 0;
      dataSetCopy.bounds.xMax = span < 1000 ? Math.ceil(span / 100) * 100 : span < 3000 ? Math.ceil(span / 200) * 200 : Math.ceil(span / 500) * 500;
      dataSetCopy.bounds.yMin = bounds.yMin < -10 || bounds.yMax > 10 ? Math.floor(bounds.yMin/5) * 5 : Math.floor(bounds.yMin*4) / 4;
      dataSetCopy.bounds.yMax = bounds.yMin < -10 || bounds.yMax > 10 ? Math.ceil(bounds.yMax/5) * 5 : Math.ceil(bounds.yMax*4) / 4;

      this.d.trimLinesVisible = false;

      this.d.dataSets.push(dataSetCopy);
      this.selectDataSet(dataSetCopy.id, false);
    }

    trimmedDataSize(dataSet: DataSet = this.dataSetService.copyDataSet(this.d.selectedDataset)) {

      let Ymin = null;
      let Ymax = null;
      let size = [];
      for (const m of dataSet.m) {
        if (m.d.length > 0) {
          for (let i = m.d.length - 1; i >= 0; i--) {
            if (m.d[i].time < this.d.trimLines[0].value || m.d[i].time > this.d.trimLines[1].value) {
              m.d.splice(i, 1);
            } else {
              m.d[i].time -= Math.floor(this.d.trimLines[0].value);
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
      return { yMin: Ymin, yMax: Ymax, dataSize: size };
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
      this.electronService.ipcRenderer.send('load-dataset');
    }

    showOutputData() {
      this.electronService.ipcRenderer.send('show-ml-output');
    }


    saveDataNN(data: any = null) {
      // if (this.d.selectedModel.model) {
      //   this.d.selectedModel.model.saveData('training-data-' + this.d.selectedModel.name, this.itemsSaved);
      // }
      console.log(data);

      const dataSets: Array<any> = this.d.multipleSelect.active ? this.d.dataSets.slice(this.d.multipleSelect.min, this.d.multipleSelect.max + 1) : [ this.d.selectedDataset ];


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

      this.exportDataSet(data ? data : dataSets);
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






  selectDataSet(id: String = this.d.selectedDataset.id, ML: boolean = false, event = null) {
    // let ML = this.d.dataSets.filter(d => d.id === id)[0] === undefined ? true : false;

    this.d.trimLinesVisible = false;
    this.d.classify = ML;

    const shift = event ? event.shiftKey : false;
    const current = shift && !ML ? this.d.dataSets.filter(s => s.open)[0] : null;
    const selected = !ML ? this.d.dataSets.filter(s => s.id === id)[0] : null;

    if (current && selected && !ML) {
      this.d.multipleSelect.active = true;
      this.d.multipleSelect.min = this.d.dataSets.indexOf(current);
      this.d.multipleSelect.max = this.d.dataSets.indexOf(selected);
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

    const dataSet = !ML ? this.d.dataSets : this.d.mlOutputData;



    for (const set of dataSet) {
      set.open = set.id === id ? true : false;
      if (set.open) {
        this.updateGraphBounds.next(set.bounds);
        this.d.selectedDataset = set;

        this.updateGraph.next({ set: set, model: this.d.selectedModel, mcus: this.d.selectedMicrocontrollers, trimLines: this.d.trimLinesVisible ? this.d.trimLines : null });
        this.d.size = this.getDataSize(set);


        if (ML) {
          const mlData = this.d.mlOutputData.filter(m => m.id === set.id)[0];

          for (const item of mlData.confidencesLevels) {
            const label = this.d.selectedModel.outputs.filter(c => c.name === 'Classifier')[0].labels.filter(l => l.id === item.id)[0];
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
    console.log(ML, dataSet);
  }





  getDataSize(set: DataSet) {
    const motorEl = set.m.filter(m => m.visible && m.d.length > 0)[0];
    return motorEl ? motorEl.d.length : 0;
  }

    updateBoundsActiveDataset() {
      if (this.d.selectedDataset && this.d.selectedDataset.m.length > 0 && this.d.selectedDataset.m[0].d.length > 0) {
        const endTime = this.d.selectedDataset.m[0].d[this.d.selectedDataset.m[0].d.length - 1].time;
        this.d.selectedDataset.bounds.xMax = endTime < 3000 ? (Math.ceil(endTime / 200) * 200) : (Math.ceil(endTime / 500) * 500);
        this.updateGraphBounds.next(this.d.selectedDataset.bounds);
        this.updateGraph.next({ set: this.d.selectedDataset, model: this.d.selectedModel, mcus: this.d.selectedMicrocontrollers, trimLines: this.d.trimLinesVisible ? this.d.trimLines : null });
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

      console.log(this.d.selectedDataset.outputs, this.d.selectedModel.outputs);
      console.log(dataItem, classifier);

      if (classifier) {
        const label = classifier.labels.filter(l => l.id === labelID)[0];
        console.log(label);
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
      // for (const output of this.d.selectedModel.outputs) {
      //   output.active = output.id === id ? true : false;
      //   if (output.active) {
      //     this.updateOutputDataSet(index);
      //   }
      //   index++;
      // }
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
        this.addOutput();
      } else if (this.d.selectedModel.outputs.filter(o => o.active).length === 0) {
        this.d.selectedModel.outputs[0].active = true;
      }
    }

    addOutput() {
      this.d.selectedModel.outputs.push(new Classifier(uuid(), 'Output-' + (this.d.selectedModel.outputs.length + 1)));
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
      if (this.d.ML_OutputData.length > 0) {
        this.exportDataSet(this.d.ML_OutputData);
      }
    }

    showMLoutput() {
      console.log(this.d.ML_OutputData);
      console.log(this.d.dataSets[0]);
      console.log(this.d.selectedDataset);
    }

    clearData() {
      this.d.ML_OutputData = [];
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
      // console.log('add ', microcontroller);
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
      this.updateTensorflowProgress.next({ status: _status, progress: _progress, d: _data });
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
        for (const dataset of data) {
          if (this.d.dataSets.filter(d => d.id === dataset.id).length === 0) {
            if (dataset.m && dataset.m.length > 0) {
              for (const motor of dataset.m) {
                if (this.d.selectedMicrocontrollers.filter(m => m.serialPort.path === motor.mcu.serialPath).length === 0) {
                  const mcu = this.hardwareService.microcontrollers.filter(m => m.serialPort.path === motor.mcu.serialPath)[0];
                  if (mcu) {
                    // this.d.selectOptionMicrocontroller = mcu;
                    this.addMicrocontroller(mcu, false);
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
          if (this.d.dataSets.length > 0) {
            // this.config.transform = null;
            this.d.dataSets.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
            this.selectDataSet(this.d.dataSets[0].id, false);
          }
        }
      }

    }


    addOutputFromDataSet(dataset: any) {
      console.log('add output dataset')
      for (const output of dataset.outputs) {
        const outputClassifierInModel = this.d.selectedModel.outputs.filter(o => o.id === output.classifier_id)[0];

        if (!outputClassifierInModel) {
          const newClassifier = new Classifier(output.classifier_id, output.classifier_name);
          this.d.selectedModel.outputs.push(newClassifier);
          this.checkIfHasLabel(newClassifier, output.label);
          this.selectClassifier(newClassifier.id);
        } else {
          this.checkIfHasLabel(outputClassifierInModel, output.label);
          this.selectClassifier(outputClassifierInModel.id);
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

}
