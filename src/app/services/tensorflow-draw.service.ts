import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { Subject } from 'rxjs/internal/Subject';
import { TensorFlowConfig } from '../models/tensorflow-config.model';
import { DataSet, Bounds, MinMax, TrimSection, TrainingSet } from '../models/tensorflow.model';
import { v4 as uuid } from 'uuid';


@Injectable()
export class TensorFlowDrawService {

  public config: TensorFlowConfig;

  redrawGraphData: Subject<any> = new Subject<void>();
  // updateTrimSize: Subject<any> = new Subject<void>();
  updateBoundsGraph: Subject<any> = new Subject<void>();
  addOrRemoveSection: Subject<any> = new Subject<void>();

  constructor() {
    this.config = new TensorFlowConfig();
  }


  drawGraph(id='svg_graph_data', bounds: Bounds, size = { width: this.config.width, height: this.config.height, margin: this.config.margin }) {

    this.config.zoomable = id === 'svg_graph_training_A' || id === 'svg_graph_training_B' ? false : true;
    const index = id === 'svg_graph_training_B' ? 1 : 0;

    d3.selectAll('#svg_' + id).remove();

    const svg = d3.select('#' + id)
        .append('svg')
        .attr('id', 'svg_' + id)
        .attr('width', size.width)
        .attr('height', size.height);
          // .attr("viewBox", [0, 0, this.config.width, this.config.height]);

    svg.append('clipPath')
      .attr('id', 'clipPathGraph')
      .append('svg:rect')
      .attr('width', size.width - (2 * size.margin))
      .attr('height', size.height - size.margin)
      .attr('transform', 'translate(' + size.margin + ',0)');

    svg.append('rect')
      .attr('id', 'border')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', size.width - (2 * size.margin))
      .attr('height', size.height - (2 * size.margin))
      .attr('transform', 'translate(' + size.margin + ',' + size.margin + ')')
      .style('stroke', '#999')
      .style('stroke-width', 0.5)
      .style('fill', 'transparent');

    this.setScale(svg, bounds, index, size);
    this.drawTicks(svg, index, size);
  }



  enableZoom(enable: boolean) {
    this.config.zoomable = enable;
  }



  setScale(svg: any, bounds = new Bounds(), index = 0, size = { width: this.config.width, height: this.config.height, margin: this.config.margin }) {

    this.config.scaleY[index] = d3.scaleLinear()
      .domain([bounds.yMax, bounds.yMin])
      .range([size.margin, size.height - size.margin]);

    this.config.baseScaleX = d3.scaleLinear()
      .domain([bounds.xMin, bounds.xMax])
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

      svg.call(this.config.zoom);
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
        if (this.config.zoomable && !this.config.recording.active) {
          this.config.transform = event.transform;
          this.scaleContent(this.config.transform, size);
        }
      });
  }


  scaleContent(transform: any, size = { width: this.config.width, height: this.config.height, margin: this.config.margin }) {

    this.config.scaleX = transform.rescaleX(this.config.baseScaleX);
    const rescale = this.config.xAxisBottom.scale(this.config.scaleX);
    d3.select('#svg_svg_graph_data').selectAll('.axisBottom').call(rescale);

    d3.select('#svg_svg_graph_data').selectAll('.axisBottom text')
        .attr('y', size.height - (2 * size.margin) + 10)
        .attr('x', 0);

    this.redrawGraphData.next(true);
  }

  updateBounds(bounds: Bounds, id: string, size: any = null) {
    // this.config.bounds.xMin = bounds.xMin;
    // this.config.bounds.xMax = bounds.xMax;
    // this.config.bounds.yMin = bounds.yMin;
    // this.config.bounds.yMax = bounds.yMax;

    // this.updateBoundsGraph.next(bounds);

    this.config.transform = null;

    size ? this.setScale(d3.select('#svg_' + id), bounds, (id === 'svg_graph_training_B' ? 1 : 0), size) : this.setScale(d3.select('#svg_' + id), bounds, (id === 'svg_graph_training_B' ? 1 : 0));
  }

  updateScale(scale: number) {
    this.config.transform = d3.zoomIdentity.translate(0, 0).scale(scale);
    this.config.scaleX = this.config.transform.rescaleX(this.config.baseScaleX);

    d3.select('#svg_svg_graph_data').call(this.config.zoom.transform, this.config.transform);
  }


  drawTicks(svg: any, index = 0, size = { width: this.config.width, height: this.config.height, margin: this.config.margin }) {
    this.config.yAxis = svg.append('g');

    const yAxis = d3
        .axisLeft(this.config.scaleY[index])
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


  drawTensorflowTrainingProgress(logs: Array<any>) {

    if (logs) {

      d3.selectAll('#dataGroup-0, #dataGroup-1').remove();

      const dataGroup1 = d3.select('#svg_svg_graph_training_A').append('g')
        .attr('id', 'dataGroup-0')
        .attr('clip-path', 'url(#clipPathGraph)');

      const dataGroup2 = d3.select('#svg_svg_graph_training_B').append('g')
        .attr('id', 'dataGroup-1')
        .attr('clip-path', 'url(#clipPathGraph)');

      this.drawTrainingData(dataGroup1, logs, 0);
      this.drawTrainingData(dataGroup2, logs, 1);
    }
  }


  redrawGraph(file: TrainingSet, size: any) {
    const bounds_loss = file ? file.bounds_loss : new Bounds(0, 100, 0, 1);
    const bounds_metric = file ? file.bounds_metric : new Bounds(0, 100, 0, 1);

    this.updateBounds(bounds_loss, 'svg_graph_training_A', size);
    this.updateBounds(bounds_metric, 'svg_graph_training_B', size);
    this.drawGraph('svg_graph_training_A', bounds_loss, size);
    this.drawGraph('svg_graph_training_B', bounds_metric, size);

    if (file) {
      this.drawTensorflowTrainingProgress(file.data);
    }
  }

  // drawData(logs: TrainingSet) {
    // if (logs && logs.data && logs.data.length > 0 ) {
      // this.training = this.d.selectedModel.training.epochs - 1 == logs.data[logs.data.length - 1].epoch ? false : true;
      // this.drawTensorflowTrainingProgress(logs.data);
    // }
  // }



  drawTrainingData(dataGroup: any, logs: Array<any>, index: number) {

    const training = d3.line()
      .x((d: { epoch: number; }) => this.config.scaleX(d.epoch))
      .y((d: { log: any; }) => { return index === 0 ? (isNaN(this.config.scaleY[index](d.log.loss)) ? 0 : this.config.scaleY[index](d.log.loss)) :
                                                      (isNaN(this.config.scaleY[index](d.log.metric)) ? 0 : this.config.scaleY[index](d.log.metric)); });

    if (training) {
      dataGroup.append('path')
        .attr('fill', 'none')
        .attr('stroke', '#7065EB')
        .attr('stroke-width', 1.5)
        .attr('d', training(logs))
          .append('svg:title')
            .text(() => 'results training data');
    }

    if (logs.length > 0 && logs[0].log.val_loss !== undefined && logs[0].log.val_loss !== null) {

      const validation = d3.line()
        .x((d: { epoch: number; }) => this.config.scaleX(d.epoch))
        .y((d: { log: any }) => { return index === 0 ? (isNaN(this.config.scaleY[index](d.log.val_loss)) ? 0 : this.config.scaleY[index](d.log.val_loss)) :
                                                  (isNaN(this.config.scaleY[index](d.log.val_metric)) ? 0 : this.config.scaleY[index](d.log.val_metric)); })

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
  }




  drawTensorFlowGraphData(data: DataSet, trimLines: any, id: string, size = { width: this.config.width, height: this.config.height, margin: this.config.margin }, running = false) {

    if (data && data.m.length > 0) {
      d3.selectAll('#dataGroup-' + id).remove();

      const dataGroup = d3.select('#svg_' + id).append('g')
        .attr('id', 'dataGroup-' + id)
        .attr('clip-path', 'url(#clipPathGraph)');


      for (const m of data.m) {
        let i = 0;
        if (m.record && m.visible && m.d && m.d.length > 0) {
          for (const input of m.d[0].inputs) {

            const colorData = m.colors.filter(c => c.input_name == input.name)[0];

            if (colorData && colorData.visible) {

              const line = d3.line()
                .x((d: { time: number; }) => isNaN(this.config.scaleX(d.time)) ? d.time : this.config.scaleX(d.time))
                .y((d: { inputs: { value: any; name: string }[]; }) => {
                  const inputItem = d.inputs.filter(n => n.name === input.name)[0];
                  return isNaN(this.config.scaleY[0](inputItem.value)) ? 0 : this.config.scaleY[0](inputItem.value);
                });


              if (line) {
                dataGroup.append('path')
                  // .datum(m.d)
                  .attr('fill', 'none')
                  .attr('stroke', colorData.hash)
                  .attr('stroke-width', 1.4)
                  .attr('d', line(m.d))
                    .append('svg:title')
                      .text(() => m.mcu.name + '-' + m.id + ' ' + input.name);

                if (!running) {

                  dataGroup.selectAll('circle.m-' + m.id + '-' + m.mcu.id + '-' + input.name)
                    .data(m.d)
                    .enter()
                    .append('circle')
                    .attr('r', 1.5)
                    .attr('cx', (d: { time: number; }) => isNaN(this.config.scaleX(d.time)) ? d.time : this.config.scaleX(d.time))
                    .attr('cy', (d: { inputs: { value: any; name: string }[]; }) => {
                                    const inputItem = d.inputs.filter(n => n.name === input.name)[0];
                                    return isNaN(this.config.scaleY[0](inputItem.value)) ? 0 : this.config.scaleY[0](inputItem.value)})
                    .attr('class', 'm-' + m.id + '-' + m.mcu.id + '-' + input.name)
                    .attr('fill', '#4a4a4a')
                    .attr('stroke', colorData.hash)
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


      const trimLinesGroup =  d3.select('#svg_svg_graph_data').append('g')
        .attr('id', 'dataTrimLines')
        // .attr('clip-path', 'url(#clipPathGraph)')
        .attr('transform', 'translate(0,'+ size.margin +')');


      const dragLineLeft = d3
        .drag()
        .on('drag', (event: any, d: { id: number, values: MinMax, width: number }) => {

          const index = lines.indexOf(d);
          const prevItemMax = index > 0 ? this.config.scaleX(lines[index - 1].values.max) : this.config.scaleX(0);

          if (event.x > prevItemMax && event.x < this.config.scaleX(d.values.max)) {

            // const prevItemWidth = index > 0 ? this.config.scaleX(lines[index - 1].width) : this.config.scaleX(d.values.min);

            d.values.min = this.config.scaleX.invert(event.x);
            d.width = d.values.max - d.values.min;

            this.drawTrimLines(visible, lines, size);
            // d.width = d.values.max - d.values.min;

            // // this.updateTrimSize.next(true);

            // d3.select('#trimLeft_' + d.id).attr('x', event.x);
            // d3.select('#trimblock-' + index).attr('width', event.x - prevItemMax);

            // d3.select('#circle_add-' + index).attr('cx', index > 0 ? event.x - (prevItemWidth / 2) : this.config.scaleX(d.values.min / 2));
            // d3.select('#circle_delete-' + index).attr('cx', this.config.scaleX(d.values.min + (d.width / 2)));
          }
        });

      const dragLineRight = d3
        .drag()
        .on('drag', (event: any, d: { id: number, values: MinMax, width: number }) => {

          const index = lines.indexOf(d);
          const nextItemMax = index < lines.length - 1 ? this.config.scaleX(lines[index + 1].values.min) : size.width - size.margin;
          // const nextItemWidth = index < lines.length - 1 ? this.config.scaleX(lines[index + 1].width) : size.width - size.margin - d.values.max;

          if (event.x > this.config.scaleX(d.values.min) && event.x < nextItemMax) {

            d.values.max = this.config.scaleX.invert(event.x);
            d.width = d.values.max - d.values.min;

            this.drawTrimLines(visible, lines, size);
            // this.updateTrimSize.next(true);

            // d3.select('#trimRight_' + d.id).attr('x', event.x);

            // d3.select('#trimblock-' + (index + 1)).attr('x', event.x);
            // d3.select('#trimblock-' + (index + 1)).attr('width', nextItemMax - event.x);

            // d3.select('#circle_add-' + (index + 1)).attr('cx', event.x + (nextItemWidth / 2)); // next button
            // d3.select('#circle_delete-' + index).attr('cx', this.config.scaleX(d.values.max - (d.width / 2)));

          }
        });


      trimLinesGroup.selectAll('rect.trimblock')
          .data(lines)
          .enter()
          .append('rect')
          .attr('class', 'trimblock')
          .attr('id', (d: {}, i: number) => 'trimblock-' + i)
          .attr('x', (d: {}, i: number) => i > 0 ? this.config.scaleX(lines[i - 1].values.max) : this.config.scaleX(0))
          .attr('y', 0)
          .attr('width', (d: any, i: number) => this.config.scaleX(d.values.min) - this.config.scaleX((i > 0 ? lines[i - 1].values.max : 0)))
          .attr('height', size.height - (2 * size.margin))
          .style('fill', 'rgba(0,0,0,0.3)');

      const lastBlockEnd = lines.length > 0 ? this.config.scaleX(lines[lines.length - 1].values.max) : 0;

      trimLinesGroup.append('rect')
          .attr('id', 'trimblock-' + lines.length)
          .attr('x', lastBlockEnd)
          .attr('y', 0)
          .attr('width', size.width - size.margin - lastBlockEnd)
          .attr('height', size.height - (2 * size.margin))
          .style('fill', 'rgba(0,0,0,0.3)');


      if (lines.length > 1) {
        this.drawCircleButton(trimLinesGroup, lines, 'delete', size);
      }

      const lastBlockPosition = this.config.scaleX.invert(size.width - size.margin);
      const extraButtonList = [ new TrimSection(uuid(), { min: lastBlockPosition, max: lastBlockPosition + 1 }) ];

      this.drawCircleButton(trimLinesGroup, lines.concat(extraButtonList), 'add', size);

      this.addTrimLine(trimLinesGroup, lines, 'trimLeft', size, dragLineLeft);
      this.addTrimLine(trimLinesGroup, lines, 'trimRight', size, dragLineRight);
    }
  }


  addTrimLine(svg: any, data: Array<any>, name: string, size: any, call: Function) {

    svg.selectAll('line.' + name)
        .data(data)
        .enter()
        .append('rect')
        .attr('class', (d, i) => name)
        .attr('id', (d: { id: number }) => name + '_' + d.id)
        .attr('x', (d: { values: MinMax; }) => this.config.scaleX((name === 'trimLeft' ? d.values.min : d.values.max) - 0.5))
        .attr('y', 0)
        .attr('width', 1)
        .attr('height', size.height - (2 * size.margin))
        .style('shape-rendering', 'crispEdges')
        .style('fill', '#df9b08')
        .style('stroke', 'transparent')
        .style('stroke-width', 4)
        .attr('cursor', 'e-resize')
        .call(call);
  }




  drawCircleButton(svg: any, data: Array<any>, name: string, size: any) {

    svg.selectAll('circle.' + name + 'Section')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', name + 'Section')
      .attr('id', (d: { id: string }, i: number) => 'circle_' + name + '-' + i)
      .attr('cx', (d:any, i: number) => {
        if (name === 'add') {
          if (i === 0) {
            return this.config.scaleX(d.values.min / 2);
          } else {
            return this.config.scaleX(d.values.min) - ((this.config.scaleX(d.values.min) - (this.config.scaleX(data[i - 1].values.max))) / 2);
          }
        } else {
          return this.config.scaleX(d.values.min + (d.width / 2));
        }
      })
      .attr('cy', size.margin / 2)
      .attr('r', 7)
      .style('stroke', '#1c1c1c')
      .style('stroke-width', 0.5)
      .style('fill', (d, i) => name === 'add' && ((i === 0 && d.values.min < 40) ||(i > 0 && d.values.min - data[i - 1].values.max < 40)) ? 'transparent' : '#df9b08')
      .on('mousedown', (event: any, d: any) => {
        this.addOrRemoveSection.next({ add: (name === 'add' ? true : false), id: d.id, index: data.indexOf(d) });
      })
      .append('svg:title')
        	.text((d, i) => name + '-' + i);


      svg.selectAll('text.' + name + 'Section')
        .data(data)
        .enter()
        .append('text')
        .attr('x', (d:any, i: number) => {
          if (name === 'add') {
            if (i === 0) {
              return this.config.scaleX(d.values.min / 2);
            } else {
              return this.config.scaleX(d.values.min) - ((this.config.scaleX(d.values.min) - this.config.scaleX(data[i - 1].values.max)) / 2);
            }
          } else {
            return this.config.scaleX(d.values.min + (d.width / 2));
          }
        })
        .attr('y', name === 'add' ? size.margin / 2 + 7 : size.margin / 2 + 6)
        .attr('text-anchor', 'middle')
        .text(name === 'add' ? '+' : '-')
        .style('fill', (d, i) => name === 'add' && ((i === 0 && d.values.min < 40) ||( i > 0 && d.values.min - data[i - 1].values.max < 40)) ? 'transparent' : '#1c1c1c')
        .style('font-family', 'Open Sans, Arial, sans-serif')
        .style('font-size', 20)
        .style('font-weight', 800)
        .attr('pointer-events', 'none');
  }
}


