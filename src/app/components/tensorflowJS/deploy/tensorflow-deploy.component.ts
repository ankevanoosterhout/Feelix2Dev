import { Component, Inject } from '@angular/core';
import { TensorFlowData } from 'src/app/models/tensorflow-data.model';
import { TensorFlowMainService } from 'src/app/services/tensorflow-main.service';


@Component({
  selector: 'app-tensorflow-deploy',
  templateUrl: 'tensorflow-deploy.component.html',
  styleUrls: ['../../windows/effects/effects.component.css', './../tensorflow.component.scss'],
})
export class TensorflowDeployComponent {

  public d: TensorFlowData;

  constructor(private tensorflowService: TensorFlowMainService,) {
    this.d = this.tensorflowService.d;
  }

  



}
