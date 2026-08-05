import { Component, Input, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TensorFlowData } from '../../models/tensorflow-data.model';
import { MotorEl, TrainingType } from '../../models/tensorflow.model';
import { TensorFlowDrawService } from '../../services/tensorflow-draw.service';
import { TensorFlowMainService } from '../../services/tensorflow-main.service';


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
      CommonModule,
      FormsModule       
    ],
  template: `

        <div class="sidebar-column small" *ngIf="this._page !== 'train'">
          <div class="column-header-sidebar">
            <div class="labelRow marginLeft">Input</div>
          </div>

          <div class="sidebar-column-content" *ngIf="this.getActiveDataset()">

            <div class="row" id="section_motors">
              <ul class="motor-list-buttons">
                @for (m of this.getActiveDataset()?.m; track m.id) {
                <li class="motor-list-button-item">
                  <div class="list-text-item" [ngClass]="{ active: m.visible }" *ngIf="m.record" (click)="toggleVisibilityMotor(m)">{{ (m.id ? m.id : getIDFromIndex(m.index)) }}</div>

                  @if (this.d.selectedModel !== undefined && m.visible && m.record && (!m.d || m.d.length === 0)) {
                  <div class="row">
                    <ul class="input-list-buttons">

                      @for (input of this.d.selectedModel.inputs; track input.active; let i = $index) {
                      <li class="input-list-button-item">

                        @if (input.active && m.colors[i] && m.colors[i].visible) {
                        <div class="list-text-item input-list-button-item-content">
                          <div [ngStyle]="{'background': m.colors[i].hash }" class="active" (click)="toggleVisibilityInput(m, i.toString())">{{ input.slug }}</div>

                          <div [ngStyle]="{'background': m.colors[i].hash }" class="color-editor" id="color-editor-{{ m.id }}-{{ i }}" (click)="changeColorInputItem(m, i.toString())">
                            <img src="./assets/icons/buttons/brush.svg"/>
                          </div>
                        </div>
                        }

                        <div class="list-text-item input-list-button-item-content" *ngIf="input.active && m.colors[i] && !m.colors[i].visible" (click)="toggleVisibilityInput(m, i.toString())"><div>{{ input.slug }}</div></div>
                      </li>
                      }

                    </ul>
                  </div>
                  }
                  
                  @if (m.d && m.d.length > 0 && m.visible && m.record) {
                  <div class="row">
                    <ul class="input-list-buttons">

                      @for (input of m?.d[0].inputs; track input.name; let i = $index) {
                      <li class="input-list-button-item">
                        <div class="list-text-item input-list-button-item-content" *ngIf="getInputVisibility(m, input.name)">
                          <div [ngStyle]="{'background': getInputHash(m, input.name) }" class="active" (click)="toggleVisibilityInput(m, input.name)">{{ getCharAtZero(input.name) }}</div>

                          <div [ngStyle]="{'background': getInputHash(m, input.name) }" class="color-editor" id="color-editor-{{ m.id }}-{{ i }}" (click)="changeColorInputItem(m, input.name)">
                            <img src="./assets/icons/buttons/brush.svg"/>
                          </div>
                        </div>
                        <div class="list-text-item input-list-button-item-content" *ngIf="!getInputVisibility(m, input.name)" (click)="toggleVisibilityInput(m, input.name)"><div>{{ getCharAtZero(input.name) }}</div></div>
                      </li>
                      }
                    </ul>
                  </div>
                  }
                </li>
                }
              </ul>
            </div>
          </div>
        </div>




        <div class="sidebar-column" *ngIf="this._page !== 'train'">
          <div class="column-header-sidebar" >
            <div class="labelRow marginLeft">Output</div>
          </div>

          <div class="sidebar-column-content" *ngIf="this._page === 'data'">

            @if (this.d.selectedDataset !== undefined && this.d.selectedDataset.outputs.length > 0) {
            <ul class="data_output_list">

              @for (output of this.d.selectedDataset.outputs; track output.classifier_id; let o = $index) {
              <li class="row variable_name data_element selectbox" id="dataset-output-select-{{ output.classifier_id }}">
                <label class="labelRow small">{{ output.classifier_name }}</label>
                <select class="form-control playWindow microcontroller" id="{{ this.d.selectedDataset.id }}-{{ output.classifier_id }}" name="{{ this.d.selectedDataset.id }}-{{ output.classifier_id }}"
                    [(ngModel)]="output.label" title="select label that is associated with the selected data set" [compareWith]="compareID"
                    (change)="this.tensorflowService.updateOutputLabel(output.classifier_id, output.label.id)">
                  <option class="placeholder" value="undefined" selected="selected">-- select label --</option>
                  <option *ngFor="let label of this.getOutputLabels(output.classifier_id)" [ngValue]="label">{{ label.name }}</option>
                </select>
              </li>
              }
            </ul>
            }
          </div>

          <div class="sidebar-column-content" *ngIf="this._page === 'deploy'">
            <ul id="data_output_list" class="results">

              @for (output of this.d.selectedModel?.outputs; track output) {
              <li>
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
              }

            </ul>
          </div>
        </div>



        <div class="sidebar-column" [ngClass]="{ left: this._page === 'train' }">
          <div class="column-header-sidebar" >
            <div class="labelRow marginLeft">Data</div>
          </div>
          <div class="sidebar-column-content">
            <ul class="file-list-sidebar" *ngIf="this._page !== 'deploy'">

              @for (set of this.d.dataSets; track set.id; let i = $index) {
              <li id="dataset-item-{{ set.id }}" (click)="this.selectDataSet(set.id, false, $event)"
                  [ngClass]="{ noPointer: this._page === 'train', active: this._page !== 'train' && set.open, selected: this._page !== 'train' && this.d.multipleSelect.active && i >= this.d.multipleSelect.min && i <= this.d.multipleSelect.max }">
                <div class="row name" [ngClass]="{'small': this._page === 'train' }">{{ set.name }}</div>
                
                @if (this._page !== 'train') {
                <div class="close close-button" (click)="this.tensorflowService.deleteDataSets(set.id)"><div></div></div>
                }

                @if (this._page === 'train') {
                <ul class="training-type-options" *ngIf="this._page === 'train'">
                  <li class="train" [ngClass]="{'active-type': set.trainingType === 0 }" (click)="this.updateTrainingType(set.id)">T</li>
                  <li class="validate" [ngClass]="{'active-type': set.trainingType === 1 }" (click)="this.updateTrainingType(set.id)">V</li>
                </ul>
                }
              </li>
              }
            </ul>


            <ul class="file-list-sidebar last" *ngIf="this._page === 'deploy'">

              @for (mlset of this.d.mlOutputData; track mlset.id; let n = $index) {
              <li (click)="this.selectDataSet(mlset.id, true, $event)"
                  [ngClass]="{ active: mlset.open, selected: this.d.multipleSelect.active && n >= this.d.multipleSelect.min && n <= this.d.multipleSelect.max }">
                <div class="row name" >{{ mlset.name }}</div>
                <div class="close close-button" (click)="this.tensorflowService.deleteDataSets(mlset.id, true)"><div></div></div>
              </li>
              }
              
            </ul>
          </div>
        </div>
  `,
  styleUrls: ['./tensorflow.component.scss','./sidebar.component.scss', './../windows/effects/effects.component.css' ] //'../../windows/effects/effects.component.css',
})
export class SidebarComponent {

  public d: TensorFlowData;

  public _outputDataVisible: boolean = false;
  public _inputDataVisible: boolean = false;

  public _page: string = '';

  idList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];


  constructor(public tensorflowService: TensorFlowMainService, private tensorflowDrawService: TensorFlowDrawService, private changeDetection: ChangeDetectorRef) {
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


  selectDataSet(id: string, ml: boolean, event: PointerEvent | undefined = undefined) {
    this.tensorflowDrawService.enableZoom(true);
    this.tensorflowService.selectDataSet(id, ml, event);
    this.changeDetection.detectChanges();
  }

  updateTrainingType(id: string) {
    const set = this.d.dataSets.filter(d => d.id === id)[0];
    if (set) {
      set.trainingType = set.trainingType === TrainingType.training ? TrainingType.validation : TrainingType.training;
      if (this.d.selectedModel) this.d.selectedModel.training.distribution = this.updateDistribution();
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
      const index = this.d.selectedMLDataset ? dataset.indexOf(this.d.selectedMLDataset) : -1;
      if (index > -1) {
        const newIndex = index + (next ? 1 : -1);

        if (newIndex > -1 && newIndex < dataset.length) {
          const newIndex = index + (next ? 1 : -1);
          this.selectDataSet(MLdata ? this.d.mlOutputData[newIndex].id : this.d.dataSets[newIndex].id, MLdata);
          // this.tensorflowService.selectDataSet(MLdata ? this.d.mlOutputData[newIndex].id : this.d.dataSets[newIndex].id, MLdata);
        }
      }
    }
  }


  getOutputLabels(classifierID: string | undefined) {
    const outputItem = classifierID !== undefined ? this.d.selectedModel?.outputs.filter(o => o.id === classifierID)[0] : undefined;
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
