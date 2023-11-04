import { DOCUMENT } from '@angular/common';
import { Injectable, Inject } from '@angular/core';
import * as d3 from 'd3';
import { Subject } from 'rxjs/internal/Subject';
import { TensorFlowConfig } from '../models/tensorflow-config.model';
import { DataSet, Bounds } from '../models/tensorflow.model';

@Injectable()
export class TensorFlowDrawService {

  public config: TensorFlowConfig;
  redraw: Subject<any> = new Subject<void>();

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.config = new TensorFlowConfig();
  }


  drawGraph() {
    d3.selectAll('#datagraph').remove();

    this.config.dataSVG = d3.select('#svg_graph')
        .append('svg')
          .attr('id', 'datagraph')
          .attr('width', this.config.width)
          .attr('height', this.config.height);
          // .attr("viewBox", [0, 0, this.config.width, this.config.height]);

    this.config.dataSVG.append('clipPath')
      .attr('id', 'clipPathGraph')
      .append('svg:rect')
      .attr('width', this.config.width - (2 * this.config.margin))
      .attr('height', this.config.height - (2 * this.config.margin))
      .attr('transform', 'translate(' + this.config.margin + ',0)');

    this.config.dataSVG.append('rect')
      .attr('id', 'border')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', this.config.width - (2 * this.config.margin))
      .attr('height', this.config.height - (2 * this.config.margin))
      .attr('transform', 'translate(' + this.config.margin + ',' + this.config.margin + ')')
      .style('stroke', '#999')
      .style('stroke-width', 0.5)
      .style('fill', 'transparent');

    this.setScale();
    this.drawTicks();
  }



  setScale() {

    this.setZoom();

    this.config.scaleY = d3.scaleLinear()
      .domain([this.config.bounds.yMax, this.config.bounds.yMin])
      .range([this.config.margin, this.config.height - this.config.margin]);

    this.config.baseScaleX = d3.scaleLinear()
      .domain([this.config.bounds.xMin, this.config.bounds.xMax])
      .range([this.config.margin, this.config.width - this.config.margin]);

    if (!this.config.transform || isNaN(this.config.transform.k) || isNaN(this.config.transform.x)) {
      this.config.transform = d3.zoomIdentity.translate(0, 0).scale(1);
      this.config.scaleX = this.config.transform.rescaleX(this.config.baseScaleX);
    } else {
      const t = d3.zoomIdentity.translate(this.config.transform.x, 0).scale(this.config.transform.k);
      this.config.scaleX = t.rescaleX(this.config.baseScaleX);
    }

    this.config.dataSVG.call(this.config.zoom);

  }


  setZoom() {
    this.config.zoom = d3
      .zoom()
      .scaleExtent([0.01, Infinity])
      .translateExtent([[0,0], [this.config.width, this.config.height]]) // 1.2
      .on('zoom', (event: any) => {
        this.config.transform = event.transform;
        this.scaleContent(this.config.transform);
      });
  }


  scaleContent(transform: any) {
    this.config.scaleX = transform.rescaleX(this.config.baseScaleX);
    const rescale = this.config.xAxisBottom.scale(this.config.scaleX);
    this.config.dataSVG.selectAll('.axisBottom').call(rescale);

    this.config.dataSVG.selectAll('.axisBottom text')
        .attr('y', this.config.height - (2 * this.config.margin) + 10)
        .attr('x', 0);

    this.redraw.next(true);
  }

  updateBounds(bounds: Bounds) {
    this.config.bounds.xMax = bounds.xMax;
    this.config.bounds.xMin = bounds.xMin;
    this.config.bounds.yMax = bounds.yMax;
    this.config.bounds.yMin = bounds.yMin;

    this.config.transform = null;

    this.setScale();
  }


  drawTicks() {
    this.config.yAxis = this.config.dataSVG.append('g');

    const yAxis = d3
        .axisLeft(this.config.scaleY)
        .ticks(5)
        .tickSize(this.config.width - (2 * this.config.margin))
        .tickFormat((e: any) => {
          if (Math.floor(e) !== e) { return; }
          return e;
        });

    this.config.yAxis.append('g')
        .attr('transform', 'translate(' + (this.config.width - this.config.margin) + ', 0)')
        .attr('class', 'datagraphTicks')
        .call(yAxis)
          .selectAll('text')
          .attr('y', 0)
          .attr('x', -(this.config.width - (2 * this.config.margin)) - 10);

    this.config.xAxisBottom = d3
        .axisBottom(this.config.scaleX)
        .ticks(10)
        .tickSize(this.config.height - (2 * this.config.margin))
        .tickFormat((e: any) => {
          if (Math.floor(e) !== e) { return; }
          return e;
        });

    this.config.xAxis = this.config.dataSVG.append('g');


    this.config.xAxis.append('g')
        .attr('id', 'xAxis')
        .attr('class', 'datagraphTicks axisBottom')
        .attr('transform', 'translate(0,'+ this.config.margin + ')')
        .call(this.config.xAxisBottom)
          .selectAll('text')
          .attr('y', this.config.height - (2 * this.config.margin) + 10)
          .attr('x', 0);
  }


  drawTensorFlowGraphData(data: DataSet, trimLines: any) {


    if (data && data.m.length > 0) {
      d3.selectAll('#dataGroup').remove();

      const dataGroup = this.config.dataSVG.append('g')
        .attr('id', 'dataGroup')
        .attr('clip-path', 'url(#clipPathGraph)');


      for (const m of data.m) {
        let i = 0;
        if (m.record && m.visible && m.d && m.d.length > 0) {
          for (const input of m.d[0].inputs) {

            if (m.colors[i].visible) {

              const line = d3.line()
                .x((d: { time: number; }) => isNaN(this.config.scaleX(d.time)) ? d.time : this.config.scaleX(d.time))
                .y((d: { inputs: { value: any; name: string }[]; }) => {
                  const inputItem = d.inputs.filter(n => n.name === input.name)[0];
                  return isNaN(this.config.scaleY(inputItem.value)) ? 0 : this.config.scaleY(inputItem.value);
                });


              if (line) {

                dataGroup.append('path')
                  // .datum(m.d)
                  .attr('fill', 'none')
                  .attr('stroke', m.colors[i].hash)
                  .attr('stroke-width', 1.2)
                  .attr('d', line(m.d))
                    .append('svg:title')
                      .text(() => m.mcu.name + '-' + m.id);

              }
            }
            i++;
          }
        }
      }

      if (trimLines) {
        this.drawTrimLines(data.bounds, true, trimLines);
      }
    }
  }

  removeTrimlines() {
    d3.selectAll('#dataTrimLines').remove();
  }


  drawTrimLines(bounds: Bounds, visible: boolean, lines: any) {

    d3.selectAll('#dataTrimLines').remove();

    if (visible) {

      const trimLinesGroup = this.config.dataSVG.append('g')
        .attr('id', 'dataTrimLines')
        .attr('transform', 'translate(0,0)');

      const dragLine = d3
            .drag()
            .on('drag', (event: any, d: { id: number; value: number } ) => {
              d.value = this.config.scaleX.invert(event.x);
              d3.select('#trimLine_' + d.id).attr('x1', event.x);
              d3.select('#trimLine_' + d.id).attr('x2', event.x);
            });


      trimLinesGroup.selectAll('line.trim')
        .data(lines)
        .enter()
        .append('line')
        .attr('id', (d: { id: number }) => 'trimLine_' + d.id)
        .attr('x1', (d: { value: number; }) => this.config.scaleX(d.value))
        .attr('y1', this.config.scaleY(bounds.yMin * 1.05))
        .attr('x2', (d: { value: number; }) => this.config.scaleX(d.value))
        .attr('y2', this.config.scaleY(bounds.yMax * 1.05))
        .style('shape-rendering', 'crispEdges')
        .style('stroke', '#FF0000')
        .style('stroke-width', 1)
        .attr('cursor', 'e-resize')
        .call(dragLine);

    }
  }


}
