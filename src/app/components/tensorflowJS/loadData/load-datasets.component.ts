import { Component, OnInit, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ElectronService } from 'ngx-electron';
// import { DataSet, Model } from 'src/app/models/tensorflow.model';
import { DataSetService } from 'src/app/services/dataset.service';
import { TensorFlowModelService } from 'src/app/services/tensorflow-model.service';
import { Router } from '@angular/router';
import { Folder } from 'src/app/models/file.model';


@Component({
  selector: 'app-load-dataset',
  templateUrl: './load-dataset.component.html',
  styleUrls: ['./load-dataset.component.css', '../tensorflow.component.scss'],
})

export class LoadDataSetsComponent implements OnInit {

  mode = '';
  data: Array<any>;
  allSelected = false;
  multipleSelect = {min: null, max: null, active: false};
  currentLevel = 0;
  activeFolder = { id: null, parent: null };

  // tslint:disable-next-line: variable-name
  constructor(@Inject(DOCUMENT) private document: Document, private electronService: ElectronService, private dataSetService: DataSetService,
             private tensorflowModelService: TensorFlowModelService, private router: Router) {

              if (this.router.url === '/load-model') {
                this.mode = 'model';
                this.data = this.tensorflowModelService.getAllModels();
              } else {
                this.mode = 'data';
                this.data = this.dataSetService.getAllDataSets();
              }
              if (this.data.length > 0) {
                this.data.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
              }
            }

  public submit() {
    if (this.data.filter(d => d.selected).length > 0) {
      this.electronService.ipcRenderer.send((this.mode === 'data' ? 'load-datasets' : 'load-model'), this.data.filter(d => d.selected));
    }
    this.close();
  }


  public export() {
    if (this.data.filter(d => d.selected).length > 0) {
      // console.log(this.data.filter(d => d.selected));
      this.electronService.ipcRenderer.send('export-datasets', this.data.filter(d => d.selected));
    }
  }


  public close() {
    if (this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.send('closeTmpWindow');
    }
  }

  public createFolder(files: Array<any> = this.data.filter(d => d.selected), name: string = null) {
    if (!name) {
      name = 'new Folder ' + (this.data.filter(d => d instanceof Folder).length + 1);
    }
    this.dataSetService.createFolder(files, name, this.currentLevel);
    this.multipleSelect = {min: null, max: null, active: false};
  }

  openFolder(folder: Folder) {
    this.activeFolder = { id: folder.id, parent: folder.parent };
    this.data = folder.content;
    this.currentLevel = folder.level;
  }

  moveLevelUp() {
    if (this.currentLevel > 0) {
      this.currentLevel--;
      if (this.currentLevel === 0) {
        this.data = this.dataSetService.getAllDataSets(this.activeFolder.parent);
      }
    }
  }

  updateItem(item: any) {
    if (this.mode === 'data') {
      this.dataSetService.updateDataSet(item, this.activeFolder);
    } else {
      this.tensorflowModelService.updateModelName(item);
    }

  }

  selectAllItems() {
    for (const item of this.data) {
      item.selected = this.allSelected;
      (this.document.getElementById('select_item_' + item.id) as HTMLInputElement).checked = item.selected;
    }
  }

  selectDataSet(id: string, event: any) {
    const inputFocus = (this.document.getElementById('item-name-' + id) as HTMLInputElement);
    const isFocused = (this.document.activeElement === inputFocus);

    if (!isFocused) {
      const dataSet = this.data.filter(d => d.id === id)[0];

      if (dataSet) {
        if (dataSet.content) {
          this.openFolder(dataSet);
        } else {
          const selectedItem = this.data.filter(d => d.selected)[0];

          if (selectedItem) {
            if (this.mode === 'model') {
              selectedItem.selected = false;
              (this.document.getElementById('select_item_' + selectedItem.id) as HTMLInputElement).checked = false;
            }
          }

          if (!dataSet.selected) {
            if (event.shiftKey && this.multipleSelect.min !== null) {
              this.multipleSelect.max = this.data.indexOf(dataSet);
              this.multipleSelect.active = true;
              let index = 0;
              for (const set of this.data) {
                if (index >= this.multipleSelect.min && index <= this.multipleSelect.max) {
                  set.selected = true;
                }
                index++;
              }
            } else {
              this.multipleSelect.min = this.data.indexOf(dataSet);
              this.multipleSelect.max = null;
              this.multipleSelect.active = false;
            }
            dataSet.selected = true;
          } else {
            dataSet.selected = !dataSet.selected;
          }

          (this.document.getElementById('select_item_' + id) as HTMLInputElement).checked = dataSet.selected;
        }
      }
    }
  }


  delete() {
    for (const item of this.data.filter(d => d.selected)) {
      this.mode === 'data' ? this.dataSetService.deleteDataSet(item.id) : this.tensorflowModelService.deleteModel(item.id);
    }
  }



  ngOnInit(): void {
    this.document.body.classList.add('disable-scroll-body');
  }


  sortDataItems(sortType: string, index: number) {
    let direction = 1;

    for (let i = 0; i < 3; i++) {
      const headerEl = (this.document.getElementById('item-' + i) as HTMLDivElement);
      if (i === index) {
        if (headerEl.classList.contains('active')) {
          if (headerEl.classList.contains('reverse')) {
            headerEl.classList.remove('reverse');
          } else {
            headerEl.classList.add('reverse');
            direction = -1;
          }
        } else {
          headerEl.classList.add('active');
        }
      } else {
        headerEl.classList.remove('active');
        headerEl.classList.remove('reverse');
      }
    }

    if (sortType === 'name') {
      this.data.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
    } else if (sortType === 'date-created') {
      this.data.sort((a,b) => (a.date.created > b.date.created) ? 1 : ((b.date.created > a.date.created) ? -1 : 0));
    } else if (sortType === 'date-modified') {
      this.data.sort((a,b) => (a.date.modified > b.date.modified) ? 1 : ((b.date.modified > a.date.modified) ? -1 : 0));
    }
    if (direction === -1) {
      this.data.reverse();
    }
  }

}

