import { Component, Input, HostListener, ChangeDetectorRef } from '@angular/core';
import { TensorFlowData } from 'src/app/models/tensorflow-data.model';
import { MotorEl, TrainingType } from 'src/app/models/tensorflow.model';
import { TensorFlowDrawService } from 'src/app/services/tensorflow-draw.service';
import { TensorFlowMainService } from 'src/app/services/tensorflow-main.service';


@Component({
  selector: 'app-sidebar',
  template: `

        <div class="sidebar-column small" *ngIf="this._page !== 'train'">
          <div class="column-header-sidebar">
            <div class="labelRow marginLeft">Input</div>
          </div>

          <div class="sidebar-column-content" *ngIf="this.getActiveDataset()">

            <div class="row" id="section_motors">
              <ul class="motor-list-buttons">
                <li class="motor-list-button-item" *ngFor="let m of this.getActiveDataset().m">
                  <div class="list-text-item" [ngClass]="{ active: m.visible }" *ngIf="m.record" (click)="toggleVisibilityMotor(m)">{{ (m.id ? m.id : getIDFromIndex(m.index)) }}</div>

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

                  <div class="row" *ngIf="(m.d && m.d.length > 0) && m.visible && m.record">
                    <ul class="input-list-buttons">
                      <li class="input-list-button-item" *ngFor="let input of m.d[0].inputs">
                        <div class="list-text-item input-list-button-item-content" *ngIf="getInputVisibility(m, input.name)">
                          <div [ngStyle]="{'background': getInputHash(m, input.name) }" class="active" (click)="toggleVisibilityInput(m, input.name)">{{ getCharAtZero(input.name) }}</div>

                          <div [ngStyle]="{'background': getInputHash(m, input.name) }" class="color-editor" id="color-editor-{{ m.id }}-{{ i }}" (click)="changeColorInputItem(m, input.name)">
                            <img src="./assets/icons/buttons/brush.svg"/>
                          </div>
                        </div>
                        <div class="list-text-item input-list-button-item-content" *ngIf="!getInputVisibility(m, input.name)" (click)="toggleVisibilityInput(m, input.name)"><div>{{ getCharAtZero(input.name) }}</div></div>
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
                    [(ngModel)]="output.label" title="select label that is associated with the selected data set" [compareWith]="compareID"
                    (change)="this.tensorflowService.updateOutputLabel(output.classifier_id, output.label.id)">
                  <option class="placeholder" value="undefined" selected="selected">-- select label --</option>
                  <option *ngFor="let label of this.getOutputLabels(output.classifier_id)" [ngValue]="label">{{ label.name }}</option>
                </select>
              </li>
            </ul>
          </div>

          <div class="sidebar-column-content" *ngIf="this._page === 'deploy'">
            <ul id="data_output_list" class="results">
              <li *ngFor="let output of this.d.selectedModel.outputs">
                <label class="label bold" *ngIf="output.active">{{ output.name }}</label>

                <ul id="data_output_list_items" *ngIf="output.active">
                  <li *ngFor="let label of output.labels; let i=index;">
                    <label class="label list">{{ label.name }}</label>
                    <div class="confidence-levels">
                      <div class="bar-container"><div class="bar" id="bar-{{ output.id }}-{{ label.id }}"></div></div>
                      <span class="confidence" id="confidence-{{ output.id }}-{{ label.id }}">0%</span>
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
              <li *ngFor="let set of this.d.dataSets; let i = index;" id="dataset-item-{{ set.id }}" (click)="this.selectDataSet(set.id, false, $event)"
                  [ngClass]="{ noPointer: this._page === 'train', active: this._page !== 'train' && set.open, selected: this._page !== 'train' && this.d.multipleSelect.active && i >= this.d.multipleSelect.min && i <= this.d.multipleSelect.max }">
                <div class="row name" [ngClass]="{'small': this._page === 'train' }">{{ set.name }}</div>
                <div class="close close-button" (click)="this.tensorflowService.deleteDataSets(set.id)" *ngIf="this._page !== 'train'"><div></div></div>
                <ul class="training-type-options" *ngIf="this._page === 'train'">
                  <li class="train" [ngClass]="{'active-type': set.trainingType === 0 }" (click)="this.updateTrainingType(set.id)">T</li>
                  <li class="validate" [ngClass]="{'active-type': set.trainingType === 1 }" (click)="this.updateTrainingType(set.id)">V</li>
                </ul>
              </li>
            </ul>


            <ul class="file-list-sidebar last" *ngIf="this._page === 'deploy'">
              <li *ngFor="let mlset of this.d.mlOutputData; let n = index;" id="dataset-item-{{ mlset.id }}" (click)="this.selectDataSet(mlset.id, true, $event)"
                  [ngClass]="{ active: mlset.open, selected: this.d.multipleSelect.active && n >= this.d.multipleSelect.min && n <= this.d.multipleSelect.max }">
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

  idList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];


  constructor(private tensorflowService: TensorFlowMainService, private tensorflowDrawService: TensorFlowDrawService, private changeDetection: ChangeDetectorRef) {
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

  toggleVisibilityInput(m: MotorEl, name: string) {
    const color = m.colors.filter(c => c.input_name == name)[0];
    if (color) {
      color.visible = !color.visible;
      for (const set of (this._page === 'data' ? this.d.dataSets : this.d.mlOutputData)) {
        if (set.m) {
          const motor = set.m.filter(motor => motor.index === m.index)[0];
          if (motor) {
            const inputColor = motor.colors.filter(c => c.input_name == name)[0];
            if (inputColor) { inputColor.visible = color.visible };
          }
        }
      }

      const set = this.getActiveDataset();
      if (set) {
        this.tensorflowDrawService.drawTensorFlowGraphData(set, this.d.trimLinesVisible ? this.d.trimLines : null, 'svg_graph_' + this._page);
      }
    }
    this.changeDetection.detectChanges();
  }

  toggleVisibilityMotor(m: MotorEl) {
    if (m) {
      m.visible = !m.visible;
      for (const set of (this._page === 'data' ? this.d.dataSets : this.d.mlOutputData)) {
        if (set.m) {
          const motor = set.m.filter(motor => motor.index === m.index)[0];
          motor.visible = m.visible;
        }
      }
      const set = this.getActiveDataset();
      if (set) {
        this.tensorflowDrawService.drawTensorFlowGraphData(set, this.d.trimLinesVisible ? this.d.trimLines : null, 'svg_graph_' + this._page);
      }
    }
    this.changeDetection.detectChanges();
  }

  getInputHash(m: MotorEl, name: string) {
    const color = m.colors.filter(c => c.input_name == name)[0];
    return color ? color.hash : '#00AEEF';
  }

  getInputVisibility(m: MotorEl, name: string) {
    const color = m.colors.filter(c => c.input_name == name)[0];
    return color ? color.visible : false;
  }

  getActiveDataset() {
    return this._page === 'data' ? this.d.selectedDataset : this.d.selectedMLDataset;
  }


  changeColorInputItem(m: MotorEl, name: string) {
    const color = m.colors.filter(c => c.input_name == name)[0];
    if (color) {
      color.hash = this.getNextColor(color.hash);
      for (const set of (this._page === 'data' ? this.d.dataSets : this.d.mlOutputData)) {
        if (set.m) {
          const motor = set.m.filter(motor => motor.index === m.index)[0];
          if (motor) {
            const inputColor = motor.colors.filter(c => c.input_name == name)[0];
            if (inputColor) { inputColor.hash = color.hash };
          }
        }
      }
      const set = this.getActiveDataset();
      if (set) {
        this.tensorflowDrawService.drawTensorFlowGraphData(set, this.d.trimLinesVisible ? this.d.trimLines : null, 'svg_graph_' + this._page);
      }
    }
    this.changeDetection.detectChanges();
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

  getCharAtZero(text: string) {
    return text.charAt(0);
  }

  getIDFromIndex(index: number) {
    return this.idList[index];
  }


  selectDataSet(id: string, ml: boolean, event = null) {
    this.tensorflowDrawService.enableZoom(true);
    this.tensorflowService.selectDataSet(id, ml, event);
    this.changeDetection.detectChanges();
  }

  updateTrainingType(id: string) {
    const set = this.d.dataSets.filter(d => d.id === id)[0];
    if (set) {
      set.trainingType = set.trainingType === TrainingType.training ? TrainingType.validation : TrainingType.training;
      this.d.selectedModel.training.distribution = this.updateDistribution();
    }
  }

  updateDistribution() {
    const trainingSets = this.d.dataSets.filter(d => d.trainingType === TrainingType.training);
    const validationSets = this.d.dataSets.filter(d => d.trainingType === TrainingType.validation);

    return (1 / (trainingSets.length + validationSets.length)) * trainingSets.length;
  }


  selectNextFile(next: boolean) {
    const MLdata = this._page === 'deploy' ? true : false;

    if (this.getActiveDataset()) {
      const dataset = MLdata ? this.d.mlOutputData : this.d.dataSets;
      const index = dataset.indexOf(this.d.selectedMLDataset);
      const newIndex = index + (next ? 1 : -1);

      if (newIndex > -1 && newIndex < dataset.length) {
        const newIndex = index + (next ? 1 : -1);
        this.selectDataSet(MLdata ? this.d.mlOutputData[newIndex].id : this.d.dataSets[newIndex].id, MLdata);
        // this.tensorflowService.selectDataSet(MLdata ? this.d.mlOutputData[newIndex].id : this.d.dataSets[newIndex].id, MLdata);
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

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        this.selectNextFile(true);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        this.selectNextFile(false);
      }

    }

}
