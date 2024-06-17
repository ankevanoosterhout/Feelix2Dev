import { DOCUMENT } from '@angular/common';
import { Component, Input, OnInit, Inject, HostListener, AfterViewInit } from '@angular/core';
import { DataSet } from 'src/app/models/tensorflow.model';
import { TensorFlowDrawService } from 'src/app/services/tensorflow-draw.service';


@Component({
  selector: 'app-graph',
  template: `<div id="{{ this._id }}" [ngStyle]="{ 'width': this._size.width, 'height': this._size.height }"></div>`,
  styles: [ `

      #svg_graph_training, #svg_graph_deploy {
        display: inline-flex;
        height: calc(100vh - 210px);
        position: relative;
        width: calc(100vw - 470px);
      }

      #svg_graph_deploy {
        width: calc(100vw - 395px);
        height: calc(100vh - 41px);
      }

  ` ]
})
export class GraphComponent implements AfterViewInit {

  public _id = '';
  public _size = { width: innerWidth, height: innerHeight, margin: 100 };


  constructor(private tensorflowDrawService: TensorFlowDrawService) { }

  
  ngAfterViewInit(): void {
    this.tensorflowDrawService.drawGraph(this._id, this._size);
  }


  @Input()
  set size(size: any) {
    this._size = size;
  }


  @Input()
  set id(id: string) {
    this._id = (id && id.trim()) || '';
  }


}
