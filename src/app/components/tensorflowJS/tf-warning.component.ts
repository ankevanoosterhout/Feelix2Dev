import { Component, Input } from '@angular/core';



@Component({
  selector: 'app-tf-warning',
  standalone: false,
  template: `
    <div id="warning" *ngIf="this._show">
        <div class="close" (click)="showWarning(false)"><div></div></div>
        <p class="title"*ngIf="this._title">{{ this._title }}</p>
        <p class="body" *ngIf="this._body">{{ this._body }}</p>
    </div>`,
  styles: [` 

    #warning {
        position: fixed;
        top:0;
        right:0;
        margin: 10px;
        background: rgba(50,50,50,0.7);
        border: 1px solid #1c1c1c;
        padding: 5px 10px;
        min-width: 150px;
    }

    p.body {
        color: #ccc;
        font-size: 12px;
    }

    p.title {
        color: #fff;
        font-size: 13px;
    }

    .close {
        position: absolute;
        top:0;
        right:0;
        margin: 5px;
    }

    `]
})
export class TfWarningComponent {

    public _title = null;
    public _body = null;
    public _show = true;


    showWarning(show: boolean) {
        this._show = show;
    }
    
    @Input()
        set title(title: string) {
        this._title = (title && title.trim()) || '';
    }

    @Input()
        set body(body: string) {
        this._body = (body && body.trim()) || '';
    }

    @Input()
        set show(show: boolean) {
        this._show = show;
    }

}