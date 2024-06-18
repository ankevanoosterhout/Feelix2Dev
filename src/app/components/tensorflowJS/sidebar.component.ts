import { Component, Input, HostListener } from '@angular/core';
import { TensorFlowData } from 'src/app/models/tensorflow-data.model';
import { MotorEl } from 'src/app/models/tensorflow.model';
import { HardwareService } from 'src/app/services/hardware.service';
import { TensorFlowDrawService } from 'src/app/services/tensorflow-draw.service';
import { TensorFlowMainService } from 'src/app/services/tensorflow-main.service';


@Component({
  selector: 'app-sidebar',
  template: `

        <div class="sidebar-column small" *ngIf="this._page !== 'train'">
          <div class="column-header-sidebar">
            <div class="labelRow marginLeft">Input</div>
          </div>

          <div class="sidebar-column-content" *ngIf="this.d.selectedDataset && this.d.selectedDataset.m.length > 0">

            <div class="row" id="section_motors">
              <ul class="motor-list-buttons">
                <li class="motor-list-button-item" *ngFor="let m of this.d.selectedDataset.m; let n = index;">
                  <div class="list-text-item" [ngClass]="{ active: m.visible }" *ngIf="m.record" (click)="toggleVisibilityMotor(m)">{{ m.id }}</div>

                  <div class="row" *ngIf="(!m.d || m.d.length === 0) && this.d.selectedModel && m.visible && m.record">
                    <ul class="input-list-buttons">
                      <li class="input-list-button-item" *ngFor="let input of this.d.selectedModel.inputs; let i = index;">

                        <div class="list-text-item input-list-button-item-content" *ngIf="input.active && m.colors[i] && m.colors[i].visible">
                          <div [ngStyle]="{'background': m.colors[i].hash }" class="active" (click)="toggleVisibilityInput(m, i)">{{ input.slug }}</div>

                          <div [ngStyle]="{'background': m.colors[i].hash }" class="color-editor" id="color-editor-{{ m.id }}-{{ i }}" (click)="changeColorInputItem(m, i)">
                            <img src="./assets/icons/buttons/brush.svg"/>
                          </div>
                        </div>
                        <div class="list-text-item input-list-button-item-content" *ngIf="input.active && m.colors[i] && !m.colors[i].visible" (click)="toggleVisibilityInput(m, i)"><div>{{ input.slug }}</div></div>
                      </li>
                    </ul>
                  </div>

                  <div class="row" *ngIf="m.d && m.d.length > 0 && m.visible && m.record">
                    <ul class="input-list-buttons">
                      <li class="input-list-button-item" *ngFor="let input of m.d[0].inputs; let i = index;">

                        <div class="list-text-item input-list-button-item-content" *ngIf="m.colors[i] && m.colors[i].visible">
                          <div [ngStyle]="{'background': m.colors[i].hash }" class="active" (click)="toggleVisibilityInput(m, i)">{{ input.slug }}</div>

                          <div [ngStyle]="{'background': m.colors[i].hash }" class="color-editor" id="color-editor-{{ m.id }}-{{ i }}" (click)="changeColorInputItem(m, i)">
                            <img src="./assets/icons/buttons/brush.svg"/>
                          </div>
                        </div>
                        <div class="list-text-item input-list-button-item-content" *ngIf="!m.colors[i].visible" (click)="toggleVisibilityInput(m, i)"><div>{{ input.slug }}</div></div>
                      </li>
                    </ul>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>




        <div class="sidebar-column" *ngIf="this._page !== 'train'">
          <div class="column-header-sidebar" >
            <div class="labelRow marginLeft">Output</div>
          </div>

          <div class="sidebar-column-content" *ngIf="this._page === 'data'">
            <ul class="data_output_list" *ngIf="this.d.selectedDataset.outputs.length > 0">
              <li class="row variable_name data_element selectbox" *ngFor="let output of this.d.selectedDataset.outputs; let o=index;" id="dataset-output-select-{{ output.classifier_id }}">
                <label class="labelRow small">{{ output.classifier_name }}</label>
                <select class="form-control playWindow microcontroller" id="{{ this.d.selectedDataset.id }}-{{ output.classifier_id }}" name="{{ this.d.selectedDataset.id }}-{{ output.classifier_id }}"
                    [(ngModel)]="output.label.id" title="select label that is associated with the selected data set" [compareWith]="compareID"
                    (change)="this.updateOutputLabel(output.classifier_id, output.label.id)">
                  <option class="placeholder" value="undefined" selected="selected">-- select label --</option>
                  <option *ngFor="let label of this.getOutputLabels(output.classifier_id)" [ngValue]="label.id">{{ label.name }}</option>
                </select>
              </li>
            </ul>
          </div>

          <div class="sidebar-column-content" *ngIf="this._page === 'deploy'">
            <ul id="data_output_list" class="results">
              <li *ngFor="let classifier of this.d.selectedModel.outputs">
                <label class="label bold" [ngClass]="{ inactive: !classifier.active }">{{ classifier.name }}</label>

                <ul id="data_output_list_items" *ngIf="classifier.active">
                  <li *ngFor="let label of classifier.labels; let i=index;">
                    <label class="label list">{{ label.name }}</label>
                    <div class="confidence-levels">
                      <div class="bar-container"><div class="bar" id="bar-{{ classifier.id }}-{{ label.id }}"></div></div>
                      <span class="confidence" id="confidence-{{ classifier.id }}-{{ label.id }}">0%</span>
                    </div>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>



        <div class="sidebar-column" [ngClass]="{ left: this._page === 'train' }">
          <div class="column-header-sidebar" >
            <div class="labelRow marginLeft">Data</div>
          </div>
          <div class="sidebar-column-content">
            <ul class="file-list-sidebar" *ngIf="this._page !== 'deploy'">
              <li *ngFor="let set of this.d.dataSets; let i = index;" id="dataset-item-{{ set.id }}" (click)="this.tensorflowService.selectDataSet(set.id, $event)"
                  [ngClass]="{ active: set.open, selected: this.d.multipleSelect.active && i >= this.d.multipleSelect.min && i <= this.d.multipleSelect.max }">
                <div class="row name" [ngClass]="{ small: this._page === 'train' }">{{ set.name }}</div>
                <div class="close close-button" (click)="this.tensorflowService.deleteDataSets(set.id)" *ngIf="this._page !== 'train'"><div></div></div>
                <ul class="training-type-options" *ngIf="this._page === 'train'">
                  <li class="train" [ngClass]="{ active: set.trainingType === 0 }">T</li>
                  <li class="validate" [ngClass]="{ active: set.trainingType === 1 }">V</li>
                </ul>
              </li>
            </ul>


            <ul class="file-list-sidebar last" *ngIf="this._page === 'deploy'">
              <li *ngFor="let mlset of this.d.mlOutputData; let i = index;" id="dataset-item-{{ mlset.id }}" (click)="this.tensorflowService.selectDataSet(mlset.id, $event)"
                  [ngClass]="{ active: mlset.open, selected: this.d.multipleSelect.active && i >= this.d.multipleSelect.min && i <= this.d.multipleSelect.max }">
                <div class="row name" >{{ mlset.name }}</div>
                <div class="close close-button" (click)="this.tensorflowService.deleteDataSets(mlset.id, true)"><div></div></div>
              </li>
            </ul>
          </div>
        </div>
  `,
  styleUrls: ['./tensorflow.component.scss','./sidebar.component.scss', './../windows/effects/effects.component.css' ] //'../../windows/effects/effects.component.css',
})
export class SidebarComponent {

  public d: TensorFlowData;

  public _outputDataVisible: boolean;
  public _inputDataVisible: boolean;

  public _page: string;


  constructor(private tensorflowService: TensorFlowMainService, private tensorflowDrawService: TensorFlowDrawService, private hardwareService: HardwareService) {
    this.d = this.tensorflowService.d;

  }

  @Input()
  set outputDataVisible(visible: boolean) {
    this._outputDataVisible = visible;
  }

  @Input()
  set inputDataVisible(visible: boolean) {
    this._inputDataVisible = visible;
  }

  @Input()
  set page(page: string) {
    this._page = (page && page.trim()) || '';
  }



  toggleDataSection() {
    this.d.dataVisible = !this.d.dataVisible;
    this.tensorflowService.updateResize((!this.d.dataVisible ? window.innerHeight - 60 : window.innerHeight * 0.45));
  }

  toggleVisibilityInput(m: MotorEl, inputIndex: number) {
    // console.log(m, inputIndex);
    // console.log(this.d.selectedDataset);
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

  selectNextFile(next: boolean) {
    if (this.d.selectedDataset) {
      const index = this.d.dataSets.indexOf(this.d.selectedDataset);
      if (index > -1) {
        const newIndex = index + (next ? 1 : -1);
        this.tensorflowService.selectDataSet(this._page === 'data' ? this.d.dataSets[newIndex].id : this.d.mlOutputData[newIndex].id);
      }
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



  getOutputLabels(classifierID: string) {
    const outputItem = this.d.selectedModel.outputs.filter(o => o.id === classifierID)[0];
    return outputItem ? outputItem.labels : [];
  }


  compareID(el1: any, el2: any) {
    return el1 && el2 ? el1.id === el2.id : el1 === el2;
  }

  @HostListener('window:keydown', ['$event'])
    onKeyDown(e: KeyboardEvent) {

      if (e.key === 'ArrowDown') { //down
        this.selectNextFile(true);
      } else if (e.key === 'ArrowUp') { //up
        this.selectNextFile(false);
      }

    }






}
