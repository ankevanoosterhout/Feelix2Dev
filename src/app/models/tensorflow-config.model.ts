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

  // sidebarColumnWidth = [170, 170];

  width = window.innerWidth - 320;
  height = window.innerHeight - 100;


  margin = 50;

  xAxis: any;
  xAxisBottom: any;
  yAxis: any;

  updateHorizontalScreenDivision = false;
  updateVerticalScreenDivision = false;
  resultWindowVisible = true;

  // horizontalScreenDivision = 220;
  // verticalScreenDivision = 70;

  activeStep = -1;

  steps = [
    { id: -1, name: 'default' },
    { id: 0, name: 'model' },
    { id: 1, name: 'data' },
    { id: 2, name: 'train' },
    { id: 3, name: 'deploy' }
  ];


  page = 'tensorflow';
  status = 'Ready';
  progress = 0;
  stopRecordingCounter = 0;

  // shift = false;

}
