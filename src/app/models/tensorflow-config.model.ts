import { Bounds } from "./tensorflow.model";


export class TensorFlowConfig {

  dataSVG: any = null;
  scaleY: any;
  baseScaleX: any;
  scaleX: any;
  zoom: any;
  transform: any;
  zoomable = true;

  bounds = new Bounds();

  sidebarColumnWidth = [150, 150];

  width = window.innerWidth - 250 - (this.sidebarColumnWidth[0] + this.sidebarColumnWidth[1]);
  height = window.innerHeight - 340;

  margin = 30;

  xAxis: any;
  xAxisBottom: any;
  yAxis: any;

  updateHorizontalScreenDivision = false;
  updateVerticalScreenDivision = false;
  resultWindowVisible = true;

  horizontalScreenDivision = 220;
  verticalScreenDivision = 70;

  activeStep = 0;

  steps = [
    { id: 0, name: 'model' },
    { id: 1, name: 'data' },
    { id: 2, name: 'train' },
    { id: 3, name: 'deploy' }
  ];


  page = 'tensorflow';
  status = 'Ready';
  progress = 0;


  // shift = false;

}
