import { EffectType } from "./configuration.model";
import { Effect } from "./effect.model";

export enum MidiDataType {
  notes = 0,
  CC01 = 1,
  clock = 2
};


export class Midi_config {
  // This is a class for configuring midi messages.
  // The standard format of a midi message goes as such:
  // Status Bytes:
  //  Binary -> (1000-1111)(0000-1111) or Hex -> (8-F)(0-F) or Decimal -> (8-15)(0-15)
  //  Data Bytes: Binary ->
  //                Data 1 -> (00000000 - 01111111) Usually is the Note Number, Control Change, Program change etc, dependent on the Status Byte
  //                Data 2 -> (00000000 - 01111111) Usually is the Velocity of the defined message This can be controlled independent to the Note Number and would usually be concidered as aftertouch in this case
  //                                                 Aftertouch, the change of the notes velocity after it is pressed.
  //              Hex ->
  //                Data 1 -> (00 - 7F)
  //                Data 2 -> (00 - 7F)
  //              Decimal ->
  //                Data 1 -> (00 - 127)
  //                Data 2 -> (00 - 127)
  channel: number = null;
  message_type: number = null;
  data1: number = null;

  constructor(message_type:number, channel: number, data1: number){
    this.channel = channel;
    this.message_type = message_type;
    this.data1 = data1
  }
}


export class Midi extends Effect {
  dataType: MidiDataType = MidiDataType.notes;
  type: EffectType = EffectType.midi;
  data: Array<MidiDataBlock> = [];

  // midi_config = new Midi_config(176,0,0);
}

export class MidiChannel extends Effect {
  type: EffectType = EffectType.midi;
  dataType: MidiDataType = MidiDataType.CC01;
  midi_config = new Midi_config(176,0,0);
}


export const MidiDataTypeLabelMapping: Record<MidiDataType, string> = {
  [MidiDataType.notes]: 'Notes',
  [MidiDataType.CC01]: 'CC 01',
  [MidiDataType.clock]: 'Clock',
};


export class MidiBlockVisualization {
  x: number;
  y: number;
  width: number;

  constructor(x: number, y: number, width: number){
    this.x = x;
    this.y = y;
    this.width = width;
  }
}


export class MidiDataBlock {
  id: string;
  vis: MidiBlockVisualization;
  effect: MidiChannel;


  constructor(id: string, effect: any) {
    this.id = id;
    this.effect = effect;
  }
}
