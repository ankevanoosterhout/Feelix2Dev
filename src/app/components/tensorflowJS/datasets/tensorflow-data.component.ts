import { Component, HostListener, AfterViewInit, OnInit } from '@angular/core';
import { TensorFlowMainService } from 'src/app/services/tensorflow-main.service';
import { ElectronService } from 'ngx-electron';
import { TensorFlowDrawService } from 'src/app/services/tensorflow-draw.service';
import { Classifier, DataSet} from 'src/app/models/tensorflow.model';
import { TensorFlowData } from 'src/app/models/tensorflow-data.model';
import { TensorFlowConfig } from 'src/app/models/tensorflow-config.model';
import { v4 as uuid } from 'uuid';
import { TensorFlowRecordService } from 'src/app/services/tensorflow-record.service';


@Component({
  selector: 'app-tensorflow-data',
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


        this.tensorflowDrawService.redraw.subscribe(res => {
          this.tensorflowRecordService.redraw(this.d.selectedDataset, this.d.trimLines, this.graphID);
        });


        this.tensorflowDrawService.updateTrimSize.subscribe(res => {
          const bounds = this.tensorflowService.trimmedDataSize();
          if (bounds.dataSize.length > 0) {
            this.d.size = Math.max(...bounds.dataSize);
          }
        });


        this.tensorflowService.updateGraphBounds.subscribe(data => {
          this.tensorflowDrawService.updateBounds(data, this.graphID, this.tensorflowRecordService.size);
        });

        this.tensorflowService.updateGraph.subscribe(data => {
          if (data) {
            this.tensorflowRecordService.redraw(data.set, data.trimLines, this.graphID);
            // this.tensorflowDrawService.drawTensorFlowGraphData(data.set, data.trimLines);
          }
        });


        this.tensorflowService.drawTrimLines.subscribe(data => {
          this.tensorflowDrawService.drawTrimLines(data.visible, data.lines, this.tensorflowRecordService.size);
        });

        this.tensorflowService.updateScale.subscribe(scale => {
          this.tensorflowDrawService.updateScale(scale);
        });
      }



  ngAfterViewInit(): void {
    this.tensorflowRecordService.redraw(this.d.selectedDataset, this.d.trimLines, this.graphID);
  }

  ngOnInit(): void {
    if (this.d.dataSets.length === 0) {
      this.d.dataSets.push(new DataSet(uuid(), 'Data set ' + (this.d.dataSets.length + 1), this.d.selectedMicrocontrollers, this.d.selectedModel.outputs));
      this.d.dataSets[0].open = true;
      this.d.selectedDataset = this.d.dataSets[0];
    }
  }



  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.tensorflowRecordService.redraw(this.d.selectedDataset, this.d.trimLines, this.graphID);
  }


  loadDataSetFromFile() {
    this.electronService.ipcRenderer.send('loadDataFromFile');
  }


  cancelTrim() {
    this.tensorflowDrawService.removeTrimlines();
    this.d.size = this.tensorflowService.getDataSize(this.d.selectedDataset);
    this.d.trimLinesVisible = false;
  }

  trimDataSet() {
    this.tensorflowService.trimSet();
    this.tensorflowDrawService.removeTrimlines();
  }



  updateLine() {
    if (this.d.selectedDataset) {
      this.tensorflowDrawService.drawTensorFlowGraphData(this.d.selectedDataset, this.d.trimLinesVisible ? this.d.trimLines : null, this.graphID);
    }
  }


  addClassifier(classifier: Classifier) {
    console.log('add classifier', classifier);
    const outputClassifierInModel = this.d.selectedModel.outputs.filter(o => o.id === classifier.id)[0];
    if (!outputClassifierInModel) {
      this.d.selectedModel.outputs.push(classifier);
      this.tensorflowService.selectClassifier(classifier.id);
    }
  }

}
