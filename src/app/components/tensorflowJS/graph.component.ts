import { DOCUMENT } from '@angular/common';
import { Component, Input, OnInit, Inject, HostListener, AfterViewInit } from '@angular/core';
import { TensorFlowDrawService } from 'src/app/services/tensorflow-draw.service';


@Component({
  selector: 'app-graph',
  template: `<div id="{{ this._id }}" [ngStyle]="{ 'width': this._size.width, 'height': this._size.height }"></div>`,
  styles: [ `

      #svg_graph_training, #svg_graph_deploy {
        display: inline-flex;
        height: calc(100vh - 219px);
        position: relative;
        width: calc(100vw - 436px);
      }

      #svg_graph_deploy {
        width: calc(100vw - 300px);
      }

  ` ]
})
export class GraphComponent implements AfterViewInit {

  public _id = '';

  public _size = { width: innerWidth, height: innerHeight, margin: 100 };

  constructor(private tensorflowDrawService: TensorFlowDrawService) {

  }
  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.

    this.tensorflowDrawService.drawGraph(this._id, this._size);
    console.log(this._size);
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