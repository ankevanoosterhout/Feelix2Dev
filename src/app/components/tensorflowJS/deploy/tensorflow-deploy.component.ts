import { Component, HostListener } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { TensorFlowData } from 'src/app/models/tensorflow-data.model';
import { TensorFlowDrawService } from 'src/app/services/tensorflow-draw.service';
import { TensorFlowMainService } from 'src/app/services/tensorflow-main.service';


@Component({
  selector: 'app-tensorflow-deploy',
  templateUrl: 'tensorflow-deploy.component.html',
  styleUrls: ['../../windows/effects/effects.component.css', './../tensorflow.component.scss'],
})
export class TensorflowDeployComponent {

  public d: TensorFlowData;

  public graphID = 'svg_graph_deploy';
  public size = { width: innerWidth - 395, height: innerHeight - 70, margin: 70 };

  constructor(public tensorflowService: TensorFlowMainService, private tensorflowDrawService: TensorFlowDrawService, private electronService: ElectronService) {
    this.d = this.tensorflowService.d;

    this.tensorflowService.updateGraph.subscribe(data => {
      if (data) {
        this.redraw(data.set, data.trimLines);
        // this.tensorflowDrawService.drawTensorFlowGraphData(data.set, data.trimLines);
      }
    });
  }


  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.redraw();
  }

  redraw(set = this.d.selectedDataset, lines = this.d.trimLines) {
    this.size = { width: innerWidth - 395, height: innerHeight - 70, margin: 70 };
    this.tensorflowDrawService.drawGraph(this.graphID, this.size);
    if (set) {
      this.tensorflowDrawService.drawTensorFlowGraphData(set, null);
    }
  }


  loadDataFromFile() {
    this.electronService.ipcRenderer.send('loadDataFromFile', 'loadMLData');
  }

}
