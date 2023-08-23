import { DOCUMENT } from '@angular/common';
import { Injectable, Inject } from '@angular/core';
import * as d3 from 'd3';
import { MidiDataBlock, MidiBlockVisualization, MidiChannel } from '../models/audio.model';
import { v4 as uuid } from 'uuid';
import { Range } from '../models/effect.model';
import { EffectType } from '../models/configuration.model';

@Injectable()
export class MidiDataService {


  public selectedBlocks: Array<string> = [];


  createNewDataBlock(x: number, y: number, width: number) {
      // create a new default effect for each block that is created
      const newMidiEffect = new MidiChannel(uuid(), EffectType.midi);
      newMidiEffect.range = new Range(0,  width);
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

}
