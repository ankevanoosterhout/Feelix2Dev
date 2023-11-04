import { Bounds } from "./tensorflow.model";


export class TensorFlowConfig {

  dataSVG: any = null;
  scaleY: any;
  baseScaleX: any;
  scaleX: any;
  zoom: any;
  transform: any;

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

}
