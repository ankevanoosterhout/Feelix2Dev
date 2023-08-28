import { DOCUMENT } from '@angular/common';
import { Injectable, Inject } from '@angular/core';
import * as d3 from 'd3';
import { MidiDataBlock, MidiBlockVisualization, MidiNote } from '../models/audio.model';
import { v4 as uuid } from 'uuid';
import { Range, Size } from '../models/effect.model';
import { EffectType } from '../models/configuration.model';

@Injectable()
export class MidiDataService {


  public selectedBlocks: Array<string> = [];


  createNewDataBlock(x: number, y: number, width: number, name: string) {
      // create a new default effect for each block that is created
      const newMidiEffect = new MidiNote(uuid(), EffectType.midiNote);
      newMidiEffect.range = new Range(0,  width);
      newMidiEffect.name = name + '-CC-' + y;
      //attach effect to block
      const newBlock = new MidiDataBlock(newMidiEffect.id + '-db', newMidiEffect);
      newBlock.vis = new MidiBlockVisualization(x, y, width);

      // return blockdata to save in activeFile.data
      return newBlock;
  }


  selectBlock(id: string, shift = false) {
    if (this.selectedBlocks.indexOf(id) < 0) {
      if (!shift) {
        this.selectedBlocks = [];
      }
      this.selectedBlocks.push(id);
    }
  }

  deselectBlock(id: string) {
    const index = this.selectedBlocks.indexOf(id);
    if (index > -1) {
      this.selectedBlocks.splice(index, 1);
    }
  }

  deselectAllBlocks() {
    this.selectedBlocks = [];
  }


  isSelected(id: string) {
    const index = this.selectedBlocks.indexOf(id);
    return index > -1 ? true : false;
  }

  getSize(blockList: Array<MidiDataBlock>): Size {
    if (blockList && blockList.length > 0) {
      let xMin = blockList[0].vis.x, xMax = blockList[0].vis.x + blockList[0].vis.width;
      let size = new Size(xMin,xMax,0,128);

      for (const block of blockList) {
        if (block.vis.x < xMin) { xMin = block.vis.x };
        if (block.vis.x + block.vis.width > xMax) { xMax = block.vis.x + block.vis.width };
      }
      size.width = xMax - xMin;
      size.x = xMin;
      size.top = 128;
      size.bottom = 0;

      return size;

    } else {
      let size = new Size(0,0,0,128);
      size.top = 128;
      size.bottom = 0;

      return size;
    }
  }

}
