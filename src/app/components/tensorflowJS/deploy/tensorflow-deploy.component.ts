import { Component, HostListener } from '@angular/core';
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
  public size = { width: innerWidth - 290, height: innerHeight - 219, margin: 80 };

  constructor(public tensorflowService: TensorFlowMainService, private tensorflowDrawService: TensorFlowDrawService) {
    this.d = this.tensorflowService.d;
  }


  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.size = { width: innerWidth - 436, height: innerHeight - 219, margin: 80 };
    this.tensorflowDrawService.drawGraph(this.graphID, this.size);
  }


}
