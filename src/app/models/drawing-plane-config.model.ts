import { Cursor } from './tool.model';
import { Node, Coords } from './node.model';
import { Unit } from './effect.model';


export class Margin {
  top: number = 0;
  right: number = 0;
  bottom: number = 0;
  left: number = 0;
  offsetTop: number = 0;
}

export class EditBounds {
  xMin: number | undefined;
  xMax: number | undefined;
  yMin: number | undefined;
  yMax: number | undefined;

  constructor(xMin: number, xMax: number, yMin: number, yMax: number) {
    this.xMin = xMin;
    this.xMax = xMax;
    this.yMin = yMin;
    this.yMax = yMax;
  }
}

export class Clipboard {
  empty = true;
  guides: Array<string> = [];
}

export class Slider {
  min: number = 0;
  max: number = 100;
}

export class ReferenceBox {
  inner = new Slider();
  outer = new Slider();
  ratio = 0.8;
}

export class SliderDrawplane {
  inner = new Slider();
  outer = new Slider();
  ratio = 0.8;
  dragPos?: number;
}


export class DrawingPlaneConfig {
  rulerVisible = true;
  rulerWidth = 13;
  drawRulerAxis: string = '';
  cursor = new Cursor();
  mouseDown = new Coords();
  mouseMove = new Coords();
  newNode: Node | undefined;
  newNodePlaced = false;

  svg: any;
  nodesSVG: any;
  forceNodeSVG: any;
  pathSVG: any;
  planeSVG: any;
  cpSVG: any;
  blocksSVG: any;
  midiSVG: any;
  bbox: any;
  gridSVG: any;
  svgDx = innerWidth;
  svgDy = innerHeight;
  margin = new Margin();
  chartDx: number = 0;
  chartDy: number = 0;
  toolbarOffset = 45;
  motorControlToolbarOffset = 45;
  editBounds = new EditBounds(0, 360, 0, 100);
  yScale: any;
  xScale: any;
  zoom: any;
  zoomable = false;
  xAxis: any;
  xAxisBottom: any;
  xAxisSmallTicks: any;
  xAxisBottomSmallTicks: any;
  yAxisSVG: any;
  clipboard = new Clipboard();
  selectionStartPoint: any = null;
  activeSelection = false;
  containerBox: any;
  startPosBox: any;
  dragStartPoint: any;
  grabPos: any;
  boxRef: any;
  aspectRatioX = 1;
  aspectRatioY = 1;
  offsetYnodes = 0;
  offsetXnodes = 0;
  closestCoords = new Coords();
  newControlPoints: Array<Node> = [];
  slider = new ReferenceBox();
  sliderDrawplane = new SliderDrawplane();
  sliderDrawplaneVertical = new SliderDrawplane();
  timeCursor = 0;
  playing = false;
  activeInput: boolean = false;
  tmpEffect: any = null;
  newGuide = false;
  dataLoggingEnabled = false;
  xAxisOptions = [ new Unit('deg', 360), new Unit('rad', 2*Math.PI) ];
  xAxisOptions_velocity = [ new Unit('ms', 1000), new Unit('sec', 1) ];
  yAxisOptions = [ new Unit('%', 100) ];
  yAxisOptions_velocity = [ new Unit('%', 100), new Unit('deg', 360) ];
  yAxisOptions_pressure = [ new Unit('%', 100), new Unit('BIN', 1) ];
  
}



