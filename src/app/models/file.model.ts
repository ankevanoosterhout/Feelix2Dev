import { Configuration } from './configuration.model';
import { Collection } from './collection.model';
import { Details } from './effect.model';
import { Model, DataSet } from './tensorflow.model';

export class Dates {
  created = new Date().getTime();
  modified = null;
  changed = false;

  constructor(date: number = null) {
    if (date) {
      this.created = date;
    }
  }
}


export class File {
  // tslint:disable-next-line:variable-name
  _id: string;
  name = 'untitled';
  path = '';
  softwareVersion = '3.1.2';
  overwrite = true;
  isActive = false;
  date = new Dates();
  configuration = new Configuration();
  collections: Array<Collection> = [];
  effects: Array<any> = [];
  activeEffect: any = null;
  activeCollection: Collection = null;
  activeCollectionEffect: Details = null;
  tensorflow: {
    models: Array<Model>;
    data: Array<DataSet>;
  }


  constructor(name: string, id: string, status: boolean) {
    this.name = name;
    this._id = id;
    this.isActive = status;
  }
}

export class Folder {
  id: string;
  name: string;
  date = new Dates();
  content: Array<any> = [];
  selected = false;
  parent = null;
  level = 0;

  constructor(id:string, name: string) {
    this.name = name;
    this.id = id;
  }
};
