import { Injectable, Inject } from '@angular/core';
import { DrawingPlaneConfig, SliderDrawplane } from '../models/drawing-plane-config.model';
import { NodeService } from './node.service';
import * as d3 from 'd3';
import { File } from '../models/file.model';
import { DataService } from './data.service';
import { DOCUMENT } from '@angular/common';
import { Cursor } from '../models/tool.model';
import { Subject } from 'rxjs';
import { FileService } from './file.service';
import { EffectVisualizationService } from './effect-visualization.service';
import { Details, Effect, Unit } from '../models/effect.model';
import { Midi, MidiNote } from '../models/audio.model';
import { Collection } from '../models/collection.model';
import { Configuration, EffectType } from '../models/configuration.model';
import { MidiDataService } from './midi-data.service';


@Injectable()
export class DrawingService {

  public config: DrawingPlaneConfig;
  public file = new File(null, null, null);


  drawFile: Subject<any> = new Subject<void>();
  showMessage: Subject<any> = new Subject<void>();
  align: Subject<any> = new Subject<void>();
  updateResizeMotorControlSection: Subject<any> = new Subject<void>();
  drawEffectsInLibrary: Subject<any> = new Subject<void>();
  getBBoxSize: Subject<any> = new Subject<void>();



  constructor(@Inject(DOCUMENT) private document: Document, public nodeService: NodeService, private midiDataService: MidiDataService,
              private dataService: DataService, private fileService: FileService, private effectVisualizationService: EffectVisualizationService) {

    this.config = new DrawingPlaneConfig();

    this.effectVisualizationService.setActiveEffect.subscribe(res => {
      this.setActiveCollectionEffect(res);
    });
  }

  createPlane() {
    d3.select('#svgID').remove();

    this.config.svg = d3.select('#field-inset')
      .append('svg')
      .attr('id', 'svgID')
      .attr('width', this.config.svgDx)
      .attr('height', this.config.svgDy);

    if (this.file.activeEffect && this.file.activeEffect.scale) {
      const t = d3.zoomIdentity.translate(this.file.activeEffect.scale.x, 0).scale(this.file.activeEffect.scale.k);
      this.config.svg.call(this.config.zoom.transform, t);
    }

    const field = this.config.svg.append('rect')
      .attr('width', this.config.svgDx - this.config.margin.left)
      .attr('height', this.config.chartDy)
      .attr('transform', 'translate(0, ' + this.config.margin.top + ')')
      .attr('class', 'drawAreaContainer')
      .attr('fill', '#858585');

    const clipPath = this.config.svg.append('clipPath')
      .attr('id', 'clip')
      .append('svg:rect')
      .attr('class', 'clipPath')
      .attr('width', this.config.chartDx)
      .attr('height', this.config.svgDy - this.config.margin.bottom - this.config.margin.top);

    const clipPathLarge = this.config.svg.append('clipPath')
      .attr('id', 'clipLarge')
      .append('svg:rect')
      .attr('class', 'clipPath')
      .attr('width', this.config.svgDx)
      .attr('height', this.config.svgDy);

    if (this.file.configuration.openTabs.length > 0) {

      const innerContainer = this.config.svg.append('rect')
        .attr('width', this.nodeService.scale.scaleX(this.config.editBounds.xMax) - this.nodeService.scale.scaleX(this.config.editBounds.xMin))
        .attr('height', this.config.chartDy)
        .attr('x', this.nodeService.scale.scaleX(this.config.editBounds.xMin))
        .attr('y', 0)
        .attr('clip-path', 'url(#clip)')
        .attr('transform', 'translate(0, ' + this.config.margin.top + ')')
        .attr('class', 'innerContainer')
        // .attr('stroke-width', 0.5)
        // .attr('stroke', '#1c1c1c')
        .attr('shape-rendering', 'crispEdges')
        .attr('fill', () => this.audioVisualization() ? '#222' : '#fff')
        .on('click', (event) => {
          if (this.config.cursor.slug === 'zoom') {
            let direction = 1;
            if (event.altKey) {
              direction = -1;
            } else {
              this.setCursor(this.config.cursor.cursor);
            }
            this.clickToZoom(direction);
          }
        });

      const zeroLine = this.config.svg.append('line')
        .attr('x1', this.nodeService.scale.scaleX(this.config.editBounds.xMin))
        .attr('x2', this.nodeService.scale.scaleX(this.config.editBounds.xMax))
        .attr('class', 'zeroLine')
        .attr('y1', this.nodeService.scale.scaleY(0))
        .attr('y2', this.nodeService.scale.scaleY(0))
        .attr('transform', 'translate(0, ' + this.config.margin.top + ')')
        .style('stroke', '#1c1c1c')
        .style('stroke-width', 0.6)
        .attr('shape-rendering', 'crispEdges');

      if (this.config.rulerVisible) {
        this.drawRulers();
      }
      this.drawSliderDrawplane('x', this.config.sliderDrawplane);
      if (this.audioVisualization()) { this.drawSliderDrawplane('y', this.config.sliderDrawplaneVertical)}
    }
  }

  setCursor(cursor: string) {
    if (this.document.body.style.cursor !== 'wait') {
      this.document.getElementById('field-inset').style.cursor = cursor;
    }
  }

  clickToZoom(direction: any) {
    const transform = d3.zoomTransform(this.config.svg.node());
    const scale = transform.k * (1 + (0.04 * direction));
    if (scale > 0.5) {
      const offset = ((transform.x - (transform.x * scale)) / 2) + transform.x;
      const t = d3.zoomIdentity.translate(offset, 0).scale(scale);
      this.config.svg.call(this.config.zoom.transform, t);
      this.scaleContent(t);
      this.updateSlider(t, this.config.sliderDrawplane, 'x');
    }
  }

  clickToMove(direction: any, axis: string, slider: SliderDrawplane) {
    slider.inner.min += (10 * direction);
    slider.inner.max += (10 * direction);

    if ((slider.inner.min >= slider.outer.min + 10 && direction === -1) ||
        (slider.inner.max <= slider.outer.max - 10 && direction === 1)) {

      slider.inner.min += (10 * direction);
      slider.inner.max += (10 * direction);

      this.updateSliderPosition(slider, axis);
    }
  }

  updateSliderPosition(slider: SliderDrawplane, axis: string) {
    this.translateDrawplane(slider, (axis === 'x' ? this.config.chartDx : this.config.chartDy), axis);
    if (axis === 'x') {
      d3.select('.innerRoundRectSlider-x').attr('x', slider.inner.min - 6);
    } else {
      d3.select('.innerRoundRectSlider-y').attr('y', slider.inner.min - 6);
    }
  }

  audioVisualization() {
    return this.file.activeEffect && this.file.activeEffect.type === EffectType.midi ? true : false; //&& this.file.activeEffect.dataType === MidiDataType.notes
  }

  deleteSelectedBlocks() {
    for (const block of this.midiDataService.selectedBlocks) {
      const blockItem = this.file.activeEffect.data.filter(b => b.id === block)[0];
      if (blockItem) {
        const index = this.file.activeEffect.data.indexOf(blockItem);
        if (index > -1) {
          this.file.activeEffect.data.splice(index, 1);
        }
      }
    }
    this.midiDataService.deselectAllBlocks();
  }


  public resetVariables() {
    this.config.svgDx = window.innerWidth;
    this.config.svgDy = window.innerHeight * (100 - this.file.configuration.horizontalScreenDivision)/100 - 18;
    if (this.config.svgDy < 250) { this.config.svgDy = 250; }
    const audioVis = this.audioVisualization();
    const multiplyFactor = audioVis ? 0.00 : 0.14;
    this.config.margin = {
      top: this.config.svgDy * multiplyFactor + 64 + this.config.rulerWidth, //64
      right: (audioVis ? 18 : this.config.rulerWidth),
      bottom: this.config.svgDy * multiplyFactor + 20,
      left: this.config.toolbarOffset,
      offsetTop: window.innerHeight * this.file.configuration.horizontalScreenDivision/100 + 2
    };

    this.config.chartDx = this.config.svgDx - this.config.margin.left - this.config.margin.right;
    this.config.chartDy = this.config.svgDy - this.config.margin.bottom - this.config.margin.top;
    if ( this.audioVisualization() && this.config.chartDy < 1270) {
      this.config.chartDy = 1270;
      this.getSliderDrawplanePosition('y', this.config.sliderDrawplaneVertical);
    }
    this.getSliderDrawplanePosition('x', this.config.sliderDrawplane);
    // this.setZoom();

  }




  setScale() {

    this.config.yScale = d3
      .scaleLinear()
      .domain([this.config.editBounds.yMax, this.config.editBounds.yMin])
      .range([0, this.config.chartDy]);

    this.config.xScale = d3
      .scaleLinear()
      .domain([this.config.editBounds.xMin, this.config.editBounds.xMax])
      .range([this.audioVisualization() ? 80 : 0, this.config.chartDx]);

    if (!this.file.activeEffect || (this.file.activeEffect && !this.file.activeEffect.scale)) {
      this.nodeService.setScale(this.config.xScale, this.config.yScale);
    } else {
      const t = this.audioVisualization() ? d3.zoomIdentity.translate(this.file.activeEffect.scale.x, this.file.activeEffect.scale.y).scale(this.file.activeEffect.scale.k) :
      d3.zoomIdentity.translate(this.file.activeEffect.scale.x, 0).scale(this.file.activeEffect.scale.k);
      const newScaleX = t.rescaleX(this.config.xScale);
      if (this.audioVisualization()) {
        const newScaleY = t.rescaleY(this.config.yScale);
        this.nodeService.setScale(newScaleX, newScaleY);
      } else {
        this.nodeService.setScale(newScaleX, this.config.yScale);
      }

    }
    this.setZoom();
  }

  // resetScale() {
  //   this.nodeService.setScale(null, null);
  // }

  setZoom() {
    this.config.zoom = d3
      .zoom()
      .scaleExtent([0.01, Infinity])
      .translateExtent([[this.config.chartDx * -0.5, 0], [(this.config.chartDx * 1.5), this.config.chartDy]]) // 1.2
      .on('zoom', (event: any) => {
        if (this.config.zoomable) {
          const transform = event.transform;

          this.scaleContent(transform);
          this.updateSlider(transform, this.config.sliderDrawplane, 'x');
          if (this.audioVisualization()) {
            this.updateSlider(transform, this.config.sliderDrawplaneVertical, 'y');
          }

        }
      });
  }

  setEditBounds() {

    if (this.file.activeEffect) {
      // console.log (this.config.svgDy);
      // this.config.margin.top = this.config.svgDy * 0.4;
      this.config.editBounds = {
        xMin: this.file.activeEffect.range.start,
        xMax: this.file.activeEffect.range.end,
        yMin: this.file.activeEffect.range_y.start,
        yMax: this.file.activeEffect.range_y.end,
      };
    }
    this.resetVariables();
  }

  updateScaleBox(transform: number) {
    this.config.svg.select('.scalePercentage').text(() => {
      return Math.round(100 * transform) + '%';
    });
  }

  scaleContent(transform: any) {
    const newScale = transform.rescaleX(this.config.xScale);
    if (this.audioVisualization()) {
      const newScaleY = transform.rescaleY(this.config.yScale);
      this.nodeService.setScale(newScale, newScaleY);
    } else {
      this.nodeService.setScale(newScale, this.config.yScale);
    }

    if (this.config.rulerVisible) {
      this.config.xAxisBottom.call(this.config.xAxis.scale(newScale));
      this.config.xAxisBottomSmallTicks.call(this.config.xAxisSmallTicks.scale(newScale));

      this.config.svg.selectAll('.axisBottom text')
        .attr('y', 2)
        .attr('x', 4)
        .style('text-anchor', 'start');
    }

    this.file.activeEffect.scale = transform;
    this.updateScaleBox(transform.k);

    this.config.svg.select('.innerContainer')
      .attr('x', this.nodeService.scale.scaleX(this.config.editBounds.xMin))
      .attr('y', this.nodeService.scale.scaleY(this.config.editBounds.yMax))
      .attr('width', this.nodeService.scale.scaleX(this.config.editBounds.xMax) -
                     this.nodeService.scale.scaleX(this.config.editBounds.xMin));

    this.config.svg.select('.zeroLine')
      .attr('x1', this.nodeService.scale.scaleX(this.config.editBounds.xMin))
      .attr('x2', this.nodeService.scale.scaleX(this.config.editBounds.xMax));

    this.drawFileData();
  }



  getSliderDrawplanePosition(axis: string, slider: SliderDrawplane) {
    let offset: number;
    let scale = 1;
    let scaleOffset = 0;

    slider.outer.max = axis === 'x' ? this.config.chartDx - 150 : this.config.svgDy - this.config.margin.bottom - 30;
    slider.outer.min = axis === 'x' ? this.config.margin.left + 50 : this.config.margin.top + 30 - this.config.rulerWidth;


    const length = slider.outer.max - slider.outer.min;

    if (this.file.activeEffect && this.file.activeEffect.scale) {
      scale = this.file.activeEffect.scale.k;
      scaleOffset = axis === 'x' ? this.file.activeEffect.scale.x : this.file.activeEffect.scale.y;
    }
    const planeSize = axis === 'x' ? this.config.chartDx * 2 * scale : this.config.chartDy;
    offset = ((scaleOffset - ((axis === 'x' ? this.config.chartDx * 0.5 * scale : 0))) * -1) / planeSize * length;
    let sliderWidth = axis === 'x' ? (0.5 / scale) * length : ((slider.outer.max - slider.outer.min) / planeSize) * (slider.outer.max - slider.outer.min); // .72
    if (sliderWidth < 20) { sliderWidth = 20; }
    if (axis === 'x' && sliderWidth > this.config.chartDx - 220 + this.config.rulerWidth) { sliderWidth = this.config.chartDx - 220 + this.config.rulerWidth; offset = 0; }

    slider.inner.min = offset + slider.outer.min;
    if (slider.inner.min < slider.outer.min) { slider.inner.min = slider.outer.min; }
    slider.inner.max = slider.inner.min + sliderWidth;

  }



  updateSlider(transform: any, slider: SliderDrawplane, axis: string) {
    let planeSize = axis === 'x' ? this.config.chartDx * 2 * transform.k : this.config.chartDy;
    const length = slider.outer.max - slider.outer.min;

    let offset = ((transform.x - (axis === 'x' ? (this.config.chartDx * 0.5 * transform.k) : 0)) * -1) / planeSize * length;

    let sliderLength = (0.5 / transform.k) * length; // .72
    if (sliderLength < 20) { sliderLength = 20; }
    if (sliderLength > this.config.chartDx - 220 + this.config.rulerWidth) { sliderLength = this.config.chartDx - 220 + this.config.rulerWidth; offset = 0; }

    slider.ratio = sliderLength / length;
    slider.inner.min = offset + slider.outer.min;
    slider.inner.max = slider.inner.min + sliderLength;

    if (axis === 'x') {
      this.config.svg.select('.innerRoundRectSlider-x')
        .attr('x', slider.inner.min - 6)
        .attr('width', sliderLength);
    } else {
      this.config.svg.select('.innerRoundRectSlider-y')
        .attr('y', slider.inner.min - 6)
        .attr('height', sliderLength);
    }
  }



  translateDrawplane(slider: SliderDrawplane, size: number, axis: string) {

    const transform = d3.zoomTransform(this.config.svg.node());
    const scale = axis === 'x' ? transform.k : 1;
    let offset = axis === 'x' ?
        ((slider.outer.min - slider.inner.min) / (slider.outer.max - slider.outer.min)) * (size * 2 * scale) + (size * 0.5 * scale) :
        ((slider.outer.min - slider.inner.min) / (slider.outer.max - slider.outer.min)) * (size);

    const t = d3.zoomIdentity.translate((axis === 'x' ? offset : transform.x), (axis === 'y' ? offset : transform.y)).scale(transform.k);
    this.config.svg.call(this.config.zoom.transform, t);
    this.scaleContent(t);
  }




  updateSliderOnDrag(axis: string, currentPos: number, slider: SliderDrawplane) {

    if (slider.inner.min + (currentPos - slider.dragPos) >= slider.outer.min && slider.inner.max + (currentPos - slider.dragPos) <= slider.outer.max) {
      slider.inner.min += (currentPos - slider.dragPos);
      slider.inner.max += (currentPos - slider.dragPos);

      slider.dragPos = currentPos;
    } else {
      if (slider.inner.min + (currentPos - slider.dragPos) < slider.outer.min) {
        const difference = slider.outer.min - slider.inner.min;
        slider.inner.min = slider.outer.min;
        slider.inner.max += difference;
      } else if (slider.inner.max + (currentPos - slider.dragPos) > slider.outer.max) {
        const difference = slider.outer.max - slider.inner.max;
        slider.inner.max = slider.outer.max;
        slider.inner.min += difference;
      }
    }
    if (axis === 'x') {
      this.translateDrawplane(slider, this.config.chartDx, axis);
      d3.select('.innerRoundRectSlider-x').attr('x', slider.inner.min - 6);
    } else {
      this.translateDrawplane(slider, this.config.chartDy, axis);
      d3.select('.innerRoundRectSlider-y').attr('y', slider.inner.min - 6);
    }


  }


  drawSliderDrawplane(axis: string, slider: SliderDrawplane) {

    this.config.svg.selectAll('#sliderGroup-' + axis).remove();

    const sliderGroup = this.config.svg.append('g')
      .attr('id', 'sliderGroup-' + axis);

    const dragContent = d3
      .drag()
      .on('start', (event: any) => { slider.dragPos = axis === 'x' ? event.x : event.y; })
      .on('drag', (event: any) => {
        this.updateSliderOnDrag(axis, (axis === 'x' ? event.x : event.y), slider);
      })
      .on('end', () => {
        slider.dragPos = null;
      });


    const sliderDrawplane = sliderGroup.append('rect')
      .attr('id', 'slider-drawplane')
      .attr('class', 'slider-el')
      .attr('x', axis === 'x' ? 0 : this.config.svgDx - 18 - this.config.margin.left)
      .attr('y', axis === 'x' ? this.config.svgDy - 22 : this.config.margin.top - this.config.rulerWidth)
      .attr('height', axis === 'x' ? 22 : this.config.svgDy - this.config.margin.top - this.config.margin.bottom + this.config.rulerWidth)
      .attr('width', axis === 'x' ? this.config.svgDx - this.config.margin.left : 20)
      .attr('cursor', 'default')
      .style('fill', '#3a3a3a');

    const innerRoundedRect = sliderGroup.append('rect')
      .attr('class', 'innerRoundRectSlider-' + axis)
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('x', axis === 'x' ? slider.inner.min - 6 : this.config.svgDx - this.config.margin.left - 13)
      .attr('y', axis === 'x' ? this.config.svgDy - 17 : slider.inner.min - 6)
      .attr('width', axis === 'x' ? slider.inner.max - slider.inner.min + 12 : 10)
      .attr('height', axis === 'x' ? 10 : slider.inner.max - slider.inner.min + 12)
      .attr('cursor', 'default')
      .style('fill', '#999')
      .call(dragContent);

    const arrows = [
      { name: 'sider-arrow-left',
        direction: -1,
        x: axis === 'x' ? 12 : this.config.svgDx - this.config.margin.left - 8,
        y: axis === 'x' ? this.config.svgDy - 12 : this.config.margin.top + 10 - this.config.rulerWidth,
        r: axis === 'x' ? 270 : 0 },
      { name: 'sider-arrow-right',
        direction: 1,
        x: axis === 'x' ? (this.config.chartDx - 48 + this.config.rulerWidth) : this.config.svgDx - this.config.margin.left - 8,
        y: axis === 'x' ? this.config.svgDy - 12 : this.config.svgDy - this.config.margin.bottom - 12,
        r: axis === 'x' ? 90 : 180 }
    ];

    const triangle = d3.symbol()
      .type(d3.symbolTriangle)
      .size(25);

    const sliderArrows = sliderGroup.selectAll('path.sliderArrow')
      .data(arrows)
      .enter()
      .append('path')
      .attr('class', 'sliderArrow')
      .attr('transform', (d: { x: number, y: number, r: number }) => 'translate(' + d.x + ',' + d.y + '), rotate(' + d.r + ')')
      .attr('d', triangle)
      .style('fill', '#999')
      .style('stroke', 'transparent')
      .style('stroke-width', 3)
      .attr('cursor', 'default')
      .on('mousedown', (event: any, d: { direction: number }) => this.clickToMove(d.direction, axis, slider));

    if (axis === 'x') {
      const scalePercentage = sliderGroup.append('text')
        .attr('class', 'scalePercentage')
        .attr('x', this.config.chartDx + this.config.rulerWidth - 8)
        .attr('y', this.config.svgDy - 8)
        .attr('text-anchor', 'end')
        .text(() => {
          if (!this.file.activeEffect.scale) {
            const transform = d3.zoomTransform(this.config.svg.node());
            return Math.round(transform.k * 100) + '%';
          } else {
            return Math.round(this.file.activeEffect.scale.k * 100) + '%';
          }
        })
        .style('fill', '#ccc')
        .attr('cursor', 'default')
        .style('font-family', 'Open Sans, Arial, sans-serif')
        .style('font-size', '10px');
    }
  }

  deselectAllElements() {
    this.dataService.deselectAll();
    this.deselectGuides();

    if ((this.nodeService.selectedNodes.length > 0) || (this.nodeService.selectedPaths.length > 0)) {
      this.nodeService.deselectAll();

      this.config.svg.selectAll('.cpSVG, .cursorConnection, .bbox').remove();

      this.config.svg.selectAll('.node')
        .style('fill', 'transparent')
        .style('stroke-width', 6)
        .style('stroke', 'transparent');

      this.config.svg.selectAll('.forceNode').style('fill', 'transparent');
    }
    this.deselectCollectionEffects();
  }

  deselectCollectionEffects() {
    if (this.file.activeCollectionEffect && this.file.activeCollection) {
      const collection = this.file.collections.filter(c => c.id === this.file.activeCollection.id)[0];
      if (collection && collection.config.svg) {
        collection.config.svg.selectAll('#coll-effect-' + this.file.activeCollectionEffect.id).style('opacity', 0.3);
      }
      this.file.activeCollectionEffect = null;
      this.file.activeCollection = null;
    }
  }


  colorNodesSelectedPaths() {
    this.dataService.setBoxSelection(true);
    for (const item of this.nodeService.selectedPaths) {
      this.config.svg.selectAll('.n_' + item)//this.file.configuration.colors.filter(c => c.type === this.file.activeEffect.type)[0].hash[0]
        .style('fill', this.file.configuration.colors.filter(c => c.type === this.file.activeEffect.type)[0].hash[0])
        .style('stroke', this.file.configuration.colors.filter(c => c.type === this.file.activeEffect.type)[0].hash[0])
        .style('stroke-width', 0.5);
    }
  }

  redraw() {
    this.effectVisualizationService.verticalDivision = 100 - this.file.configuration.verticalScreenDivision;
    this.setEditBounds();
    this.setScale();
    this.createPlane();
    this.drawFileData();
  }

  toggleLibraryWindow() {
    let division: number;
    if (this.file.configuration.verticalScreenDivision >= (100 / window.innerWidth) * (window.innerWidth - 18)) {
      division = 70;
      if (this.document.getElementById('toggleLibraryWindow').classList.contains('hidden')) {
        this.document.getElementById('toggleLibraryWindow').classList.remove('hidden');
      }
    } else {
      division = this.file.configuration.verticalScreenDivision = (100 / window.innerWidth) * (window.innerWidth - 18);
      if (!this.document.getElementById('toggleLibraryWindow').classList.contains('hidden')) {
        this.document.getElementById('toggleLibraryWindow').classList.add('hidden');
      }
    }
    this.updateResize(division, 'vertical');
    this.updateResizeMotorControlSection.next(true);
  }

  toggleDrawPlane() {
    let division: number;
    if (this.file.configuration.horizontalScreenDivision >= (100 / window.innerHeight) * (window.innerHeight - 40)) {
      if (this.document.getElementById('toggleDrawPlane').classList.contains('hidden')) {
        this.document.getElementById('toggleDrawPlane').classList.remove('hidden');
      }
      division = 35;
    } else {
      if (!this.document.getElementById('toggleDrawPlane').classList.contains('hidden')) {
        this.document.getElementById('toggleDrawPlane').classList.add('hidden');
      }
      division = (100 / window.innerHeight) * (window.innerHeight - 38);
    }
    this.updateResize(division, 'horizontal');
    this.updateResizeMotorControlSection.next(true);
  }

  setDivToScreenDivision() {
    this.document.getElementById('top-section').style.height = ((window.innerHeight * this.file.configuration.horizontalScreenDivision / 100) - 23) + 'px';
    this.document.getElementById('bottom-section').style.height = ((window.innerHeight * (100-this.file.configuration.horizontalScreenDivision) / 100) - 20) + 'px';
    this.document.getElementById('field-inset').style.height = ((window.innerHeight * (100-this.file.configuration.horizontalScreenDivision) / 100) - 20) + 'px';
    this.document.getElementById('motor-control').style.width = (window.innerWidth * this.file.configuration.verticalScreenDivision / 100) + 'px';
    this.document.getElementById('library').style.width = ((window.innerWidth * (100-this.file.configuration.verticalScreenDivision) / 100) - 1) + 'px';
    if (this.file.configuration.horizontalScreenDivision >= (100 / window.innerHeight) * (window.innerHeight - 40)) {
      this.document.getElementById('toggleDrawPlane').classList.add('hidden');
    }
    if (this.file.configuration.verticalScreenDivision >= (100 / window.innerWidth) * (window.innerWidth - 18)) {
      this.document.getElementById('toggleLibraryWindow').classList.add('hidden');
    }
  }

  updateResize(division: number, orientation: string) {
    if (orientation === 'horizontal') {
      this.document.getElementById('top-section').style.height = ((window.innerHeight * division / 100) - 23) + 'px';
      this.document.getElementById('bottom-section').style.height = ((window.innerHeight * (100-division) / 100) - 20) + 'px';
      this.document.getElementById('field-inset').style.height = ((window.innerHeight * (100-division) / 100) - 20) + 'px';
      this.file.configuration.horizontalScreenDivision = division;
      if (this.file.configuration.horizontalScreenDivision >= (100 / window.innerHeight) * (window.innerHeight - 40)) {
        this.document.getElementById('toggleDrawPlane').classList.add('hidden');
      } else {
        if (this.document.getElementById('toggleLibraryWindow').classList.contains('hidden')) {
          this.document.getElementById('toggleDrawPlane').classList.remove('hidden');
        }
        this.config.svgDy = window.innerHeight * (100 - this.file.configuration.horizontalScreenDivision)/100 - 20;
        if (this.config.svgDy < 250) { this.config.svgDy = 250; }
        this.redraw();
      }
      this.updateConfigActiveFile(this.file.configuration);

    } else if (orientation === 'vertical') {
      this.document.getElementById('motor-control').style.width = (window.innerWidth * division / 100) + 'px';
      this.document.getElementById('library').style.width = ((window.innerWidth * (100-division) / 100) - 1) + 'px';
      this.file.configuration.verticalScreenDivision = division;
      if (this.file.configuration.verticalScreenDivision >= (100 / window.innerWidth) * (window.innerWidth - 18)) {
        if (!this.document.getElementById('toggleLibraryWindow').classList.contains('hidden')) {
          this.document.getElementById('toggleLibraryWindow').classList.add('hidden');
        }
      } else {
        if (this.document.getElementById('toggleLibraryWindow').classList.contains('hidden')) {
          this.document.getElementById('toggleLibraryWindow').classList.remove('hidden');
        }
      }
      this.updateConfigActiveFile(this.file.configuration);
    }
  }


  saveEffect() {
    this.fileService.updateEffect(this.file.activeEffect);
  }

  setTmpEffect(effect: Effect) {
    this.config.tmpEffect = effect;
    this.deselectAllElements();
  }


  updateSelectedModule(xMin: number, xMax: number, yMin: number, yMax: number) {
    this.resetSelectedModule(xMin, xMax, yMin, yMax);
    this.redraw();
  }

  updateUnitsActiveEffect(value: string) {
    if (this.file.activeEffect) {
      const newUnits = this.file.activeEffect.type >= 2 ? this.config.xAxisOptions_velocity.filter(o => o.name === value)[0] : this.config.xAxisOptions.filter(o => o.name === value)[0];
      if (newUnits) {
        this.fileService.updateUnits(this.file.activeEffect.grid.xUnit, newUnits);
      }
    }
  }

  updateYunitsActiveEffect(value: string) {
    if (this.file.activeEffect) {
      const newYunits = this.config.yAxisOptions_pneumatic.filter(p => p.name === value)[0];
      if (newYunits) {
        //write function to update Y axis
      }
    }
  }

  resetSelectedModule(xMin: number, xMax: number, yMin: number, yMax: number) {
    this.config.editBounds.xMin = xMin;
    this.config.editBounds.xMax = xMax;
    this.config.editBounds.yMin = yMin;
    this.config.editBounds.yMax = yMax;
  }

  changeCursor(details: Cursor) {
    if (this.config.cursor.slug !== 'pen' && details.slug === 'pen') {
      this.nodeService.selectedNodes = [];
    }
    this.config.cursor = details;

    this.config.svg.select('#selectionBox').remove();
    if (this.config.cursor.slug !== 'pen' && this.config.cursor.slug !== 'dsel' && this.config.cursor.slug !== 'scis' &&
        this.config.cursor.slug !== 'anchor' && this.config.cursor.slug !== 'thick' && this.config.cursor.slug !== 'drag') {
      this.deselectAllElements();
    }
    if (this.config.cursor.slug !== 'sel') {
      this.config.svg.selectAll('.bbox').remove();
    }
    if (!(this.config.cursor.slug === 'pen' || this.config.cursor.slug === 'dsel' || this.config.cursor.slug === 'anchor' ||
      this.config.cursor.slug === 'thick' || this.config.cursor.slug === 'drag')) {
      this.config.svg.select('.cpSVG').remove();
    }
    if (this.document.body.style.cursor !== 'wait') {
      this.setCursor(details.cursor);
    }

  }

  public drawFileData() {
    this.drawFile.next(true);

  }

  public showMessageDialog( data: { msg: string, type: string, action: string, d: any }) {
    this.showMessage.next(data);
  }

  public alignSelectedItems(direction: string) {
    this.align.next(direction);
  }

  public drawEffects() {
    this.drawEffectsInLibrary.next(true);
  }


  saveFile(file: File) {
    this.fileService.update(file);
  }

  updateActiveEffect(file: File) {
    this.fileService.updateActiveEffectData(file);
    this.fileService.store();
  }

  updateConfigActiveFile(config: Configuration) {
    this.fileService.updateConfig(config);
  }

  openEffect(effect: any) {
    this.fileService.addMidiEffect(effect);
  }


  getBoxSizeActivePaths() {
    this.getBBoxSize.next(true);
  }

  resetPathData() {
    this.nodeService.reset();
  }

  compareDateModified(a, b) {
    if ( a.date.modified < b.date.modified ) { return -1; }
    if ( a.date.modified > b.date.modified ) { return 1; }
    return 0;
  }

  calculateBlockSnapPoint(_x: number, _y: number) {
    const blockWidth = this.file.activeEffect.grid.settings.spacingX / this.file.activeEffect.grid.settings.subDivisionsX;
    return { x: Math.floor(_x / blockWidth) * blockWidth, y: Math.floor(_y) };
  }

  drawRulers() {
    this.config.rulerWidth = 13;

    this.config.svg.selectAll('.ruler, .axis, .axisBottom, .smallAxisX, .smallAxisY, .clipPathYAxis, #clipYaxis').remove();

    if (!this.audioVisualization()) {
      const clipPathYaxis = this.config.svg.append('clipPath')
        .attr('id', 'clipYaxis')
        .append('svg:rect')
        .attr('width', this.config.rulerWidth)
        .attr('height', this.config.svgDy);

      this.config.yAxisSVG = this.config.svg.append('g')
        .attr('class', 'clipPathYAxis')
        .attr('clip-path', 'url(#clipYaxis)')
        .attr('transform', 'translate('+ (this.config.svgDx - this.config.margin.left - this.config.rulerWidth) +', 0)');

      const containerAxisVertical = this.config.yAxisSVG.append('rect')
        .attr('width', this.config.rulerWidth)
        .attr('height', this.config.svgDy - this.config.rulerWidth - 64)
        .attr('y', 64 + this.config.rulerWidth)
        .attr('x', 0)
        .attr('class', 'axis')
        .attr('fill', '#222')
        .on('mouseover', () => this.setCursor('default'))
        .on('mouseleave', () => this.setCursor(this.config.cursor.cursor))
      .append('svg:title')
        .text(() => 'units (' + this.file.activeEffect.grid.yUnit.name + ')');

        const lineY = this.config.yAxisSVG.append('rect')
        .attr('width',  1)
        .attr('height', this.config.svgDy - 64)
        .attr('x', 0)
        .attr('y', 64)
        .attr('fill', '#999');

      const yAxis = d3
          .axisLeft(this.nodeService.scale.scaleY)
          .tickSize(this.config.rulerWidth)
          .ticks(5)
          .tickFormat((e: any) => {
            if (Math.floor(e) !== e) { return; }
            return e;
          });

      const yAxisSmall = d3
          .axisRight(this.nodeService.scale.scaleY)
          .ticks(30)
          .tickSize(3)
          .tickFormat((e: any) => e);

      const yAxisSmallTicks = this.config.yAxisSVG.append('g')
          .attr('transform', 'translate(' + [ 1, this.config.margin.top ] + ')')
          .attr('class', 'smallAxisY')
          .call(yAxisSmall);

      const yAxisTicks = this.config.yAxisSVG.append('g')
          .attr('transform', 'translate(' + [ this.config.rulerWidth, this.config.margin.top ] + ')')
          .attr('class', 'axis')
          .call(yAxis)
            .selectAll('text')
            .attr('y', 4)
            .attr('x', 4)
            .attr('transform', 'rotate(90)')
            .style('text-anchor', 'start');
    }

    const clipPathXaxis = this.config.svg.append('clipPath')
      .attr('id', 'clipXaxis')
      .append('svg:rect')
      .attr('width', this.config.svgDx - this.config.margin.left - this.config.rulerWidth)
      .attr('height', this.config.rulerWidth);

    const containerAxisHorizontal = this.config.svg.append('rect')
        .attr('width', this.config.svgDx - this.config.margin.left)
        .attr('height', this.config.rulerWidth)
        .attr('y', 64)
        .attr('x', 0)
        .attr('class', 'axis')
        .attr('fill', '#222')
        .on('mouseover', () => this.setCursor('default'))
        .on('mouseleave', () => this.setCursor(this.config.cursor.cursor))
      .append('svg:title')
        .text(() => 'units (' + this.file.activeEffect.grid.xUnit.name + ')');


    const lineX = this.config.svg.append('rect')
        .attr('width',  this.config.svgDx - this.config.margin.left)
        .attr('height', 1)
        .attr('x', 0)
        .attr('y', 64 + this.config.rulerWidth)
        .attr('fill', '#999');


    this.config.xAxis = d3
        .axisBottom(this.nodeService.scale.scaleX)
        .ticks(10)
        .tickSize(this.config.rulerWidth)
        .tickFormat((e: any) => {
          if (Math.floor(e) !== e) { return; }
          return e;
        });

    const xAxisSVG = this.config.svg.append('g')
        .attr('class', 'clipPathXAxis')
        .attr('clip-path', 'url(#clipXaxis)')
        .attr('transform', 'translate(0, 64)');

    this.config.xAxisSmallTicks = d3
        .axisTop(this.nodeService.scale.scaleX)
        .ticks(100)
        .tickSize(4)
        .tickFormat((e: any) => e);

    this.config.xAxisBottomSmallTicks = xAxisSVG.append('g')
        .attr('class', 'smallAxisX')
        .attr('transform', 'translate(0, ' + this.config.rulerWidth + ')')
        .call(this.config.xAxisSmallTicks);

    this.config.xAxisBottom = xAxisSVG.append('g')
        .attr('class', 'axisBottom largeTicks')
        // .attr('transform', 'translate(0, 0)')
        .call(this.config.xAxis);

    this.config.svg.selectAll('.axisBottom text')
        .attr('y', 2)
        .attr('x', 4)
        .style('text-anchor', 'start');

    this.config.svg.selectAll('.axis .tick:first-child').remove();

    this.drawAllGuides(this.file.activeEffect.grid.guides);
  }



  drawCursorPosition(x: number, y: number) {
    if (this.config.rulerVisible) {
      const yValue = y - (window.innerHeight * (this.file.configuration.horizontalScreenDivision / 100));

      if (!d3.select('.cursorPos').empty()) {
        this.config.svg.selectAll('.cursorPos').remove();
      }

      if (x > this.config.margin.left && x < window.innerWidth - this.config.margin.right && yValue > 64 && y < window.innerHeight - 60) {

        const posXaxis = this.config.svg.append('rect')
            .attr('class', 'cursorPos')
            .attr('x', x - this.config.margin.left - 0.5)
            .attr('width', 1)
            .attr('y', 64)
            .attr('height', this.config.rulerWidth);

        if (!this.audioVisualization()) {
           const posYaxis = this.config.svg.append('rect')
              .attr('class', 'cursorPos')
              .attr('x', this.config.chartDx)
              .attr('width', this.config.rulerWidth)
              .attr('y', yValue - 0.5)
              .attr('height', 1);
        }

        this.config.svg.selectAll('.cursorPos')
            .style('fill', '#00FFFF')
            .attr('pointer-events', 'none');

      }
    }
  }

  rulerFunctions(e: MouseEvent) {

    this.drawCursorPosition(e.clientX, e.clientY);

    if (this.config.mouseDown.y !== null && this.config.mouseDown.x !== null) {

      let yRef = { y1: this.config.margin.offsetTop + 65, y2: window.innerHeight - 40 };
      let yRef2 = { y1: this.config.margin.offsetTop + 65, y2: this.config.margin.offsetTop + 65 + this.config.rulerWidth };

      let xRef = { x1: this.config.margin.left, x2: window.innerWidth - this.config.margin.right };
      let xRef2 = { x1: window.innerWidth - this.config.rulerWidth, x2: window.innerWidth };

      if (this.config.mouseDown.x > xRef2.x1 &&
          this.config.mouseDown.x < xRef2.x2 &&
          this.config.mouseDown.y > yRef.y1 &&
          this.config.mouseDown.y < yRef.y2) {

        this.config.drawRulerAxis = 'y';
        this.drawGuide(this.config.drawRulerAxis, e.clientX - this.config.margin.left, e.clientY - this.config.margin.offsetTop, 'guide');
        this.dataService.updatePoints(
          this.nodeService.scale.scaleX.invert(e.clientX - this.config.margin.left), null, null, null);

        this.config.newGuide = true;
      } else if (this.config.mouseDown.x > xRef.x1 &&
                 this.config.mouseDown.x < xRef.x2 &&
                 this.config.mouseDown.y > yRef2.y1 &&
                 this.config.mouseDown.y < yRef2.y2) {

          this.config.drawRulerAxis = 'x';
          this.drawGuide(this.config.drawRulerAxis, e.clientX - this.config.margin.left, e.clientY - this.config.margin.offsetTop, 'guide');
          this.dataService.updatePoints(null, this.nodeService.scale.scaleY.invert(e.clientY - this.config.margin.top), null, null);
          this.config.newGuide = true;
      }
    }

  }

  drawGuide(axis: string, x: number, y: number, cl: string) {
    this.config.svg.selectAll('.' + cl + '.new').remove();

    if (axis === 'x') {
      const rulerXaxis = this.config.svg.append('rect')
          .attr('class', cl + ' new')
          .attr('x', 0)
          .attr('width', this.config.svgDx - this.config.margin.left)
          .attr('y', y - 0.25)
          .attr('height', 0.5);

    } else if (axis === 'y') {
      const rulerYaxis = this.config.svg.append('rect')
          .attr('class', cl + ' new')
          .attr('x', x - 0.25)
          .attr('width', 0.5)
          .attr('y', 0)
          .attr('height', this.config.svgDy - 20);
    }

    this.config.svg.selectAll('.' + cl + '.new')
        .style('fill', '#999')
        .style('stroke', 'transparent')
        .style('stroke-width', 1);
        // .style('shape-rendering', 'crispEdges');
        // .attr('stroke-dasharray', '4, 3')
        // .attr('stroke-linecap', 'square')
        // .attr('stroke-width', 0.1);
  }

  drawAllGuides(guides: Array<object>) {

    if (guides) {
      this.config.svg.selectAll('.guidesSvg').remove();

      if (this.file.activeEffect.grid.guidesVisible && this.config.rulerVisible) {

        const guidesSvg = this.config.svg.append('g')
          .attr('id', 'guidesSvg')
          .attr('class', 'guidesSvg');

        // tslint:disable-next-line: variable-name
        const dragGuide = d3
          .drag()
          .on('start', (event: any, d: { id: string; axis: string; coords: { x: number; y: number; }; }) => {
              if (!this.file.activeEffect.grid.lockGuides && (this.config.cursor.slug === 'sel' || this.config.cursor.slug === 'dsel')) {
                d3.select('#id_' + d.id).classed('selected', true);
                if (d.axis === 'x') {
                  this.dataService
                   .updatePoints(null, this.nodeService.scale.scaleY.invert(event.y - this.config.margin.top), null, null);
                } else if (d.axis === 'y') {
                  this.dataService.updatePoints(
                    this.nodeService.scale.scaleX.invert(event.x - this.config.rulerWidth), null, null, null);
                }
              }
          })
          .on('drag', (event: any, d: { id: string; axis: string; coords: { x: number; y: number; }; }) => {
              if (!this.file.activeEffect.grid.lockGuides && (this.config.cursor.slug === 'sel' || this.config.cursor.slug === 'dsel')) {
                if (d.axis === 'x' && event.y < this.config.svgDy - 22) {
                  d3.select('#id_' + d.id).attr('y', event.y);
                  this.dataService.updatePoints(
                    null, this.nodeService.scale.scaleY.invert(event.y - this.config.margin.top + this.config.rulerWidth), null, null);
                } else if (d.axis === 'y' && event.x > this.config.margin.left && event.x < this.config.svgDx - this.config.rulerWidth) {
                  d3.select('#id_' + d.id).attr('x', event.x);
                  this.dataService.updatePoints(
                    this.nodeService.scale.scaleX.invert(event.x - this.config.margin.left), null, null, null);
                }
              }
          })
          .on('end', (event: any, d: { id: string; axis: string; coords: { x: number; y: number; }; }) => {
            if (!this.file.activeEffect.grid.lockGuides && (this.config.cursor.slug === 'sel' || this.config.cursor.slug === 'dsel')) {
              d3.select('#id_' + d.id).classed('selected', false);
              this.file.activeEffect.grid.guides.filter(g => g.id === d.id)[0].coords = {
                x: this.nodeService.scale.scaleX.invert(event.x - this.config.margin.left),
                y: this.nodeService.scale.scaleY.invert(event.y - this.config.margin.top)
              };
            }
          });

        guidesSvg.selectAll('rect.guide')
          .data(guides)
          .enter()
          .append('rect')
          .attr('id', (d: { id: string; }) => 'id_' + d.id)
          .attr('class', 'guide')
          .attr('x', (d: { axis: string; coords: { x: any; }; }) =>
            d.axis === 'x' ? 0 : this.nodeService.scale.scaleX(d.coords.x))
          .attr('width', (d: { axis: string; coords: { x: any; }; }) =>
            d.axis === 'x' ? this.config.chartDx : 1)
          .attr('y', (d: { axis: string; coords: { y: any; }; }) => {
            return d.axis === 'y' ? 64 + this.config.rulerWidth : this.nodeService.scale.scaleY(d.coords.y) + this.config.margin.top;
          })
          .attr('height', (d: { axis: string; coords: { y: any; }; }) => {
            return d.axis === 'y' ? this.config.svgDy - 86 - this.config.rulerWidth : 1;
          })
          .style('stroke', 'transparent')
          .style('stroke-width', 3)
          .style('shape-rendering', 'crispEdges')
          .on('click', (event: any, d: { id: string; axis: string; coords: { x: number; y: number; }; }) => {
            if (this.config.cursor.slug === 'pen') {
              d3.select('#id_' + d.id).attr('pointer-events', 'none');
            } else if (this.config.cursor.slug === 'sel' || this.config.cursor.slug === 'dsel') {
              d3.select('#id_' + d.id).attr('pointer-events', 'all');

              if (!this.file.activeEffect.grid.lockGuides && d3.select('#id_' + d.id).classed('selected') === false) {
                if (event.shiftKey) {
                  this.dataService.addSelectedElement(d.id);
                } else if (d.axis === 'x') {
                  this.dataService
                    .selectElement(d.id, null, this.nodeService.scale.scaleY.invert(event.y - this.config.margin.top), null, null);
                } else if (d.axis === 'y') {
                  this.dataService
                    .selectElement(d.id, this.nodeService.scale.scaleX.invert(event.x - this.config.margin.left), null, null, null);
                }
                if (!event.shiftKey) { d3.selectAll('.guide.selected').classed('selected', false); }
                d3.select('#id_' + d.id).classed('selected', true);
              }
            }
          })
          .call(dragGuide);
      }
    }
  }

  selectGuides(guides: Array<string>) {
    for (const guide of guides) {
      d3.select('#id_' + guide).classed('selected', true);
    }
  }

  deselectGuides() {
    d3.selectAll('.guide').classed('selected', false);
  }

  updateGuide(points: any, selection: any) {
    const guide = this.file.activeEffect.grid.guides.filter(g => g.id === selection[0])[0];
    if (guide) {
      if (guide.axis === 'x') {
        guide.coords.y = points.y;
        d3.select('#id_' + guide.id).attr('y', this.nodeService.scale.scaleY(guide.coords.y) + this.config.margin.top);
      } else if (guide.axis === 'y') {
        guide.coords.x = points.x;
        d3.select('#id_' + guide.id).attr('x', this.nodeService.scale.scaleX(guide.coords.x) + this.config.margin.left);
      }
    }
  }




  scaleActiveEffectFromTorqueToPosition(scaleFactor: number, offset: number) {
    this.nodeService.selectAll();
    this.nodeService.scalePath(this.nodeService.selectedPaths, 1, scaleFactor, 0, offset);
    this.nodeService.deselectAll();
  }

  setActiveCollectionEffect(details: { effect: Details, collection: Collection }) {
    this.file.activeCollectionEffect = details.effect;
    this.file.activeCollection = details.collection;
  }

  updateEffectType() {
    // console.log(this.file.activeEffect);
    if (this.file.activeEffect.type === EffectType.velocity || this.file.activeEffect.type === EffectType.pneumatic) {
      this.file.activeEffect.grid.yUnit = new Unit('%', 100);
      if (this.file.activeEffect.grid.xUnit.name !== 'ms' && this.file.activeEffect.grid.xUnit.name !== 'sec') {
        this.file.activeEffect.grid.xUnit = new Unit('ms', 1000);
      }
      this.file.activeEffect.range.start = 0;
      this.file.activeEffect.range.end = 1000;

    } else if (this.file.activeEffect.type === EffectType.midi || this.file.activeEffect.type === EffectType.midiNote) {
      this.file.activeEffect = this.file.activeEffect.type === EffectType.midi ? new Midi(this.file.activeEffect.id, this.file.activeEffect.type) : new MidiNote(this.file.activeEffect.id, this.file.activeEffect.type);
      this.file.activeEffect.grid.yUnit = new Unit('v', 128);
      this.file.activeEffect.range_y.start = 0;
      this.file.activeEffect.range_y.end = 128;

    } else {
      if (this.file.activeEffect.grid.xUnit.name === 'ms' || this.file.activeEffect.grid.xUnit.name === 'sec') {
        this.file.activeEffect.grid.xUnit = new Unit('deg', 360);
        this.file.activeEffect.range.start = 0;
        this.file.activeEffect.range.end = 360;
      }
      this.file.activeEffect.grid.yUnit = new Unit('%', 100);
    }

    this.file.activeEffect.range_y.start = (this.file.activeEffect.type === EffectType.torque || this.file.activeEffect.type === EffectType.velocity) ? -100 : 0;
    this.file.activeEffect.range_y.end = (this.file.activeEffect.type === EffectType.midi || this.file.activeEffect.type === EffectType.midiNote ? 128 : 100);

    // console.log(this.config.editBounds);

    if (this.config.editBounds.yMin < 0 && (this.file.activeEffect.type === EffectType.position || this.file.activeEffect.type === EffectType.pneumatic)) {
      this.scaleActiveEffectFromTorqueToPosition(0.5, 100);
    } else if (this.config.editBounds.yMin >= 0 && (this.file.activeEffect.type === EffectType.velocity || this.file.activeEffect.type === EffectType.torque)) {
      this.scaleActiveEffectFromTorqueToPosition(2, 100);
    }
    const effectColor = this.file.configuration.colors.filter(c => c.type === this.file.activeEffect.type)[0];
    if (effectColor) {
      this.dataService.color = effectColor.hash[0];
    }

    this.updateConfigActiveFile(this.file.configuration);

    this.updateActiveEffect(this.file);
  }



  setInputFieldsActive(active: boolean) {
    this.nodeService.inputFieldsActive = active;
  }







}
