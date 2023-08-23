import { DOCUMENT } from '@angular/common';
import { Injectable, Inject } from '@angular/core';
import { DrawingPlaneConfig } from '../models/drawing-plane-config.model';
import * as d3 from 'd3';
import { DrawingService } from './drawing.service';
import { NodeService } from './node.service';
import { MidiDataService } from './midi-data.service';
import { DataService } from './data.service';
import { Range } from '../models/effect.model';


@Injectable()
export class DrawAudioService {



  config: DrawingPlaneConfig;

  //type 2 edgekey white (1.5x), type 1 black key (1x), type 0 normal key white (2x);
  notes = [ { name: 'a', type: 2 },
            { name: 'b', type: 1 },
            { name: 'c', type: 0 },
            { name: 'd', type: 1 },
            { name: 'e', type: 0 },
            { name: 'f', type: 1 },
            { name: 'g', type: 2 },
            { name: 'h', type: 2 },
            { name: 'i', type: 1 },
            { name: 'j', type: 0 },
            { name: 'k', type: 1 },
            { name: 'l', type: 2 } ];
  notesC9 = [ { name: 'a', type: 2 },
              { name: 'b', type: 1 },
              { name: 'c', type: 2 },
              { name: 'd', type: 2 },
              { name: 'e', type: 1 },
              { name: 'f', type: 0 },
              { name: 'g', type: 1 },
              { name: 'h', type: 2 }];
  chords = ['C9','C8','C7','C6','C5','C4','C3','C2','C1','C0','C-1'];

  keyHeight = 16;
  keyHeightEdge = 12;
  smallKeyHeight = 8;
  keyWidth = 80;
  smallKeyWidth = 50;

  chordsGroup: any;

  constructor(private nodeService: NodeService, private drawingService: DrawingService, private midiDataService: MidiDataService, private dataService: DataService) {
    this.config = this.drawingService.config;
  }



  drawKeys() {

    this.config.svg.selectAll('#clipPathAudio, #chords, #gridChords').remove();

    let i = 0;
    this.keyHeight = Math.abs(this.nodeService.scale.scaleY(0) - this.nodeService.scale.scaleY(2));
    this.smallKeyHeight = this.keyHeight * 0.5;
    this.keyHeightEdge = this.keyHeight * 0.75;

    const clipPath = this.config.svg.append('clipPath')
      .attr('id', 'clipPathAudio')
      .append('svg:rect')
      .attr('class', 'clipPath')
      .attr('width', this.config.chartDx)
      .attr('height', this.config.svgDy - this.config.margin.bottom - this.config.margin.top);

    this.chordsGroup = this.config.svg.append('g')
      .attr('id', 'chords')
      .attr('class', 'chord')
      .attr('clip-path', 'url(#clipPathAudio)')
      .attr('transform', 'translate(0, ' + (this.config.margin.top) + ')');


    for (const chord of this.chords) {
      this.drawChord(i, chord, i === 0 ? this.notesC9 : this.notes);
      i++;
    }
  }


  getKeyMarginTop(i: number, data: Array<any>) {
    let marginTop = 0;
    for (let n = 0; n < i; n++) {
      marginTop += data[n].type === 1 ? 0 : data[n].type > 1 ? this.keyHeightEdge : this.keyHeight;
    }
    if (data[i].type === 1) {
      marginTop -= this.smallKeyHeight / 2;
    }
    return marginTop;
  }


  drawChord(index: number, name: string, data: Array<any>) {

    const height = (this.keyHeightEdge * 4) + (this.keyHeight * ((data.length / 2) - 3));

    const chords = this.chordsGroup.append('g')
      .attr('id', 'chord-' + name)
      .attr('class', 'chordSection')
      .attr('transform', 'translate(0, ' + (index === 0 ? this.nodeService.scale.scaleY(this.config.editBounds.yMax) : this.nodeService.scale.scaleY(this.config.editBounds.yMax) + (height * index) - (this.keyHeight * 2)) + ')');

    const rectbg = chords.selectAll('rect.gridRectBgY')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'gridRectBgY')
      .attr('x', this.nodeService.scale.scaleX(this.config.editBounds.xMin))
      .attr('width', this.nodeService.scale.scaleX(this.config.editBounds.xMax) - this.nodeService.scale.scaleX(this.config.editBounds.xMin))
      .attr('y', (d: any, i: number) => i * this.smallKeyHeight)
      .attr('height', this.smallKeyHeight)
      .style('shape-rendering', 'crispEdges')
      .style('fill', (d: { type: number }) => d.type !== 1 ? '#ccc' : 'transparent')
      .style('opacity', 0.05)
      .attr('pointer-events', 'none');

    const lines = chords.selectAll('line.gridY')
      .data(data)
      .enter()
      .append('line')
      .attr('class', 'gridY')
      .attr('x1', this.nodeService.scale.scaleX(this.config.editBounds.xMin))
      .attr('x2', this.nodeService.scale.scaleX(this.config.editBounds.xMax))
      .attr('y1', (d: any, i: number) => i * this.smallKeyHeight)
      .attr('y2', (d: any, i: number) => i * this.smallKeyHeight)
      .style('stroke', (d: { type: number }, i: number) => d.type === 2 && i === 0 || d.type === 2 && data[i - 1].type === 2 ? '#ccc' : '#666')
      .style('stroke-width', 0.5)
      .style('shape-rendering', 'crispEdges')
      .style('opacity', 0.6)
      .attr('pointer-events', 'none');

    const bg = chords.append('rect')
      .attr('class', 'bg')
      .attr('id', 'bg-' + name)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', this.keyWidth)
      .attr('height', height)
      .style('fill', '#fff');

    const keys = chords.selectAll('rect.keys')
      .data(data)
      .enter()
      .append('rect')
      .attr('id', (d: {name: string}) => 'key-' + name + ' ' + d.name)
      .attr('class', 'keys')
      .attr('x', 0)
      .attr('y', (d: { type: number }, i : number) => this.getKeyMarginTop(i, data))
      .attr('width', (d: { type: number }, i : number) => d.type === 1 ? this.smallKeyWidth : this.keyWidth)
      .attr('height', (d: { type: number }, i : number) => d.type === 1 ? this.smallKeyHeight : d.type > 1 ? this.keyHeightEdge : this.keyHeight)
      .attr('stroke', '#000')
      .attr('stroke-width', 0.5)
      .attr('shape-rendering', 'crisp-edges')
      .attr('fill', (d: { type: number }) => d.type === 1 ? '#000' : 'transparent')
        .append('svg:title')
          .text((d: {name: string}) => 'key ' + d.name);

    const text = chords.append('text')
      .attr('class', 'chordName')
      .attr('x', this.keyWidth - 5)
      .attr('y', height - 2)
      .attr('text-anchor', 'end')
      .text(name)
      .style('fill', '#666')
      .style('font-family', 'Open Sans, Arial, sans-serif')
      .style('font-size', '8px');

  }



  drawBlocks(data: any, effectname: string) {

    this.config.svg.selectAll('#blocksSVG').remove();

    let moving = false;

    if (data.length > 0) {

      const clipPath = this.config.svg.append('clipPath')
        .attr('id', 'clipPathAudioBlocks')
        .append('svg:rect')
        .attr('class', 'clipPath')
        .attr('width', this.config.chartDx - this.keyWidth - 20)
        .attr('height', this.config.svgDy - this.config.margin.bottom - this.config.margin.top);


      this.config.blocksSVG = this.config.svg.append('g')
        .attr('id', 'blocksSVG')
        .attr('class', 'blocksSVG')
        .attr('clip-path', 'url(#clipPathAudioBlocks)')
        .attr('transform', 'translate(80, ' + this.config.margin.top + ')');

      const dragBlock = d3.drag()
        .on('start', (event: any, d: any) => {
          this.dataService.selectElement(d.id, d.vis.x, d.vis.y, d.vis.width, null);
        })
        .on('drag', (event: any, d: any) => {
          const coords = this.drawingService.calculateBlockSnapPoint(this.nodeService.scale.scaleX.invert(event.x + 80), this.nodeService.scale.scaleY.invert(event.y));
          if (coords.x !== d.vis.x || coords.y !== d.vis.y) {
            d.vis.x = coords.x;
            d.vis.y = coords.y;
            d3.select('#block_id_' + d.id).attr('x', this.nodeService.scale.scaleX(d.vis.x) - 79).attr('y', this.nodeService.scale.scaleY(d.vis.y + 1) + 1);
            d3.select('#left_block_id_' + d.id).attr('y', (d: { vis: { y: number; }; }) => this.nodeService.scale.scaleY(d.vis.y + 1) + 1)
              .attr('x', (d: { vis: { x: number; width: number; }; }) => this.nodeService.scale.scaleX(d.vis.x) - ((this.nodeService.scale.scaleX(d.vis.x + d.vis.width) - this.nodeService.scale.scaleX(d.vis.x)) / 8) - 80)
            d3.select('#right_block_id_' + d.id).attr('x', (d: { vis: { x: number; width: number; }; }) => this.nodeService.scale.scaleX(d.vis.x + d.vis.width) - ((this.nodeService.scale.scaleX(d.vis.x + d.vis.width) - this.nodeService.scale.scaleX(d.vis.x)) / 8) - 80)
              .attr('y', (d: { vis: { y: number; }; }) => this.nodeService.scale.scaleY(d.vis.y + 1) + 1);

            this.dataService.selectElement(d.id, d.vis.x, d.vis.y, d.vis.width, null);
          }
        });

      this.config.blocksSVG.selectAll('rect.blocks')
        .data(data)
        .enter()
        .append('rect')
        .attr('id', (d: { id: string; path: string }) => 'block_id_' + d.id)
        .attr('class', 'blocks')
        .attr('width',  (d: { vis: { x: number; width: number; }; }) => this.nodeService.scale.scaleX(d.vis.x + d.vis.width) - this.nodeService.scale.scaleX(d.vis.x) - 2)
        .attr('height', this.smallKeyHeight - 2)
        .attr('x', (d: { vis: { x: number; }; }) => this.nodeService.scale.scaleX(d.vis.x) - 79)
        .attr('y', (d: { vis: { y: number; }; }) => this.nodeService.scale.scaleY(d.vis.y + 1) + 1)
        .style('fill', (d: { id: string }) => this.midiDataService.isSelected(d.id) ? '#0970ba' : '#5993bd')
        .style('stroke', (d: { id: string }) => this.midiDataService.isSelected(d.id) ? '#87c2ed' : '#7fbdeb')
        .style('stroke-width', 1)
        .style('shape-rendering', 'crispEdges')
        .on('mouseenter', (event: any, d: { id: string; }) => {
          if (this.config.cursor.slug === 'dsel' || this.config.cursor.slug === 'sel') {
            this.config.blocksSVG.select('#block_id_' + d.id).style('fill', '#0970ba').style('stroke', '#87c2ed');
          }
        })
        .on('mouseleave', (event: any, d: { id: string; }) => {
          if (this.config.cursor.slug === 'dsel' || this.config.cursor.slug === 'sel') {
            if (!this.midiDataService.isSelected(d.id)) {
              this.config.blocksSVG.selectAll('#block_id_' + d.id).style('fill', '#5993bd').style('stroke', '#7fbdeb');
            }
          }
        })
        .on('mousedown', (event: any, d: { id: string; vis: any; effect: any; }) => {
          if (this.config.cursor.slug === 'dsel' || this.config.cursor.slug === 'sel') {
            event.stopPropagation();
            if (event.ctrlKey) {
              //show drawing canvas
              d.effect.name = effectname + '-CC-' + d.vis.y;
              d.effect.range = new Range(0, d.vis.width);

              this.drawingService.openEffect(d.effect);
            }
            this.midiDataService.selectBlock(d.id, event.shiftKey);
            if (!event.shiftKey) {
              this.config.blocksSVG.selectAll('.blocks').style('fill', '#5993bd').style('stroke', '#7fbdeb');
              this.config.blocksSVG.select('#block_id_' + d.id).style('fill', '#0970ba').style('stroke', '#87c2ed');
            }
          }
        })
        .call(dragBlock)
        .append('svg:title')
        .text(() => 'Ctrl + Click to edit');


      const resizeWidthBlockLeft = d3.drag()

        .on('start', (event: any, d: any) => {
          // event.stopPropagation();
        })
        .on('drag', (event: any, d: any) => {
          const coords = this.drawingService.calculateBlockSnapPoint(this.nodeService.scale.scaleX.invert(event.x + 80), this.nodeService.scale.scaleY.invert(event.y));
          const difference = d.vis.x - coords.x;
          if (coords.x !== d.vis.x && d.vis.width + difference > 0) {
            d.vis.x -= difference;
            d.vis.width += difference;
            d3.select('#block_id_' + d.id)
              .attr('x', this.nodeService.scale.scaleX(d.vis.x) - 79)
              .attr('width', (this.nodeService.scale.scaleX(d.vis.x + d.vis.width) - this.nodeService.scale.scaleX(d.vis.x)));
            d3.select('#left_block_id_' + d.id).attr('x', (d: { vis: { x: number; width: number; }; }) => this.nodeService.scale.scaleX(d.vis.x) - 85);
          }
        });

      const resizeWidthBlockRight = d3.drag()

        .on('start', (event: any, d: any) => {
          //play sound effect
          // event.stopPropagation();
        })
        .on('drag', (event: any, d: any) => {
          const coords = this.drawingService.calculateBlockSnapPoint(this.nodeService.scale.scaleX.invert(event.x + 80), this.nodeService.scale.scaleY.invert(event.y));
          const difference = (d.vis.x + d.vis.width) - coords.x;
          if (coords.x !== d.vis.x + d.vis.width && d.vis.width - difference > 0) {
            d.vis.width -= difference;
            d3.select('#block_id_' + d.id).attr('width', (this.nodeService.scale.scaleX(d.vis.x + d.vis.width) - this.nodeService.scale.scaleX(d.vis.x)));
            d3.select('#right_block_id_' + d.id).attr('x', (d: { vis: { x: number; width: number; }; }) => this.nodeService.scale.scaleX(d.vis.x + d.vis.width) - 85);
          }
        });

      this.config.blocksSVG.selectAll('rect.side-left')
        .data(data)
        .enter()
        .append('rect')
        .attr('id', (d: { id: string; path: string }) => 'left_block_id_' + d.id)
        .attr('class', 'block_resize')
        .attr('width',  10)
        .attr('height', this.smallKeyHeight - 2)
        .attr('x', (d: { vis: { x: number; }; }) => this.nodeService.scale.scaleX(d.vis.x) - 85)
        .attr('y', (d: { vis: { y: number; }; }) => this.nodeService.scale.scaleY(d.vis.y + 1) + 1)
        .attr('pointer-events', (d: any) => !this.config.zoomable ? 'auto' : 'none')
        .style('fill', 'transparent')
        .on('mouseenter', (event: any, d: { id: string }) => {
          this.drawingService.setCursor('ew-resize')
        })
        .on('mouseleave', (event: any, d: { id: string }) => {
          this.drawingService.setCursor(this.config.cursor.cursor);
        })
        .call(resizeWidthBlockLeft);

      this.config.blocksSVG.selectAll('rect.side-right')
        .data(data)
        .enter()
        .append('rect')
        .attr('id', (d: { id: string; path: string }) => 'right_block_id_' + d.id)
        .attr('class', 'block_resize')
        .attr('width', 10)
        .attr('height', this.smallKeyHeight - 2)
        .attr('x', (d: { vis: { x: number; width: number; }; }) => this.nodeService.scale.scaleX(d.vis.x + d.vis.width) - 85)
        .attr('y', (d: { vis: { y: number; }; }) => this.nodeService.scale.scaleY(d.vis.y + 1) + 1)
        .attr('pointer-events', (d: any) => !this.config.zoomable ? 'auto' : 'none')
        .style('fill', 'transparent')
        .on('mouseenter', (event: any, d: { id: string }) => {
          this.drawingService.setCursor('ew-resize')
        })
        .on('mouseleave', (event: any, d: { id: string }) => {
          this.drawingService.setCursor(this.config.cursor.cursor);
        })
        .call(resizeWidthBlockRight);


    }
  }

}
