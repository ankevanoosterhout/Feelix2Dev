export enum MidiDataType {
  notes = 0,
  CC01 = 1,
  clock = 2
};


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

  constructor(id: string) {
    this.id = id;
  }
}
