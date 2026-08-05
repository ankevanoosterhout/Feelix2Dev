import { Injectable } from '@angular/core';
import { Toolbar } from '../models/data.model';
import { Subject } from 'rxjs';
import { DrawingPlaneConfig } from '../models/drawing-plane-config.model';
import { Color } from '../models/colors.model';

@Injectable()
export class DataService {

  toolbar = new Toolbar();
  color: string | undefined;
  color2: string | undefined;
  public dataObservable = new Subject<Toolbar>();
  // public colorObservable = new Subject<any>();
  public config: DrawingPlaneConfig | undefined;

  private box: { 
    left: number | undefined; 
    top: number | undefined; 
    width: number | undefined; 
    height: number | undefined; 
  } = { 
    left: undefined, 
    top: undefined, 
    width: undefined, 
    height: undefined 
  };


  public selection: Array<string> = [];
  public forceStepSelection: Array<string> = [];

  constructor() {
    this.saveToolbar();
  }

  get(): Toolbar {
    return this.toolbar;
  }

  setColor(color: string, color2: string) {
    this.color = color;
    this.color2 = color2;
    // this.colorObservable.next(this.color);
  }

  updateReferencePoint(point: any) {
    this.toolbar.referencePoint = point;
    if (this.toolbar.boxSelection) {
      if (this.box) {
        this.calculateInputBoxes(this.box);
      }
    }
    this.saveToolbar();
  }

  updatePoints(x: number | undefined, y: number | undefined, w: number | undefined, h: number | undefined) {
    this.toolbar.points.x = x ? this.toolbar.points.x = Math.round(x * 100) / 100 : undefined;
    this.toolbar.points.y = y ? this.toolbar.points.y = Math.round(y * 100) / 100 : undefined;
    this.toolbar.points.w = w ? this.toolbar.points.w = Math.round(w * 100) / 100 : undefined;
    this.toolbar.points.h = h ? this.toolbar.points.h = Math.round(h * 100) / 100 : undefined;

    if (w === undefined && h === undefined) {
      this.toolbar.boxSelection = false;
    } else {
      this.toolbar.boxSelection = true;
    }
    this.saveToolbar();
  }

  setBoxSelection(state: boolean) {
    this.toolbar.boxSelection = state;
  }
  activeBoxSelection(): boolean {
    return this.toolbar.boxSelection;
  }

  setPreserveAspectRatio(bind: boolean) {
    this.toolbar.linked = bind;
    this.saveToolbar();
  }

  getPreserveAspectRatio(): boolean {
    return this.toolbar.linked;
  }

  reset() {
    this.toolbar = new Toolbar();
    this.saveToolbar();
  }

  activeSelection(): Array<string> {
    return this.selection;
  }

  isSelected(id: string): any {
    if (this.selection.filter(s => s === id).length > 0) {
      return true;
    } else {
      return false;
    }
  }

  saveToolbar() {
    this.dataObservable.next(this.toolbar);
  }

  selectElement(id: string, x: number | undefined, y: number | undefined, w: number | undefined, h: number | undefined) {
    this.selection = [ id ];
    this.updatePoints(x, y, w, h);
    this.saveToolbar();
  }

  addSelectedElement(id: string) {
    if (this.selection.indexOf(id) < 0) {
      this.selection.push(id);
    }
    if (this.selection.length > 1) {
      this.updatePoints(undefined, undefined, undefined, undefined);
    }
    this.saveToolbar();
  }

  addSelectedElements(elements: Array<string>) {
    if (elements.length > 0) {
      if (this.selection.length > 0) {
        this.selection = this.selection.concat(elements);
      } else {
        this.selection = elements;
      }
      if (this.selection.length > 1) {
        this.updatePoints(undefined, undefined, undefined, undefined);
      }
      this.saveToolbar();
    }
  }

  addSelectedForceStep(id: string, shift = false) {
    if (!shift) { this.forceStepSelection = []; }
    if (this.forceStepSelection.indexOf(id) < 0) {
      this.forceStepSelection.push(id);
    }
    this.saveToolbar();
  }

  deselectAll() {
    this.selection = [];
    this.toolbar.points.x = undefined;
    this.toolbar.points.y = undefined;
    this.toolbar.points.w = undefined;
    this.toolbar.points.h = undefined;
    this.toolbar.boxSelection = false;
    this.forceStepSelection = [];
    this.saveToolbar();
  }



  calculateInputBoxes(box: { left: number | undefined; top: number | undefined; width: number | undefined; height: number | undefined}) {

    this.box = box;

    this.toolbar.points.w = box.width;
    this.toolbar.points.h = box.height;

    if (this.toolbar.referencePoint.name === 'center' && box.left && box.width) {
      this.toolbar.points.x = box.left + (box.width / 2);
      if (box.top && box.height) { this.toolbar.points.y = box.top - (box.height / 2); }

    } else if (this.toolbar.referencePoint.id >= 0 && this.toolbar.referencePoint.id <= 2) {
      if (box.top) { this.toolbar.points.y = box.top; }

      if (this.toolbar.referencePoint.name === 'n' && box.left && box.width) {
        this.toolbar.points.x = box.left + (box.width / 2);
      } else if (this.toolbar.referencePoint.name === 'nw' && box.left) {
        this.toolbar.points.x = box.left;
      } else if (this.toolbar.referencePoint.name === 'ne' && box.left && box.width) {
        this.toolbar.points.x = box.left + box.width;
      }

    } else if (this.toolbar.referencePoint.name === 'e' && box.left && box.width) {
      this.toolbar.points.x = box.left + box.width;
      if (box.top && box.height) { this.toolbar.points.y = box.top - (box.height / 2); }

    } else if (this.toolbar.referencePoint.name === 'w') {
      this.toolbar.points.x = box.left;
      if (box.top && box.height) {  this.toolbar.points.y = box.top - (box.height / 2); }

    } else if (this.toolbar.referencePoint.id >= 6 && this.toolbar.referencePoint.id <= 8) {
      if (box.top && box.height) { this.toolbar.points.y = box.top - box.height; }

      if (this.toolbar.referencePoint.name === 's' && box.left && box.width) {
        this.toolbar.points.x = box.left + box.width / 2;
      } else if (this.toolbar.referencePoint.name === 'sw') {
        this.toolbar.points.x = box.left;
      } else if (this.toolbar.referencePoint.name === 'se' && box.left && box.width) {
        this.toolbar.points.x = box.left + box.width;
      }

      if (box.top === undefined) { this.toolbar.points.y = undefined; }
    }
    this.updatePoints(this.toolbar.points.x, this.toolbar.points.y, this.toolbar.points.w, this.toolbar.points.h);
  }

}
