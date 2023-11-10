import { Component, Inject, AfterViewInit } from '@angular/core';
import { HardwareService } from 'src/app/services/hardware.service';
import { TensorFlowMainService } from 'src/app/services/tensorflow-main.service';
import { ElectronService } from 'ngx-electron';
import { ConnectModel } from 'src/app/models/effect-upload.model';
import { UploadService } from 'src/app/services/upload.service';
import { DOCUMENT } from '@angular/common';
import { TensorFlowDrawService } from 'src/app/services/tensorflow-draw.service';
import { Motor } from 'src/app/models/hardware.model';
import { MotorEl } from 'src/app/models/tensorflow.model';
import { TensorFlowData } from 'src/app/models/tensorflow-data.model';
import { TensorFlowConfig } from 'src/app/models/tensorflow-config.model';



@Component({
  selector: 'app-data',
  templateUrl: 'data.component.html',
  styleUrls: ['../../windows/effects/effects.component.css', './../tensorflowJS.component.css'],
})
export class DataComponent implements AfterViewInit {


  dataVisible = true;
  public d: TensorFlowData;
  public config: TensorFlowConfig;


  constructor(@Inject(DOCUMENT) private document: Document,public tensorflowService: TensorFlowMainService, public hardwareService: HardwareService,
              private electronService: ElectronService, private uploadService: UploadService, private tensorflowDrawService: TensorFlowDrawService) {
                this.d = this.tensorflowService.d;
                this.config = this.tensorflowDrawService.config;
              }


  ngAfterViewInit(): void {
    this.tensorflowDrawService.drawGraph();
  }



  record() {
    this.d.recording.active = !this.d.recording.active;

    if (!this.d.recording.active) {
      this.d.recording.starttime = null;
    } else {
      if (!this.d.classify && this.d.selectedDataset  && this.d.selectedDataset.m.length > 0) {
        if (this.d.selectedDataset.m[0].d.length > 0) {
          this.tensorflowService.addDataSet();
        }
      }
    }

    for (const microcontroller of this.d.selectedMicrocontrollers) {
      microcontroller.record = this.d.recording.active;

      if (!microcontroller.record) {

        // this.tensorflowService.updateProgess('connecting to microcontroller ' + microcontroller.serialPort.path, 0);
        // const model = new ConnectModel(microcontroller);
        // this.electronService.ipcRenderer.send('requestData', model);

      // } else {
        this.tensorflowService.updateBoundsActiveDataset();
        this.d.classify = false;
      }
    }
  }


  toggleDataSection() {
    this.dataVisible = !this.dataVisible;
    this.tensorflowService.updateResize((!this.dataVisible ? window.innerHeight - 60 : window.innerHeight * 0.45));
  }

  toggleVisibilityInput(m: MotorEl, inputIndex: number) {
    console.log(m, inputIndex);
    console.log(this.d.selectedDataset);
    m.colors[inputIndex].visible = !m.colors[inputIndex].visible;
    if (this.d.selectedDataset) {
      this.tensorflowDrawService.drawTensorFlowGraphData(this.d.selectedDataset, this.d.trimLinesVisible ? this.d.trimLines : null);
    }
  }

  toggleVisibilityMotor(m: MotorEl) {
    if (m) {
      m.visible = !m.visible;
      this.tensorflowDrawService.drawTensorFlowGraphData(this.d.selectedDataset, this.d.trimLinesVisible ? this.d.trimLines : null);
    }
  }

  toggleRecordMotor(mcuID: string, motor: Motor) {
    for (const set of this.d.dataSets) {
      for (const m of set.m) {
        if (m.mcu.id === mcuID && m.id === motor.id) {
          m.record = motor.record;
          m.visible = true;
        }
      }
    }
  }
  getFirstChar(fullName: string) {
    return fullName.charAt(0);
  }

  updateSidebarColumn(index: number) {
    this.tensorflowDrawService.config.sidebarColumnWidth[index] = this.tensorflowDrawService.config.sidebarColumnWidth[index] === 150 ? 30 : 150;
    (this.document.getElementById('sidebar-column-' + index) as HTMLElement).style.width = this.tensorflowDrawService.config.sidebarColumnWidth[index] + 'px';

    this.tensorflowDrawService.config.sidebarColumnWidth[index] === 150 ?
      this.document.getElementById('toggleSidebarColumn' + index).classList.remove('hidden') : this.document.getElementById('toggleSidebarColumn' + index).classList.add('hidden');

    this.tensorflowDrawService.config.width = window.innerWidth - 250 - (this.tensorflowDrawService.config.sidebarColumnWidth[0] + this.tensorflowDrawService.config.sidebarColumnWidth[1]);

    (this.document.getElementById('svg_graph') as HTMLElement).style.width = this.tensorflowDrawService.config.width + 'px';
    (this.document.getElementById('graph-header') as HTMLElement).style.width = this.tensorflowDrawService.config.width + 'px';

    this.tensorflowDrawService.drawGraph();

    if (this.d.selectedDataset) {
      this.tensorflowDrawService.drawTensorFlowGraphData(this.d.selectedDataset, this.d.trimLinesVisible ? this.d.trimLines : null);
    }
  }

  changeColorInputItem(m: MotorEl, inputIndex: number) {
    m.colors[inputIndex].hash = this.getNextColor(m.colors[inputIndex].hash);
    this.tensorflowDrawService.drawTensorFlowGraphData(this.d.selectedDataset, this.d.trimLinesVisible ? this.d.trimLines : null);
  }

  getNextColor(color: string) {
    const index = this.d.colorOptions.indexOf(color);
    if (index > -1) {
      const nextIndex = (index + 1) % this.d.colorOptions.length;
      return this.d.colorOptions[nextIndex];
    } else {
      this.d.colorOptions.push(color);
      return this.d.colorOptions[0];
    }
  }

  updateCommunicationSpeed(id: string) {
    const microcontroller = this.d.selectedMicrocontrollers.filter(m => m.id === id)[0];
    if (microcontroller) {
      this.hardwareService.updateMicroController(microcontroller);
      const uploadModel = this.uploadService.createUploadModel(null, microcontroller);
      uploadModel.config.motors = microcontroller.motors;
      // console.log(uploadModel);
      this.electronService.ipcRenderer.send('updateMotorSetting', uploadModel);
      // console.log(microcontroller.updateSpeed);
    }
  }


  openCloseItem(id: string) {
    const item = this.document.getElementById('open_' + id);
    const section = this.document.getElementById('section_' + id);
    if (item && section) {
      if (item.classList.contains('open')) {
        item.classList.remove('open');
        section.classList.add('hidden');
      } else {
        item.classList.add('open');
        section.classList.remove('hidden');
      }
    }
  }


  compareID(el1: any, el2: any) {
    return el1 && el2 ? el1.id === el2.id : el1 === el2;
  }


  cancelTrim() {
    this.tensorflowDrawService.removeTrimlines();
    this.d.trimLinesVisible = false;
  }

  trimDataSet() {
    this.tensorflowService.trimSet();
    this.tensorflowDrawService.removeTrimlines();
  }


  updateLine() {
    if (this.d.selectedDataset) {
      this.tensorflowDrawService.drawTensorFlowGraphData(this.d.selectedDataset, this.d.trimLinesVisible ? this.d.trimLines : null);
    }
  }
}
