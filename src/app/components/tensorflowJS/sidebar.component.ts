import { Component, Input, OnInit, Inject, HostListener, AfterViewInit } from '@angular/core';
import { TensorFlowData } from 'src/app/models/tensorflow-data.model';
import { MotorEl } from 'src/app/models/tensorflow.model';
import { TensorFlowDrawService } from 'src/app/services/tensorflow-draw.service';
import { TensorFlowMainService } from 'src/app/services/tensorflow-main.service';


@Component({
  selector: 'app-sidebar',
  template: `

        <div class="sidebar-column" *ngIf="this._double">
          <div class="column-header-sidebar">
            <div class="labelRow marginLeft">Input variables</div>
          </div>

          <div class="sidebar-column-content" [ngClass]="{ 'full-height': this._inputDataVisible && this._outputDataVisible }"
             *ngIf="this.d.selectedDataset && this.d.selectedDataset.m.length > 0">

            <div class="row" id="section_motors">
              <ul class="motor-list-buttons">
                <li class="motor-list-button-item" *ngFor="let m of this.d.selectedDataset.m; let n = index;">
                  <div class="list-text-item" [ngClass]="{ active: m.visible }" *ngIf="m.record" (click)="toggleVisibilityMotor(m)">{{ m.mcu.name }} - {{ m.id }}</div>

                  <div class="row" *ngIf="(!m.d || m.d.length === 0) && this.d.selectedModel && m.visible && m.record">
                    <ul class="input-list-buttons">
                      <li class="input-list-button-item" *ngFor="let input of this.d.selectedModel.inputs; let i = index;">

                        <div class="list-text-item input-list-button-item-content" *ngIf="input.active && m.colors[i] && m.colors[i].visible">
                          <div [ngStyle]="{'background': m.colors[i].hash }" class="active" (click)="toggleVisibilityInput(m, i)">{{ input.name }}</div>

                          <div [ngStyle]="{'background': m.colors[i].hash }" class="color-editor" id="color-editor-{{ m.id }}-{{ i }}" (click)="changeColorInputItem(m, i)">
                            <img src="./assets/icons/buttons/brush.svg"/>
                          </div>
                        </div>
                        <div class="list-text-item input-list-button-item-content" *ngIf="input.active && m.colors[i] && !m.colors[i].visible" (click)="toggleVisibilityInput(m, i)"><div>{{ input.name }}</div></div>
                      </li>
                    </ul>
                  </div>

                  <div class="row" *ngIf="m.d && m.d.length > 0 && m.visible && m.record">
                    <ul class="input-list-buttons">
                      <li class="input-list-button-item" *ngFor="let input of m.d[0].inputs; let i = index;">

                        <div class="list-text-item input-list-button-item-content" *ngIf="m.colors[i] && m.colors[i].visible">
                          <div [ngStyle]="{'background': m.colors[i].hash }" class="active" (click)="toggleVisibilityInput(m, i)">{{ input.name }}</div>

                          <div [ngStyle]="{'background': m.colors[i].hash }" class="color-editor" id="color-editor-{{ m.id }}-{{ i }}" (click)="changeColorInputItem(m, i)">
                            <img src="./assets/icons/buttons/brush.svg"/>
                          </div>
                        </div>
                        <div class="list-text-item input-list-button-item-content" *ngIf="!m.colors[i].visible" (click)="toggleVisibilityInput(m, i)"><div>{{ input.name }}</div></div>
                      </li>
                    </ul>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="sidebar-column" [ngClass]="{ 'left': !this._double }">
          <div class="column-header-sidebar" >
            <div class="labelRow marginLeft">Data</div>
          </div>
          <div class="sidebar-column-content" [ngClass]="{ 'full-height': this._inputDataVisible }">
            <ul class="file-list-sidebar" *ngIf="this.d.dataSets && this._inputDataVisible">
              <li *ngFor="let set of this.d.dataSets; let i = index;" id="dataset-item-{{ set.id }}" (click)="this.tensorflowService.selectDataSet(set.id, $event)"
                  [ngClass]="{ active: set.open, selected: this.d.multipleSelect.active && i >= this.d.multipleSelect.min && i <= this.d.multipleSelect.max }">
                <div class="row name" [ngClass]="{ small: this._train }">{{ set.name }}</div>
                <div class="close close-button" (click)="this.tensorflowService.deleteDataSet(set.id)" *ngIf="!this._train"><div></div></div>
                <ul class="training-type-options" *ngIf="this._train">
                  <li class="train">T</li>
                  <li class="validate">V</li>
                </ul>
              </li>
            </ul>


            <ul class="file-list-sidebar last" *ngIf="this.d.mlOutputData && this._outputDataVisible">
              <li *ngFor="let mlset of this.d.mlOutputData; let i = index;" id="dataset-item-{{ mlset.id }}" (click)="this.tensorflowService.selectDataSet(mlset.id, $event)"
                  [ngClass]="{ active: mlset.open, selected: this.d.multipleSelect.active && i >= this.d.multipleSelect.min && i <= this.d.multipleSelect.max }">
                <div class="row name" >{{ mlset.name }}</div>
                <div class="close close-button" (click)="this.tensorflowService.deleteDataSet(mlset.id, true)"><div></div></div>
              </li>
            </ul>
          </div>
        </div>
  `,
  styleUrls: ['./tensorflow.component.scss','./sidebar.component.scss' ] //'../../windows/effects/effects.component.css',
})
export class SidebarComponent {

  public d: TensorFlowData;

  public _outputDataVisible: boolean;
  public _inputDataVisible: boolean;

  public _double: boolean;

  public _train: boolean;


  constructor(private tensorflowService: TensorFlowMainService, private tensorflowDrawService: TensorFlowDrawService) {
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
  set double(double: boolean) {
    this._double = double;
  }

  @Input()
  set train(train: boolean) {
    this._train = train;
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

}
