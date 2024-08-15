import { Component, Input, AfterViewInit } from '@angular/core';
import { Bounds } from 'src/app/models/tensorflow.model';
import { TensorFlowDrawService } from 'src/app/services/tensorflow-draw.service';


@Component({
  selector: 'app-graph',
  template: `
  <div id="{{ this._id }}" [ngStyle]="{ 'width': this._size.width, 'height': this._size.height }">
    <div class="graph-header" *ngIf="this._title">{{ this._title }}</div>
  </div>`,
  styles: [ `

      #svg_graph_deploy {
        display: inline-flex;
        position: relative;
        height: calc(100vh - 210px);
        width: calc(100vw - 470px);
      }

      #svg_graph_training_A,  #svg_graph_training_B {
        display: inline-flex;
        position: relative;
        height: calc(50vh - 85px);
        width: calc(100vw - 620px);
      }

      #svg_graph_training_B {
        margin-top: -55px;
      }

      #svg_graph_deploy {
        width: calc(100vw - 395px);
        height: calc(100vh - 41px);
      }

      .graph-header {
        position: absolute;
        top: 1.2vw;
        left: 3.4vw;
        font-size: 1vw;
        color: #fff;
        font-weight: 500;

      }

  ` ]
})
export class GraphComponent implements AfterViewInit {

  public _id = '';
  public _size = { width: innerWidth, height: innerHeight, margin: 100 };
  public _title = null;

  public _bounds: Bounds;


  constructor(private tensorflowDrawService: TensorFlowDrawService) {

    this.tensorflowDrawService.updateBoundsGraph.subscribe(res => {
      this._bounds.xMin = res.xMin;
      this._bounds.xMax = res.xMax;
      this._bounds.yMin = res.yMin;
      this._bounds.yMax = res.yMax;
    });
  }


  ngAfterViewInit(): void {
    this.tensorflowDrawService.drawGraph(this._id, this._bounds, this._size);
  }


  @Input()
  set size(size: any) {
    this._size = size;
  }


  @Input()
  set id(id: string) {
    this._id = (id && id.trim()) || '';
  }

  @Input()
  set title(title: string) {
    this._title = (title && title.trim()) || '';
  }

  @Input()
  set bounds(bounds: Bounds) {
    this._bounds = bounds;
  }

}
