import { Configuration } from './configuration.model';
import { Collection } from './collection.model';
import { Details } from './effect.model';
import { Model, DataSet } from './tensorflow.model';

export class Dates {
  created: number;
  modified = new Date().getTime();
  changed = false;

  constructor(date: number = new Date().getTime()) {
    this.created = date;
  }
}


export class File {
  // tslint:disable-next-line:variable-name
  _id?: string;
  name?: string;
  path?: string;
  softwareVersion = '3.1.4';
  overwrite = true;
  isActive?: boolean;
  date = new Dates(new Date().getTime());
  configuration = new Configuration();
  collections: Array<Collection> = [];
  effects: Array<any> = [];
  activeEffect: any = null;
  activeCollection?: Collection;
  activeCollectionEffect?: Details;
  tensorflow? = {
    models: Array<Model>,
    data: Array<DataSet>
  }


  constructor(name: string | undefined, id: string | undefined, status: boolean | undefined) {
    this.name = name;
    this._id = id;
    this.isActive = status;
  }
}

export class Folder {
  id: string;
  name: string;
  date = new Dates(new Date().getTime());
  content: Array<any> = [];
  selected = false;
  parent?: string;
  level = 0;

  constructor(id:string, name: string) {
    this.name = name;
    this.id = id;
  }
};
