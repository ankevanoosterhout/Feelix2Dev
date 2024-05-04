import { DOCUMENT } from '@angular/common';
import { Injectable, Inject } from '@angular/core';
import * as d3 from 'd3';
import { Subject } from 'rxjs/internal/Subject';
import { Layer, Model, ModelType } from '../models/tensorflow.model';
import { TensorFlowData } from '../models/tensorflow-data.model';

@Injectable()
export class TensorFlowModelDrawService {

  public d: TensorFlowData;

  modelSVG: any;

  constructor(@Inject(DOCUMENT) private document: Document) {}


  drawModel(model: Model) {

    this.modelSVG = d3.select('#neuralnetwork')
        .append('svg')
          .attr('id', 'neuralnetwork')
          .attr('width', window.innerWidth)
          .attr('height', (window.innerHeight - 41) * 0.6);



  }


  drawLines() {

  }

  drawNodes(coords: Array<any>) {

    this.modelSVG.append('circle')
      .enter()
      .
  }

}





