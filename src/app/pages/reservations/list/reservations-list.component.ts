import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { WindowService } from 'services/window.service';
import { ReservationsListTableDataSource } from './reservations-list-table-data-source';

@Component({
  selector: 'app-reservations-list',
  template: `<app-table [dataSource]="reservationsListTableDataSource"></app-table>w`,
  providers: [ReservationsListTableDataSource],
})
export class ReservationsListComponent {
  // eslint-disable-next-line no-useless-constructor
  public constructor(
    public reservationsListTableDataSource: ReservationsListTableDataSource
  ) {}

}
