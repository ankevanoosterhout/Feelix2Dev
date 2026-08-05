export class Points {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  cc?: number;
}

export class ReferencePoint {
  name = 'center';
  id = 4;
}

export class Toolbar {
  referencePoint = new ReferencePoint();
  linked = true;
  boxSelection = false;
  points = new Points();
}

