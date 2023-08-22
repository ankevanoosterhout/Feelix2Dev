import { DOCUMENT } from '@angular/common';
import { Injectable, Inject } from '@angular/core';
import * as d3 from 'd3';
import { MidiDataBlock, MidiBlockVisualization } from '../models/audio.model';
import { v4 as uuid } from 'uuid';

@Injectable()
export class MidiDataService {


  public data: Array<MidiDataBlock> = [];


  createNewDataBlock(x: number, y: number, width: number) {

    if (this.data.length === 0 || this.data.length > 0 && this.data.filter(d => d.vis.x === x && d.vis.y === y)) {
      const newBlock = new MidiDataBlock(uuid());
      newBlock.vis = new MidiBlockVisualization(x, y, width);
      console.log(newBlock);
      this.data.push(newBlock);
    }

  }



}
