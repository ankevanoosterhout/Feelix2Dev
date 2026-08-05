import { Component, HostListener, AfterViewInit, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { v4 as uuid } from 'uuid';

import { TensorFlowMainService } from '../../../services/tensorflow-main.service';
import { ElectronService } from '../../../services/electron.service';
import { TensorFlowDrawService } from '../../../services/tensorflow-draw.service';
import { Classifier, DataSet, TrimSection} from '../../../models/tensorflow.model';
import { TensorFlowData } from '../../../models/tensorflow-data.model';
import { TensorFlowConfig } from '../../../models/tensorflow-config.model';
import { TensorFlowRecordService } from '../../../services/tensorflow-record.service';
import { GraphComponent } from "../../tensorflowJS/graph.component";
import { SidebarComponent } from "../../tensorflowJS/sidebar.component";


@Component({
  selector: 'app-tensorflow-data',
  standalone: true,
  imports: [ CommonModule, FormsModule, GraphComponent, SidebarComponent ],
  templateUrl: 'tensorflow-data.component.html',
  styleUrls: ['../../windows/effects/effects.component.css', './../tensorflow.component.scss'],
})
export class TensorflowDataComponent implements OnInit, AfterViewInit {


  public d: TensorFlowData;
  public config: TensorFlowConfig;
  public graphID = 'svg_graph_data';

  constructor(public tensorflowService: TensorFlowMainService, private electronService: ElectronService, private tensorflowDrawService: TensorFlowDrawService,
              public tensorflowRecordService: TensorFlowRecordService) {

        this.d = this.tensorflowService.d;
        this.config = this.tensorflowDrawService.config;


        // this.tensorflowDrawService.updateTrimSize.subscribe(res => {
        //   const bounds = this.tensorflowService.trimmedDataSize();
        //   if (bounds.dataSize.length > 0) {
        //     this.d.size = Math.max(...bounds.dataSize);
        //   }
        // });


        this.tensorflowService.updateGraphBounds.subscribe(data => {
          this.tensorflowDrawService.updateBounds(data, this.graphID, this.tensorflowRecordService.getSize());
        });

        this.tensorflowService.updateGraph.subscribe(data => {
          if (data) {
            this.tensorflowRecordService.redraw(data.set, data.trimLines, this.graphID, false);
            // this.tensorflowDrawService.drawTensorFlowGraphData(data.set, data.trimLines);
          }
        });


        this.tensorflowService.drawTrimLines.subscribe(data => {
          this.config.zoomable = false;
          this.tensorflowDrawService.drawTrimLines(data.visible, data.lines, this.tensorflowRecordService.getSize());
        });

        this.tensorflowService.updateScale.subscribe(scale => {
          this.tensorflowDrawService.updateScale(scale);
        });

        this.tensorflowDrawService.addOrRemoveSection.subscribe(res => {
          res.add ? this.addTrimLine(res.index) : this.removeTrimLine(res.id);
        });


        this.tensorflowDrawService.redrawGraphData.subscribe(res => {
          if (this.d.selectedDataset) this.tensorflowDrawService.drawTensorFlowGraphData(this.d.selectedDataset, 
                                                                                        (this.d.trimLinesVisible ? this.d.trimLines : undefined), 
                                                                                        this.graphID
                                                                                        );
        });
      }



  ngAfterViewInit(): void {
    this.tensorflowRecordService.redraw(this.d.selectedDataset, this.d.trimLines, this.graphID, false);
  }

  ngOnInit(): void {
    if (this.d.dataSets.length === 0) {
      this.d.dataSets.push(new DataSet(uuid(), 'Data set ' + (this.d.dataSets.length + 1), this.d.selectedMicrocontrollers, this.d.selectedModel?.outputs));
      this.d.dataSets[0].open = true;
      this.d.selectedDataset = this.d.dataSets[0];
    }
  }



  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.tensorflowRecordService.redraw(this.d.selectedDataset, this.d.trimLines, this.graphID, false);
  }


  loadDataSetFromFile() {
    this.electronService.ipcRenderer.send('loadDataFromFile', { storageName: 'loadData', storageLocation: 'loadDataLocation' });
  }


  cancelTrim() {
    this.tensorflowDrawService.removeTrimlines();
    this.d.size = this.tensorflowService.getDataSize(this.d.selectedDataset);
    this.d.trimLinesVisible = false;
    this.config.zoomable = true;
    this.d.trimLines = [ new TrimSection(uuid(), { min: 10, max: 990 }) ];
  }

  trimDataSet() {
    this.tensorflowService.trimSet();
    this.tensorflowDrawService.removeTrimlines();
    this.config.zoomable = true;
  }

  addTrimLine(index: number) {

    const line = index < this.d.trimLines.length ? this.d.trimLines[index] : undefined;

    const min = index - 1 >= 0 && line && this.d.trimLines[index - 1] ? this.d.trimLines[index - 1].values.max : !line ? this.d.trimLines[this.d.trimLines.length - 1].values.max : 0;

    const size = this.tensorflowRecordService.getSize();
    const offset = Math.abs(this.config.scaleX.invert((size.width - size.margin) * 0.05));
    const max = line ? line.values.min : this.config.scaleX.invert(size.width - size.margin);

    this.d.trimLines.splice(index, 0, new TrimSection(uuid(), { min: (min ?? 0) + offset, max: max - offset}));

    this.d.trimLines.sort((a: TrimSection, b: TrimSection) => 
      a.values.min !== undefined && b.values.min !== undefined ? a.values.min - b.values.min : 0);
    this.tensorflowDrawService.drawTrimLines(true, this.d.trimLines, this.tensorflowRecordService.getSize());
  }

  removeTrimLine(id: string) {
    if (this.d.trimLines.length > 1) {
      const line = this.d.trimLines.filter(t => t.id === id)[0];
      if (line) {
        const index = this.d.trimLines.indexOf(line);
        if (index > -1) {
          this.d.trimLines.splice(index, 1);
          this.tensorflowDrawService.drawTrimLines(true, this.d.trimLines, this.tensorflowRecordService.getSize());
        }
      }
    }
  }



  updateLine() {
    if (this.d.selectedDataset) {
      this.tensorflowDrawService.drawTensorFlowGraphData(this.d.selectedDataset, this.d.trimLinesVisible ? this.d.trimLines : null, this.graphID);
    }
  }


  addClassifier(classifier: Classifier) {
    console.log('add classifier', classifier);
    const outputClassifierInModel = this.d.selectedModel?.outputs.filter(o => o.id === classifier.id)[0];
    if (!outputClassifierInModel) {
      this.d.selectedModel?.outputs.push(classifier);
      this.tensorflowService.selectClassifier(classifier.id);
    }
  }

}
