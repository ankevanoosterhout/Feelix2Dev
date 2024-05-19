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
  height = (window.innerHeight - 41) * 0.6;
  margin = 30;


  constructor(@Inject(DOCUMENT) private document: Document) {}



  drawModel(model: Model) {

    console.log(model);

    d3.select('#neuralnetworkSVG').remove();

    this.height = window.innerHeight * 0.5 - 20;

    this.modelSVG = d3.select('#neuralnetwork')
        .append('svg')
          .attr('id', 'neuralnetworkSVG')
          .attr('width', window.innerWidth)
          .attr('height', this.height);

    let i = 0;
    const columnWidth = (window.innerWidth / model.layers.length);
    const maxUnits = this.getMaxNrOfUnits(model.layers);
    const distance = (this.height - (this.margin * 2)) / maxUnits;




    for (const layer of model.layers) {
      const coords = [];
      const lines = [];
      const xUnits = layer.options.units ? layer.options.units.value : layer.options.kernelSize ? layer.options.kernelSize.value.x : 1;
      const last = i < model.layers.length - 1 ? false : true;
      const xPos = ((window.innerWidth / model.layers.length) / 2) + (columnWidth * i);

      for (let j = 0; j < xUnits; j++) {

        const layerMargin = (this.height - (this.margin * 2) - (distance * (xUnits - 1))) / 2;
        const coordObject = { x: xPos,
                              y: distance * j + layerMargin + this.margin,
                              unit: 'unit-' + j + '-' + 'layer-' + i };

        coords.push(coordObject);


        if (!last) {
          const nextUnits = model.layers[i + 1].options.units ? model.layers[i + 1].options.units.value : model.layers[i + 1].options.kernelSize ? model.layers[i + 1].options.kernelSize.value.x : 1;
          const nextLayerMargin = (this.height - (this.margin * 2) - (distance * (nextUnits - 1))) / 2;

          for (let n = 0; n < nextUnits; n++) {
            const lineObject = {
              x1: xPos,
              y1: distance * j + layerMargin + this.margin,
              x2: xPos + columnWidth,
              y2: distance * n + nextLayerMargin + this.margin,
            }

            lines.push(lineObject);
          }
        }
      }
      this.drawLayer(layer, coords, lines, i, columnWidth, distance);
      i++;
    }
  }


  getMaxNrOfUnits(layers: Array<Layer>) {
    let max: number = layers[0].options.units ? layers[0].options.units.value :
                      layers[0].options.kernelSize ? layers[0].options.kernelSize.value.x : 1;
    for (let layer of layers) {
      if (layer.options.units && layer.options.units.value > max) {
        max = layer.options.units.value;
      } else if (layer.options.kernelSize && layer.options.kernelSize.value.x > max) {
        max = layer.options.kernelSize.value.x;
      }
    }
    return max < 12 ? max : 12;
  }


  drawLayer(layer: Layer, coords: Array<any>, lines: Array<any>, layerIndex: number, width: number, distance: number) {

    this.modelSVG.append('rect')
      .attr('x', width * layerIndex)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', this.height)
      .style('fill', layerIndex%2 === 0 ? 'rgba(255,255,255,0.1' : 'transparent');


    this.modelSVG.selectAll('line.layer_' + layerIndex)
      .data(lines)
      .enter()
      .append('line')
      // .attr('id', (d: { x: number, y: number, unit: string }) => d.unit)
      .attr('class', 'layer_' + layerIndex)
      .attr('x1', (d: { x1: number }) => d.x1)
      .attr('x2', (d: { x2: number }) => d.x2)
      .attr('y1', (d: { y1: number }) => d.y1)
      .attr('y2', (d: { y2: number }) => d.y2)
      .style('stroke', '#666')
      .style('stroke-width', 1)
      .style('shapeRendering', 'geometricPrecision');


    if (layer.options.useBias && layer.options.useBias.value === true) {

      this.modelSVG.selectAll('line.layerBias_' + layerIndex)
        .data(coords)
        .enter()
        .append('line')
        // .attr('id', (d: { x: number, y: number, unit: string }) => d.unit)
        .attr('class', 'layer_' + layerIndex)
        .attr('x1', (d: { x: number }) => d.x)
        .attr('x2', (d: { x: number }) => d.x)
        .attr('y1', (d: { y: number }) => d.y)
        .attr('y2', (d: { y: number }) => d.y - distance/2.5)
        .style('stroke', '#666')
        .style('stroke-width', 1)
        .style('shapeRendering', 'geometricPrecision');

      this.modelSVG.selectAll('circle.layerBias_' + layerIndex)
        .data(coords)
        .enter()
        .append('circle')
        .attr('id', (d: { x: number, y: number, unit: string }) => d.unit)
        .attr('class', 'layerBias_' + layerIndex)
        .attr('r', distance/12)
        .attr('cx', (d: { x: number }) => d.x)
        .attr('cy', (d: { y: number }) => d.y - distance/2.2)
        .style('stroke', '#000')
        .style('stroke-width', 1)
        .style('fill', '#ccc');


      if ( distance/12 > 4.5) {
        this.modelSVG.selectAll('text.layerBias_-' + layerIndex)
          .data(coords)
          .enter()
          .append('text')
          .attr('class', 'layerBias_-' + layerIndex)
          .attr('x', (d: { x: number }) => d.x)
          .attr('y', (d: { y: number }) => d.y - (distance/2.2) + (distance/23))
          .attr('text-anchor', 'middle')
          .text('b')
          .style('fill', '#000')
          .attr('cursor', 'default')
          .style('font-family', 'Open Sans, Arial, sans-serif')
          .style('font-size', Math.round(distance/8) + 'px')
          .style('font-weight', 600);
      }
    }

    this.modelSVG.selectAll('circle.layer_' + layerIndex)
      .data(coords)
      .enter()
      .append('circle')
      .attr('id', (d: { x: number, y: number, unit: string }) => d.unit)
      .attr('class', 'layer_' + layerIndex)
      .attr('r', distance/4)
      .attr('cx', (d: { x: number }) => d.x)
      .attr('cy', (d: { y: number }) => d.y)
      .style('stroke', '#000')
      .style('stroke-width', 1)
      .style('fill', '#ccc');

    if (layer.options.activation && layer.options.activation.value) {
      const imageWidth = distance / 2;
      this.modelSVG.selectAll('img.layer_' + layerIndex).data([0])
        .data(coords)
        .enter()
        .append('svg:image')
        .attr('xlink:xlink:href', './assets/icons/functions/' + layer.options.activation.value + '.svg')
        .attr('width', imageWidth)
        .attr('height', imageWidth * 0.76142)
        .attr('x', (d: { x: number }) => d.x - (imageWidth/2))
        .attr('y', (d: { y: number }) => d.y - ((imageWidth * 0.76142)/2));
    }
  }
}





