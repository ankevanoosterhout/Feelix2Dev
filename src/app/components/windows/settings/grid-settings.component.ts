import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms'
import { ElectronService } from '../../../services/electron.service';
import { FileService } from '../../../services/file.service';
import { File } from '../../../models/file.model';
;
// import { DrawingService } from '../../../services/drawing.service';

@Component({
  selector: 'app-grid-settings',
  standalone: true,
  imports: [ FormsModule ],
  template: `<div class="window-body"></div>
  <div class="window-title-bar">Grid size</div>
  <div class="window-content">
    <div class="inputfield">
        <div class="form-row">
            <label class="select color">Color</label>
            <select class="form-control" [(ngModel)]="file.activeEffect.grid.settings.color.hash" name="color">

              @for (item of colors; track item) {
                <option *ngFor="let item of colors" [ngValue]="item.hash">{{ item.name }}</option>
              }
            </select>
        </div>

        <div class="inputfield-inset">
          <div class="inputfield-inset-title">Vertical gridlines</div>
          <div class="form-row">
              <label>grid line every</label>
              <input type="number" [(ngModel)]="file.activeEffect.grid.settings.spacingX" name="grid-spacingX" />
              <span class="span-text"> {{ this.file.activeEffect.grid.xUnit.name }}</span>
          </div>
          <div class="form-row">
              <label>subdivision</label>
              <input type="number" [(ngModel)]="file.activeEffect.grid.settings.subDivisionsX" name="subdivisionsX"/>
          </div>
        </div>

        <div class="inputfield-inset">
          <div class="inputfield-inset-title">Horizontal gridlines</div>
          <div class="form-row">
              <label>grid line every</label>
              <input type="number" [(ngModel)]="file.activeEffect.grid.settings.spacingY" name="grid-spacingY">
              @if (file.activeEffect.grid.yUnit.name !== 'deg') {
              <span class="span-text"> %</span>
              }
              @if (file.activeEffect.grid.yUnit.name === 'deg') {
              <span class="span-text"> deg</span>
              }
          </div>
          <div class="form-row">
              <label>subdivision</label>
              <input type="number" [(ngModel)]="file.activeEffect.grid.settings.subDivisionsY" name="subdivisionsY">
          </div>
        </div>

        <!-- <div class="form-row" *ngIf="file.activeEffect.grid.xUnit.name === 'custom'">
          <label>Points per revolution</label>
          <input type="number" id="PR" name="PR" [(ngModel)]="file.activeEffect.grid.xUnit.PR">
        </div> -->

        <div class="form-row buttons">
          <button (click)="submit();">Ok</button>
          <button (click)="close();">Cancel</button>
        </div>
    </div>
  </div>`,
  styles: [`
    .span-text {
      padding-left: 10px;
    }

    label.select:after {
      margin-top: 20px;
    }
  `]
})
export class GridSettingsComponent implements OnInit {
  file: File = new File(undefined, undefined, undefined);

  units = [
    { name: 'deg', PR: 360 },
    { name: 'rad', PR: (2 * Math.PI) },
    { name: 'mm', PR: 100 },
    { name: 'cm', PR: 10 },
  ];

  colors = [
    { hash: '#666666', name: 'Gray' },
    { hash: '#00ffff', name: 'Cyan' },
    { hash: '#ec008c', name: 'Magenta' },
    { hash: '#ed1c24', name: 'Red' },
    { hash: '#ec008c', name: 'Magenta' },
    { hash: '#005baa', name: 'Blue' },
    { hash: '#fff200', name: 'Yellow' },
    { hash: '#000000', name: 'Black' }
  ];
  // tslint:disable-next-line: variable-name
  constructor(private electronService: ElectronService, public fileService: FileService) { }

  public submit() {
    // if (this.selectedUnit.name !== this.file.grid.xUnit.name) {
    //   const oldUnits = this.file.grid.xUnit;
    //   this.file.rotation.end = Math.round(this.file.rotation.end * (this.file.grid.xUnit.PR / this.selectedUnit.PR));
    //   this.file.rotation.start = Math.round(this.file.rotation.start * (this.file.grid.xUnit.PR / this.selectedUnit.PR));
    //   this.drawingService.setEditBounds(this.file.mode);
    //   this.fileService.updateUnits(oldUnits, this.selectedUnit, this.file);
    // }
    if (this.file !== undefined) this.fileService.update(this.file);
    this.close();
  }

  public close() {
    if (this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.send('closeTmpWindow');
    }
  }

  ngOnInit(): void {
    this.file = this.fileService.getActiveFile();
  }
}
