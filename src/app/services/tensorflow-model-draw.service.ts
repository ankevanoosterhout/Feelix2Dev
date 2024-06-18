import { DOCUMENT } from '@angular/common';
import { Injectable, Inject } from '@angular/core';
import * as d3 from 'd3';
import { Subject } from 'rxjs/internal/Subject';
import { Layer, LayerType, Model, ModelType, ModelVariable } from '../models/tensorflow.model';
import { TensorFlowData } from '../models/tensorflow-data.model';
import { any } from '@tensorflow/tfjs';

@Injectable()
export class TensorFlowModelDrawService {

  public d: TensorFlowData;

  modelSVG: any;
  height = (window.innerHeight - 70) * 0.6;
  margin = 30;
  smallColumnWidth = 40;


  constructor(@Inject(DOCUMENT) private document: Document) {}



  drawModel(model: Model) {

    d3.select('#neuralnetworkSVG').remove();

    this.height = window.innerHeight * 0.5 - 20;

    this.modelSVG = d3.select('#neuralnetwork')
        .append('svg')
          .attr('id', 'neuralnetworkSVG')
          .attr('width', window.innerWidth)
          .attr('height', this.height);

    let i = 0;
    const columnWidth = ((window.innerWidth - (model.layers.filter(l => l.hidden).length * this.smallColumnWidth)) / model.layers.filter(l => !l.hidden).length);
    const maxUnits = this.getMaxNrOfUnits(model.layers);
    let distance = (this.height - (this.margin * 2)) / maxUnits;

    if (distance > 70) { distance = 70; }

    let layerOffset = 0;

    for (const layer of model.layers) {
      const coords = [];
      const lines = [];
      const xUnits = layer.options.units ? layer.options.units.value : layer.options.kernelSize ? layer.options.kernelSize.value.x : layer.options.poolSize ? layer.options.poolSize.value.x : 1;
      const last = i < model.layers.length - 1 ? false : true;
      const duplicates = layer.options.kernelSize && layer.type.args.dimensions > 1 ? layer.options.kernelSize.value.y : layer.options.actuators ? layer.options.actuators.value :
                         layer.options.poolSize && layer.type.args.dimensions > 1 ? layer.options.poolSize.value.y : 1;


      const xPos = layer.hidden ? layerOffset + 15 : layerOffset + (columnWidth / 2);

      for (let j = 0; j < xUnits; j++) {

        const layerMargin = (this.height - (this.margin * 2) - (distance * (xUnits - 1))) / 2;

        for (let n = duplicates - 1; n >= 0; n--) {

          const coordObject = { x: xPos - (n * 4),
                                y: distance * j + layerMargin + this.margin,
                                unit: 'unit-' + j + '-' + 'layer-' + i + '-' + n,
                                index: n
                              };

          coords.push(coordObject);
        }


        if (!last) {
          const nextUnits = model.layers[i + 1].options.units ? model.layers[i + 1].options.units.value :
                            model.layers[i + 1].options.kernelSize ? model.layers[i + 1].options.kernelSize.value.x :
                            model.layers[i + 1].options.poolSize ? model.layers[i + 1].options.poolSize.value.x : 1;

          const nextLayerMargin = (this.height - (this.margin * 2) - (distance * (nextUnits - 1))) / 2;
          const nextLayerOffset = model.layers[i + 1].hidden ? (this.smallColumnWidth / 2) : (columnWidth / 2);

          if (model.layers[i + 1].type && model.layers[i + 1].type.subgroup === 'normalization') {
            const lineObject = {
              x1: xPos,
              y1: distance * j + layerMargin + this.margin,
              x2: xPos + nextLayerOffset + (layer.hidden ? (this.smallColumnWidth / 2) : (columnWidth / 2)),
              y2: distance * j + layerMargin + this.margin
            }

            lines.push(lineObject);
          } else {
            for (let n = 0; n < nextUnits; n++) {
              const lineObject = {
                x1: xPos,
                y1: distance * j + layerMargin + this.margin,
                x2: xPos + nextLayerOffset + (layer.hidden ? (this.smallColumnWidth / 2) : (columnWidth / 2)),
                y2: distance * n + nextLayerMargin + this.margin
              }

              lines.push(lineObject);
            }
          }
        }
      }

      this.drawLayer(layer, coords, lines, i, layer.hidden ? this.smallColumnWidth : columnWidth, layerOffset, distance, model.inputs);

      layerOffset += (layer.hidden ? this.smallColumnWidth : columnWidth);

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


  drawLayer(layer: Layer, coords: Array<any>, lines: Array<any>, layerIndex: number, width: number, xpos: number, distance: number, inputs: Array<ModelVariable>) {

    this.modelSVG.append('rect')
      .attr('x', xpos)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', this.height)
      .style('fill', layerIndex % 2 === 0 ? 'rgba(133,133,133,0.05)' : 'transparent');


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


    if (!layer.hidden && layer.options.useBias && layer.options.useBias.value === true) {

      this.modelSVG.selectAll('line.layerBias_' + layerIndex)
        .data(coords.filter(c => c.index === 0))
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
        .data(coords.filter(c => c.index === 0))
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


      if (distance/12 > 4.5) {
        this.modelSVG.selectAll('text.layerBias_-' + layerIndex)
          .data(coords.filter(c => c.index === 0))
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

    if (layer.type && layer.type.subgroup === 'recurrent') {
      this.modelSVG.selectAll('circle#recurrentLayer_' + layerIndex)
        .data(coords.filter(c => c.index === 0))
        .enter()
        .append('circle')
        .attr('id', (d: { x: number, y: number, unit: string }) => 'recurrentLayer_' + layerIndex)
        .attr('class', 'recurrentLayer_' + layerIndex)
        .attr('r', layer.hidden ? distance/10 : distance/5)
        .attr('cx', (d: { x: number }) => layer.hidden ? d.x + (distance/10) : d.x + (distance/5))
        .attr('cy', (d: { y: number }) => layer.hidden ? d.y - distance/7 : d.y - distance/3.5)
        .style('stroke', '#666')
        .style('stroke-width', 1)
        .style('fill', 'transparent');

        for (let arrowLine = 0; arrowLine < 2; arrowLine++) {
          const xOffset = arrowLine === 0 ? (distance/16) * -1 : (distance/16);
          this.modelSVG.selectAll('line.recurrentArrow_' + layerIndex + '_' + arrowLine)
            .data(coords.filter(c => c.index === 0))
            .enter()
            .append('line')
            // .attr('id', (d: { x: number, y: number, unit: string }) => d.unit)
            .attr('class', 'recurrentArrow_' + layerIndex + '_' + arrowLine)
            .attr('x1', (d: { x: number }) => layer.hidden ? d.x + (distance/16) + xOffset : d.x + xOffset)
            .attr('x2', (d: { x: number }) => layer.hidden ? d.x + (distance/16) : d.x)
            .attr('y2', (d: { y: number }) => d.y - (layer.hidden ? distance/8 : distance/4) - 1)
            .attr('y1', (d: { y: number }) => d.y - (layer.hidden ? distance/8 : distance/4) - (distance/16) - 1)
            .style('stroke', '#666')
            .style('stroke-width', 1)
            .style('shapeRendering', 'geometricPrecision')
        }
    }


    this.modelSVG.selectAll('circle#layer_' + layerIndex)
      .data(coords)
      .enter()
      .append('circle')
      .attr('id', (d: { x: number, y: number, unit: string }) => 'layer_' + layerIndex)
      .attr('class', 'layer_' + layerIndex)
      .attr('r', layer.hidden ? distance/8 : distance/4)
      .attr('cx', (d: { x: number }) => layer.hidden ? d.x + (distance/16) : d.x)
      .attr('cy', (d: { y: number }) => d.y)
      .style('stroke', '#000')
      .style('stroke-width', 1)
      .style('fill', '#ccc');

    if (layerIndex === 0) {
      this.modelSVG.selectAll('text.layer_' + layerIndex)
        .data(coords.filter(c => c.index === 0))
        .enter()
        .append('text')
        .attr('x', (d: { x: number }) => d.x)
        .attr('y', (d: { y: number }) => d.y + Math.round(distance/8))
        .text((d, i) => inputs.filter(input => input.active)[i].slug)
        .style('text-anchor', 'middle')
        .style('font-family', 'Open Sans, Arial, sans-serif')
        .style('font-weight', 600)
        .style('font-size', Math.round(distance/3) + 'px');
    }


    if (layerIndex > 0 && !layer.hidden && ((layer.options.activation && layer.options.activation.value) || (layer.type && layer.type.subgroup === 'normalization'))) {
      const icon = layer.options.activation ? layer.options.activation.value : layer.type.subgroup;
      const imageWidth = distance / 2;
      this.modelSVG.selectAll('img.layer_' + layerIndex).data([0])
        .data(coords.filter(c => c.index === 0))
        .enter()
        .append('svg:image')
        .attr('xlink:xlink:href', './assets/icons/functions/' + icon + '.svg')
        .attr('width', imageWidth)
        .attr('height', imageWidth * 0.76142)
        .attr('x', (d: { x: number }) => d.x - (imageWidth/2))
        .attr('y', (d: { y: number }) => d.y - ((imageWidth * 0.76142)/2));
    }
  }



}

