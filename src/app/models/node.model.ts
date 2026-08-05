export class Coords {
  x?: number;
  y?: number;
  t?: number;

  constructor(x: number | undefined = undefined, y: number | undefined = undefined, t: number | undefined = undefined) {
    this.x = x;
    this.y = y;
    this.t = t;
  }
}

export class Node {
  id: string = '';
  cp?: string = '';
  type: string = '';
  pos = new Coords();
  angle = new Coords();
  path: string = '';

  constructor(id: string, path: string, cp: string | undefined, type: string, pos: Coords, angle: Coords | undefined) {
    this.id = id;
    this.path = path;
    this.cp = cp;
    this.type = type;
    this.pos = pos;
    if (angle !== undefined) this.angle = angle;
  }
}

export class Box {
  left?: number;
  right?: number;
  width?: number;
  height?: number;
  top?: number;
  bottom?: number;
}

export class Path {
  id: string = '';
  nodes: Array<Node> = [];
  box = new Box();
  lock = false;

  constructor(id: string) {
    this.id = id;
    this.nodes = [];
  }
}

export class Steps {
  section: number = 0;
  steps: Array<Node> = [];
}

export class Scale {
  scaleX?: any;
  scaleY?: any;
}

export class EditBounds {
  xMin = 0;
  xMax = 360;
  yMin = 0;
  yMax = 100;
}


export class Rectangle {
  id?: string;
  left: number = 0;
  top: number = 0;
  bottom: number = 0;
  right: number = 0; 
  width: number = 0;
  height: number = 0; 
  tYb?: number; 
  tYt?: number 
}