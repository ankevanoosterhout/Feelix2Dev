import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { Subject } from 'rxjs/internal/Subject';
import { TensorFlowConfig } from '../models/tensorflow-config.model';
import { DataSet, Bounds } from '../models/tensorflow.model';

@Injectable()
export class TensorFlowDrawService {

  public config: TensorFlowConfig;

  redraw: Subject<any> = new Subject<void>();
  updateTrimSize: Subject<any> = new Subject<void>();
  redrawGraphTraining: Subject<any> = new Subject<void>();

  svgObject = null;
  svgObject_B = null;

  constructor() {
    this.config = new TensorFlowConfig();
  }


  drawGraph(id="svg_graph", size = { width: this.config.width, height: this.config.height, margin: this.config.margin }) {

    this.config.zoomable = id === 'svg_graph_training_A' || id === 'svg_graph_training_B' ? false : true;

    d3.selectAll('#svg_' + id).remove();

    this.svgObject = d3.select('#' + id)
        .append('svg')
        .attr('id', 'svg_' + id)
        .attr('width', size.width)
        .attr('height', size.height);
          // .attr("viewBox", [0, 0, this.config.width, this.config.height]);

    this.svgObject.append('clipPath')
      .attr('id', 'clipPathGraph')
      .append('svg:rect')
      .attr('width', size.width - (2 * size.margin))
      .attr('height', size.height - size.margin)
      .attr('transform', 'translate(' + size.margin + ',0)');

    this.svgObject.append('rect')
      .attr('id', 'border')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', size.width - (2 * size.margin))
      .attr('height', size.height - (2 * size.margin))
      .attr('transform', 'translate(' + size.margin + ',' + size.margin + ')')
      .style('stroke', '#999')
      .style('stroke-width', 0.5)
      .style('fill', 'transparent');

    this.setScale(size);
    this.drawTicks(size, this.svgObject);
  }

  drawGraph2(id="svg_graph", size = { width: this.config.width, height: this.config.height, margin: this.config.margin }) {

    d3.selectAll('#svg_' + id).remove();

    this.svgObject_B = d3.select('#' + id)
        .append('svg')
        .attr('id', 'svg_' + id)
        .attr('width', size.width)
        .attr('height', size.height);
          // .attr("viewBox", [0, 0, this.config.width, this.config.height]);

    this.svgObject_B.append('clipPath')
      .attr('id', 'clipPathGraph')
      .append('svg:rect')
      .attr('width', size.width - (2 * size.margin))
      .attr('height', size.height - size.margin)
      .attr('transform', 'translate(' + size.margin + ',0)');

    this.svgObject_B.append('rect')
      .attr('id', 'border')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', size.width - (2 * size.margin))
      .attr('height', size.height - (2 * size.margin))
      .attr('transform', 'translate(' + size.margin + ',' + size.margin + ')')
      .style('stroke', '#999')
      .style('stroke-width', 0.5)
      .style('fill', 'transparent');

    this.setScale(size);
    this.drawTicks(size, this.svgObject_B);

  }


  enableZoom(enable: boolean) {
    this.config.zoomable = enable;
  }



  setScale(size = { width: this.config.width, height: this.config.height, margin: this.config.margin }) {

    this.config.scaleY = d3.scaleLinear()
      .domain([this.config.bounds.yMax, this.config.bounds.yMin])
      .range([size.margin, size.height - size.margin]);

    this.config.baseScaleX = d3.scaleLinear()
      .domain([this.config.bounds.xMin, this.config.bounds.xMax])
      .range([size.margin, size.width - size.margin]);

    if (this.config.zoomable) {

      this.setZoom(size);

      if (!this.config.transform || isNaN(this.config.transform.k) || isNaN(this.config.transform.x)) {
        this.config.transform = d3.zoomIdentity.translate(0, 0).scale(1);
        this.config.scaleX = this.config.transform.rescaleX(this.config.baseScaleX);
      } else {
        const t = d3.zoomIdentity.translate(this.config.transform.x, 0).scale(this.config.transform.k);
        this.config.scaleX = t.rescaleX(this.config.baseScaleX);
      }

      this.svgObject.call(this.config.zoom);
    } else  {
      this.config.scaleX = this.config.baseScaleX;
    }

  }


  setZoom(size = { width: this.config.width, height: this.config.height, margin: this.config.margin }) {
    this.config.zoom = d3
      .zoom()
      .scaleExtent([0.01, Infinity])
      .translateExtent([[0,0], [size.width - size.margin, size.height - size.margin]]) // 1.2
      .on('zoom', (event: any) => {
        if (this.config.zoomable) {
          this.config.transform = event.transform;
          this.scaleContent(this.config.transform, size);
        }
      });
  }


  scaleContent(transform: any, size = { width: this.config.width, height: this.config.height, margin: this.config.margin }) {

    this.config.scaleX = transform.rescaleX(this.config.baseScaleX);
    const rescale = this.config.xAxisBottom.scale(this.config.scaleX);
    this.svgObject.selectAll('.axisBottom').call(rescale);

    this.svgObject.selectAll('.axisBottom text')
        .attr('y', size.height - (2 * size.margin) + 10)
        .attr('x', 0);

    this.redraw.next(true);
  }

  updateBounds(bounds: Bounds, size: any = null) {
    this.config.bounds.xMin = bounds.xMin;
    this.config.bounds.xMax = bounds.xMax;
    this.config.bounds.yMin = bounds.yMin;
    this.config.bounds.yMax = bounds.yMax;

    this.config.transform = null;

    size ? this.setScale(size) : this.setScale();
  }

  updateScale(scale: number) {
    this.config.transform = d3.zoomIdentity.translate(0, 0).scale(scale);
    this.config.scaleX = this.config.transform.rescaleX(this.config.baseScaleX);

    this.svgObject.call(this.config.zoom.transform, this.config.transform);

  }


  drawTicks(size = { width: this.config.width, height: this.config.height, margin: this.config.margin }, svg: any) {
    this.config.yAxis = svg.append('g');

    const yAxis = d3
        .axisLeft(this.config.scaleY)
        .ticks(5)
        .tickSize(size.width - (2 * size.margin))
        .tickFormat((e: any) => {
          if (Math.floor(e) !== e) { return; }
          return e;
        });

    this.config.yAxis.append('g')
        .attr('transform', 'translate(' + (size.width - size.margin) + ', 0)')
        .attr('class', 'datagraphTicks')
        .call(yAxis)
          .selectAll('text')
          .attr('y', 0)
          .attr('x', -(size.width - (2 * size.margin)) - 10);

    this.config.xAxisBottom = d3
        .axisBottom(this.config.scaleX)
        .ticks(10)
        .tickSize(size.height - (2 * size.margin))
        .tickFormat((e: any) => {
          if (Math.floor(e) !== e) { return; }
          return e;
        });

    this.config.xAxis = svg.append('g');


    this.config.xAxis.append('g')
        .attr('id', 'xAxis')
        .attr('class', 'datagraphTicks axisBottom')
        .attr('transform', 'translate(0,'+ size.margin + ')')
        .call(this.config.xAxisBottom)
          .selectAll('text')
          .attr('y', size.height - (2 * size.margin) + 10)
          .attr('x', 0);
  }


  drawTensorflowTrainingProgress(logs: Array<any>, size: any) {

    if (logs) {

      d3.selectAll('#dataGroup-0, #dataGroup-1').remove();

      const dataGroup1 = this.svgObject.append('g')
        .attr('id', 'dataGroup-0')
        .attr('clip-path', 'url(#clipPathGraph)');

      const dataGroup2 = this.svgObject_B.append('g')
        .attr('id', 'dataGroup-1')
        .attr('clip-path', 'url(#clipPathGraph)');

      this.drawTrainingData(dataGroup1, logs, 0);
      this.drawTrainingData(dataGroup2, logs, 1);
    }
  }



  drawTrainingData(dataGroup: any, logs: Array<any>, index: number) {

    const training = d3.line()
      .x((d: { epoch: number; }) => this.config.scaleX(d.epoch))
      .y((d: { log: any; }) => { return index === 0 ? (isNaN(this.config.scaleY(d.log.loss)) ? 0 : this.config.scaleY(d.log.loss)) :
                                                      (isNaN(this.config.scaleY(d.log.metric)) ? 0 : this.config.scaleY(d.log.metric)); });

    const validation = d3.line()
      .x((d: { epoch: number; }) => this.config.scaleX(d.epoch))
      .y((d: { log: any }) => { return index === 0 ? (isNaN(this.config.scaleY(d.log.val_loss)) ? 0 : this.config.scaleY(d.log.val_loss)) :
                                                 (isNaN(this.config.scaleY(d.log.val_metric)) ? 0 : this.config.scaleY(d.log.val_metric)); });

    if (training) {
      dataGroup.append('path')
        .attr('fill', 'none')
        .attr('stroke', '#7065EB')
        .attr('stroke-width', 1.5)
        .attr('d', training(logs))
          .append('svg:title')
            .text(() => 'results training data');
    }

    if (validation) {
      dataGroup.append('path')
        .attr('fill', 'none')
        .attr('stroke', '#F2662D')
        .attr('stroke-width', 1.5)
        .attr('d', validation(logs))
          .append('svg:title')
            .text(() => 'results validation data');

    }
  }




  drawTensorFlowGraphData(data: DataSet, trimLines: any, size = { width: this.config.width, height: this.config.height, margin: this.config.margin }) {

    if (data && data.m.length > 0) {
      d3.selectAll('#dataGroup').remove();

      const dataGroup = this.svgObject.append('g')
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
                  .attr('stroke-width', 1.4)
                  .attr('d', line(m.d))
                    .append('svg:title')
                      .text(() => m.mcu.name + '-' + m.id + ' ' + input.name);

                if (this.config.zoomable) {

                  dataGroup.selectAll('circle.m-' + m.id + '-' + m.mcu.id + '-' + input.name)
                    .data(m.d)
                    .enter()
                    .append('circle')
                    .attr('r', 1.5)
                    .attr('cx', (d: { time: number; }) => isNaN(this.config.scaleX(d.time)) ? d.time : this.config.scaleX(d.time))
                    .attr('cy', (d: { inputs: { value: any; name: string }[]; }) => {
                                    const inputItem = d.inputs.filter(n => n.name === input.name)[0];
                                    return isNaN(this.config.scaleY(inputItem.value)) ? 0 : this.config.scaleY(inputItem.value)})
                    .attr('class', 'm-' + m.id + '-' + m.mcu.id + '-' + input.name)
                    .attr('fill', '#4a4a4a')
                    .attr('stroke', m.colors[i].hash)
                    .attr('stroke-width', 1)
                      .append('svg:title')
                        .text((d: any) => {
                          const inputItem = d.inputs.filter(n => n.name === input.name)[0];
                          return 'x ' + d.time + ' y ' + inputItem.value
                        });

                    }
              }
            }
            i++;
          }
        }
      }

      if (trimLines) {
        this.drawTrimLines(true, trimLines, size);
      }
    }
  }


  removeTrimlines() {
    d3.selectAll('#dataTrimLines').remove();
  }


  drawTrimLines(visible: boolean, lines: any, size = { width: this.config.width, height: this.config.height, margin: this.config.margin }) {

    d3.selectAll('#dataTrimLines').remove();

    if (visible) {

      const trimLinesGroup = this.svgObject.append('g')
        .attr('id', 'dataTrimLines')
        .attr('clip-path', 'url(#clipPathGraph)')
        .attr('transform', 'translate(0,'+ size.margin +')');

      const dragLine = d3
          .drag()
          .on('drag', (event: any, d: { id: number; value: number }) => {

            if (event.x > size.margin && event.x < size.width - size.margin) {

              d.value = this.config.scaleX.invert(event.x);

              this.updateTrimSize.next(true);

              d3.select('#trimLine_' + d.id).attr('x', event.x);
              // d3.select('#trimLine_' + d.id).attr('x', event.x);
              if (lines[0].id === d.id) {
                d3.select('#trimLineRect_' + d.id).attr('width', event.x);
              } else {
                d3.select('#trimLineRect_' + d.id).attr('x', event.x).attr('width', size.width - event.x);
              }
            }
          });


      trimLinesGroup.selectAll('rect.trim')
          .data(lines)
          .enter()
          .append('rect')
          .attr('id', (d: { id: number }) => 'trimLineRect_' + d.id)
          .attr('x', (d: any, i: number) => i === 0 ? 0 : this.config.scaleX(d.value))
          .attr('y', 0)
          .attr('width', (d: { value: number; }, i: number) => i === 0 ? Math.abs(this.config.scaleX(d.value)) : Math.abs(size.width - this.config.scaleX(d.value)))
          .attr('height', size.height - (2 * size.margin))
          .style('shape-rendering', 'crispEdges')
          .style('fill', 'rgba(0,0,0,0.3)');

      trimLinesGroup.selectAll('rect.trim')
        .data(lines)
        .enter()
        .append('rect')
        .attr('id', (d: { id: number }) => 'trimLine_' + d.id)
        .attr('x', (d: { value: number; }) => this.config.scaleX(d.value) - 0.5)
        .attr('y', 0)
        .attr('width', 1)
        .attr('height', size.height - (2 * size.margin))
        .style('shape-rendering', 'crispEdges')
        .style('fill', '#df9b08')
        .style('stroke', 'transparent')
        .style('stroke-width', 4)
        .attr('cursor', 'e-resize')
        .call(dragLine);

    }
  }
}
